"""Canonical SQLModel tables. JSONB for AI artifacts and nested value objects.

Enums use native_enum=False → stored as VARCHAR + CHECK, so reset()/create_all
stay painless (no Postgres ENUM types to migrate).
"""

from datetime import UTC, datetime

from sqlalchemy import Column, Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from app.models.enums import (
    Channel,
    DealStage,
    Direction,
    Goal,
    NoteType,
    OrgSize,
    OutcomeEvent,
    SignalType,
    Sophistication,
)


def _now() -> datetime:
    return datetime.now(UTC)


def _enum(enum_cls: type) -> Column:
    return Column(SAEnum(enum_cls, native_enum=False), nullable=False)


def _jsonb(nullable: bool = False) -> Column:
    return Column(JSONB, nullable=nullable)


class Org(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    size_type: OrgSize = Field(sa_column=_enum(OrgSize))


class Installer(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    org_id: int = Field(foreign_key="org.id")
    name: str
    role: str | None = None
    sophistication: Sophistication | None = Field(
        default=None, sa_column=Column(SAEnum(Sophistication, native_enum=False))
    )
    close_rate: float | None = None
    base_postcode: str | None = None
    service_radius_km: float | None = None
    on_site_support: bool | None = None
    local_installs_count: int | None = None
    typical_response_time_hours: float | None = None


class Customer(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    org_id: int = Field(foreign_key="org.id")
    assigned_installer_id: int = Field(foreign_key="installer.id")
    name: str
    region: str
    locale: str | None = None
    contact_channels: list = Field(default_factory=list, sa_column=_jsonb())
    channel_preference: str | None = None
    age: int | None = None
    household_type: str | None = None
    annual_income_band: str | None = None
    current_energy_bill: float | None = None
    home_ownership: str | None = None
    property_type: str | None = None
    distance_to_installer_km: float | None = None


class Quote(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customer.id")
    products: list = Field(default_factory=list, sa_column=_jsonb())  # [{type, spec, qty}]
    total_price: float
    currency: str
    sent_at: datetime
    valid_until: datetime | None = None
    financing_offered: bool | None = None
    est_savings_per_year: float | None = None
    payback_years: float | None = None
    roi_pct: float | None = None
    co2_offset_tons: float | None = None


class Deal(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customer.id")
    quote_id: int = Field(foreign_key="quote.id")
    installer_id: int = Field(foreign_key="installer.id")
    stage: DealStage = Field(sa_column=_enum(DealStage))
    last_activity_at: datetime
    current_goal: Goal = Field(default=Goal.build_trust, sa_column=_enum(Goal))
    outcome: str | None = None
    outcome_reason: str | None = None


class CompetitorPressure(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    deal_id: int = Field(foreign_key="deal.id")
    competitor_name: str
    competitor_price: float
    flagged_by_installer: bool = True


class Touch(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    deal_id: int = Field(foreign_key="deal.id")
    channel: Channel = Field(sa_column=_enum(Channel))
    direction: Direction = Field(sa_column=_enum(Direction))
    timestamp: datetime
    body: str | None = None
    summary: str | None = None


class Note(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    deal_id: int = Field(foreign_key="deal.id")
    author_id: int = Field(foreign_key="installer.id")
    type: NoteType = Field(sa_column=_enum(NoteType))
    content: str
    timestamp: datetime


class Signal(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    deal_id: int = Field(foreign_key="deal.id")
    type: SignalType = Field(sa_column=_enum(SignalType))
    timestamp: datetime
    value: int | None = None  # e.g. opens = 4


# --- AI-output tables: JSONB payloads, populated in BP2/BP3 ---


class PersonaProfile(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    deal_id: int = Field(foreign_key="deal.id")
    scores: list = Field(default_factory=list, sa_column=_jsonb())
    top_motivations: list = Field(default_factory=list, sa_column=_jsonb())
    objections: list = Field(default_factory=list, sa_column=_jsonb())
    created_at: datetime = Field(default_factory=_now)


class Strategy(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    deal_id: int = Field(foreign_key="deal.id")
    current_goal: Goal = Field(sa_column=_enum(Goal))
    buyer_profile: dict = Field(default_factory=dict, sa_column=_jsonb())
    steps: list = Field(default_factory=list, sa_column=_jsonb())
    created_at: datetime = Field(default_factory=_now)


class StrategyEvent(SQLModel, table=True):
    """Append-only log — the trace. Nothing overwrites; semantics owned by agent_plan."""

    id: int | None = Field(default=None, primary_key=True)
    deal_id: int = Field(foreign_key="deal.id")
    event_type: str
    payload: dict = Field(default_factory=dict, sa_column=_jsonb())
    timestamp: datetime = Field(default_factory=_now)


class Outcome(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    deal_id: int = Field(foreign_key="deal.id")
    step_id: int | None = None
    event: OutcomeEvent = Field(sa_column=_enum(OutcomeEvent))
    timestamp: datetime = Field(default_factory=_now)
