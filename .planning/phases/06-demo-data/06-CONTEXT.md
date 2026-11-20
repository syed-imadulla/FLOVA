# Phase 6: Support Realistic Demo Data - Context & Invariants

**Phase:** 06-demo-data
**Author:** M1 (Team Lead, Backend & Database)
**Status:** In Execution

---

## 1. Safety & Isolation Invariants
1. **User Scoping:** The seed script must be strictly isolated to the dedicated demo user's verified UUID. It must NEVER delete data by email alone or execute unscoped deletes that could affect other users.
2. **Secret Hygiene:** Service-role credentials (`SUPABASE_SERVICE_ROLE_KEY`) must remain backend-only and must NEVER enter frontend bundles or client code.
3. **Multi-Mode Execution:**
   - **Local PGlite Test Mode (`--test` / `--local`):** Executes in-memory against an isolated test database with multiple simulated users, verifying that unrelated users' records remain 100% untouched and that seeding is idempotent.
   - **Live Supabase Mode:** Uses verified demo user UUID to clean previous demo data and reseed.
4. **Deterministic Engine Verification:** The seed data must match the canonical Ravi delivery scenario and dynamically verify the projected −₹1,170 shortfall on Saturday using M3's deterministic runway engine (never hardcoded).

---

## 2. Canonical Scenario (Ravi - Delivery Partner)
- **Profile:** Work profile: `delivery`, weekly payout pattern, daily living: ₹200 (20000 paise), daily work: ₹100 (10000 paise).
- **Balance Check-in:** Cash ₹1,500, Bank ₹2,500, COD ₹600 checked at `2026-11-19T08:00:00Z`.
- **Transactions:**
  - Income: ₹650 platform earnings (`2026-11-19T10:00:00Z`).
  - Expense: ₹120 fuel Work (`2026-11-19T14:00:00Z`).
  - Pre-checkin Cash: ₹500 (`2026-11-19T06:00:00Z`) to test cutoff exclusion.
  - COD Collection: ₹400 (`not_mine`, `cod_collection`).
- **Payout:** Swiggy platform payout: ₹1,800 scheduled for `2026-11-23` (Monday).
- **Commitment:** Room rent: ₹4,500 due on `2026-11-21` (Saturday).
- **Expected Engine Outcome:** Available balance ₹3,930; Saturday closing balance −₹1,170.
