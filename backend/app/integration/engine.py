"""The seam between the backend and the strategy engine (agent_plan.md).

The backend talks to the engine only through `StrategyEngine`. Until the real
engine (branch `feat/strategy-engine`) merges, `FakeEngine` stands in — it returns
a deterministic fixture derived from real deal context, so endpoints, persistence,
and tests all work now. Swap `get_engine()` to the real impl behind the same
Protocol with zero endpoint/persistence changes.
"""

import os
from typing import Any, Protocol

from pydantic import BaseModel

from app.models import Customer, Deal, Note, Quote, Signal, Touch
from app.models.enums import Goal, PersuasionLever


class EngineContext(BaseModel):
    """Everything the engine needs about one deal. Backend assembles it from repos."""

    model_config = {"arbitrary_types_allowed": True}

    deal: Deal
    customer: Customer
    quote: Quote
    touches: list[Touch] = []
    notes: list[Note] = []
    signals: list[Signal] = []
    competitor: dict[str, Any] | None = None
    benchmark_rows: dict[str, int] = {}  # raw won/lost/ghosted counts; engine aggregates
    knowledge: list[dict[str, Any]] = []


class EvidenceChip(BaseModel):
    kind: str  # behavioral | benchmark | deal_history
    text: str
    ref: str | None = None  # benchmark/deal_history numbers come from data, not free-text


class CreativePlay(BaseModel):
    """An out-of-the-box outreach idea ("think outside the box"). Engine-emitted,
    surfaced only when the installer opts in on create/revise."""

    title: str
    trigger: str  # the deal condition that makes this play fit
    why: str  # one line: why it lands where the obvious email won't
    channel: str | None = None  # gift | letter | video | ...


class PersonaScore(BaseModel):
    persona: str
    weight: float
    strength: str
    evidence_refs: list[str] = []  # why this persona scored — the FE "why" panel


class Step(BaseModel):
    order: int
    goal: Goal
    lever: PersuasionLever
    channel: str
    rationale: str
    title: str | None = None  # short step headline for the timeline
    timing: str | None = None  # suggested timing label (e.g. "Day 1")
    evidence_chips: list[EvidenceChip] = []
    revision_notes: list[str] = []  # installer instructions applied to this step


class StrategyResult(BaseModel):
    current_goal: Goal
    buyer_profile: dict[str, Any]
    persona_scores: list[PersonaScore]
    top_motivations: list[str]
    objections: list[str]
    steps: list[Step]
    engine: str = "fake"  # which engine produced this (voltagent | python | fake)
    creative_plays: list[CreativePlay] = []  # only populated when the installer opts in


class RevisionResult(BaseModel):
    applied: bool
    step: Step
    reason: str
    creative_plays: list[CreativePlay] = []


class StrategyEngine(Protocol):
    def generate(self, ctx: EngineContext, include_creative_plays: bool = False) -> StrategyResult: ...
    def draft(self, ctx: EngineContext, step: Step) -> str: ...
    def revise(
        self, ctx: EngineContext, step: Step, instruction: str, include_creative_plays: bool = False
    ) -> RevisionResult: ...


def fallback_creative_plays() -> list[CreativePlay]:
    """Static out-of-the-box plays. Used by FakeEngine and as the VoltAgent fallback
    so the "think outside the box" panel always has content for the demo."""
    return [
        CreativePlay(
            title="Premium printed letter + savings scratch-card",
            trigger="Older buyer · low digital engagement",
            why="A tactile premium letter cuts through the email/WhatsApp this buyer tunes out.",
            channel="letter",
        ),
        CreativePlay(
            title="Complimentary wallbox bundle",
            trigger="EV ownership / intent in notes",
            why="Hooks a want they already have; lands as a gift, not an upsell.",
            channel="gift",
        ),
        CreativePlay(
            title="Voucher for a local café with the site-visit invite",
            trigger="Warm lead stalling on a meeting",
            why="A low-pressure, human reason to meet re-opens a quiet conversation.",
            channel="gift",
        ),
        CreativePlay(
            title="30-second personal roof-layout video",
            trigger="Skeptical buyer · technical doubts",
            why="A face-to-name touch builds trust a generic email can't.",
            channel="video",
        ),
    ]


