"""Seeded synthetic dataset → Postgres. Fixed RNG so every run is identical.

Counts are deterministic and asserted in tests: 1 org, 2 installers,
20 active deals, 100 terminal deals (benchmark population).
"""

import random
from datetime import datetime, timedelta

from sqlmodel import Session

from app.models import (
    Customer,
    Deal,
    Installer,
    Note,
    Org,
    Quote,
    Signal,
    Touch,
)
from app.models.enums import (
    Channel,
    DealStage,
    Direction,
    NoteType,
    OrgSize,
    SignalType,
    Sophistication,
)

SEED = 42
NOW = datetime(2026, 6, 20)  # fixed "today" for reproducible timestamps
N_ACTIVE = 20
N_TERMINAL = 100

ACTIVE_STAGES = [
    DealStage.quote_sent,
    DealStage.engaged,
    DealStage.negotiating,
    DealStage.verbal_commit,
]
TERMINAL_STAGES = [DealStage.won, DealStage.lost, DealStage.ghosted]
PRODUCT_SETS = [
    [{"type": "solar_pv", "spec": "8 kWp", "qty": 1}],
    [{"type": "solar_pv", "spec": "10 kWp", "qty": 1}, {"type": "battery", "spec": "10 kWh", "qty": 1}],
    [{"type": "heat_pump", "spec": "12 kW", "qty": 1}],
    [
        {"type": "solar_pv", "spec": "12 kWp", "qty": 1},
        {"type": "battery", "spec": "10 kWh", "qty": 1},
        {"type": "ev_charger", "spec": "11 kW", "qty": 1},
    ],
]
PARTNERS = ["Voltaro GmbH", "SolarTeam Nord", "EnergieWerk Süd", "PV-Profis Berlin"]
REGIONS = ["Bavaria", "NRW", "Berlin", "Hesse", "Saxony"]
REGION_CITY = {"Bavaria": "München", "NRW": "Düsseldorf", "Berlin": "Berlin", "Hesse": "Frankfurt", "Saxony": "Dresden"}
STREETS = ["Sonnenberg", "Lerchenweg", "Provinostr.", "Rosenstr.", "Ahornweg", "Industriestr.", "Langweider Str."]
CONTACT_TIMES = ["weekday evenings after 18:00", "mornings before 09:00", "weekends only", "any time during work hours"]
FIRST = ["Anna", "Lukas", "Marie", "Jonas", "Lena", "Felix", "Sophie", "Paul", "Emma", "Max"]
LAST = ["Müller", "Schmidt", "Weber", "Wagner", "Becker", "Hofmann", "Koch", "Richter"]
_UMLAUT = str.maketrans({"ü": "ue", "ö": "oe", "ä": "ae", "ß": "ss"})


def _name(rng: random.Random) -> str:
    return f"{rng.choice(FIRST)} {rng.choice(LAST)}"


def _email(name: str) -> str:
    return name.lower().translate(_UMLAUT).replace(" ", ".") + "@email.de"


def _make_customer(rng: random.Random, org_id: int, installer_id: int) -> Customer:
    name = _name(rng)
    region = rng.choice(REGIONS)
    income = rng.choice(["low", "mid", "high"])
    channel = rng.choice(["Phone", "Email", "WhatsApp", "SMS"])
    budget_band = {"low": "€15k–25k", "mid": "€30k–40k", "high": "€45k–60k"}[income]
    financing = rng.choice(["wants monthly financing, sensitive to upfront cost", "comfortable paying upfront", "exploring KfW subsidy options"])
    return Customer(
        org_id=org_id,
        assigned_installer_id=installer_id,
        name=name,
        region=region,
        locale="de-DE",
        contact_channels=rng.sample(["email", "phone", "sms", "whatsapp"], k=rng.randint(1, 3)),
        channel_preference=channel,
        age=rng.randint(28, 70),
        household_type=rng.choice(["family", "single", "retiree", "couple"]),
        annual_income_band=income,
        current_energy_bill=round(rng.uniform(900, 3200), 2),
        home_ownership=rng.choice(["owner", "owner", "tenant"]),
        property_type=rng.choice(["detached", "semi", "apartment"]),
        distance_to_installer_km=round(rng.uniform(2, 60), 1),
        email=_email(name),
        phone=f"+49 {rng.randint(150, 179)} {rng.randint(1000000, 9999999)}",
        address=f"{rng.choice(STREETS)} {rng.randint(1, 99)}, {rng.randint(10000, 99999)} {REGION_CITY[region]}",
        contact_preference=f"{channel} — {rng.choice(CONTACT_TIMES)}",
        budget_note=f"{budget_band} · {financing}",
    )


