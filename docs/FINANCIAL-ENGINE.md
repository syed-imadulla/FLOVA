# FLOVA: Deterministic Financial Engine & Invariants

## 1. Principles & Mathematical Invariants

All authoritative financial math is implemented in deterministic TypeScript (`frontend/src/engine/`). Key invariants:

1. **Integer Paise Representation:** All money amounts inside the application engine are stored and computed as integer paise (`1 Rupee = 100 Paise`). Floating-point arithmetic (`0.1 + 0.2 != 0.3`) is strictly prohibited.
2. **Zero Hallucinated Balances:** LLMs are never permitted to calculate balances, project runways, or determine daily limit availability.
3. **Canonical Conversion (`lib/money.ts`):**
   - `toPaise("300.50")` $\rightarrow$ `30050` (integer).
   - `formatINR(30050)` $\rightarrow$ `"₹300.50"`.

---

## 2. Confirmed Balance Formula

The available cash baseline is calculated in `frontend/src/engine/balance.ts`:

$$\text{Available Personal Cash} = (\text{Confirmed Personal Income} - \text{Confirmed Expenses}) + (\text{Cash in Hand} + \text{Bank Balance})$$

### Inclusion & Segregation Rules
- **Custodial Money (`ownership = 'not_mine'`):** Cash on Delivery (COD) collections or company handovers are isolated into `not_mine_amount`. They are never counted toward personal income or personal spendable runway.
- **Expected Payouts (`expected_payout`):** Future gig platform payouts (e.g. Swiggy/Zomato Wednesday payouts) are tracked as receivables; they are excluded from the current available cash balance until explicitly confirmed as received.
- **Cancelled/Failed Transactions:** Excluded from calculations.

---

## 3. The ₹10,00,000 Safeguard Limit

Enforced both in database trigger `enforce_daily_transaction_limit()` and frontend validation `parseRupees()`:
1. **Maximum Individual Transaction:** ₹10,00,000 (100,000,000 paise).
2. **Maximum Aggregate Transaction Amount per India Calendar Day:** ₹10,00,000 (100,000,000 paise).
   - Evaluated using `Asia/Kolkata` local calendar days (`transaction_date`).
   - Third-party funds (`ownership = 'not_mine'`) do not count against personal spending limits.
   - Concurrency-safe: Database trigger acquires row-level locks on the user profile during transaction insert to prevent race condition bypasses.

---

## 4. Ravi Delivery Fixture Integration

The canonical benchmark scenario (`frontend/src/runway/__tests__/ravi.test.ts`):
- Initial Available Balance: ₹3,930 (393,000 paise).
- Friday 2026-11-20 Closing Balance: ₹3,630 (363,000 paise).
- Saturday 2026-11-21 Projected Balance: −₹1,170 (−117,000 paise).
- **First Shortfall Date:** Saturday 2026-11-21.
- Monday expected payout of ₹1,800 is strictly excluded from Friday/Saturday cash flow, demonstrating truthful shortfall communication.
