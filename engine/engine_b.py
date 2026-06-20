"""P4: Engine B — the multi-call showpiece, run only on explicit "compare".

extract -> persona -> strategy -> critic. Each phase charges the budget and emits
a `phase` event into the same append-only log, so the frontend can render the
agent flow straight from that JSON. Output is the same validated Strategy as
Engine A. Phases are injected (real ones are tiered LLM calls; stubs in tests).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Callable

from engine.budget import Budget, Tier, pick_model
from engine.log import EventKind, StrategyEvent, StrategyLog, record
from engine.models import GoldenProspect
from engine.strategy import Strategy, StrategyInvariantError, validate_strategy

ENGINE_B_PHASES = ["extract", "persona", "strategy", "critic"]

# Rough per-phase token reservation by tier (real usage tightened by P5 caps).
_TOKENS = {Tier.cheap: 300, Tier.strong: 900}

Phase = Callable[[GoldenProspect, dict], Any]


def run_engine_b(
    prospect: GoldenProspect, *, phases: dict[str, Phase], budget: Budget,
    log: StrategyLog, allowed_refs: set[str], now: datetime | None = None,
) -> Strategy:
    """Run the four-phase flow under budget, emitting a phase event per step."""
    ts = now or datetime(2026, 6, 20, 12, 0, 0)
    deal_id = prospect.deal.id
    scratch: dict[str, Any] = {}
    final: Strategy | None = None

    for name in ENGINE_B_PHASES:
        budget.charge(_TOKENS[pick_model(name)], turn=True)  # raises -> caller degrades
        result = phases[name](prospect, scratch)
        scratch[name] = result
        log.append(StrategyEvent(deal_id=deal_id, kind=EventKind.phase,
                                 timestamp=ts, note=name))
        if isinstance(result, Strategy):
            final = result

    if final is None:
        raise StrategyInvariantError("Engine B produced no strategy")
    violations = validate_strategy(final, allowed_refs=allowed_refs)
    if violations:
        raise StrategyInvariantError("; ".join(violations))
    record(log, deal_id, final, EventKind.regenerated, now=ts)
    return final
