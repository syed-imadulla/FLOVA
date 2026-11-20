# FLOVA data contract (v1 · owner: M1)

This is the agreed shape of FLOVA's data. **M2, M3 and M4 build against this.** The source of truth is
`backend/supabase/migrations/20261120000100_init_schema.sql`, mirrored in `frontend/src/types/contracts.ts`.
To change a field or enum: tell M1 → new migration → update `frontend/src/types/contracts.ts` → announce in the team chat.

## Rules everyone follows

| Rule | Why |
|---|---|
| The app sends and receives money in **paise** (integers). Convert with `toPaise()` / `paiseToRupeeString()` from `frontend/src/lib/money.ts`. | The database stores `numeric(12,2)` rupees. No floating-point maths with money. |
| Never send `user_id`. The database fills it from the logged-in session. | RLS rejects any row whose `user_id` isn't the caller. |
| Use the functions in `frontend/src/services/` instead of calling `supabase.from(...)` directly. | One place for validation and error messages. |
| Show errors truthfully (`err.message`). Never pretend a save worked. | No offline saving exists. |
| Only the publishable key is allowed in `VITE_` variables. | Service-role and Gemini keys are server-side only. |

## Tables

### `profiles` (one per user, created automatically at sign-up)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | = auth user id |
| `display_name` | text, nullable | from sign-up metadata `display_name` |
| `work_profile` | enum | `delivery` (MVP) · `driver` · `service` · `freelancer` · `independent_business` |
| `payout_pattern` | enum | `daily` · `weekly` · `per_job` · `milestone` · `variable` |
| `preferred_language` | enum | `en` · `kn` · `hi` (offer kn/hi only once translations are reviewed) |
| `daily_living_estimate` | rupees, nullable | food etc. per day. **null = not given → uncertainty, never 0** |
| `daily_work_estimate` | rupees, nullable | fuel, phone etc. per day. Same null rule |
| `onboarding_completed` | boolean | M2 sets true at the end of onboarding |

### `balance_checkins` (actual cash + bank at a moment)
| Field | Type | Notes |
|---|---|---|
| `cash_amount`, `bank_amount` | rupees ≥ 0 | what the worker actually holds |
| `not_mine_amount` | rupees ≥ 0, default 0 | part of the above that belongs to others (COD for the platform). Can't exceed cash + bank |
| `checked_at` | timestamptz | the runway starts from the **latest** check-in |
| `note` | text, nullable | |

### `transactions` (money that actually moved)
| Field | Type | Notes |
|---|---|---|
| `type` | enum | `income` · `expense` |
| `amount` | rupees > 0 | always positive; `type` gives the direction |
| `category` | text | presets in `SUGGESTED_CATEGORIES` |
| `expense_type` | enum, nullable | `living` · `work`. **Required** for own expenses; must be null otherwise (DB enforces) |
| `ownership` | enum | `mine` (default) · `not_mine` |
| `payout_id` | uuid, nullable | set when own income settles (part of) a payout |
| `transaction_date` | date | defaults to today |
| `source` | text | `manual` · `voice` · `ai_suggestion` · `demo` |
| `description` | text, nullable | |

### `payouts` (money expected, **not cash until received**)
| Field | Type | Notes |
|---|---|---|
| `kind` | enum | `platform_payout` · `incentive` · `client_payment` · `advance` · `other` |
| `source` | text, nullable | platform or client name |
| `expected_amount` | rupees > 0 | |
| `received_amount` | rupees, **read-only** | sum of linked income transactions, kept by a DB trigger |
| `expected_date` | date, nullable | null = date unknown |
| `status` | enum | app sets `scheduled` · `estimated` · `unearned` · `cancelled`; the trigger sets `partial` / `settled` |

### `commitments` (bills and debts)
| Field | Type | Notes |
|---|---|---|
| `title` | text | "Rent" |
| `amount` | rupees > 0 | |
| `due_date` | date | deducted on this date, once |
| `category` | text | presets in `SUGGESTED_CATEGORIES.commitment` |
| `kind` | enum | `bill` · `debt` |
| `status` | enum | `upcoming` · `paid` · `cancelled` |

## How to record each money situation

| Situation | Record it as |
|---|---|
| Earnings received today | `transactions`: income, mine |
| Petrol / phone recharge | expense, mine, `expense_type: work` |
| Food | expense, mine, `expense_type: living` |
| Platform payout due Monday | `payouts`: scheduled, `expected_date` = Monday |
| Expected but uncertain earnings | `payouts`: estimated |
| Incentive not yet unlocked | `payouts`: kind incentive, status unearned |
| Payout arrives (full or part) | `receivePayout(payoutId, amountPaise)`: creates one income transaction linked to the payout; the trigger marks partial/settled |
| COD cash collected for the platform | income, `ownership: not_mine`, category `cod_collection` (no expense_type) |
| COD cash handed back to the platform | expense, `ownership: not_mine`, category `cod_handover` |
| COD already sitting in the wallet at check-in | `balance_checkins.not_mine_amount` |
| Rent due Saturday | `commitments`: bill, due Saturday |

Received money is recorded **once**, as a transaction. A payout only mirrors what was received, so it can't be double-counted.

## Rules for M3's runway engine (from the master plan)
- Start from the latest check-in: `cash + bank − notMine`.
- Add own income (`ownership = mine`) after the check-in. Payout receipts are already income transactions, so **don't** add `payouts.received` again.
- `not_mine` transactions change what's owed to others, not available money: collected adds to the not-mine total, handed back reduces it.
- `scheduled`, `estimated` and `unearned` payouts are never in the confirmed runway. Only their unreceived part (`expected − received`) may appear in a separate, labelled scenario.
- Deduct daily living + work estimates per day and each commitment on its `due_date`, once.
- A null daily estimate or no check-in → "Insufficient information", never 0.
- Transactions on the check-in day: count only rows with `createdAt > checkedAt`, so nothing in the check-in is counted twice.

## Service functions (`frontend/src/services/`)
| Area | Functions |
|---|---|
| Auth (`auth.ts`) | `signUp(email, password, displayName?)` · `signIn` · `signOut` · `getSession` · `onAuthChange(cb)` |
| Profile | `getMyProfile()` · `updateMyProfile(userId, patch)` |
| Check-ins | `addCheckin({cash, bank, notMine?})` · `getLatestCheckin()` |
| Transactions | `addTransaction(t)` · `listTransactions({from,to,limit})` · `updateTransaction(id, t)` · `deleteTransaction(id)` |
| Payouts | `addPayout(p)` · `listPayouts()` · `receivePayout(id, amount, date?)` · `setPayoutStatus(id, status)` |
| Commitments | `addCommitment(c)` · `listCommitments(status)` · `setCommitmentStatus(id, status)` |
| Engine feed | `loadRunwayInput()` → `RunwayInput` (all paise, nulls kept) |

All amounts passed to these functions are **paise**.
