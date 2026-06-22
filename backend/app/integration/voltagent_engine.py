"""Primary engine: call M's VoltAgent HTTP service and map it onto the backend seam.

VoltAgent (`agent/`, a TS service on :3141) is a *next-best-action* recommender —
it returns one recommendation (buyer profile + the single best action + reasoning),
not a multi-step plan. This adapter does what the old Express `agentMapper.ts` did:

    EngineContext (SQLModel rows)
      -> RecommendRequest JSON  (POST /api/recommend-next-action)
      -> RecommendationResponse
      -> StrategyResult          (primary step + alternatives as later touches)

If the agent is unreachable we fall back to `FakeEngine` so the endpoint never
500s during a demo — unless REONIC_AGENT_STRICT=true, which fails loudly instead.

ponytail: draft/revise delegate to FakeEngine. The agent supports an
`installer_revision_requested` trigger; wire revise to it when the FE needs a real
agent-driven revision (mapping a whole recommendation back onto one step is the work).
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime
from typing import Any

import httpx

from app.integration.engine import (
    CreativePlay,
    EngineContext,
    EvidenceChip,
    FakeEngine,
    PersonaScore,
    RevisionResult,
    Step,
    StrategyResult,
    fallback_creative_plays,
)
from app.models.enums import Goal, PersuasionLever

_DEFAULT_AGENT_URL = "http://localhost:3141"
_TIMEOUT_S = float(os.getenv("REONIC_AGENT_TIMEOUT_MS", "90000")) / 1000.0

# VoltAgent TaskType -> backend channel string the FE renders.
_CHANNEL = {
    "Phone Call": "call",
    "Send Email": "email",
    "Meeting in person": "meeting",
    "Send WhatsApp Video Message": "whatsapp",
    "Send Gift": "gift",
}
# VoltAgent TaskType -> a plausible persuasion lever (the agent doesn't emit one).
_LEVER = {
    "Phone Call": PersuasionLever.proximity_trust,
    "Meeting in person": PersuasionLever.proximity_trust,
    "Send Email": PersuasionLever.roi_financial,
    "Send WhatsApp Video Message": PersuasionLever.social_proof,
    "Send Gift": PersuasionLever.peace_of_mind,
}


def _agent_url() -> str:
    return (os.getenv("REONIC_AGENT_URL") or _DEFAULT_AGENT_URL).rstrip("/")


def _iso(dt: datetime | None) -> str | None:
    return dt.isoformat() if dt else None


def _strength(confidence: float) -> str:
    return "strong" if confidence >= 0.66 else "moderate" if confidence >= 0.33 else "weak"


def _to_request(ctx: EngineContext, *, trigger_type: str, instruction: str | None = None) -> dict[str, Any]:
    """EngineContext -> RecommendRequest JSON (must pass the agent's Zod schema)."""
    c, q, d = ctx.customer, ctx.quote, ctx.deal
    trigger: dict[str, Any] = {"type": trigger_type}
    if instruction:
        trigger["installerInstruction"] = instruction

    return {
        "requestId": str(uuid.uuid4()),
        "now": datetime.now().isoformat(),
        "trigger": trigger,
        "installer": {
            "id": str(d.installer_id),
            "companyName": f"Installer {d.installer_id}",
            "region": c.region,
            "timezone": "Europe/Berlin",
        },
        "customer": {
            "id": str(c.id),
            "name": c.name,
            "language": (c.locale or "de")[:2],
            "preferredFormality": "formal",
            "address": c.region,
        },
        "quote": {
            "id": str(q.id),
            "status": "sent",
            "sentAt": _iso(q.sent_at),
            "validUntil": _iso(q.valid_until),
            "scope": [p.get("type", "") for p in (q.products or [])],
            "totalGross": q.total_price,
            "currency": q.currency,
            "lineItems": [
                {"label": p.get("type", "item"), "amountGross": None, "optional": False}
                for p in (q.products or [])
            ],
        },
        # Be generous with consent so the agent isn't channel-blocked in the demo.
        "consent": {"email": True, "phone": True, "whatsapp": True, "tracking": True},
        "history": {
            "communications": [
                {
                    "occurredAt": _iso(t.timestamp),
                    "direction": t.direction.value,
                    "channel": t.channel.value,
                    "summary": t.summary or "",
                    **({"body": t.body} if t.body else {}),
                }
                for t in ctx.touches
            ],
            "actions": [],
            "debriefs": [],
            "files": [],
        },
        "assistantState": {
            # surface behavioural signals (email_opened, ...) so the agent can weigh them
            "activeBuyerSignals": sorted({s.type.value for s in ctx.signals}),
            "activeObjections": [],
        },
    }


def _to_result(ctx: EngineContext, resp: dict[str, Any], *, include_creative_plays: bool) -> StrategyResult:
    """RecommendationResponse -> StrategyResult."""
    bp = resp.get("buyerProfile", {})
    reasoning = resp.get("reasoning", {})
    nba = resp.get("nextBestAction", {})
    goal = ctx.deal.current_goal

    # Primary step from the next best action.
    task = nba.get("taskType", "Send Email")
    plan = nba.get("agendaOrMessagePlan", []) or []
    rationale = "\n".join([reasoning.get("summary", "")] + [f"• {p}" for p in plan]).strip()
    chips = [
        EvidenceChip(kind="behavioral", text=f"{f.get('factor', '')}: {f.get('detail', '')}".strip(": "))
        for f in reasoning.get("decisionFactors", [])[:3]
    ]
    steps = [
        Step(
            order=1,
            goal=goal,
            lever=_LEVER.get(task, PersuasionLever.objection_handling),
            channel=_CHANNEL.get(task, "email"),
            title=nba.get("title") or task,
            timing=nba.get("timing"),
            rationale=rationale or f"Recommended next action: {task}.",
            evidence_chips=chips,
        )
    ]
    # Alternatives become later, lower-priority touches in the timeline.
    for i, alt in enumerate(reasoning.get("alternatives", [])[:3], start=2):
        atask = alt.get("taskType", "Send Email")
        steps.append(
            Step(
                order=i,
                goal=goal,
                lever=_LEVER.get(atask, PersuasionLever.objection_handling),
                channel=_CHANNEL.get(atask, "email"),
                title=f"Alternative: {atask}",
                timing="If the primary stalls",
                rationale=alt.get("whyNotFirst", ""),
            )
        )

    persona_scores = [
        PersonaScore(
            persona=sig.get("name", "signal"),
            weight=float(sig.get("confidence", 0.5)),
            strength=_strength(float(sig.get("confidence", 0.5))),
            evidence_refs=[sig.get("whyItMatters", "")],
        )
        for sig in bp.get("signals", [])
    ]

    plays: list[CreativePlay] = []
    if include_creative_plays:
        # If the agent itself reached for a gift, that's the headline creative play.
        if task == "Send Gift":
            plays.append(
                CreativePlay(
                    title=nba.get("title") or "Send a gift",
                    trigger=bp.get("primaryConcern", "agent-selected"),
                    why=reasoning.get("summary", "A tactile gesture where the obvious email won't land."),
                    channel="gift",
                )
            )
        plays.extend(fallback_creative_plays())

    return StrategyResult(
        current_goal=goal,
        buyer_profile={
            "summary": reasoning.get("summary") or resp.get("uiHints", {}).get("strategyHeadline", ""),
            "primary_concern": bp.get("primaryConcern"),
            "confidence": bp.get("confidence"),
            "risk_flags": bp.get("riskFlags", []),
            "missing_data": bp.get("missingData", []),
        },
        persona_scores=persona_scores,
        top_motivations=[s.get("name") for s in bp.get("signals", [])] or [bp.get("primaryConcern", "")],
        objections=[o.get("name", "") for o in bp.get("objections", [])],
        steps=steps,
        engine="voltagent",
        creative_plays=plays,
    )


class VoltAgentEngine:
    """StrategyEngine backed by the VoltAgent HTTP service (the primary engine)."""

    def __init__(self) -> None:
        self._fake = FakeEngine()

    def generate(self, ctx: EngineContext, include_creative_plays: bool = False) -> StrategyResult:
        payload = _to_request(ctx, trigger_type="strategy_requested")
        try:
            resp = httpx.post(
                f"{_agent_url()}/api/recommend-next-action", json=payload, timeout=_TIMEOUT_S
            )
            resp.raise_for_status()
            return _to_result(ctx, resp.json(), include_creative_plays=include_creative_plays)
        except Exception:
            if os.getenv("REONIC_AGENT_STRICT") == "true":
                raise
            # Never break the demo: fall back to the deterministic engine.
            result = self._fake.generate(ctx, include_creative_plays)
            result.engine = "voltagent (fallback)"
            return result

    def draft(self, ctx: EngineContext, step: Step) -> str:
        return self._fake.draft(ctx, step)

    def revise(
        self, ctx: EngineContext, step: Step, instruction: str, include_creative_plays: bool = False
    ) -> RevisionResult:
        return self._fake.revise(ctx, step, instruction, include_creative_plays)
