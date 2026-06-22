"""Add a note to a deal — the human-input feedback loop (Pillar 2).

The Note entity already exists; this is the missing write route. Author is the
deal's installer (no real auth yet). Voice notes carry transcribed text in
``content`` — the FE records the affordance; transcription is out of demo scope.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.db import get_session
from app.models import Note
from app.models.enums import NoteType
from app.repositories import queries

router = APIRouter(tags=["notes"])


class NoteIn(BaseModel):
    type: NoteType = NoteType.text
    content: str


@router.post("/deals/{deal_id}/notes", response_model=Note)
def add_note(deal_id: int, body: NoteIn, session: Session = Depends(get_session)) -> Note:
    deal = queries.get_deal(session, deal_id)
    if deal is None:
        raise HTTPException(status_code=404, detail="deal not found")
    note = Note(
        deal_id=deal_id,
        author_id=deal.installer_id,
        type=body.type,
        content=body.content,
        timestamp=datetime.now(UTC),
    )
    session.add(note)
    session.commit()
    session.refresh(note)
    return note
