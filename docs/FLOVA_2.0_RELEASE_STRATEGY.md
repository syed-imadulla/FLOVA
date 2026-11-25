# FLOVA 2.0 — Production Release, Database Migration & Reliability Strategy

**Document Version:** 2.0.0-PROD-PLAN-REV2  
**Status:** Approved Architectural Baseline  
**Date:** 2026-11-25  
**Author:** Principal System Architect & Lead Engineer  
**Repository:** `https://github.com/syed-imadulla/FLOVA`  
**Current Production Baseline:** `v1.0.1` (Commit `ab4bdef`)  
**Target General Availability:** `v2.0.0`

---

## 1. Official Distribution Model & Verified Keystore Identity

### 1.1 Direct GitHub Releases Distribution
FLOVA Android is officially distributed as a standalone signed APK attached directly to tagged **GitHub Releases**.
- **No Google Play Store submission:** No Google Play Developer Console uploads, no AAB packaging, and no Play Store staged rollouts.
- **Web App Parity:** The production web app is deployed continuously to Vercel (`https://myflova.vercel.app`).

### 1.2 Permanent Android Release Keystore Specification (Verified)
Read-only inspection of `~/.android/flova-release.keystore` (using `keytool -list -v -alias flova-release`, exit code `0`) confirms the active production signing identity:
- **Keystore Path:** `~/.android/flova-release.keystore` (stored securely outside the repository)
- **Key Alias:** `flova-release`
- **Entry Type:** `PrivateKeyEntry`
- **Key Algorithm:** 4096-bit RSA key (`SHA384withRSA`)
- **Owner / Issuer:** `CN=FLOVA Release, OU=Mobile, O=FLOVA, L=Bangalore, ST=Karnataka, C=IN`
- **Verified SHA-256 Fingerprint:**  
  `3E:2E:D1:B3:24:A8:A9:B3:0E:8A:07:E0:F5:52:D3:C0:6B:E8:9F:A9:4E:4B:C7:E0:A4:1D:F8:23:52:DA:34:D6`
- **SDK Target Configuration:** Min SDK: 24, Compile SDK: 36, Target SDK: 36 (verified in `frontend/android/variables.gradle`).
- **Signing Schemes:** APK Signature Scheme v1, v2, and v3 enabled.
- **Prohibition:** **Never generate, replace, move, or modify the release keystore.**

---

## 2. Migration Safety & Backward Compatibility Strategy

### 2.1 Zero-Duplication & V1.0.1 Client Compatibility
Expanding `transactions.transaction_type` enums in-place risks breaking legacy v1.0.1 clients that strictly validate `TRANSACTION_TYPES = ["income", "expense"]` and compute balances as `income - expense`.

**Approved Schema Strategy (Single Source of Truth):**
1. Keep `transactions.transaction_type` strictly `('income', 'expense')`.
2. Add nullable `inflow_category` (`'earned' | 'family_support' | 'pocket_money' | 'gift' | 'donation'`) on `transactions` (nullable / defaulting to `'earned'` for `'income'` rows) so v1.0.1 clients ignore it safely while v2.0 clients segregate non-earned inflows.
3. Store all peer borrowing, lending, and repayments exclusively in dedicated tables: `people`, `peer_debts`, and `debt_settlements`.
4. Never duplicate `peer_debts` or `debt_settlements` rows into `transactions` or `commitments`.

### 2.2 Local vs. Production Migration Safety Rules
1. **Rollback Scripts Restricted to Disposable Local Databases:**
   - Companion rollback scripts (`20261125000100_rollback_local.sql`) are executed **only** on disposable local Supabase instances during CI and developer verification.
   - **Never** run destructive rollback scripts (`DROP TABLE`, `DROP COLUMN`) against production data.
2. **Forward-Only Corrective Migrations in Production:**
   - All production schema changes are strictly additive and forward-only.
   - If a production schema issue is discovered post-deployment, remediation is performed exclusively via a new forward-only corrective migration (`20261125xxxxxx_fix_*.sql`) preserving 100% of existing production records.
