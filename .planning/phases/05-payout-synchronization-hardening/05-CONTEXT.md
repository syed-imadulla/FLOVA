# Phase 5: Payout Synchronization Hardening - Context & Decisions

**Phase:** 05-payout-synchronization-hardening  
**Status:** Locked Decisions  
**Author:** M1 (Team Lead, Backend, Database and Integration)  

---

## 1. Locked Decisions & Core Architecture

### Decision 1: Database Trigger Derived Totals & Row-Level Locking
- `payouts.received_amount` must never be directly modifiable by client applications. Direct edits remain blocked by `public.payouts_guard_received()`.
- `public.sync_payout_received(p_payout uuid)` must acquire a row-level lock on the target payout row before computing the sum across linked transactions.
- To prevent deadlocks with PostgreSQL foreign-key constraint validation checks (`FOR KEY SHARE` taken on `INSERT INTO transactions`), `sync_payout_received` uses `FOR NO KEY UPDATE`. This serializes concurrent payout updates without conflicting with foreign-key share locks.
- `received_amount` is always recomputed via `SELECT coalesce(sum(t.amount), 0) FROM public.transactions WHERE payout_id = p_payout`.

### Decision 2: Status State Machine Transitions
- If `p.status = 'cancelled'`, it remains `'cancelled'`.
- If `v_received >= p.expected_amount`, status transitions to `'settled'`.
- If `v_received > 0` and `v_received < p.expected_amount`, status transitions to `'partial'`.
- If `v_received = 0`:
  - If previous status was `'partial'` or `'settled'`, status restores to `'scheduled'`.
  - If previous status was `'scheduled'`, `'estimated'`, or `'unearned'`, the existing status is preserved.

### Decision 3: Deadlock-Free Payout Reassignment
- When a transaction is moved from `old.payout_id` to `new.payout_id`, `transactions_sync_payout()` acquires locks on the payouts in canonical ascending UUID order (`LEAST(old.payout_id, new.payout_id)` first, then `GREATEST(old.payout_id, new.payout_id)`). This eliminates cross-update deadlocks.

### Decision 4: Client-Side Submission Idempotency
- `frontend/src/types/contracts.ts` includes `id?: string` in `NewTransaction`.
- `frontend/src/services/data.ts` assigns a client-generated UUID (`crypto.randomUUID()`) to `t.id` if not already provided.
- If `crypto.randomUUID()` is unavailable, it throws an explicit error rather than silently falling back to a non-idempotent insert.
- The same `id` is retained across retry attempts.
- Forms (`AddTransactionPage.tsx` and `PayoutsPage.tsx`) retain their submission/idempotency UUID for retries on failure, and generate a new UUID only upon successful completion or explicit cancellation.

### Decision 5: Security & RLS Invariants
- Existing Row Level Security (RLS) policies on `payouts` and `transactions` are preserved.
- Composite foreign-key constraints `(payout_id, user_id) REFERENCES payouts(id, user_id)` remain intact.
- Only own-income transactions (`type = 'income' AND ownership = 'mine'`) can be linked to payouts.
- Search path protection (`set search_path = ''`) is preserved on all trigger functions.

---

## 2. Boundaries & Out-of-Scope
- Do NOT modify M3's engine in `frontend/src/engine/`.
- Do NOT change existing applied migrations (`20261120000100_init_schema.sql`, `20261120000200_explicit_grants.sql`).
- Do NOT expose service-role credentials.
- Do NOT apply migrations to live Supabase without approval.
