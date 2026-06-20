# Information Flow

> **Provisional.** Orchestration (single LLM calls vs an agent) is **open**, and
> the curated-knowledge input isn't shown here yet. What survives any decision:
> the **AI-vs-deterministic split** below. Treat the rest as a sketch.

End-to-end: raw inputs → buyer understanding → strategy → execution → feedback.
The key design rule: **AI handles language and judgment; math stays
deterministic and testable.**

## Pipeline

```
                 ┌─────────────── inputs ───────────────┐
   Customer · Quote · Touches · Notes · Signals · Org/Installer
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                    ▼
   [1] Signal extraction (AI)          [2] Engagement / ghost score (rules)
   notes & transcripts → structured     signal timestamps → temperature,
   signals + objections                 ghost risk
            │                                    │
            └─────────────────┬──────────────────┘
                              ▼
              [3] Persona scoring (AI)
              customer + quote + signals + objections
              → weighted multi-persona + objections
                              │
                              ▼
              [4] Strategy generation (AI)  ◄── [5] Benchmarks (deterministic)
              persona + goal arc + objections          org won/lost deals
              + product angles + benchmarks             → stat statements
              → ordered Steps {goal, lever, rationale, evidence chips}
                              │
                ┌────────────┴────────────┐
                ▼                         ▼
   [6] Draft on accept (AI)     [7] Revision validation (AI + checks)
   step → channel-ready copy     installer's plain-language edit,
                                 validated against deal data → apply or flag
                              │
                              ▼
              [8] Outcomes → feedback loop
              simulated now; real adaptive re-plan = stretch
```

## Where AI comes in (and where it must NOT)

| # | Step | AI? | Why |
|---|------|-----|-----|
| 1 | Signal/objection extraction from notes & call transcripts | **AI** | unstructured language → structured fields; output validated by Pydantic |
| 2 | Engagement temperature & ghost risk | **rules** | pure time-series over signal timestamps; must be deterministic + testable |
| 3 | Persona scoring (weighted, fixed taxonomy) | **AI** | judgment over mixed signals; output is a constrained Pydantic vector |
| 4 | Strategy generation (steps, goal, lever, rationale) | **AI** | the core reasoning task |
| 5 | Benchmark stats ("call <24h → 2.3× close") | **rules** | aggregation over deals; **never** let the model invent a statistic |
| 6 | Message drafting on accept | **AI** | language generation |
| 7 | Revision validation | **AI + rules** | model proposes; deterministic checks confirm the edit is supported by deal data before applying |
| 8 | Outcome simulation | **rules** | probabilistic sim; real events in production |

**Hard rule:** evidence chips of type `benchmark` and `deal_history` are filled
from deterministic computation, not model free-text. The model may *reference* a
benchmark by id, but the number comes from [5]. This is what makes the installer
trust it.

## Goal arc drives generation

Strategy generation [4] reads the deal's `current_goal`
(`build_trust → create_urgency → close_gap → ask_for_commitment`) and only
proposes steps appropriate to it. Trust before urgency; never ask for commitment
before the gap is framed. The goal advances on positive signals and resets
toward trust when the deal cools (from [2]).
