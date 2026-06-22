"""AP2 seam: RealEngine maps EngineContext -> engine -> StrategyResult (no LLM)."""

from datetime import datetime

from app.integration.engine import EngineContext
from app.integration.real_engine import RealEngine
from app.models import Customer, Deal, Quote
from app.models.enums import DealStage, Goal, PersuasionLever


def _ctx() -> EngineContext:
    return EngineContext(
        deal=Deal(id=1, customer_id=1, quote_id=1, installer_id=1,
                  stage=DealStage.engaged, last_activity_at=datetime(2026, 6, 18)),
        customer=Customer(id=1, org_id=1, assigned_installer_id=1, name="Sabine",
                          region="Munich", contact_channels=["email", "call"]),
        quote=Quote(id=1, customer_id=1, products=[{"type": "solar_pv", "spec": "9 kWp"}],
                    total_price=38400, currency="EUR", sent_at=datetime(2026, 6, 10)),
    )


def _canned_strategy(_prompt):
    from engine.deterministic import Goal as EGoal
    from engine.strategy import (
        BuyerProfile, ChipKind, EvidenceChip, Lever, Persona, PersonaScore,
        Step, Strategy, TaskType,
    )

    return Strategy(
        deal_id="1",
        buyer_profile=BuyerProfile(
            personas=[PersonaScore(persona=Persona.roi_investor, weight=0.7, strength="high")],
            top_motivations=["lower bills"], objections=[]),
        current_goal=EGoal.establish_value,
        steps=[Step(task_type=TaskType.phone_call, title="Call Sabine",
                    goal=EGoal.build_trust, primary_lever=Lever.gap_framing,
                    suggested_timing="within 24h", script="Hi Sabine, quick call.",
                    why="warm lead",
                    evidence_chips=[EvidenceChip(kind=ChipKind.behavioral,
                                                 label="opened 4x")])],
        summary="Warm ROI buyer.",
    )


def test_real_engine_maps_engine_strategy_to_backend_result():
    result = RealEngine(llm=_canned_strategy).generate(_ctx())

    assert result.current_goal == Goal.establish_value
    assert result.persona_scores[0].persona == "roi_investor"
    assert result.top_motivations == ["lower bills"]
    step = result.steps[0]
    assert step.order == 1
    assert step.goal == Goal.build_trust
    assert step.lever == PersuasionLever.gap_framing
    assert step.channel == "call"                 # phone_call -> call
    assert "Hi Sabine, quick call." in step.rationale   # script folded in
    assert step.evidence_chips[0].text == "opened 4x"
