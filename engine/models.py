"""Input entities for the strategy engine. See docs/metadata.md for the why.

Only the mandatory core plus enrichment that becomes an evidence chip or sharpens
the persona. Derived/AI outputs (PersonaProfile, Strategy) live with their pillars.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class OrgSize(str, Enum):
    solo = "solo"
    small = "small"
    large = "large"


class ProductType(str, Enum):
    solar_pv = "solar_pv"
    heat_pump = "heat_pump"
    battery = "battery"
    ev_charger = "ev_charger"


class DealStage(str, Enum):
    quote_sent = "quote_sent"
    engaged = "engaged"
    negotiating = "negotiating"
    verbal_commit = "verbal_commit"
    won = "won"
    lost = "lost"
    ghosted = "ghosted"


class Channel(str, Enum):
    email = "email"
    call = "call"
    sms = "sms"
    whatsapp = "whatsapp"
    meeting = "meeting"


class Direction(str, Enum):
    inbound = "inbound"
    outbound = "outbound"


class SignalType(str, Enum):
    email_opened = "email_opened"
    email_replied = "email_replied"
    link_clicked = "link_clicked"
    document_viewed = "document_viewed"
    site_visit = "site_visit"
    call_inbound = "call_inbound"
    call_outbound = "call_outbound"
    meeting_booked = "meeting_booked"
    no_response = "no_response"


class Org(BaseModel):
    id: str
    name: str
    size_type: OrgSize


class Installer(BaseModel):
    id: str
    org_id: str
    name: str
    role: str | None = None
    base_postcode: str | None = None
    service_radius_km: float | None = None
    on_site_support: bool | None = None
    local_installs_count: int | None = None
    typical_response_time_hours: float | None = None


class Customer(BaseModel):
    id: str
    org_id: str
    assigned_installer_id: str
    name: str
    region: str
    locale: str
    contact_channels: list[Channel] = Field(min_length=1)
    channel_preference: Channel | None = None
    household_type: str | None = None
    annual_income_band: str | None = None
    current_energy_bill: float | None = None
    distance_to_installer_km: float | None = None
    tracking_consent: bool = True


class Product(BaseModel):
    type: ProductType
    spec: str
    qty: int = 1


class Quote(BaseModel):
    id: str
    customer_id: str
    products: list[Product] = Field(min_length=1)
    total_price: float
    currency: str
    sent_at: datetime
    valid_until: datetime | None = None
    financing_offered: bool | None = None
    est_savings_per_year: float | None = None
    payback_years: float | None = None
    roi_pct: float | None = None
    co2_offset_tons: float | None = None


class CompetitorPressure(BaseModel):
    competitor_name: str
    competitor_price: float
    flagged_by_installer: bool = True


class Deal(BaseModel):
    id: str
    customer_id: str
    quote_id: str
    installer_id: str
    stage: DealStage
    last_activity_at: datetime
    temperature: str | None = None
    outcome: str | None = None
    outcome_reason: str | None = None


class Touch(BaseModel):
    id: str
    deal_id: str
    channel: Channel
    direction: Direction
    timestamp: datetime
    body: str | None = None
    summary: str | None = None


class Note(BaseModel):
    id: str
    deal_id: str
    author_id: str
    type: str = "text"
    content: str
    timestamp: datetime


class Signal(BaseModel):
    id: str
    deal_id: str
    type: SignalType
    timestamp: datetime
    count: int | None = None


class GoldenProspect(BaseModel):
    """A full mock deal bundle used as a golden test fixture."""

    customer: Customer
    quote: Quote
    deal: Deal
    touches: list[Touch] = []
    notes: list[Note] = []
    signals: list[Signal] = []
    competitor: CompetitorPressure | None = None
