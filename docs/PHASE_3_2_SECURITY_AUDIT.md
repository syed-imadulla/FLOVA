# FLOVA Phase 3.2: Comprehensive Security & Data Protection Audit Report

**Date:** 2026-11-23  
**Application:** FLOVA (`in.flova.app`)  
**Repository:** https://github.com/syed-imadulla/FLOVA  
**Web Production:** https://myflova.vercel.app  
**Supabase Project ID:** `msjzkylvafuwlkkujxpv`  
**Auditor Roles:** Principal Application Security Engineer, Cloud Infrastructure Architect, PostgreSQL Security Specialist, Mobile Security Auditor  
**Mode:** AUDIT ONLY (Defensive assessment; no code or production configurations modified)  

---

## 1. Executive Summary

A comprehensive, defense-in-depth security and data protection audit of the entire FLOVA ecosystem was conducted in preparation for Google Play Store publication and general public availability. The audit inspected all layers of the stack: React frontend, Capacitor Android native wrapper, Supabase PostgreSQL schema and Row Level Security (RLS) policies, Supabase Edge Functions (Deno/TypeScript), Python FastAPI STT microservice (`ai-engine`), Vercel edge deployment, build pipelines, and complete Git commit history.

### Overall Security Posture & Score
**FLOVA Security Index:** **84 / 100** (Grade: **B+** — Strong Foundation with Actionable Remediation Gates)

#### Scoring Methodology
The security index is evaluated across five weighted security pillars (0–100 scale):
1. **Secrets & Credential Hygiene (Weight: 20%):** Score **95/100** — Excellent isolation; no server keys in frontend/Android builds, clean Git history.
2. **Authentication & Authorization (Weight: 25%):** Score **85/100** — Strong Supabase Auth and native Google Sign-In with cryptographic replay protection, but lacks in-app password recovery.
3. **Database Security & User Isolation (Weight: 25%):** Score **72/100** — Comprehensive RLS on 10 personal data tables with `anon` revoked, but critical IDOR authorization bypass discovered on child tables (`wish_contributions` and `invoice_settlements`).
4. **API, Network & Platform Security (Weight: 15%):** Score **78/100** — HTTPS enforced, but missing HTTP security headers (CSP, frame restrictions) and Edge Function rate limiting.
5. **Mobile & Build Security (Weight: 15%):** Score **90/100** — Minimal permissions, `allowBackup=false`, orientation locked, but release build lacks R8 obfuscation/minification.

$$\text{Final Score} = (0.20 \times 95) + (0.25 \times 85) + (0.25 \times 72) + (0.15 \times 78) + (0.15 \times 90) = 19.0 + 21.25 + 18.0 + 11.7 + 13.5 = 83.45 \approx 84$$

---

## 2. Key Audit Findings Summary

| ID | Category | Severity | Title | Affected Component | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **SEC-01** | User Data Isolation | **CRITICAL** | IDOR / Missing Parent Ownership Check in `wish_contributions` and `invoice_settlements` RLS | `wish_contributions`, `invoice_settlements` | **FAIL** |
| **SEC-02** | Network Security | **HIGH** | Missing HTTP Security Headers (CSP, X-Frame-Options, MIME Sniffing, Referrer) on Vercel | `frontend/vercel.json` | **FAIL** |
| **SEC-03** | AI Cost Protection | **HIGH** | Absence of Server-Side Rate Limiting on Supabase Edge Functions (`process-voice`, `extract-receipt`) | `backend/supabase/functions/` | **FAIL** |
| **SEC-04** | Upload Security | **MEDIUM** | Missing Maximum Server-Side Request Payload Limit in `extract-receipt` Edge Function | `extract-receipt/index.ts` | **FAIL** |
| **SEC-05** | Network Security | **MEDIUM** | Insecure Wildcard Origin with Credentials Allowed in Python STT FastAPI Service | `ai-engine/stt_service/main.py` | **FAIL** |
| **SEC-06** | Database Security | **MEDIUM** | Unnecessary Direct `EXECUTE` Grants to `authenticated` on Trigger Helper Functions | Migration `20261121000100` | **FAIL** |
| **SEC-07** | Dependencies | **MEDIUM** | Vulnerabilities in `react-router-dom` (CVE-2025-68470) and `esbuild` (GHSA-67mh-4wv8-2f99) | `frontend/package.json` | **NEEDS WORK** |
| **SEC-08** | API Keys & Secrets | **LOW** | Hardcoded Publishable Anon Key Fallback in Frontend Client Source | `frontend/src/lib/supabase.ts` | **PASS / INFO** |
| **SEC-09** | Mobile Security | **LOW** | Code Shrinking & Obfuscation Disabled (`minifyEnabled false`) in Android Release Build | `frontend/android/app/build.gradle` | **FAIL** |
| **SEC-10** | Password & Auth | **LOW** | Missing Self-Service Password Reset Flow in Frontend UI | `frontend/src/pages/auth/LoginPage.tsx` | **FAIL** |
| **SEC-11** | Repository Security| **INFORMATIONAL** | Absence of Automated GitHub Actions Security & Secret Scanning Workflows | `.github/workflows/` | **FAIL** |

