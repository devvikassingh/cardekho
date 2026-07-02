import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { recommend } from "./scoring";
import type { BuyerProfile, Car } from "./types";

const cars = JSON.parse(readFileSync(path.join(process.cwd(), "data/cars.json"), "utf8")) as Car[];

test("a big-family highway profile ranks a 7-seater first", () => {
  const profile: BuyerProfile = {
    budget: 2500000,
    whoFor: "big-family",
    usage: "highway",
    fuelPreference: "any",
    priority: "space",
  };

  const [top] = recommend(cars, profile, 1);

  assert.ok(top, "expected at least one recommendation");
  assert.equal(top.car.seating, 7);
});

test("recommend() never returns a car priced above the buyer's budget", () => {
  const budgets = [500000, 900000, 1200000, 1800000, 2500000];

  for (const budget of budgets) {
    const profile: BuyerProfile = {
      budget,
      whoFor: "solo",
      usage: "mixed",
      fuelPreference: "any",
      priority: "budget",
    };

    const results = recommend(cars, profile, cars.length);

    for (const { car } of results) {
      assert.ok(
        car.price <= budget,
        `${car.make} ${car.model} (₹${car.price}) exceeds budget ₹${budget}`
      );
    }
  }
});
