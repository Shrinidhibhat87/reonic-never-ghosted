"""Curated knowledge loader (Trustpilot/reviews JSON a colleague is gathering)."""

import json
from pathlib import Path
from typing import Any

_DATA_DIR = Path(__file__).parent / "data"


def load() -> list[dict[str, Any]]:
    """Load every *.json under knowledge/data/ as a flat list of records."""
    records: list[dict[str, Any]] = []
    if not _DATA_DIR.exists():
        return records
    for path in sorted(_DATA_DIR.glob("*.json")):
        data = json.loads(path.read_text())
        records.extend(data if isinstance(data, list) else [data])
    return records