---

## 3. Comprehensive Domain-by-Domain Audit

### Domain 1: API Keys and Secrets
* **Status:** **PASS** (with 1 Informational note)
* **Scope Audited:** `.env`, `.env.local`, `.env.example`, `frontend/src/lib/supabase.ts`, `frontend/dist/`, `frontend/android/`, complete Git log history (`git log -p`).
* **Technical Reality:**
  - **Groq API Keys:** Exclusively stored and consumed server-side inside Supabase Edge Function secrets (`Deno.env.get("GROQ_API_KEY")`). Zero references exist in frontend code, Android manifests, or public bundles.
  - **Supabase Service-Role Key:** Present only in `backend/.env.local` (local developer testing) and backend infrastructure. The build pipeline never bundles the service-role key into web or Android distribution artifacts.
  - **Git History Scan:** Full repository commit history was scanned using regex patterns for Supabase service-role JWTs, Groq API keys (`gsk_*`), private keys, and passwords. **Zero historical credential leaks detected.**
  - **Source Maps & Build Output:** Production compilation (`npm run build`) was executed and verified. `vite.config.ts` has `sourcemap: false` by default; no `.map` files are generated or served in `frontend/dist`.
  - **Publishable Key Fallback:** `frontend/src/lib/supabase.ts` embeds a fallback JWT token. Decoding the JWT header and payload verifies:
    $$\text{Payload: } \{\text{"role": "anon"}, \text{"iss": "supabase"}, \text{"exp": 2110752839}\}$$
    This is Supabase's public anonymous key, designed for client distribution. However, best practice is to require injection from `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`.

### Domain 2: Authentication and Authorization
* **Status:** **PASS** (with 1 Low finding)
* **Scope Audited:** Supabase Auth configuration, `AuthProvider.tsx`, `useSession.ts`, `RequireAuth.tsx`, `RedirectIfAuthed.tsx`, `socialAuth.ts`, `LoginPage.tsx`, `SignupPage.tsx`.
* **Technical Reality:**
  - **Session Management:** Supabase Auth manages sessions with auto-refresh and secure local persistence (`persistSession: true`, `autoRefreshToken: true`).
  - **Android Session Isolation:** `AndroidManifest.xml` explicitly sets `android:allowBackup="false"` and `android:fullBackupContent="false"`, backed by `data_extraction_rules.xml`. Android Debug Bridge (ADB) backup extraction cannot dump session tokens.
  - **Route Protection:** All application screens (`/app`, `/activity`, `/voice`, `/insights`, `/catch`, `/invoices`, `/wish`, `/profile`) are strictly guarded by nested `<RequireAuth>` and `<RequireOnboarded>`. Direct navigation without a valid session redirects to `/login` with `from` history.
  - **Admin Routes:** **NOT APPLICABLE.** FLOVA has no admin portal, admin routes, or user role hierarchy. Every user is a peer tenant isolated by `auth.uid()`. Seeding scripts (`backend/scripts/seed-demo.mjs`) are CLI utilities executed locally by developers.
  - **Google OAuth / Native Credential Manager:** `signInWithGoogle` uses `@capgo/capacitor-social-login`. It generates a cryptographically random 32-byte raw nonce (`crypto.getRandomValues`), calculates its SHA-256 hash (`sha256Hex`), and passes the raw nonce with Google's ID token to `supabase.auth.signInWithIdToken()`. This provides robust cryptographic replay attack mitigation.
  - **Logout Invalidation:** `signOutAll()` logs out of native Google credentials via `SocialLogin.logout()` and terminates the Supabase session via `supabase.auth.signOut()`.

