# IndicConformer Production Plan

**Date:** 2026-11-23 · **Status:** Plan only. Nothing deployed, nothing downloaded.

## 1. What actually exists today (verified)

| Item | Finding | Evidence |
|---|---|---|
| Real inference | **None.** `_decode_ctc_onnx` returns a fixed Kannada sentence ("₹300 on petrol today") for any audio | `ai-engine/stt_service/conformer_engine.py` |
| Model weights | None. Cache directory is empty; no download code | `~/.cache/flova_indicconformer/` |
| Feature extraction / decoder | None (no mel filterbank, no CTC/RNNT decoding, no vocabulary) | `conformer_engine.py` |
| Benchmarks | Mock output (0.29 ms "latency", 38 MB RSS, fixed sentence) | `ai-engine/benchmark_results.json` |
| Tests | Assert the fixed sentence under mock mode | `ai-engine/tests/test_stt_service.py` |
| Auth key | Falls back to a hard-coded key that is public in the repo | `ai-engine/stt_service/config.py` |
| Production voice | Groq Whisper only (no `INDICCONFORMER_URL` secret) | Supabase secrets list |
| CLAUDE.md / docs | Describe IndicConformer as the "primary" STT; true in code paths, never true in practice | `CLAUDE.md` §3 |

The Edge Function fallback is correct: if IndicConformer is unset, slow (>7 s) or failing, `process-voice` uses Groq Whisper. That keeps users safe today.

**Latent risk:** if anyone places an ONNX file in the cache and hosts the service as-is, every recording becomes "₹300 petrol" and is sent to the LLM as real speech. AI-suggests/user-confirms limits the damage, but it is a wrong-data path.

## 2. What the real model needs (external, verify before building)

- Model: `ai4bharat/indic-conformer-600m-multilingual` (MIT; gated on Hugging Face, needs an account that accepts the terms and an `HF_TOKEN`). Hybrid CTC + RNNT, one model for 22 languages including kn, hi, te, ta, ml.
- No official ONNX export. Community int8 exports exist (~0.62 GB encoder vs ~2.4 GB fp32), but they omit the featurizer, and one report shows int8 `ConvInteger` failing on ONNX Runtime CPU until re-quantized to uint8. The `indic-asr-onnx` PyPI package wraps this (CTC/RNNT, auto-download, CPU PyTorch).
- Planning estimate (to be measured, not assumed): 1.5–3 GB RSS with int8 + PyTorch CPU featurizer; 1–4 s CPU for a 5 s clip on 1–2 vCPU; cold start (model load) of tens of seconds.

Sources: [HF model card](https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual), [AIKosh listing](https://aikosh.indiaai.gov.in/home/models/details/aibharat_indicconformer_600m_multi.html), [AI4Bharat GitHub](https://github.com/AI4Bharat/IndicConformerASR), [int8 ONNX community build](https://huggingface.co/yashwork-byte/indic-conformer-600m-int8-onnx), [per-language ONNX packs (ConvInteger note)](https://huggingface.co/nmukthap/vertexvoice-indic), [indic-asr-onnx](https://pypi.org/project/indic-asr-onnx/).

## 3. Hosting options (prices change; confirm on the live pages)

| Option | Fit | Approx. cost | Notes |
|---|---|---|---|
| Render Standard (1 CPU, 2 GB) | Tight; may OOM | ~$25/mo | Always-on; simple Docker deploy |
| Render Pro (2 CPU, 4 GB) | Comfortable | ~$85/mo | Recommended Render size if measured RSS > 1.6 GB |
| Railway (usage-based) | Pay per GB-month of RAM and vCPU | ~$10/GB RAM + ~$20/vCPU per month; 2 GB + 1 vCPU ≈ $40/mo always-on | Hobby $5 / Pro $20 base covers part of usage |

Sources: [Render pricing](https://render.com/pricing), [Render compute plans](https://render.com/docs/compute-plans), [Railway pricing](https://railway.com/pricing), [Railway plan docs](https://docs.railway.com/reference/pricing/plans).

Region: pick Singapore or Mumbai if offered, near Supabase `ap-south-1`, to stay inside the 7 s Edge Function budget.

## 4. Plan

### Step 0. Make the stub safe (local, small, recommended now)
1. `_decode_ctc_onnx` raises instead of returning the fixed sentence.
2. Remove the hard-coded default `FLOVA_STT_INTERNAL_KEY`; the service refuses to start (or returns 503) without one.
3. Mark `benchmark_results.json` as mock data, or delete it; correct CLAUDE.md §3 to say production uses Groq Whisper until real IndicConformer inference ships.

### Step 1. Real inference, locally (needs your approval to download ~0.6–2.4 GB and accept the HF terms)
1. You accept the model terms on Hugging Face and create a read token (you handle the token; it goes in `ai-engine/.env`, never Git).
2. Implement `transcribe()` with the official model or a verified int8 ONNX build: 16 kHz mono → featurizer → encoder → CTC greedy decode (RNNT later), language passed explicitly (`kn`, `hi`, `te`, `ta`, `ml`, `en`→Whisper).
3. Replace mock tests with tests on short fictional recordings in each language; keep the mock flag test-only.
4. Measure peak RSS, cold-start time and latency per clip length on 1 and 2 vCPU (Docker `--cpus`, `--memory`).

### Step 2. Accuracy gate (decides whether hosting is worth paying for)
- Record ~10 fictional money sentences per language (kn, hi, te), the kind FLOVA expects ("ಇವತ್ತು ಊಟಕ್ಕೆ 180 ಖರ್ಚು", "आज 650 कमाए").
- Compare IndicConformer vs Groq Whisper on: word error rate, amount correctly heard, and the end result (correct candidate after `process-voice`).
- Host only if IndicConformer is clearly better on amounts/candidates. Otherwise keep Groq only and stop here.

### Step 3. Hosting package (local, no deploy)
- `ai-engine/Dockerfile` (python-slim + ffmpeg + CPU-only deps; model downloaded at build or first boot into a volume), `/health` used as health check, single worker.
- `render.yaml` or Railway config; env: `FLOVA_STT_INTERNAL_KEY`, `HF_TOKEN`, `INDICCONFORMER_CACHE_DIR`.
- CORS: remove `allow_origins=["*"]`; only the Edge Function calls this service (server-to-server).
- Request limits: max audio size/duration, one inference at a time, timeout below 7 s.

### Step 4. Deploy (each needs explicit approval)
1. Deploy the service; verify `/health`, 401 without key, a real transcription with key.
2. Set Supabase secrets `INDICCONFORMER_URL` and `INDICCONFORMER_KEY` (Supabase change).
3. Production checks: IndicConformer success path; forced timeout → Groq fallback; service down → Groq fallback; responses show `stt_provider` correctly.

### Step 5. Operate
- Monitor latency and fallback rate; if fallback > ~20%, scale up or switch back to Groq only (unset the secret, no code change).
- Budget alert on the hosting account.

## 5. Recommendation

Do **Step 0 now** (small, closes a security and wrong-data risk), launch Phase 2 on **Groq Whisper**, and run Steps 1–2 as a separate track. Pay for hosting only after the accuracy gate shows IndicConformer beats Whisper on real FLOVA sentences. Both engines stay in the architecture either way, and the fallback already protects users.
