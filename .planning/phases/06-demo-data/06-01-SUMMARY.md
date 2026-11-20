# Phase 6 Plan 01 Summary: Realistic Demo Data Seeding & Isolation

## Outcome
Implemented and verified the automated, idempotent, and isolated demo seeding script for FLOVA's canonical gig worker scenario (Ravi - Delivery Partner).

## Key Implementation Details
1. **Targeted UUID Scoping (`backend/scripts/seed-demo.mjs`)**:
   - Deletions and inserts are strictly bound to the verified `targetUserId` UUID parameter (`WHERE user_id = $1`).
   - Reverse-dependency deletion order: commitments -> transactions -> payouts -> balance_checkins.
   - Upserts profile with Ravi delivery parameters (delivery profile, weekly payout, daily living ₹200.00, daily work ₹100.00).
   - Inserts Thursday morning balance checkin (Cash ₹1,500, Bank ₹2,500, COD ₹600).
   - Inserts Monday scheduled Swiggy payout (₹1,800).
   - Inserts Saturday room rent commitment (₹4,500).
   - Inserts 4 transactions (pre-checkin cash ₹500, post-checkin income ₹650, post-checkin fuel ₹120, post-checkin customer COD ₹400).

2. **Package.json Scripts (`backend/package.json`)**:
   - `test:seed`: Automated PGlite in-memory test suite verifying isolation and deterministic engine projection.
   - `seed:demo`: Live Supabase administrative or authenticated seeding.

3. **PGlite Isolation & Runway Engine Verification**:
   - Setup unprivileged/unrelated user `22222222-2222-2222-2222-222222222222` with private transactions and commitments.
   - Verified that running `seedDemoUser` on demo UUID `11111111-1111-1111-1111-111111111111` leaves unrelated user data untouched.
   - Verified re-seeding idempotency (running twice produces identical clean row count of 4 transactions).
   - Fed seeded database rows directly into M3 deterministic runway engine:
     - Confirmed starting personal cash: ₹3,930 (393,000 paise).
     - Friday 2026-11-20 closing balance: ₹3,630 (363,000 paise).
     - Saturday 2026-11-21 first shortfall date: −₹1,170 (-117,000 paise).
     - Excluded Monday scheduled payout from cash flow projections.
   - 17/17 test assertions passed with 0 failures.
