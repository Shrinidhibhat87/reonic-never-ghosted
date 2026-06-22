"""An Agent bundles a prompt with its output type and runs it against OpenAI.

The prompt is a ``str.format`` template over a single Pydantic input model bound to
``{input}`` (e.g. ``{input.customer.name}``). The OpenAI key is read from the
environment (``OPENAI_API_KEY``) by pydantic-ai. The underlying agent is built
lazily, so constructing an Agent — and rendering prompts — needs no key.
"""

from __future__ import annotations

import os
from typing import Generic, TypeVar

from pydantic import BaseModel
from pydantic_ai import Agent as _PydanticAgent

from app.agent.output_model import ActionPlan

# Responses API → native strict structured outputs (OpenAI enforces the schema),
# which is far more reliable for our discriminated-union ActionPlan than Chat
# Completions tool-calling.
DEFAULT_MODEL = os.getenv("NG_AGENT_MODEL", "openai-responses:gpt-4o")

OutputT = TypeVar("OutputT", bound=BaseModel)


class Agent(Generic[OutputT]):
    """A prompt + structured output type, runnable against OpenAI."""

    def __init__(
        self,
        prompt: str,
        output_type: type[OutputT],
        *,
        model: str = DEFAULT_MODEL,
        system_prompt: str = "",
        retries: int = 3,
    ) -> None:
        self.prompt = prompt
        self.output_type = output_type
        self.model = model
        self.system_prompt = system_prompt
        self.retries = retries
        self._agent: _PydanticAgent[None, OutputT] | None = None

    def render(self, inputs: BaseModel) -> str:
        """Interpolate ``inputs`` into the prompt template."""
        return self.prompt.format(input=inputs)

    def run(self, inputs: BaseModel) -> OutputT:
        """Render the prompt and run it, returning validated output."""
        if self._agent is None:
            self._agent = _PydanticAgent(
                self.model,
                output_type=self.output_type,
                system_prompt=self.system_prompt,
                retries=self.retries,
            )
        return self._agent.run_sync(self.render(inputs)).output


STRATEGY_PROMPT = """\
Installer {input.installer.name} sent a homeowner a quote {input.days_since_quote} days
ago and they went quiet. Design the next-best sequence of actions to move them from
"quote received" toward "contract signed".

Return an ordered ActionPlan of typed tasks. Each task is one concrete action:
- send_email: subject + body (a ready-to-send draft)
- phone_call: a suggested date + a few talking-point bullets
- send_sms: a short text
- send_gift: a gift_type (+ optional note)
- wait: hold N days before the next touch
Order the chain by the goal arc — earn trust before creating urgency, ask for
commitment last. Ground each task's `reason` in the context below; never invent facts.
Today is {input.today}; any suggested dates must be in the near future.

Customer: {input.customer.name}, {input.customer.address}
Quote: {input.quote.product.value} for €{input.quote.price_eur} (competitor prices: {input.competitor_prices})
Preferred channel: {input.preferred_channel}

Communications so far:
{input.communications_log}

Installer notes:
{input.notes_log}

Past deals with this installer:
{input.past_deals_log}
"""

strategy_agent: Agent[ActionPlan] = Agent(
    STRATEGY_PROMPT,
    ActionPlan,
    system_prompt="You are a strategic solar/heat-pump sales assistant. Be concrete and grounded.",
)
