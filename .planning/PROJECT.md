# FLOVA (Udaan 2.0)

## What This Is

FLOVA is an adaptive financial runway planner built specifically for gig workers (delivery riders, drivers, service professionals, and freelancers). It directly answers the worker's most critical daily question: **"Will my available money last until my next payout?"** By combining actual balance check-ins, real-time transaction tracking, pending commitments, and scheduled payouts with a deterministic runway calculation, FLOVA provides workers with clear runway projections, identifies lean weeks in advance, and helps prevent predatory debt traps without false assumptions.

## Core Value

Provide a reliable, decimal-safe, and truthful answer to "Will my available money last until my next payout?" — guaranteeing that pending, unearned, or third-party (COD) funds never artificially inflate available cash, and communicating uncertainty whenever data is missing rather than defaulting to zero.

## Business & Problem Context

- **Target User**: Gig economy delivery riders and irregular income earners with uneven payout cycles.
- **Problem**: In lean weeks or between payout cycles, workers often turn to high-interest informal loans (e.g. 5%/month) even when average earnings cover essential needs, because timing mismatches cause sudden cash crunches.
- **Solution**: Cash-first runway planning that separates confirmed money from expected payouts and non-owned funds (COD), projecting financial runway and surplus/shortfall dates.
- **Repository**: `github.com/syed-imadulla/Udaan-2.0`
- **Owner for this workstream (M1)**: Team Lead, Backend & Database.

## Team Ownership & Boundaries

| Member | Area | Branch | Owned Directories & Responsibilities |
|---|---|---|---|
| **M1 (Lead)** | Backend, DB, Contracts, Auth wiring, Deployment | `feature/backend` | `backend/`, `frontend/src/{lib,services,types}`, `docs/`, auth wiring, deployment |
| **M2** | Frontend & UI/UX | `feature/frontend` | `frontend/src/components/`, `frontend/src/pages/`, styling & visual presentation |
| **M3** | AI/ML & Runway Engine | `feature/ai-engine` | `frontend/src/engine/` (TypeScript engine), `ai-engine/` (simulation prototype) |
| **M4** | Integration & QA | `feature/integration` | `frontend/src/features/`, integration tests, verification |

*M1 rule: Do not restyle M2's screens; build robust hooks, state management, and minimal working unstyled screens for M2 to restyle.*

## Technical Environment & Architecture

- **Frontend**: React 18.3.1, Vite 5.4.11, TypeScript 5.6.3, Tailwind CSS (Single Page App).
- **Backend & Database**: Supabase Auth (GoTrue) + PostgreSQL 15+ with strict Row Level Security (RLS) on all user tables.
- **Data Contract**: PostgREST tables mirrored 1:1 in `frontend/src/types/contracts.ts` and `docs/CONTRACT.md`.
- **Currency Engine**: Integer paise in application code and TypeScript engine via `frontend/src/lib/money.ts`; `numeric(12,2)` in PostgreSQL. No floating-point math.
- **Local DB Verification**: `@electric-sql/pglite` 0.5.17 in-memory WASM Postgres runner (`backend/scripts/test-db.mjs`) executing 22 schema, constraint, and RLS tests.
- **AI Integration (Phase 5 Stretch)**: Secure Vercel serverless function proxying Google Gemini API with JSON validation and user approval.
- **Hosting & Deployment**: Vercel (frontend & serverless functions) + Supabase (Auth & Postgres).
- **Architecture Knowledge Graph**: Graphify 0.9.92 (`graphify-out/`).

## Requirements

### Validated (Already Shipped in Init Schema)

- ✓ Database schema with 5 core tables (`profiles`, `balance_checkins`, `payouts`, `transactions`, `commitments`) — `backend/supabase/migrations/20261120000100_init_schema.sql`
- ✓ RLS policies isolating every row to `auth.uid()` with public anon access completely revoked
- ✓ Automatic profile creation trigger `on_auth_user_created` upon Supabase user sign-up
- ✓ Database trigger `transactions_payout_sync` automatically synchronizing `payouts.received_amount` and status (`partial`, `settled`) on linked income transactions
- ✓ Trigger protection `payouts_guard_received` preventing direct edits to `payouts.received_amount`
- ✓ Check constraints enforcing `expense_type_rule` (living vs work), `not_mine_within_total`, and positive amounts
- ✓ Decimal-safe money parsing and formatting library (`toPaise`, `toPaiseOrNull`, `paiseToRupeeString`, `formatINR`) in `frontend/src/lib/money.ts`
- ✓ Supabase client with truthful error handling in `frontend/src/lib/supabase.ts`
- ✓ Full data service functions with paise conversion and `loadRunwayInput()` in `frontend/src/services/data.ts`
- ✓ 22 passing tests in local PGlite WASM test runner (`backend/scripts/test-db.mjs`)

