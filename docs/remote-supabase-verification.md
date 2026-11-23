# FLOVA Remote Supabase Production Verification Report
**Phase 1.2B: Live Infrastructure Audit & Configuration Comparison**

**Date of Inspection:** November 23, 2026  
**Execution Mode:** Strict Read-Only (Zero Mutations, Zero Deployments)  
**Target Project Reference:** `msjzkylvafuwlkkujxpv`  
**Report File:** `docs/remote-supabase-verification.md`  

---

## 1. Project Identification

| Parameter | Remote Value | Status |
|---|---|---|
| **Project ID / Reference** | `msjzkylvafuwlkkujxpv` | **PASS** |
| **Project Name** | `flova` | **PASS** |
| **Organization** | `ukjmyrpfjqfkjrlkvwtq` | **PASS** |
| **Region** | `ap-south-1` (Mumbai, India) | **PASS** |
| **Health Status** | `ACTIVE_HEALTHY` | **PASS** |
| **PostgreSQL Version** | `17.12.0.000` (Release Channel: `ga`) | **PASS** |
| **Database Host** | `db.msjzkylvafuwlkkujxpv.supabase.co` | **PASS** |
| **API Endpoint** | `https://msjzkylvafuwlkkujxpv.supabase.co` | **PASS** |

---

## 2. Access and Verification Method

All verification was conducted using non-destructive, read-only mechanisms:
1. **Supabase CLI v3.2.0 (`npx supabase`)**:
   - Authenticated via existing CLI session without prompting for credentials.
   - Executed read-only discovery commands: `projects list`, `functions list`, `secrets list`, `inspect db table-stats`, and `db advisors`.
2. **PostgreSQL System Catalogs**:
   - Executed SQL queries via `npx supabase db query --remote=msjzkylvafuwlkkujxpv --read-only`.
   - Inspected `pg_class`, `pg_roles`, `aclexplode(c.relacl)`, `pg_trigger`, `pg_proc`, `pg_policies`, and `information_schema.columns`.
   - Zero application data was queried; zero customer or financial records were exposed.
3. **Public API Endpoints**:
   - Inspected `/auth/v1/settings` to verify Auth provider configuration.
   - Probed Edge Function endpoints with `OPTIONS` and unauthenticated `POST` requests.

---

## 3. Remote Migration Status

| Migration File | Name | Applied in Schema | Tracked in `schema_migrations` | Status |
|---|---|---|---|---|
| `20261120000100` | `core_financial_schema.sql` | **YES** | **NO** | **WARNING** |
| `20261120000200` | `explicit_grants.sql` | **YES** | **NO** | **WARNING** |
| `20261121000100` | `harden_payout_sync.sql` | **YES** | **NO** | **WARNING** |
| `20261121000200` | `security_definer_views.sql` | **YES** | **NO** | **WARNING** |
| `20261121000201` | `harden_security_definers.sql` | **YES** | **NO** | **WARNING** |
| `20261121000300` | `daily_transaction_limit.sql` | **YES** | **NO** | **WARNING** |
| `20261121000400` | `invoices_and_wish.sql` | **YES** | **NO** | **WARNING** |

### Verified Findings:
- **Schema State (PASS):** All 10 tables, triggers, and function definitions from migrations `20261120000100` through `20261121000400` exist on the live remote database. Column types, defaults, and constraints match local repository code 100%.
- **Migration Tracking Discrepancy (WARNING / BLOCKER):** The tracking table `supabase_migrations.schema_migrations` does not exist on the remote database (`relation "supabase_migrations.schema_migrations" does not exist`).
- **Impact:** The database was initialized by running SQL directly (e.g., via Supabase Dashboard SQL editor) rather than via `supabase migration up`. Running `supabase db push` right now will attempt to execute migration `20261120000100` from the start and fail with `relation "profiles" already exists`.
- **Remediation:** Before running automated deployments, migration history must be baselined using `supabase migration repair --status applied <version>` for all 7 existing migrations.

---

## 4. Edge Function Deployment Status

| Function | Status | Remote Version | Last Updated | JWT Verify | Deployed Match | Status |
|---|---|---|---|---|---|---|
| `extract-receipt` | `ACTIVE` | `v11` | 2026-11-21 05:44:51 UTC | `true` | Older (Nov 21) | **WARNING** |
| `process-voice` | `ACTIVE` | `v7` | 2026-11-21 06:17:06 UTC | `true` | Older (Nov 21) | **WARNING** |

### Verified Findings:
1. **Remote Availability (PASS):** Both Edge Functions exist remotely, are healthy, and respond with HTTP 200 to CORS `OPTIONS` preflight requests.
2. **Platform Gateway JWT Verification (PASS):** Both functions have `verify_jwt: true`. The Supabase Edge Gateway intercepts calls missing an `Authorization` header and returns:
   `HTTP 401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`.
