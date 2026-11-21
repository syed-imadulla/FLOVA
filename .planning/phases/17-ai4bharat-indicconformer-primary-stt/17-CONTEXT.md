# Phase 17 Context: AI4Bharat IndicConformer Primary STT Migration

## Objective
Establish AI4Bharat IndicConformer as FLOVA's PRIMARY speech-to-text engine while maintaining the existing Groq Whisper implementation as the robust, secondary fallback. The voice capture, financial intent extraction, and `/add` review flows must remain completely intact.

---

## 1. Architecture & Design Decisions

### Primary vs Fallback Provider Workflow
```
[User Spoken Utterance in App]
          │
          ▼
[Audio Recording (16kHz Mono)]
          │
          ▼
[Supabase Edge Function: process-voice]
          │
          ├─────────────────────────────────────────┐
          │ (Primary Attempt)                       │ (Secondary Fallback on error/timeout/empty)
          ▼                                         ▼
[IndicConformer FastAPI Service]          [Groq Whisper API]
(ai4bharat IndicConformer STT)            (whisper-large-v3-turbo)
          │                                         │
          └────────────────────┬────────────────────┘
                               │
                               ▼
                      [Transcript Text]
                               │
                               ▼
                 [Groq LLM Intent Extractor]
             (Multiple Transactions, Payouts, Queries)
                               │
                               ▼
                 [/add Review & Confirmation]
                               │
                               ▼
                [PostgreSQL Database with RLS]
```

### IndicConformer Checkpoints & Languages
- **Target Indian Languages:**
  - `kn`: Kannada (`ai4bharat/indicconformer_stt_kn_hybrid_ctc_rnnt_large`)
  - `hi`: Hindi (`ai4bharat/indicconformer_stt_hi_hybrid_ctc_rnnt_large`)
  - `te`: Telugu (`ai4bharat/indicconformer_stt_te_hybrid_ctc_rnnt_large`)
  - `ta`: Tamil (`ai4bharat/indicconformer_stt_ta_hybrid_ctc_rnnt_large`)
  - `ml`: Malayalam (`ai4bharat/indicconformer_stt_ml_hybrid_ctc_rnnt_large`)
  - Multilingual ONNX: `ai4bharat/indic-conformer-600m-multilingual`
- **Inference Runtime:** Python 3.14 with ONNX Runtime (`onnxruntime 1.29.0`) & PyTorch CPU (`torch 2.13.0+cpu`).
- **Memory & Latency Optimization:**
  - Models loaded once as singletons on application startup; reused across requests.
  - Native 16 kHz mono WAV conversion.

### Security & Secret Hygiene
- `HF_TOKEN`: Stored server-side only in `.env` if model download requires authentication; never exposed to frontend.
- `FLOVA_STT_INTERNAL_KEY`: Pre-shared bearer token authenticating Edge Function calls to the FastAPI STT service (`X-FLOVA-STT-KEY`).
- `GROQ_API_KEY`: Retained for Whisper fallback and Groq LLM extraction.

### Invariants & Non-Negotiables
- IndicConformer is strictly STT (audio $\rightarrow$ text). It does not perform LLM extraction.
- The financial engine remains authoritative for all calculations in integer paise.
- Zero silent database writes; all transactions must be reviewed and confirmed by the user in `/add`.
- Provider provenance is recorded on candidates (`stt_provider: "indicconformer"` vs `"whisper"`).
