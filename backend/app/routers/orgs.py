"""Org-level reads. Benchmark *inputs* live here; the engine turns them into lifts."""

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db import get_session
from app.repositories import queries

router = APIRouter(tags=["orgs"])


@router.get("/orgs/{org_id}/benchmarks")
def benchmarks(org_id: int, session: Session = Depends(get_session)) -> dict[str, int]:
    """Raw won/lost/ghosted counts. Deterministic; the engine aggregates into stats."""
    return queries.terminal_stage_counts(session, org_id)