### Domain 3: User Data Isolation
* **Status:** **FAIL** (Critical Finding SEC-01)
* **Scope Audited:** PostgreSQL RLS policies across all 10 tables: `profiles`, `balance_checkins`, `payouts`, `transactions`, `commitments`, `invoices`, `invoice_items`, `invoice_settlements`, `wish_goals`, `wish_contributions`.
* **Technical Reality & Vulnerability Verification:**
  - Tables `profiles`, `balance_checkins`, `payouts`, `transactions`, `commitments`, `invoices`, and `wish_goals` enforce strict row-level isolation using `(select auth.uid()) = user_id` for SELECT, INSERT, UPDATE, and DELETE.
  - Table `invoice_items` correctly verifies parent ownership via subquery:
    ```sql
    EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
    ```
  - **The Vulnerability (SEC-01):** Tables `wish_contributions` and `invoice_settlements` have flawed RLS policies:
    ```sql
    CREATE POLICY "Users can manage own wish contributions"
      ON public.wish_contributions FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    ```
    The policy checks only that `auth.uid() = user_id`. It does **NOT** verify that the referenced `goal_id` belongs to `auth.uid()`.
  - **Impact & Reproduction:** Because trigger `sync_wish_contribution()` is marked `SECURITY DEFINER`, when User B inserts a contribution referencing User A's `goal_id`, the trigger runs with elevated database privileges, locks User A's `wish_goals` row, updates `saved_amount`, and marks User A's goal as `completed`.
  - The same flaw exists on `invoice_settlements`, allowing User B to insert a settlement against User A's `invoice_id` and alter User A's invoice payment status.
  - **Empirical Verification:** Reproduced in local PGlite PostgreSQL sandbox. User B successfully mutated User A's goal and invoice without error.

### Domain 4: Input Validation and Injection Protection
* **Status:** **PASS**
* **Scope Audited:** Frontend forms, state inputs, SQL migrations, PL/pgSQL triggers, Edge Function inputs.
* **Technical Reality:**
  - **SQL Injection:** **Zero SQLi vulnerabilities.** All database queries in the frontend use Supabase SDK parameterized builders. In PostgreSQL migrations, trigger functions use native PL/pgSQL variable assignment or parameterized queries. Dynamic SQL `EXECUTE format(...)` is used only during schema initialization for a hardcoded array of table names.
  - **Cross-Site Scripting (XSS):** React JSX automatically contextually escapes user strings. Codebase search confirmed zero occurrences of `dangerouslySetInnerHTML`. User-provided notes, titles, and amounts cannot execute arbitrary JavaScript.
  - **Financial Arithmetic Bounds:**
    - Individual transaction check constraint: `amount <= 1000000.00` (₹10 Lakh).
    - Daily aggregate check: Trigger `check_daily_transaction_limit()` enforces a cumulative daily cap of ₹10 Lakh per calendar day for `ownership = 'mine'`, serialized via row-level locks on `profiles` (`FOR NO KEY UPDATE`).
    - Database amounts use `numeric(12,2)`. Frontend converts all inputs to integer paise before arithmetic operations (`frontend/src/lib/money.ts`). Float math is strictly prohibited.

### Domain 5: API and Network Security
* **Status:** **FAIL** (Findings SEC-02, SEC-03, SEC-05)
* **Scope Audited:** Vercel deployment headers, CORS configurations, Edge Functions HTTP options, Python STT FastAPI CORS.
* **Technical Reality:**
  - **Transport Security:** Production domain `https://myflova.vercel.app` enforces TLS 1.3. HSTS is enabled by Vercel edge (`max-age=63072000; includeSubDomains; preload`).
  - **Missing Security Headers (SEC-02):** Live inspection of `https://myflova.vercel.app` revealed that standard HTTP security headers are completely absent from `frontend/vercel.json`:
    - No `Content-Security-Policy` (CSP)
    - No `X-Frame-Options` (vulnerable to UI clickjacking)
    - No `X-Content-Type-Options: nosniff` (vulnerable to MIME sniffing)
    - No `Referrer-Policy` (leaks URLs on outbound links)
    - Wildcard `Access-Control-Allow-Origin: *` is returned on HTML documents.
  - **Edge Function Rate Limiting (SEC-03):** Neither `process-voice` nor `extract-receipt` enforces rate limits. A compromised or malicious authenticated user account can flood the endpoints with requests, consuming Groq API quota.
  - **FastAPI CORS Misconfiguration (SEC-05):** In `ai-engine/stt_service/main.py`:
    ```python
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    ```
    Configuring `allow_origins=["*"]` with `allow_credentials=True` is an insecure and invalid CORS combination under W3C specifications.

