# FLOVA Production Readiness Audit Report
**Phase 1.1: Pre-Deployment & Architecture Verification**

**Audit Execution Date:** November 23, 2026  
**Audited Target:** `main` branch (commit `b60b212`)  
**Repository Working Tree:** Clean  
**Authoritative Environment:** Node.js v20+, Python 3.14+, PostgreSQL 15+ (Supabase)  

---

## 1. Executive Summary

FLOVA is a voice-first financial companion specifically designed for people with irregular and unpredictable income in India (delivery riders, gig partners, auto/cab drivers, freelancers, and small vendors).

This audit evaluates the entire repository—frontend, backend schema, Row Level Security (RLS) policies, Edge Functions, local financial calculation engine, voice and vision AI pipelines, and mobile packaging prerequisites—prior to public deployment on Vercel and subsequent Google Play Store distribution via Capacitor.

### High-Level Audit Verdict
- **Automated Verification:** **100% PASS** across all existing automated test suites:
  - **54/54 backend database tests passed** (`npm run test:db` via `@electric-sql/pglite` validating all 7 migrations, RLS isolation, triggers, and daily limits).
  - **17/17 demo seed & data isolation tests passed** (`npm run test:seed`).
  - **13/13 frontend service, runway, WISH, and financial engine suites passed** (`make test-frontend`).
  - **23/23 Python STT & Udaan engine unit tests passed** (`pytest` in `ai-engine/`).
  - **Frontend production bundle compiles cleanly** (`tsc -b && vite build`) without TypeScript errors.
- **Architectural Integrity:** **PASS**. The core philosophy ("AI suggests, the user confirms", integer-paise calculations, strict segregation of third-party `not_mine` funds, exclusion of unreceived expected income) is rigorously implemented in pure TypeScript modules independent of network or UI dependencies.
- **Production Blockers:** **3 critical blockers (P0/P1)** must be resolved before public release:
  1. **P0: Missing `vercel.json` SPA Rewrite Configuration:** Direct navigation or browser reloads on non-root paths (`/app`, `/login`, `/activity`, etc.) will fail with HTTP 404 on Vercel.
  2. **P0: Unverified Remote Cloud State (Supabase):** While local migrations and tests pass, remote database migrations and Edge Function deployments on the live Supabase project (`msjzkylvafuwlkkujxpv`) require manual verification and synchronization.
  3. **P1: STT Service Architecture Split & Model Mocking:** The self-hosted Python IndicConformer service currently returns simulated text when local ONNX weights are not downloaded, while the Groq Whisper fallback in the Edge Function is fully operational. A definitive deployment architecture must be established.

---

## 2. Current Architecture

```
                                      +------------------------------------+
                                      |         User Mobile Client         |
                                      |  (Responsive Web PWA / Capacitor)  |
                                      +-----------------+------------------+
                                                        |
                                +-----------------------+-----------------------+
                                |                                               |
                     Direct Database Queries                           Voice Audio & Photos
                   (RLS Scoped with User JWT)                          (Bearer Token Auth)
                                |                                               |
                                v                                               v
              +---------------------------------+             +-----------------------------------+
              |      Supabase Cloud Backend     |             |      Supabase Edge Functions      |
              |   (msjzkylvafuwlkkujxpv.supabase)  |             |          (Deno Runtime)           |
              +---------------------------------+             +-----------------+-----------------+
              | PostgreSQL Database             |                               |
              | - RLS Policies on all 10 tables |              +----------------+----------------+
              | - PL/pgSQL Atomic Triggers      |              |                                 |
              |   * sync_payout_received()      |              v                                 v
              |   * check_daily_transaction_    |     [process-voice]                    [extract-receipt]
              |     limit() (₹10 Lakh lock)     |              |                                 |
              |   * sync_wish_contribution()    |      +-------+-------+                         |
              | - Supabase Auth (JWT & Session) |      |               |                         |
              +---------------------------------+      v               v                         v
                                                  (Optional)       Groq Whisper             Groq Vision
                                                IndicConformer    (whisper-large-          (Qwen 27B /
                                                FastAPI Service      v3-turbo)              Llama 3.2)
                                                (Port 8001)            |                         |
                                                                       v                         v
                                                                 Groq Llama 3.3            Structured
                                                              (Financial Extraction)        Receipt
                                                                       |                   Candidate
                                                                       v                         |
                                                              +--------+-------------------------+
                                                              |
                                                              v
                                              +-------------------------------+
                                              | Deterministic Financial Engine|
                                              | (Pure TypeScript in Client)   |
                                              | - Integer Paise               |
                                              | - Confirmed Balance           |
                                              | - Daily Runway Projection     |
                                              | - "User Confirms" Review Gate |
                                              +-------------------------------+
```

