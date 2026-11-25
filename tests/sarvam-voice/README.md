# Sarvam Voice API Verification (`tests/sarvam-voice`)

Isolated verification suite for Sprint 3D Phase 1:
- **STT:** `saaras:v4` (`client.speech_to_text.transcribe`)
- **TTS:** `bulbul:v4-flash` (`client.text_to_speech.convert`)
- **End-to-End:** Audio → Saaras v4 → recognized text → Bulbul v4 Flash → `.wav` output (no FLOVA DB or LLM calls).

Reads `SARVAM_API_KEY` from environment or root `.env`. Never logs or commits keys.