### Domain 6: File Upload Security
* **Status:** **PASS** (with 1 Medium finding SEC-04)
* **Scope Audited:** Receipt and image capture flows, `imageOptimizer.ts`, `receipt.ts`, `extract-receipt/index.ts`.
* **Technical Reality:**
  - **No Persistent Cloud File Storage:** FLOVA does **not** store uploaded receipts or images in Supabase Storage. The storage bucket `receipts` is configured with `public=false` and has zero public storage policies.
  - **Client-Side Image Pipeline:**
    - Validates MIME types (`image/jpeg`, `image/png`, `image/webp`) and file extensions.
    - Limits incoming file size to 20 MB (`MAX_IMAGE_FILE_SIZE_BYTES = 20 * 1024 * 1024`).
    - Resizes high-resolution camera photos (e.g., 4000x3000) down to a maximum 1920px canvas.
    - Compresses images to 85% JPEG quality (~300–800 KB base64 string).
  - **Server-Side Payload Cap (SEC-04):** `process-voice` enforces a 10 MB base64 limit. However, `extract-receipt/index.ts` checks only `body.imageBase64.length > 50` without an upper bound. Direct API callers could transmit massive payloads causing memory pressure on Edge Function instances.

### Domain 7: Database Security
* **Status:** **PASS** (with 1 Medium finding SEC-06)
* **Scope Audited:** PostgreSQL roles, grants, triggers, search paths, and migrations.
* **Technical Reality:**
  - **Privilege Separation:** Anon role has `REVOKE ALL` across all tables. Migration `20261123150000_harden_anon_and_triggers.sql` revoked table grants and trigger function execution from `anon` and `PUBLIC`.
  - **Function Search Paths:** All `SECURITY DEFINER` functions explicitly set `SET search_path = public, pg_temp` or `SET search_path = ''`, preventing search_path hijacking attacks.
  - **Function Grants (SEC-06):** Helper functions `sync_payout_received(uuid)` and `transactions_sync_payout()` were granted `EXECUTE` to `authenticated` in migration `20261121000100`. Because PostgreSQL triggers do not require users to hold direct `EXECUTE` privileges on trigger procedures when fired during table writes, exposing these functions over PostgREST RPC (`/rpc/sync_payout_received`) creates unnecessary surface.

### Domain 8: Password and Authentication Security
* **Status:** **PASS** (with 1 Low finding SEC-10)
* **Scope Audited:** Auth services, password policies, token transmission.
* **Technical Reality:**
  - Password hashing is delegated entirely to Supabase Auth (bcrypt/Argon2). FLOVA maintains zero custom password tables or algorithms.
  - Credentials and access tokens are never logged in terminal output or frontend analytics.
  - **Missing Password Reset Flow (SEC-10):** `LoginPage.tsx` currently has no "Forgot Password?" flow or link. While Supabase Auth supports `resetPasswordForEmail`, the client UI does not expose it, leaving email/password users who forget their credentials unable to self-recover.

### Domain 9: Dependency Audit
* **Status:** **NEEDS WORK** (Finding SEC-07)
* **Scope Audited:** `frontend/package.json`, `backend/package.json`, `ai-engine/pyproject.toml`, `frontend/android/app/build.gradle`.
* **Technical Reality:**
  - **Backend & Root npm:** `found 0 vulnerabilities`.
  - **Frontend npm Audit:** Detected 4 vulnerabilities:
    - `esbuild <=0.24.2` (Moderate): Dev-server request forgery via DNS rebinding (GHSA-67mh-4wv8-2f99). Dev dependency only; does not affect production build.
    - `react-router / react-router-dom 6.28.0` (Moderate/High): CVE-2025-68470 open redirect bypass via backslash characters in `<Link>`/`useNavigate`, and GHSA-337j-9hxr-rhxg arbitrary constructor injection in SSR hydration.
    - *Remediation Note:* `npm audit fix --force` attempts to upgrade to `react-router-dom@7.x`, which is a breaking major rewrite. Recommended approach is to verify patch compatibility within the 6.x series.
  - **Android Gradle Dependencies:** Up to date. `compileSdkVersion 36`, `targetSdkVersion 36`, `minSdkVersion 24`. Release build currently has `minifyEnabled false` (SEC-09).

