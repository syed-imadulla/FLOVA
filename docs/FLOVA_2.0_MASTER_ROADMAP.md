# FLOVA 2.0 — Master Delivery Roadmap & Sprint 1 Technical Specification

**Document Version:** 2.0.0-PROD-PLAN-REV2  
**Status:** Approved Architectural Baseline  
**Date:** 2026-11-25  
**Author:** Principal System Architect & Lead Engineer  
**Repository:** `https://github.com/syed-imadulla/FLOVA`  
**Current Production Baseline:** `v1.0.1` (Commit `ab4bdef`)  
**Target General Availability:** `v2.0.0`

---

## 1. Executive Summary & Core Product Directives

FLOVA 2.0 transforms FLOVA from a reactive utility into an intelligent, assistant-centered financial companion while strictly preserving all established production configurations and security rules:

1. **Official Distribution Method:** Direct sideloaded APK via **GitHub Releases** signed with the permanent release keystore outside the repository (`~/.android/flova-release.keystore`). **No Google Play Store submission, no AAB packaging, and no Play Store staged rollout.**
2. **Verified Android Keystore Identity:** Permanent RSA 4096-bit release keystore (`~/.android/flova-release.keystore`), key alias `flova-release`, Min SDK 24, compile SDK 36, target SDK 36, SHA-256 fingerprint verified:  
   `3E:2E:D1:B3:24:A8:A9:B3:0E:8A:07:E0:F5:52:D3:C0:6B:E8:9F:A9:4E:4B:C7:E0:A4:1D:F8:23:52:DA:34:D6`. Never generate, replace, move, or modify the key.
3. **Privacy-Preserving Home Widgets:** Existing native widgets (Compact Mic 2×2, Quick Actions 2×2 / 4×2) remain strictly action launchers and microphone deep links. **No balances or private financial data are displayed on home-screen widgets.**
4. **Speech Infrastructure:** Groq Whisper (`whisper-large-v3-turbo`) via Supabase Edge Function `process-voice` remains the sole production STT. `indicconformer/` remains strictly dormant.
5. **Single Source of Truth & Financial Invariants:** `transactions` (`income | expense` + nullable `inflow_category`) and `peer_debts` / `debt_settlements` never duplicate cash movements. **Available Liquidity** is strictly separated from **Sustainable Runway** so borrowed capital never inflates sustainable runway and liabilities are never double-counted.
6. **Migration Safety:** Rollback scripts are restricted to disposable local test databases; production uses strictly additive, forward-only corrective migrations preserving all existing production records.

---

## 2. Release Milestones & Versioning Plan

```
       [v1.0.1 (Current Stable Production Release — Commit ab4bdef)]
                                    |
                                    v
       +---------------------------------------------------------+
       |  v2.0.0-alpha: Financial Core & Database Compatibility  |  Sprint 1 & Sprint 2
       |  - Single Source of Truth Schema (people, peer_debts,   |
       |    debt_settlements, financial_audit_log)               |
       |  - Available Liquidity vs Sustainable Runway Engine     |
       |  - V1.0.1 Seeded Compatibility & Local Rollback Tests   |
       |  - People Directory & Peer Debt Ledger UI (Sprint 2)    |
       +---------------------------------------------------------+
                                    |
                                    v
       +---------------------------------------------------------+
       |  v2.0.0-beta: Two-Way Voice & Multi-Agent Intelligence  |  Sprint 3 & Sprint 4
       |  - Multi-Turn Conversational Dialogue (3-5 Turn Memory) |
       |  - Multi-Agent Central Router (Groq Llama 3.3)          |
       |  - Navigation Shell Redesign (4-Tab + Assistant Modal)  |
       |  - Student & Family Persona Workflows                   |
       +---------------------------------------------------------+
                                    |
                                    v
       +---------------------------------------------------------+
       |  v2.0.0-rc: Vision, Proactive & Offline Resilience      |  Sprint 5 & Sprint 6
       |  - Receipt Cloud Storage & Line-Item Verification       |
       |  - Local Push Notifications & Alarms (WorkManager)      |
       |  - Offline Write-Ahead Log (WAL) & IndexedDB Replay     |
       +---------------------------------------------------------+
                                    |
                                    v
       [v2.0.0: Production General Availability — GitHub Release]
```

