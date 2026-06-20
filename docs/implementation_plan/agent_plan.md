# Agent Strategy Build Plan

How we build the **Never Ghosted** strategy engine, broken into testable pillars.

Builds on the existing design — don't re-derive it:
[`information_flow.md`](information_flow.md) (8-step pipeline + AI-vs-deterministic
split), [`../metadata.md`](../metadata.md) (entities, persona vector, objection
taxonomy, persuasion levers, goal arc, evidence chips).

## Decisions (locked)

- **Engine A = workhorse.** Single agent + tools → structured strategy. Cheap, fast.
- **Engine B = showpiece.** Orchestrated multi-call (`extract→persona→strategy→
  critic`) behind a "compare" click. Demos visible agent flow. Not a quality bet
  yet — research says don't model personas as separate debating agents, and the
  weighted persona vector already does that synthesis in one step.
- **Stack stays Python/FastAPI + OpenAI credits.** No voltagent (would force
  TS/Node). The **append-only strategy log IS the trace** — emit each phase as an
  event, render the flow in the frontend from that JSON. One artifact also covers
  the "Revise this strategy" feedback loop and the "append, never overwrite"
  thought-history requirement.
- **This sprint: engine only, everything mocked.** No DB, no frontend (frontend =
  the two Subframe screens as spec, no code yet). Mock data + 6 golden prospects +
  static knowledge JSON.

Not building (and when to revisit):

- `skipped:` voltagent, live review/competitor ingestion agents, real DB,
  frontend, persona-debate-as-quality-lever.
- `add when:` real outcome data exists, or the single agent measurably falls short.

## Pillars

Each ships independently with a failing-test-first per `IMPLEMENTATION_STANDARDS.md`.

| # | Pillar | AI? | What ships | Test that fails if broken | Cost |
|---|--------|-----|-----------|---------------------------|------|
| **P0** | Mock data + golden set | no | Pydantic entities (mandatory core from `metadata.md` + enough enrichment for chips), 6 golden prospects (research summary), static knowledge JSON (reviews / Trustpilot / competitor price) | fixtures load + schema-validate; 6 prospects present | free |
| **P1** | Deterministic core | **no** | ghost/engagement score, benchmark aggregation, goal-arc advance/reset, revision-validation checks — pure functions | unit test each; benchmark number never model-sourced | free |
| **P2** | **Engine A** (single agent + tools) | yes | tools = `persona_score`, `benchmark_lookup`, `knowledge_lookup`; output = `Strategy{buyer_profile, current_goal, steps[]}` structured Pydantic | golden-set → schema valid + invariants (below) | strong model, 1 call + tool loop |
| **P3** | Append-only log + revise loop | partial | per-deal event store (jsonl/table); generate / regenerate / revise = **append** events; revise gated by P1 checks. = trace + reasoning + Subframe screen-2 feedback | append never overwrites; unsupported revise rejected | cheap |
| **P4** | **Engine B** (orchestration, flagged) | yes | `extract→persona→strategy→critic`, reuses P1/P2 tools, emits each phase as flow events into the same log → renderable. Runs only on "compare" | same `Strategy` schema as A; per-deal token cap enforced | capped, on-demand |
| **P5** | Cost guardrails | no | token/turn budget wrapper, model tiering (cheap = extract/persona, strong = strategy/critic), persona cache keyed on touches | budget exceeded → degrade, not crash | free |
| **P6** | *(stretch)* LLM-judge | yes | judge A vs B on golden set | — | on-demand |

**Spine = P0 → P1 → P2 → P3** — alone a demoable product: generate strategy, see
reasoning, revise it. **P4 + P5** add the wow + safety. **P6** stretch.

## Implementation status (2026-06-20)

Built on branch `feat/strategy-engine` (isolated git worktree, off `main`). All
pillars TDD, failing test first. **33 tests passing.** Engine code under `engine/`
(separate from the backend tab's `backend/`), tests under `tests/`.

| # | Pillar | Status | Modules | Tests |
|---|--------|--------|---------|-------|
| P0 | Mock data + golden set | ✅ done | `models.py`, `golden.py`, `knowledge.py`, `data/knowledge.json` | 6 |
| P1 | Deterministic core | ✅ done | `deterministic.py` | 10 |
| P2 | Engine A (single agent + tools) | ✅ done | `strategy.py`, `llm.py` | 7 |
| P3 | Append-only log + revise loop | ✅ done | `log.py` | 3 |
| P5 | Cost guardrails | ✅ done | `budget.py` | 4 |
| P4 | Engine B (orchestration, flagged) | ✅ done | `engine_b.py` | 3 |
| P6 | LLM-judge (A vs B) | ⬜ stretch, not started | — | — |

What the tests pin down (the guarantees):

- benchmark / deal_history chips must carry a deterministically-computed `ref` →
  the model can reference a stat by id but cannot invent the number.
- no step's goal exceeds `current_goal` → trust-before-ask ordering holds.
- every generate / regenerate / revise **appends**; a rejected revision is still
  recorded and the strategy is left unchanged.
- budget overrun raises `BudgetExceeded`, partial flow captured — no silent
  token blowup.

The LLM is **injected** everywhere (a `prompt -> Strategy` callable), so the
contract and guardrails are tested with stubs. The real provider call
(`engine/llm.py`, OpenAI structured outputs) is gated on `OPENAI_API_KEY` and the
`openai` package — it never runs in tests/CI.

## Run it

```bash
cd reonic-engine
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest -q          # 33 passing
# live Engine A (needs key + provider):
.venv/bin/pip install openai
export OPENAI_API_KEY=...
# generate_strategy(prospect, llm=openai_llm(), allowed_refs=...)
```

## Next steps (pick up here)

1. **P6 LLM-judge** — score Engine A vs Engine B on the 6 golden prospects
   (quality rubric: grounded chips, goal-arc fit, lowest-pressure action). Needs
   real model calls.
2. **Wire benchmarks for real** — P1 `compute_benchmark` exists but golden deals
   have no won/lost outcome pool yet; build `allowed_refs` from actual aggregates
   so Engine A/B chips resolve against live ids.
3. **`__main__` demo** — end-to-end run on a golden prospect with a stub LLM (no
   key) to eyeball Strategy + flow JSON for the frontend.
4. **API seam** — thin FastAPI endpoints (`POST /strategy`, `POST /strategy/revise`,
   `GET /strategy/log`) once the frontend contract lands. Deferred per scope.
5. **Refresh the stale "deferred — wait for frontend" notes** in the sibling plan
   docs (`data_model.md`, `strategy_contract.md`) — left untouched on purpose.

## Invariants (trust + cost guarantees, enforced everywhere)

- `benchmark` / `deal_history` chip numbers come from **P1 deterministic**
  computation. The model may reference a benchmark by id, never invent the number.
- Strategy generation reads `current_goal`; never proposes commitment before the
  gap is framed (trust → urgency → close → ask).
- Every generate / regenerate / revise **appends** an event; nothing overwrites.

## Cost cap levers (do all, all cheap)

- Deterministic steps (P1) stay non-AI — free.
- Cheap model for extraction/persona; strong model only for final strategy + critic.
- Hard caps: max agent turns, max tokens/deal, per-deal budget → degrade past it.
- Cache persona scoring per deal; re-run only on new touches/notes.
- Run expensive Engine B only on explicit "compare", not every generate.
