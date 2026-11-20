# Phase 10 User Acceptance Testing (UAT)

## Scenario 1: Money Overview 10-Pillar Inspection
- **Action**: Worker signs in and navigates to `/overview`.
- **Expected**:
  - Hero card displays confirmed liquid personal balance (e.g., ₹3,930 in Ravi canonical scenario).
  - Cash and bank balance breakdown displayed cleanly.
  - Distinct summaries for Income, Living Expenses, Work Expenses, Custodial COD, Scheduled Payouts, and Commitments.
  - Runway outlook card displays estimated days and flags Saturday shortfall if projected.
  - Embedded recent activity list shows latest 4 entries with a "View Full Timeline →" link.
- **Verification**: Verified via `activityAndOverview.test.ts` Tests 1–6 and `MoneyOverviewPage.tsx`.

## Scenario 2: Deterministic Insights Evaluation
- **Action**: Worker visits `/overview` with an active budget burn, impending shortfall, or custodial COD cash held.
- **Expected**:
  - Budget Burn Insight: Alerts if today's work or living spend exceeds daily baseline estimate.
  - Shortfall Countdown: Accurately projects shortfall date and deficit amount.
  - Payout Coverage: Accurately matches scheduled payout against an upcoming commitment.
  - Custodial COD Reminder: Displays outstanding customer cash held for platform remittance.
- **Verification**: Verified via `activityAndOverview.test.ts` Tests 7–10 and `insights.ts`.

## Scenario 3: Financial Activity Filtering & Badging
- **Action**: Worker navigates to `/activity` and filters by Type (Living, Work, Check-in, Expected Payout, COD) and Time Range.
- **Expected**:
  - Filter controls update the activity stream instantly without page reload.
  - Living expenses display red `− ₹X` with `[Living Expense]` badge.
  - Work expenses display blue `− ₹X` with `[Work Expense]` badge.
  - Check-ins display `[Balance Check-in]` card with cash, bank, and net personal snapshot.
  - Scheduled payouts display `[Scheduled Payout]` card with expected arrival date and zero balance/income impact.
  - Custodial collections display `[Custodial COD (Not Mine)]` badge.
- **Verification**: Verified via `activityAndOverview.test.ts` Tests 1–5 and `ActivityPage.tsx`.

## Scenario 4: Truthful Uncertainty Handling
- **Action**: Worker visits `/overview` without completing a balance check-in or daily estimates.
- **Expected**:
  - Hero balance displays an actionable notice: "Baseline Needed" with a link to `/checkin`.
  - Runway card displays an informative box listing missing inputs rather than fabricating numbers.
- **Verification**: Verified via `activityAndOverview.test.ts` Test 11.
