"""Smoke-test the strategy agent against OpenAI with fake values.

Loads backend/.env (copy from .env.template, set OPENAI_API_KEY), builds a fake
DealContext, runs the agent, and prints the input/output models as JSON. Traces the
run to Logfire when a Logfire token is present (`uv run logfire auth` first).

    uv run python scripts/try_agent.py
"""

from __future__ import annotations

import os
import sys
from datetime import date
from pathlib import Path

import logfire
from dotenv import load_dotenv

from app.agent import (
    Communication,
    Customer,
    DealContext,
    Installer,
    Note,
    PastDeal,
    Quote,
    strategy_agent,
)
from app.models.enums import Channel, DealStage, Direction, NoteType, ProductType

FAKE_CONTEXT = DealContext(
    installer=Installer(name="Lars", ok_taking_car=True, channel_preference=Channel.email),
    customer=Customer(
        name="Mara Vogt",
        address="Aachener Str. 5, 50674 Köln",
        birthdate=date(1985, 4, 2),
        annual_income_eur=62000,
    ),
    quote=Quote(product=ProductType.heat_pump, price_eur=18000, competitor_prices_eur=[17200, 19500]),
    days_since_quote=6,
    communications=[
        Communication(channel=Channel.email, direction=Direction.outbound, content="Sent the heat-pump quote."),
        Communication(channel=Channel.email, direction=Direction.inbound, content="Thanks, will look at it."),
    ],
    notes=[Note(type=NoteType.voice, content="Worried about install disruption; comparing two competitors.")],
    past_deals=[PastDeal(product=ProductType.heat_pump, price_eur=16500, outcome=DealStage.won)],
)


def main() -> int:
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    if not os.getenv("OPENAI_API_KEY"):
        print("OPENAI_API_KEY not set. Copy backend/.env.template to backend/.env and fill it in.")
        return 1

    # No-op (just a local warning) until `uv run logfire auth` provides a token.
    logfire.configure(send_to_logfire="if-token-present", service_name="ng-agent")
    logfire.instrument_pydantic_ai()
    logfire.instrument_system_metrics()

    print(f"# model: {strategy_agent.model}\n")

    print("# INPUT (DealContext)")
    print(FAKE_CONTEXT.model_dump_json(indent=2))

    plan = strategy_agent.run(FAKE_CONTEXT)

    print("\n# OUTPUT (ActionPlan)")
    print(plan.model_dump_json(indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
