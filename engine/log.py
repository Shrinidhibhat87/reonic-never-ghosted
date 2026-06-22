"""P3: append-only per-deal strategy log.

One JSONL file per deal. Every generate / regenerate / revise appends an event;
nothing is ever overwritten, so the file is both the thought-history ("why the
strategy evolved") and the flow trace P4 renders. Revisions are gated by the P1
deterministic check before a new strategy is produced.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Callable

from pydantic import BaseModel

from engine.deterministic import RevisionCheck, check_revision
from engine.strategy import Strategy


class EventKind(str, Enum):
    generated = "generated"
    regenerated = "regenerated"
    revised = "revised"
    revision_rejected = "revision_rejected"
    phase = "phase"  # Engine B flow steps (P4)


class StrategyEvent(BaseModel):
    deal_id: str
    kind: EventKind
    timestamp: datetime
    strategy: Strategy | None = None
    note: str | None = None  # the installer's revision text, or a phase label
    revision_check: RevisionCheck | None = None


class StrategyLog:
    """File-backed append-only event store, one JSONL per deal."""

    def __init__(self, base_dir: Path):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _path(self, deal_id: str) -> Path:
        return self.base_dir / f"{deal_id}.jsonl"

    def append(self, event: StrategyEvent) -> None:
        with self._path(event.deal_id).open("a") as f:
            f.write(event.model_dump_json() + "\n")

    def events(self, deal_id: str) -> list[StrategyEvent]:
        path = self._path(deal_id)
        if not path.exists():
            return []
        return [StrategyEvent.model_validate_json(line)
                for line in path.read_text().splitlines() if line.strip()]

    def latest_strategy(self, deal_id: str) -> Strategy | None:
        for event in reversed(self.events(deal_id)):
            if event.strategy is not None:
                return event.strategy
        return None


def record(
    log: StrategyLog, deal_id: str, strategy: Strategy, kind: EventKind, *,
    now: datetime | None = None,
) -> StrategyEvent:
    """Append a strategy event (generate/regenerate)."""
    event = StrategyEvent(deal_id=deal_id, kind=kind, strategy=strategy,
                          timestamp=now or datetime.now())
    log.append(event)
    return event


def apply_revision(
    log: StrategyLog, deal_id: str, revision_text: str, *,
    supported_amounts: set[float], regenerate: Callable[[str], Strategy],
    now: datetime | None = None,
) -> StrategyEvent:
    """Gate an installer revision on P1 checks, then append (never overwrite)."""
    ts = now or datetime.now()
    check = check_revision(revision_text, supported_amounts)
    if not check.supported:
        event = StrategyEvent(deal_id=deal_id, kind=EventKind.revision_rejected,
                              timestamp=ts, note=revision_text, revision_check=check)
        log.append(event)
        return event
    revised = regenerate(revision_text)
    event = StrategyEvent(deal_id=deal_id, kind=EventKind.revised, timestamp=ts,
                          strategy=revised, note=revision_text, revision_check=check)
    log.append(event)
    return event
