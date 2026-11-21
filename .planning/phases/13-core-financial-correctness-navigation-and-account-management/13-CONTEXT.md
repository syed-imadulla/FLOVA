# Phase 13 Context: Core Financial Correctness, Navigation and Account Management

## Purpose & Scope
Address critical correctness bugs in FLOVA before introducing any new features:
1. Voice transaction amount duplication on multi-transaction sentences.
2. Improved income categorisation adapted to work profile.
3. Clean navigation and redirection without broken router states or redirect loops.
4. Robust logout flow with state clearing and protection against stale data.
5. Raising the application transaction and daily limit to ₹10,00,000 (10 Lakh) from ₹1,00,000.

## Implementation Decisions

### 1. Voice Transaction Amount Duplication
- **Root Cause**: Both local extractor (`extractTransaction.ts`) and Edge Function (`process-voice/index.ts`) only extracted a single `amount` and single `transaction` object, or clobbered amounts across clauses.
- **Decision**: 
  - Update `extractTransaction.ts` (local fallback) to recognize compound sentences (e.g. joined by "and", "aur", "mattu", "mariyu", or punctuation) and extract independent transaction clauses without cross-contaminating amounts.
  - If a sentence has an expense of ₹250 and income of ₹800, produce two distinct `ExtractedTransactionData` objects inside `dto.transactions`.
  - In `backend/supabase/functions/process-voice/index.ts`, update system prompt to explicitly extract `transactions` array with distinct amounts per event, never duplicating one amount across intents.
  - Map each extracted transaction to a candidate with its own RFC 4122 UUID via `candidateAdapter.ts` (`mapDtoToVoiceCandidates`).
  - In `VoiceScreen.tsx` and `AddScreen.tsx`, introduce sequential review support in `ReviewState` (`remainingCandidates`). When multiple candidates exist, `/add` confirms the first candidate, then smoothly steps to the next candidate before completing to `/activity`.

### 2. Income Categories
- **Decision**:
  - Add canonical income categories: `salary`, `freelance`, `business_sales`, `delivery_earnings`, `service_income`, `commission`, `tips`, `other`.
  - Retain legacy categories (`earnings`, `client_payment`, `platform_payout`, `sales`, `daily_wage`) for backwards compatibility.
  - Separate income and expense categories cleanly in `categories.ts`.
  - In `categoriesFor(type, workProfile)`, prioritize relevant categories based on `workProfile` (e.g. delivery riders see delivery earnings & tips first; freelancers see freelance & client payments first).
  - Never auto-classify an uncertain transaction.

### 3. Navigation and Redirects
- **Decision**:
  - Activity screen (`/activity`) is strictly an activity log and timeline. Remove the "Add by voice" button from EmptyState.
  - Remove all creation controls from inside Activity.
  - Quick capture routes remain strictly:
    - Receipt capture -> `/catch`
    - Manual entry -> `/add`
    - Voice capture -> `/voice`
  - Back buttons across screens (`/add`, `/catch`, `/checkin`, etc.) use safe fallback: `window.history.state?.idx > 0 ? navigate(-1) : navigate('/app')`.
  - Keep legacy redirects (`/dashboard`, `/history`, `/transactions`, `/overview`, `/settings`, `/plan`).
  - `/add` remains the sole confirmation route for saving new transactions.

### 4. Logout and Session Cleanup
- **Decision**:
  - Provide a clear "Sign out" action in both `MoreScreen` and `ProfileScreen`.
  - Call Supabase Auth `signOut()`.
  - Update all financial data hooks (`useActivity`, `useMonthSummary`, `useRunway`, `useTransactions`, `usePayouts`, `useCommitments`, `useLatestCheckin`) to clear their in-memory data to `null` or `[]` immediately when `user` is null.
  - `RequireAuth` guards authenticated screens and immediately redirects unauthenticated users to `/login`.
  - Ensure re-login works smoothly and loads the authenticated user's fresh data.

### 5. Application Daily Limit (₹10 Lakh)
- **Decision**:
  - Create `frontend/src/lib/limits.ts` with:
    - `MAX_TRANSACTION_LIMIT_RUPEES = 1_000_000` (₹10,00,000)
    - `MAX_TRANSACTION_LIMIT_PAISE = 100_000_000` (10 Crore paise)
  - Replace all hardcoded 100,000 / 1 Lakh limits in:
    - `frontend/src/profile/parseRupees.ts`
    - `frontend/src/engine/candidateAdapter.ts`
    - `frontend/src/engine/validation.ts`
    - `frontend/src/services/data.ts`
  - Enforce ₹10 Lakh limit on single transactions, profile daily estimates, and candidate conversions.
  - Boundary: ₹10,00,000 (100,000,000 paise) is valid; ₹10,00,001 is invalid.
