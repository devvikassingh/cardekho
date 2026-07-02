import type { BuyerProfile, Car, FuelType, Priority, Usage, WhoFor } from "@/lib/types";
import { recommend } from "@/lib/scoring";
import carsData from "@/data/cars.json";

const WHO_FOR_VALUES: WhoFor[] = ["solo", "couple", "small-family", "big-family"];
const USAGE_VALUES: Usage[] = ["city", "highway", "mixed", "off-road"];
const FUEL_VALUES: FuelType[] = ["petrol", "diesel", "CNG", "hybrid", "electric"];
const PRIORITY_VALUES: Priority[] = ["safety", "mileage", "space", "performance", "budget"];

function isBuyerProfile(value: unknown): value is BuyerProfile {
  if (typeof value !== "object" || value === null) return false;
  const profile = value as Record<string, unknown>;

  return (
    typeof profile.budget === "number" &&
    Number.isFinite(profile.budget) &&
    profile.budget > 0 &&
    WHO_FOR_VALUES.includes(profile.whoFor as WhoFor) &&
    USAGE_VALUES.includes(profile.usage as Usage) &&
    (profile.fuelPreference === "any" || FUEL_VALUES.includes(profile.fuelPreference as FuelType)) &&
    PRIORITY_VALUES.includes(profile.priority as Priority)
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isBuyerProfile(body)) {
    return Response.json(
      { error: "Request body must be a valid BuyerProfile." },
      { status: 400 }
    );
  }

  const results = recommend(carsData as Car[], body);

  return Response.json(results);
}
