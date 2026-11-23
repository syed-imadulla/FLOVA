# FLOVA Remote Remediation Plan
**Phase 1.2C.2: Production Safety Protocol & Remediation Specification**

**Target Project:** `msjzkylvafuwlkkujxpv` (`flova`, `ap-south-1`, PostgreSQL 17.12)  
**Supabase CLI Version:** `v3.2.0`  
**Working Tree Status:** Maintained 100% Isolated & Untouched (Zero Commits, Zero Remote Mutations)  
**Document Status:** Pending User Review & Approval  

---

## 1. Executive Summary & Remediation Architecture

This plan establishes the exact, production-grade remediation protocol for live Supabase project `msjzkylvafuwlkkujxpv`. It addresses four critical safety requirements:
1. **Complete Migration Equivalence:** Provides an exhaustive catalog-verified evidence matrix across all seven historical migrations (tables, columns, constraints, indexes, enums, defaults, RLS policies, trigger definitions, and function source code).
2. **Strictly Minimal Function Permissions:** Proves that PostgreSQL triggers do not require `EXECUTE` grants to `authenticated` or `service_role` at runtime. The remediation strictly revokes unnecessary execution access from `PUBLIC` and `anon` without introducing redundant grants or modifying function definitions.
3. **Exact ACL Rollback:** Records the exact raw PostgreSQL ACL strings (`relacl` and `proacl`) prior to modification and provides surgical inverse SQL scripts that restore only the specific privileges changed.
4. **Safe Working-Tree Preserving Rollback:** Formulates an isolated Git worktree procedure to deploy or rollback Edge Functions without touching uncommitted local files in the active workspace.

---

## 2. Controlled Execution Sequence & Approval Checkpoints

```
[APPROVAL CHECKPOINT 1: Migration History Baseline]
  - Execute `supabase migration repair --status applied` for versions 20261120000100 through 20261121000400.
  - Verify baseline with `supabase migration list --remote=msjzkylvafuwlkkujxpv`.
       │
       ▼
[APPROVAL CHECKPOINT 2: Minimal Security Hardening Migration]
  - Create local migration `backend/supabase/migrations/20261123150000_harden_anon_and_triggers.sql`.
  - Push migration via `supabase db push --remote=msjzkylvafuwlkkujxpv`.
  - Verify exact ACL state on tables and functions.
       │
       ▼
[APPROVAL CHECKPOINT 3: Edge Function Deployment & Verification]
  - Deploy `extract-receipt` and `process-voice` via `supabase functions deploy --remote=msjzkylvafuwlkkujxpv`.
  - Execute multi-tier verification probes (Gateway 401, Anon Key 401, User Session 200).
```

---

## 3. Section 1: Complete Migration Equivalence Matrix

Exhaustive catalog comparison was performed between local migration files and live remote PostgreSQL catalogs (`pg_class`, `pg_attribute`, `pg_type`, `pg_constraint`, `pg_indexes`, `pg_proc`, `pg_trigger`, `pg_policies`, `pg_namespace`).

### 3.1 Migration 1: `20261120000100_init_schema.sql`
- **ENUM Types (PASS):**
  - `transaction_type`: `income, expense` (Confirmed in `pg_enum`)
  - `expense_type`: `living, work` (Confirmed in `pg_enum`)
  - `money_ownership`: `mine, not_mine` (Confirmed in `pg_enum`)
  - `payout_kind`: `platform_payout, incentive, client_payment, advance, other` (Confirmed in `pg_enum`)
  - `payout_status`: `scheduled, estimated, unearned, partial, settled, cancelled` (Confirmed in `pg_enum`)
  - `commitment_kind`: `bill, debt` (Confirmed in `pg_enum`)
  - `commitment_status`: `upcoming, paid, cancelled` (Confirmed in `pg_enum`)
  - `app_language`: `en, kn, hi` (Confirmed in `pg_enum`)
