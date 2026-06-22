from fastapi.testclient import TestClient
from sqlalchemy import func
from sqlmodel import select

from app.main import app
from app.models import Deal, Installer, Org, Signal

client = TestClient(app)


def _count(session, model) -> int:
    return session.exec(select(func.count()).select_from(model)).one()


def test_seed_counts_are_deterministic(seeded, session):
    assert seeded == {"orgs": 1, "installers": 2, "active_deals": 20, "terminal_deals": 100}
    assert _count(session, Org) == 1
    assert _count(session, Installer) == 2
    assert _count(session, Deal) == 120
    assert _count(session, Signal) > 0


def test_leads_endpoint(seeded, session):
    installer_ids = [i.id for i in session.exec(select(Installer)).all()]
    total = 0
    for iid in installer_ids:
        resp = client.get(f"/installers/{iid}/leads")
        assert resp.status_code == 200
        leads = resp.json()
        total += len(leads)
        if leads:
            lead = leads[0]
            assert {"deal_id", "customer_name", "stage", "total_price", "products"} <= lead.keys()
    assert total == 120  # every deal belongs to one of the two installers


def test_deal_detail(seeded):
    resp = client.get("/deals/1")
    assert resp.status_code == 200
    body = resp.json()
    assert body["deal"]["id"] == 1
    assert body["customer"]["name"]
    assert body["quote"]["total_price"] > 0
    assert body["persona"] is None  # not populated until BP2


def test_deal_detail_404(seeded):
    assert client.get("/deals/999999").status_code == 404
