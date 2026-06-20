# Synthetic Data

No real CRM (Q&A #2). We invent a realistic dataset so the engine and the demo
have something to chew on. Two jobs: a **seed generator** and a **simulated
outcome stream**.

## Seed generator (`data/generator.py`)

Produces a coherent org with leads at different stages, so benchmarks have a
real won/lost population and the lead list shows hot/warm/cold variety.

- 1 `Org` (pick `small` so one installer owns ~20 leads — matches the real
  pain: 20 customers, ~10% conversion).
- 1–3 `Installer`s with location, service radius, varied sophistication.
- ~20 active `Customer` + `Quote` + `Deal` across stages, plus a back-catalog of
  ~100 **terminal** deals (won/lost/ghosted) so benchmarks are meaningful.
- Per active deal: a plausible `Touch`/`Note`/`Signal` history that implies a
  persona blend and 1–2 objections (e.g. heavy email opens + "asked about
  monthly payment" note → budget_sensitive + roi_investor, objection
  `upfront_cost`).
- Products vary (solar, solar+battery, heat_pump, +ev_charger) to exercise the
  product angle catalog.

Output: rows written to Postgres via the repository (optional JSON snapshot for
a reproducible demo). Use a **seeded RNG** (random number generator with a fixed
seed) so every run produces the same dataset — reproducible demos, and tests can
assert exact numbers.

## Simulated outcomes (`data/simulator.py`)

For the demo, drives the feedback loop without real users.

- Given an accepted strategy, emit `Outcome` events probabilistically: a step
  matched well to persona/objection has a higher success probability; a cold
  deal has a higher `ghosted` chance.
- Probabilities are explicit constants (tunable, testable) — not the LLM.
- Lets us demo: accept steps → outcomes arrive → temperature/goal update →
  (stretch) adaptive re-plan.

## Why deterministic

Both modules use a seeded RNG and explicit probability tables. This keeps the
demo reproducible and lets the benchmark and engagement tests assert exact
numbers. The AI parts read this data; they don't generate it.