### Domain 10: GitHub and Repository Security
* **Status:** **PASS** (with 1 Informational note SEC-11)
* **Scope Audited:** `.gitignore`, `.git/`, GitHub Actions, repository tracking.
* **Technical Reality:**
  - `.gitignore` rigorously excludes `.env`, `.env.*` (preserving `.env.example`), `node_modules/`, `dist/`, `.venv/`, `*.jks`, `*.keystore`, and `key.properties`.
  - Git history has zero leaked secrets or API credentials.
  - No automated CI workflows currently exist in `.github/workflows/` (SEC-11).

### Domain 11: Production Configuration
* **Status:** **PASS** (with Security Header remediation required under SEC-02)
* **Scope Audited:** Production Vercel settings, debug flags, environment variables.
* **Technical Reality:**
  - Debug flags: Production build compiles in release mode with React in production mode (`NODE_ENV=production`).
  - No developer endpoints or debug hooks exposed in production bundle.

### Domain 12: AI API Cost Protection
* **Status:** **PASS** (with Rate Limiting remediation required under SEC-03)
* **Scope Audited:** Groq integration, Whisper models, IndicConformer fallback.
* **Technical Reality:**
  - Groq credentials remain strictly server-side.
  - Requests require authenticated user Bearer token (fail-closed).
  - Rate limiting must be implemented at the Edge Function layer to prevent deliberate or accidental quota exhaustion (SEC-03).

---

## 4. Detailed Finding Registry

### [SEC-01] IDOR / Missing Parent Ownership Verification in `wish_contributions` and `invoice_settlements`
- **Security Category:** 3. User Data Isolation / 7. Database Security
- **Severity:** **CRITICAL**
- **Affected Artifacts:** `backend/supabase/migrations/20261121000400_invoices_and_wish.sql` (Tables: `public.wish_contributions`, `public.invoice_settlements`)
- **Evidence:**
  ```sql
  CREATE POLICY "Users can manage own wish contributions"
    ON public.wish_contributions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  ```
- **Reproduction Method:**
  1. Authenticate as User A (`11111111-...`) and insert a wish goal:
     `INSERT INTO public.wish_goals (id, user_id, title, target_amount) VALUES ('aaa...', '1111...', 'Bike', 50000.00);`
  2. Authenticate as User B (`22222222-...`) and insert a contribution specifying User B's `user_id` but User A's `goal_id`:
     `INSERT INTO public.wish_contributions (goal_id, user_id, amount) VALUES ('aaa...', '2222...', 1000.00);`
  3. Query User A's goal as User A. `saved_amount` has mutated from `0.00` to `1000.00`.
- **Actual Risk:** Authenticated users can modify other users' financial goal progress and invoice settlement states by injecting records referencing third-party UUIDs.
- **Recommended Remediation:**
  Update RLS policies for `wish_contributions` and `invoice_settlements` to enforce that the parent record belongs to `auth.uid()`:
  ```sql
  -- Remediate wish_contributions
  DROP POLICY IF EXISTS "Users can manage own wish contributions" ON public.wish_contributions;
  CREATE POLICY "Users can manage own wish contributions"
    ON public.wish_contributions FOR ALL
    USING (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1 FROM public.wish_goals
         WHERE wish_goals.id = wish_contributions.goal_id
           AND wish_goals.user_id = auth.uid()
      )
    )
    WITH CHECK (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1 FROM public.wish_goals
         WHERE wish_goals.id = wish_contributions.goal_id
           AND wish_goals.user_id = auth.uid()
      )
    );

  -- Remediate invoice_settlements
  DROP POLICY IF EXISTS "Users can manage own invoice settlements" ON public.invoice_settlements;
  CREATE POLICY "Users can manage own invoice settlements"
    ON public.invoice_settlements FOR ALL
    USING (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1 FROM public.invoices
         WHERE invoices.id = invoice_settlements.invoice_id
           AND invoices.user_id = auth.uid()
      )
    )
    WITH CHECK (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1 FROM public.invoices
         WHERE invoices.id = invoice_settlements.invoice_id
           AND invoices.user_id = auth.uid()
      )
    );
  ```

---

### [SEC-02] Missing HTTP Security Headers on Vercel Production Deployment
- **Security Category:** 5. API and Network Security / 11. Production Configuration
- **Severity:** **HIGH**
- **Affected Artifacts:** `frontend/vercel.json`, `https://myflova.vercel.app`
- **Evidence:** HTTP response header inspection of `https://myflova.vercel.app` returns:
  ```http
  Access-Control-Allow-Origin: *
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  ```
  Headers `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy` are absent.
