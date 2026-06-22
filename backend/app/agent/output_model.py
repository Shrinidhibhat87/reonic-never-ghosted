"""Agent output — a strongly-typed sequence of next-action tasks.

The agent returns an ``ActionPlan``: an ordered list of tasks, each a distinct
Pydantic model carrying exactly the fields that action needs (an email draft, a
call date + script, a gift type, …). Tasks form a discriminated union on ``type``,
so consumers can ``match`` on it with full type safety.
"""

from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, Field

from app.models.enums import Goal, ProductType


class _BaseTask(BaseModel):
    """Fields every task shares: where it sits in the chain and why."""

    goal: Goal  # the goal-arc stage this action serves
    reason: str  # one line: why this action, now


# NB: the `type` discriminator is required (no default). A default makes the field
# optional in the JSON schema, so OpenAI omits it and discrimination fails with
# `union_tag_not_found`. Required → the model must emit the tag every time.
class SendEmailTask(_BaseTask):
    type: Literal["send_email"]
    subject: str
    body: str


class PhoneCallTask(_BaseTask):
    type: Literal["phone_call"]
    suggested_date: date
    script: list[str]  # talking points / lead phrases, not a full script


class SendSmsTask(_BaseTask):
    type: Literal["send_sms"]
    text: str


class SendGiftTask(_BaseTask):
    type: Literal["send_gift"]
    gift_type: str
    note: str | None = None


class WaitTask(_BaseTask):
    type: Literal["wait"]
    days: int  # hold off this many days before the next touch


Task = Annotated[
    SendEmailTask | PhoneCallTask | SendSmsTask | SendGiftTask | WaitTask,
    Field(discriminator="type"),
]


class ActionPlan(BaseModel):
    """The strategic communication chain: an ordered sequence of typed tasks."""

    summary: str
    recommended_product_focus: ProductType | None = None
    tasks: list[Task]