- **Tables & Columns (PASS):**
  - `profiles`: `id` (uuid, PK, references auth.users), `display_name` (text, check <= 80), `phone` (text), `language` (app_language, default 'en'), `baseline_daily_living` (numeric >= 0), `baseline_daily_work` (numeric >= 0), `created_at`, `updated_at`.
  - `transactions`: `id` (uuid, PK), `user_id` (uuid, FK), `type` (transaction_type), `amount` (numeric > 0 and <= 1,000,000), `category` (text <= 40), `description` (text <= 200), `expense_type` (expense_type), `ownership` (money_ownership, default 'mine'), `payout_id` (uuid, FK), `transaction_date` (date, default CURRENT_DATE), `source` (text, default 'manual'), `created_at`, `updated_at`.
  - `payouts`: `id` (uuid, PK), `user_id` (uuid, FK), `kind` (payout_kind), `source` (text <= 80), `expected_date` (date), `expected_amount` (numeric > 0), `received_amount` (numeric >= 0), `status` (payout_status, default 'scheduled'), `note` (text <= 200), `created_at`, `updated_at`. Unique constraint `(id, user_id)`.
  - `balance_checkins`: `id` (uuid, PK), `user_id` (uuid, FK), `cash_amount` (numeric >= 0), `bank_amount` (numeric >= 0), `not_mine_amount` (numeric >= 0), `note` (text <= 200), `checked_at`, `created_at`. Check constraint `not_mine_within_total` (`not_mine_amount <= cash_amount + bank_amount`).
  - `commitments`: `id` (uuid, PK), `user_id` (uuid, FK), `title` (text, 1..80 chars), `amount` (numeric > 0 and <= 1,000,000), `due_date` (date), `category` (text, default 'other'), `kind` (commitment_kind, default 'bill'), `status` (commitment_status, default 'upcoming'), `created_at`, `updated_at`.
- **Constraints & Indexes (PASS):**
  - Primary keys on all 5 tables (`profiles_pkey`, `transactions_pkey`, `payouts_pkey`, `balance_checkins_pkey`, `commitments_pkey`).
  - B-tree indexes: `transactions_user_date` (`user_id, transaction_date DESC`), `transactions_payout` (partial index on `payout_id WHERE payout_id IS NOT NULL`), `payouts_user_date` (`user_id, expected_date`), `payouts_id_user_unique` (`id, user_id`), `balance_checkins_user_time` (`user_id, checked_at DESC`), `commitments_user_due` (`user_id, due_date`).
- **Triggers & Functions (PASS):**
  - `set_updated_at()`: `RETURNS trigger`, `SET search_path = ''`. Confirmed in `pg_proc`.
  - Triggers calling `set_updated_at`: `profiles_updated_at`, `transactions_updated_at`, `payouts_updated_at`, `commitments_updated_at`. Confirmed in `pg_trigger`.
  - `handle_new_user()` and trigger `on_auth_user_created` on `auth.users`: Confirmed present.
- **Row Level Security (PASS):**
  - RLS active (`relrowsecurity=true`) on all 5 tables.
  - Policies enforce `(SELECT auth.uid()) = user_id` (or `= id` on `profiles`) for all operations.

### 3.2 Migration 2: `20261120000200_explicit_grants.sql`
- **Table Privileges (PASS):**
  - Confirmed via `aclexplode(c.relacl)` that `anon` has zero privileges on `profiles`, `transactions`, `payouts`, `balance_checkins`, and `commitments`.
  - `authenticated` and `service_role` have full grants (`arwdDxtm`).

### 3.3 Migration 3: `20261121000100_harden_payout_sync.sql`
- **Payout Hardening & Guard Triggers (PASS):**
  - `sync_payout_received()`: `RETURNS trigger`, `SET search_path = ''`, `SECURITY INVOKER`. Confirmed in `pg_proc`.
  - `transactions_sync_payout()`: `RETURNS trigger`, `SET search_path = ''`, `SECURITY INVOKER`. Confirmed in `pg_proc`.
  - Trigger `payouts_guard_received` on `payouts`: Confirmed in `pg_trigger`.
  - Trigger `transactions_payout_sync` on `transactions`: Confirmed in `pg_trigger`.

### 3.4 Migration 4: `20261121000200_generalise_profiles_and_income.sql`
- **Profile Extensions (PASS):**
  - ENUM `work_profile`: `delivery, driver, service, freelancer, independent_business, small_vendor, daily_wage, seasonal_worker, other` (Confirmed).
  - ENUM `income_variability`: `regular, variable, unpredictable, seasonal, intermittent` (Confirmed).
  - ENUM `payout_pattern`: `daily, weekly, per_job, milestone, variable` (Confirmed).
  - Columns on `profiles`: `work_profile` (`work_profile`), `variability` (`income_variability`, default `'variable'`), `handles_cod` (`boolean`, default `false`). Confirmed in `information_schema.columns`.
  - `handle_new_user()` definition: Updated to safely extract `display_name` up to 80 chars. Confirmed in `pg_proc`.

