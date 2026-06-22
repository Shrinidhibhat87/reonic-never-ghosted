"""Engine, session dependency, and schema helpers (create_all / reset)."""

from collections.abc import Iterator

from sqlmodel import Session, SQLModel, create_engine

from app.config import settings

engine = create_engine(settings.database_url, echo=False)


def get_session() -> Iterator[Session]:
    """FastAPI dependency: one session per request."""
    with Session(engine) as session:
        yield session


def create_all() -> None:
    """Create any missing tables. ponytail: no Alembic until schema churns in prod."""
    SQLModel.metadata.create_all(engine)


def reset() -> None:
    """Drop and recreate every table — wipes data. Demo/test convenience only."""
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