- **Actual Risk:**
  - Without `X-Frame-Options` or CSP `frame-ancestors 'none'`, the web app can be embedded in malicious iframes (Clickjacking).
  - Without `X-Content-Type-Options: nosniff`, browsers may execute misinterpreted scripts (MIME confusion).
  - Without CSP, defense-in-depth against script injection is reduced.
- **Recommended Remediation:**
  Add a global security headers rule in `frontend/vercel.json`:
  ```json
  {
    "source": "/(.*)",
    "headers": [
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(self), geolocation=()" },
      {
        "key": "Content-Security-Policy",
        "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://msjzkylvafuwlkkujxpv.supabase.co wss://msjzkylvafuwlkkujxpv.supabase.co https://api.groq.com; frame-ancestors 'none';"
      }
    ]
  }
  ```

---

### [SEC-03] Absence of Server-Side Rate Limiting on Supabase Edge Functions
- **Security Category:** 5. API and Network Security / 12. AI API Cost Protection
- **Severity:** **HIGH**
- **Affected Artifacts:** `backend/supabase/functions/process-voice/index.ts`, `backend/supabase/functions/extract-receipt/index.ts`
- **Evidence:** Source code analysis of `process-voice` and `extract-receipt` shows user JWT authentication via `supabase.auth.getUser(token)`, but zero rate limit or sliding-window request tracking.
- **Actual Risk:** Malicious or script-driven authenticated users could send thousands of inference requests, depleting monthly Groq API credits or driving unexpected infrastructure costs.
- **Recommended Remediation:**
  Implement a lightweight token bucket or sliding-window rate limiter per user ID (e.g., maximum 30 requests per 10 minutes per authenticated user), backed by Supabase Edge KV or database counter table `user_rate_limits`.

---

### [SEC-04] Missing Maximum Request Payload Size Check in `extract-receipt`
- **Security Category:** 6. File Upload Security
- **Severity:** **MEDIUM**
- **Affected Artifacts:** `backend/supabase/functions/extract-receipt/index.ts`
- **Evidence:**
  `process-voice/index.ts` enforces:
  ```typescript
  if (hasAudio && body.audioBase64!.length > 10 * 1024 * 1024) { ... }
  ```
  `extract-receipt/index.ts` contains:
  ```typescript
  const hasImage = typeof body.imageBase64 === "string" && body.imageBase64.length > 50;
  ```
  No maximum byte check exists on `body.imageBase64`.
- **Actual Risk:** While the frontend downscales photos to ~500 KB, direct API requests bypassing the frontend could transmit a 100 MB string, risking memory exhaustion in Deno Edge Function isolates.
- **Recommended Remediation:**
  Add server-side length validation in `extract-receipt/index.ts`:
  ```typescript
  if (hasImage && body.imageBase64!.length > 15 * 1024 * 1024) {
    return new Response(
      JSON.stringify({ error: "Image payload exceeds maximum limit of 15MB." }),
      { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  ```

---

