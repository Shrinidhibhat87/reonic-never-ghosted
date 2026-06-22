"""P2: Engine A. Single structured LLM call → validated communication strategy.

The model does the language/judgment; deterministic facts (temperature, ghost
risk, goal, benchmarks, knowledge) are computed in P1 and fed in as context. The
output is hard-validated against invariants before anyone sees it — the model may
*reference* a benchmark by id but never invent the number.
"""

from __future__ import annotations

from enum import Enum
from typing import Callable

from pydantic import BaseModel, Field

from engine.deterministic import (
    GOAL_ARC,
    Goal,
    engagement_temperature,
    ghost_risk,
)
from engine.models import GoldenProspect

MAX_STEPS = 3  # frontend shows up to 3 recommended tasks


class Persona(str, Enum):
    environmentalist = "environmentalist"
    roi_investor = "roi_investor"
    budget_sensitive = "budget_sensitive"
    security_seeker = "security_seeker"
    early_adopter = "early_adopter"
    skeptic = "skeptic"


class Objection(str, Enum):
    upfront_cost = "upfront_cost"
    financing_concern = "financing_concern"
    performance_doubt = "performance_doubt"
    roof_or_technical_fit = "roof_or_technical_fit"
    trust_or_legitimacy = "trust_or_legitimacy"
    timing_low_urgency = "timing_low_urgency"
    competitor_comparison = "competitor_comparison"
    decision_paralysis = "decision_paralysis"


class Lever(str, Enum):
    roi_financial = "roi_financial"
    environmental_impact = "environmental_impact"
    peace_of_mind = "peace_of_mind"
    proximity_trust = "proximity_trust"
    social_proof = "social_proof"
    urgency = "urgency"
    gap_framing = "gap_framing"
    objection_handling = "objection_handling"
    product_specific = "product_specific"


class TaskType(str, Enum):
    phone_call = "phone_call"
    send_email = "send_email"
    meeting_in_person = "meeting_in_person"
    whatsapp_video = "whatsapp_video"
    send_gift = "send_gift"


class ChipKind(str, Enum):
    behavioral = "behavioral"
    benchmark = "benchmark"
    deal_history = "deal_history"


class EvidenceChip(BaseModel):
    kind: ChipKind
    label: str
    ref: str | None = None  # required for benchmark/deal_history; the source id


class PersonaScore(BaseModel):
    persona: Persona
    weight: float = Field(ge=0, le=1)
    strength: str
    evidence_refs: list[str] = []


class BuyerProfile(BaseModel):
    personas: list[PersonaScore] = Field(min_length=1)
    top_motivations: list[str]
    objections: list[Objection] = []


class Step(BaseModel):
    task_type: TaskType
    title: str
    goal: Goal
    primary_lever: Lever
    secondary_lever: Lever | None = None
    suggested_timing: str
    script: str
    why: str
    evidence_chips: list[EvidenceChip] = []


class Strategy(BaseModel):
    deal_id: str
    buyer_profile: BuyerProfile
    current_goal: Goal
    steps: list[Step]
    summary: str


class StrategyInvariantError(ValueError):
    """Raised when a generated strategy breaks a trust/safety invariant."""


# LLM is any callable prompt -> Strategy (structured). Real adapter in llm.py.
LLM = Callable[[str], Strategy]


def validate_strategy(strategy: Strategy, *, allowed_refs: set[str]) -> list[str]:
    """Return invariant violations (empty = safe to surface)."""
    violations: list[str] = []
    if len(strategy.steps) > MAX_STEPS:
        violations.append(f"too many steps: {len(strategy.steps)} > {MAX_STEPS}")

    goal_rank = GOAL_ARC.index(strategy.current_goal)
    for i, step in enumerate(strategy.steps):
        if GOAL_ARC.index(step.goal) > goal_rank:
            violations.append(
                f"step {i} goal {step.goal.value} is beyond current_goal "
                f"{strategy.current_goal.value}")
        for chip in step.evidence_chips:
            if chip.kind in (ChipKind.benchmark, ChipKind.deal_history):
                if not chip.ref:
                    violations.append(f"step {i} {chip.kind.value} chip has no ref")
                elif chip.ref not in allowed_refs:
                    violations.append(
                        f"step {i} {chip.kind.value} ref '{chip.ref}' not "
                        "deterministically computed (invented number)")
    return violations


def build_context(prospect: GoldenProspect, *, now) -> dict:
    """Deterministic facts the prompt must ground its language in."""
    temp = engagement_temperature(
        prospect.deal.last_activity_at, prospect.signals, now=now)
    return {
        "temperature": temp.value,
        "ghost_risk": round(ghost_risk(prospect.deal.last_activity_at, now=now), 2),
        "stage": prospect.deal.stage.value,
        "products": [p.type.value for p in prospect.quote.products],
        "notes": [n.content for n in prospect.notes],
        "competitor": prospect.competitor.competitor_price if prospect.competitor else None,
    }


