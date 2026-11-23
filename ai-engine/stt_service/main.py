import base64
import hmac
import time
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .config import settings
from .audio import convert_audio_to_16k_mono_wav, load_wav_as_numpy
from .conformer_engine import IndicConformerEngine

app = FastAPI(
    title="FLOVA IndicConformer STT Service",
    description="Primary Speech-to-Text inference service using AI4Bharat IndicConformer for FLOVA",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singleton IndicConformer engine
engine = IndicConformerEngine(
    cache_dir=settings.MODEL_CACHE_DIR,
    hf_token=settings.HF_TOKEN
)

start_time = time.time()

class TranscribeRequest(BaseModel):
    audioBase64: Optional[str] = Field(None, description="Base64 encoded audio string")
    mimeType: Optional[str] = Field("audio/webm", description="MIME type of incoming audio")
    language: Optional[str] = Field("kn", description="Target language code: kn, hi, te, ta, ml, en, or auto")

class TranscribeResponse(BaseModel):
    success: bool
    transcript: str
    language: str
    provider: str = "indicconformer"
    duration_ms: float
    confidence: float

class HealthResponse(BaseModel):
    status: str
    service: str
    uptime_seconds: float
    memory_rss_mb: float
    loaded_models: list[str]
    supported_languages: list[str]

def verify_stt_auth(
    x_flova_stt_key: Optional[str] = Header(None, alias="X-FLOVA-STT-KEY"),
    authorization: Optional[str] = Header(None)
):
    """
    Validates internal authentication key between Supabase Edge Function and FastAPI service.
    Accepts X-FLOVA-STT-KEY header or Authorization: Bearer <key>.
    """
    expected_key = settings.FLOVA_STT_INTERNAL_KEY
    if not expected_key:
        # Fail closed: an unconfigured service must never accept unauthenticated audio.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="STT service is not configured: FLOVA_STT_INTERNAL_KEY is not set."
        )

    provided_key = None
    if x_flova_stt_key:
        provided_key = x_flova_stt_key
    elif authorization and authorization.startswith("Bearer "):
        provided_key = authorization.split("Bearer ", 1)[1].strip()

    if provided_key is None or not hmac.compare_digest(provided_key, expected_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-FLOVA-STT-KEY authentication header."
        )
    return True

@app.get("/health", response_model=HealthResponse)
def health_check():
    engine_status = engine.get_status()
    return HealthResponse(
        status="ok",
        service="flova-indicconformer-stt",
        uptime_seconds=round(time.time() - start_time, 2),
        memory_rss_mb=engine_status["memory_rss_mb"],
        loaded_models=engine_status["loaded_models"],
        supported_languages=engine_status["supported_languages"]
    )

@app.get("/models")
def list_models(auth: bool = Depends(verify_stt_auth)):
    return {
        "engine": "AI4Bharat IndicConformer",
        "primary_languages": ["kn", "hi", "te"],
        "all_supported": settings.SUPPORTED_LANGUAGES,
        "loaded_in_memory": engine.loaded_models
    }

@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(
    req: TranscribeRequest,
    auth: bool = Depends(verify_stt_auth)
):
    if not req.audioBase64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing audioBase64 payload in request body."
        )

    try:
        # 1. Clean base64 header
        raw_b64 = req.audioBase64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]
        audio_bytes = base64.b64decode(raw_b64)

        if len(audio_bytes) < 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio payload is too small or empty."
            )

        # 2. Extract input format
        input_format = "webm"
        mime = (req.mimeType or "").lower()
        if "mp4" in mime or "m4a" in mime:
            input_format = "mp4"
        elif "ogg" in mime:
            input_format = "ogg"
        elif "wav" in mime:
            input_format = "wav"
        elif "mp3" in mime:
            input_format = "mp3"

        # 3. Convert to 16 kHz mono WAV
        wav_bytes = convert_audio_to_16k_mono_wav(audio_bytes, input_format=input_format)
        audio_array, sample_rate = load_wav_as_numpy(wav_bytes)

        # 4. Transcribe using IndicConformer singleton
        lang = req.language or settings.DEFAULT_LANGUAGE
        result = engine.transcribe(audio_array, sample_rate, language=lang)

        return TranscribeResponse(
            success=True,
            transcript=result["transcript"],
            language=result["language"],
            provider=result["provider"],
            duration_ms=result["duration_ms"],
            confidence=result["confidence"]
        )

    except HTTPException:
        raise
    except RuntimeError as e:
        if "not installed" in str(e):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"IndicConformer STT inference error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"IndicConformer STT inference error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai-engine.stt_service.main:app", host=settings.HOST, port=settings.PORT, reload=False)
