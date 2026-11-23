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
    res_auth = client.get("/models", headers={"X-FLOVA-STT-KEY": settings.FLOVA_STT_INTERNAL_KEY})
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
        headers={"X-FLOVA-STT-KEY": settings.FLOVA_STT_INTERNAL_KEY},
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
        headers={"X-FLOVA-STT-KEY": settings.FLOVA_STT_INTERNAL_KEY},
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
        headers={"X-FLOVA-STT-KEY": settings.FLOVA_STT_INTERNAL_KEY},
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
        headers={"X-FLOVA-STT-KEY": settings.FLOVA_STT_INTERNAL_KEY},
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
        headers={"X-FLOVA-STT-KEY": settings.FLOVA_STT_INTERNAL_KEY},
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
