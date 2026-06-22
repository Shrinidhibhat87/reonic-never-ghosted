"""Assemble an EngineContext for a deal from the repositories + knowledge base."""

from sqlmodel import Session

from app import knowledge
from app.integration.engine import EngineContext
from app.repositories import queries


def build(session: Session, deal_id: int) -> EngineContext | None:
    deal = queries.get_deal(session, deal_id)
    if deal is None:
        return None
    competitor = queries.competitor_for_deal(session, deal_id)
    org_id = queries.org_id_for_deal(session, deal_id)
    return EngineContext(
        deal=deal,
        customer=queries.get_customer(session, deal.customer_id),
        quote=queries.get_quote(session, deal.quote_id),
        touches=queries.touches_for_deal(session, deal_id),
        notes=queries.notes_for_deal(session, deal_id),
        signals=queries.signals_for_deal(session, deal_id),
        competitor=competitor.model_dump() if competitor else None,
        benchmark_rows=queries.terminal_stage_counts(session, org_id) if org_id else {},
        knowledge=knowledge.load(),
    )
