# FLOVA — Project Handoff & Release State (2026-11-21)

This document is the authoritative summary of the FLOVA codebase, architecture, production-ready features, database migrations, testing matrix, and operations.

---

## 1. Product Identity & Purpose

- **Product:** FLOVA
- **Tagline:** *"Every rupee has a story. FLOVA remembers."*
- **Audience:** Gig delivery partners (Swiggy, Zomato, Zepto, Blinkit), drivers (Uber, Ola, Rapido), auto drivers, freelancers, tradespeople, small vendors, and daily-wage workers across India.
- **Problem Solved:** Irregular cash flows make traditional monthly budgets impractical. FLOVA turns volatile earnings into sustainable weekly self-salaries, isolates third-party funds (e.g. COD collections), detects runway shortfalls before they become crises, and automates micro-savings for lean periods.

---

## 2. Implemented Features & Verification Matrix

| Area | Feature | Status | Verification Reference |
|---|---|---|---|
| **Voice Intelligence** | AI4Bharat IndicConformer Primary STT | Verified | `frontend/src/services/__tests__/sttProviderMigration.test.ts` |
| **Voice Intelligence** | Groq Whisper Secondary Fallback | Verified | `backend/supabase/functions/process-voice/` |
| **Voice Intelligence** | Multilingual (10 Indian Languages) | Verified | `frontend/src/services/__tests__/multilingualVoice.test.ts` |
| **Voice Intelligence** | Multi-Transaction Extraction (No amount dup) | Verified | `frontend/src/services/__tests__/multiTransactionVoice.test.ts` |
| **Smart Capture** | 20 MB Receipt Upload with Client Downscaling | Verified | `frontend/src/services/__tests__/receiptUpiRepair.test.ts` |
| **Smart Capture** | UPI Screenshot Intelligence (GPay, PhonePe, Paytm, CRED) | Verified | `frontend/src/services/__tests__/smartCaptureReceiptUpi.test.ts` |
| **Smart Capture** | Duplicate UTR Reference Detection | Verified | `frontend/src/services/receipt.ts` |
| **Invoicing** | Invoices & Partial Settlements (Payables/Receivables) | Verified | `frontend/src/services/__tests__/invoiceIntelligence.test.ts` |
| **Financial Engine** | Deterministic Integer Paise Math | Verified | `frontend/src/engine/__tests__/balance.test.ts` |
| **Financial Engine** | ₹10 Lakh Individual & Daily Aggregate Limit | Verified | `backend/supabase/migrations/20261121000300_enforce_daily_transaction_limit.sql` |
| **Runway Engine** | 30-Day Buffer Deficit & Shortfall Outlook | Verified | `frontend/src/runway/__tests__/ravi.test.ts` |
| **WISH 2.0** | PostgreSQL-Persisted Micro-Goals & Surplus Allocation | Verified | `frontend/src/services/__tests__/wishPersistence.test.ts` |
| **Security** | Row Level Security across all 10 tables | Verified | `backend/scripts/test-db.mjs` (54 passed) |

---

## 3. Technology Stack Summary

- **Frontend:** React 18.3, Vite 5.4.11, TypeScript 5.6.3, Tailwind CSS 3.4.19.
- **PWA Capabilities:** Web App Manifest, Service Worker (network-first caching), Web Share Target.
- **Backend & Database:** Supabase Auth & PostgreSQL 15 with Row Level Security on project `msjzkylvafuwlkkujxpv`.
- **Serverless Edge Functions:** `process-voice` and `extract-receipt` deployed on Deno runtime with self-healing model discovery.
- **AI / Speech-to-Text:** AI4Bharat IndicConformer (FastAPI microservice in `ai-engine/stt_service/` on port 8001), Groq Whisper Large v3 turbo.
- **AI / Vision & Extraction:** Groq Qwen 2.5 27B Vision, Groq Llama 3.3 70B Versatile.

---

## 4. Repository Layout & Map

```
frontend/
  src/screens/                 13 views (Home, Activity, Voice, Catch, Review /add, Invoices, Wish, Insights, etc.)
  src/app/AppLayout.tsx        Persistent mobile layout with bottom navigation
  src/engine/                  Deterministic TypeScript financial engine (balance, runway, buffer, validation)
  src/services/                Client data services (data.ts, voice.ts, receipt.ts, invoices.ts, imageOptimizer.ts)
  src/voice/                   Audio recording & browser speech recognition
  src/wish/                    WISH 2.0 micro-savings service
  src/types/contracts.ts       Canonical TypeScript interfaces and data contracts
backend/
  supabase/migrations/         7 SQL migrations (schema, grants, payout hardening, profiles, limits, invoices, wish)
  supabase/functions/          Edge Functions (process-voice, extract-receipt)
  scripts/                     Database tests (test-db.mjs, seed-demo.mjs, rls-live-check.mjs)
ai-engine/
  stt_service/                 FastAPI AI4Bharat IndicConformer service (main.py, conformer_engine.py, audio.py)
  udaan_engine/                Python reference backtesting engine
  benchmark_stt.py             Comparative benchmark suite (IndicConformer vs Whisper)
docs/                          10 comprehensive technical guides
```

---

## 5. Branch & Release Policy

- **`dev`:** Active integration branch.
- **`main`:** Release-ready branch containing only fully-verified changes.
- **Release Procedure:** Merge `dev` into `main` via `git merge dev --no-ff`, run all 30 frontend suites, 54 DB tests, 23 Python tests, and `npm run build`, then push to `origin/main`.
