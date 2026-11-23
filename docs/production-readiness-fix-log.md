# FLOVA Production Readiness Fix Log
**Phase 1.2A: Local Implementation & Security Hardening**

**Execution Date:** November 23, 2026  
**Git Branch:** `main`  
**Baseline Commit:** `b60b212449356ae21f54db3d4f795ae490a40747`  
**Execution Environment:** Node.js v24+, Python 3.14+, PostgreSQL 15+ (PGlite)  

---

## 1. Summary of Changes Implemented

| Task | Category | Files Affected | Status | Description |
|---|---|---|---|---|
| **Task A** | Deployment / Routing | `frontend/vercel.json` | **COMPLETE** | Created SPA fallback rewrite configuration to route all non-file requests to `/index.html`, eliminating 404s on direct navigation or refresh. |
| **Task B** | Security / Edge Functions | `backend/supabase/functions/extract-receipt/index.ts`<br>`frontend/src/services/__tests__/receiptExtraction.test.ts` | **COMPLETE** | Enforced mandatory authenticated user JWT validation (`authErr \|\| !user` $\rightarrow$ 401). Removed publishable/anon key bypass to prevent unauthorized Groq quota consumption. Added test coverage for unauthenticated rejection (401) and authenticated extraction. |
| **Task C** | Database Permissions Review | *Analysis documented* | **COMPLETE** | Inspected grants and RLS on `invoices`, `invoice_items`, `invoice_settlements`, `wish_goals`, `wish_contributions`. Determined that `anon` currently has zero table privileges (Postgres returns `permission denied for table invoices`), RLS is enabled, and zero unauthenticated flows depend on these tables. Prepared optional explicit migration for approval without modifying database. |
| **Task D** | Mobile / Safe Area | `frontend/index.html` | **COMPLETE** | Added `viewport-fit=cover` to `<meta name="viewport" ...>` to enable accurate CSS `env(safe-area-inset-*)` calculation in Android WebViews and notched mobile devices. |
| **Task E** | Frontend Bundle Optimization | `frontend/vite.config.ts` | **COMPLETE** | Implemented `manualChunks` in `rollupOptions` for `vendor` (`react`, `react-dom`, `react-router-dom`) and `supabase` (`@supabase/supabase-js`), reducing bundle chunks below 300 kB and eliminating the Vite 500 kB minification warning. |
| **Voice / STT** | AI / Truthful Uncertainty | `ai-engine/stt_service/config.py`<br>`ai-engine/stt_service/conformer_engine.py`<br>`ai-engine/stt_service/main.py`<br>`ai-engine/tests/test_stt_service.py` | **COMPLETE** | Fixed missing IndicConformer model behavior: missing local ONNX weights now return HTTP 503 (`Service Unavailable`), ensuring missing weights cleanly trigger Edge Function fallback to Groq Whisper rather than returning fabricated/simulated speech. Added regression test. |

---

## 2. Detailed Breakdown of Changes

### Task A: Vercel SPA Routing Configuration
- **File Created:** `frontend/vercel.json`
- **Configuration:**
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
- **Rationale:** React Router DOM uses HTML5 History API (`BrowserRouter`). Without rewrite rules on Vercel Edge CDN, navigating directly to `/app`, `/login`, `/activity`, or deep links causes Vercel to look for static files at those paths and return HTTP 404. This configuration rewrites client-side routes to `/index.html` while preserving direct access to static assets (`/assets/*`, `/favicon.svg`, `/sw.js`, `/manifest.webmanifest`).

### Task B: Secure Receipt Extraction Authentication
- **File Modified:** `backend/supabase/functions/extract-receipt/index.ts`
- **Changes:**
  - Removed lines 166–177 which previously treated `token === supabaseAnonKey`, `apikey === supabaseAnonKey`, or `token.startsWith("sb_publishable_")` as sufficient authorization.
  - Aligned authentication logic with `process-voice`:
    ```typescript
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser(token);

      if (authErr || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized. Invalid user token." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    ```
