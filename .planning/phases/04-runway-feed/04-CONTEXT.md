# Phase 4 Context: Runway Feed & Engine Integration

**Phase:** 04-runway-feed  
**Status:** In Progress  
**Decisions Covered:** D-01 through D-08

## Decisions
- **D-01:** M1 owns integration code; M3 owns `frontend/src/engine/`. Do not modify files in `frontend/src/engine/`.
- **D-02:** Build adapter in `frontend/src/runway/adapter.ts` and hook `useRunway.ts` consuming `loadRunwayInput()` from `frontend/src/services/data.ts` and recalculating when `DataVersionProvider` changes.
- **D-03:** Embed runway dashboard section directly on the Home route (`HomePlaceholder.tsx`).
- **D-04:** Display: Confirmed available balance, 7-day day-by-day projection, first shortfall date, "Not enough information yet" with missing inputs list when incomplete, upcoming commitments, and expected payouts labelled "Expected, not counted".
- **D-05:** Strict money rules: expected payouts NEVER increase confirmed balance; only received own income counts (`not_mine` excluded); no double counting of `payouts.received_amount`; start from latest check-in `cash + bank - notMine`; `created_at > checked_at` timestamp cutoff rule enforced.
- **D-06:** Daily living/work estimates deducted per day. Null = insufficient info, never 0. Commitments deducted once on due date.
- **D-07:** Implement Ravi fixture integration test in `frontend/src/runway/__tests__/ravi.test.ts` verifying: Thursday check-in ₹3,400 + ₹650 - ₹120 = ₹3,930 available, Friday closing ₹3,630, Saturday projected −₹1,170 with shortfall on Saturday 2026-11-21, Monday payout not counted.
- **D-08:** Zero new dependencies, no schema changes.