---

## 3. Sprint Sequence (Sprints 1–6)

- **Sprint 1 (Financial Foundation, Single Source of Truth & Database Compatibility — `v2.0.0-alpha.0`):** Database schema, RLS, append-only audit log, Available Liquidity vs Sustainable Runway engine, zero-duplication accounting, and v1.0.1 compatibility verification. Retains existing 5-tab navigation shell.
- **Sprint 2 (People & Shared Finance — `v2.0.0-alpha.1`):** People Directory UI, Peer Debt Ledger UI, partial settlements workflow, and equal/custom bill splitting with remainder paise allocation.
- **Sprint 3 (Navigation Redesign, Two-Way Voice & Multi-Agent Intelligence — `v2.0.0-beta.0`):** 4-tab shell (`People`, `Money`, `Insights`, `Profile`) + center FAB Inline Assistant Modal Sheet, 5-turn dialogue state machine, Groq Llama 3.3 Central Agent Router, Indic TTS, and dual-layer human confirmation gate.
- **Sprint 4 (Student, Family & Persona Workflows — `v2.0.0-beta.1`):** Student pocket money / semester mode, family household shared pools, and proactive daily spend envelope cards.
- **Sprint 5 (Receipt Cloud Storage, Vision Agent & Proactive Notifications — `v2.0.0-rc.0`):** Private `receipts/` bucket with signed URLs, itemized receipt OCR validation, and Android WorkManager / LocalNotifications alarms.
- **Sprint 6 (Offline WAL, Security Hardening & Production Release — `v2.0.0`):** IndexedDB WAL outbox with idempotency keys, R8 verification, permanent keystore verification, and GitHub Release APK publication.

---

## 4. Final Sprint 1 Technical Specification & Acceptance Criteria

### 4.1 Scope Boundary
- **In Scope:** Additive Supabase migration (`20261125000100_flova_2_foundation.sql`), disposable local rollback script (`20261125000100_rollback_local.sql`), TypeScript domain types (`contracts.ts`), pure financial engine (`balance.ts`, `runway.ts`, `peerDebtEngine.ts`), v1.0.1 seeded compatibility tests, and regression tests proving single-counting and audit immutability.
- **Out of Scope (Deferred):** 4-tab navigation redesign (Sprint 3), People/Split UI screens (Sprint 2), Multi-turn voice/TTS (Sprint 3), Offline WAL (Sprint 6).

### 4.2 Database Deliverables
1. **`transactions` Table (Additive, Backward-Compatible):**
   - Keep `transaction_type IN ('income', 'expense')` unchanged so v1.0.1 clients never fail deserialization.
   - Add `inflow_category text NULL CHECK (inflow_category IN ('earned', 'family_support', 'pocket_money', 'gift', 'donation'))` (defaults to `'earned'` when `transaction_type = 'income'`).
2. **`people` Table:**
   - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id uuid NOT NULL REFERENCES auth.users(id)`, `name text NOT NULL`, `phone text`, `upi_id text`, `relationship text`, `is_favorite boolean DEFAULT false`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`, `UNIQUE (id, user_id)`.
3. **`peer_debts` Table (Single Source of Truth for Loans):**
   - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id uuid NOT NULL REFERENCES auth.users(id)`, `person_id uuid NOT NULL`, `direction text NOT NULL CHECK (direction IN ('you_owe', 'they_owe'))`, `total_amount_paise bigint NOT NULL CHECK (total_amount_paise > 0)`, `remaining_amount_paise bigint NOT NULL CHECK (remaining_amount_paise >= 0 AND remaining_amount_paise <= total_amount_paise)`, `reason text`, `status text NOT NULL CHECK (status IN ('active', 'partially_settled', 'settled', 'forgiven'))`, `due_date date`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`, `UNIQUE (id, user_id)`, `FOREIGN KEY (person_id, user_id) REFERENCES people(id, user_id) ON DELETE RESTRICT`.
