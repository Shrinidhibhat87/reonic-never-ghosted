"""FastAPI app entrypoint and router wiring."""

import os
from contextlib import asynccontextmanager

import logfire
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 — register tables before create_all
from app.db import create_all
from app.routers import admin, appointments, deals, leads, notes, orgs, strategy

# No-op until a Logfire token is present (`uv run logfire auth`), so tests/CI are
# unaffected; traces API requests + agent runs once authenticated.
logfire.configure(send_to_logfire="if-token-present", service_name="ng-backend")
logfire.instrument_pydantic_ai()


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_all()
    yield


app = FastAPI(title="Never Ghosted", lifespan=lifespan)

# ponytail: opentelemetry-instrumentation-fastapi crashes on CORS OPTIONS preflight
# with the installed Starlette ("_IncludedRouter has no attribute 'path'"), 500-ing
# every browser request. Only instrument when a Logfire token is actually set — the
# demo runs tokenless, so tracing stays off and the app serves. Upgrade the
# otel-instrumentation-fastapi pin to re-enable unconditionally.
if os.getenv("LOGFIRE_TOKEN"):
    logfire.instrument_fastapi(app)

# ponytail: wide-open CORS for local dev; lock to the frontend origin before prod.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router)
app.include_router(leads.router)
app.include_router(deals.router)
app.include_router(orgs.router)
app.include_router(strategy.router)
app.include_router(notes.router)
app.include_router(appointments.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
