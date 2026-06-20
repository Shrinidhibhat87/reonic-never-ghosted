"""Deterministic core: facts the installer must trust. No AI here, ever.

Engagement temperature, ghost risk, benchmark lift, goal-arc transitions, and
revision validation. All pure functions over typed inputs, fully unit-tested.
"""

from __future__ import annotations

import re
from datetime import datetime
from enum import Enum

from pydantic import BaseModel

from engine.models import Signal, SignalType

GHOST_HORIZON_DAYS = 30.0

_POSITIVE_SIGNALS = {
    SignalType.email_opened, SignalType.email_replied, SignalType.link_clicked,
    SignalType.document_viewed, SignalType.site_visit, SignalType.call_inbound,
    SignalType.meeting_booked,
}


class Temperature(str, Enum):
    hot = "hot"
    warm = "warm"
    cold = "cold"


class Goal(str, Enum):
    build_trust = "build_trust"
    establish_value = "establish_value"
    create_urgency = "create_urgency"
    close_gap = "close_gap"
    ask_for_commitment = "ask_for_commitment"


# Ordering rule: trust before urgency before the ask (docs/metadata.md).
GOAL_ARC = [
    Goal.build_trust, Goal.establish_value, Goal.create_urgency,
    Goal.close_gap, Goal.ask_for_commitment,
]


class Benchmark(BaseModel):
    metric: str
    lift: float | None  # None = undefined (no base wins to compare against)
    sample_size: int


class RevisionCheck(BaseModel):
    supported: bool
    unknown_amounts: list[float]


def _days_since(ts: datetime, now: datetime) -> float:
    return (now - ts).total_seconds() / 86400.0


def engagement_temperature(
    last_activity_at: datetime, signals: list[Signal], *, now: datetime
) -> Temperature:
    """Hot/warm/cold from recency of activity and positive engagement."""
    days = _days_since(last_activity_at, now)
    no_resp = max((s.count or 0) for s in signals
                  if s.type is SignalType.no_response) if any(
        s.type is SignalType.no_response for s in signals) else 0
    if days > 14 or no_resp >= 14:
        return Temperature.cold
    has_positive = any(s.type in _POSITIVE_SIGNALS for s in signals)
    if days <= 3 and has_positive:
        return Temperature.hot
    return Temperature.warm


def ghost_risk(last_activity_at: datetime, *, now: datetime) -> float:
    """0..1 risk that the deal has gone quiet, linear in days of silence."""
    return min(max(_days_since(last_activity_at, now), 0.0) / GHOST_HORIZON_DAYS, 1.0)


def compute_benchmark(metric: str, labeled: list[tuple[bool, bool]]) -> Benchmark:
    """Lift = P(win | metric matched) / P(win | not matched). None if undefined."""
    matched = [won for m, won in labeled if m]
    base = [won for m, won in labeled if not m]
    rate_m = sum(matched) / len(matched) if matched else 0.0
    rate_b = sum(base) / len(base) if base else 0.0
    lift = rate_m / rate_b if rate_b > 0 else None
    return Benchmark(metric=metric, lift=lift, sample_size=len(labeled))


def next_goal(current: Goal, *, cooled: bool) -> Goal:
    """Advance one rung; reset to trust if the deal cooled (ghost risk up)."""
    if cooled:
        return Goal.build_trust
    idx = GOAL_ARC.index(current)
    return GOAL_ARC[min(idx + 1, len(GOAL_ARC) - 1)]


# ponytail: naive €-amount parse; upgrade to semantic check if revisions get rich.
_EURO = re.compile(r"€\s?(\d[\d.,]*)")


def _to_number(token: str) -> float:
    return float(token.replace(".", "").replace(",", ""))


def check_revision(text: str, supported_amounts: set[float]) -> RevisionCheck:
    """Flag any € figure in the installer's edit not backed by this deal's data."""
    cited = {_to_number(m) for m in _EURO.findall(text)}
    unknown = sorted(cited - {float(a) for a in supported_amounts})
    return RevisionCheck(supported=not unknown, unknown_amounts=unknown)