### 3.5 Migration 5: `20261121000201_set_default_work_profile.sql`
- **Default Work Profile (PASS):**
  - Confirmed `profiles.work_profile` default is `'other'::work_profile` in `information_schema.columns`.

### 3.6 Migration 6: `20261121000300_enforce_daily_transaction_limit.sql`
- **Transaction Limit Enforcement (PASS):**
  - Function `check_daily_transaction_limit()`: `RETURNS trigger`, `SECURITY DEFINER`, `SET search_path = 'public', 'pg_temp'`. Performs `FOR NO KEY UPDATE` profile lock and enforces ₹10,00,000 personal limit (`ownership = 'mine'`). Confirmed in `pg_proc`.
  - Trigger `transactions_daily_limit_trigger`: `BEFORE INSERT OR UPDATE ON transactions`. Confirmed in `pg_trigger`.

### 3.7 Migration 7: `20261121000400_invoices_and_wish.sql`
- **Tables, Columns & Defaults (PASS):**
  - `invoices`: `id` (uuid, PK), `user_id` (uuid, FK), `direction` (receivable/payable), `supplier_name`, `customer_name`, `invoice_number`, `invoice_date` (default CURRENT_DATE), `due_date`, `total_amount` (numeric > 0 and <= 1,000,000), `paid_amount` (numeric >= 0 and <= total_amount, default 0), `status` (default 'unpaid'), `file_path`, `notes`, `metadata` (jsonb, default '{}'), `created_at`, `updated_at`.
  - `invoice_items`: `id` (uuid, PK), `invoice_id` (uuid, FK cascade), `name`, `quantity`, `unit_price`, `amount` (numeric >= 0), `created_at`.
  - `invoice_settlements`: `id` (uuid, PK), `invoice_id` (uuid, FK cascade), `user_id` (uuid, FK cascade), `amount` (numeric > 0 and <= 1,000,000), `settled_at` (date, default CURRENT_DATE), `transaction_id` (FK set null), `payout_id` (FK set null), `notes`, `created_at`.
  - `wish_goals`: `id` (uuid, PK), `user_id` (uuid, FK cascade), `title`, `target_amount` (numeric > 0 and <= 10,000,000), `saved_amount` (numeric >= 0, default 0), `target_date`, `category` (default 'general'), `icon`, `status` (default 'active'), `created_at`, `updated_at`.
  - `wish_contributions`: `id` (uuid, PK), `goal_id` (uuid, FK cascade), `user_id` (uuid, FK cascade), `amount` (numeric > 0), `contributed_at` (date, default CURRENT_DATE), `notes`, `created_at`.
- **Indexes & Constraints (PASS):**
  - All 13 indexes confirmed (`invoices_pkey`, `invoices_user_direction_idx`, `invoices_user_status_idx`, `invoice_items_pkey`, `invoice_items_invoice_id_idx`, `invoice_settlements_pkey`, `invoice_settlements_invoice_id_idx`, `invoice_settlements_user_id_idx`, `wish_goals_pkey`, `wish_goals_user_id_idx`, `wish_contributions_pkey`, `wish_contributions_goal_id_idx`, `wish_contributions_user_id_idx`).
- **Triggers (PASS):**
  - `sync_invoice_settlement()`: `RETURNS trigger`, `SECURITY DEFINER`, `SET search_path = 'public', 'pg_temp'`.
  - Trigger `invoice_settlements_sync_trigger` on `invoice_settlements`.
  - `sync_wish_contribution()`: `RETURNS trigger`, `SECURITY DEFINER`, `SET search_path = 'public', 'pg_temp'`.
  - Trigger `wish_contributions_sync_trigger` on `wish_contributions`.
- **Row Level Security (PASS):**
  - RLS active on all 5 tables. Policies enforce `auth.uid() = user_id`.

### 3.8 Schema Tracking Verification
- **`supabase_migrations.schema_migrations`:** **ABSENT**. All 7 migrations exist in database schema, but are unrecorded in CLI metadata.
- **Remediation Action:** Execute baseline repair (Checkpoint 1).

---

## 4. Section 2: PostgreSQL Trigger Execution & Function Permission Review

