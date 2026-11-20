---
phase: 05-payout-synchronization-hardening
plan: 05-02
status: completed
executed: 2026-11-21T00:15:00Z
---

# Plan 05-02 Summary: Idempotent Retry UX Fix in `addTransaction`

## Key Accomplishments

1. **Narrow, Safe Idempotent Retry Handling in `addTransaction()` (`frontend/src/services/data.ts`):**
   - Intercepts PostgreSQL error code `23505` specifically when the error targets `transactions_pkey`.
   - Queries the existing transaction row using the authenticated Supabase client (`supabase.from("transactions").select("*").eq("id", t.id).maybeSingle()`).
   - Relies strictly on database Row Level Security (`transactions_select_own`) to prevent cross-user visibility.
   - Compares critical financial fields (`type`, `amount` in integer paise via `toPaise()`, `ownership`, `expense_type`, and `payout_id`).
   - If fields match: returns the existing transaction as a successful idempotent retry, preventing confusing error alerts when a transaction was committed but the client timed out.
   - If fields conflict: throws an explicit conflict error (`Transaction ID conflict: an existing transaction with this ID has conflicting details.`).
   - If the row is not visible (e.g. cross-user collision filtered by RLS): falls through to `unwrap()` and propagates the original database error.
   - If the 23505 error is for another constraint (non-pkey): falls through and propagates the original error.

2. **Automated Unit & Regression Testing Suite:**
   - Created `frontend/src/services/__tests__/idempotentRetry.test.ts` covering 7 key scenarios (A through G).
   - Added Scenario 9 to `backend/scripts/test-payout-sync.mjs` verifying RLS isolation on duplicate UUID collisions in PGlite.
   - All 7 service retry tests passed (7/7).

3. **Multi-Suite Verification & Zero Regressions:**
   - Database tests: 22/22 passed in `npm run test:db`.
   - Payout synchronization suite: 23/23 passed in `test-payout-sync.mjs`.
   - PostgreSQL concurrency suite: passed with 10 concurrent connections and opposing reassignment.
   - Financial runway engine: 66/66 passed in `runTests.ts`.
   - Currency parser & date tests: 12/12 passed.
   - Frontend production build (`tsc -b && vite build`): built cleanly in 1.61s with zero type errors.

## Artifacts Produced / Modified
- `frontend/src/services/data.ts`
- `frontend/src/services/__tests__/mockSupabase.ts`
- `frontend/src/services/__tests__/mockLoader.mjs`
- `frontend/src/services/__tests__/idempotentRetry.test.ts`
- `backend/scripts/test-payout-sync.mjs`
- `.planning/phases/05-payout-synchronization-hardening/05-02-PLAN.md`
- `.planning/phases/05-payout-synchronization-hardening/05-02-SUMMARY.md`
