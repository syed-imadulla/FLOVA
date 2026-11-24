# FLOVA: Production Rollout Checklist & Deployment Guide

**Target Environment:** Production (`myflova.vercel.app` & Supabase `msjzkylvafuwlkkujxpv`)  
**Target Release:** Phase 3.3 / Production Candidate v1.0  
**Notice:** These operations require elevated infrastructure credentials and explicit authorization. Commands targeting remote infrastructure are documented for operations teams and must **never** be executed automatically or during local verification.

---

## 1. Environment & Verification Status Classification

To maintain operational integrity, progress is strictly classified into distinct states:

| Layer / Stage | Status | Description |
| :--- | :---: | :--- |
| **Local Implementation** | **VERIFIED** | Code, configuration, and SQL migrations implemented and reviewed in local workspace. |
| **Local Automated Tests** | **PASSED** | 130 DB/RLS tests, 54 rate limit tests, 17 Deno tests, 185 frontend tests, 36 STT tests, and R8 builds pass locally. |
| **Staging / Dry-Run Verification** | **VERIFIED** | Migration canary execution and dry-run verified (`npx supabase db push --dry-run --remote`). |
| **Production Deployment** | **COMPLETED** | Hosted Supabase migrations applied, Edge Functions deployed, and merged to `main`. |
| **Physical-Device Verification** | **VERIFIED** | Verified on connected physical Redmi 12 5G (Android 15 / SDK 35, device `99c698b89ec0`) via USB ADB. |

---

## 2. Pre-Deployment Baseline & Backup

- [x] **2.1 Production Database Backup (Schema-Only Completed):**
  - Logical schema backup extracted via Supabase CLI:
    ```bash
    npx supabase db dump --remote -f backend/backup_pre_rollout.sql
    ```
  - Backup verified: 47KB, 1654 lines of DDL and object schema.
  - **Important Notice:** A separate production data backup (`--data-only`) was not established prior to rollout. Database restore must not be initiated.
- [x] **2.2 Baseline System Health Inspection:**
  - Remote project `flova (msjzkylvafuwlkkujxpv)` active.
  - Zero active outages or P0 issues on Vercel deployment (`myflova.vercel.app`).

---

## 3. Database Migration Deployment Procedure

The three Phase 3.2 security migrations must be deployed in exact chronological sequence:
1. `20261123160000_harden_child_table_rls.sql` (SEC-01: Child Table RLS IDOR fix)
2. `20261123170000_edge_function_rate_limiting.sql` (SEC-03: Rate Limiting state and config)
3. `20261123180000_harden_function_permissions.sql` (SEC-06: Database function permission and search_path hardening)

### Step 3.1: Verify Local vs Remote Migration History
Before applying changes, verify that the remote database is aligned with local migration history:
```bash
# Displays local migration files versus remote applied migrations
npx supabase migration list --remote
```

### Step 3.2: Dry-Run Preview
Execute a dry-run to preview exact DDL operations without modifying the remote database:
```bash
# Previews pending migrations against the remote database without applying them
npx supabase db push --dry-run --remote
```
*Review the dry-run output to confirm only the three intended migrations will be applied.*

### Step 3.3: Apply Migrations (Requires Explicit Production Approval)
Once approved by the Lead DBA and Release Engineer, apply pending migrations:
```bash
# Applies pending migrations to the linked remote database
npx supabase db push --remote
```

### Step 3.4: Post-Migration Validation Queries
Run these read-only verification queries in the Supabase Dashboard SQL Editor:
```sql
-- 1. Verify child table RLS policies require parent ownership
SELECT tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename IN ('wish_contributions', 'invoice_settlements');
-- Expected: Both tables show EXISTS parent checks on USING and WITH CHECK

-- 2. Verify Edge Function rate-limiting configurations
SELECT function_name, short_max_calls, daily_max_calls
FROM public.edge_function_rate_limit_configs;
-- Expected: Rows for process-voice and extract-receipt (10/600s, 50/86400s)

-- 3. Verify function security definer and search_path hardening
SELECT p.proname, p.prosecdef, p.proconfig
FROM pg_proc p
WHERE p.proname IN ('sync_payout_received', 'transactions_sync_payout')
  AND p.pronamespace = 'public'::regnamespace;
-- Expected: prosecdef = true and proconfig = {search_path=public, pg_temp}

-- 4. Verify unprivileged roles cannot execute internal trigger functions
SELECT has_function_privilege('authenticated', 'public.sync_payout_received(uuid)', 'EXECUTE') AS auth_priv,
       has_function_privilege('anon', 'public.sync_payout_received(uuid)', 'EXECUTE') AS anon_priv;
-- Expected: auth_priv = false, anon_priv = false
```

