# Phase 1: Auth Flow Summary

**Plan:** 01-01 (Authentication flow, route guards, and backend schema grants)  
**Executed:** 2026-11-20  
**Status:** Completed  
**Branch:** `feature/backend`

---

## 1. Executive Summary

Phase 1 establishes the client-side authentication lifecycle and routing infrastructure for FLOVA, connects directly to Supabase Auth via our existing service boundary (`frontend/src/services/auth.ts`), enforces explicit PostgreSQL permission grants for `authenticated` and `anon` roles via a new migration, and validates complete isolation under RLS.

All three plan tasks have been executed and verified cleanly. No foundational contracts or services were modified, and legacy prototype components remain untouched on disk unrouted.

---

## 2. Key Deliverables & Changes

### Database & Backend Hygiene
- **Migration `backend/supabase/migrations/20261120000200_explicit_grants.sql`:**
  - Explicitly grants `USAGE` on schema `public` to `authenticated`.
  - Explicitly grants `SELECT, UPDATE` on `public.profiles` to `authenticated`.
  - Explicitly grants `SELECT, INSERT, UPDATE, DELETE` on `balance_checkins`, `payouts`, `transactions`, and `commitments` to `authenticated`.
  - Explicitly revokes all privileges on all five tables from `anon`.
- **Test Harness `backend/scripts/test-db.mjs`:**
  - Dynamically discovers and applies all SQL files in `backend/supabase/migrations/` in alphabetical order.
  - Removed the harness's blanket `GRANT ... ON ALL TABLES` line, proving the migrations alone enforce proper table access under RLS.
  - Local PGlite test suite passes **22 passed, 0 failed**.
- **Documentation & Tracking:**
  - Updated `docs/CONTRACT.md` and `backend/README.md` to document the second migration.
  - Added `frontend/tsconfig.tsbuildinfo` to `.gitignore` and removed it from Git cache.

### Authentication & Routing Infrastructure
- **Dependency:** Installed `react-router-dom@6` in `frontend/package.json` (no other dependencies added).
- **`frontend/src/auth/AuthProvider.tsx`:**
  - Exposes `AuthContext` with `{ session, user, loading }`.
  - Subscribes reactively via `onAuthChange` and `getSession` from `frontend/src/services/auth.ts`.
  - Cleanly unmounts subscription on teardown.
- **`frontend/src/auth/useSession.ts`:**
  - Type-safe consumer hook for `AuthContext`.
  - Throws an explicit error if called outside `AuthProvider`.
- **`frontend/src/auth/RequireAuth.tsx`:**
  - Protected route wrapper. Displays minimal `"Loading…"` to avoid redirect flicker while checking session.
  - Redirects unauthenticated users to `/login`, preserving arrival route via `location.state.from`.
- **`frontend/src/auth/RedirectIfAuthed.tsx`:**
  - Public route wrapper for `/login` and `/signup`.
  - Displays `"Loading…"` while evaluating session.
  - Redirects authenticated users to `location.state.from` or `/`.

### Pages & App Wiring
- **`frontend/src/pages/auth/LoginPage.tsx`:**
  - Semantic HTML form with accessible labels, email & password inputs, and large tap targets.
  - Submits via `signIn(email, password)` from `../../services/auth`.
  - Disables submit button while request is in flight.
  - Displays error message in `<div role="alert">`.
  - Navigates to target route (`from` or `/`) on success; links to `/signup`.
- **`frontend/src/pages/auth/SignupPage.tsx`:**
  - Semantic form with email, password, and optional `displayName`.
  - Client-side validation: enforces `password.length >= 6` before calling backend.
  - Calls `signUp(email, password, displayName)` from `../../services/auth`.
  - If user is returned without session (email confirmation active), displays `"Check your email to confirm, then log in."` in `role="alert"`.
  - Disables submit button while loading; displays errors in `role="alert"`; links to `/login`.
- **`frontend/src/pages/HomePlaceholder.tsx`:**
  - Minimal protected home page showing `"Signed in as {user?.email}"`.
  - Provides a Log out button that invokes `signOut()` from `../services/auth` and redirects to `/login`.
- **`frontend/src/pages/OnboardingPlaceholder.tsx`:**
  - Minimal protected placeholder rendering `"Onboarding: Phase 2"`.
- **`frontend/src/App.tsx`:**
  - Wraps routes inside `BrowserRouter` and `AuthProvider`.
  - Defines routes:
    - `/login` -> `<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>`
    - `/signup` -> `<RedirectIfAuthed><SignupPage /></RedirectIfAuthed>`
    - `/` -> `<RequireAuth><HomePlaceholder /></RequireAuth>`
    - `/onboarding` -> `<RequireAuth><OnboardingPlaceholder /></RequireAuth>`
    - `*` -> `<Navigate to="/" replace />`
  - Legacy prototype components (`RiderView`, `SmsView`, `EvidenceView`, `IncomeChart`) and `api.ts` remain on disk untouched but unrouted.

---

## 3. Verification & Quality Gates

| Check | Command | Result |
|-------|---------|--------|
| Frontend TypeScript & Build | `cd frontend && npm run build` | **Pass** (`tsc -b && vite build` in 1.49s, 0 errors) |
| Database & RLS Assertions | `cd backend && npm run test:db` | **Pass** (22 passed, 0 failed across 2 migrations) |
| Git Tracking Hygiene | `git status --short` | **Pass** (no `.env` or build cache tracked) |
| Graphify Synchronization | `graphify update .` | **Pass** (Rebuilt: 555 nodes, 853 edges, 47 communities) |

---

## 4. Note for M2 (Frontend/UI)

The auth pages (`LoginPage`, `SignupPage`, `HomePlaceholder`, `OnboardingPlaceholder`) are built using semantic, accessible HTML with large tap targets and plain styling without external CSS frameworks. M2 can restyle or wrap these components as needed according to the design system.

The old components (`RiderView`, `SmsView`, `EvidenceView`, `IncomeChart`) and `api.ts` that called the retired FastAPI prototype are kept intact on disk but are unrouted.

---

## 5. Next Steps

Proceed to **Phase 2: Profile & onboarding data**:
- Build `useProfile` hook for reactive profile data access and updates.
- Persist worker profile attributes (`work_profile`, `payout_pattern`, `preferred_language`, and daily expense estimates in integer paise).
- Implement router gate based on `onboarding_completed`.
