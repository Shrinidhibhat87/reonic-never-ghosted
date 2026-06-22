# Backend → Frontend wiring

The backend owns the data and the HTTP contract. No BFF: the browser calls
FastAPI directly (CORS open for dev). Data is populated once via `POST /admin/seed`.

## How data reaches the screen

```mermaid
flowchart LR
  seed["POST /admin/seed<br/>(data/generator.py, RNG seed=42)"]
  pg[("Postgres :5434<br/>tables = models/entities.py")]
  repo["repositories/queries.py<br/>(read-only SQL)"]
  fake["integration/engine.py<br/>FakeEngine (strategy/persona)"]
  routers["routers/*.py<br/>FastAPI + Pydantic response models"]
  fe["Frontend<br/>browser fetch → :3001"]

  seed -->|writes rows| pg
  pg --> repo --> routers
  fake -->|generate/draft/revise| routers
  routers -->|JSON over HTTP :8001| fe
```

## Endpoints the frontend consumes

```mermaid
flowchart TD
  subgraph API["FastAPI :8001"]
    L["GET /installers/{id}/leads"]
    D["GET /deals/{id}"]
    S["POST /deals/{id}/strategy"]
    DR["POST /deals/{id}/steps/{order}/draft"]
    RV["POST /deals/{id}/steps/{order}/revise"]
    B["GET /orgs/{id}/benchmarks"]
    SD["POST /admin/seed"]
  end
  L --> pg[(Postgres)]
  D --> pg
  B --> pg
  SD --> pg
  S --> eng["FakeEngine<br/>+ persist Strategy/PersonaProfile"]
  DR --> eng
  RV --> eng
  eng --> pg
```

- **Stored shapes:** `app/models/entities.py` (SQLModel tables) + `app/models/enums.py` (taxonomies).
- **Seed values:** `app/data/generator.py` — 1 org, 2 installers, 20 active + 100 terminal deals.
- **Strategy/persona:** `app/integration/engine.py::FakeEngine` (deterministic stand-in; swap for the real engine at `get_engine()`).
