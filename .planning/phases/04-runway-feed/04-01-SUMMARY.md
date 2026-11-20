# Phase 4: Runway Feed Summary

**Plan:** 04-01  
**Status:** Completed  
**Branch:** `feature/backend`

## Key Accomplishments
- Implemented `adapter.ts` (`processRunwayFeed`) converting `RunwayInput` from `loadRunwayInput()` into M3's engine projection format without modifying M3 engine files.
- Implemented `useRunway.ts` hook subscribing to `DataVersionProvider` to automatically recalculate confirmed runway whenever any checkin, transaction, commitment, or payout updates.
- Built `ravi.test.ts` integration test verifying exact expected metrics:
  - Thursday check-in + income − petrol = ₹3,930 available.
  - Friday closing balance = ₹3,630.
  - Saturday projected closing balance = −₹1,170.
  - First shortfall date = Saturday 2026-11-21.
  - Monday expected payout strictly excluded from projection.
- Integrated Runway Dashboard into `HomePlaceholder.tsx`:
  - Confirmed available balance (excludes COD custodial money).
  - Shortfall alert and covered runway days count.
  - Day-by-day 7-day cash flow projection table.
  - "Not enough information yet" banner with actionable links when inputs are missing.
  - Upcoming commitments list.
  - Expected payouts section clearly labelled "(Expected, not counted)".