### [SEC-05] Insecure Wildcard Origin with Credentials Allowed in Python STT Service
- **Security Category:** 5. API and Network Security
- **Severity:** **MEDIUM**
- **Affected Artifacts:** `ai-engine/stt_service/main.py`
- **Evidence:**
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```
- **Actual Risk:** In FastAPI/Starlette, pairing `allow_origins=["*"]` with `allow_credentials=True` generates invalid CORS headers that standard browsers reject, or results in reflecting arbitrary request origins.
- **Recommended Remediation:**
  Restrict `allow_origins` to explicit internal or allowed domains (or disable `allow_credentials` since the STT service relies on `X-FLOVA-STT-KEY` header authentication, not cookies).

---

### [SEC-06] Unnecessary Direct `EXECUTE` Grants to `authenticated` on Trigger Functions
- **Security Category:** 7. Database Security
- **Severity:** **MEDIUM**
- **Affected Artifacts:** `backend/supabase/migrations/20261121000100_harden_payout_sync.sql`
- **Evidence:**
  ```sql
  grant execute on function public.sync_payout_received(uuid) to authenticated;
  grant execute on function public.transactions_sync_payout() to authenticated;
  ```
- **Actual Risk:** PostgreSQL triggers fire automatically without requiring table writers to hold direct `EXECUTE` grants on trigger procedures. Granting execute on `sync_payout_received(uuid)` exposes it as an RPC endpoint (`POST /rest/v1/rpc/sync_payout_received`) over PostgREST.
- **Recommended Remediation:**
  Revoke execute privileges on trigger procedures from `authenticated`, matching the hardening applied in migration `20261123150000_harden_anon_and_triggers.sql`:
  ```sql
  REVOKE EXECUTE ON FUNCTION public.sync_payout_received(uuid) FROM authenticated, anon, PUBLIC;
  REVOKE EXECUTE ON FUNCTION public.transactions_sync_payout() FROM authenticated, anon, PUBLIC;
  ```

---

### [SEC-07] Dependency Vulnerabilities in `react-router-dom` and `esbuild`
- **Security Category:** 9. Dependency Audit
- **Severity:** **MEDIUM**
- **Affected Artifacts:** `frontend/package.json` (`react-router-dom@6.28.0`, `vite@5.4.11` / `esbuild@0.24.0`)
- **Evidence:** `npm audit` reports GHSA-wrjc-x8rr-h8h6 (CVE-2025-68470 open redirect bypass via backslash) and GHSA-67mh-4wv8-2f99 (`esbuild` dev-server request forgery).
- **Actual Risk:** Potential open redirect if unvalidated backslash paths are handled in navigation; dev-server rebinding risk during local development.
- **Recommended Remediation:**
  - For `react-router-dom`: Maintain version 6.x stability while updating to the latest patched 6.x release (`6.28.2`+) once backported, or sanitize `fromPath` with `fromPath.replace(/\\/g, "/")`.
  - For `vite`/`esbuild`: Update `vite` to latest 5.4.x patch release to pull in updated `esbuild`.

---

### [SEC-08] Hardcoded Supabase Anonymous Key Fallback in Frontend Client Source
- **Security Category:** 1. API Keys and Secrets
- **Severity:** **INFORMATIONAL (PASS)**
- **Affected Artifacts:** `frontend/src/lib/supabase.ts`
- **Evidence:** Lines 7–10 provide a fallback string matching the Supabase publishable anon JWT.
- **Actual Risk:** Low. The anonymous key is public by design in Supabase architecture and restricted by RLS. However, hardcoding it circumvents environment segregation (dev vs staging vs prod).
- **Recommended Remediation:**
  Remove the hardcoded string fallback and strictly enforce `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`.

---

### [SEC-09] Code Shrinking & Obfuscation Disabled in Android Release Build
- **Security Category:** 9. Dependency & Build Audit
- **Severity:** **LOW**
- **Affected Artifacts:** `frontend/android/app/build.gradle`
- **Evidence:**
  ```groovy
  buildTypes {
      release {
          minifyEnabled false
          proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
      }
  }
  ```
- **Actual Risk:** Without R8 minification and obfuscation, reverse-engineering Android APK/AAB bytecode is trivial, and bundle size is larger than necessary.
- **Recommended Remediation:**
  Enable `minifyEnabled true` in `buildTypes.release` and configure `proguard-rules.pro` to keep Capacitor bridge and plugin classes intact.

---

### [SEC-10] Missing In-App Self-Service Password Recovery Flow
- **Security Category:** 8. Password and Authentication Security
- **Severity:** **LOW**
- **Affected Artifacts:** `frontend/src/pages/auth/LoginPage.tsx`
- **Evidence:** `LoginPage.tsx` provides email/password login and Google Sign-In, but lacks a "Forgot Password?" trigger or modal invoking `supabase.auth.resetPasswordForEmail()`.
- **Actual Risk:** User lockout if password is lost without linked Google OAuth.
- **Recommended Remediation:**
  Add a "Forgot Password?" modal to `LoginPage.tsx` calling `supabase.auth.resetPasswordForEmail(email)`.

---

### [SEC-11] Absence of Automated GitHub Actions Security Workflows
- **Security Category:** 10. GitHub and Repository Security
- **Severity:** **INFORMATIONAL**
- **Affected Artifacts:** `.github/workflows/` (currently empty)
- **Evidence:** Directory contains zero automated CI/CD configurations.
- **Actual Risk:** Security regressions, dependency vulnerabilities, or secret leaks could be committed without automated pull-request gatekeeping.
- **Recommended Remediation:**
  Introduce `.github/workflows/security-ci.yml` running `npm audit`, `git-secrets`/TruffleHog, and `make test`.

---

## 5. Security Verification Test Log

| Test Category | Target Component | Safe Test Method | Result | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Anonymous Access** | Postgres Tables (All 10) | PGlite local role simulation with `role: anon` | **PASS** | Permission denied on all tables; anon has zero access. |
| **Cross-User Data Access** | Core Tables (`payouts`, `transactions`, `commitments`) | Query rows where `auth.uid() = User B` against User A records | **PASS** | RLS filters rows completely; returns 0 rows. |
| **Cross-User Data Access** | `wish_contributions` | Insert contribution referencing User A goal as User B | **FAIL** | **Vulnerability verified.** User A goal mutated. |
| **Cross-User Data Access** | `invoice_settlements` | Insert settlement referencing User A invoice as User B | **FAIL** | **Vulnerability verified.** User A invoice mutated. |
| **SQL Injection** | Transactions checkin & amount | Parameterized SDK queries with quote and union injection | **PASS** | Parameterization cleanly treats payload as literal string. |
| **XSS Payload Handling** | Checkin notes & Invoice items | Script tag inputs `<script>alert(1)</script>` | **PASS** | React JSX escapes text; zero script execution. |
| **Replay Protection** | Google Sign-In | Inspect `socialAuth.ts` nonce generation & verification | **PASS** | 32-byte cryptographic nonce SHA-256 validated by Supabase. |
| **Oversized Uploads** | Receipt Image Client | Select 25 MB mock image file | **PASS** | Client validation throws error before network request. |
| **Oversized Uploads** | `extract-receipt` Server | Direct API POST with 100 MB string | **FAIL** | Server lacks upper payload boundary (SEC-04). |
| **Rate Limit Enforcement** | Edge Functions | Rapid sequential POST requests | **FAIL** | All requests accepted without rate limit throttling. |
| **Production HTTPS** | `myflova.vercel.app` | HTTP HEAD request to production URL | **PASS** | TLS 1.3 enforced; HSTS preload header verified. |
| **Source Map Exposure** | `frontend/dist/` | Production build directory file scan | **PASS** | Zero `.map` files generated or present. |

---

## 6. Prioritized Remediation Plan

To be executed upon explicit user approval:

### Phase 3.2.1: Priority 0 (Critical Blockers — Must Fix Immediately)
1. **Remediate Child Table RLS Policies (SEC-01):**
   - Author database migration `20261123160000_harden_child_table_rls.sql` adding `EXISTS (SELECT 1 FROM parent WHERE parent.id = child.parent_id AND parent.user_id = auth.uid())` to `wish_contributions` and `invoice_settlements`.
   - Add automated test assertions in `backend/scripts/test-db.mjs`.

### Phase 3.2.2: Priority 1 (High Security & Cost Gates)
2. **Configure HTTP Security Headers (SEC-02):**
   - Update `frontend/vercel.json` with strict CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy`.
