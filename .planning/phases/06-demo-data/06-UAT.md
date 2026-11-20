# Phase 6 UAT: Realistic Demo Data Seeding & Isolation

## User Acceptance Criteria & Results

| # | Acceptance Criterion | Test Method | Result | Evidence |
|---|----------------------|-------------|--------|----------|
| UAT-6.1 | Demo seeding is strictly isolated to the verified demo user UUID. Never touches other users' data. | PGlite isolation test with unrelated user UUID and private records. | PASS | Unrelated user's 999.00 transaction and 500.00 commitment completely preserved after seeding. |
| UAT-6.2 | Seeding is idempotent and safe to re-run. | Execute `seedDemoUser()` twice sequentially on same DB. | PASS | Exact row count (4 transactions, 1 checkin, 1 payout, 1 commitment) preserved without duplicate rows. |
| UAT-6.3 | Service-role credentials remain backend-only. | Code audit of frontend vs backend. | PASS | `scripts/seed-demo.mjs` is strictly in `backend/` and invoked via node scripts. No keys leaked to frontend. |
| UAT-6.4 | Deterministic runway shortfall reproduces Saturday −₹1,170. | M3 runway engine calculation on seeded rows. | PASS | Confirmed balance ₹3,930; Friday closing ₹3,630; Saturday closing −₹1,170. No hardcoding. |
| UAT-6.5 | Monday scheduled payout is segregated and not counted as confirmed cash. | Projection verification on Monday 2026-11-23. | PASS | `otherTransactionAdjustmentPaise` is 0 on Monday; closing balance remains negative. |