class FakeEngine:
    """Deterministic stand-in. Derives plausible output from real context — no LLM."""

    def generate(self, ctx: EngineContext, include_creative_plays: bool = False) -> StrategyResult:
        product_types = [p.get("type") for p in ctx.quote.products]
        lever = (
            PersuasionLever.environmental_impact
            if "heat_pump" in product_types
            else PersuasionLever.roi_financial
        )
        opens = sum(s.value or 0 for s in ctx.signals if s.type.value == "email_opened")
        won = ctx.benchmark_rows.get("won", 0)

        chips = [
            EvidenceChip(kind="behavioral", text=f"opened the quote {opens}x"),
            EvidenceChip(
                kind="benchmark",
                text=f"{won} similar deals won by this org",
                ref=f"won_count={won}",  # number sourced from data, not invented
            ),
        ]
        steps = [
            Step(
                order=1,
                goal=Goal.build_trust,
                lever=PersuasionLever.proximity_trust,
                channel="call",
                title="Re-open with a local check-in call",
                timing="Day 1",
                rationale="Open with local credibility before any ask.",
                evidence_chips=chips,
            ),
            Step(
                order=2,
                goal=Goal.establish_value,
                lever=lever,
                channel="email",
                title="Send a value recap matched to the system",
                timing="Day 3",
                rationale="Frame the value matched to the product and persona.",
                evidence_chips=chips,
            ),
        ]
        return StrategyResult(
            current_goal=ctx.deal.current_goal,
            buyer_profile={"summary": "fixture buyer profile (fake engine)"},
            persona_scores=[
                PersonaScore(
                    persona="roi_investor",
                    weight=0.6,
                    strength="moderate",
                    evidence_refs=[f"opened the quote {opens}x", f"{won} comparable deals won by this org"],
                ),
                PersonaScore(
                    persona="budget_sensitive",
                    weight=0.4,
                    strength="weak",
                    evidence_refs=["asked about monthly payment in a prior touch"],
                ),
            ],
            top_motivations=["save money", "energy independence"],
            objections=["upfront_cost"],
            steps=steps,
            engine="fake",
            creative_plays=fallback_creative_plays() if include_creative_plays else [],
        )

    def draft(self, ctx: EngineContext, step: Step) -> str:
        return f"[fake draft] Hi {ctx.customer.name}, re: your quote — {step.rationale}"

    def revise(
        self, ctx: EngineContext, step: Step, instruction: str, include_creative_plays: bool = False
    ) -> RevisionResult:
        # Close the loop: attach the instruction as a visible note on the step.
        revised = step.model_copy(deep=True)
        revised.revision_notes = [*step.revision_notes, instruction]
        plays = fallback_creative_plays() if include_creative_plays else []
        return RevisionResult(
            applied=True,
            step=revised,
            reason=f"Updated this step — {instruction}",
            creative_plays=plays,
        )


def get_engine(name: str | None = None) -> StrategyEngine:
    """Pick the strategy engine. Precedence: explicit `name` (FE dropdown) > NG_ENGINE
    env > default "voltagent" (the primary engine for the demo).

    - "voltagent": call M's VoltAgent HTTP service (:3141); falls back to FakeEngine
      internally when the agent is unreachable and REONIC_AGENT_STRICT != "true".
    - "python":    the local Python engine (Engine A); needs OPENAI_API_KEY, else FakeEngine.
    - "fake":      deterministic fixture (CI/tests, no key needed).
    """
    choice = (name or os.getenv("NG_ENGINE") or "voltagent").lower()

    if choice == "fake" or os.getenv("NG_USE_FAKE_ENGINE") == "1":
        return FakeEngine()

    if choice == "python":
        if os.getenv("OPENAI_API_KEY"):
            try:
                from app.integration.real_engine import RealEngine

                return RealEngine()
            except Exception:  # engine import/path issue → never break the endpoint
                pass
        return FakeEngine()

    # default: voltagent
    try:
        from app.integration.voltagent_engine import VoltAgentEngine

        return VoltAgentEngine()
    except Exception:
        return FakeEngine()
