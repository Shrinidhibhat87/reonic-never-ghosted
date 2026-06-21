"""Lead list for an installer — the entry screen."""

from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session

from app.db import get_session
from app.repositories import queries

router = APIRouter(tags=["leads"])


class LeadOut(BaseModel):
    deal_id: int
    customer_name: str
    region: str
    stage: str
    last_activity_at: datetime
    total_price: float
    currency: str
    products: list[str]
    ghost_risk: float  # 0..1 — recency-driven "likely to ghost" signal
    days_since_touch: int
    has_strategy: bool  # a strategy was already generated for this deal


def _ghost_risk(last_activity: datetime) -> tuple[float, int]:
    """Recency heuristic mirroring the engine: quiet longer = more likely to ghost.

    ponytail: inlined days-since-touch so the lead list stays decoupled from the
    engine package; the engine's own ghost_risk drives the strategy itself.
    """
    la = last_activity.replace(tzinfo=None) if last_activity.tzinfo else last_activity
    days = max(0, (datetime.now() - la).days)
    return round(min(1.0, days / 30), 2), days


@router.get("/installers/{installer_id}/leads", response_model=list[LeadOut])
def list_leads(installer_id: int, session: Session = Depends(get_session)) -> list[LeadOut]:
    out: list[LeadOut] = []
    for deal in queries.leads_for_installer(session, installer_id):
        customer = queries.get_customer(session, deal.customer_id)
        quote = queries.get_quote(session, deal.quote_id)
        risk, days = _ghost_risk(deal.last_activity_at)
        out.append(
            LeadOut(
                deal_id=deal.id,
                customer_name=customer.name,
                region=customer.region,
                stage=deal.stage.value,
                last_activity_at=deal.last_activity_at,
                total_price=quote.total_price,
                currency=quote.currency,
                products=[p["type"] for p in quote.products],
                ghost_risk=risk,
                days_since_touch=days,
                has_strategy=queries.latest_strategy(session, deal.id) is not None,
            )
        )
    return out
