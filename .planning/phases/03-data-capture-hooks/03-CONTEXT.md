# Phase 3 Context: Data Capture Hooks & Mutation Services

**Phase:** 03-data-capture-hooks  
**Status:** Completed  
**Decisions Covered:** D-00 through D-06

## Decisions
- **D-00:** Fixed `ProfileProvider.tsx` to depend on `user?.id` (not the user object reference) and preserve current profile visible during reload.
- **D-01:** Currency validation via `parseOptionalRupees` and `parseRequiredRupees` in integer paise.
- **D-02:** Built `DataVersionProvider` context with reactive `bump()` state synchronization across all hooks.
- **D-03:** Built data hooks: `useLatestCheckin`, `useTransactions`, `usePayouts`, `useCommitments`, and `todayLocalISO` in `frontend/src/data/`.
- **D-04:** Built 5 unstyled semantic pages in `frontend/src/pages/`: `CheckinPage`, `AddTransactionPage`, `PayoutsPage`, `CommitmentsPage`, `HistoryPage`.
- **D-05:** Wired routes in `App.tsx` and updated `HomePlaceholder.tsx` with links and latest balance check-in summary.
- **D-06:** Added unit tests in `dates.test.ts` and extended `parseRupees.test.ts`. Documented hooks in `docs/CONTRACT.md`.
