"""Real LLM adapter for Engine A. Gated on OPENAI_API_KEY; not used in tests.

ponytail: thin wrapper over OpenAI structured outputs. Swap the provider here if
the credit situation changes; the rest of the engine only knows the LLM callable.
"""

from __future__ import annotations

import os

from engine.strategy import LLM, Strategy

DEFAULT_MODEL = "gpt-4o-2024-08-06"  # supports structured outputs (parse)


def openai_llm(model: str = DEFAULT_MODEL) -> LLM:
    """Return an LLM callable: prompt -> validated Strategy via structured output."""
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY not set; cannot build the live LLM.")
    from openai import OpenAI  # lazy: keep openai out of the test/CI path

    client = OpenAI()

    def _call(prompt: str) -> Strategy:
        completion = client.beta.chat.completions.parse(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            response_format=Strategy,
            max_tokens=1500,  # cost cap; tightened further in P5
        )
        return completion.choices[0].message.parsed

    return _call
