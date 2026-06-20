# Testing & CI

TDD throughout (per [`../../IMPLEMENTATION_STANDARDS.md`](../../IMPLEMENTATION_STANDARDS.md)):
write the failing test first, then the minimum code to pass.

## How we test AI without flakiness

AI calls are non-deterministic, so we never assert on a live model in unit
tests. Instead:

- Wrap each AI touchpoint behind a small interface (e.g. `PersonaScorer`,
  `StrategyGenerator`) that returns a Pydantic model.
- In tests, inject a fake that returns a fixture response. We assert on our
  **validation, invariants, and wiring**, not on model creativity.
- One or two **live** smoke tests, marked and excluded from CI, to eyeball real
  output during the hackathon.

Detailed test layers come once the data model + API are pinned (post frontend
flow). For now, two rules hold: deterministic parts (rules/math) get exact-value
tests; AI parts get tested on **our** validation/invariants via a faked client,
never on live model output.

## CI gate

GitHub Actions on every PR: `ruff check` + `pytest` (live-marked tests
excluded). **Must be green before merging to `main`** (branch protection). CI
workflow + the tests themselves are written during the hackathon — this plan
defines the matrix, not the code.
