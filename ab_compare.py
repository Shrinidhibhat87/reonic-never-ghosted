"""A/B harness: our engine (Engine A) vs the basic pydantic-ai agent.

Runs both on the same golden prospect and has an LLM judge score them on a
grounded-strategy rubric, so we can show the engine produces the superior plan.

    python ab_compare.py                 # judge all 6 golden prospects
    python ab_compare.py munich          # one prospect
    python ab_compare.py --no-judge      # just print both strategies

Needs OPENAI_API_KEY (read from root .env). The engine needs `openai`; the basic
agent needs `pydantic-ai`. The prospect->context adapter is pure and import-free,
so test_ab_compare.py runs in CI without either dependency or a key.

ponytail: standalone script, not part of the engine package — it's the only thing
that couples engine + backend, so it carries the sys.path glue, not them.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
# Backend isn't on the path by default (engine + tests live at root); add it so we
# can import the colleague's basic agent.
sys.path.insert(0, str(ROOT / "backend"))

NOW = datetime(2026, 6, 20, 12, 0, 0)  # matches engine's default "today"


def load_env() -> None:
    """Minimal .env loader — no python-dotenv dependency for a 6-line job."""
    env = ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        os.environ.setdefault(key.strip(), val.strip())


# ── Adapter: GoldenProspect -> the basic agent's DealContext ─────────────────
# Pure mapping (no LLM, no key), so it's the part we self-test.
def to_deal_context(prospect):
    """Map an engine GoldenProspect onto the basic agent's DealContext shape."""
    from app.agent.input_models import (
        Communication,
        Customer,
        DealContext,
        Installer,
        Note,
        Quote,
    )
    from app.models.enums import NoteType

    p = prospect
    competitor_prices = (
        [int(p.competitor.competitor_price)] if p.competitor else []
    )
    return DealContext(
        installer=Installer(
            name="Reonic Installer",
            channel_preference=p.customer.channel_preference,
        ),
        customer=Customer(name=p.customer.name, address=p.customer.region),
        quote=Quote(
            product=p.quote.products[0].type,
            price_eur=int(p.quote.total_price),
            competitor_prices_eur=competitor_prices,
        ),
        days_since_quote=(NOW - p.quote.sent_at).days,
        communications=[
            Communication(
                channel=t.channel,
                direction=t.direction,
                content=t.summary or t.body or "",
                sent_at=t.timestamp.date(),
            )
            for t in p.touches
        ],
        notes=[Note(type=NoteType.text, content=n.content) for n in p.notes],
        past_deals=[],  # golden fixtures carry no prior-deal pool yet
    )


# ── Runners ──────────────────────────────────────────────────────────────────
def run_engine(prospect) -> dict:
    """Engine A: deterministic context + structured call + repair loop + guardrails."""
    from engine.benchmarks import allowed_refs, build_benchmarks
    from engine.llm import openai_llm
    from engine.strategy import generate_traced

    model = os.getenv("ENGINE_MODEL", "gpt-4o-2024-08-06")
    strategy, violations = generate_traced(
        prospect, llm=openai_llm(model), allowed_refs=allowed_refs(),
        benchmarks=build_benchmarks(), now=NOW, max_repairs=1)
    out = strategy.model_dump(mode="json")
    # Surface the guardrail result — a feature the basic agent lacks, not a crash.
    out["guardrail_violations"] = violations
    return out


def run_basic(prospect) -> dict:
    """The colleague's pydantic-ai ActionPlan agent."""
    from app.agent.agent import strategy_agent

    plan = strategy_agent.run(to_deal_context(prospect))
    return plan.model_dump(mode="json")


# ── Judge ────────────────────────────────────────────────────────────────────
RUBRIC = """\
You are an impartial sales-strategy reviewer for a German renewable-energy
installer chasing a homeowner who went quiet after a quote. Score TWO strategies
for the SAME customer on a 1-10 scale each, on:
  1. Grounding — claims tied to real customer facts, no invented statistics.
  2. Goal-arc fit — earns trust before pushing urgency or asking to sign.
  3. Lowest-pressure-first — opens with the least pushy viable move.
  4. Personalization — reflects this customer's persona, objection, and channel.
  5. Actionability — concrete, ready-to-use next steps.
Be critical and discriminating; do not default to a tie. Pick the winner."""


def judge(prospect, engine_out: dict, basic_out: dict) -> dict:
    """LLM judge → structured verdict. Same OpenAI structured-output path as the engine."""
    from typing import Literal

    from openai import OpenAI
    from pydantic import BaseModel, Field

    class Verdict(BaseModel):
        engine_score: int = Field(ge=1, le=10)
        basic_score: int = Field(ge=1, le=10)
        winner: Literal["engine", "basic", "tie"]
        rationale: str

    customer = prospect.customer.model_dump(mode="json")
    prompt = (
        f"{RUBRIC}\n\n"
        f"CUSTOMER CONTEXT:\n{json.dumps(customer)}\n\n"
        f"STRATEGY A — 'engine':\n{json.dumps(engine_out)}\n\n"
        f"STRATEGY B — 'basic':\n{json.dumps(basic_out)}\n"
    )
    client = OpenAI()
    completion = client.beta.chat.completions.parse(
        model=os.getenv("ENGINE_MODEL", "gpt-4o-2024-08-06"),
        messages=[{"role": "user", "content": prompt}],
        response_format=Verdict,
        max_tokens=600,
    )
    return completion.choices[0].message.parsed.model_dump()


# ── CLI ──────────────────────────────────────────────────────────────────────
def _prospects(name: str | None):
    from engine.golden import load_golden_prospects

    all_p = load_golden_prospects()
    if not name:
        return all_p
    hits = [p for p in all_p if name.lower() in p.customer.region.lower()
            or name.lower() in p.deal.id.lower()]
    if not hits:
        sys.exit(f"no golden prospect matches '{name}'")
    return hits


def main(argv: list[str]) -> None:
    load_env()
    do_judge = "--no-judge" not in argv
    name = next((a for a in argv if not a.startswith("-")), None)

    if not os.getenv("OPENAI_API_KEY"):
        sys.exit("OPENAI_API_KEY not set (copy .env.template to .env and fill it in).")

    wins = {"engine": 0, "basic": 0, "tie": 0}
    for p in _prospects(name):
        print(f"\n{'=' * 70}\n{p.customer.name} — {p.customer.region}  [{p.deal.id}]\n{'=' * 70}")
        engine_out = run_engine(p)
        basic_out = run_basic(p)
        print("\n--- ENGINE A ---\n" + json.dumps(engine_out, indent=2))
        print("\n--- BASIC AGENT ---\n" + json.dumps(basic_out, indent=2))
        if do_judge:
            v = judge(p, engine_out, basic_out)
            wins[v["winner"]] += 1
            print(f"\n>>> VERDICT: winner={v['winner']}  "
                  f"engine={v['engine_score']}  basic={v['basic_score']}")
            print(f"    {v['rationale']}")

    if do_judge:
        print(f"\n{'=' * 70}\nTALLY  engine={wins['engine']}  "
              f"basic={wins['basic']}  tie={wins['tie']}")


if __name__ == "__main__":
    main(sys.argv[1:])
