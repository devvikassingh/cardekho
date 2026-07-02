import type { BuyerProfile, Car, FuelType, ScoredCar, Usage, WhoFor } from "./types";

type Dimension = "budgetFit" | "bodyFit" | "usageFit" | "fuelFit" | "safety";

const BASE_WEIGHTS: Record<Dimension, number> = {
  budgetFit: 0.2,
  bodyFit: 0.2,
  usageFit: 0.2,
  fuelFit: 0.2,
  safety: 0.2,
};

// Each buyer priority speaks most directly to one scoring dimension; that
// dimension gets extra weight before the weights are renormalized to 1.
const PRIORITY_TO_DIMENSION: Record<BuyerProfile["priority"], Dimension> = {
  budget: "budgetFit",
  space: "bodyFit",
  performance: "usageFit",
  mileage: "fuelFit",
  safety: "safety",
};

const PRIORITY_BOOST = 0.2;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getWeights(priority: BuyerProfile["priority"]): Record<Dimension, number> {
  const weights = { ...BASE_WEIGHTS };
  weights[PRIORITY_TO_DIMENSION[priority]] += PRIORITY_BOOST;

  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  (Object.keys(weights) as Dimension[]).forEach((dim) => {
    weights[dim] /= total;
  });

  return weights;
}

function scoreBudgetFit(car: Car, profile: BuyerProfile): number {
  const ratio = car.price / profile.budget;
  if (ratio <= 0.7) return 100;
  const overage = ratio - 0.7; // up to 0.3 for a car priced right at budget
  return clamp(100 - overage * (50 / 0.3), 50, 100);
}

function scoreBodyFit(car: Car, profile: BuyerProfile): number {
  let score = 60;

  switch (profile.whoFor) {
    case "solo":
      score = car.seating === 5 ? 90 : 60;
      if (car.bodyType === "hatchback") score += 10;
      else if (car.bodyType === "sedan") score += 5;
      if (car.bodyType === "MUV") score -= 10;
      break;
    case "couple":
      score = car.seating === 5 ? 88 : 65;
      if (car.bodyType === "sedan" || car.bodyType === "SUV") score += 8;
      if (car.bootSpace >= 350) score += 4;
      break;
    case "small-family":
      score = car.seating === 7 ? 88 : 82;
      if (car.bodyType === "sedan" || car.bodyType === "SUV") score += 8;
      if (car.bootSpace >= 350) score += 4;
      break;
    case "big-family":
      score = car.seating === 7 ? 95 : 60;
      if (car.bodyType === "SUV" || car.bodyType === "MUV") score += 10;
      if (car.bootSpace >= 350) score += 5;
      break;
  }

  return clamp(score, 0, 100);
}

function normalizedEfficiency(car: Car): number {
  if (car.fuel === "electric") {
    // car.mileage holds full-charge range (km) for EVs, a different scale than km/l
    return clamp(((car.mileage - 150) / (450 - 150)) * 100, 0, 100);
  }
  return clamp(((car.mileage - 10) / (28 - 10)) * 100, 0, 100);
}

function cityUsageScore(car: Car): number {
  const efficiency = normalizedEfficiency(car);
  const maneuverability =
    car.bodyType === "hatchback" ? 100 : car.bodyType === "sedan" ? 85 : car.bodyType === "SUV" ? 65 : 50;
  return efficiency * 0.65 + maneuverability * 0.35;
}

function highwayUsageScore(car: Car): number {
  const safety = (car.safetyRating / 5) * 100;
  const size = car.bodyType === "SUV" || car.bodyType === "MUV" ? 100 : car.bodyType === "sedan" ? 75 : 45;
  const bootBonus = clamp((car.bootSpace / 550) * 100, 0, 100);
  return safety * 0.45 + size * 0.35 + bootBonus * 0.2;
}

function offRoadUsageScore(car: Car): number {
  const bodyBonus =
    car.bodyType === "SUV" ? 100 : car.bodyType === "MUV" ? 80 : car.bodyType === "sedan" ? 30 : 20;
  const safety = (car.safetyRating / 5) * 100;
  return bodyBonus * 0.7 + safety * 0.3;
}

function scoreUsageFit(car: Car, profile: BuyerProfile): number {
  switch (profile.usage) {
    case "city":
      return cityUsageScore(car);
    case "highway":
      return highwayUsageScore(car);
    case "off-road":
      return offRoadUsageScore(car);
    case "mixed":
      return (cityUsageScore(car) + highwayUsageScore(car)) / 2;
  }
}

