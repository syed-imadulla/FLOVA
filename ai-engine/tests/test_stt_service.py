import base64
import io
import wave
import numpy as np
import pytest
from fastapi.testclient import TestClient

from stt_service.main import app
from stt_service.config import settings
from stt_service.audio import convert_audio_to_16k_mono_wav, load_wav_as_numpy
from stt_service.conformer_engine import IndicConformerEngine

client = TestClient(app)

TEST_KEY = "test-only-stt-key"


@pytest.fixture(autouse=True)
def _stt_key(monkeypatch):
    """The service has no default key any more; tests configure one explicitly."""
    monkeypatch.setattr(settings, "FLOVA_STT_INTERNAL_KEY", TEST_KEY)

def create_synthetic_wav(duration_seconds: float = 1.0, sample_rate: int = 16000) -> bytes:
    """Generates a synthetic 16-bit PCM mono sine wave as WAV bytes."""
    t = np.linspace(0, duration_seconds, int(sample_rate * duration_seconds), endpoint=False)
    # 440 Hz tone
    audio = (np.sin(2 * np.pi * 440 * t) * 32767).astype(np.int16)
    
    bio = io.BytesIO()
    with wave.open(bio, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(audio.tobytes())
    return bio.getvalue()

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "flova-indicconformer-stt"
    assert "memory_rss_mb" in data
    assert "kn" in data["loaded_models"] or "kn" in data["supported_languages"]

def test_models_endpoint_auth_required():
    # Without header
    res_no_auth = client.get("/models")
    assert res_no_auth.status_code == 401
    
    # With valid header
    res_auth = client.get("/models", headers={"X-FLOVA-STT-KEY": TEST_KEY})
    assert res_auth.status_code == 200
    data = res_auth.json()
    assert "kn" in data["primary_languages"]
    assert "hi" in data["primary_languages"]
    assert "te" in data["primary_languages"]

def test_transcribe_missing_model_returns_503(monkeypatch):
    """Verifies that in production mode (ALLOW_MOCK_FALLBACK=False), missing model weights return HTTP 503 instead of mock text."""
    monkeypatch.setattr(settings, "ALLOW_MOCK_FALLBACK", False)
    wav_bytes = create_synthetic_wav(1.0, 16000)
    audio_b64 = base64.b64encode(wav_bytes).decode()

    response = client.post(
        "/transcribe",
        headers={"X-FLOVA-STT-KEY": TEST_KEY},
        json={
            "audioBase64": audio_b64,
            "mimeType": "audio/wav",
            "language": "kn"
        }
    )
    # If ONNX model is not installed on disk, must return HTTP 503 Service Unavailable
    engine_instance = IndicConformerEngine()
    target_info = engine_instance.load_model("kn")
    if target_info.get("session") is None:
        assert response.status_code == 503
        data = response.json()
        assert "not installed" in data["detail"]
    else:
        assert response.status_code == 200

def test_transcribe_audio_kannada(monkeypatch):
    monkeypatch.setattr(settings, "ALLOW_MOCK_FALLBACK", True)
    wav_bytes = create_synthetic_wav(1.5, 16000)
    audio_b64 = base64.b64encode(wav_bytes).decode()

    response = client.post(
        "/transcribe",
        headers={"X-FLOVA-STT-KEY": TEST_KEY},
        json={
            "audioBase64": audio_b64,
            "mimeType": "audio/wav",
            "language": "kn"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["provider"] == "indicconformer"
    assert data["language"] == "kn"
    assert "ಪೆಟ್ರೋಲ್" in data["transcript"] or "300" in data["transcript"]
    assert data["duration_ms"] > 0

def test_transcribe_audio_hindi(monkeypatch):
    monkeypatch.setattr(settings, "ALLOW_MOCK_FALLBACK", True)
    wav_bytes = create_synthetic_wav(1.5, 16000)
    audio_b64 = base64.b64encode(wav_bytes).decode()

    response = client.post(
        "/transcribe",
        headers={"X-FLOVA-STT-KEY": TEST_KEY},
        json={
            "audioBase64": audio_b64,
            "mimeType": "audio/wav",
            "language": "hi"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["provider"] == "indicconformer"
    assert data["language"] == "hi"
    assert "पेट्रोल" in data["transcript"] or "300" in data["transcript"]

def test_transcribe_audio_telugu(monkeypatch):
    monkeypatch.setattr(settings, "ALLOW_MOCK_FALLBACK", True)
    wav_bytes = create_synthetic_wav(1.5, 16000)
    audio_b64 = base64.b64encode(wav_bytes).decode()

    response = client.post(
        "/transcribe",
        headers={"X-FLOVA-STT-KEY": TEST_KEY},
        json={
            "audioBase64": audio_b64,
            "mimeType": "audio/wav",
            "language": "te"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["provider"] == "indicconformer"
    assert data["language"] == "te"
    assert "పెట్రోల్" in data["transcript"] or "300" in data["transcript"]

def test_transcribe_missing_payload():
    response = client.post(
        "/transcribe",
        headers={"X-FLOVA-STT-KEY": TEST_KEY},
        json={}
    )
    assert response.status_code == 400

def test_audio_preprocessing_pipeline():
    synthetic_wav = create_synthetic_wav(1.0, 16000)
    converted_wav = convert_audio_to_16k_mono_wav(synthetic_wav, input_format="wav")
    audio_arr, sr = load_wav_as_numpy(converted_wav)
    assert sr == 16000
    assert len(audio_arr) == 16000
    assert np.max(np.abs(audio_arr)) > 0


def test_unconfigured_key_fails_closed(monkeypatch):
    """Without FLOVA_STT_INTERNAL_KEY the service must refuse work, never accept unauthenticated audio."""
    monkeypatch.setattr(settings, "FLOVA_STT_INTERNAL_KEY", "")
    assert client.get("/models").status_code == 503
    assert client.post("/transcribe", json={"audioBase64": "x" * 200}).status_code == 503
    # Health stays available so the platform can still probe the process.
    assert client.get("/health").status_code == 200


def test_wrong_key_rejected():
    assert client.get("/models", headers={"X-FLOVA-STT-KEY": "wrong"}).status_code == 401
    assert client.get("/models", headers={"Authorization": "Bearer wrong"}).status_code == 401
    assert client.get("/models", headers={"Authorization": f"Bearer {TEST_KEY}"}).status_code == 200


def test_no_hardcoded_default_key():
    import importlib
    import stt_service.config as cfg
    import os
    old = os.environ.pop("FLOVA_STT_INTERNAL_KEY", None)
    try:
        assert importlib.reload(cfg).Settings.FLOVA_STT_INTERNAL_KEY == ""
    finally:
        if old is not None:
            os.environ["FLOVA_STT_INTERNAL_KEY"] = old
        importlib.reload(cfg)


def test_model_file_present_never_returns_fake_transcript(monkeypatch):
    """A loaded ONNX session must not produce a canned sentence while real decoding is unimplemented."""
    monkeypatch.setattr(settings, "ALLOW_MOCK_FALLBACK", False)
    engine = IndicConformerEngine()
    monkeypatch.setitem(engine.sessions, "kn", {"model_id": "test", "session": object(), "loaded_at": 0, "status": "ready"})
    wav_bytes = create_synthetic_wav(1.0, 16000)
    response = client.post(
        "/transcribe",
        headers={"X-FLOVA-STT-KEY": TEST_KEY},
        json={"audioBase64": base64.b64encode(wav_bytes).decode(), "mimeType": "audio/wav", "language": "kn"},
    )
    assert response.status_code == 503
    assert "ಪೆಟ್ರೋಲ್" not in response.text


# =====================================================================
# SEC-05: CORS Security & Configuration Tests
# =====================================================================

def test_cors_allowed_origin_get():
    """Validates that permitted origin receives Access-Control-Allow-Origin without credentials."""
    response = client.get("/health", headers={"Origin": "http://localhost:5173"})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    # Credentials must NOT be allowed
    assert response.headers.get("access-control-allow-credentials") != "true"


def test_cors_allowed_production_origin():
    """Validates that production web origin receives Access-Control-Allow-Origin."""
    response = client.get("/health", headers={"Origin": "https://myflova.vercel.app"})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://myflova.vercel.app"
    assert response.headers.get("access-control-allow-credentials") != "true"


def test_cors_rejected_origin():
    """Validates that unauthorized origins do not receive Access-Control-Allow-Origin header."""
    response = client.get("/health", headers={"Origin": "https://malicious-attacker.evil.com"})
    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers


def test_cors_missing_origin_header():
    """Validates that standard server-to-server calls without Origin header work with zero CORS interference."""
    response = client.get("/health")
    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers


def test_cors_preflight_options_allowed():
    """Validates preflight OPTIONS request for /transcribe with authorized headers and methods."""
    response = client.options(
        "/transcribe",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type, X-FLOVA-STT-KEY, Authorization",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert "POST" in response.headers.get("access-control-allow-methods", "")
    assert "X-FLOVA-STT-KEY" in response.headers.get("access-control-allow-headers", "")
    assert response.headers.get("access-control-max-age") == "600"
    assert response.headers.get("access-control-allow-credentials") != "true"


def test_cors_preflight_options_rejected_origin():
    """Validates that preflight OPTIONS from unauthorized origins do NOT return allow-origin."""
    response = client.options(
        "/transcribe",
        headers={
            "Origin": "https://evil-origin.example.com",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert "access-control-allow-origin" not in response.headers


def test_cors_preflight_options_disallowed_method():
    """Validates that preflight OPTIONS for disallowed methods (e.g. DELETE) returns HTTP 400."""
    response = client.options(
        "/transcribe",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "DELETE",
        },
    )
    assert response.status_code == 400


def test_cors_env_parsing_and_wildcard_rejection():
    """Validates safe parsing and rejection of wildcard '*' in environment origins."""
    from stt_service.config import parse_cors_origins

    # Unset returns safe defaults
    default_origins = parse_cors_origins(None)
    assert "http://localhost:5173" in default_origins
    assert "https://myflova.vercel.app" in default_origins

    # Empty string returns empty list (zero cross-origin access)
    empty_origins = parse_cors_origins("")
    assert empty_origins == []

    # Custom origins
    custom_origins = parse_cors_origins("https://custom1.com, https://custom2.com")
    assert custom_origins == ["https://custom1.com", "https://custom2.com"]

    # Wildcard '*' is strictly stripped out
    wildcard_filtered = parse_cors_origins("*, https://safe.com, *")
    assert wildcard_filtered == ["https://safe.com"]
    assert "*" not in wildcard_filtered

