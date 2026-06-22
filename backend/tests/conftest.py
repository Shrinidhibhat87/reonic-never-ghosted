import os

# Pin the suite to the deterministic engine so tests never hit the network
# (the default engine is "voltagent", which would try the agent on :3141).
os.environ.setdefault("NG_ENGINE", "fake")

import pytest  # noqa: E402
from sqlmodel import Session  # noqa: E402

import app.models  # noqa: F401, E402 — register tables
from app.data import generator  # noqa: E402
from app.db import engine, reset  # noqa: E402


@pytest.fixture(scope="session")
def seeded() -> dict[str, int]:
    """Reset + seed once for the whole test session."""
    reset()
    with Session(engine) as session:
        counts = generator.seed(session)
        session.commit()
    return counts


@pytest.fixture
def session():
    with Session(engine) as s:
        yield s