### Active (M1 Roadmap Scope)

- [ ] **Phase 1: Auth flow** — `AuthProvider` + `useSession`, route guards, minimal login/sign-up/logout screens.
- [ ] **Phase 2: Profile & onboarding data** — `useProfile` hook, persist onboarding fields, route by `onboarding_completed`.
- [ ] **Phase 3: Data capture hooks** — Check-ins, transactions, payouts (`receivePayout`), commitments, edit/delete history, error states.
- [ ] **Phase 4: Runway feed** — Wire `loadRunwayInput()` to M3's engine interface, enforce same-day check-in rule, pass Ravi fixture test (−₹1,170 on Saturday).
- [ ] **Phase 5: Secure AI function (stretch)** — Vercel server-side Gemini function, JSON validation, rate limits, user confirmation modal.
- [ ] **Phase 6: Demo data** — Local seed/reset script for fictional demo account using service-role key (never bundled in client).
- [ ] **Phase 7: Deployment** — Vercel project configuration, environment variables, Supabase auth redirects, production smoke test.
- [ ] **Phase 8: Verify & freeze** — Quality gates verification from master plan, merge `dev` into `main`, tag release.

### Out of Scope

- Direct visual styling of M2's screens — M1 delivers hooks and clean minimal working components for M2 to style.
- Offline caching / local storage persistence claiming data is saved when offline — show real network errors truthfully.
- Client-side Gemini API calls or exposing `service_role` / `GEMINI_API_KEY` in `VITE_` variables.
- Direct manipulation of `payouts.received_amount` (owned by DB triggers).
- Treating pending, scheduled, estimated, or unearned payouts or COD (`not_mine`) cash as confirmed available money.

## Constraints & Rules for Every Phase

- **Branching & PRs**: Work strictly on branch `feature/backend`; target pull requests into `dev`. Never push directly to `main`.
- **Paise Currency**: Money is strictly integer paise via `frontend/src/lib/money.ts`. Never use JavaScript float calculations.
- **Never Send user_id**: Never include `user_id` in client payloads; Supabase Auth and PostgreSQL RLS supply and check `auth.uid()`.
- **Available Cash Rule**: Pending/scheduled/estimated/unearned payouts and COD money (`not_mine`) never count as available cash.
- **Uncertainty Principle**: Missing data (null daily living/work estimates, missing check-ins) must display as "not enough information", never 0.
- **Schema Changes**: Only via new versioned migration in `backend/supabase/migrations/`, mirrored in `contracts.ts` and `docs/CONTRACT.md`, with `test-db.mjs` updated and passing.
- **Secret Hygiene**: Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` allowed in client code.
- **Graphify Protocol**:
  - Before planning: `git pull origin dev`, `graphify update .`, `graphify query / explain` for touched code.
  - After execution: `graphify update .`, commit `graphify-out/` with code (never `.env` files).
- **Pre-Shipping Gates**: `cd frontend && npm run build; cd backend && npm run test:db`.

## Key Decisions Log

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Integer paise for all money | Prevents floating-point currency drift across engine and database | ✓ Good |
| PGlite for local DB tests | Real Postgres execution in WASM without needing Docker or network credentials | ✓ Good |
| Trigger-synced payout receipts | Prevents double-counting between income transactions and payouts | ✓ Good |
| M1 builds hooks & minimal screens | Clean team separation: M1 provides functional contracts, M2 provides visual polish | — Pending |
| Work on `feature/backend` -> `dev` | Protects `dev` integration stability and keeps release candidate clean | — Pending |

---
*Last updated: 2026-11-20 after brownfield onboarding*
