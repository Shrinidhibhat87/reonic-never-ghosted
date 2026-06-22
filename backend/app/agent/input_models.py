"""Agent inputs — the full deal context from the input map (see docs/metadata.md).

Mirrors the six sources an installer has when a quote goes quiet: installer profile,
customer, quote (incl. competition), communications, notes, and past deals. List
fields expose ``*_log`` string properties so prompts can interpolate them cleanly
via ``{input.communications_log}`` without iterating in the template.
"""

from datetime import date

from pydantic import BaseModel

from app.models.enums import Channel, DealStage, Direction, NoteType, ProductType


class Installer(BaseModel):
    """The installer (Installeur) running the deal."""

    name: str
    ok_taking_car: bool = False  # willing to drive out for a site visit?
    channel_preference: Channel | None = None


class Customer(BaseModel):
    name: str
    address: str
    birthdate: date | None = None
    annual_income_eur: int | None = None


class Quote(BaseModel):
    product: ProductType
    price_eur: int
    competitor_prices_eur: list[int] = []


class Communication(BaseModel):
    """One exchanged email, call transcript, or SMS."""

    channel: Channel
    direction: Direction
    content: str
    sent_at: date | None = None


class Note(BaseModel):
    """A personal note by the installer — typed, or transcribed from voice."""

    type: NoteType
    content: str


class PastDeal(BaseModel):
    """A previous deal this installer closed (or didn't), for social proof."""

    product: ProductType
    price_eur: int
    outcome: DealStage


class DealContext(BaseModel):
    """Everything the agent knows about one ghosted quote."""

    installer: Installer
    customer: Customer
    quote: Quote
    days_since_quote: int
    communications: list[Communication] = []
    notes: list[Note] = []
    past_deals: list[PastDeal] = []

    @property
    def today(self) -> str:
        """So the model proposes realistic near-future dates, not stale ones."""
        return date.today().isoformat()

    @property
    def preferred_channel(self) -> str:
        ch = self.installer.channel_preference
        return ch.value if ch else "no preference"

    @property
    def competitor_prices(self) -> str:
        prices = self.quote.competitor_prices_eur
        return ", ".join(f"€{p}" for p in prices) if prices else "unknown"

    @property
    def communications_log(self) -> str:
        if not self.communications:
            return "none yet"
        return "\n".join(
            f"- [{c.channel.value} {c.direction.value}] {c.content}" for c in self.communications
        )

    @property
    def notes_log(self) -> str:
        if not self.notes:
            return "none"
        return "\n".join(f"- ({n.type.value}) {n.content}" for n in self.notes)

    @property
    def past_deals_log(self) -> str:
        if not self.past_deals:
            return "none on record"
        return "\n".join(
            f"- {d.product.value} at €{d.price_eur} → {d.outcome.value}" for d in self.past_deals
        )