### 4.1 How PostgreSQL Evaluates Permissions for Triggers
In PostgreSQL:
1. **Trigger Creation Time:** The role executing `CREATE TRIGGER` must hold `EXECUTE` privilege on the trigger function. All triggers in FLOVA were created by `postgres` (superuser / schema owner).
2. **Trigger Firing Time (DML Operations):** When an authenticated application user performs `INSERT`, `UPDATE`, or `DELETE` on a table with an active trigger:
   - PostgreSQL executes the trigger function internally through the database trigger engine.
   - **PostgreSQL does NOT check whether the executing user holds `EXECUTE` privilege on the trigger function.** The user only needs appropriate table DML privileges (`INSERT`, `UPDATE`, `DELETE`).
   - Furthermore, because these functions are declared `SECURITY DEFINER`, the function logic executes with the full privileges of the function's owner (`postgres`).
3. **Direct Function Calls (Client RPC):** PostgreSQL only checks `EXECUTE` privilege when a function is called directly (e.g. `SELECT check_daily_transaction_limit()` or via PostgREST `/rest/v1/rpc/...`).
4. **Conclusion:** Granting `EXECUTE` to `authenticated` or `service_role` is **unnecessary**. The smallest, safest change is to strictly **REVOKE EXECUTE from `PUBLIC` and `anon`**.

### 4.2 Exact Current Function Permissions (`proacl`)
Queried from `pg_proc.proacl` on the remote database:
```
check_daily_transaction_limit: {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
sync_invoice_settlement:       {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
sync_wish_contribution:        {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
handle_new_user:               {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
rls_auto_enable:               {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
```
*Note: `=X/postgres` represents the default grant of `EXECUTE` to pseudo-role `PUBLIC`.*

### 4.3 Proposed Minimal Hardening SQL
**File to create:** `backend/supabase/migrations/20261123150000_harden_anon_and_triggers.sql`

```sql
-- =====================================================================
-- Migration: 20261123150000_harden_anon_and_triggers.sql
-- Strictly defense-in-depth: removes unneeded anon table and function access.
-- Preserves existing authenticated & service_role permissions and trigger execution.
-- =====================================================================

-- 1. Revoke anon table privileges on Phase 16 tables
REVOKE ALL ON
  public.invoices,
  public.invoice_items,
  public.invoice_settlements,
  public.wish_goals,
  public.wish_contributions
FROM anon;

-- 2. Revoke execute on internal trigger functions from PUBLIC and anon
-- (Trigger functions are invoked automatically by PostgreSQL triggers; zero client RPC callers)
REVOKE EXECUTE ON FUNCTION public.check_daily_transaction_limit() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.sync_invoice_settlement() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.sync_wish_contribution() FROM PUBLIC, anon;

-- 3. Revoke execute on auth and event triggers from PUBLIC, anon, and authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
```

---

## 5. Section 3: Exact ACL Rollback Protocol

If an unforeseen client integration requires reverting permissions, do **not** issue generic `GRANT ALL`. Use this exact, surgical inverse script to restore the pre-remediation state.

### 5.1 Pre-Remediation Baseline ACL State
- **Tables (`invoices`, `invoice_items`, `invoice_settlements`, `wish_goals`, `wish_contributions`):**
  `relacl`: `{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}`
- **Functions (`check_daily_transaction_limit`, `sync_invoice_settlement`, `sync_wish_contribution`, `handle_new_user`, `rls_auto_enable`):**
  `proacl`: `{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}`

### 5.2 Surgical Rollback SQL Script
Execute via `npx supabase db query --remote=msjzkylvafuwlkkujxpv`:

```sql
-- 1. Restore exact table privileges to anon (recreates anon=arwdDxtm/postgres)
-- Correction 2026-11-23: MAINTAIN added; arwdDxtm includes m = MAINTAIN on PostgreSQL 17.
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON
  public.invoices,
  public.invoice_items,
  public.invoice_settlements,
  public.wish_goals,
  public.wish_contributions
TO anon;

-- 2. Restore exact function execution privileges to PUBLIC and anon (recreates =X/postgres and anon=X/postgres)
GRANT EXECUTE ON FUNCTION public.check_daily_transaction_limit() TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_invoice_settlement() TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_wish_contribution() TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO PUBLIC, anon, authenticated;
```

### 5.3 Reverting Migration Record
```bash
cd backend
npx supabase migration repair --status reverted 20261123150000 --remote=msjzkylvafuwlkkujxpv
```