3. **Internal Auth Gating (PASS):** When tested with the publishable `anon` key, both remote functions return:
   `HTTP 401 {"error":"Unauthorized. Invalid user token."}`.
   This proves that remote functions already reject anonymous usage and require a verified user JWT.
4. **Codebase Version Discrepancy (WARNING):**
   - The remote functions reflect the deployment state of **November 21, 2026**.
   - Recent local fixes from Phase 1.2A and Phase 1.2A.1/1.2A.2 (fail-closed environment variable validation, audio codec stripping on `atob()`, IST timezone resolution, Indian date formatting, and markdown fence stripping) are **not yet deployed remotely**.

---

## 5. Secret Availability

| Secret Name | Present Remotely | Category | Notes | Status |
|---|---|---|---|---|
| `GROQ_API_KEY` | **YES** | Custom Secret | Configured manually (updated 2026-11-21T01:54:36Z). Value not exposed. | **PASS** |
| `SUPABASE_URL` | **YES** | Platform Secret | Injected automatically by Supabase runtime. | **PASS** |
| `SUPABASE_ANON_KEY` | **YES** | Platform Secret | Injected automatically by Supabase runtime. | **PASS** |
| `SUPABASE_SERVICE_ROLE_KEY` | **YES** | Platform Secret | Injected automatically by Supabase runtime. | **PASS** |
| `SUPABASE_DB_URL` | **YES** | Platform Secret | Injected automatically by Supabase runtime. | **PASS** |
| `SUPABASE_JWKS` | **YES** | Platform Secret | Injected automatically by Supabase runtime. | **PASS** |
| `INDICCONFORMER_URL` | **NO** | Custom Secret | Not set. Remote `process-voice` routes STT to Groq Whisper directly. | **PASS (By Design)** |
| `INDICCONFORMER_KEY` | **NO** | Custom Secret | Not set. | **PASS (By Design)** |

*Security Confirmation: Secret values were inspected for presence and timestamps only. Zero secret values or keys were logged or printed.*

---

## 6. Remote Database Security & Permissions

### 6.1 Row Level Security (RLS) Status
| Table Name | RLS Enabled | Policies Present | User Isolation Enforced | Status |
|---|---|---|---|---|
| `public.profiles` | **YES** (`relrowsecurity=true`) | 2 policies (`select`, `update`) | `(SELECT auth.uid()) = id` | **PASS** |
| `public.transactions` | **YES** (`relrowsecurity=true`) | 4 policies (`select`, `insert`, `update`, `delete`) | `(SELECT auth.uid()) = user_id` | **PASS** |
| `public.payouts` | **YES** (`relrowsecurity=true`) | 4 policies (`select`, `insert`, `update`, `delete`) | `(SELECT auth.uid()) = user_id` | **PASS** |
| `public.balance_checkins` | **YES** (`relrowsecurity=true`) | 4 policies (`select`, `insert`, `update`, `delete`) | `(SELECT auth.uid()) = user_id` | **PASS** |
| `public.commitments` | **YES** (`relrowsecurity=true`) | 4 policies (`select`, `insert`, `update`, `delete`) | `(SELECT auth.uid()) = user_id` | **PASS** |
| `public.invoices` | **YES** (`relrowsecurity=true`) | 4 policies (`select`, `insert`, `update`, `delete`) | `auth.uid() = user_id` | **PASS** |
| `public.invoice_items` | **YES** (`relrowsecurity=true`) | 1 policy (`ALL`) | Join on `invoices.user_id = auth.uid()` | **PASS** |
| `public.invoice_settlements`| **YES** (`relrowsecurity=true`) | 1 policy (`ALL`) | `auth.uid() = user_id` | **PASS** |
| `public.wish_goals` | **YES** (`relrowsecurity=true`) | 1 policy (`ALL`) | `auth.uid() = user_id` | **PASS** |
| `public.wish_contributions` | **YES** (`relrowsecurity=true`) | 1 policy (`ALL`) | `auth.uid() = user_id` | **PASS** |

### 6.2 Table Privilege Grants (`aclexplode` Inspection)
| Table | `anon` Role Privileges | `authenticated` Role | `service_role` | Assessment | Status |
|---|---|---|---|---|---|
| `profiles` | **NONE** | Full (`DELETE, INSERT, SELECT, UPDATE`) | Full | Revoked in `20261120000200` | **PASS** |
| `transactions` | **NONE** | Full | Full | Revoked in `20261120000200` | **PASS** |
| `payouts` | **NONE** | Full | Full | Revoked in `20261120000200` | **PASS** |
| `balance_checkins` | **NONE** | Full | Full | Revoked in `20261120000200` | **PASS** |
| `commitments` | **NONE** | Full | Full | Revoked in `20261120000200` | **PASS** |
| `invoices` | **ALL** | Full | Full | Granted by default Postgres schema | **WARNING** |
| `invoice_items` | **ALL** | Full | Full | Granted by default Postgres schema | **WARNING** |
| `invoice_settlements` | **ALL** | Full | Full | Granted by default Postgres schema | **WARNING** |
| `wish_goals` | **ALL** | Full | Full | Granted by default Postgres schema | **WARNING** |
| `wish_contributions` | **ALL** | Full | Full | Granted by default Postgres schema | **WARNING** |

