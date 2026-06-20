"""P1: deterministic core. No AI. These numbers must be reproducible + testable."""

from datetime import datetime

from engine.deterministic import (
    Goal,
    RevisionCheck,
    Temperature,
    check_revision,
    compute_benchmark,
    engagement_temperature,
    ghost_risk,
    next_goal,
)
from engine.models import Signal, SignalType

NOW = datetime(2026, 6, 20, 12, 0, 0)


# --- engagement temperature & ghost risk ---

def _sig(t: SignalType, day: int, count: int | None = None) -> Signal:
    return Signal(id="s", deal_id="d", type=t,
                  timestamp=datetime(2026, 6, day, 9, 0, 0), count=count)


def test_temperature_hot_when_recent_and_engaged():
    temp = engagement_temperature(
        last_activity_at=datetime(2026, 6, 19, 9, 0),
        signals=[_sig(SignalType.email_opened, 18, count=4)],
        now=NOW,
    )
    assert temp is Temperature.hot


def test_temperature_cold_after_long_silence():
    temp = engagement_temperature(
        last_activity_at=datetime(2026, 5, 22, 9, 0),
        signals=[_sig(SignalType.no_response, 20, count=29)],
        now=NOW,
    )
    assert temp is Temperature.cold


def test_ghost_risk_is_monotonic_in_silence():
    quiet = ghost_risk(datetime(2026, 6, 18, 12, 0), now=NOW)
    silent = ghost_risk(datetime(2026, 5, 22, 12, 0), now=NOW)
    assert 0.0 <= quiet < silent <= 1.0


# --- benchmark aggregation ---

def test_compute_benchmark_lift_when_matched_wins_more():
    # (matched_metric, won)
    labeled = [(True, True), (True, True), (True, False),
               (False, False), (False, False), (False, True)]
    bench = compute_benchmark("call_within_24h", labeled)
    assert bench.sample_size == 6
    # matched win rate 2/3, base 1/3 -> ~2x
    assert bench.lift is not None and round(bench.lift, 2) == 2.0


def test_compute_benchmark_no_base_wins_does_not_divide_by_zero():
    labeled = [(True, True), (False, False)]
    bench = compute_benchmark("x", labeled)
    assert bench.lift is None  # undefined, not a crash


# --- goal arc ---

def test_next_goal_advances_one_step():
    assert next_goal(Goal.build_trust, cooled=False) is Goal.establish_value


def test_next_goal_resets_to_trust_when_cooled():
    assert next_goal(Goal.close_gap, cooled=True) is Goal.build_trust


def test_next_goal_caps_at_final():
    assert next_goal(Goal.ask_for_commitment, cooled=False) is Goal.ask_for_commitment


# --- revision validation ---

def test_check_revision_flags_unknown_euro_amount():
    res = check_revision("just match the €99,999 competitor offer",
                         supported_amounts={38400, 41200})
    assert isinstance(res, RevisionCheck)
    assert res.supported is False
    assert 99999 in res.unknown_amounts


def test_check_revision_supported_when_no_unsupported_numbers():
    res = check_revision("drop the financing step, lead with the €41,200 comparison",
                         supported_amounts={38400, 41200})
    assert res.supported is True
    assert res.unknown_amounts == []
