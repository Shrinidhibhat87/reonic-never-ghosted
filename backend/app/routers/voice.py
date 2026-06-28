"""Voice capture — transcribe a recorded note via ElevenLabs Speech-to-Text.

Fully wired; gated on ELEVENLABS_API_KEY. Without the key the endpoints report the
feature as disabled / "coming soon" so the UI degrades gracefully until the key lands.
"""

import os

import httpx
from fastapi import APIRouter, HTTPException, UploadFile

router = APIRouter(prefix="/voice", tags=["voice"])

_STT_URL = "https://api.elevenlabs.io/v1/speech-to-text"
_STT_MODEL = os.getenv("ELEVENLABS_STT_MODEL", "scribe_v1")


def _api_key() -> str | None:
    return os.getenv("ELEVENLABS_API_KEY") or None


@router.get("/status")
def voice_status() -> dict[str, bool]:
    return {"enabled": _api_key() is not None}


@router.post("/transcribe")
async def transcribe(file: UploadFile) -> dict[str, str]:
    key = _api_key()
    if key is None:
        raise HTTPException(status_code=503, detail="Feature coming soon")
    audio = await file.read()
    try:
        resp = httpx.post(
            _STT_URL,
            headers={"xi-api-key": key},
            data={"model_id": _STT_MODEL},
            files={"file": (file.filename or "audio.webm", audio, file.content_type or "audio/webm")},
            timeout=60.0,
        )
        resp.raise_for_status()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Transcription failed: {e}") from e
    return {"text": resp.json().get("text", "")}
