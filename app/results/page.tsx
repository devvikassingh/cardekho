"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { Car, ScoredCar } from "@/lib/types";

const SHORTLIST_STORAGE_KEY = "cardekho:shortlist";

function subscribe() {
  return () => {};
}

function getSnapshot(): string | null {
  return sessionStorage.getItem(SHORTLIST_STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

function parseShortlist(raw: string | null): ScoredCar[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ScoredCar[];
  } catch {
    return [];
  }
}

function formatLakhs(amount: number): string {
  return `₹${(amount / 100000).toFixed(1)}L`;
}

function describeMileage(car: Car): string {
  return car.fuel === "electric" ? `${car.mileage} km range` : `${car.mileage} km/l`;
}

interface ScoreTier {
  label: string;
  fillClass: string;
  trackClass: string;
}

function getScoreTier(score: number): ScoreTier {
  if (score >= 80) {
    return {
      label: "Great match",
      fillClass: "bg-emerald-500 dark:bg-emerald-400",
      trackClass: "bg-emerald-100 dark:bg-emerald-950",
    };
  }
  if (score >= 60) {
    return {
      label: "Good match",
      fillClass: "bg-amber-500 dark:bg-amber-400",
      trackClass: "bg-amber-100 dark:bg-amber-950",
    };
  }
  return {
    label: "Fair match",
    fillClass: "bg-zinc-400 dark:bg-zinc-500",
    trackClass: "bg-zinc-200 dark:bg-zinc-800",
  };
}

function SafetyStars({ rating }: { rating: number }) {
  const filled = Math.round(rating);

  return (
    <span aria-label={`${rating} out of 5 safety rating`} className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={index < filled ? "text-amber-400" : "text-zinc-300 dark:text-zinc-700"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function ScoreMeter({ score }: { score: number }) {
  const tier = getScoreTier(score);

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
        <span>
          Match score · <span className="text-zinc-700 dark:text-zinc-300">{tier.label}</span>
        </span>
        <span className="text-zinc-700 dark:text-zinc-300">{score}/100</span>
      </div>
      <div className={`mt-1.5 h-2 w-full overflow-hidden rounded-full ${tier.trackClass}`}>
        <div
          className={`h-full rounded-full ${tier.fillClass} transition-[width] duration-300`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function ShortlistCard({ car, score, reason }: ScoredCar) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {car.make} {car.model}
          </p>
          <p className="text-sm text-zinc-500">{car.variant}</p>
        </div>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{formatLakhs(car.price)}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
        <span className="capitalize">{car.fuel}</span>
        <span>{car.seating} seats</span>
        <span>{describeMileage(car)}</span>
        <SafetyStars rating={car.safetyRating} />
      </div>

      <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Why this fits you</p>
        <p className="mt-1 text-base font-medium leading-snug text-emerald-950 dark:text-emerald-50">{reason}</p>
      </div>

      <div className="mt-5">
        <ScoreMeter score={score} />
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const shortlist = parseShortlist(raw);

  if (shortlist.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4 dark:bg-black">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">We couldn&apos;t find your shortlist.</p>
        <Link
          href="/"
          className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
        >
          Start the questionnaire
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Your shortlist</h1>
          <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
            Start over
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          {shortlist.map((entry) => (
            <ShortlistCard key={entry.car.id} {...entry} />
          ))}
        </div>
      </div>
    </main>
  );
}
