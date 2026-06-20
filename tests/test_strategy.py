"""P2: Engine A contract + invariants. LLM is stubbed; we test the guardrails."""

import pytest

from engine.deterministic import Goal
from engine.golden import load_golden_prospects
from engine.strategy import (
    BuyerProfile,
    ChipKind,
    EvidenceChip,
    Lever,
    Objection,
    Persona,
    PersonaScore,
    Step,
    Strategy,
    StrategyInvariantError,
    TaskType,
    generate_strategy,
    validate_strategy,
)

ALLOWED_REFS = {"call_within_24h", "won_similar_14"}


def _chip(kind: ChipKind, label: str, ref: str | None = None) -> EvidenceChip:
    return EvidenceChip(kind=kind, label=label, ref=ref)


def _step(goal: Goal, chips: list[EvidenceChip]) -> Step:
    return Step(
        task_type=TaskType.phone_call, title="Call Sabine within 24h", goal=goal,
        primary_lever=Lever.roi_financial, suggested_timing="within 24 hours",
        script="Lead with payback before she compares competitors.",
        why="She flagged a competitor quote in call notes.", evidence_chips=chips,
    )


def _strategy(steps: list[Step], current_goal: Goal = Goal.create_urgency) -> Strategy:
    return Strategy(
        deal_id="d_munich",
        buyer_profile=BuyerProfile(
            personas=[PersonaScore(persona=Persona.roi_investor, weight=0.7,
                                   strength="strong", evidence_refs=["n1"])],
            top_motivations=["payback", "competitor comparison"],
            objections=[Objection.competitor_comparison],
        ),
        current_goal=current_goal, steps=steps,
        summary="Lead with ROI, defuse the competitor comparison before she shops.",
    )


def test_valid_strategy_passes_invariants():
    s = _strategy([
        _step(Goal.build_trust, [_chip(ChipKind.behavioral, "opened 4x in 48h")]),
        _step(Goal.create_urgency,
              [_chip(ChipKind.benchmark, "call <24h close 2.3x", "call_within_24h")]),
    ])
    assert validate_strategy(s, allowed_refs=ALLOWED_REFS) == []


def test_more_than_three_steps_is_a_violation():
    s = _strategy([_step(Goal.build_trust, [])] * 4)
    assert validate_strategy(s, allowed_refs=ALLOWED_REFS)


def test_step_goal_beyond_current_goal_is_a_violation():
    s = _strategy([_step(Goal.ask_for_commitment, [])], current_goal=Goal.build_trust)
    violations = validate_strategy(s, allowed_refs=ALLOWED_REFS)
    assert any("goal" in v for v in violations)


def test_invented_benchmark_number_is_a_violation():
    # benchmark chip whose ref isn't a deterministically-computed id = invented stat
    s = _strategy([_step(Goal.create_urgency,
                         [_chip(ChipKind.benchmark, "leads close 9x", "made_up_ref")])])
    violations = validate_strategy(s, allowed_refs=ALLOWED_REFS)
    assert any("benchmark" in v or "ref" in v for v in violations)


def test_benchmark_chip_without_ref_is_a_violation():
    s = _strategy([_step(Goal.create_urgency,
                         [_chip(ChipKind.benchmark, "leads close more")])])
    assert validate_strategy(s, allowed_refs=ALLOWED_REFS)


def test_generate_strategy_returns_validated_strategy_from_stub_llm():
    good = _strategy([_step(Goal.create_urgency,
                            [_chip(ChipKind.benchmark, "call <24h", "call_within_24h")])])
    prospect = load_golden_prospects()[0]
    out = generate_strategy(prospect, llm=lambda prompt: good, allowed_refs=ALLOWED_REFS)
    assert out.deal_id == "d_munich"


def test_generate_strategy_raises_on_invariant_breach():
    bad = _strategy([_step(Goal.create_urgency,
                           [_chip(ChipKind.benchmark, "x", "made_up_ref")])])
    prospect = load_golden_prospects()[0]
    with pytest.raises(StrategyInvariantError):
        generate_strategy(prospect, llm=lambda prompt: bad, allowed_refs=ALLOWED_REFS)


def test_repair_loop_recovers_from_one_bad_draft():
    # #3: first draft violates, repaired draft is clean → returned, no raise.
    bad = _strategy([_step(Goal.create_urgency,
                           [_chip(ChipKind.benchmark, "x", "made_up_ref")])])
    good = _strategy([_step(Goal.create_urgency,
                           [_chip(ChipKind.benchmark, "call <24h", "call_within_24h")])])
    drafts = iter([bad, good])
    prospect = load_golden_prospects()[0]
    out = generate_strategy(prospect, llm=lambda prompt: next(drafts),
                            allowed_refs=ALLOWED_REFS, max_repairs=1)
    assert out.steps[0].evidence_chips[0].ref == "call_within_24h"


def test_render_prompt_lists_benchmark_ids_and_demands_drafts():
    # #2: prompt names the citable ids and asks for ready-to-send content.
    from engine.benchmarks import build_benchmarks
    from engine.strategy import _render_prompt, build_context

    prospect = load_golden_prospects()[0]
    ctx = build_context(prospect, now=__import__("datetime").datetime(2026, 6, 20))
    prompt = _render_prompt(prospect, ctx, build_benchmarks())
    assert "call_within_24h" in prompt           # citable id is offered
    assert "ready-to-send" in prompt.lower()     # demands full drafts
    assert "never invent" in prompt.lower()      # grounding instruction