def _make_quote(rng: random.Random, customer_id: int, sent_at: datetime) -> Quote:
    price = round(rng.uniform(8000, 45000), 2)
    return Quote(
        customer_id=customer_id,
        products=rng.choice(PRODUCT_SETS),
        total_price=price,
        currency="EUR",
        sent_at=sent_at,
        valid_until=sent_at + timedelta(days=30),
        financing_offered=rng.random() < 0.5,
        est_savings_per_year=round(price * rng.uniform(0.06, 0.12), 2),
        payback_years=round(rng.uniform(6, 14), 1),
        roi_pct=round(rng.uniform(5, 12), 1),
        co2_offset_tons=round(rng.uniform(2, 9), 1),
    )


def _add_history(rng: random.Random, deal: Deal, session: Session) -> None:
    """Plausible touch/note/signal history that implies a persona + objection."""
    n_signals = rng.randint(2, 6)
    for _ in range(n_signals):
        stype = rng.choice(list(SignalType))
        session.add(
            Signal(
                deal_id=deal.id,
                type=stype,
                timestamp=NOW - timedelta(days=rng.randint(0, 30)),
                value=rng.randint(1, 5) if stype == SignalType.email_opened else None,
            )
        )
    for _ in range(rng.randint(1, 3)):
        session.add(
            Touch(
                deal_id=deal.id,
                channel=rng.choice(list(Channel)),
                direction=rng.choice(list(Direction)),
                timestamp=NOW - timedelta(days=rng.randint(0, 30)),
                body=rng.choice(
                    ["asked about monthly payment", "wants winter performance data", "thinking it over"]
                ),
            )
        )
    if rng.random() < 0.6:
        session.add(
            Note(
                deal_id=deal.id,
                author_id=deal.installer_id,
                type=NoteType.text,
                content=rng.choice(
                    ["price-sensitive, compare competitor", "keen on CO2 impact", "needs reassurance on warranty"]
                ),
                timestamp=NOW - timedelta(days=rng.randint(0, 20)),
            )
        )


def seed(session: Session) -> dict[str, int]:
    """Populate an empty DB. Caller resets the schema first."""
    rng = random.Random(SEED)

    org = Org(name="SunPro GmbH", size_type=OrgSize.small)
    session.add(org)
    session.commit()
    session.refresh(org)

    installers = [
        Installer(
            org_id=org.id,
            name=_name(rng),
            role="owner" if i == 0 else "seller",
            sophistication=rng.choice(list(Sophistication)),
            close_rate=round(rng.uniform(0.08, 0.18), 3),
            base_postcode=str(rng.randint(10000, 99999)),
            service_radius_km=float(rng.choice([30, 50, 80])),
            on_site_support=True,
            local_installs_count=rng.randint(5, 120),
            typical_response_time_hours=float(rng.choice([2, 4, 24])),
        )
        for i in range(2)
    ]
    session.add_all(installers)
    session.commit()
    for inst in installers:
        session.refresh(inst)
    installer_ids = [i.id for i in installers]

    def build_deal(stage: DealStage, terminal: bool) -> None:
        installer_id = rng.choice(installer_ids)
        sent_at = NOW - timedelta(days=rng.randint(5, 120) if terminal else rng.randint(1, 40))
        cust = _make_customer(rng, org.id, installer_id)
        session.add(cust)
        session.commit()
        session.refresh(cust)
        quote = _make_quote(rng, cust.id, sent_at)
        session.add(quote)
        session.commit()
        session.refresh(quote)
        last_activity = sent_at + timedelta(days=rng.randint(0, 20))
        # Board-only post-sign fields. verbal_commit → specialist handoff;
        # won → installing (progress < 100) or complete (100). Others stay None.
        install_progress = sub_status = partner_name = None
        if stage == DealStage.verbal_commit:
            partner_name = rng.choice(PARTNERS)
            sub_status = rng.choice(["Specialist reviewing site survey", "Contract signed — handing to install"])
        elif stage == DealStage.won:
            partner_name = rng.choice(PARTNERS)
            install_progress = rng.choice([35, 55, 65, 80, 100, 100])
            sub_status = (
                rng.choice(["Live & monitoring", "Commissioned · handover signed"])
                if install_progress >= 100
                else rng.choice(["Install scheduled", "Site prep · awaiting parts"])
            )
        deal = Deal(
            customer_id=cust.id,
            quote_id=quote.id,
            installer_id=installer_id,
            stage=stage,
            last_activity_at=last_activity,
            install_progress=install_progress,
            sub_status=sub_status,
            partner_name=partner_name,
            outcome=stage.value if terminal else None,
            outcome_reason=rng.choice(["price", "competitor", "no_response", "happy"]) if terminal else None,
        )
        session.add(deal)
        session.commit()
        session.refresh(deal)
        _add_history(rng, deal, session)
        session.commit()

    for i in range(N_ACTIVE):
        build_deal(ACTIVE_STAGES[i % len(ACTIVE_STAGES)], terminal=False)
    for i in range(N_TERMINAL):
        build_deal(TERMINAL_STAGES[i % len(TERMINAL_STAGES)], terminal=True)

    return {
        "orgs": 1,
        "installers": len(installers),
        "active_deals": N_ACTIVE,
        "terminal_deals": N_TERMINAL,
    }
