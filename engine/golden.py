"""Six golden prospect fixtures (research summary section "Mock CRM Dataset").

Hand-built mock deals, one per evidence-backed scenario. Used as the regression
set for persona scoring and strategy generation.
"""

from __future__ import annotations

from datetime import datetime

from engine.models import (
    Channel,
    CompetitorPressure,
    Customer,
    Deal,
    DealStage,
    Direction,
    GoldenProspect,
    Note,
    Product,
    ProductType,
    Quote,
    Signal,
    SignalType,
    Touch,
)

ORG_ID = "org_demo"
INSTALLER_ID = "inst_demo"


def _dt(s: str) -> datetime:
    return datetime.fromisoformat(s)


def load_golden_prospects() -> list[GoldenProspect]:
    """Return the six golden prospects."""
    return [_munich(), _hamburg(), _nrw(), _saxony(), _bw(), _berlin()]


def _munich() -> GoldenProspect:
    cid, qid, did = "c_munich", "q_munich", "d_munich"
    return GoldenProspect(
        customer=Customer(
            id=cid, org_id=ORG_ID, assigned_installer_id=INSTALLER_ID,
            name="Sabine Mueller", region="Munich", locale="de-DE",
            contact_channels=[Channel.email, Channel.call],
            current_energy_bill=2300, distance_to_installer_km=12,
        ),
        quote=Quote(
            id=qid, customer_id=cid,
            products=[Product(type=ProductType.solar_pv, spec="9.6 kWp"),
                      Product(type=ProductType.battery, spec="10 kWh")],
            total_price=38400, currency="EUR", sent_at=_dt("2026-06-10T09:00:00"),
            est_savings_per_year=2300, payback_years=11.5, roi_pct=8.7,
        ),
        deal=Deal(id=did, customer_id=cid, quote_id=qid, installer_id=INSTALLER_ID,
                  stage=DealStage.engaged, last_activity_at=_dt("2026-06-18T16:00:00")),
        signals=[Signal(id="s1", deal_id=did, type=SignalType.email_opened,
                        timestamp=_dt("2026-06-12T08:00:00"), count=4)],
        notes=[Note(id="n1", deal_id=did, author_id=INSTALLER_ID,
                    content="Asked about 'monthly payment' and flagged a competitor quote.",
                    timestamp=_dt("2026-06-15T10:00:00"))],
        competitor=CompetitorPressure(competitor_name="SolarX", competitor_price=41200),
    )


def _hamburg() -> GoldenProspect:
    cid, qid, did = "c_hamburg", "q_hamburg", "d_hamburg"
    return GoldenProspect(
        customer=Customer(
            id=cid, org_id=ORG_ID, assigned_installer_id=INSTALLER_ID,
            name="Jonas Petersen", region="Hamburg", locale="de-DE",
            contact_channels=[Channel.email, Channel.whatsapp],
            distance_to_installer_km=8,
        ),
        quote=Quote(
            id=qid, customer_id=cid,
            products=[Product(type=ProductType.battery, spec="15 kWh"),
                      Product(type=ProductType.ev_charger, spec="11 kW")],
            total_price=18900, currency="EUR", sent_at=_dt("2026-06-05T11:00:00"),
            est_savings_per_year=1400,
        ),
        deal=Deal(id=did, customer_id=cid, quote_id=qid, installer_id=INSTALLER_ID,
                  stage=DealStage.engaged, last_activity_at=_dt("2026-06-17T12:00:00")),
        notes=[Note(id="n1", deal_id=did, author_id=INSTALLER_ID,
                    content="Wants maximum independence from the grid; asked about autarky %.",
                    timestamp=_dt("2026-06-14T09:00:00"))],
    )


