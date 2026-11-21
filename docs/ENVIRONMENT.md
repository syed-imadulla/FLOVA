# FLOVA: Environment Variables & Secrets Reference

## 1. Classification & Security Rules

Environment variables in FLOVA are divided into three strict tiers:

1. **Public Client Variables (`VITE_*`):** Embedded into the client bundle at build time. Must NEVER contain secrets, private tokens, or service-role keys.
2. **Edge Function Secrets:** Stored securely in Supabase vault and accessible only to serverless Deno runtimes.
3. **STT Microservice Configuration:** Stored in local `.env` or systemd environment files for the Python service.

---

## 2. Frontend Environment (`frontend/.env.local`)

| Variable | Description | Security Tier | Example |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Supabase Project API Gateway URL | Public | `https://msjzkylvafuwlkkujxpv.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public publishable key with RLS protection | Public | `eyJhbGciOi...` |

*Never add service role keys, Groq API keys, or Hugging Face tokens to `frontend/.env.local`.*

---

## 3. Supabase Edge Functions Secrets

| Secret Name | Purpose | Required By | Security Tier |
|---|---|---|---|
| `GROQ_API_KEY` | API key for Whisper transcription, Qwen vision, and Llama 3.3 extraction | `process-voice`, `extract-receipt` | Secret (Server-side) |
| `SUPABASE_URL` | Internal URL for database client | System | System |
| `SUPABASE_ANON_KEY` | Anon key for authenticated JWT verification | System | System |
| `INDICCONFORMER_URL` | Internal HTTP URL for IndicConformer FastAPI `/transcribe` | `process-voice` | Private Network |
| `INDICCONFORMER_KEY` | Pre-shared bearer token (`X-FLOVA-STT-KEY`) for STT auth | `process-voice` | Secret (Server-side) |
| `GROQ_CHAT_MODEL` | (Optional) Override chat model | `process-voice` | Config |
| `GROQ_VISION_MODEL` | (Optional) Override vision model | `extract-receipt` | Config |
| `GROQ_STT_MODEL` | (Optional) Override Whisper STT model | `process-voice` | Config |

---

## 4. IndicConformer Python Service (`ai-engine/.env`)

| Variable | Purpose | Default | Required |
|---|---|---|---|
| `FLOVA_STT_PORT` | Listening TCP port | `8001` | No |
| `FLOVA_STT_HOST` | Network interface binding | `0.0.0.0` | No |
| `FLOVA_STT_INTERNAL_KEY` | Pre-shared key expected in `X-FLOVA-STT-KEY` header | `flova-indicconformer-secure-token-2026` | Yes |
| `INDICCONFORMER_CACHE_DIR` | Directory for caching ONNX / PyTorch models | `~/.cache/flova_indicconformer` | No |
| `HF_TOKEN` | (Optional) Hugging Face user access token for gated models | `""` | Optional |
| `DEVICE` | PyTorch execution device (`cpu` or `cuda`) | `cpu` | No |

*Note: IndicConformer is an open-source model released by AI4Bharat under the MIT / CC-BY license. Self-hosted inference does NOT require a paid subscription or API key.*
