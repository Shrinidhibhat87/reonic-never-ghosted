"""Full deal detail. Persona/strategy fields are null until BP2 populates them."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.db import get_session
from app.models import Customer, Deal, Note, Quote, Signal, Touch
from app.repositories import queries

router = APIRouter(tags=["deals"])


class DealDetail(BaseModel):
    deal: Deal
    customer: Customer
    quote: Quote
    touches: list[Touch]
    notes: list[Note]
    signals: list[Signal]
    competitor: dict[str, Any] | None = None
    # Populated in later pillars:
    persona: dict[str, Any] | None = None
    strategy: dict[str, Any] | None = None
    temperature: str | None = None
    ghost_risk: float | None = None


@router.get("/deals/{deal_id}", response_model=DealDetail)
def get_deal_detail(deal_id: int, session: Session = Depends(get_session)) -> DealDetail:
    deal = queries.get_deal(session, deal_id)
    if deal is None:
        raise HTTPException(status_code=404, detail="deal not found")
    competitor = queries.competitor_for_deal(session, deal_id)
    persona = queries.latest_persona(session, deal_id)
    strategy = queries.latest_strategy(session, deal_id)
    return DealDetail(
        deal=deal,
        customer=queries.get_customer(session, deal.customer_id),
        quote=queries.get_quote(session, deal.quote_id),
        touches=queries.touches_for_deal(session, deal_id),
        notes=queries.notes_for_deal(session, deal_id),
        signals=queries.signals_for_deal(session, deal_id),
        competitor=competitor.model_dump() if competitor else None,
        persona=persona.model_dump(mode="json") if persona else None,
        strategy=strategy.model_dump(mode="json") if strategy else None,
    )
