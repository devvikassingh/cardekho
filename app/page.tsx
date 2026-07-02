"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BuyerProfile, FuelType, Priority, Usage, WhoFor } from "@/lib/types";

const STEP_TITLES = ["Budget", "Who it's for", "Usage", "Fuel", "Priority"] as const;

const MIN_BUDGET = 500000;
const MAX_BUDGET = 2500000;
const BUDGET_STEP = 50000;

type UiFuelPreference = FuelType | "any";

const SHORTLIST_STORAGE_KEY = "cardekho:shortlist";

const WHO_FOR_OPTIONS: { value: WhoFor; label: string; description: string }[] = [
  { value: "solo", label: "Solo", description: "Just for me" },
  { value: "couple", label: "Couple", description: "Me and my partner" },
  { value: "small-family", label: "Small family", description: "3 to 4 people" },
  { value: "big-family", label: "Big family", description: "5 or more people" },
];

const USAGE_OPTIONS: { value: Usage; label: string; description: string }[] = [
  { value: "city", label: "City", description: "Mostly short trips and traffic" },
  { value: "highway", label: "Highway", description: "Mostly long-distance driving" },
  { value: "mixed", label: "Mixed", description: "A bit of both" },
];

const FUEL_OPTIONS: { value: UiFuelPreference; label: string }[] = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "EV" },
  { value: "any", label: "No preference" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; description: string }[] = [
  { value: "safety", label: "Safety", description: "Crash rating matters most" },
  { value: "mileage", label: "Mileage", description: "Keep running costs low" },
  { value: "space", label: "Space", description: "Room for people and luggage" },
  { value: "budget", label: "Price", description: "Spend as little as possible" },
];

function formatLakhs(amount: number): string {
  return `₹${(amount / 100000).toFixed(1)}L`;
}

export default function Home() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState(1200000);
  const [whoFor, setWhoFor] = useState<WhoFor | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [fuelPreference, setFuelPreference] = useState<UiFuelPreference | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue =
    step === 0 ||
    (step === 1 && whoFor !== null) ||
    (step === 2 && usage !== null) ||
    (step === 3 && fuelPreference !== null) ||
    (step === 4 && priority !== null);

  const isLastStep = step === STEP_TITLES.length - 1;

  function goBack() {
    setError(null);
    setStep((current) => Math.max(0, current - 1));
  }

  function goNext() {
    setStep((current) => Math.min(STEP_TITLES.length - 1, current + 1));
  }

  async function handleFinish() {
    if (!whoFor || !usage || !fuelPreference || !priority) return;

    setSubmitting(true);
    setError(null);

    const profile: BuyerProfile = { budget, whoFor, usage, fuelPreference, priority };

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error("Couldn't build your shortlist. Please try again.");
      }

      const shortlist = await response.json();
      sessionStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(shortlist));
      router.push("/results");
    } catch {
      setError("Couldn't build your shortlist. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-xl">
        <ProgressBar step={step} total={STEP_TITLES.length} label={STEP_TITLES[step]} />

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          {step === 0 && <BudgetStep budget={budget} onChange={setBudget} />}
          {step === 1 && <WhoForStep value={whoFor} onChange={setWhoFor} />}
          {step === 2 && <UsageStep value={usage} onChange={setUsage} />}
          {step === 3 && <FuelStep value={fuelPreference} onChange={setFuelPreference} />}
          {step === 4 && <PriorityStep value={priority} onChange={setPriority} />}

          {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="text-sm font-medium text-zinc-500 disabled:opacity-0"
            >
              Go back
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={handleFinish}
                disabled={!canContinue || submitting}
                className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
              >
                {submitting ? "Finding your cars…" : "See my shortlist"}
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={!canContinue}
                className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ProgressBar({ step, total, label }: { step: number; total: number; label: string }) {
  const percent = ((step + 1) / total) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
        <span>
          Step {step + 1} of {total} — {label}
        </span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-50"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function OptionCard({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
        selected
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
          : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-zinc-600"
      }`}
    >
      <p className="text-sm font-medium">{label}</p>
      {description && (
        <p className={`mt-0.5 text-xs ${selected ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-500"}`}>
          {description}
        </p>
      )}
    </button>
  );
}

function BudgetStep({ budget, onChange }: { budget: number; onChange: (value: number) => void }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">What&apos;s your budget?</h2>
      <p className="mt-1 text-sm text-zinc-500">Drag the slider to set how much you&apos;d like to spend.</p>

      <p className="mt-8 text-center text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
        {formatLakhs(budget)}
      </p>

      <input
        type="range"
        min={MIN_BUDGET}
        max={MAX_BUDGET}
        step={BUDGET_STEP}
        value={budget}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-6 w-full accent-zinc-900 dark:accent-zinc-50"
      />

      <div className="mt-2 flex justify-between text-xs text-zinc-400">
        <span>₹5L</span>
        <span>₹25L</span>
      </div>
    </div>
  );
}

function WhoForStep({ value, onChange }: { value: WhoFor | null; onChange: (value: WhoFor) => void }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Who&apos;s the car for?</h2>
      <p className="mt-1 text-sm text-zinc-500">This helps us match seating and space.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {WHO_FOR_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            description={option.description}
            selected={value === option.value}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
    </div>
  );
}

function UsageStep({ value, onChange }: { value: Usage | null; onChange: (value: Usage) => void }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Where will you drive it most?</h2>
      <p className="mt-1 text-sm text-zinc-500">We&apos;ll weigh mileage and highway comfort accordingly.</p>

      <div className="mt-6 flex flex-col gap-3">
        {USAGE_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            description={option.description}
            selected={value === option.value}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
    </div>
  );
}

function FuelStep({
  value,
  onChange,
}: {
  value: UiFuelPreference | null;
  onChange: (value: UiFuelPreference) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Any fuel preference?</h2>
      <p className="mt-1 text-sm text-zinc-500">Pick what you&apos;d rather fill up or plug in.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {FUEL_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            selected={value === option.value}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
    </div>
  );
}

function PriorityStep({ value, onChange }: { value: Priority | null; onChange: (value: Priority) => void }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">What matters most to you?</h2>
      <p className="mt-1 text-sm text-zinc-500">We&apos;ll prioritize this when ranking your shortlist.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {PRIORITY_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            description={option.description}
            selected={value === option.value}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
    </div>
  );
}
