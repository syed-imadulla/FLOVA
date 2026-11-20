---
status: human_needed
phase: 04-runway-feed
source:
  - .planning/phases/04-runway-feed/04-01-SUMMARY.md
started: 2026-11-20T21:00:00Z
updated: 2026-11-20T21:18:00Z
---

## Current Test

Scenario B: Live Browser User Acceptance Testing (Pending M1 confirmation)

## Automated Pre-Checks & Unit/Integration Tests

### 1. Frontend Build
command: cd frontend && npm run build
result: pass
details: Vite production build succeeded with 0 TypeScript/compilation errors in 1.84s.

### 2. M3 Engine Core Test Suite
command: node --experimental-strip-types --no-warnings --experimental-loader ./src/engine/__tests__/loader.mjs src/engine/__tests__/runTests.ts
result: pass
details: 56/56 tests passed (35 baseline suite + 21 lifecycle regression suite).

### 3. Currency Parser Unit Tests
command: node --experimental-strip-types --no-warnings --experimental-loader ./src/engine/__tests__/loader.mjs src/profile/__tests__/parseRupees.test.ts
result: pass
details: 10/10 tests passed.

### 4. Local Date Formatting Unit Tests
command: node --experimental-strip-types --no-warnings --experimental-loader ./src/engine/__tests__/loader.mjs src/data/__tests__/dates.test.ts
result: pass
details: 2/2 tests passed.

### 5. Database Test Suite
command: cd backend && npm run test:db
result: pass
details: 22/22 checks passed (migrations, RLS policies, payout triggers).

### 6. Live RLS Test Suite
command: cd backend && npm run test:rls-live
result: pass
details: All 8 live RLS checks passed against live Supabase instance.

---

## Scenario A: Fixed Ravi Fixture (Automated Integration Test)

File: `frontend/src/runway/__tests__/ravi.test.ts`  
Command: `node --experimental-strip-types --no-warnings --experimental-loader ./src/engine/__tests__/loader.mjs src/runway/__tests__/ravi.test.ts`  
Result: **PASS (6/6 assertions)**

### 1. Baseline Balance Calculation
expected: Opening check-in: Cash ₹1,500 + Bank ₹2,500 - COD ₹600 = ₹3,400 confirmed available.
result: pass
details: Verified `confirmedBalancePaise === 340000`, `custodialOwedPaise === 60000`.

### 2. Transaction Deductions
expected: Recent expense ₹120 fuel (Work) recorded after check-in timestamp deducted immediately: ₹3,400 - ₹120 = ₹3,280.
result: pass
details: Verified `confirmedBalancePaise === 328000`.

### 3. Daily Essential Living & Work Outflows
expected: Profile rates of ₹100/day living + ₹200/day work = ₹300/day essential outflow deducted each day across the horizon.
result: pass
details: Verified each projection day applies ₹300 outflow.

### 4. Upcoming Commitment Deductions
expected: ₹4,500 rent commitment due 2026-11-25 applied on that exact date.
result: pass
details: Verified projection for 2026-11-25 includes ₹4,500 commitment deduction.

### 5. Shortfall Detection & Runway Days
expected: Opening ₹3,280 minus cumulative daily burn and ₹4,500 rent hits negative on 2026-11-25, yielding exactly 4 runway days.
result: pass
details: Verified `firstShortfallDate === "2026-11-25"` and `runwayDays === 4`.

### 6. Expected Payouts Separation
expected: Scheduled payout ₹1,800 is displayed as "Expected, not counted" and strictly excluded from available balance and daily runway calculation.
result: pass
details: Verified `expectedPayouts` has 1 item for ₹1,800 and is excluded from `confirmedBalancePaise`.

---

## Scenario B: Live Date Browser Checks (Interactive / Manual)

Status: **Pending M1 Confirmation**

### Step 1: Missing Daily Estimates ("Not Enough Information")
expected: Log in to an account without daily living/work estimates. Home page displays "Not enough information yet" and lists the missing inputs with a link to Onboarding/Profile.
result: pending

### Step 2: Confirmed Available Balance Display
expected: Perform check-in (Cash ₹1,500, Bank ₹2,500, COD ₹600). Home page shows Confirmed Available Balance ₹3,400 with note "(Excludes ₹600 COD cash belonging to platform)".
result: pending

### Step 3: Same-Day Transaction Reflection
expected: Add Expense ₹120 (Work - Fuel). Return to Home; Confirmed Available Balance updates to ₹3,280 without manual page refresh.
result: pending

### Step 4: 7-Day Day-by-Day Projection Table
expected: Home shows 7-day projection starting from todayLocalISO() labelled as "(Today)". Each row displays date, daily outflow (−₹300), commitments, and projected closing balance.
result: pending

### Step 5: Upcoming Commitment Deduction
expected: Add commitment ₹4,500 (Rent) due 5 days from today. The commitment row appears in "Upcoming Commitments" and is deducted in the 7-day table on that exact date.
result: pending

### Step 6: First Shortfall Notice
expected: Shortfall banner shows warning on the exact date balance turns negative, with runway count of days before the shortfall.
result: pending

### Step 7: Expected Payouts Separated
expected: Add scheduled payout ₹1,800 due tomorrow. Displayed in separate section labelled "Expected Payouts (Expected, not counted)". Available balance and daily projections remain unchanged.
result: pending

### Step 8: Settling Payout Updates Cash Flow
expected: Go to /payouts and receive ₹1,800. Return to Home; payout disappears from "Expected Payouts", confirmed balance increases, and shortfall recalculates immediately.
result: pending

---

## Summary

total: 14 (6 automated assertions + 8 browser steps)
passed: 6 (Scenario A)
pending: 8 (Scenario B)
failed: 0
