# Phase 10 Context: Financial Activity, Money Overview & Insights

## Phase Goal
Connect FLOVA's Financial Activity and Money Overview interfaces to actual financial services (`listActivityTimeline()`) and the deterministic financial engine (`balance.ts`, `runway.ts`, `useRunway()`), providing gig and delivery workers a clear, reliable, and explainable picture of available money, cash/bank split, living/work expenses, COD liabilities, pending payouts, commitments, runway, and activity.

## Locked Architectural Decisions (From Discussion)

### 1. Routing & Screen Anchoring
- **Launcher Dashboard (`/`)**: Maintained as a clean, mobile-first quick action launcher linking directly to `/overview`, `/activity`, `/voice`, `/catch`, `/add`, `/checkin`, etc.
- **Dedicated Money Overview (`/overview`)**: Full Money Overview dashboard rendering confirmed personal liquid balance, cash vs. bank breakdown, personal living expenses, work expenses, segregated COD custodial money, expected payouts, commitments, daily budgets, runway projection, and deterministic insights.
- **Dedicated Financial Activity (`/activity`)**: Full timeline screen with deep multi-criteria filtering (date, transaction type, living vs work, category), badged timeline cards, and detail inspection. `/history` aliases to `/activity`.

### 2. Timeline Item Distinction & Expected Payouts
- `listActivityTimeline()` in `data.ts` extended to include pending/scheduled payouts (`kind: "expected_payout"`).
- Styled with neutral informative badge (`Scheduled Payout`).
- **Strictly zero balance or income impact**: Scheduled payouts are informational advisories only until settled.
- Check-ins are badged separately with cash/bank/totalPersonal snapshot details, strictly segregated from income/expenses.

### 3. Four Deterministic Financial Insights
1. **Daily Budget Burn Alert**: Flags if today's living or work expenses exceed the daily estimate (`dailyLivingEstimate` or `dailyWorkEstimate`).
2. **Runway Shortfall Countdown**: Flags upcoming deficit date and shortfall amount (e.g., Saturday −₹1,170 shortfall in Ravi's scenario).
3. **Payout-Commitment Coverage Match**: Matches upcoming platform payouts against commitments (e.g. Swiggy ₹1,800 payout on Monday covers upcoming bill).
4. **Custodial COD Liability Reminder**: Reminds worker of outstanding cash collected from customers that belongs to the platform.

### 4. Financial Safety & Truthful Uncertainty
- Zero LLM-calculated balances: calculations are 100% deterministic TypeScript integer paise arithmetic.
- Missing check-in baseline or missing daily estimates render as actionable informational notices (`"Needs check-in baseline"`), never fabricating ₹0.
- Manual usability guaranteed even if voice or vision AI services are offline.
