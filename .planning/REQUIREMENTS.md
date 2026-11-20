# Requirements: FLOVA (M1 Backend & Database)

**Defined:** 2026-11-20
**Core Value:** Provide a reliable, decimal-safe, and truthful answer to "Will my available money last until my next payout?" with strict RLS isolation and uncertainty communication.

## v1 Requirements

### Phase 1: Authentication Flow

- [ ] **AUTH-01**: `AuthProvider` and `useSession` hook manage session lifecycle, persistence, and reactive token refresh.
- [ ] **AUTH-02**: Protected route wrapper guards private pages, redirecting unauthenticated users to `/login`.
- [ ] **AUTH-03**: Minimal, working login and sign-up forms support email/password with optional `display_name` metadata.
- [ ] **AUTH-04**: Sign-out functionality clears session and resets application auth state cleanly.

### Phase 2: Profile & Onboarding Data

- [ ] **PROF-01**: `useProfile` hook provides reactive access to current worker profile via `getMyProfile` and `updateMyProfile`.
- [ ] **PROF-02**: Onboarding workflow captures and persists `work_profile`, `payout_pattern`, `preferred_language`, and daily estimates (`daily_living_estimate`, `daily_work_estimate` in integer paise or null).
- [ ] **PROF-03**: Router redirects users based on `onboarding_completed` (incomplete profile routes to onboarding; completed routes to planner).

### Phase 3: Data Capture Hooks & Mutation Services

- [ ] **DATA-01**: `useCheckin` hook enables balance check-ins (`cash_amount`, `bank_amount`, `not_mine_amount` in paise, note, timestamp).
- [ ] **DATA-02**: `useTransactions` hook supports creating, listing, updating, and deleting income and expense transactions.
- [ ] **DATA-03**: Expense validation enforces required `expense_type` (`living` vs `work`) for own expenses and null for non-expenses/COD.
- [ ] **DATA-04**: `receivePayout` integration records linked income transactions that trigger DB payout status updates (`partial`, `settled`).
- [ ] **DATA-05**: `useCommitments` hook enables creating, listing, and updating bills and debts with due dates.
- [ ] **DATA-06**: Error handling surfaces Supabase errors truthfully (`err.message`) without deceptive offline caching.

### Phase 4: Runway Feed & Engine Integration

- [ ] **RUNW-01**: `loadRunwayInput()` delivers `RunwayInput` in integer paise preserving nulls for missing estimates.
- [ ] **RUNW-02**: Check-in cutoff rule filters same-day transactions by `createdAt > checkedAt` so check-in cash is never double-counted.
- [ ] **RUNW-03**: Feed interface successfully connects to M3's TypeScript engine input contract.
- [ ] **RUNW-04**: Ravi fixture integration test verifies that given Ravi's baseline, the runway engine outputs expected −₹1,170 on Saturday.

### Phase 5: Secure AI Function (Stretch)

- [ ] **AIFN-01**: Vercel serverless function (`api/gemini`) securely proxies AI natural language parsing using server-side `GEMINI_API_KEY`.
- [ ] **AIFN-02**: Serverless function validates structured JSON output schema and enforces payload length and rate limits.
- [ ] **AIFN-03**: Client workflow requires explicit user confirmation of parsed items before writing to database.

### Phase 6: Demo Data Seed & Test Fixtures

- [ ] **DEMO-01**: Node script `scripts/seed-demo.mjs` populates a fictional demo account using Supabase service-role key.
- [ ] **DEMO-02**: Demo script seeds realistic worker profile, historical check-ins, platform payouts, COD transactions, and commitments.
- [ ] **DEMO-03**: Build configuration strictly guarantees service-role key and seed scripts are excluded from production frontend bundles.

### Phase 7: Deployment & Production Smoke Test

- [ ] **DEPL-01**: Vercel project configuration (`vercel.json`) supports client-side SPA routing and serverless functions.
- [ ] **DEPL-02**: Production environment variables configured (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, serverless keys).
- [ ] **DEPL-03**: Supabase Auth Redirect URLs configured to match production Vercel domain.
- [ ] **DEPL-04**: Production smoke test verifies live signup, check-in, and runway calculation on deployed site.

### Phase 8: Verify & Release Freeze

- [ ] **REL-01**: Complete master plan quality gates pass (`frontend npm run build`, `backend npm run test:db`, Graphify update).
- [ ] **REL-02**: Pull request from `feature/backend` merged cleanly into `dev`.
- [ ] **REL-03**: Integration branch `dev` verified and merged into `main` with release tag.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Custom visual restyling of M2 screens | M2 owns styling; M1 provides clean working hooks and minimal unstyled markup |
| Offline SQLite / IndexDB persistence | Out of scope for v1; network errors must be surfaced truthfully |
| Client-side LLM calls | Security risk; API keys must remain server-side |
| Floating point currency calculations | High risk of rounding drift; all money handled in integer paise |

## Traceability Matrix

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| PROF-01 | Phase 2 | Pending |
| PROF-02 | Phase 2 | Pending |
| PROF-03 | Phase 2 | Pending |
| DATA-01 | Phase 3 | Pending |
| DATA-02 | Phase 3 | Pending |
| DATA-03 | Phase 3 | Pending |
| DATA-04 | Phase 3 | Pending |
| DATA-05 | Phase 3 | Pending |
| DATA-06 | Phase 3 | Pending |
| RUNW-01 | Phase 4 | Pending |
| RUNW-02 | Phase 4 | Pending |
| RUNW-03 | Phase 4 | Pending |
| RUNW-04 | Phase 4 | Pending |
| AIFN-01 | Phase 5 | Pending |
| AIFN-02 | Phase 5 | Pending |
| AIFN-03 | Phase 5 | Pending |
| DEMO-01 | Phase 6 | Pending |
| DEMO-02 | Phase 6 | Pending |
| DEMO-03 | Phase 6 | Pending |
| DEPL-01 | Phase 7 | Pending |
| DEPL-02 | Phase 7 | Pending |
| DEPL-03 | Phase 7 | Pending |
| DEPL-04 | Phase 7 | Pending |
| REL-01 | Phase 8 | Pending |
| REL-02 | Phase 8 | Pending |
| REL-03 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0 ✓

---
*Requirements defined: 2026-11-20*
