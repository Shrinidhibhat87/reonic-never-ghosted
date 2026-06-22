"""P5: per-deal cost guardrails. Hard token + turn caps; cheap/strong model tiers."""

from __future__ import annotations

from enum import Enum


class BudgetExceeded(RuntimeError):
    """Raised when a deal would exceed its token or turn cap."""


class Tier(str, Enum):
    cheap = "cheap"   # extraction, persona scoring
    strong = "strong"  # final strategy, critic


# Cheap model handles mechanical steps; strong only where judgment is the product.
_STRONG_TASKS = {"strategy", "critic"}


def pick_model(task: str) -> Tier:
    """Route a task to the cheapest tier that does the job."""
    return Tier.strong if task in _STRONG_TASKS else Tier.cheap


class Budget:
    """Tracks token + turn spend for one deal and refuses to overspend."""

    def __init__(self, max_tokens: int, max_turns: int):
        self.max_tokens = max_tokens
        self.max_turns = max_turns
        self.tokens_used = 0
        self.turns_used = 0

    @property
    def remaining_tokens(self) -> int:
        return self.max_tokens - self.tokens_used

    def charge(self, tokens: int, *, turn: bool = False) -> None:
        """Reserve budget for a call; raise before overspending (no partial charge)."""
        next_turns = self.turns_used + (1 if turn else 0)
        if next_turns > self.max_turns:
            raise BudgetExceeded(f"turn cap {self.max_turns} reached")
        if self.tokens_used + tokens > self.max_tokens:
            raise BudgetExceeded(
                f"token cap {self.max_tokens} would be exceeded "
                f"({self.tokens_used}+{tokens})")
        self.tokens_used += tokens
        self.turns_used = next_turns
