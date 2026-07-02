export type BodyType = "hatchback" | "sedan" | "SUV" | "MUV";

export type FuelType = "petrol" | "diesel" | "CNG" | "hybrid" | "electric";

export type Transmission = "manual" | "automatic";

export interface Car {
  id: string;
  make: string;
  model: string;
  variant: string;
  price: number; // in INR
  bodyType: BodyType;
  fuel: FuelType;
  transmission: Transmission;
  seating: 5 | 7;
  mileage: number; // km/l (or km/kWh-equivalent for EVs)
  safetyRating: number; // 0-5
  bootSpace: number; // in litres
  useCaseTags: string[];
}

export type WhoFor = "solo" | "couple" | "small-family" | "big-family";

export type Usage = "city" | "highway" | "mixed" | "off-road";

export type Priority = "safety" | "mileage" | "space" | "performance" | "budget";

export interface BuyerProfile {
  budget: number; // in INR
  whoFor: WhoFor;
  usage: Usage;
  fuelPreference: FuelType | "any";
  priority: Priority;
}

export interface ScoredCar {
  car: Car;
  score: number; // 0-100
  reason: string;
}
