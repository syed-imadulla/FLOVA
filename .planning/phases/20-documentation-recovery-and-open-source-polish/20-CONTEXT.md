# Phase 20: Documentation Recovery and Open-Source Polish — Context

## 1. Objective
Transform the FLOVA repository into a polished, professional, developer-friendly open-source project with an accurate, high-quality README.md, standard MIT License, consistent technical documentation across docs/, and verified Makefile development workflows.

## 2. Locked Decisions

### A. Licensing
- Standard MIT License with SPDX identifier `MIT`.
- Copyright holder: `Copyright (c) 2026 Syed Imadulla`.
- Created as root-level `LICENSE` directly from standard canonical template.
- Updated package metadata in `frontend/package.json` and `backend/package.json` to `"license": "MIT"`.

### B. Accurate Architecture & System Boundaries
- **Primary STT:** AI4Bharat IndicConformer FastAPI microservice (`ai-engine/stt_service/`, port 8001), prioritizing checkpoints for `kn`, `hi`, `te`, `ta`, `ml`, `en`.
- **Secondary STT Fallback:** Groq Whisper (`whisper-large-v3-turbo` / `whisper-large-v3`) via Supabase Edge Function `process-voice` on timeout (>7s) or error.
- **Intent Extraction:** Groq Llama 3.3 Versatile (`llama-3.3-70b-versatile`).
- **Vision Extraction:** Groq Qwen 2.5 27B Vision (`qwen/qwen3.8-27b`) via Supabase Edge Function `extract-receipt` with self-healing model fallback.
- **Financial Calculation Engine:** Deterministic TypeScript in `frontend/src/engine/` operating strictly in integer paise (`100 paise = ₹1.00`). No LLM arithmetic.
- **Safety Limits:** ₹10,00,000 individual and India calendar-day (`Asia/Kolkata`) aggregate limits enforced in PostgreSQL triggers with row-level locks.
- **Money Isolation:** Custodial third-party money (`ownership: 'not_mine'`) is isolated from personal spendable balance.
- **Development Tooling:** Root `Makefile` with one-command process supervision and real-time public HTTPS tunneling via `scripts/dev-runner.py`.

### C. Feature Status Classification
- **Implemented:**
  - Multilingual voice capture with IndicConformer primary & Whisper fallback.
  - Smart Capture for paper receipts and UPI screenshots (GPay, PhonePe, Paytm, CRED).
  - Invoice management with itemization, due dates, and partial settlements.
  - Deterministic paise arithmetic and available cash calculation.
  - Adaptive safety buffer and 30-day runway projections.
  - WISH 2.0 persistent savings goals.
  - Unified one-command Makefile with public HTTPS tunnel.
- **Experimental:**
  - PWA Web Share Target integration across mobile operating systems.
  - On-device ONNX Runtime execution for multilingual IndicConformer.
- **Planned:**
  - Automated PDF bank statement parser.
  - Direct UPI intent integration for payment settlement.
  - Multi-party expense splitting for shared vehicle rentals.

### D. Documentation Style & Safety
- Concise, technical, professional tone without marketing hyperbole.
- No fake benchmarks, unsupported speed claims, or decorative emojis.
- Valid Mermaid diagrams reflecting actual source code connections.
- Zero exposed secrets or private credentials.
- Work conducted strictly on `dev` branch with approval required before committing or pushing.
