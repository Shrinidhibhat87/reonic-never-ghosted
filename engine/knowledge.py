"""Static curated knowledge store (mocked). Real ingestion is out of scope."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel

_KNOWLEDGE_PATH = Path(__file__).parent / "data" / "knowledge.json"


class Review(BaseModel):
    source: str
    rating: float
    theme: str
    quote: str


class CompetitorPrice(BaseModel):
    product: str
    region: str
    median_price_eur: float
    kwp: float | None = None
    kwh: float | None = None


class SatisfactionPattern(BaseModel):
    pattern: str
    effect: str


class Knowledge(BaseModel):
    reviews: list[Review]
    competitor_prices: list[CompetitorPrice]
    satisfaction_patterns: list[SatisfactionPattern]


@lru_cache(maxsize=1)
def load_knowledge() -> Knowledge:
    """Load and validate the curated knowledge JSON (cached)."""
    return Knowledge.model_validate_json(_KNOWLEDGE_PATH.read_text())