- **Tests Added:** `frontend/src/services/__tests__/receiptExtraction.test.ts`
  - Scenario 9: Unauthenticated call (HTTP 401) is rejected and surfaced truthfully without uncaught errors.
  - Scenario 10: Authenticated user session successfully extracts receipt candidates.

### Task C: Database Permission Review Findings
- **Inspected Tables:** `invoices`, `invoice_items`, `invoice_settlements`, `wish_goals`, `wish_contributions`.
- **Findings:**
  1. **Table Privileges:** In PostgreSQL, tables created in migration `20261121000400_invoices_and_wish.sql` were granted only to `authenticated` and `service_role`. The `anon` role was never granted permissions.
  2. **Empirical Verification:** Executing `SELECT * FROM public.invoices` as role `anon` in Postgres immediately raises `permission denied for table invoices`.
  3. **Row Level Security:** RLS is active on all 5 tables (`ENABLE ROW LEVEL SECURITY`). Every policy enforces `auth.uid() = user_id`. For unauthenticated callers, `auth.uid()` evaluates to `NULL`, which evaluates to `NULL` (falsy) under SQL boolean evaluation.
  4. **Application Dependencies:** Zero unauthenticated flows or landing page components query these tables. All associated routes are protected by `<RequireAuth>`.
- **Conclusion:** No remote database modification is required. For strict defense-in-depth parity with `20261120000200_explicit_grants.sql`, a migration has been formulated and documented in Section 4 below, pending user review.

### Task D: Mobile Safe-Area Support
- **File Modified:** `frontend/index.html`
- **Change:**
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  ```
- **Rationale:** The application CSS (`frontend/src/app/AppLayout.tsx` and `frontend/src/ui/kit.tsx`) uses `env(safe-area-inset-bottom)` to offset fixed navigation bars on notched mobile devices. Without `viewport-fit=cover`, browser engines and WebViews default to `safe-area-inset-* = 0px`, causing navigation buttons to collide with the home indicator bar.

### Task E: Frontend Bundle Optimization
- **File Modified:** `frontend/vite.config.ts`
- **Change:**
  ```typescript
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
  ```
- **Comparison of Build Outputs:**
  - **Before:**
    - Single monolithic JS chunk: `dist/assets/index-*.js` — **655.80 kB** (gzip: 189.06 kB)
    - Warning: `(!) Some chunks are larger than 500 kB after minification.`
  - **After:**
    - `dist/assets/vendor-*.js`: **164.36 kB** (gzip: 53.62 kB) — React, ReactDOM, React Router
    - `dist/assets/supabase-*.js`: **230.48 kB** (gzip: 60.05 kB) — Supabase Client SDK
    - `dist/assets/index-*.js`: **260.34 kB** (gzip: 76.32 kB) — FLOVA Application & Financial Engine
    - `dist/assets/index-*.css`: **142.69 kB** (gzip: 25.28 kB)
    - Warning: **None. Zero chunks exceed 500 kB.**

### Speech Recognition: Truthful Uncertainty & Missing Model Handling
- **Files Modified:**
  - `ai-engine/stt_service/config.py`: Added `ALLOW_MOCK_FALLBACK: bool = os.getenv("FLOVA_STT_ALLOW_MOCK", "false").lower() == "true"`.
  - `ai-engine/stt_service/conformer_engine.py`: If local ONNX weights are not cached on disk and `ALLOW_MOCK_FALLBACK` is false, raises `RuntimeError("IndicConformer model weights ... are not installed")`.
  - `ai-engine/stt_service/main.py`: Catches missing model `RuntimeError` and returns `HTTP 503 Service Unavailable`.
  - `ai-engine/tests/test_stt_service.py`: Added regression test `test_transcribe_missing_model_returns_503` to verify that unweighted instances return 503 instead of simulated speech.
- **Architectural Impact:**
  - In cloud deployment, if `INDICCONFORMER_URL` points to an unweighted service, `process-voice` receives HTTP 503 and immediately falls back to Groq Whisper.
  - The application will **never** return fabricated or simulated phrases (e.g., "ಇವತ್ತು ಪೆಟ್ರೋಲ್ಗೆ 300 ರೂಪಾಯಿ ಖರ್ಚು ಮಾಡಿದೆ") as genuine recognized speech.

---

## 3. Automated Test Results

| Test Suite | Tests Run | Passed | Failed | Status |
|---|---|---|---|---|
| Backend Database Schema & RLS (`npm run test:db`) | 54 | 54 | 0 | **PASS** |
| Backend Demo Seeding & Isolation (`npm run test:seed`) | 17 | 17 | 0 | **PASS** |
| Frontend Services & Contracts (`make test-frontend`) | 13 suites | 13 | 0 | **PASS** |
| Receipt Extraction Scenarios (`receiptExtraction.test.ts`) | 10 | 10 | 0 | **PASS** |
| Python STT Service & Udaan Engine (`make test-stt`) | 24 | 24 | 0 | **PASS** |
| Frontend TypeScript Verification (`npx tsc -b`) | Whole codebase | Clean | 0 | **PASS** |
| Production Frontend Bundle (`vite build`) | 158 modules | 3 chunks | 0 warnings | **PASS** |

---

## 4. Proposed Database Migration (Pending User Approval)

If explicit revocation parity with `20261120000200_explicit_grants.sql` is desired for defense-in-depth, the following migration can be applied in Phase 1.2B:

**File:** `backend/supabase/migrations/20261123000100_revoke_anon_invoices_wish.sql`
```sql
-- Explicitly revoke anonymous access on invoices and wish tables (Defense-in-Depth)
REVOKE ALL ON
  public.invoices,
  public.invoice_items,
  public.invoice_settlements,
  public.wish_goals,
  public.wish_contributions
