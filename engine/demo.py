"""Run Engine A on one golden prospect and print the recommended next steps.

    python -m engine.demo                 # live: needs OPENAI_API_KEY (from .env)
    python -m engine.demo nrw             # pick a prospect by region/deal id
    python -m engine.demo --stub          # no key, canned Strategy — proves the
                                          # wiring + output shape without spending

This is the "does the AI work?" smoke test: feed a real prospect, get back a
validated Strategy (buyer profile + goal + <=3 grounded next actions).
"""

from __future__ import annotations

import os
import sys
from datetime import datetime
from pathlib import Path

from engine.benchmarks import allowed_refs, build_benchmarks
from engine.deterministic import Goal
from engine.golden import load_golden_prospects
from engine.strategy import (
    BuyerProfile,
    EvidenceChip,
    ChipKind,
    Lever,
    Persona,
    PersonaScore,
    Step,
    Strategy,
    TaskType,
    generate_traced,
)

NOW = datetime(2026, 6, 20, 12, 0, 0)
ROOT = Path(__file__).resolve().parents[1]


def _load_env() -> None:
    env = ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())


def _stub_strategy(prospect) -> Strategy:
    """Canned but schema-valid — lets you eyeball the output with no key/spend."""
    return Strategy(
        deal_id=prospect.deal.id,
        buyer_profile=BuyerProfile(
            personas=[PersonaScore(persona=Persona.roi_investor, weight=0.7,
                                   strength="asked about monthly payment")],
            top_motivations=["lower bills", "competitor is cheaper"],
        ),
        current_goal=Goal.establish_value,
        steps=[
            Step(task_type=TaskType.phone_call, title="Call to reframe the gap",
                 goal=Goal.build_trust, primary_lever=Lever.gap_framing,
                 suggested_timing="within 24h",
                 script="Hi Sabine, quick call about your quote — want to walk you "
                        "through the monthly-payment options.",
                 why="warm lead, payment objection best handled by voice",
                 evidence_chips=[EvidenceChip(kind=ChipKind.behavioral,
                                              label="opened the quote email 4x")]),
        ],
        summary="Warm ROI buyer stalled on monthly cost — call to reframe before pushing.",
    )


def _print(strategy: Strategy) -> None:
    bp = strategy.buyer_profile
    print(f"\n{'=' * 64}\nDEAL {strategy.deal_id}   goal: {strategy.current_goal.value}")
    print(f"{'=' * 64}\nSUMMARY: {strategy.summary}\n")
    personas = ", ".join(f"{p.persona.value}({p.weight})" for p in bp.personas)
    print(f"PERSONA: {personas}")
    print(f"MOTIVATIONS: {', '.join(bp.top_motivations)}")
    if bp.objections:
        print(f"OBJECTIONS: {', '.join(o.value for o in bp.objections)}")
    print("\nNEXT STEPS:")
    for i, s in enumerate(strategy.steps, 1):
        lever = s.primary_lever.value + (f"+{s.secondary_lever.value}" if s.secondary_lever else "")
        print(f"  {i}. [{s.task_type.value}] {s.title}  ({s.suggested_timing})")
        print(f"     goal={s.goal.value}  lever={lever}")
        print(f"     why: {s.why}")
        print(f"     script: {s.script}")
        for c in s.evidence_chips:
            ref = f" <{c.ref}>" if c.ref else ""
            print(f"     • {c.kind.value}: {c.label}{ref}")
    print()


def main(argv: list[str]) -> None:
    _load_env()
    stub = "--stub" in argv
    name = next((a for a in argv if not a.startswith("-")), None)

    prospects = load_golden_prospects()
    prospect = prospects[0]
    if name:
        prospect = next((p for p in prospects if name.lower() in p.customer.region.lower()
                         or name.lower() in p.deal.id.lower()), None)
        if prospect is None:
            sys.exit(f"no golden prospect matches '{name}'")

    print(f"\nProspect: {prospect.customer.name} — {prospect.customer.region}")

    if stub:
        _print(_stub_strategy(prospect))
        return

    if not os.getenv("OPENAI_API_KEY"):
        sys.exit("OPENAI_API_KEY not set. Use --stub for a no-key run, or fill in .env.")

    from engine.llm import openai_llm

    model = os.getenv("ENGINE_MODEL", "gpt-4o-2024-08-06")
    # Traced path: benchmark ids ground the chips, one repair retry fixes most
    # breaches, and we still print any residual violations as warnings.
    bm = build_benchmarks()
    strategy, violations = generate_traced(
        prospect, llm=openai_llm(model), allowed_refs=allowed_refs(),
        benchmarks=bm, now=NOW, max_repairs=1)
    _print(strategy)
    if violations:
        print("⚠ guardrail flags (ungrounded — would be rejected in prod):")
        for v in violations:
            print(f"   - {v}")


if __name__ == "__main__":
    main(sys.argv[1:])
