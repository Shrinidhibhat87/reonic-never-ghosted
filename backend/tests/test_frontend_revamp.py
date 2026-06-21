"""Endpoints added for the frontend revamp: notes, appointments, lead signals."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_add_note_persists_and_returns(seeded):
    resp = client.post("/deals/1/notes", json={"content": "customer mentioned roof shading"})
    assert resp.status_code == 200
    note = resp.json()
    assert note["content"] == "customer mentioned roof shading"
    assert note["type"] == "text"

    # it shows up on the deal detail
    notes = client.get("/deals/1").json()["notes"]
    assert any(n["content"] == "customer mentioned roof shading" for n in notes)


def test_add_note_unknown_deal_404(seeded):
    assert client.post("/deals/99999/notes", json={"content": "x"}).status_code == 404


def test_leads_carry_ghost_risk_and_strategy_flag(seeded):
    leads = client.get("/installers/1/leads").json()
    assert leads
    lead = leads[0]
    assert 0.0 <= lead["ghost_risk"] <= 1.0
    assert lead["days_since_touch"] >= 0
    assert isinstance(lead["has_strategy"], bool)


def test_appointments_seed_has_one_gap_filled_by_post(seeded):
    week = client.get("/installers/1/appointments").json()
    slots = len(week["days"]) * len(week["slots"])
    assert len(week["appointments"]) == slots - 1  # exactly one open gap

    appt = client.post("/appointments", json={"title": "Call: re-engage", "deal_id": 1}).json()
    assert appt["title"] == "Call: re-engage"
    assert appt["deal_id"] == 1

    week2 = client.get("/installers/1/appointments").json()
    assert len(week2["appointments"]) == slots  # gap is now filled
