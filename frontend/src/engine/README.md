# FLOVA Financial Engine (M3)

The FLOVA Financial Engine is a pure, deterministic TypeScript library that computes confirmed liquid balances and day-by-day cash flow runway projections for blue-collar gig and platform workers.

## Architectural Principles

1. **Zero External Dependencies**: Independent of React, Supabase, network fetch, DOM, and Gemini APIs.
2. **Integer Paise Precision**: All monetary values are strictly represented and calculated in integer paise (`Paise = number`, non-negative safe integers). Fractional rupees are never used in calculation.
3. **Confirmed Reality vs Speculation**:
   - Only confirmed, received money (`ownership === "mine"`) enters available cash.
   - Expected, scheduled, estimated, and unearned payouts are strictly excluded from confirmed runway.
   - Cash on Delivery (COD) collections belong to the platform (`ownership === "not_mine"`) and are tracked as custodial liability, never as personal available cash.
4. **Honest Uncertainty**:
   - If a baseline balance check-in is missing, returns `INSUFFICIENT_INFORMATION`.
   - If daily living or work estimates are null, returns `INSUFFICIENT_INFORMATION` (never assumes ₹0).

---

## Option A: Remaining Daily Budget Logic

### Problem Addressed
When a worker performs a balance check-in today and records individual expenses today (e.g. ₹120 fuel), those expenses adjust the **confirmed available balance** (via `calculateConfirmedBalance`). If the Day 0 projection were to deduct a full day of baseline daily expenses (`dailyLivingEstimate + dailyWorkEstimate`), the recorded expenses would be double-counted.

### Calculation Semantics (Option A)

For the current projection date (`startDate`, Day 0):

```ts
remainingLiving = Math.max(0, dailyLivingEstimate - livingExpensesSpentToday);
remainingWork = Math.max(0, dailyWorkEstimate - workExpensesSpentToday);
remainingDailyBudget = remainingLiving + remainingWork;
```

#### Key Rules:
- **Category Separation**: Living and work expenses are tracked and consumed independently against their respective daily estimates.
- **Own Expenses Only**: Only transactions with `ownership === "mine"` and `type === "expense"` consume the daily budget.
- **Date Matching**: Only expenses occurring on the current projection date (`tx.date === startDate`) consume today's budget.
- **Check-in Timing**: Expenses occurring on `startDate` consume today's budget even if recorded before check-in (since they reflect consumption of today's allocation), but only expenses with `createdAt > checkedAt` adjust the confirmed check-in balance.
- **Non-Negative Floor**: Remaining category budgets cannot drop below zero (`Math.max(0, ...)`). Overspending in one category does not generate negative budgets or deplete the other category.
- **Future Days**: Tomorrow and all subsequent days (`d > 0`) apply the full daily living and work baseline estimates (`dailyLivingEstimate + dailyWorkEstimate`).

---

## Historical Ravi Fixture Preservation

The historical Ravi benchmark uses:
- **Check-in**: Thursday, 19 Nov 2026 (Cash ₹1,500, Bank ₹2,500, COD ₹600). Starting personal = ₹3,400.
- **Transactions on Thursday**: Income ₹650 (at 12:00), Fuel expense ₹120 (at 14:00, Work).
- **Estimates**: Living ₹200/day, Work ₹100/day.
- **Commitments**: Rent ₹4,500 due Saturday, 21 Nov 2026.
- **Payout**: ₹1,800 scheduled Monday, 23 Nov 2026 (excluded).
- **Projection Start**: Friday, 20 Nov 2026.

### Results:
- **Confirmed Balance**: ₹3,930 (393,000 paise).
- **Friday Closing (Day 0)**: ₹3,630 (363,000 paise). The Thursday ₹120 fuel expense occurred on Thursday, so Friday's spent budget is ₹0 and the full ₹300 daily burn applies.
- **Saturday Closing (Day 1)**: −₹1,170 (−117,000 paise) after ₹300 daily burn and ₹4,500 rent.
- **First Shortfall Date**: Saturday, 21 Nov 2026.
- **Monday Payout**: Excluded from confirmed runway.

---

## Test Execution

Run the complete M3 test suite:
```bash
cd frontend && node --experimental-strip-types --no-warnings --experimental-loader ./src/engine/__tests__/loader.mjs src/engine/__tests__/runTests.ts
```
