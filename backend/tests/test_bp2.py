from fastapi.testclient import TestClient
from sqlmodel import select

from app.main import app
from app.models import Customer, StrategyEvent

client = TestClient(app)


def test_benchmarks_are_raw_counts(seeded, session):
    org_id = session.exec(select(Customer.org_id)).first()
    resp = client.get(f"/orgs/{org_id}/benchmarks")
    assert resp.status_code == 200
    counts = resp.json()
    # seed makes 100 terminal deals split across won/lost/ghosted
    assert sum(counts.values()) == 100


def test_generate_persists_and_logs(seeded, session):
    resp = client.post("/deals/1/strategy")
    assert resp.status_code == 200
    body = resp.json()
    assert body["steps"]
    # trust before the ask: first step is build_trust
    assert body["steps"][0]["goal"] == "build_trust"
    # benchmark chip number is data-sourced, not invented
    chip = next(c for s in body["steps"] for c in s["evidence_chips"] if c["kind"] == "benchmark")
    assert chip["ref"] is not None

    # persisted: deal detail now surfaces persona + strategy
    detail = client.get("/deals/1").json()
    assert detail["persona"] is not None
    assert detail["strategy"] is not None

    # append-only log got a generate event
    events = session.exec(select(StrategyEvent).where(StrategyEvent.deal_id == 1)).all()
    assert any(e.event_type == "generate" for e in events)


def test_draft_and_revise_append(seeded, session):
    client.post("/deals/2/strategy")
    draft = client.post("/deals/2/steps/1/draft")
    assert draft.status_code == 200
    assert draft.json()["message"]

    before = client.post("/deals/2/strategy").json()["steps"][0]
    rev = client.post("/deals/2/steps/1/revise", json={"instruction": "make it warmer"})
    assert rev.status_code == 200
    assert rev.json()["applied"] is True

    # the loop closes: the returned step carries the installer note
    revised = rev.json()["step"]
    assert revised != before
    assert "make it warmer" in revised["revision_notes"]

    # and the note is persisted into the play, not just echoed back
    persisted = client.get("/deals/2").json()["strategy"]["steps"]
    step1 = next(s for s in persisted if s["order"] == 1)
    assert "make it warmer" in step1["revision_notes"]

    types = {
        e.event_type
        for e in session.exec(select(StrategyEvent).where(StrategyEvent.deal_id == 2)).all()
    }
    assert {"generate", "draft", "revise"} <= types


def test_draft_without_strategy_404(seeded):
    # deal 5 has no strategy generated
    assert client.post("/deals/5/steps/1/draft").status_code == 404
