# Never Ghosted — AI Closing Strategist for Solar Installers

**Overall 1st Place Winner 🥇 · Reonic Track Winner 🥇 | Berlin Energy AI Hackathon 2026**

The gap between *“quote sent”* and *“contract signed”* is where solar deals die. Never
Ghosted reads each homeowner's quote, profile, installer notes and behavioural signals,
builds a grounded **buyer profile**, and writes a **multi-channel closing strategy** —
call, email, WhatsApp, video, voice note, even a creative gift play — with the reasoning,
timing and evidence an installer can trust, adjust, and act on in one click.

![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![VoltAgent](https://img.shields.io/badge/VoltAgent-FF6A00?logo=lightning&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white)
![ElevenLabs](https://img.shields.io/badge/ElevenLabs-000000?logo=elevenlabs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

## Architecture

```mermaid
flowchart TD
    FE["Next.js frontend<br/>:3000"] -->|HTTP| BE["FastAPI backend<br/>:8000"]
    BE -->|HTTP /api/recommend-next-action| AG["VoltAgent service<br/>:3141"]
    BE -->|fallback| PY["Python engine<br/>(in-process)"]
    AG -->|reads| KB["Knowledgebase<br/>(agent/knowledgebase/*.json)"]
    BE --> DB[("Postgres")]
    BE -->|voice notes| EL["ElevenLabs<br/>Speech-to-Text"]
```

- **Frontend** (`frontend/`, Next.js 14 + Subframe UI) — the browser talks only to the backend.
- **Backend** (`backend/`, FastAPI + Postgres) — owns deals/quotes/strategy. Routes
  every plan through a `StrategyEngine` seam.
- **Engine choice** — selectable per request from the strategy page dropdown:
  - **VoltAgent** (primary): calls M's TS agent service (`agent/`) on `:3141`, which
    reasons over the JSON knowledgebase. Falls back to the deterministic engine if the
    agent is unreachable (unless `REONIC_AGENT_STRICT=true`).
  - **Python** (backup): a local in-process engine (`engine/`). Needs `OPENAI_API_KEY`.
  - **Deterministic**: a no-LLM fixture engine for offline demos and tests.
- **Voice notes** (`backend/app/routers/voice.py`) — the prospect page records a note and
  transcribes it via ElevenLabs Speech-to-Text. Gated on `ELEVENLABS_API_KEY`; without it
  the button reports the feature as coming soon.

## Happy-path flow (VoltAgent engine)

End-to-end sequence from "user opens Closing Strategy" to "rendered plan", including
every agentic step visible in the VoltOps console.

```mermaid
sequenceDiagram
    actor User
    participant FE as Next.js :3000
    participant BE as FastAPI :8000
    participant DB as Postgres
    participant AG as VoltAgent :3141
    participant LLM as OpenAI LLM

    User->>FE: Opens Closing Strategy page
    FE->>BE: GET /api/strategy/{dealId}
    BE->>DB: Load deal, quote, customer, signals, touches
    DB-->>BE: EngineContext rows

    BE->>AG: POST /api/recommend-next-action<br/>(RecommendRequest JSON)

    Note over AG: Workflow: recommend-next-action

    rect rgb(240,248,255)
        Note over AG: S1 — validate-context (deterministic)
        AG->>AG: Confirm customer, quote, consent, calendar present
    end

    rect rgb(240,248,255)
        Note over AG: S2 — load-knowledgebase (deterministic)
        AG->>AG: Load buyer-signals, objections,<br/>task-playbooks, customer-reviews
    end

    rect rgb(240,248,255)
        Note over AG: S3 — diagnose-and-score (deterministic)
        AG->>AG: Score 5 task types against signals,<br/>objections, consent, calendar, KB rules
        AG->>AG: Select top action + alternatives
    end

    rect rgb(255,245,230)
        Note over AG: S4 — evaluate-recommendation (LLM call ①)
        AG->>LLM: generateObject — evaluate scoring fit,<br/>return confidence + improved reasoning
        LLM-->>AG: {confidence, primaryReason, improvedSummary}
        AG->>AG: Enrich reasoning.decisionFactors with agent_evaluation
    end

    rect rgb(255,245,230)
        Note over AG: S5 — synthesize-strategy (LLM call ②)
        AG->>LLM: generateObject — write installer-facing copy,<br/>agenda, proof list, customer draft
        LLM-->>AG: {strategyHeadline, agendaOrMessagePlan, ...}
        AG->>AG: Merge synthesis into RecommendationResponse
    end

    AG-->>BE: RecommendationResponse JSON
    BE->>BE: Map recommendation → StrategyResult<br/>(channels, personas, evidence chips)
    BE-->>FE: StrategyResult JSON
    FE->>User: Render buyer profile, persona mix,<br/>closing play, evidence chips
```

### VoltOps trace blocks per run

| # | Block | Type | Triggered by |
|---|-------|------|-------------|
| 1 | Workflow span | workflow | `recommendNextActionWorkflow.run()` |
| 2 | S1 validate-context | step | `andThen` chain |
| 3 | S2 load-knowledgebase | step | `andThen` chain |
| 4 | S3 diagnose-and-score | step | `andThen` chain |
| 5 | S4 evaluate-recommendation | step | `andThen` chain |
| 6 | LLM call (evaluation) | llm | `generateObject` in S4 |
| 7 | S5 synthesize-strategy | step | `andThen` chain |
| 8 | LLM call (synthesis) | llm | `generateObject` in S5 |

Open **console.voltagent.dev** → connect to `http://localhost:3141` to see live runs.

## Setup

```bash
cp .env.example .env      # then put a real OPENAI_API_KEY in it
```

This root `.env` is the **only** place keys live. The agent loads it (`../../.env`
in dev, `env_file` in Docker) and the backend reads it via `env_file` — nothing
reads a key from elsewhere.

With `OPENAI_API_KEY`, the agent's model (`VOLTAGENT_MODEL`) must be a **bare**
OpenAI id like `gpt-5-mini`. The default `openai/gpt-5-mini` carries an
OpenRouter-style prefix that the agent strips automatically when talking to OpenAI
directly; keep the prefix only if you point it at OpenRouter. If the model id is
wrong, the agent still returns a result but silently downgrades to its
deterministic wording (`generation.mode: "deterministic_fallback"`).

## Run

Assumes a clean machine with **no containers running**.

### Option A — docker compose (everything, recommended)

```bash
docker compose up --build                          # builds + starts all 4 services
curl -X POST http://localhost:8000/admin/seed      # load the demo dataset (once)
```

Then open **two browser tabs**:

1. **The app** → http://localhost:3000 — the installer-facing product.
2. **VoltOps trace console** → https://console.voltagent.dev → connect to
   `http://localhost:3141`. Every time you generate/regenerate a strategy in tab 1,
   the agent run streams in live here (the ~8 blocks in the table above) so you can
   watch the reasoning, not just the result.

Services: frontend `:3000`, backend `:8000`, agent `:3141`, Postgres `:5434`.

> In Docker the **Python** engine option falls back to the deterministic engine (the
> `engine/` package isn't bundled into the backend image). VoltAgent and Deterministic
> work fully. For the live Python engine, run the backend locally (Option B).

### Option B — by hand (4 terminals)

```bash
# 1. Postgres
docker compose up -d db

# 2. VoltAgent
cd agent && npm install && npm run start          # :3141

# 3. Backend
cd backend && uv sync && \
  NG_DATABASE_URL=postgresql+psycopg://ng:ng@localhost:5434/never_ghosted \
  uv run uvicorn app.main:app --reload --port 8000 # :8000
curl -X POST http://localhost:8000/admin/seed

# 4. Frontend
cd frontend && npm install && npm run dev          # :3000
```

## Using it

1. Open **http://localhost:3000/quotes** and pick a deal (e.g. Sabine Mueller).
2. Open the **Closing Strategy** page.
3. Top controls:
   - **Strategy engine** — VoltAgent (default) / Python / Deterministic.
   - **Think outside the box** — opt in to engine-emitted creative plays (gifts,
     vouchers, tactile mail). A "Generated by …" badge shows which engine wrote the plan.
4. Each step can be **drafted**, **added to the calendar**, or **revised** (the
   revision is checked against the deal's data before it's applied).

## Verify it yourself

Start from no containers, run **Option A** above, then check each of these in tab 1:

1. **Buyer-profile persona mix is differentiated** — open any deal → **Closing Strategy**.
   The **PERSONA MIX** bars should show *varied* percentages (e.g. 90% / 60% / 40%), not the
   same number on every bar. Each bar's weight comes from the actual behavioural-signal type
   and its observed count.
2. **Installer notes shape the strategy** — open a deal → the prospect page (click the
   customer's name) → **Add note** something pointed like *“customer wants someone to come
   look at the roof”* → go to **Closing Strategy** and **Regenerate**. The plan should shift
   toward that note (here: an in-person visit). Personal touches you pick on the prospect
   page are folded in the same way. Watch the rerun stream into the VoltOps tab.
3. **Voice notes** — on the prospect page click **Record voice**. With no
   `ELEVENLABS_API_KEY` set it reports *“Voice transcription coming soon …”*. Add the key to
   `.env`, `docker compose up -d --build backend`, and the same button records → transcribes
   → drops the text into the note draft.

## Reset demo data

```bash
curl -X POST http://localhost:8000/admin/seed   # wipes + reseeds
```

## Shut down

```bash
docker compose down        # stop + remove all containers
docker compose down -v     # also drop the Postgres volume (full clean slate)
```

## Tests

```bash
cd backend && uv run pytest          # 14 tests, needs Postgres on :5434
cd frontend && npm run build         # typecheck + production build
cd agent && npm test
```

The backend suite is pinned to the deterministic engine (`conftest.py`), so it runs
offline with no agent or API key.

## Notes & follow-ups

- **Knowledgebase enrichment** — the richer markdown in `research/` (personas,
  objection library, playbooks, strategy rules, case studies) is **not yet** merged
  into `agent/knowledgebase/*.json`. The existing JSON KB is sufficient for the demo;
  converting the five files is a follow-up (see `requirements.md` §5d).
- **Live VoltAgent** requires a valid `OPENAI_API_KEY` and the agent running on `:3141`.
  Without it, plans gracefully fall back to the deterministic engine.
