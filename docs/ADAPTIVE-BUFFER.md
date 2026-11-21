# FLOVA: Adaptive Safety Buffer & Runway Engine

## 1. The Irregular Income Challenge
Gig workers experience high income volatility across weeks (e.g. ₹7,200 during festival rush vs ₹2,800 during post-holiday slowdown or monsoons). Traditional fixed budgets fail because expenses remain constant while revenue fluctuates.

---

## 2. Adaptive Safety Cushion Formulation

The runway engine (`frontend/src/engine/safeBuffer.ts`) computes an adaptive safety buffer:

$$\text{Daily Burn} = \text{Daily Living Estimate} + \text{Daily Work Estimate}$$
$$\text{Recommended Buffer Amount} = \text{Daily Burn} \times \text{Buffer Days}$$

Where:
- **`Buffer Days`**: Defaults to 3 to 7 days, scaling up to 14–21 days depending on user profile:
  - `income_variability = 'regular'`: 3–5 days buffer.
  - `income_variability = 'variable'`: 7–10 days buffer.
  - `income_variability = 'unpredictable'`: 14–21 days buffer.

---

## 3. Runway & Shortfall Detection

The runway engine projects daily closing balances across a forward 30-day horizon:

1. **First Buffer Shortfall Date:** The day the projected cash balance drops below the recommended safety buffer. Alerts the user to moderate discretionary spending before essential funds are threatened.
2. **First Actual Deficit Date:** The day the cash balance drops below zero ($< 0$), indicating an imminent need for emergency borrowing.
3. **Commitment Matching:** Fixed upcoming obligations (rent, EMI, bike insurance) are matched against scheduled platform payouts to compute net surplus or deficit.

---

## 4. WISH 2.0 Goal Persistence

WISH 2.0 (`frontend/src/wish/`) allows workers to build savings for micro-goals (emergency buffer, festival savings, new smartphone, vehicle repairs):
- Stored persistently in PostgreSQL tables `wish_goals` and `wish_contributions`.
- Automatic migration from legacy `localStorage` on initial sign-in.
- Supports surplus allocations: when week earnings exceed the self-salary baseline, recommended contributions automatically fund the active WISH goal.
