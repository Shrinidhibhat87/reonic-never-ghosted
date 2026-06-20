"""#1: benchmark pool gives real, deterministic refs the model may cite."""

from engine.benchmarks import allowed_refs, build_benchmarks


def test_build_benchmarks_returns_computed_facts_keyed_by_ref():
    bm = build_benchmarks()
    assert bm, "expected at least one benchmark"
    for ref, b in bm.items():
        assert b.metric == ref
        assert b.sample_size > 0


def test_call_within_24h_has_positive_lift():
    # Pool is hand-built so calling fast wins more often than not.
    b = build_benchmarks()["call_within_24h"]
    assert b.lift is not None and b.lift > 1.0


def test_allowed_refs_matches_benchmark_keys():
    assert allowed_refs() == set(build_benchmarks())