### Key Security Assessment on Table Privileges:
- **Empirical Confirmation of Task C Hypothesis:** On the live production database, `anon` currently has table privileges on `invoices`, `invoice_items`, `invoice_settlements`, `wish_goals`, and `wish_contributions`.
- **Effective Protection:** Because RLS is active on all 5 tables with `auth.uid() = user_id`, queries by anonymous callers evaluate to `NULL = user_id` (falsy), returning zero rows. Data leakage is prevented.
- **Defense-in-Depth Recommendation:** The proposed migration `20261123000100_revoke_anon_invoices_wish.sql` should be executed to remove table privileges from `anon`, bringing all 10 tables into uniform security parity.

### 6.3 Security Definer & Linter Advisors
- `check_daily_transaction_limit`: `SECURITY DEFINER` with `search_path=public, pg_temp`.
- `handle_new_user`: `SECURITY DEFINER` with `search_path=""`.
- `rls_auto_enable`: `SECURITY DEFINER` with `search_path=pg_catalog`.
- `sync_invoice_settlement`: `SECURITY DEFINER` with `search_path=public, pg_temp`.
- `sync_wish_contribution`: `SECURITY DEFINER` with `search_path=public, pg_temp`.
- **Advisor Warning:** The Supabase linter notes that these 5 `SECURITY DEFINER` functions can be called via `/rest/v1/rpc/*` by the `anon` role. For functions that only act as internal triggers (`sync_invoice_settlement`, `sync_wish_contribution`, `rls_auto_enable`), executing `REVOKE EXECUTE ON FUNCTION ... FROM anon, public` is recommended.

---

## 7. Authentication Configuration

| Parameter | Remote Value | Evaluation | Status |
|---|---|---|---|
| **Auth Service Health** | Healthy / Online | Supabase GoTrue service is active. | **PASS** |
| **User Signups** | `disable_signup: false` | Allowed. Users can register new accounts. | **PASS** |
| **Email Authentication** | `external.email: true` | Enabled. Email/password authentication is active. | **PASS** |
| **Anonymous Sign-In** | `external.anonymous_users: false` | Disabled. Anonymous auth sessions cannot be created. | **PASS** |
| **Auto-Confirm Email** | `mailer_autoconfirm: true` | **Enabled.** Users do not need to click verification links. | **WARNING** |
| **Phone / SMS Auth** | `external.phone: false` | Disabled. | **PASS** |
| **OAuth Providers** | All `false` (Google, Apple, etc.) | Standard email authentication only. | **PASS** |

### Note on Auto-Confirm:
`mailer_autoconfirm: true` is convenient for developer testing and staging environments because it eliminates email link dependencies. For public production launch, confirm whether users should verify email addresses via a production SMTP provider (e.g. Resend / SendGrid / Postmark).

---

## 8. Summary of Differences (Local vs Remote)

1. **Migration Tracking:** Local repository contains 7 structured migration files; remote database lacks the `supabase_migrations.schema_migrations` tracking table.
2. **Edge Function Revisions:** Local repository contains hardened Edge Functions with fail-closed validation and audio decoding fixes (Nov 23); remote functions are running earlier builds (Nov 21).
3. **Table Privileges:** Local defense-in-depth model intends zero `anon` table grants across all tables; remote currently grants `anon` table privileges on `invoices`, `invoice_items`, `invoice_settlements`, `wish_goals`, and `wish_contributions`.

---

## 9. Production Blockers

1. **[CRITICAL] Unrecorded Migration Baseline:**
   - Attempting to run `supabase db push` or automated CI/CD migrations without repairing migration history will crash because tables already exist.
2. **[HIGH] Outdated Remote Edge Functions:**
   - Remote functions lack audio codec parameter stripping, which can cause base64 decoding crashes on mobile WebViews sending `audio/webm;codecs=opus`.
3. **[MEDIUM] Defense-in-Depth Anon Privilege Revocation:**
   - `anon` table grants on `invoices` and `wish_*` tables should be revoked.

---

## 10. Recommended Next Actions (Awaiting User Approval)

1. **Baseline Migration History:**
   Execute read-only verification before running `supabase migration repair --status applied` for the 7 historical migrations (`20261120000100` through `20261121000400`).
2. **Apply Defense-in-Depth Revocation Migration:**
   Apply `20261123000100_revoke_anon_invoices_wish.sql` to align remote table privileges.
3. **Deploy Hardened Edge Functions:**
   Deploy `extract-receipt` and `process-voice` from local repository using `supabase functions deploy`.
4. **Decide Email Confirmation Policy:**
   Confirm whether `mailer_autoconfirm` should remain `true` or switch to SMTP verification before Google Play Store submission.
