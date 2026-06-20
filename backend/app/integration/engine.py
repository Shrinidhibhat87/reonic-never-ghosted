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


class PersonaScore(BaseModel):
    persona: str
    weight: float
    strength: str


class Step(BaseModel):
    order: int
    goal: Goal
    lever: PersuasionLever
    channel: str
    rationale: str
    evidence_chips: list[EvidenceChip] = []


class StrategyResult(BaseModel):
    current_goal: Goal
    buyer_profile: dict[str, Any]
    persona_scores: list[PersonaScore]
    top_motivations: list[str]
    objections: list[str]
    steps: list[Step]


class RevisionResult(BaseModel):
    applied: bool
    step: Step
    reason: str


class StrategyEngine(Protocol):
    def generate(self, ctx: EngineContext) -> StrategyResult: ...
    def draft(self, ctx: EngineContext, step: Step) -> str: ...
    def revise(self, ctx: EngineContext, step: Step, instruction: str) -> RevisionResult: ...


class FakeEngine:
    """Deterministic stand-in. Derives plausible output from real context — no LLM."""

    def generate(self, ctx: EngineContext) -> StrategyResult:
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
                channel="email",
                rationale="Open with local credibility before any ask.",
                evidence_chips=chips,
            ),
            Step(
                order=2,
                goal=Goal.establish_value,
                lever=lever,
                channel="email",
                rationale="Frame the value matched to the product and persona.",
                evidence_chips=chips,
            ),
        ]
        return StrategyResult(
            current_goal=ctx.deal.current_goal,
            buyer_profile={"summary": "fixture buyer profile (fake engine)"},
            persona_scores=[PersonaScore(persona="roi_investor", weight=0.6, strength="moderate")],
            top_motivations=["save money", "energy independence"],
            objections=["upfront_cost"],
            steps=steps,
        )

    def draft(self, ctx: EngineContext, step: Step) -> str:
        return f"[fake draft] Hi {ctx.customer.name}, re: your quote — {step.rationale}"

    def revise(self, ctx: EngineContext, step: Step, instruction: str) -> RevisionResult:
        return RevisionResult(applied=True, step=step, reason=f"fake engine applied: {instruction}")


def get_engine() -> StrategyEngine:
    """Real engine when a key is configured; deterministic FakeEngine otherwise.

    Keeps CI/tests (no key) on the fixture engine; production with OPENAI_API_KEY
    set gets the live Engine A. Set NG_USE_FAKE_ENGINE=1 to force the fixture.
    """
    if os.getenv("OPENAI_API_KEY") and os.getenv("NG_USE_FAKE_ENGINE") != "1":
        try:
            from app.integration.real_engine import RealEngine

            return RealEngine()
        except Exception:  # engine import/path issue → never break the endpoint
            pass
    return FakeEngine()
