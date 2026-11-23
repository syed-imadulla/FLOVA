import os

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

settings = Settings()
