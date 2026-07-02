# CarDekho — Car Recommendation Engine

A guided tool that takes a confused car buyer from *"I don't know what to buy"* to a
confident, explained shortlist. Instead of another filterable table of specs, it asks a
handful of plain-language questions and returns a ranked list of cars — each with a reason
explaining **why** it's a good fit.

**Live demo:** [YOUR_VERCEL_URL]
**Screen recording:** [YOUR_LOOM_URL]

---

## Run it locally

```bash
git clone [YOUR_REPO_URL]
cd cardekho
npm install
npm run dev
```

Open http://localhost:3000. No environment variables, no database setup — the dataset is a
seed JSON file, so it runs immediately.

---

## What I built and why

The brief is deliberately vague, and the key word in it is **confused**. A confused buyer
doesn't know they want "a 1.5L turbo petrol with 6 airbags" — so a search-and-filter grid
fails them, because filtering assumes you already know what you're looking for.

So I built the opposite: a **guided recommendation flow**.

1. A 5-question wizard elicits what actually matters — budget, who the car is for, city vs
   highway driving, fuel preference, and the single thing they care about most.
2. A scoring engine on the backend ranks every car against that profile.
3. The results page returns a tight shortlist, each car carrying a plain-English reason
   ("Fits your ₹8L budget with room to spare, seats 5, and 24 km/l is great for city
   running").

That reason string is the core of the product. It's what turns a list of options into
*confidence* — the buyer understands the recommendation instead of having to trust it.

### What I deliberately cut

To stay inside the 2–3 hour time-box, I cut scope hard and on purpose:

- **User accounts / auth** — irrelevant to the core "help me decide" job.
- **A real database** — a seed JSON file is enough to demonstrate the engine; a DB would be
  ceremony, not value, at this stage.
- **Live data / scraping** — a curated ~25-car dataset covers the spread of body types,
  fuels, and price bands needed to make recommendations meaningful.
- **Side-by-side comparison view** — genuinely useful, but the ranked-with-reasons shortlist
  already satisfies the brief. This is first on my "next 4 hours" list.

I'd rather ship a tight, opinionated MVP that works end-to-end than a half-finished feature
pile.

---

## Tech stack and why

- **Next.js (App Router) + TypeScript** — frontend and backend in one deployable unit. The
  scoring logic lives in an API route, so there's no separate server to run or deploy. This
  minimizes friction: one `npm run dev` locally, one-click deploy to Vercel.
- **TypeScript** — shared types (`Car`, `BuyerProfile`, `ScoredCar`) across the client/server
  boundary catch mismatches for free.
- **Tailwind CSS** — fast, consistent styling without hand-rolling a design system in a
  time-boxed build.
- **Vercel** — zero-config deploy for Next.js; "live and working" was never at risk.

I optimized the stack choice for **shipping speed**, since a deployed, working app beats an
architecturally elegant one that ran out of time.

### Architecture

```
app/
  page.tsx              # 5-step questionnaire (client)
  results/page.tsx      # ranked shortlist with reasons
  api/recommend/route.ts# POST: BuyerProfile in -> ScoredCar[] out
lib/
  types.ts              # shared domain types
  scoring.ts            # the recommendation engine (pure, testable)
data/
  cars.json             # seed dataset (~25 Indian-market cars)
```

The **scoring engine** (`lib/scoring.ts`) is the non-trivial backend. It's a weighted-scoring
model, not ML — a deliberate choice. For this problem, weighted scoring is the *right* tool:
it's fully explainable (every point a car earns traces to a reason, which is exactly what lets
me generate the reason string), fast, and easy to tune. The pipeline: hard-filter to budget →
score each car on five dimensions (budget fit, body/seating fit, usage fit, fuel fit, safety)
→ boost the weight of whichever dimension the buyer said matters most → combine to a 0–100
score → attach a human-readable reason.

---

## AI tools vs. manual work

I used **Claude Code** throughout.

**Delegated to AI:**
- Generating the seed dataset (realistic Indian-market cars, prices, specs).
- UI scaffolding and Tailwind boilerplate for the wizard and results cards.
- The Next.js API route plumbing.

**Owned manually:**
- **All product decisions** — the recommendation-flow thesis, the five questions, what to cut.
- **The scoring model** — the dimensions, weights, and the priority-boost logic. When the AI
  reached for a more complex approach here, I overrode it and kept it simple, because a
  weighted model I can explain and defend beats a black box I can't. (This is visible in the
  recording.)

**Where the tools helped most:** eliminating boilerplate and generating plausible data
instantly — that's where the hours would otherwise disappear.

**Where they got in the way:** [FILL IN YOUR REAL FRICTION — e.g. "Claude Code initially
over-engineered the scoring function with an unnecessary normalization step; I caught it on
review and simplified it," or "it hallucinated an import path I had to correct," or "it
generated a car spec with an implausible value I had to fix." Be specific and honest — this
is what they most want to see.]

My loop was consistent: break the work into scoped tasks, let the tool draft, then read and
course-correct before accepting — rather than blindly taking output.

---

## If I had another 4 hours

- **Side-by-side comparison** of the shortlisted cars (the top cut item).
- **Real user reviews + sentiment** surfaced per car, not just spec-based scoring.
- **A proper database** (Postgres/SQLite) to replace the seed JSON and allow a larger catalog.
- **An "explain this pick in depth" action** — an LLM call that expands the one-line reason
  into a short, personalized rationale.
- **A power-user escape hatch** — filters for buyers who *do* know what they want.
- **Tests across more profile scenarios** and edge cases (no cars under budget, etc.).

---

## Tests

A minimal test on the scoring engine asserts the two invariants that matter most: no car over
budget is ever recommended, and a big-family highway profile surfaces a 7-seater first. Run
with:

```bash
npm test
```
