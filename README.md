# Reonic – Never Ghosted

FastAPI backend + Next.js frontend. Run locally in two terminals.

## 0. Env (once)

```bash
cp .env.template .env          # then put your OPENAI_API_KEY in .env
```

`.env` is gitignored. It carries `OPENAI_API_KEY` (live LLM) and
`NG_DATABASE_URL` (Postgres on host port 5434, matching docker-compose).

## 1. Backend (Postgres :5434, API :8000)

```bash
docker compose up -d db                                  # Postgres only
cd backend && uv sync
uv run --env-file ../.env uvicorn app.main:app --reload  # loads .env (key + DB url)
curl -X POST http://localhost:8000/admin/seed            # demo data, run once
```

`--env-file ../.env` injects the key into this process — that's how the local
server sees it. Engine selection is then automatic: `OPENAI_API_KEY` present →
live **RealEngine**; absent → deterministic **FakeEngine** (offline, no spend).

## 2. Frontend (:3000)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000/quotes. API docs at http://localhost:8000/docs.

## 3. Demo flow

Quotes board → open a person → add a note → **Generate strategy** (persona bars,
evidence, multi-channel play) → revise a step / draft a message / **Add to
calendar** → `/calendar` shows the slot filled in Manuel's week.

## Spin down

```bash
docker compose down       # stop + remove containers (keeps DB volume)
docker compose down -v    # also drop the Postgres volume (wipes seeded data)
```

Appointments are in-memory — they reset on backend restart. Re-seed after a
fresh DB: `curl -X POST http://localhost:8000/admin/seed`.

Full stack in Docker instead of local: put the key in `backend/.env`, then
`docker compose up -d --build` — app serves on the compose ports (`:8001`/`:3001`).
No hot reload; rebuild on code change.

## Strategy engine + A/B comparison

Uses the backend venv (has `openai` + `pydantic-ai`).

```bash
PY=backend/.venv/bin/python3

$PY -m engine.demo munich --stub   # our engine, no key/spend (canned output)
$PY -m engine.demo munich          # our engine, live next-steps
$PY ab_compare.py munich           # our engine vs basic agent + LLM judge
$PY ab_compare.py                  # all 6 golden prospects, win tally
```

Prospects: `munich hamburg nrw saxony bw berlin`.