3. **Pre-Production Seeded Compatibility Gate:**
   - Before any production migration approval, the new schema must be tested locally against seeded v1.0.1 data and verified with the legacy v1.0.1 client query suite (`select('*')` on `profiles`, `transactions`, `commitments`, `payouts`, `invoices`, `wish_goals`).

### 2.3 Backward-Compatibility Verification Matrix

| Table / Object | V1.0.1 Contract | V2.0.0 Target Contract | Compatibility & Regression Test |
| :--- | :--- | :--- | :--- |
| `profiles` | Work profile, base fields | Additive nullable persona fields | Legacy profile queries pass against seeded v1.0.1 data. |
| `transactions` | `income \| expense` | Retains `income \| expense`; adds nullable `inflow_category` | `supabase.from('transactions').select('*')` from v1.0.1 client passes 100%. |
| `commitments` | `bill \| debt` | Unchanged for non-peer bills | Zero duplicate peer debt rows inserted here. |
| `people` | Did not exist | New table for peer contacts | Isolated RLS; zero legacy impact. |
| `peer_debts` | Did not exist | Single source of truth for loans | Isolated RLS; zero legacy impact. |
| `debt_settlements` | Did not exist | Single source of truth for repayments | Isolated RLS; zero legacy impact. |
| `financial_audit_log`| Did not exist | Immutable append-only audit trail | `REVOKE UPDATE, DELETE` + trigger guard. |

---

## 3. Database Security, Composite FK Integrity & Dual-Layer Validation

1. **RLS & Composite Foreign Key Cross-User Isolation:**
   - Every new table (`people`, `peer_debts`, `debt_settlements`, `financial_audit_log`) enforces `ENABLE ROW LEVEL SECURITY` with `auth.uid() = user_id` (`USING` and `WITH CHECK`) as an independent security layer.
   - Relational composite unique constraints (`UNIQUE (id, user_id)` on `people` and `peer_debts`) and composite foreign keys (`peer_debts(person_id, user_id) -> people(id, user_id)` and `debt_settlements(debt_id, user_id) -> peer_debts(id, user_id)`) guarantee at the DB constraint level that a debt cannot reference another user's person and a settlement cannot reference another user's debt.
2. **Append-Only Audit Trail (`financial_audit_log`):**
   - Audits all `INSERT`, `UPDATE`, and `DELETE` mutations on `transactions`, `peer_debts`, `debt_settlements`, `commitments`, and `people`.
   - Record fields: `id`, `user_id`, `acting_user_id` (captured from `auth.uid()`), `entity_type`, `entity_id`, `action`, `state_before`, `state_after`, `actor`, `reason`, `created_at`.
   - `REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON financial_audit_log FROM anon, authenticated, public;` — only the `SECURITY DEFINER` trigger (`SET search_path = public, pg_temp`) can append rows, and a `BEFORE UPDATE OR DELETE` trigger unconditionally raises an exception.
3. **Server/DB Validation Authority:** UI confirmation is a required user interaction, **never a substitute for server/database validation**. PostgreSQL `CHECK` constraints (`amount_paise > 0`, `remaining_amount_paise >= 0`, `remaining_amount_paise <= total_amount_paise`) and triggers enforce all financial invariants.

---

## 4. Offline Write-Ahead Log (WAL) & CI/CD Gates

1. **Offline WAL (Sprint 6):** Client-side IndexedDB outbox queue with UUID v4 idempotency keys (`UNIQUE(user_id, idempotency_key)`) and optimistic concurrency tokens.
2. **CI/CD Gates:** TypeScript `tsc --noEmit`, Vitest financial invariant tests, `ci-security-scan.mjs`, local seeded migration & RLS verification tests, R8 release APK build, and GitHub Release publication with SHA-256 checksum.
