"""#1: deterministic benchmark facts the model may cite by id (never invent).

Lift is computed from a hand-built pool of this installer's past deal outcomes,
one labeled pool per metric: each entry is (metric_matched, deal_won). The keys
are the citable ref ids — the model gets these ids + numbers in the prompt and may
only reference them; `validate_strategy(allowed_refs=...)` rejects anything else.

ponytail: static mock pool — swap for real won/lost aggregates when the DB has
outcome data; the engine only consumes build_benchmarks()/allowed_refs().
"""

from __future__ import annotations

from engine.deterministic import Benchmark, compute_benchmark

# (metric_matched, deal_won) per metric. Skewed so the matched cohort wins more,
# mirroring the research benchmarks (fast follow-up / site visit / financing help).
_POOLS: dict[str, list[tuple[bool, bool]]] = {
    "call_within_24h": [
        (True, True), (True, True), (True, True), (True, False),
        (False, True), (False, False), (False, False), (False, False),
    ],
    "site_visit_done": [
        (True, True), (True, True), (True, False),
        (False, True), (False, False), (False, False), (False, False),
    ],
    "financing_offered": [
        (True, True), (True, True), (True, False), (True, False),
        (False, False), (False, False), (False, True), (False, False),
    ],
}


def build_benchmarks() -> dict[str, Benchmark]:
    """Compute each benchmark's win-lift from its labeled pool, keyed by ref id."""
    return {ref: compute_benchmark(ref, pool) for ref, pool in _POOLS.items()}


def allowed_refs() -> set[str]:
    """The set of benchmark ids the model is permitted to cite."""
    return set(_POOLS)