4. **`debt_settlements` Table (Single Source of Truth for Repayments):**
   - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id uuid NOT NULL REFERENCES auth.users(id)`, `debt_id uuid NOT NULL`, `amount_paise bigint NOT NULL CHECK (amount_paise > 0)`, `payment_mode text`, `reference_id text`, `settled_at timestamptz DEFAULT now()`, `notes text`, `FOREIGN KEY (debt_id, user_id) REFERENCES peer_debts(id, user_id) ON DELETE RESTRICT`.
   - Server-side `BEFORE INSERT` trigger validates `NEW.amount_paise <= debt.remaining_amount_paise` and atomically updates `peer_debts.remaining_amount_paise` and `status`.
5. **`financial_audit_log` Table (Append-Only):**
   - Fields: `id`, `user_id`, `acting_user_id`, `entity_type` (`'transaction' | 'peer_debt' | 'debt_settlement' | 'commitment' | 'person'`), `entity_id`, `action`, `state_before`, `state_after`, `actor`, `reason`, `created_at`.
   - `REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON financial_audit_log FROM anon, authenticated, public;`
   - `SECURITY DEFINER` audit triggers (`SET search_path = public, pg_temp`) on `transactions`, `peer_debts`, `debt_settlements`, `commitments`, and `people`.
   - `BEFORE UPDATE OR DELETE` trigger unconditionally raises an exception.

### 4.3 Sprint 1 Acceptance Criteria & Mandatory Tests

| ID | Acceptance Criterion | Verification Test |
| :--- | :--- | :--- |
| **AC-S1-01** | **Integer-Paise Precision:** All cash, debt, settlement, and runway math uses pure integer paise with zero floating-point drift. | Unit tests in `balance.test.ts` & `peerDebtEngine.test.ts` |
| **AC-S1-02** | **Available Liquidity vs Sustainable Runway:** Borrowing ₹5,000 (due $> H$) increases Available Liquidity by ₹5,000, leaves Sustainable Capital unchanged, and adds ₹0 to Earned Income. | `runwayLiability.test.ts`: Assert `sustainableCapital` delta == 0 on borrow |
| **AC-S1-03** | **Zero Double-Counting (Short-Term Debt):** Borrowing ₹5,000 due within horizon $H$ ($\le 30$ days) increases cash by ₹5,000 and $K_{\text{debt\_due}}(H)$ by ₹5,000, leaving Available Liquidity net change == 0 (never $-₹5,000$). | `runwayLiability.test.ts`: Assert single deduction of due debt |
| **AC-S1-04** | **Single Source of Truth (Cash Counted Once):** Logging `borrowed`, `lent`, `repayment_out`, and `repayment_in` creates rows ONLY in `peer_debts` / `debt_settlements` (never `transactions` or `commitments`), affecting $C_{\text{owned}}$ exactly once. | `singleSourceOfTruth.test.ts`: Sequence of borrow -> lend -> partial repay_out -> partial repay_in |
| **AC-S1-05** | **Non-Earned Inflows Segregated:** `family_support`, `pocket_money`, `gift`, and `donation` increase $C_{\text{owned}}$ and Available Liquidity, but are excluded from `earnedIncomePaise`. | `financialTaxonomy.test.ts` |
| **AC-S1-06** | **Custodial Segregation Preserved:** `not_mine` / COD cash remains excluded from $C_{\text{owned}}$, Available Liquidity, and Sustainable Runway. | Existing + extended `balance.test.ts` |
| **AC-S1-07** | **Server Validation & RLS:** Unauthenticated or cross-user inserts/reads fail; negative/zero amounts or over-settlements (`amount > remaining`) are rejected by DB triggers/constraints even when UI is bypassed. | Database RLS & constraint test suite (`pg_tap` / Vitest integration) |
| **AC-S1-08** | **Append-Only Audit Log:** Every mutation logs to `financial_audit_log`; any `UPDATE` or `DELETE` on `financial_audit_log` fails at the DB permission and trigger level. | `auditLogImmutability.test.sql` |
| **AC-S1-09** | **V1.0.1 Seeded Compatibility:** Migrating a seeded v1.0.1 local database preserves 100% of rows; legacy v1.0.1 `select('*')` queries and existing 78 tests pass unmodified. | Local Supabase migration + v1.0.1 regression run |
| **AC-S1-10** | **Disposable Local Rollback:** Local rollback script cleanly reverts `20261125000100_flova_2_foundation.sql` on disposable test DB without errors. | Local CI migration up/down test |