def generate_traced(
    prospect: GoldenProspect, *, llm: LLM, allowed_refs: set[str],
    benchmarks: dict | None = None, now=None, max_repairs: int = 1,
) -> tuple[Strategy, list[str]]:
    """Run Engine A with a bounded repair loop; return (strategy, violations).

    Best-effort: never raises on invariant breach — the caller decides. After a
    violating draft, re-prompt once (up to ``max_repairs``) with the violation
    list before giving up. Lets demos surface output while staying honest about
    what failed validation.
    """
    from datetime import datetime

    now = now or datetime(2026, 6, 20, 12, 0, 0)
    context = build_context(prospect, now=now)
    prompt = _render_prompt(prospect, context, benchmarks or {})
    strategy = llm(prompt)
    violations = validate_strategy(strategy, allowed_refs=allowed_refs)
    repairs = 0
    while violations and repairs < max_repairs:
        repairs += 1
        strategy = llm(_repair_prompt(prompt, violations))
        violations = validate_strategy(strategy, allowed_refs=allowed_refs)
    return strategy, violations


def generate_strategy(
    prospect: GoldenProspect, *, llm: LLM, allowed_refs: set[str],
    benchmarks: dict | None = None, now=None, max_repairs: int = 1,
) -> Strategy:
    """Engine A: generate (with repair), hard-validate, raise if still in breach."""
    strategy, violations = generate_traced(
        prospect, llm=llm, allowed_refs=allowed_refs,
        benchmarks=benchmarks, now=now, max_repairs=max_repairs)
    if violations:
        raise StrategyInvariantError("; ".join(violations))
    return strategy


def _repair_prompt(original: str, violations: list[str]) -> str:
    """Append the failed checks and ask for a corrected draft."""
    return (
        original
        + "\n\nYOUR PREVIOUS DRAFT FAILED THESE CHECKS:\n"
        + "\n".join(f"- {v}" for v in violations)
        + "\n\nReturn a corrected strategy that fixes every failure. Cite "
        "benchmark/deal_history chips ONLY by the allowed ids above, and keep "
        "every step's goal at or below the current goal."
    )


def _render_prompt(prospect: GoldenProspect, context: dict, benchmarks: dict) -> str:
    """Structured single-call prompt: grounded facts + explicit output demands."""
    c, q = prospect.customer, prospect.quote
    products = ", ".join(f"{p.type.value} ({p.spec})" for p in q.products)
    competitor = (
        f"{prospect.competitor.competitor_name} at €{prospect.competitor.competitor_price:.0f}"
        if prospect.competitor else "none flagged"
    )
    notes = "\n".join(f"  - {n.content}" for n in prospect.notes) or "  - none"
    if benchmarks:
        bench_lines = "\n".join(
            f"  - id={ref}: {b.metric}, win-lift "
            f"{('%.2fx' % b.lift) if b.lift is not None else 'n/a'} (n={b.sample_size})"
            for ref, b in benchmarks.items()
        )
    else:
        bench_lines = "  - none available"

    return f"""\
You are a sales-process coach for a German renewable-energy installer. A quoted
homeowner went quiet. Diagnose why and propose the next moves to re-engage them.

CUSTOMER
  name: {c.name} | region: {c.region} | channels: {[ch.value for ch in c.contact_channels]}
  energy bill: {c.current_energy_bill} | distance to installer: {c.distance_to_installer_km} km

QUOTE
  products: {products}
  price: €{q.total_price:.0f} | savings/yr: {q.est_savings_per_year} | payback: {q.payback_years} yrs
  roi: {q.roi_pct} | CO2 offset: {q.co2_offset_tons} t
  competitor: {competitor}

DETERMINISTIC SIGNALS (already computed — do not recompute or contradict)
  temperature: {context['temperature']} | ghost_risk: {context['ghost_risk']} | stage: {context['stage']}

INSTALLER NOTES
{notes}

BENCHMARKS YOU MAY CITE (use the id in a benchmark/deal_history chip; never invent numbers)
{bench_lines}

PRODUCE
  1. buyer_profile: weighted persona vector (weights ~sum to 1), top motivations,
     and the objections you infer from the notes/signals.
  2. current_goal: the furthest goal it's safe to pursue now (trust -> value ->
     urgency -> close -> ask). Earn trust before urgency; ask for commitment last.
  3. up to 3 steps laddering toward current_goal, lowest-pressure first. Each step:
     - pick the right channel/action (call, email, meeting, whatsapp_video, gift)
     - a primary lever (+ optional secondary)
     - READY-TO-SEND content in `script`: emails get a full subject + body, calls
       get concrete talking points. No placeholders.
     - evidence_chips grounded in the facts above; benchmark/deal_history chips
       MUST use an allowed id.
"""
