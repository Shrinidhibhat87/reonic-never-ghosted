"""Real engine behind the seam (AP2): map EngineContext <-> the `engine/` package.

The backend's `EngineContext` (SQLModel rows) is adapted into the engine's
`GoldenProspect`, run through `generate_traced` (repair loop + guardrails), and the
resulting `engine.Strategy` is mapped back onto the backend's `StrategyResult`.

Lever/Goal enums share values across both layers, so they map by `.value`. The
backend `Step` is thinner than the engine's, so title/script/timing are folded
into `rationale` (richer FE contract is AP5, deferred).

ponytail: only `generate` is wired — the "create strategy" button. draft/revise
still delegate to FakeEngine until the FE needs them.
"""

from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

# The engine package lives at the repo root, not under backend/. Put it on the path.
_ROOT = Path(__file__).resolve().parents[3]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from app.integration.engine import (  # noqa: E402
    EngineContext,
    EvidenceChip,
    FakeEngine,
    PersonaScore,
    Step,
    StrategyResult,
)
from app.models.enums import Goal, PersuasionLever  # noqa: E402

# task_type (engine) -> channel string the FE/backend uses.
_CHANNEL = {
    "phone_call": "call",
    "send_email": "email",
    "meeting_in_person": "meeting",
    "whatsapp_video": "whatsapp",
    "send_gift": "email",
}


def _naive(dt: datetime) -> datetime:
    """Engine math mixes with naive demo datetimes; drop tzinfo to avoid clashes."""
    return dt.replace(tzinfo=None) if dt and dt.tzinfo else dt


def _to_prospect(ctx: EngineContext):
    """EngineContext (app rows) -> engine.GoldenProspect."""
    from engine.models import (
        Channel,
        CompetitorPressure,
        Customer,
        Deal,
        DealStage,
        GoldenProspect,
        Note,
        Product,
        ProductType,
        Quote,
        Signal,
        SignalType,
    )

    c, q, d = ctx.customer, ctx.quote, ctx.deal
    did = str(d.id)
    channels = [Channel(ch) for ch in (c.contact_channels or []) if ch in Channel.__members__ or ch in [e.value for e in Channel]] or [Channel.email]
    products = [Product(type=ProductType(p["type"]), spec=p.get("spec", ""),
                        qty=p.get("qty", 1)) for p in q.products] or \
        [Product(type=ProductType.solar_pv, spec="")]

    customer = Customer(
        id=str(c.id), org_id=str(c.org_id), assigned_installer_id=str(c.assigned_installer_id),
        name=c.name, region=c.region, locale=c.locale or "de-DE",
        contact_channels=channels,
        current_energy_bill=c.current_energy_bill,
        distance_to_installer_km=c.distance_to_installer_km,
    )
    quote = Quote(
        id=str(q.id), customer_id=str(c.id), products=products,
        total_price=q.total_price, currency=q.currency, sent_at=_naive(q.sent_at),
        est_savings_per_year=q.est_savings_per_year, payback_years=q.payback_years,
        roi_pct=q.roi_pct, co2_offset_tons=q.co2_offset_tons,
    )
    deal = Deal(
        id=did, customer_id=str(c.id), quote_id=str(q.id),
        installer_id=str(d.installer_id), stage=DealStage(d.stage.value),
        last_activity_at=_naive(d.last_activity_at),
    )
    signals = [Signal(id=str(s.id), deal_id=did, type=SignalType(s.type.value),
                      timestamp=_naive(s.timestamp), count=s.value) for s in ctx.signals]
    notes = [Note(id=str(n.id), deal_id=did, author_id=str(n.author_id),
                  content=n.content, timestamp=_naive(n.timestamp)) for n in ctx.notes]
    competitor = None
    if ctx.competitor:
        competitor = CompetitorPressure(
            competitor_name=ctx.competitor.get("competitor_name", "competitor"),
            competitor_price=ctx.competitor.get("competitor_price", 0.0),
        )
    return GoldenProspect(customer=customer, quote=quote, deal=deal,
                          notes=notes, signals=signals, competitor=competitor)


def _to_result(strategy) -> StrategyResult:
    """engine.Strategy -> backend.StrategyResult (Step is thinner; fold rich text in)."""
    bp = strategy.buyer_profile
    steps = []
    for i, s in enumerate(strategy.steps, start=1):
        rationale = f"{s.why}\n\n{s.script}".strip()
        steps.append(Step(
            order=i, goal=Goal(s.goal.value), lever=PersuasionLever(s.primary_lever.value),
            channel=_CHANNEL.get(s.task_type.value, s.task_type.value), rationale=rationale,
            title=s.title, timing=s.suggested_timing,
            evidence_chips=[EvidenceChip(kind=c.kind.value, text=c.label, ref=c.ref)
                            for c in s.evidence_chips],
        ))
    return StrategyResult(
        current_goal=Goal(strategy.current_goal.value),
        buyer_profile={"summary": strategy.summary, **bp.model_dump(mode="json")},
        persona_scores=[PersonaScore(persona=p.persona.value, weight=p.weight,
                                     strength=p.strength, evidence_refs=p.evidence_refs)
                        for p in bp.personas],
        top_motivations=bp.top_motivations,
        objections=[o.value for o in bp.objections],
        steps=steps,
        engine="python",
    )


class RealEngine:
    """Engine A behind the Protocol. `llm` injectable for tests; real one is OpenAI."""

    def __init__(self, llm=None) -> None:
        self._llm = llm
        self._fake = FakeEngine()  # draft/revise fall back here for now

    def generate(self, ctx: EngineContext, include_creative_plays: bool = False) -> StrategyResult:
        from engine.benchmarks import allowed_refs, build_benchmarks
        from engine.strategy import generate_traced

        llm = self._llm
        if llm is None:
            from engine.llm import openai_llm
            llm = openai_llm()
        prospect = _to_prospect(ctx)
        strategy, _violations = generate_traced(
            prospect, llm=llm, allowed_refs=allowed_refs(),
            benchmarks=build_benchmarks(), now=datetime.now(), max_repairs=1)
        result = _to_result(strategy)
        if include_creative_plays:
            from app.integration.engine import fallback_creative_plays
            result.creative_plays = fallback_creative_plays()
        return result

    def draft(self, ctx: EngineContext, step: Step) -> str:
        return self._fake.draft(ctx, step)

    def revise(self, ctx: EngineContext, step: Step, instruction: str, include_creative_plays: bool = False):
        return self._fake.revise(ctx, step, instruction, include_creative_plays)