const RELATED_FUELS: Partial<Record<FuelType, FuelType[]>> = {
  petrol: ["hybrid", "CNG"],
  diesel: ["hybrid"],
  CNG: ["petrol"],
  hybrid: ["petrol", "electric"],
  electric: ["hybrid"],
};

function scoreFuelFit(car: Car, profile: BuyerProfile): number {
  let score: number;

  if (profile.fuelPreference === "any") {
    score = 70;
  } else if (car.fuel === profile.fuelPreference) {
    score = 100;
  } else {
    score = RELATED_FUELS[profile.fuelPreference]?.includes(car.fuel) ? 60 : 35;
  }

  const isEfficientFuel = car.fuel === "CNG" || car.fuel === "hybrid" || car.fuel === "electric";
  if (profile.usage === "city" && isEfficientFuel) {
    score = Math.min(100, score + 10);
  }

  return clamp(score, 0, 100);
}

function scoreSafety(car: Car): number {
  return (car.safetyRating / 5) * 100;
}

function scoreCar(car: Car, profile: BuyerProfile): { score: number; components: Record<Dimension, number> } {
  const weights = getWeights(profile.priority);
  const components: Record<Dimension, number> = {
    budgetFit: scoreBudgetFit(car, profile),
    bodyFit: scoreBodyFit(car, profile),
    usageFit: scoreUsageFit(car, profile),
    fuelFit: scoreFuelFit(car, profile),
    safety: scoreSafety(car),
  };

  const total = (Object.keys(components) as Dimension[]).reduce(
    (sum, dim) => sum + components[dim] * weights[dim],
    0
  );

  return { score: Math.round(clamp(total, 0, 100)), components };
}

function formatLakhs(amount: number): string {
  return `₹${(amount / 100000).toFixed(1)}L`;
}

function describeBudget(car: Car, budget: number): string {
  const headroom = budget - car.price;
  const closeness = headroom > budget * 0.2 ? "well within" : "close to";
  return `priced at ${formatLakhs(car.price)}, ${closeness} your ${formatLakhs(budget)} budget`;
}

const WHO_FOR_LABEL: Record<WhoFor, string> = {
  solo: "solo daily driving",
  couple: "comfortable trips for two",
  "small-family": "a small family",
  "big-family": "a big family",
};

function describeUsage(car: Car, usage: Usage): string {
  if (usage === "city") {
    return car.fuel === "electric"
      ? `${car.mileage}km range suits city driving`
      : `${car.mileage}km/l mileage keeps city running costs low`;
  }
  if (usage === "highway") {
    return `${car.safetyRating}/5 safety and a ${car.bootSpace}L boot suit long highway drives`;
  }
  if (usage === "off-road") {
    return `${car.bodyType} build handles rough terrain confidently`;
  }
  return "balances mileage and comfort for mixed city/highway use";
}

function describeFuel(car: Car, profile: BuyerProfile): string {
  if (profile.fuelPreference === "any" || car.fuel === profile.fuelPreference) {
    return `runs on ${car.fuel}`;
  }
  return `runs on ${car.fuel}, a close alternative to your ${profile.fuelPreference} preference`;
}

function buildReason(car: Car, profile: BuyerProfile, components: Record<Dimension, number>): string {
  const fragments: Record<Dimension, string> = {
    budgetFit: describeBudget(car, profile.budget),
    bodyFit: `${car.seating}-seat ${car.bodyType} fits ${WHO_FOR_LABEL[profile.whoFor]}`,
    usageFit: describeUsage(car, profile.usage),
    fuelFit: describeFuel(car, profile),
    safety: `${car.safetyRating}/5 safety rating`,
  };

  const priorityDimension = PRIORITY_TO_DIMENSION[profile.priority];
  const remainingRanked = (Object.keys(components) as Dimension[])
    .filter((dim) => dim !== priorityDimension)
    .sort((a, b) => components[b] - components[a]);

  const orderedDimensions = [priorityDimension, ...remainingRanked].slice(0, 3);

  return `${car.make} ${car.model} ${car.variant} — ${orderedDimensions.map((dim) => fragments[dim]).join("; ")}.`;
}

export function recommend(cars: Car[], profile: BuyerProfile, limit = 5): ScoredCar[] {
  return cars
    .filter((car) => car.price <= profile.budget)
    .map((car) => {
      const { score, components } = scoreCar(car, profile);
      return {
        car,
        score,
        reason: buildReason(car, profile, components),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
