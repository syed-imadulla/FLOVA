# Roadmap: FLOVA (M1 Backend & Database)

## Overview

This roadmap defines the 8 sequential execution phases for M1 (Team Lead, Backend & Database) on FLOVA. The roadmap builds the complete authentication lifecycle, user profile and onboarding persistence, reactive data capture hooks for check-ins, transactions, payouts, and commitments, the runway engine data feed with the Ravi test fixture, secure serverless AI integration, local demo seeding, Vercel deployment, and the final verification release freeze.

Work is executed exclusively on branch `feature/backend` and shipped as pull requests into `dev`.

## Phases

- [x] **Phase 1: Auth flow** - AuthProvider + useSession, protected routes, minimal login/sign-up/logout screens. (Completed 2026-11-20)
- [ ] **Phase 2: Profile & onboarding data** - useProfile hook, save onboarding fields, route by onboarding_completed.
- [ ] **Phase 3: Data capture hooks** - Check-ins, transactions, payouts (receivePayout), commitments, history edit/delete, error states.
- [ ] **Phase 4: Runway feed** - Wire loadRunwayInput() to M3's engine interface, same-day check-in rule, Ravi fixture test (expect −₹1,170 on Saturday).
- [ ] **Phase 5: Secure AI function (stretch)** - Vercel server-side Gemini function; JSON validation, limits, user confirmation before saving.
- [ ] **Phase 6: Demo data** - Local seed/reset script for a fictional demo account using the service-role key (never shipped).
- [ ] **Phase 7: Deployment** - Vercel project, env vars, Supabase auth redirect URLs, production smoke test.
- [ ] **Phase 8: Verify & freeze** - Quality gates from the master plan, merge dev into main, tag release.

## Phase Details

### Phase 1: Auth flow
**Goal**: Establish client-side Supabase authentication with reactive session state, route protection, and minimal unstyled auth UI screens.
**Depends on**: Initial schema and auth services already validated in `frontend/src/services/auth.ts`.
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. `AuthProvider` wraps the React tree and provides current session and user state via `useSession()`.
  2. Unauthenticated visitors navigating to protected application routes are redirected to `/login`.
  3. User can sign up with email, password, and optional display name, auto-creating a profile row in Supabase.
  4. User can sign in, persist session across browser reloads, and sign out cleanly.
**Plans**: 1 plan

Plans:
- [x] 01-01: Build `AuthContext`, `useSession` hook, protected route wrapper, and minimal login/sign-up/logout screens. (Completed 2026-11-20)

### Phase 2: Profile & onboarding data
**Goal**: Deliver reactive profile management hook (`useProfile`), persist worker profile attributes and daily expense estimates in integer paise, and route users based on onboarding completion status.
**Depends on**: Phase 1
**Requirements**: PROF-01, PROF-02, PROF-03
**Success Criteria** (what must be TRUE):
  1. `useProfile()` retrieves the signed-in user's profile and provides an updater for partial profile fields.
  2. Onboarding data updates persist `work_profile`, `payout_pattern`, `preferred_language`, and daily living/work estimates in paise (keeping null when omitted).
  3. Application router redirects users with `onboarding_completed: false` to onboarding, and `onboarding_completed: true` to the main planner.
**Plans**: 1 plan

Plans:
- [ ] 02-01: Implement `useProfile` hook, onboarding form data persistence, and onboarding routing guard.

### Phase 3: Data capture hooks
**Goal**: Build React mutation and query hooks for balance check-ins, income and expense transactions, payout receipts (`receivePayout`), commitments, and history management with truthful error handling.
**Depends on**: Phase 2
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06
**Success Criteria** (what must be TRUE):
  1. Worker can record a balance check-in with cash, bank, and COD (`not_mine`) amounts in integer paise.
  2. Worker can add, edit, and delete transactions with required living/work classification for own expenses.
  3. Recording money received against a payout via `receivePayout()` creates an income transaction and triggers automatic database payout settlement status.
  4. Worker can add, list, and update upcoming commitments (bills/debts).
  5. Network and validation errors are surfaced truthfully via unwrap without silent masking.
**Plans**: 1 plan

Plans:
- [ ] 03-01: Build `useCheckin`, `useTransactions`, `usePayouts`, and `useCommitments` hooks with error handling and history edit/delete support.

