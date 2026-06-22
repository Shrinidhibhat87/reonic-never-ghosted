"""Admin: wipe + reseed the demo dataset."""

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.data import generator
from app.db import get_session, reset

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/seed")
def seed(session: Session = Depends(get_session)) -> dict[str, int]:
    """Drop all tables, recreate, and load the seeded synthetic dataset."""
    reset()
    return generator.seed(session)