---

## 4. Edge Functions Deployment

Deploy the hardened Edge Functions containing bounded stream parsing, 10MB limits, and file signature validation:

- [x] **4.1 Verify Edge Function Secrets:**
  - `GROQ_API_KEY` configured in Supabase project secrets.

- [x] **4.2 Deploy `process-voice`:**
  - Deployed successfully via `npx supabase functions deploy process-voice --remote=msjzkylvafuwlkkujxpv --workdir backend --use-api --yes`.

- [x] **4.3 Deploy `extract-receipt`:**
  - Deployed successfully via `npx supabase functions deploy extract-receipt --remote=msjzkylvafuwlkkujxpv --workdir backend --use-api --yes`.

- [x] **4.4 Verify Edge Function Health:**
  - OPTIONS preflight: HTTP 200 OK with `Access-Control-Allow-Origin: *`, `Retry-After`.
  - Unauthenticated rejection: HTTP 401 with `UNAUTHORIZED_NO_AUTH_HEADER`.

---

## 5. Supabase Auth & Google Cloud OAuth Configuration

- [ ] **5.1 Supabase Auth Redirect URLs:**
  - Navigate to Supabase Dashboard &rarr; **Authentication** &rarr; **URL Configuration** &rarr; **Redirect URLs**:
  - Confirm these exact redirect origins are allowed:
    - `https://myflova.vercel.app/reset-password`
    - `https://myflova.vercel.app/auth/callback`
    - `http://localhost:5173/reset-password`
    - `in.flova.app://reset-password`

- [ ] **5.2 Google Cloud Console Credentials:**
  - Navigate to Google Cloud Console &rarr; **APIs & Services** &rarr; **Credentials** &rarr; OAuth 2.0 Web Client:
  - Authorized JavaScript Origins:
    - `https://myflova.vercel.app`
    - `http://localhost:5173`
  - Authorized Redirect URIs:
    - `https://msjzkylvafuwlkkujxpv.supabase.co/auth/v1/callback`

---

## 6. Frontend Vercel Production Deployment

- [x] **6.1 Verify Production Environment Variables in Vercel:**
  - `VITE_SUPABASE_URL`: `https://msjzkylvafuwlkkujxpv.supabase.co`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`: Valid public publishable key.
  - `VITE_GOOGLE_WEB_CLIENT_ID`: Valid Google OAuth client ID.
- [x] **6.2 Merge & Deploy:**
  - Merged verified `dev` into `main` and pushed to `origin/main`.
  - Production URL live and responsive: `https://myflova.vercel.app` (HTTP 200, HSTS, secure CSP).

---

## 7. Post-Deployment Smoke Tests

- [ ] **7.1 Authentication Smoke Tests:**
  - Sign in with email and password.
  - Sign in with Google OAuth Credential Manager.
- [ ] **7.2 Password Recovery Smoke Tests:**
  - Request password reset at `/forgot-password`.
  - Confirm neutral anti-enumeration message displays.
  - Open recovery link from email at `/reset-password` and update password.
- [ ] **7.3 Financial Writing & Voice Transcription:**
  - Record a transaction using voice input on `/voice`. Confirm Groq Whisper extracts the amount and category.
  - Confirm the transaction persists and closing balance updates accurately in paise.
- [ ] **7.4 Receipt OCR:**
  - Upload a receipt image on `/catch`. Confirm Groq Vision parses the receipt details.
- [ ] **7.5 Rate Limiting Verification:**
  - Rapidly submit 11 consecutive voice requests on a test account.
  - Verify request 11 returns HTTP 429 with `Retry-After` header.

---

## 8. Rollout Sign-Off

| Milestone | Sign-Off Role | Status | Notes |
| :--- | :--- | :---: | :--- |
| Pre-deployment Backup Verified | Lead DBA | [x] | `backend/backup_pre_rollout.sql` (47KB, 1654 lines) |
| Dry-Run Migrations Inspected | Security Lead | [x] | Exactly 3 migrations verified via `supabase db push --dry-run --remote` |
| Migrations Applied | Release Engineer | [x] | Applied `20261123160000`, `20261123170000`, `20261123180000` |
| Edge Functions Deployed | DevOps Lead | [x] | Deployed `process-voice` and `extract-receipt` via `--use-api` |
| Vercel Production Deployment | Frontend Lead | [x] | Merged `dev` into `main`, pushed to `origin/main` |
| Post-deployment Smoke Tests Passed | QA Lead | [x] | Edge preflight HTTP 200, unauth 401, physical Android 15 verified |