### Phase 4: Runway feed
**Goal**: Wire `loadRunwayInput()` to M3's engine interface, enforce the check-in day cutoff rule, and create the Ravi fixture test to verify that Ravi's runway calculation shows −₹1,170 on Saturday.
**Depends on**: Phase 3
**Requirements**: RUNW-01, RUNW-02, RUNW-03, RUNW-04
**Success Criteria** (what must be TRUE):
  1. `loadRunwayInput()` loads the latest check-in, post-checkin transactions, scheduled payouts, and commitments in integer paise.
  2. Transactions on the check-in day with `createdAt <= checkedAt` are excluded so check-in money is never double-counted.
  3. M3's engine interface consumes `RunwayInput` seamlessly.
  4. Ravi test fixture reproduces Ravi's week and confirms projected runway shortfall of exactly −₹1,170 on Saturday.
**Plans**: 1 plan

Plans:
- [ ] 04-01: Connect `loadRunwayInput` to M3 engine contract, apply check-in cutoff logic, and write the Ravi fixture verification test.

### Phase 5: Secure AI function (stretch)
**Goal**: Create a secure Vercel serverless function proxying Google Gemini API for natural language financial text/receipt parsing with strict schema validation and user confirmation before saving.
**Depends on**: Phase 4
**Requirements**: AIFN-01, AIFN-02, AIFN-03
**Success Criteria** (what must be TRUE):
  1. Serverless endpoint (`/api/gemini`) accepts user input and parses entries using server-side `GEMINI_API_KEY`.
  2. Output conforms to strict JSON schema for transactions and check-ins; invalid outputs and oversized inputs are rejected.
  3. Parsed items are presented to the worker for explicit confirmation and cannot write to the database automatically.
**Plans**: 1 plan

Plans:
- [ ] 05-01: Implement Vercel serverless Gemini function with schema validation, rate limits, and client confirmation dialog.

### Phase 6: Demo data
**Goal**: Implement a local seed script for a fictional demo worker account using the Supabase service-role key to support judge demonstrations and offline-like local walkthroughs without compromising production keys.
**Depends on**: Phase 4 (can run independently of Phase 5)
**Requirements**: DEMO-01, DEMO-02, DEMO-03
**Success Criteria** (what must be TRUE):
  1. Running `npm run seed:demo` populates a realistic fictional worker account with check-ins, transactions, payouts, and commitments.
  2. Seed script resets previous demo data cleanly before re-populating.
  3. Service-role key and seeding scripts are completely excluded from frontend bundles.
**Plans**: 1 plan

Plans:
- [ ] 06-01: Create local `scripts/seed-demo.mjs` script with reset capability and package script binding.

### Phase 7: Deployment
**Goal**: Configure and execute Vercel production deployment, configure Supabase Auth redirect URLs, verify production environment variables, and perform smoke test.
**Depends on**: Phase 4 (and Phase 5/6 if ready)
**Requirements**: DEPL-01, DEPL-02, DEPL-03, DEPL-04
**Success Criteria** (what must be TRUE):
  1. Vercel project deploys frontend with SPA rewrites for client routing.
  2. Production environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) are configured in Vercel.
  3. Supabase Auth redirect URLs accept the production Vercel URL.
  4. Live production smoke test confirms user signup, check-in, and runway calculation run smoothly.
**Plans**: 1 plan

Plans:
- [ ] 07-01: Configure Vercel deployment, Supabase production auth settings, and execute production smoke testing.

### Phase 8: Verify & freeze
**Goal**: Execute comprehensive master plan quality gates, land final pull request from `feature/backend` into `dev`, merge `dev` into `main`, and tag the release candidate.
**Depends on**: Phases 1 through 7
**Requirements**: REL-01, REL-02, REL-03
**Success Criteria** (what must be TRUE):
  1. All quality gates pass cleanly: `npm run build` in frontend and `npm run test:db` in backend (22+ checks).
  2. Graphify knowledge graph is updated (`graphify update .`) and committed in `graphify-out/`.
  3. Final pull request from `feature/backend` into `dev` is reviewed and merged.
  4. Integration branch `dev` is merged into `main` and tagged for release.
**Plans**: 1 plan

Plans:
- [ ] 08-01: Run full verification checklist, update graphify, merge `feature/backend` into `dev`, and release `dev` into `main`.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth flow | 0/1 | Not started | - |
| 2. Profile & onboarding data | 0/1 | Not started | - |
| 3. Data capture hooks | 0/1 | Not started | - |
| 4. Runway feed | 0/1 | Not started | - |
| 5. Secure AI function (stretch) | 0/1 | Not started | - |
| 6. Demo data | 0/1 | Not started | - |
| 7. Deployment | 0/1 | Not started | - |
| 8. Verify & freeze | 0/1 | Not started | - |
