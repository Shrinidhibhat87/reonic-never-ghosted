# Backend image: FastAPI served by uvicorn, deps managed by uv.
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

# Install dependencies first (cached unless the lock changes).
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# Then the application code, and install the project itself.
COPY . .
RUN uv sync --frozen --no-dev

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
