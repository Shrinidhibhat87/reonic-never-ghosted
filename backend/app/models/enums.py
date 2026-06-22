"""Fixed taxonomies from docs/metadata.md. String enums so they serialize cleanly."""

from enum import Enum


class OrgSize(str, Enum):
    solo = "solo"
    small = "small"
    large = "large"


class Sophistication(str, Enum):
    basic = "basic"
    intermediate = "intermediate"
    advanced = "advanced"


class DealStage(str, Enum):
    quote_sent = "quote_sent"
    engaged = "engaged"
    negotiating = "negotiating"
    verbal_commit = "verbal_commit"
    won = "won"
    lost = "lost"
    ghosted = "ghosted"


class ProductType(str, Enum):
    solar_pv = "solar_pv"
    heat_pump = "heat_pump"
    battery = "battery"
    ev_charger = "ev_charger"


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


class NoteType(str, Enum):
    text = "text"
    voice = "voice"


class Persona(str, Enum):
    environmentalist = "environmentalist"
    roi_investor = "roi_investor"
    budget_sensitive = "budget_sensitive"
    security_seeker = "security_seeker"
    early_adopter = "early_adopter"
    skeptic = "skeptic"


class Objection(str, Enum):
    upfront_cost = "upfront_cost"
    financing_concern = "financing_concern"
    performance_doubt = "performance_doubt"
    roof_or_technical_fit = "roof_or_technical_fit"
    trust_or_legitimacy = "trust_or_legitimacy"
    timing_low_urgency = "timing_low_urgency"
    competitor_comparison = "competitor_comparison"
    decision_paralysis = "decision_paralysis"


class PersuasionLever(str, Enum):
    roi_financial = "roi_financial"
    environmental_impact = "environmental_impact"
    peace_of_mind = "peace_of_mind"
    proximity_trust = "proximity_trust"
    social_proof = "social_proof"
    urgency = "urgency"
    gap_framing = "gap_framing"
    objection_handling = "objection_handling"
    product_specific = "product_specific"


class Goal(str, Enum):
    build_trust = "build_trust"
    establish_value = "establish_value"
    create_urgency = "create_urgency"
    close_gap = "close_gap"
    handle_objection = "handle_objection"
    ask_for_commitment = "ask_for_commitment"


class OutcomeEvent(str, Enum):
    accepted = "accepted"
    sent = "sent"
    replied = "replied"
    advanced = "advanced"
    ghosted = "ghosted"
    won = "won"
    lost = "lost"
