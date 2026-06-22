"""Thin data access — queries only, no business logic."""

from sqlalchemy import func
from sqlmodel import Session, select

from app.models import (
    CompetitorPressure,
    Customer,
    Deal,
    Note,
    PersonaProfile,
    Quote,
    Signal,
    Strategy,
    Touch,
)
from app.models.enums import DealStage


def leads_for_installer(session: Session, installer_id: int) -> list[Deal]:
    return list(
        session.exec(
            select(Deal)
            .where(Deal.installer_id == installer_id)
            .order_by(Deal.last_activity_at.desc())
        ).all()
    )


def get_deal(session: Session, deal_id: int) -> Deal | None:
    return session.get(Deal, deal_id)


def get_customer(session: Session, customer_id: int) -> Customer | None:
    return session.get(Customer, customer_id)


def get_quote(session: Session, quote_id: int) -> Quote | None:
    return session.get(Quote, quote_id)


def touches_for_deal(session: Session, deal_id: int) -> list[Touch]:
    return list(
        session.exec(
            select(Touch).where(Touch.deal_id == deal_id).order_by(Touch.timestamp)
        ).all()
    )


def notes_for_deal(session: Session, deal_id: int) -> list[Note]:
    return list(
        session.exec(select(Note).where(Note.deal_id == deal_id).order_by(Note.timestamp)).all()
    )


def signals_for_deal(session: Session, deal_id: int) -> list[Signal]:
    return list(
        session.exec(
            select(Signal).where(Signal.deal_id == deal_id).order_by(Signal.timestamp)
        ).all()
    )


def competitor_for_deal(session: Session, deal_id: int) -> CompetitorPressure | None:
    return session.exec(
        select(CompetitorPressure).where(CompetitorPressure.deal_id == deal_id)
    ).first()


def org_id_for_deal(session: Session, deal_id: int) -> int | None:
    deal = session.get(Deal, deal_id)
    if deal is None:
        return None
    customer = session.get(Customer, deal.customer_id)
    return customer.org_id if customer else None


def terminal_stage_counts(session: Session, org_id: int) -> dict[str, int]:
    """Raw won/lost/ghosted counts for an org. The engine aggregates these into lifts."""
    rows = session.exec(
        select(Deal.stage, func.count())
        .join(Customer, Customer.id == Deal.customer_id)
        .where(Customer.org_id == org_id)
        .where(Deal.stage.in_([DealStage.won, DealStage.lost, DealStage.ghosted]))
        .group_by(Deal.stage)
    ).all()
    return {stage.value: count for stage, count in rows}


def latest_strategy(session: Session, deal_id: int) -> Strategy | None:
    return session.exec(
        select(Strategy).where(Strategy.deal_id == deal_id).order_by(Strategy.created_at.desc())
    ).first()


def latest_persona(session: Session, deal_id: int) -> PersonaProfile | None:
    return session.exec(
        select(PersonaProfile)
        .where(PersonaProfile.deal_id == deal_id)
        .order_by(PersonaProfile.created_at.desc())
    ).first()
