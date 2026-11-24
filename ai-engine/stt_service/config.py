import os
from typing import Optional


def parse_cors_origins(raw: Optional[str]) -> list[str]:
    """
    Parses comma-separated CORS origins from environment variable.
    - If unset (None): returns safe defaults for local dev and production web app.
    - If empty string (""): returns empty list (disables all CORS origins).
    - Strips wildcard '*' to prevent insecure wildcard opening.
    """
    if raw is None:
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://myflova.vercel.app",
        ]
    return [o.strip() for o in raw.split(",") if o.strip() and o.strip() != "*"]


class Settings:
    HOST: str = os.getenv("FLOVA_STT_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("FLOVA_STT_PORT", "8001"))
    # No default: without a key the service refuses /transcribe and /models (fail closed).
    FLOVA_STT_INTERNAL_KEY: str = os.getenv("FLOVA_STT_INTERNAL_KEY", "")
    HF_TOKEN: str = os.getenv("HF_TOKEN", "")
    MODEL_CACHE_DIR: str = os.getenv("INDICCONFORMER_CACHE_DIR", os.path.expanduser("~/.cache/flova_indicconformer"))
    DEVICE: str = os.getenv("DEVICE", "cpu")
    DEFAULT_LANGUAGE: str = "kn"  # FLOVA prioritizes Kannada & Indic languages
    SUPPORTED_LANGUAGES: list[str] = ["kn", "hi", "te", "ta", "ml", "en", "mr", "gu", "bn", "ur", "auto"]
    TIMEOUT_SECONDS: int = 15
    # Strict Production Safeguard: Never return mock/simulated transcripts unless explicitly enabled for testing
    ALLOW_MOCK_FALLBACK: bool = os.getenv("FLOVA_STT_ALLOW_MOCK", "false").lower() == "true"

    # SEC-05: Hardened CORS Configuration
    CORS_ALLOW_CREDENTIALS: bool = False
    CORS_ALLOWED_METHODS: list[str] = ["GET", "POST", "OPTIONS"]
    CORS_ALLOWED_HEADERS: list[str] = [
        "Content-Type",
        "X-FLOVA-STT-KEY",
        "Authorization",
        "Accept",
    ]
    CORS_MAX_AGE: int = 600

    @property
    def cors_origins(self) -> list[str]:
        return parse_cors_origins(os.getenv("FLOVA_STT_CORS_ORIGINS"))


settings = Settings()
