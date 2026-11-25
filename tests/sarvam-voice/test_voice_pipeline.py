import base64
import os
import time
import wave
from pathlib import Path
from sarvamai import SarvamAI

ROOT_ENV = Path(__file__).resolve().parents[2] / ".env"
OUT_DIR = Path(__file__).resolve().parent / "artifacts"


def load_sarvam_key() -> str:
    key = os.environ.get("SARVAM_API_KEY", "").strip()
    if key:
        return key
    if ROOT_ENV.exists():
        for line in ROOT_ENV.read_text(encoding="utf-8").splitlines():
            if line.startswith("SARVAM_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def main() -> None:
    api_key = load_sarvam_key()
    if not api_key:
        raise SystemExit("SARVAM_API_KEY is missing in .env")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    client = SarvamAI(api_subscription_key=api_key)

    in_wav = OUT_DIR / "input_kanglish.wav"
    if not in_wav.exists():
        raise SystemExit("Run test_saaras.py first to create input_kanglish.wav")

    # 1. Audio input -> Saaras v4 STT
    t0 = time.perf_counter()
    with in_wav.open("rb") as f:
        stt_resp = client.speech_to_text.transcribe(
            file=(in_wav.name, f, "audio/wav"),
            model="saaras:v4",
            mode="codemix",
            language_code="unknown",
        )
    stt_ms = round((time.perf_counter() - t0) * 1000, 1)
    assert stt_resp.transcript.strip(), "Empty STT transcript"

    # 2. Recognized text -> Bulbul v4 Flash TTS (no DB/LLM)
    t1 = time.perf_counter()
    tts_resp = client.text_to_speech.convert(
        text=stt_resp.transcript,
        language_code=stt_resp.language_code or "kn-IN",
        model="bulbul:v4-flash",
        speaker="chaitra_kn_conversation",
        output_audio_codec="wav",
    )
    tts_ms = round((time.perf_counter() - t1) * 1000, 1)

    out_wav = OUT_DIR / "e2e_kanglish_reply.wav"
    out_wav.write_bytes(base64.b64decode(tts_resp.audios[0]))
    with wave.open(str(out_wav), "rb") as wf:
        dur = round(wf.getnframes() / float(wf.getframerate()), 2)

    print(
        f"[E2E Pipeline] OK | stt_latency={stt_ms}ms | tts_latency={tts_ms}ms | "
        f"lang={stt_resp.language_code} | transcript={stt_resp.transcript!r} | out={out_wav.name} ({dur}s)"
    )


if __name__ == "__main__":
    main()
