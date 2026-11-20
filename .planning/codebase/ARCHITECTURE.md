---
last_mapped_commit: d8cfbb2900c410e8e3cca70f6675fa2b766588e0
last_mapped_at: 2026-11-20
---
<!-- refreshed: 2026-11-20 -->

# Architecture

**Analysis Date:** 2026-11-20

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      Frontend UI (M2)                       │
│    `frontend/src/components/`, `frontend/src/pages/`        │
├──────────────────────────────┬──────────────────────────────┤
│      Auth & Session Hooks    │     Runway Planner Hooks     │
│       `useSession`, etc.     │    `useProfile`, data hooks  │
└──────────────┬───────────────┴──────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Services & Contract Layer                  │
│  `frontend/src/services/auth.ts`, `data.ts`                 │
│  `frontend/src/types/contracts.ts`, `frontend/src/lib/`     │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐┌─────────────────────────────┐
│  M3 Runway Engine (TS/Paise) ││  PostgreSQL / Supabase (M1) │
│  `frontend/src/engine/`      ││  RLS, Constraints, Triggers │
│  Deterministic Runway Calc   ││  `backend/supabase/`        │
└──────────────────────────────┘└─────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Contract & Types | Shared data contract, interfaces, enums, money types | `frontend/src/types/contracts.ts` |
| Money Library | Integer paise conversions, INR formatting, decimal safety | `frontend/src/lib/money.ts` |
| Supabase Client | Supabase client initialization, unwrap error helper | `frontend/src/lib/supabase.ts` |
| Auth Service | Sign-up, sign-in, sign-out, session subscription | `frontend/src/services/auth.ts` |
| Data Service | CRUD for profiles, check-ins, transactions, payouts, commitments, `loadRunwayInput` | `frontend/src/services/data.ts` |
| Database Schema | PostgreSQL schema, RLS policies, trigger-based payout synchronization | `backend/supabase/migrations/20261120000100_init_schema.sql` |
| Test Harness | PGlite in-memory Postgres test suite validating schema, RLS, and constraints | `backend/scripts/test-db.mjs` |
| UI Views (M2) | User screens, views, dashboard, check-in forms | `frontend/src/components/`, `frontend/src/pages/` |
| Runway Engine (M3) | Deterministic forward runway calculation, buffer projection | `frontend/src/engine/` |

## Pattern Overview

**Overall:** Client-Centric Jamstack with Backend-as-a-Service (Supabase) and Deterministic Client Engine

**Key Characteristics:**

- **Zero float currency mathematics:** Database stores `numeric(12,2)` rupees, client converts via `toPaise()` to integer paise before arithmetic.
- **Session-bound RLS security:** Database automatically infers `user_id` from `auth.uid()`; client never transmits `user_id`.
- **Single-source income & payout synchronization:** Payouts mirror received transactions through database trigger `transactions_payout_sync`; direct edits to `payouts.received_amount` are blocked.
- **Truthful state:** Missing estimates or check-ins produce "uncertainty / not enough information", never false zeros.

## Layers

**UI Layer (`frontend/src/components/`, `frontend/src/pages/`):**

- Purpose: Render views, capture check-ins, show runway warnings and plan details.
- Depends on: Hooks layer and contract types.

**Hooks & Auth Layer (to be completed in Phases 1-3):**

- Purpose: React state management for session (`useSession`), profile (`useProfile`), and data mutations.
- Depends on: Services layer.

**Services & Contract Layer (`frontend/src/services/`, `frontend/src/lib/`, `frontend/src/types/`):**

- Purpose: Encapsulate Supabase API interactions, type transformations, and error handling.
- Depends on: `@supabase/supabase-js`, `contracts.ts`, `money.ts`.

**Database Layer (`backend/supabase/migrations/`):**

- Purpose: Data integrity, relational constraints, Row Level Security, auto-profile creation, payout synchronization triggers.

## Data Flow

### Primary Runway Feed Path

1. User logs in; `useSession` provides active Supabase session.
2. App invokes `loadRunwayInput()` in `frontend/src/services/data.ts`.
3. Parallel queries retrieve `getMyProfile()`, `getLatestCheckin()`, `transactions` since latest check-in, active `payouts`, and upcoming `commitments`.
4. Values are converted from database rupees to integer paise using `toPaise()` and `toPaiseOrNull()`.
5. M3's runway engine consumes `RunwayInput`:
   - Starting balance = `cash + bank - notMine`.
   - Transactions on check-in day filtered by `createdAt > checkedAt`.
   - Daily living & work estimates deducted per day.
   - Commitments deducted on due dates.
   - Payout receipts already tracked as income (never double-counted).
6. Engine emits calculated runway status (safe, shortfall, warning).

## Key Abstractions

**Paise Integer Arithmetic:**

- Purpose: Eliminate floating-point rounding errors in financial computations.
- Pattern: Conversion boundary at data layer (`toPaise`, `paiseToRupeeString`).
- Example: `frontend/src/lib/money.ts`.

**Contract Definition:**

- Purpose: Strict contract between M1 (backend), M2 (UI), M3 (engine), and M4 (QA).
- Pattern: Shared TypeScript definitions matching SQL enums and tables 1:1.
- Example: `frontend/src/types/contracts.ts` and `docs/CONTRACT.md`.

## Entry Points

**Frontend Application:**

- Location: `frontend/src/main.tsx` → `frontend/src/App.tsx`.
- Responsibilities: Render root, mount auth provider and navigation tabs.

**Database Migration:**

- Location: `backend/supabase/migrations/20261120000100_init_schema.sql`.
- Responsibilities: Initialize schema, enums, functions, triggers, and RLS policies.

**Database Test Runner:**

- Location: `backend/scripts/test-db.mjs`.
- Responsibilities: Execute migrations against PGlite and verify 22 isolation/constraint assertions.

## Architectural Constraints

- **Money representation:** Integer paise only in JavaScript/TypeScript; `numeric(12,2)` in PostgreSQL. Never use JavaScript `Number` floating-point math for currency amounts.
- **Client user_id:** Client must never pass `user_id` in insert/update payloads; Postgres defaults and policies enforce `auth.uid()`.
- **Payout updates:** Client must never update `received_amount` directly; it is maintained by triggers via linked income transactions.
- **Available cash:** Pending, scheduled, estimated, or unearned payouts and COD money (`not_mine`) must never be added to available cash.

## Error Handling

**Strategy:** Fail fast and unwrap Supabase errors cleanly.

**Patterns:**

- `unwrap<T>(result, action)` in `frontend/src/lib/supabase.ts` inspects `{ data, error }` and throws descriptive errors (`"${action} failed: ${error.message}"`).
- UI renders real errors rather than claiming offline success.

---

*Architecture analysis: 2026-11-20*
