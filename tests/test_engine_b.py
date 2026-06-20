"""P4: Engine B orchestration. Emits a visible flow, runs under budget, same schema."""

import pytest

from engine.budget import Budget, BudgetExceeded
from engine.deterministic import Goal
from engine.engine_b import ENGINE_B_PHASES, run_engine_b
from engine.golden import load_golden_prospects
from engine.log import EventKind, StrategyLog
from engine.strategy import (
    BuyerProfile,
    ChipKind,
    EvidenceChip,
    Lever,
    Persona,
    PersonaScore,
    Step,
    Strategy,
    StrategyInvariantError,
    TaskType,
)

ALLOWED_REFS = {"call_within_24h"}


def _good_strategy(prospect) -> Strategy:
    return Strategy(
        deal_id=prospect.deal.id,
        buyer_profile=BuyerProfile(
            personas=[PersonaScore(persona=Persona.roi_investor, weight=0.7,
                                   strength="strong")],
            top_motivations=["payback"], objections=[]),
        current_goal=Goal.create_urgency,
        steps=[Step(task_type=TaskType.phone_call, title="Call within 24h",
                    goal=Goal.create_urgency, primary_lever=Lever.roi_financial,
                    suggested_timing="24h", script="Lead with payback.",
                    why="Competitor flagged.",
                    evidence_chips=[EvidenceChip(kind=ChipKind.benchmark,
                                                 label="call <24h", ref="call_within_24h")])],
        summary="ROI-led close.")


def _phases(prospect):
    return {
        "extract": lambda p, s: {"objections": ["competitor_comparison"]},
        "persona": lambda p, s: {"roi_investor": 0.7},
        "strategy": lambda p, s: _good_strategy(p),
        "critic": lambda p, s: _good_strategy(p),  # refined, still valid
    }


def test_engine_b_emits_a_phase_per_step_and_records_final(tmp_path):
    log = StrategyLog(tmp_path)
    prospect = load_golden_prospects()[0]
    budget = Budget(max_tokens=10_000, max_turns=4)
    out = run_engine_b(prospect, phases=_phases(prospect), budget=budget, log=log,
                       allowed_refs=ALLOWED_REFS)
    assert out.deal_id == prospect.deal.id
    phase_events = [e for e in log.events(prospect.deal.id)
                    if e.kind is EventKind.phase]
    assert [e.note for e in phase_events] == ENGINE_B_PHASES
    assert budget.turns_used == 4
    # final strategy recorded into the same log
    assert log.latest_strategy(prospect.deal.id).summary == "ROI-led close."


def test_engine_b_degrades_when_budget_runs_out(tmp_path):
    log = StrategyLog(tmp_path)
    prospect = load_golden_prospects()[0]
    budget = Budget(max_tokens=10_000, max_turns=2)
    with pytest.raises(BudgetExceeded):
        run_engine_b(prospect, phases=_phases(prospect), budget=budget, log=log,
                     allowed_refs=ALLOWED_REFS)
    # partial flow still captured (degrade, not silent crash)
    assert len([e for e in log.events(prospect.deal.id)
                if e.kind is EventKind.phase]) == 2


def test_engine_b_rejects_invalid_final_strategy(tmp_path):
    log = StrategyLog(tmp_path)
    prospect = load_golden_prospects()[0]
    bad = _good_strategy(prospect)
    bad.steps[0].evidence_chips[0].ref = "invented_ref"
    phases = _phases(prospect) | {"critic": lambda p, s: bad}
    with pytest.raises(StrategyInvariantError):
        run_engine_b(prospect, phases=phases, budget=Budget(10_000, 4), log=log,
                     allowed_refs=ALLOWED_REFS)
