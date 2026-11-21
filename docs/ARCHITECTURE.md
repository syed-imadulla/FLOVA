# FLOVA: High-Level Architecture & System Boundaries

**Product:** FLOVA  
**Tagline:** *Every rupee has a story. FLOVA remembers.*  
**Target User:** Indian gig workers, delivery drivers, freelancers, small vendors, and tradespeople facing irregular cash flows.

---

## 1. System Philosophy & Core Invariants

FLOVA is built upon five non-negotiable architectural invariants:

1. **AI Suggests, User Confirms:** AI extraction (speech-to-text, LLM intent parsing, receipt vision OCR) produces candidate drafts. No candidate is ever directly written to the transaction database. User confirmation in `/add` is strictly required.
2. **Deterministic Financial Computation:** All financial balances, runway projections, and daily limits are calculated by a deterministic TypeScript engine in `frontend/src/engine/` using integer paise. LLMs never calculate financial balances or perform authoritative arithmetic.
3. **Strict Money Segregation:** Personal income/expenses, custodial third-party collections (Cash on Delivery / `not_mine`), and expected future payouts (`expected_payout`) are strictly isolated in memory and PostgreSQL.
4. **Truthful Uncertainty:** Missing or ambiguous attributes (amounts, expense classifications, dates) remain `null` and flag `needsReview: true`. The system never invents or hallucinates financial data.
5. **Zero Trust & Row Level Security:** Supabase Auth and PostgreSQL Row Level Security (RLS) enforce tenant isolation. Client requests never specify `user_id`; database defaults resolve `auth.uid()`.

---

## 2. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT (PWA)                                      |
|  React 18 · Vite · TypeScript · Tailwind CSS · Service Worker (Web Share Target)   |
|                                                                                   |
|  +--------------------+   +---------------------+   +--------------------------+  |
|  |  Voice Capture     |   |   Smart Capture     |   |   Invoice Manager        |  |
|  |  (10 Indic Langs)  |   |   (Receipts / UPI)  |   |   (Payables/Receivables) |  |
|  +---------+----------+   +----------+----------+   +------------+-------------+  |
|            |                         |                           |                |
|            +-------------------------+---------------------------+                |
|                                      | (Draft Candidate)                          |
|                                      v                                            |
|                       +-------------------------------+                           |
|                       |   Unified Review & Add Screen |                           |
|                       |   (/add Confirmation Route)   |                           |
|                       +---------------+---------------+                           |
|                                       | (Explicit User Confirm)                   |
|                                       v                                            |
|                       +-------------------------------+                           |
|                       |   Deterministic Money Engine  |                           |
|                       |   (Integer Paise Arithmetic)  |                           |
|                       +---------------+---------------+                           |
+---------------------------------------|-------------------------------------------+
                                        | HTTPS / Supabase JWT
                                        v
+-----------------------------------------------------------------------------------+
|                         BACKEND & SERVERLESS RUNTIME                              |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                         Supabase Edge Functions                            |  |
|  |                                                                             |  |
|  |   [process-voice]                                   [extract-receipt]       |  |
|  |   Primary: IndicConformer (FastAPI)                 Vision: Groq Qwen 27B   |  |
|  |   Fallback: Groq Whisper Large v3                   Self-healing fallback   |  |
|  |   Extraction: Groq Llama 3.3 Versatile                                      |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                       FastAPI IndicConformer Microservice                   |  |
|  |   Python 3.14 · ONNX Runtime · PyTorch · 16 kHz Mono Audio Preprocessing    |  |
|  |   Singletons: Kannada, Hindi, Telugu, Tamil, Malayalam, Multilingual        |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                       PostgreSQL 15 with Row Level Security                 |  |
|  |                                                                             |  |
|  |   • transactions         • profiles                 • invoices              |  |
|  |   • payouts              • balance_checkins         • invoice_settlements   |  |
|  |   • commitments          • wish_goals               • wish_contributions    |  |
|  |                                                                             |  |
|  |   Triggers & Functions:                                                     |  |
|  |   - Enforce ₹10,00,000 daily aggregate limit (IST calendar day)             |  |
|  |   - Payout synchronization & row-level locking state machine                |  |
|  |   - Invoice settlement balance sync & status updates                        |  |
|  |   - Profile creation on auth.users sign-up                                  |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Component Directory Layout

- `frontend/src/screens/`: 13 specialized screen views (Home, Activity, Voice, Catch, Review `/add`, Invoices, Wish, Insights, etc.).
- `frontend/src/engine/`: Pure deterministic TypeScript engine (balance calculation, runway simulation, safe buffer estimation, candidate normalization).
- `frontend/src/services/`: Client-side data layers (`data.ts`, `voice.ts`, `receipt.ts`, `invoices.ts`, `imageOptimizer.ts`).
- `backend/supabase/functions/`: Deno Edge Functions with CORS, rate-limiting, and model discovery (`process-voice`, `extract-receipt`).
- `backend/supabase/migrations/`: 7 idempotent SQL migrations defining schemas, constraints, RLS policies, triggers, and daily limits.
- `ai-engine/stt_service/`: Independent Python FastAPI service wrapping AI4Bharat IndicConformer checkpoints.
- `ai-engine/udaan_engine/`: Python reference implementation for backtesting self-salary and lean-week outlooks.
