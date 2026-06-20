# Implementation Plan (skeleton)

Notes toward building the **Never Ghosted** coach. High-level only — the real
build plan follows the frontend flow and the open AI decision (see
[`../../ARCHITECTURE.md`](../../ARCHITECTURE.md)). Treat everything here as
provisional raw material, not commitments.

## Documents

| Doc | What it is | Status |
|-----|-----------|--------|
| [`information_flow.md`](information_flow.md) | rough pipeline, AI vs deterministic split | provisional |
| [`synthetic_data.md`](synthetic_data.md) | mock dataset idea (no real CRM) | provisional |
| [`strategy_contract.md`](strategy_contract.md) | strategy output shape + API sketch | wait for frontend flow |
| [`data_model.md`](data_model.md) | Pydantic entity sketch | wait for frontend flow |
| [`testing_ci.md`](testing_ci.md) | TDD intent + CI gate | provisional |

## Principles (these hold regardless)

- TDD: failing test first. CI green before merging to `main`.
- AI for language/judgment; deterministic math for facts the installer must
  trust (any benchmark/score).
- Minimal deps, add only when needed.
