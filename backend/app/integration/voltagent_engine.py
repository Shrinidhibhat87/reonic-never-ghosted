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

import logging
import os
import uuid
from datetime import datetime
from typing import Any

import httpx

log = logging.getLogger("reonic.voltagent")

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
# backend Channel -> agent CommunicationSchema channel enum (email|phone|whatsapp|meeting|system|other).
_COMM_CHANNEL = {"email": "email", "call": "phone", "sms": "other", "whatsapp": "whatsapp", "meeting": "meeting"}

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


# Per-signal-type buying-intent weight. The agent only sees signal *types* and gives
# them all one flat confidence, which made every persona-mix bar read the same (~68%).
# We re-derive a differentiated weight from the type + observed count instead.
_SIGNAL_WEIGHT = {
    "email_replied": 0.9,
    "meeting_booked": 0.88,
    "site_visit": 0.85,
    "call_inbound": 0.82,
    "link_clicked": 0.6,
    "document_viewed": 0.55,
    "call_outbound": 0.45,
    "email_opened": 0.4,
    "no_response": 0.2,
}


def _behavioral_confidence(signals: Any) -> dict[str, float]:
    counts: dict[str, int] = {}
    for s in signals:
        t = s.type.value
        counts[t] = counts.get(t, 0) + (s.value or 1)
    out: dict[str, float] = {}
    for t, n in counts.items():
        base = _SIGNAL_WEIGHT.get(t, 0.5)
        out[t] = round(min(0.96, base + min(0.12, 0.04 * (n - 1))), 2)  # count nudges within the band, saturates
    return out


def _to_request(ctx: EngineContext, *, trigger_type: str, instruction: str | None = None) -> dict[str, Any]:
    """EngineContext -> RecommendRequest JSON (must pass the agent's Zod schema)."""
    c, q, d = ctx.customer, ctx.quote, ctx.deal
    trigger: dict[str, Any] = {"type": trigger_type}
    # Fold chosen personal touches into the instruction so the agent biases the plan
    # toward them. Free-text installer notes go in as debriefs below.
    touch_labels = [t.get("label") for t in (d.personal_touches or []) if isinstance(t, dict) and t.get("label")]
    parts = [instruction] if instruction else []
    if touch_labels:
        parts.append("Personal touches to weave in: " + ", ".join(touch_labels) + ".")
    combined = " ".join(p for p in parts if p).strip()
    if combined:
        trigger["installerInstruction"] = combined

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
            # amountGross omitted: the agent schema is z.number().optional(), which
            # rejects null (only undefined). Sending null here 400s the request.
            "lineItems": [{"label": p.get("type", "item"), "optional": False} for p in (q.products or [])],
        },
        # Be generous with consent so the agent isn't channel-blocked in the demo.
        "consent": {"email": True, "phone": True, "whatsapp": True, "tracking": True},
        "history": {
            "communications": [
                {
                    "occurredAt": _iso(t.timestamp),
                    "direction": t.direction.value,
                    "channel": _COMM_CHANNEL.get(t.channel.value, "other"),
                    "summary": t.summary or "",
                    **({"body": t.body} if t.body else {}),
                }
                for t in ctx.touches
                if t.timestamp  # occurredAt is required (min length 1); skip undated touches
            ],
            "actions": [],
            # Installer notes reach the agent as debriefs — its keyword/debrief rules read
            # notes + customerLanguage, so what the installer writes now shapes the plan.
            "debriefs": [
                {
                    "occurredAt": _iso(n.timestamp) or datetime.now().isoformat(),
                    "notes": n.content,
                    "customerLanguage": [n.content],
                }
                for n in ctx.notes
                if n.content
            ],
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

    # Differentiate behavioural-signal weights from real counts; keep the agent's own
    # confidence for KB-matched signals.
    sig_conf = _behavioral_confidence(ctx.signals)
    persona_scores = []
    for sig in bp.get("signals", []):
        weight = sig_conf.get(sig.get("id"), float(sig.get("confidence", 0.5)))
        persona_scores.append(
            PersonaScore(
                persona=sig.get("name", "signal"),
                weight=weight,
                strength=_strength(weight),
                evidence_refs=[sig.get("whyItMatters", "")],
            )
        )

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
        except httpx.HTTPStatusError as e:
            # Surface the agent's own error body (e.g. Zod 400 issues) — don't swallow it.
            log.warning("VoltAgent %s: %s", e.response.status_code, e.response.text[:500])
            if os.getenv("REONIC_AGENT_STRICT") == "true":
                raise
        except Exception as e:
            log.warning("VoltAgent unreachable: %r", e)
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