def _nrw() -> GoldenProspect:
    cid, qid, did = "c_nrw", "q_nrw", "d_nrw"
    return GoldenProspect(
        customer=Customer(
            id=cid, org_id=ORG_ID, assigned_installer_id=INSTALLER_ID,
            name="Familie Schmidt", region="NRW", locale="de-DE",
            contact_channels=[Channel.email, Channel.call],
            current_energy_bill=2800,
        ),
        quote=Quote(
            id=qid, customer_id=cid,
            products=[Product(type=ProductType.heat_pump, spec="12 kW"),
                      Product(type=ProductType.solar_pv, spec="8 kWp")],
            total_price=29500, currency="EUR", sent_at=_dt("2026-06-08T10:00:00"),
            est_savings_per_year=1900,
        ),
        deal=Deal(id=did, customer_id=cid, quote_id=qid, installer_id=INSTALLER_ID,
                  stage=DealStage.negotiating, last_activity_at=_dt("2026-06-16T14:00:00")),
        notes=[Note(id="n1", deal_id=did, author_id=INSTALLER_ID,
                    content="Worried the heat pump won't keep up in winter and monthly cost.",
                    timestamp=_dt("2026-06-13T15:00:00"))],
    )


def _saxony() -> GoldenProspect:
    cid, qid, did = "c_saxony", "q_saxony", "d_saxony"
    return GoldenProspect(
        customer=Customer(
            id=cid, org_id=ORG_ID, assigned_installer_id=INSTALLER_ID,
            name="Herr Becker", region="Saxony", locale="de-DE",
            contact_channels=[Channel.call],
            distance_to_installer_km=35,
        ),
        quote=Quote(
            id=qid, customer_id=cid,
            products=[Product(type=ProductType.solar_pv, spec="7 kWp")],
            total_price=15200, currency="EUR", sent_at=_dt("2026-06-06T09:00:00"),
        ),
        deal=Deal(id=did, customer_id=cid, quote_id=qid, installer_id=INSTALLER_ID,
                  stage=DealStage.quote_sent, last_activity_at=_dt("2026-06-11T09:00:00")),
        notes=[Note(id="n1", deal_id=did, author_id=INSTALLER_ID,
                    content="Old roof; nervous about damage and who is liable if it leaks.",
                    timestamp=_dt("2026-06-10T11:00:00"))],
    )


def _bw() -> GoldenProspect:
    cid, qid, did = "c_bw", "q_bw", "d_bw"
    return GoldenProspect(
        customer=Customer(
            id=cid, org_id=ORG_ID, assigned_installer_id=INSTALLER_ID,
            name="Lena Hofmann", region="Baden-Wuerttemberg", locale="de-DE",
            contact_channels=[Channel.email],
        ),
        quote=Quote(
            id=qid, customer_id=cid,
            products=[Product(type=ProductType.solar_pv, spec="10 kWp"),
                      Product(type=ProductType.battery, spec="8 kWh")],
            total_price=32000, currency="EUR", sent_at=_dt("2026-06-09T10:00:00"),
            co2_offset_tons=4.2, payback_years=12.0,
        ),
        deal=Deal(id=did, customer_id=cid, quote_id=qid, installer_id=INSTALLER_ID,
                  stage=DealStage.engaged, last_activity_at=_dt("2026-06-17T18:00:00")),
        notes=[Note(id="n1", deal_id=did, author_id=INSTALLER_ID,
                    content="Climate is her main driver but partner wants to review the ROI first.",
                    timestamp=_dt("2026-06-15T20:00:00"))],
    )


def _berlin() -> GoldenProspect:
    cid, qid, did = "c_berlin", "q_berlin", "d_berlin"
    return GoldenProspect(
        customer=Customer(
            id=cid, org_id=ORG_ID, assigned_installer_id=INSTALLER_ID,
            name="Max Wagner", region="Berlin", locale="de-DE",
            contact_channels=[Channel.email], tracking_consent=False,
        ),
        quote=Quote(
            id=qid, customer_id=cid,
            products=[Product(type=ProductType.solar_pv, spec="6 kWp")],
            total_price=13500, currency="EUR", sent_at=_dt("2026-05-20T10:00:00"),
        ),
        deal=Deal(id=did, customer_id=cid, quote_id=qid, installer_id=INSTALLER_ID,
                  stage=DealStage.quote_sent, last_activity_at=_dt("2026-05-22T10:00:00")),
        touches=[Touch(id="t1", deal_id=did, channel=Channel.email,
                       direction=Direction.outbound, timestamp=_dt("2026-05-22T10:00:00"),
                       summary="Sent quote, no reply since.")],
        signals=[Signal(id="s1", deal_id=did, type=SignalType.no_response,
                        timestamp=_dt("2026-06-20T00:00:00"), count=29)],
    )