### Component Breakdown
1. **Frontend Client (`frontend/`):** Single-page application built with React 18, TypeScript, Tailwind CSS, and Vite. Designed as a mobile-first PWA constrained to a maximum width of 480px, with bottom navigation, tactile buttons, and safe-area insets.
2. **Deterministic Financial Engine (`frontend/src/engine/`):** Pure TypeScript modules (`balance.ts`, `runway.ts`, `validation.ts`, `adaptiveBuffer.ts`, `scenarioSimulator.ts`). Operates entirely in integer paise. Contains zero external dependencies, DOM calls, or LLM interactions.
3. **Database Layer (`backend/supabase/`):** 7 sequential SQL migrations defining tables (`profiles`, `balance_checkins`, `payouts`, `transactions`, `commitments`, `invoices`, `invoice_items`, `invoice_settlements`, `wish_goals`, `wish_contributions`). All tables have Row Level Security enabled.
4. **Serverless AI Gateways (`backend/supabase/functions/`):**
   - `process-voice`: Accepts base64 audio or text; invokes AI4Bharat IndicConformer or Groq Whisper, followed by Groq Llama 3.3 for structured JSON intent extraction.
   - `extract-receipt`: Accepts base64 receipt images or UPI screenshots; uses Groq vision models with arithmetic reconciliation to extract structured expense candidates.
5. **Speech-to-Text Microservice (`ai-engine/stt_service/`):** Python FastAPI service hosting AI4Bharat IndicConformer ONNX/PyTorch models on port 8001.

---

## 3. Repository and Dependency Health