3. **Edge Function Payload & Rate Protection (SEC-03, SEC-04):**
   - Add maximum payload size check (15 MB) to `backend/supabase/functions/extract-receipt/index.ts`.
   - Add per-user sliding-window rate limiting in Edge Functions.
4. **FastAPI CORS Hardening (SEC-05):**
   - Correct `ai-engine/stt_service/main.py` CORS middleware to remove wildcard with credentials.
5. **Revoke Unused RPC Privileges (SEC-06):**
   - Revoke `EXECUTE` on `sync_payout_received` and `transactions_sync_payout` from `authenticated`.

### Phase 3.2.3: Priority 2 (Pre-Launch Polish & Hardening)
6. **Android Build Obfuscation (SEC-09):**
   - Enable `minifyEnabled true` in `frontend/android/app/build.gradle` and tune `proguard-rules.pro`.
7. **Password Recovery Flow (SEC-10):**
   - Implement "Forgot Password?" dialog in `LoginPage.tsx`.
8. **Dependency Patching (SEC-07):**
   - Patch `react-router-dom` and `vite` to latest safe minor/patch versions.
9. **CI/CD Security Workflows (SEC-11):**
   - Add GitHub Actions CI workflow to run security checks on pull requests.

---

## 7. Safety & Compliance Sign-Off

- [x] **Audit Only:** Zero production code, configurations, or credentials modified during this audit.
- [x] **No Secret Leaks:** No secret keys or credentials printed in report or logs.
- [x] **Deterministic Arithmetic:** Verified integer paise calculations preserved across all financial operations.
- [x] **Dual Speech Path:** Preserved both AI4Bharat IndicConformer and Groq Whisper pipelines.
- [x] **Ready for User Review:** Awaiting explicit user direction before applying remediation migrations or patches.
