"""Application settings, env-driven."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="NG_", env_file=".env", extra="ignore")

    # Default points at the local docker Postgres from docker-compose.
    database_url: str = "postgresql+psycopg://ng:ng@localhost:5434/never_ghosted"


settings = Settings()