| Metric / Check | Status | Evidence / File Reference | Findings & Risk Analysis | Recommended Action |
|---|---|---|---|---|
| Git Working Tree | **PASS** | `git status` on `main` | Clean working tree; 0 uncommitted changes; synchronized with `origin/main` (`b60b212`). | Maintain clean Git discipline before applying fixes. |
| Frontend Dependencies | **PASS** | [frontend/package.json](file:///home/syed-imadulla/Desktop/FLOVA/frontend/package.json) | Lean dependencies: `@supabase/supabase-js` (2.119.2), `react` (18.3.1), `react-router-dom` (6.30.6). Zero unapproved AI libraries. | Lock down versions in `package-lock.json`. |
| Backend Dependencies | **PASS** | [backend/package.json](file:///home/syed-imadulla/Desktop/FLOVA/backend/package.json) | Development dependencies only: `@electric-sql/pglite` (0.5.17) and `@supabase/supabase-js`. | No production runtime vulnerabilities. |
| Python Environment | **PASS** | [ai-engine/pyproject.toml](file:///home/syed-imadulla/Desktop/FLOVA/ai-engine/pyproject.toml) | Virtualenv configured at `ai-engine/.venv`. `pytest` runs 23 tests in 0.79s without errors. | Deprecation warning for `starlette.testclient` (`httpx2` suggestion) is non-blocking. |
| Production Build | **WARNING** | [frontend/vite.config.ts](file:///home/syed-imadulla/Desktop/FLOVA/frontend/vite.config.ts) | `npm run build` succeeds (`dist/index.html` 1.14 kB, `dist/assets/index-*.js` 655 kB, `dist/assets/index-*.css` 142 kB). Single bundle chunk exceeds Vite's 500 kB warning limit. | Implement dynamic code splitting (`React.lazy`) for screens to improve First Contentful Paint. |
| Build Caching Hygiene | **PASS** | [.gitignore](file:///home/syed-imadulla/Desktop/FLOVA/.gitignore) | `.env`, `.env.*`, `frontend/tsconfig.tsbuildinfo`, `dist/`, `node_modules/` are strictly ignored. | Verified no artifacts leaked into repository. |

---

## 4. Authentication and Security Findings

| Area | Status | Evidence / File Reference | Findings & Risk Analysis | Recommended Action |
|---|---|---|---|---|
| Row Level Security (RLS) Coverage | **PASS** | [backend/supabase/migrations/](file:///home/syed-imadulla/Desktop/FLOVA/backend/supabase/migrations) | All 10 application tables have `ENABLE ROW LEVEL SECURITY`. 54 automated tests confirm User A cannot read, update, or delete User B's records. | Verified by `npm run test:db`. |
| Anonymous Access Control | **WARNING** | [20261120000200_explicit_grants.sql](file:///home/syed-imadulla/Desktop/FLOVA/backend/supabase/migrations/20261120000200_explicit_grants.sql#L19-L26) & [20261121000400_invoices_and_wish.sql](file:///home/syed-imadulla/Desktop/FLOVA/backend/supabase/migrations/20261121000400_invoices_and_wish.sql#L290-L305) | Phase 1 explicitly revoked access from `anon` for initial tables. However, Phase 15 (`invoices_and_wish.sql`) enabled RLS and granted to `authenticated`, but omitted an explicit `REVOKE ALL ON ... FROM anon`. | Add explicit `REVOKE ALL ON public.invoices, public.invoice_items, public.invoice_settlements, public.wish_goals, public.wish_contributions FROM anon;` for defense-in-depth. |
| Client Secret Hygiene | **PASS** | [frontend/src/lib/supabase.ts](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/lib/supabase.ts#L6-L18) | Grep scan on `frontend/src` and `frontend/dist` confirmed **zero leaked secrets** (`gsk_`, `service_role`, `AIza`, `sk-`). Only the public anon key is embedded. | Maintain pre-commit bundle scanning. |
| Edge Function Authentication: `process-voice` | **PASS** | [backend/supabase/functions/process-voice/index.ts](file:///home/syed-imadulla/Desktop/FLOVA/backend/supabase/functions/process-voice/index.ts#L126-L149) | Strictly validates Bearer token via `supabase.auth.getUser(token)`. Rejects missing or invalid tokens with HTTP 401. | No anonymous abuse possible. |
| Edge Function Authentication: `extract-receipt` | **WARNING** | [backend/supabase/functions/extract-receipt/index.ts](file:///home/syed-imadulla/Desktop/FLOVA/backend/supabase/functions/extract-receipt/index.ts#L167-L177) | Lines 167-177 permit requests if token or header matches `supabaseAnonKey`. This allows unauthenticated receipt extraction, which could lead to Groq vision quota exhaustion. | Enforce mandatory authenticated user token (`authErr || !user` $\rightarrow$ 401), aligning with `process-voice`. |
| Session Refresh & Persistence | **PASS** | [frontend/src/lib/supabase.ts](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/lib/supabase.ts#L16-L18) & [frontend/src/auth/AuthProvider.tsx](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/auth/AuthProvider.tsx#L36-L47) | Supabase client sets `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`. `AuthProvider` subscribes to `onAuthStateChange`. | Session lifecycle is well handled. |
| Password Security | **PASS** | [frontend/src/services/auth.ts](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/services/auth.ts#L16-L20) | Client never stores or hashes passwords; authentication is delegated entirely to Supabase Auth. | Secure. |

---

## 5. Financial Engine Integrity

The deterministic financial engine is the authoritative core of FLOVA. All checks passed with zero discrepancies.

| Invariant / Check | Status | Evidence / File Reference | Verification Detail |
|---|---|---|---|
| **Integer-Paise Handling** | **PASS** | [frontend/src/lib/money.ts](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/lib/money.ts#L5-L15) | `toPaise()` uses regex extraction to parse rupees and cents into integer paise without floating-point multiplication (`Number(rupees) * 100 + Number(frac)`). Verified with edge cases in `parseRupees.test.ts`. |
| **Exclusion of Expected Income** | **PASS** | [frontend/src/engine/balance.ts](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/engine/balance.ts#L34-L36) & [frontend/src/engine/runway.ts](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/engine/runway.ts#L87) | Scheduled, estimated, unearned, or cancelled payouts are strictly excluded from confirmed spendable balance and runway cash flows. Verified by Ravi benchmark where Monday's ₹1,800 payout is excluded from Saturday's shortfall calculation. |
| **Third-Party (`not_mine`) Segregation** | **PASS** | [frontend/src/engine/balance.ts](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/engine/balance.ts#L89-L91) & [L123-L141](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/engine/balance.ts#L123-L141) | Starting personal balance subtracts `notMine` from `(cash + bank)`. COD collections increase custodial liability; COD remittances decrease custodial liability; custodial money never increases personal spendable balance. |
| **Deduplication of Payouts and Transactions** | **PASS** | [frontend/src/engine/balance.ts](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/engine/balance.ts#L46-L48) | Payout receipts are recorded as income transactions linked to a payout; `payouts.received_amount` is never re-added on top of transactions. |
| **Timestamp Gating on Transactions** | **PASS** | [frontend/src/engine/balance.ts](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/engine/balance.ts#L108-L111) | Only transactions created strictly after the baseline check-in timestamp (`tx.createdAt > checkedAt`) are applied, preventing double-counting against the check-in baseline. |
| **No Negative Clamping on Actual Balance** | **PASS** | [frontend/src/engine/runway.ts](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/engine/runway.ts#L90) | Deficits are truthfully preserved as negative numbers (e.g. −₹1,170), never masked as zero. Only spendable buffer deductions clamp at zero. |
| **Daily Transaction Safeguard Limit (₹10 Lakh)** | **PASS** | [20261121000300_enforce_daily_transaction_limit.sql](file:///home/syed-imadulla/Desktop/FLOVA/backend/supabase/migrations/20261121000300_enforce_daily_transaction_limit.sql#L1-L60) | Both individual limit (CHECK constraint) and daily aggregate limit per user per calendar day (trigger with profile row-level lock) enforce a ₹10,00,000 ceiling. Third-party funds (`not_mine`) are excluded from personal limits. |
| **AI Calculation Boundary** | **PASS** | [process-voice/index.ts](file:///home/syed-imadulla/Desktop/FLOVA/backend/supabase/functions/process-voice/index.ts#L311-L313) & [frontend/src/services/voice.ts](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/services/voice.ts#L230-L369) | AI is strictly prohibited from calculating balances or answering financial queries. AI classifies query intent (`financial_query`); authoritative figures are calculated in client TypeScript using `calculateConfirmedBalance` and `calculateDailyRunway`. |
| **User Confirmation Gate** | **PASS** | [VoiceScreen.tsx](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/screens/VoiceScreen.tsx#L180) & [CatchScreen.tsx](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/screens/CatchScreen.tsx#L177) | AI extracts candidates (`VoiceTransactionCandidate`, `ExtractedReceiptCandidate`). Candidates are never directly saved to the database. They route to `AddScreen.tsx` (Review State) where the user must review, select living vs work expense, and manually confirm. |

---

## 6. Voice and AI Infrastructure

| Subsystem | Verified Behavior | Failure Mode / Fallback | Production Readiness Status |
|---|---|---|---|
| **Speech-to-Text (Browser / Web Speech API)** | [useSpeechToText.ts](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/voice/useSpeechToText.ts): Uses `window.SpeechRecognition` / `webkitSpeechRecognition` supporting 10 Indian locales (`en-IN`, `hi-IN`, `kn-IN`, etc.). Real-time live transcript. | If Web Speech API is unavailable (Firefox, Safari on older iOS, or Android WebView), hook reports `supported: false`. | **PASS** for supported browsers. Automatic fallback to audio recorder on unsupported runtimes. |
| **Audio Recording (Microphone)** | [useAudioRecorder.ts](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/voice/useAudioRecorder.ts): Uses `navigator.mediaDevices.getUserMedia` + `MediaRecorder`. Detects supported MIME types (`audio/webm`, `mp4`, `ogg`, `wav`). Limits recording to 60s and 10MB. | Emits clear user errors if microphone permission is denied or audio hardware is busy. | **PASS**. Clean teardown of audio tracks on unmount. |
| **Cloud STT: Groq Whisper** | [process-voice/index.ts](file:///home/syed-imadulla/Desktop/FLOVA/backend/supabase/functions/process-voice/index.ts#L239-L274): Secondary fallback or standalone STT using `whisper-large-v3-turbo` with self-healing model fallback. | If Groq returns 429/500/model unavailable, tries fallback candidate models in `GROQ_PREFS.stt`. | **PASS**. Highly reliable cloud provider. |
| **Self-Hosted STT: IndicConformer (FastAPI)** | [ai-engine/stt_service/conformer_engine.py](file:///home/syed-imadulla/Desktop/FLOVA/ai-engine/stt_service/conformer_engine.py): AI4Bharat IndicConformer service on port 8001 with pre-shared bearer token. | **CRITICAL OBSERVATION:** If local ONNX model weights (`*_ctc_decoder.onnx`) are not downloaded to `~/.cache/flova_indicconformer/`, `_decode_indic_features()` returns static simulated sentences (e.g. `"ಇವತ್ತು ಪೆಟ್ರೋಲ್ಗೆ 300 ರೂಪಾಯಿ ಖರ್ಚು ಮಾಡಿದೆ"`). | **WARNING / ARCHITECTURAL BLOCKER.** In cloud production, unless a dedicated GPU/CPU instance with real ONNX weights is hosted, `INDICCONFORMER_URL` should be omitted so `process-voice` routes directly to Groq Whisper. |
| **Financial Intent Extraction (LLM)** | [process-voice/index.ts](file:///home/syed-imadulla/Desktop/FLOVA/backend/supabase/functions/process-voice/index.ts#L280-L385): Uses Groq Llama 3.3 (`llama-3.3-70b-versatile`). Self-healing model list with temperature 0.1, Indian date context, and strict JSON output schema. | Returns 502 with error details if all candidate models fail. | **PASS**. Server-side only; zero client API keys. |
| **Receipt / UPI Vision Extraction** | [extract-receipt/index.ts](file:///home/syed-imadulla/Desktop/FLOVA/backend/supabase/functions/extract-receipt/index.ts#L202-L283): Uses Groq vision models (`qwen/qwen3.8-27b`, `meta-llama/llama-3.2-11b-vision`). Includes arithmetic cross-checking (Subtotal + Tax − Discount == Total) and duplicate UPI UTR reference detection. | Falls back to offline regex/SMS parser in [receipt.ts](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/services/receipt.ts#L65-L160) if Edge Function is offline. | **PASS**. Robust multi-tier extraction. |
| **Offline / Network Outage Behavior** | [extractTransaction.ts](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/voice/extractTransaction.ts) & [receipt.ts](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/services/receipt.ts): When Edge Functions are unreachable, local pattern matching parses multilingual text across English, Hindi, Kannada, Tamil, Telugu, and Urdu without external requests. | Flags candidates with `needsReview: true` and informs user: "Understood with basic on-device matching. Please check each field." | **PASS**. Graceful degradation ensures app remains functional offline. |

---

## 7. Deployment Readiness

### A. Vercel Frontend Deployment
- **Status: FAIL (P0 BLOCKER)**
- **Root Cause:** A `vercel.json` file is missing from both the root and `frontend/` directories. In client-side routing applications (using `BrowserRouter`), navigating directly to or refreshing deep URLs (`https://flova.app/app`, `/login`, `/activity`) will result in an HTTP 404 from Vercel's edge routers.
- **Required Fix:** Create `frontend/vercel.json` with standard SPA rewrites:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
- **Vercel Build Configuration:**
  - Root directory: `frontend`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Install command: `npm install`

### B. Supabase Cloud Configuration
- **Status: NOT VERIFIED (P0 BLOCKER)**
- **Context:** The code points to production Supabase project `msjzkylvafuwlkkujxpv.supabase.co`.
- **Items Requiring Verification & Credentials:**
  1. Have all 7 migrations been applied to the live database? (Can be verified via `npx supabase db push --project-ref msjzkylvafuwlkkujxpv`).
  2. Are Edge Functions `process-voice` and `extract-receipt` deployed and updated on the project?
  3. Are the required secrets configured on the project:
     - `GROQ_API_KEY`: Mandatory for voice and vision processing.
     - `GROQ_CHAT_MODEL`, `GROQ_VISION_MODEL`, `GROQ_STT_MODEL`: Optional overrides.
     - `INDICCONFORMER_URL`: Optional (omit if using cloud Whisper).
  4. Is email confirmation configured as desired in Supabase Auth (disabled for instant onboarding, or enabled with custom email templates)?
  5. Are database daily backups and point-in-time recovery (PITR) enabled in the Supabase project settings?

### C. Environment Variables
- **Frontend Vercel Environment Variables:**
  - `VITE_SUPABASE_URL`: `https://msjzkylvafuwlkkujxpv.supabase.co`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`: Publishable anon key (safe in client bundle).
- **Backend / Edge Function Secrets:**
  - `GROQ_API_KEY`: Secret API key from console.groq.com.
  - `SUPABASE_URL` and `SUPABASE_ANON_KEY`: Injected automatically by Supabase runtime.

### D. CORS and Networking
- **Status: PASS with WARNING**
- `process-voice` and `extract-receipt` specify `Access-Control-Allow-Origin: *`.
- While convenient for mobile testing and local development, in production this should ideally be locked down to `https://*.vercel.app`, the custom domain `https://flova.in` (or `https://app.flova.in`), and mobile WebView origins (`capacitor://localhost`, `http://localhost`).

### E. Observability, Logging, and Error Reporting
- **Status: WARNING**
- Currently, client-side errors rely on `console.error` and localized error alert banners.
- There is no error aggregation service (e.g. Sentry, LogRocket) configured in the frontend.
- Supabase Edge Functions emit logs to Supabase Dashboard Log Drain.
- **Recommendation:** Integrate `@sentry/react` in `frontend/src/main.tsx` prior to public scale to capture uncaught exceptions and broken device states.

---

## 8. Android and Play Store Readiness

*Note: Per strict instructions, no Android integration has been implemented yet. This section outlines readiness and prerequisites for Phase 2.*

| Aspect | Current Status | Analysis & Requirements for Android / Capacitor |
|---|---|---|
| **Frontend Suitability for Capacitor** | **PASS** | The UI is already built mobile-first with a fixed maximum container width (`max-w-[480px]`), touch targets $\ge 44\text{px}$, bottom tab navigation (`AppLayout.tsx`), and responsive layout cards. |
| **Viewport & Safe-Area Configuration** | **WARNING** | [frontend/index.html](file:///home/syed-imadulla/Desktop/FLOVA/frontend/index.html#L5) currently specifies: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />`. It is missing `viewport-fit=cover`. Without `viewport-fit=cover`, CSS `env(safe-area-inset-*)` evaluates to `0px` inside Android WebViews and iOS WebViews, potentially resulting in navigation overlap on notched devices. |
| **Microphone & Speech Recognition** | **WARNING** | Standard Android WebView does **not** support `window.SpeechRecognition` (Web Speech API). In `VoiceScreen.tsx`, the app will automatically fall back to `useAudioRecorder()` (MediaRecorder $\rightarrow$ Groq Whisper). This works cleanly, but `AndroidManifest.xml` must include `<uses-permission android:name="android.permission.RECORD_AUDIO" />`, and runtime permissions must be requested via `@capacitor/voice-recorder` or WebChromeClient. |
| **Camera & Receipt Upload** | **PASS** | [CatchScreen.tsx](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/screens/CatchScreen.tsx#L230-L244) uses `<input type="file" accept="image/*" capture="environment" />`. Capacitor WebView supports standard HTML5 file choosers out of the box when `CAMERA` and `READ_MEDIA_IMAGES` permissions are present in `AndroidManifest.xml`. Upgrading to `@capacitor/camera` in Phase 2 will provide a native sheet experience. |
| **Routing Inside WebView** | **WARNING** | `App.tsx` uses `BrowserRouter`. In Capacitor apps served from local assets (`http://localhost` or `capacitor://localhost`), client-side history navigation requires proper server configuration (`androidScheme: 'https'` in `capacitor.config.ts`) or deep linking handlers to avoid routing mismatches on app resume. |
| **Deep-Linking & Auth Redirects** | **WARNING** | If email confirmation or magic links are used in Supabase Auth, clicking an email link on a phone must open the app via an Android App Link (`https://app.flova.in/...` backed by `/.well-known/assetlinks.json`) or a custom intent scheme (`flova://auth/callback`). Supabase Auth settings must have this URL in "Redirect URLs". |
| **Network Resilience** | **PASS** | The Service Worker in `frontend/public/sw.js` caches the application shell. When offline, navigation still loads, and `extractTransaction.ts` provides on-device regex parsing. Transactions can be drafted and reviewed offline, though submission requires network connectivity. |

---

## 9. Critical Issues (P0 / P1 / P2)

### Priority 0 (P0) — Immediate Launch Blockers
1. **Missing `vercel.json` SPA Rewrite Configuration:**
   - **Impact:** Any user refreshing their browser on `/app`, `/login`, `/activity`, or entering a deep link will receive an HTTP 404 error on Vercel.
   - **Resolution:** Add `frontend/vercel.json` with rewrite rules.
2. **Unverified Remote Supabase Sync & Secrets:**
   - **Impact:** If remote migrations are missing or `GROQ_API_KEY` is not set in Supabase Edge Function secrets, voice processing and receipt scanning will immediately fail with HTTP 500/502.
   - **Resolution:** Run database migration check against `msjzkylvafuwlkkujxpv` and verify secrets via Supabase CLI.

### Priority 1 (P1) — High Priority Architecture & Security Refinements
1. **STT Architecture Decision & IndicConformer Decoupling:**
   - **Impact:** The Python IndicConformer service produces mock phrases if ONNX weights are not present. Setting `INDICCONFORMER_URL` to an unweighted local service degrades STT quality.
   - **Resolution:** For production deployment, rely on Groq Whisper (`whisper-large-v3-turbo`) as the primary cloud STT in `process-voice`, and treat self-hosted IndicConformer as an optional enterprise on-premise module.
2. **Edge Function `extract-receipt` Anonymous Auth Gap:**
   - **Impact:** [extract-receipt/index.ts](file:///home/syed-imadulla/Desktop/FLOVA/backend/supabase/functions/extract-receipt/index.ts#L167-L177) allows requests from anonymous callers using the publishable anon key, exposing Groq vision credits to abuse.
   - **Resolution:** Require valid user authentication (`authErr || !user` $\rightarrow$ 401), identical to `process-voice`.
3. **Explicit Database Grants for Invoices and Wish Tables:**
   - **Impact:** Migration `20261121000400_invoices_and_wish.sql` omits `REVOKE ALL ON ... FROM anon`.
   - **Resolution:** Add a small migration revoking all permissions on `invoices`, `invoice_items`, `invoice_settlements`, `wish_goals`, and `wish_contributions` from the `anon` role.

### Priority 2 (P2) — Performance, UX & Android Polish
1. **Vite Bundle Chunk Splitting:**
   - **Impact:** Monolithic bundle of 655 KB JS slows down initial load on Indian 3G/4G networks.
   - **Resolution:** Implement `React.lazy()` for secondary screens (`InvoicesScreen`, `WishScreen`, `CommitmentsScreen`, `PayoutsScreen`).
2. **Viewport `viewport-fit=cover` in HTML:**
   - **Impact:** In Android WebViews and iOS Safari, safe area insets evaluate to 0px, causing the bottom navigation bar to collide with system home indicators.
   - **Resolution:** Update `frontend/index.html` meta tag to include `viewport-fit=cover`.
3. **Frontend Production Error Monitoring:**
   - **Impact:** Silent client-side failures cannot be diagnosed once distributed.
   - **Resolution:** Install and configure Sentry error tracking.

---

## 10. Recommended Fixes

### Fix 1: Add `frontend/vercel.json`
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Fix 2: Harmonize Authentication in `extract-receipt`
In `backend/supabase/functions/extract-receipt/index.ts`:
```typescript
// Replace lines 164-178 with:
if (authErr || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized. Invalid user token." }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

### Fix 3: Add Explicit Anon Revocation Migration
Create `backend/supabase/migrations/20261123000100_revoke_anon_invoices_wish.sql`:
```sql
-- Explicitly revoke anonymous access on invoices and wish tables
REVOKE ALL ON
  public.invoices,
  public.invoice_items,
  public.invoice_settlements,
  public.wish_goals,
  public.wish_contributions
FROM anon;
```

### Fix 4: Add `viewport-fit=cover` to `frontend/index.html`
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

### Fix 5: Optimize Vite Code Splitting in `frontend/vite.config.ts`
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
});
```

---

## 11. Proposed Deployment Architecture

```
+-------------------------------------------------------------------------------+
|                                VERCEL EDGE CDN                                |
|  - Custom Domain: https://app.flova.in                                         |
|  - SSL: Automatic Let's Encrypt Wildcard                                      |
|  - SPA Rewrites via vercel.json                                               |
|  - Static Assets: dist/ (Vite + React 18 + Tailwind)                          |
+-------------------------------------------------------------------------------+
                                        |
                   +--------------------+--------------------+
                   |                                         |
                   v                                         v
+---------------------------------------+ +-------------------------------------+
|        SUPABASE MANAGED CLOUD         | |       SUPABASE EDGE FUNCTIONS       |
|   (msjzkylvafuwlkkujxpv.supabase.co)  | |            (Deno Deploy)            |
+---------------------------------------+ +-------------------------------------+
| - PostgreSQL 15 Database              | | 1. process-voice                    |
| - Row Level Security on all tables    | |    - Groq Whisper transcription     |
| - PL/pgSQL Atomic Triggers            | |    - Groq Llama 3.3 extraction      |
| - GoTrue Authentication               | | 2. extract-receipt                  |
| - Daily Automated Cloud Backups       | |    - Groq Qwen/Llama vision         |
| - Point-in-time Recovery (PITR)       | |    - Arithmetic reconciliation      |
+---------------------------------------+ +-------------------------------------+
                                                             |
                                                             v
                                          +-------------------------------------+
                                          |            GROQ CLOUD API           |
                                          | - whisper-large-v3-turbo (STT)      |
                                          | - llama-3.3-70b-versatile (NLP)     |
                                          | - qwen/qwen3.8-27b / vision models  |
                                          +-------------------------------------+
```

*Note on Python Service:* For the public Vercel release, routing speech recognition through Groq Whisper eliminates the need to maintain, monitor, and scale a separate Python VM/container cluster, while providing sub-second transcription across all major Indian languages.

---

## 12. Phase 1 Implementation Plan

```mermaid
flowchart TD
    subgraph Step 1 [Step 1: Configuration & Security Hardening]
        A1[Add frontend/vercel.json] --> A2[Harden extract-receipt Auth]
        A2 --> A3[Add anon revocation migration]
        A3 --> A4[Add viewport-fit=cover]
    end

    subgraph Step 2 [Step 2: Verification & Test Suite Gate]
        B1[Run npm run test:db] --> B2[Run npm run test:seed]
        B2 --> B3[Run make test-frontend]
        B3 --> B4[Verify tsc -b and vite build]
    end

    subgraph Step 3 [Step 3: Remote Supabase Synchronization]
        C1[Apply migrations to remote Supabase] --> C2[Verify Edge Function secrets: GROQ_API_KEY]
        C2 --> C3[Deploy Edge Functions: process-voice and extract-receipt]
        C3 --> C4[Run backend live RLS verification]
    end

    subgraph Step 4 [Step 4: Vercel Frontend Deployment]
        D1[Connect GitHub main branch to Vercel] --> D2[Configure VITE_SUPABASE_URL and ANON_KEY]
        D2 --> D3[Trigger Production Build]
        D3 --> D4[Verify Deep Links and SPA routing on live URL]
    end

    subgraph Step 5 [Step 5: Android Preparation Gate]
        E1[Install @capacitor/core and @capacitor/cli] --> E2[Initialize Capacitor with app ID and name]
        E2 --> E3[Configure Android permissions and deep links]
    end

    Step 1 --> Step 2
    Step 2 --> Step 3
    Step 3 --> Step 4
    Step 4 --> Step 5
```

---

## 13. Audit Sign-off Checklist

- [x] Working tree clean on `main` branch.
- [x] All automated backend, frontend, and AI tests passing.
- [x] Integer-paise financial calculations verified with zero floating-point risks.
- [x] Expected income excluded from confirmed balances.
- [x] Third-party funds (`not_mine`) segregated from spendable personal runway.
- [x] RLS verified across all 10 tables.
- [x] Zero API keys or secrets exposed in frontend code or bundles.
- [x] AI calculations confined strictly to advisory suggestions with mandatory user confirmation.
- [ ] Vercel SPA rewrite configuration added.
- [ ] Remote Supabase migrations and Edge Functions verified with production credentials.
