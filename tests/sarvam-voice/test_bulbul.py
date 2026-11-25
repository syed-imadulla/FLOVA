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


def verify_wav(path: Path) -> dict:
    assert path.exists(), f"Audio file missing: {path}"
    size = path.stat().st_size
    assert size > 44, f"Audio file too small: {size} bytes"
    with wave.open(str(path), "rb") as wf:
        frames = wf.getnframes()
        rate = wf.getframerate()
        channels = wf.getnchannels()
        duration = frames / float(rate) if rate else 0.0
    assert duration > 0.2, f"Audio duration too short: {duration:.2f}s"
    return {"size_bytes": size, "sample_rate": rate, "channels": channels, "duration_sec": round(duration, 2)}


def main() -> None:
    api_key = load_sarvam_key()
    if not api_key:
        raise SystemExit("SARVAM_API_KEY is missing in .env")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    client = SarvamAI(api_subscription_key=api_key)

    cases = [
        ("kn", "kn-IN", "chaitra_kn_conversation", "ನೀವು ಇಂದು ಆಹಾರಕ್ಕಾಗಿ 150 ರೂಪಾಯಿ ಖರ್ಚು ಮಾಡಿದ್ದೀರಿ."),
        ("hi", "hi-IN", "simran_hi_conversation", "आपने आज खाने पर 150 रुपये खर्च किए।"),
        ("en", "en-IN", "dev_en_conversational", "You spent 150 rupees on food today."),
    ]

    for tag, lang_code, speaker, text in cases:
        t0 = time.perf_counter()
        resp = client.text_to_speech.convert(
            text=text,
            language_code=lang_code,
            model="bulbul:v4-flash",
            speaker=speaker,
            output_audio_codec="wav",
        )
        latency_ms = round((time.perf_counter() - t0) * 1000, 1)
        audio_b64 = resp.audios[0]
        out_path = OUT_DIR / f"bulbul_{tag}.wav"
        out_path.write_bytes(base64.b64decode(audio_b64))
        info = verify_wav(out_path)
        print(f"[Bulbul {tag}] OK | latency={latency_ms}ms | speaker={speaker} | {info} | file={out_path.name}")


if __name__ == "__main__":
    main()
