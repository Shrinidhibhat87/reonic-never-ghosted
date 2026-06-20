"""Pydantic-AI agent: a prompt + Pydantic input/output, run against OpenAI.

Input = ``DealContext`` (full deal picture); output = ``ActionPlan`` (an ordered,
strongly-typed sequence of next-action tasks).
"""

from app.agent.agent import Agent, strategy_agent
from app.agent.input_models import (
    Communication,
    Customer,
    DealContext,
    Installer,
    Note,
    PastDeal,
    Quote,
)
from app.agent.output_model import (
    ActionPlan,
    PhoneCallTask,
    SendEmailTask,
    SendGiftTask,
    SendSmsTask,
    Task,
    WaitTask,
)

__all__ = [
    "Agent",
    "strategy_agent",
    # inputs
    "Communication",
    "Customer",
    "DealContext",
    "Installer",
    "Note",
    "PastDeal",
    "Quote",
    # outputs
    "ActionPlan",
    "Task",
    "SendEmailTask",
    "PhoneCallTask",
    "SendSmsTask",
    "SendGiftTask",
    "WaitTask",
]
