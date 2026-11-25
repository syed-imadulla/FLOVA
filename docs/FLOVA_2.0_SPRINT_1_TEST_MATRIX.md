# FLOVA 2.0 — Sprint 1 Test Matrix & Verification Protocols

**Sprint:** Sprint 1 (Financial Foundation, Single Source of Truth & Database Compatibility)  
**Document Version:** 2.0.0-PROD-PLAN-REV2  
**Date:** 2026-11-25  
**Author:** Lead Engineer & QA Architect  
**Baseline:** `v1.0.1` (Commit `ab4bdef` — 78 frontend/native unit tests, 130 DB/RLS tests, 54 rate-limit tests, 36 Python STT tests)

---

## 1. Test Strategy Overview

This test matrix defines the verification protocol for Sprint 1 deliverables (`AC-S1-01` through `AC-S1-10`). Native Android widgets and UPI `ACTION_SEND` sharing were verified in `v1.0.1` and remain covered by regression checks.

---

## 2. Financial Invariants & Single-Source-of-Truth Matrix

| Test ID | Acceptance Criterion | Scenario & Input | Expected Result | Verification Method |
| :--- | :--- | :--- | :--- | :--- |
| **FIN-01** | `AC-S1-01` | Integer-paise math across `balance.ts`, `runway.ts`, `peerDebtEngine.ts`. | Zero floating-point drift; overflow/underflow guards hold. | Vitest (`balance.test.ts`, `peerDebtEngine.test.ts`) |
| **FIN-02** | `AC-S1-02` | Borrow ₹5,000 due in 60 days ($> H = 30$). | `C_owned` +₹5,000, `Available Liquidity` +₹5,000, `Sustainable Capital` +₹0, `earnedIncomePaise` +₹0. | Vitest (`runwayLiability.test.ts`) |
| **FIN-03** | `AC-S1-03` | Borrow ₹5,000 due in 10 days ($\le H = 30$). | `C_owned` +₹5,000, `K_debt_due(30)` +₹5,000, `Available Liquidity` net delta == ₹0 (never double-counted as -₹5,000). | Vitest (`runwayLiability.test.ts`) |
| **FIN-04** | `AC-S1-04` | Sequence: Borrow ₹5,000 -> Lend ₹3,000 -> Repay Out ₹2,000 -> Repay In ₹1,500. | Rows exist ONLY in `peer_debts` / `debt_settlements` (0 rows added to `transactions` or `commitments`). Final `C_owned` delta == +₹1,500 counted once. | Vitest (`singleSourceOfTruth.test.ts`) |
| **FIN-05** | `AC-S1-05` | Log `family_support`, `pocket_money`, `gift`, `donation`. | Increases `C_owned` and `Available Liquidity`; excluded from `earnedIncomePaise`. | Vitest (`financialTaxonomy.test.ts`) |
| **FIN-06** | `AC-S1-06` | Log `not_mine` / COD cash transaction. | Excluded from `C_owned`, `Available Liquidity`, and `Sustainable Capital`. | Vitest (`balance.test.ts`) |

---

## 3. Database Security, Composite FK & Audit Matrix

| Test ID | Acceptance Criterion | Scenario & Input | Expected Result | Verification Method |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | `AC-S1-07` | User B attempts to insert `peer_debts` referencing User A's `person_id`, or `debt_settlements` referencing User A's `debt_id`. | Rejected by composite FK (`peer_debts(person_id, user_id)`, `debt_settlements(debt_id, user_id)`) AND RLS policy. | Supabase DB / RLS Test |
| **SEC-02** | `AC-S1-07` | Direct DB insert bypassing UI with `amount_paise <= 0` or settlement `amount_paise > remaining_amount_paise`. | Rejected by PostgreSQL `CHECK` constraint / `BEFORE INSERT` settlement trigger. | Supabase DB Constraint Test |
| **AUD-01** | `AC-S1-08` | Mutate (`INSERT`, `UPDATE`, `DELETE`) on `transactions`, `peer_debts`, `debt_settlements`, `commitments`, and `people`. | `financial_audit_log` records `user_id`, `acting_user_id`, `state_before`, `state_after`, `entity_type`, `action`. | Supabase Trigger Test |
| **AUD-02** | `AC-S1-08` | Attempt `INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE` directly on `financial_audit_log`. | Rejected by `REVOKE` permissions and `enforce_audit_log_immutability()` trigger. | `auditLogImmutability.test.sql` |

---

## 4. Backward Compatibility & Migration Safety Matrix

| Test ID | Acceptance Criterion | Scenario & Input | Expected Result | Verification Method |
| :--- | :--- | :--- | :--- | :--- |
| **MIG-01** | `AC-S1-09` | Apply `20261125000100_flova_2_foundation.sql` to local DB seeded with `v1.0.1` records. | 100% of `v1.0.1` rows preserved; `v1.0.1` `select('*')` queries and all 78 baseline tests pass unmodified. | Local Supabase CI Check |
| **MIG-02** | `AC-S1-10` | Execute `20261125000100_rollback_local.sql` on disposable local test DB. | Cleanly reverts Sprint 1 schema additions without errors; never executed on production. | Disposable Local DB Check |
