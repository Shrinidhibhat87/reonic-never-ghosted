# Never Ghosted — Backend

Service layer: persistence, API, seed data, simulation. Plan:
[`../docs/implementation_plan/backend_plan.md`](../docs/implementation_plan/backend_plan.md).
Strategy engine lives separately ([`agent_plan.md`](../docs/implementation_plan/agent_plan.md)).

## Dev

```bash
uv sync                          # install deps
docker compose -f ../docker-compose.yml up -d db   # local Postgres (root compose)
uv run uvicorn app.main:app --reload
uv run pytest                 # tests (live-marked excluded by default)
uv run ruff check
```

Config via env (`NG_` prefix), e.g. `NG_DATABASE_URL`. See `app/config.py`.
