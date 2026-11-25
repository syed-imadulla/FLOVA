# FLOVA 2.0 — Sprint 1 Implementation Plan
## Financial Foundation, Single Source of Truth & Database Compatibility

**Sprint:** Sprint 1  
**Target Release:** FLOVA `v2.0.0-alpha.0`  
**Date:** 2026-11-25  
**Author:** Technical Architect & Lead Engineer  
**Status:** IMPLEMENTATION PLANNING & READINESS (Pending Explicit User Approval)  
**Current Production Baseline:** `v1.0.1` (Commit `ab4bdef`)  
**Android Configuration:** `in.flova.app`, `minSdkVersion = 24`, `compileSdkVersion = 36`, `targetSdkVersion = 36`, permanent keystore `~/.android/flova-release.keystore` (`flova-release`)

---

## 1. Architectural Boundaries & Non-Negotiable Invariants

Sprint 1 establishes the **financial foundation, database compatibility, and core financial engine** for FLOVA 2.0. Native home-screen widgets and UPI `ACTION_SEND` share handling are **already completed and verified in `v1.0.1`** and are preserved untouched.

### Mandatory Invariants:
1. **Single Source of Truth & Zero Duplication:**
   - `transactions` retains `transaction_type IN ('income', 'expense')` and adds nullable `inflow_category` (`'earned' | 'family_support' | 'pocket_money' | 'gift' | 'donation'`) so `v1.0.1` clients remain 100% compatible.
   - `peer_debts` and `debt_settlements` are the sole source of truth for `borrowed`, `lent`, `repayment_in`, and `repayment_out`. They are **never** duplicated into `transactions` or `commitments`.
2. **Available Liquidity vs. Sustainable Runway:**
   - $\text{Available Liquidity}(H) = \max(0,\, C_{\text{owned}} - K_{\text{bills}}(H) - K_{\text{debt\_due}}(H) - B)$
   - $\text{Sustainable Capital}(H) = \max(0,\, C_{\text{owned}} - L_{\text{outstanding}} - K_{\text{bills}}(H) - B)$
   - Borrowed capital never inflates Sustainable Runway and liabilities are never double-counted.
3. **Integer-Paise Precision & Custodial Isolation:** Pure integer paise ($1\text{ INR} = 100\text{ paise}$); `not_mine` / COD cash excluded from owned cash and runway.
4. **Cross-User Integrity & Append-Only Audits:**
   - Composite `UNIQUE (id, user_id)` on `people` and `peer_debts` + composite `FOREIGN KEY` constraints on `peer_debts` and `debt_settlements` + independent RLS (`auth.uid() = user_id`).
   - `financial_audit_log` audits `transactions`, `peer_debts`, `debt_settlements`, `commitments`, and `people` via `SECURITY DEFINER` triggers (`REVOKE INSERT, UPDATE, DELETE, TRUNCATE` from client roles + `BEFORE UPDATE OR DELETE` exception trigger).
5. **Migration Safety:** Companion rollback script (`20261125000100_rollback_local.sql`) is restricted strictly to disposable local test databases; production uses forward-only corrective migrations only.
6. **Navigation Stability:** Existing 5-tab navigation (`AppLayout.tsx`) is preserved in Sprint 1; the 4-tab redesign is deferred to Sprint 3.

---

## 2. Sprint 1 Implementation Workstreams

1. **Workstream A — Additive Database Migration (`20261125000100_flova_2_foundation.sql`):**
   - Alter `transactions` to add nullable `inflow_category`.
   - Create `people`, `peer_debts`, `debt_settlements`, and `financial_audit_log` with composite unique/FK constraints, `CHECK` constraints, RLS policies, atomic settlement trigger, and `SECURITY DEFINER` audit triggers.
   - Author disposable local rollback script `20261125000100_rollback_local.sql`.
2. **Workstream B — TypeScript Contracts & Financial Engine (`frontend/src/types/contracts.ts`, `frontend/src/engine/`):**
   - Extend `contracts.ts` with `InflowCategory`, `Person`, `PeerDebt`, `DebtSettlement`, and `FinancialAuditLogEntry`.
   - Update `balance.ts` and `runway.ts`, and add `peerDebtEngine.ts` implementing $C_{\text{owned}}$, `Available Liquidity`, `Sustainable Capital`, and `Sustainable Runway Days` in pure integer paise.
3. **Workstream C — Verification & Compatibility Suite:**
   - Seeded `v1.0.1` local migration up/down tests, legacy `v1.0.1` query compatibility tests, 78 existing baseline unit tests, and new Sprint 1 invariant/security tests (`AC-S1-01` through `AC-S1-10`).