FROM anon;
```
*Note: As verified in Task C, anonymous access is already denied by Postgres default table privileges and RLS. Applying this migration is safe and will have zero impact on authenticated users.*

---

## 5. Phase 1.2A.1: Security & Integration Verification Findings

### 5.1 Receipt & Voice Authentication: Fail-Closed Verification
- **Inspected Files:**
  - `backend/supabase/functions/extract-receipt/index.ts`
  - `backend/supabase/functions/process-voice/index.ts`
- **Initial Flaw Identified:**
  Previously, both Edge Functions inspected server environment variables using an optional condition: `if (supabaseUrl && supabaseAnonKey) { ... }`. If either variable was missing from the server environment, user authentication was silently skipped, allowing unauthenticated requests to fall through to the Groq extraction / transcription logic and consume AI quota.
- **Fail-Closed Remediation:**
  Both functions now strictly enforce fail-closed behavior before any downstream processing:
  1. **Missing Server Configuration (`SUPABASE_URL` or `SUPABASE_ANON_KEY`):** Immediately logs a server error and aborts with `HTTP 500 Server configuration error.`.
  2. **Missing `Authorization` Header:** Immediately aborts with `HTTP 401 Unauthorized. Missing Authorization header.`.
  3. **Malformed or Empty Bearer Token:** Immediately aborts with `HTTP 401 Unauthorized. Invalid authorization format.`.
  4. **Invalid, Expired, or Revoked User JWT (`authErr || !user`):** Immediately aborts with `HTTP 401 Unauthorized. Invalid user token.`.
- **Test Coverage Added:**
  `frontend/src/services/__tests__/receiptExtraction.test.ts` was expanded to 12 comprehensive scenarios:
  - Scenario 9: Unauthenticated request (HTTP 401) is caught and surfaced truthfully to the caller.
  - Scenario 10: Valid authenticated user JWT extracts receipt candidate.
  - Scenario 11: Missing server configuration (`SUPABASE_URL` / `SUPABASE_ANON_KEY`) returns HTTP 500, failing closed and preventing fall-through to Groq.
  - Scenario 12: Expired or revoked user JWT returns HTTP 401.

### 5.2 Speech-to-Text Fallback & Mock Transcription Guard
- **Inspected Files:**
  - `backend/supabase/functions/process-voice/index.ts`
  - `ai-engine/stt_service/main.py`
  - `ai-engine/stt_service/conformer_engine.py`
  - `ai-engine/stt_service/config.py`
- **Verification Details:**
  1. **HTTP 503 Handling:** In `process-voice`, calls to `INDICCONFORMER_URL` are wrapped in error inspection. When IndicConformer returns HTTP 503 (e.g. weights missing or server starting), `process-voice` logs `IndicConformer returned status 503 - falling back to Groq Whisper` and seamlessly proceeds to Groq Whisper (`whisper-large-v3-turbo`).
  2. **Network Errors and Timeouts:** `fetchWithTimeout` applies a 20,000 ms timeout to the IndicConformer call. In the event of network disconnection, DNS failure, or connection timeout, the exception is caught, logged, and execution safely transitions to the secondary Groq Whisper fallback.
  3. **Empty or Invalid Transcription Guard:** If IndicConformer returns an empty string or whitespace (`!conformerData?.text?.trim()`), it is rejected as a valid transcription and falls through to Groq Whisper fallback.
  4. **Groq Fallback Failure Surfacing:** If both IndicConformer and Groq Whisper fail, the function returns a clean `HTTP 502/500` error response with actionable error messaging rather than failing silently or returning synthetic text.
  5. **Truthful Uncertainty (No Fabricated Speech):** `ALLOW_MOCK_FALLBACK` is strictly `false` by default (`FLOVA_STT_ALLOW_MOCK` must be explicitly `"true"`). In production, an unweighted IndicConformer instance raises a `RuntimeError` and returns HTTP 503. Fabricated or hardcoded dummy sentences will never reach the user.
  6. **STT Unit Tests:** All 24 test cases in `ai-engine/tests/` passed, including `test_transcribe_missing_model_returns_503`.

### 5.3 Database Permission Claims (Local vs Remote Distinction)
- **Local Verification (PGlite):**
  - Schema migrations up to `20261121000400_invoices_and_wish.sql` were verified locally via `@electric-sql/pglite` (`npm run test:db`).
  - All 54 tests passed. Local verification confirmed that tables `invoices`, `invoice_items`, `invoice_settlements`, `wish_goals`, and `wish_contributions` are only granted to `authenticated` and `service_role`. The `anon` role receives `permission denied for table invoices`.
  - Row Level Security (RLS) is enabled on all tables with `auth.uid() = user_id`.
- **Remote Supabase Verification Status:**
  - **IMPORTANT:** In strict compliance with task restrictions, the remote Supabase project (`msjzkylvafuwlkkujxpv`) was **not contacted, connected to, or modified** during Phase 1.2A or Phase 1.2A.1.
  - Remote database permissions and RLS policies remain to be verified against the live project during a dedicated cloud verification step.

### 5.4 Review of Existing Phase 1.2A Changes
1. **Vercel SPA Rewrite (`frontend/vercel.json`):**
   - Verified that the rewrite `{"source": "/(.*)", "destination": "/index.html"}` correctly handles client-side routes (`/app`, `/login`, `/activity`, `/catch`) without disrupting Vite static asset requests (`/assets/*`).
2. **Mobile Viewport Metadata (`frontend/index.html`):**
   - Verified that `viewport-fit=cover` properly activates `env(safe-area-inset-*)` CSS variables without altering layout margins, desktop viewport dimensions, or introducing horizontal scrolling.
3. **Vite Manual Chunk Splitting (`frontend/vite.config.ts`):**
   - Verified that splitting dependencies into `vendor` (React, ReactDOM, React Router) and `supabase` (@supabase/supabase-js) produces deterministic chunks (`vendor`: 164 kB, `supabase`: 230 kB, `app`: 260 kB).
   - Zero chunks exceed the 500 kB bundle size threshold, resolving Vite build warnings with zero runtime regressions.

### 5.5 Comprehensive Verification Test Matrix
| Test Suite | Target | Result | Status |
|---|---|---|---|
| Frontend Unit & Integration Tests | `npm run test` (13 suites, 12 receipt extraction scenarios) | 13/13 suites passed | **PASS** |
| Backend Schema & RLS Tests | `npm run test:db` (PGlite local test runner) | 54/54 tests passed | **PASS** |
| Demo Seeding & Isolation Tests | `npm run test:seed` (PGlite seed test runner) | 17/17 tests passed | **PASS** |
| Python STT Service & Udaan Tests | `pytest ai-engine/tests/` (24 tests) | 24/24 tests passed | **PASS** |
| TypeScript Project Compilation | `npx tsc -b` | 0 errors | **PASS** |
| Production Bundle Build | `npm run build` (`vite build`) | 3 clean chunks (< 300 kB) | **PASS** |

---

## 6. Edge Function Audit & Hardening (`extract-receipt` & `process-voice`)

### 6.1 Audit Findings & Classification

| # | Finding | Severity | Classification | Status | Rationale |
|---|---|---|---|---|---|
| **F-01** | `atob()` in `process-voice` throws `DOMException` on MIME parameters/codecs | **High** | auto-fixable | **FIXED** | Data URLs with `;codecs=...` failed regex, passing un-stripped strings to `atob()`. Replaced with delimiter-safe split. |
| **F-02** | Markdown code fences (` ```json `) cause `JSON.parse` syntax crashes | **High** | auto-fixable | **FIXED** | Added fence-stripping normalization and 502 `PARSE_ERROR` handling in both Edge Functions. |
| **F-03** | `INDICCONFORMER_URL` path omission caused 404/405 | **Medium** | auto-fixable | **FIXED** | Normalized endpoint URL to ensure `/transcribe` path is appended if omitted by environment config. |
| **F-04** | Timezone mismatch in voice candidates (UTC vs IST) | **Medium** | auto-fixable | **FIXED** | Replaced UTC `toISOString().slice(0, 10)` with `todayIndiaISO()` (`Asia/Kolkata`) to prevent off-by-one day errors. |
| **F-05** | Indian receipt date formats (`DD/MM/YYYY`, `DD-MM-YYYY`) discarded | **Medium** | auto-fixable | **FIXED** | Added pattern matchers to parse and normalize Indian date conventions to `YYYY-MM-DD`. |
| **F-06** | `missingFields` naming inconsistency & invalid `expense_type` | **Medium** | auto-fixable | **FIXED** | Mapped `"expense_type"` to `"expenseType"` and verified `validatedExpenseType` gating. |
| **F-07** | Unhandled request JSON parsing returned 500 instead of 400 | **Low** | auto-fixable | **FIXED** | Wrapped `req.json()` in try/catch to return HTTP 400 Bad Request on malformed JSON bodies. |
| **F-08** | Groq API errors leaked raw provider error text to clients | **Low** | auto-fixable | **FIXED** | Logged raw provider errors server-side via `console.error`; returned sanitized user-friendly errors. |
| **F-09** | Missing TypeScript config for Edge Functions in Supabase directory | **Low** | auto-fixable | **FIXED** | Added `backend/supabase/functions/tsconfig.json` with ambient Deno type resolution. |

### 6.2 Test & Typecheck Verification
- `npx tsc -p backend/supabase/functions/tsconfig.json`: **0 errors** (Clean).
- `make test`: All 13 frontend test suites, 54 backend schema tests, 17 seed tests, and 24 Python STT tests passed.
- `make lint` & `make build`: Clean, 0 warnings.


