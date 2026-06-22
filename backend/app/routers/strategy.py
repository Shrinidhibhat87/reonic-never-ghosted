"""Strategy generation, drafting, revision — all routed through the engine seam.

Every generate/draft/revise appends a StrategyEvent (the append-only trace).
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.db import get_session
from app.integration import context as context_builder
from app.integration.engine import RevisionResult, Step, StrategyResult, get_engine
from app.models import PersonaProfile, Strategy, StrategyEvent
from app.repositories import queries

router = APIRouter(tags=["strategy"])


def _log(session: Session, deal_id: int, event_type: str, payload: dict) -> None:
    session.add(StrategyEvent(deal_id=deal_id, event_type=event_type, payload=payload))


@router.post("/deals/{deal_id}/strategy", response_model=StrategyResult)
def generate_strategy(
    deal_id: int,
    engine: str | None = None,  # voltagent | python | fake (FE dropdown); default voltagent
    creative: bool = False,  # opt in to engine-emitted "think outside the box" plays
    session: Session = Depends(get_session),
) -> StrategyResult:
    ctx = context_builder.build(session, deal_id)
    if ctx is None:
        raise HTTPException(status_code=404, detail="deal not found")

    result = get_engine(engine).generate(ctx, include_creative_plays=creative)

    session.add(
        PersonaProfile(
            deal_id=deal_id,
            scores=[s.model_dump() for s in result.persona_scores],
            top_motivations=result.top_motivations,
            objections=result.objections,
        )
    )
    session.add(
        Strategy(
            deal_id=deal_id,
            current_goal=result.current_goal,
            buyer_profile=result.buyer_profile,
            steps=[s.model_dump(mode="json") for s in result.steps],
        )
    )
    _log(session, deal_id, "generate", result.model_dump(mode="json"))
    session.commit()
    return result


def _load_step(session: Session, deal_id: int, order: int) -> Step:
    strategy = queries.latest_strategy(session, deal_id)
    if strategy is None:
        raise HTTPException(status_code=404, detail="no strategy for deal; generate first")
    for raw in strategy.steps:
        if raw["order"] == order:
            return Step.model_validate(raw)
    raise HTTPException(status_code=404, detail="step order not found")


class DraftOut(BaseModel):
    message: str


@router.post("/deals/{deal_id}/steps/{order}/draft", response_model=DraftOut)
def draft_step(deal_id: int, order: int, session: Session = Depends(get_session)) -> DraftOut:
    ctx = context_builder.build(session, deal_id)
    if ctx is None:
        raise HTTPException(status_code=404, detail="deal not found")
    step = _load_step(session, deal_id, order)
    message = get_engine().draft(ctx, step)
    _log(session, deal_id, "draft", {"order": order, "message": message})
    session.commit()
    return DraftOut(message=message)


class ReviseIn(BaseModel):
    instruction: str


@router.post("/deals/{deal_id}/steps/{order}/revise", response_model=RevisionResult)
def revise_step(
    deal_id: int,
    order: int,
    body: ReviseIn,
    engine: str | None = None,
    creative: bool = False,
    session: Session = Depends(get_session),
) -> RevisionResult:
    ctx = context_builder.build(session, deal_id)
    if ctx is None:
        raise HTTPException(status_code=404, detail="deal not found")
    step = _load_step(session, deal_id, order)
    result = get_engine(engine).revise(ctx, step, body.instruction, include_creative_plays=creative)
    if result.applied:
        # Persist the revised step into the play so it survives a reload, not just the FE swap.
        strategy = queries.latest_strategy(session, deal_id)
        if strategy is not None:
            updated = result.step.model_dump(mode="json")
            strategy.steps = [updated if s["order"] == order else s for s in strategy.steps]
            session.add(strategy)
    _log(session, deal_id, "revise", result.model_dump(mode="json"))
    session.commit()
    return result