### 5.4 Verification of Restored ACL
Query `relacl` and `proacl` to confirm exact string matching with pre-remediation values:
```bash
npx supabase db query --remote=msjzkylvafuwlkkujxpv --read-only "
SELECT c.relname, c.relacl::text FROM pg_class c 
WHERE c.relname IN ('invoices', 'wish_goals')
UNION ALL
SELECT p.proname, p.proacl::text FROM pg_proc p 
WHERE p.proname IN ('check_daily_transaction_limit', 'sync_invoice_settlement');"
```

---

## 6. Section 4: Safe Working-Tree Preserving Edge Function Rollback

### 6.1 Safety Mandate
The active working tree in `/home/syed-imadulla/Desktop/FLOVA` contains uncommitted, verified fixes across `extract-receipt/index.ts`, `process-voice/index.ts`, `frontend/index.html`, etc.  
**`git checkout` or `git restore` MUST NEVER be run inside the working tree.**

### 6.2 Safe Rollback Procedure via Temporary Isolated Worktree
If a newly deployed Edge Function needs to be rolled back to the November 21 baseline (commit `b60b2124`):

```bash
# 1. Create a detached temporary worktree in /tmp directly from baseline commit b60b2124:
git worktree add --detach /tmp/flova-baseline-worktree b60b2124

# 2. Deploy the baseline functions directly from the isolated temporary directory:
cd /tmp/flova-baseline-worktree/backend
npx supabase functions deploy extract-receipt --remote=msjzkylvafuwlkkujxpv
npx supabase functions deploy process-voice --remote=msjzkylvafuwlkkujxpv

# 3. Clean up and remove the temporary worktree:
cd /home/syed-imadulla/Desktop/FLOVA
git worktree remove /tmp/flova-baseline-worktree
```

### 6.3 Working Tree Integrity Guarantee
Running `git status` in `/home/syed-imadulla/Desktop/FLOVA` confirms that zero local modifications were overwritten or discarded.

---

## 7. Execution Commands by Stage

### Stage 1: Migration History Baseline Recovery
```bash
cd backend
npx supabase migration repair --status applied 20261120000100 --remote=msjzkylvafuwlkkujxpv
npx supabase migration repair --status applied 20261120000200 --remote=msjzkylvafuwlkkujxpv
npx supabase migration repair --status applied 20261121000100 --remote=msjzkylvafuwlkkujxpv
npx supabase migration repair --status applied 20261121000200 --remote=msjzkylvafuwlkkujxpv
npx supabase migration repair --status applied 20261121000201 --remote=msjzkylvafuwlkkujxpv
npx supabase migration repair --status applied 20261121000300 --remote=msjzkylvafuwlkkujxpv
npx supabase migration repair --status applied 20261121000400 --remote=msjzkylvafuwlkkujxpv

# Verify:
npx supabase migration list --remote=msjzkylvafuwlkkujxpv
```

### Stage 2: Push Security Hardening Migration
```bash
cd backend
# 1. Write backend/supabase/migrations/20261123150000_harden_anon_and_triggers.sql
# 2. Push migration:
npx supabase db push --remote=msjzkylvafuwlkkujxpv

# 3. Verify:
npx supabase db query --remote=msjzkylvafuwlkkujxpv --read-only "
SELECT c.relname, c.relacl::text FROM pg_class c WHERE c.relname IN ('invoices', 'wish_goals');"
```

### Stage 3: Edge Function Deployment
```bash
cd backend
npx supabase functions deploy extract-receipt --remote=msjzkylvafuwlkkujxpv
npx supabase functions deploy process-voice --remote=msjzkylvafuwlkkujxpv

# Verify:
curl -s -w "\nHTTP: %{http_code}\n" -X POST \
  "https://msjzkylvafuwlkkujxpv.supabase.co/functions/v1/extract-receipt" \
  -H "Content-Type: application/json" -d '{}'
```

---

## 8. Explicit Approval Checkpoints

Before performing any action on the live remote project, explicit user approval is required for each checkpoint:

- [ ] **Approval Checkpoint 1:** Execute Stage 1: Baseline migrations `20261120000100` through `20261121000400` via `npx supabase migration repair`.
- [ ] **Approval Checkpoint 2:** Execute Stage 2: Create `backend/supabase/migrations/20261123150000_harden_anon_and_triggers.sql` and apply via `npx supabase db push`.
- [ ] **Approval Checkpoint 3:** Execute Stage 3: Deploy updated `extract-receipt` and `process-voice` Edge Functions via `npx supabase functions deploy`.
