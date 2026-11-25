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


def synthesize_sample(client: SarvamAI, out_path: Path, text: str, lang_code: str, speaker: str) -> float:
    resp = client.text_to_speech.convert(
        text=text,
        language_code=lang_code,
        model="bulbul:v4-flash",
        speaker=speaker,
        output_audio_codec="wav",
    )
    out_path.write_bytes(base64.b64decode(resp.audios[0]))
    with wave.open(str(out_path), "rb") as wf:
        return round(wf.getnframes() / float(wf.getframerate()), 2)


def main() -> None:
    api_key = load_sarvam_key()
    if not api_key:
        raise SystemExit("SARVAM_API_KEY is missing in .env")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    client = SarvamAI(api_subscription_key=api_key)

    samples = [
        ("kanglish", "kn-IN", "chaitra_kn_conversation", "codemix", "ನಾನು ಇಂದು food ಗೆ 150 ರೂಪಾಯಿ ಖರ್ಚು ಮಾಡಿದೆ."),
        ("hinglish", "hi-IN", "simran_hi_conversation", "codemix", "मैंने आज food पर 150 रुपये खर्च किए।"),
        ("english", "en-IN", "dev_en_conversational", "transcribe", "I spent 150 rupees on food today."),
    ]

    for tag, tts_lang, speaker, stt_mode, text in samples:
        wav_path = OUT_DIR / f"input_{tag}.wav"
        dur = synthesize_sample(client, wav_path, text, tts_lang, speaker)

        t0 = time.perf_counter()
        with wav_path.open("rb") as f:
            stt_resp = client.speech_to_text.transcribe(
                file=(wav_path.name, f, "audio/wav"),
                model="saaras:v4",
                mode=stt_mode,
                language_code="unknown",
            )
        latency_ms = round((time.perf_counter() - t0) * 1000, 1)
        print(
            f"[Saaras {tag}] OK | audio={dur}s | latency={latency_ms}ms | "
            f"detected_lang={stt_resp.language_code} | transcript={stt_resp.transcript!r}"
        )


if __name__ == "__main__":
    main()
