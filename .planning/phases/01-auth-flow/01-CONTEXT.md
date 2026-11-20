# Phase 1: Auth flow - Context

**Gathered:** 2026-11-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 establishes client-side Supabase authentication, reactive session management, protected route handling, minimal working login/signup/logout screens, and a small backend migration with explicit schema grants. It wires `AuthProvider` and `useSession` into the React application tree and replaces direct FastAPI prototype routing with authenticated client routing, leaving old views preserved for M2.

</domain>

<decisions>
## Implementation Decisions

### 1. Routing & Dependencies
- **D-01 (Library):** Install and use `react-router-dom` v6 (fully compatible with React 18).
- **D-02 (Route Map):**
  - `/login`: Public auth screen. Redirects to `/` (or origin `from` state) if already authenticated.
  - `/signup`: Public registration screen. Redirects to `/` if already authenticated.
  - `/`: Protected home placeholder displaying `"Signed in as <email>"` and a Log out button.
  - `/onboarding`: Protected placeholder displaying `"Onboarding: Phase 2"` (stub for Phase 2).
  - `*` (any other route): Redirects to `/`.

### 2. Auth Context & Session Management
- **D-03 (AuthProvider):** Located at `frontend/src/auth/AuthProvider.tsx`. Exposes React Context with `{ session, user, loading }`. Subscribes via `onAuthChange()` from `frontend/src/services/auth.ts` on mount, and unsubscribes on unmount.
- **D-04 (useSession):** Located at `frontend/src/auth/useSession.ts`. Custom hook returning the context value; throws a descriptive error if called outside an `<AuthProvider>`.
- **D-05 (RequireAuth):** Located at `frontend/src/auth/RequireAuth.tsx`. Route guard component. While `loading` is true, renders a `"Loading…"` message to eliminate redirect flicker. If `session` is null, redirects to `/login` preserving the current location in `state.from`.
- **D-06 (RedirectIfAuthed):** Located at `frontend/src/auth/RedirectIfAuthed.tsx`. Wraps `/login` and `/signup`. While `loading` is true, renders `"Loading…"`. When authenticated, redirects to `location.state?.from?.pathname || "/"`.

### 3. Pages & UI Presentation
- **D-07 (Screen Files):**
  - `frontend/src/pages/auth/LoginPage.tsx`
  - `frontend/src/pages/auth/SignupPage.tsx`
  - `frontend/src/pages/HomePlaceholder.tsx`
  - `frontend/src/pages/OnboardingPlaceholder.tsx`
- **D-08 (Styling Policy):** Minimal, unstyled semantic HTML (`<form>`, `<label>`, `<input>`, `<button>`). Accessible with large tap targets and plain basic styling. No custom Tailwind layout work or restyling; visual design is owned by M2.

### 4. Authentication Workflows & Form Behavior
- **D-09 (Sign-up Workflow):**
  - Fields: `email`, `password`, optional `displayName`.
  - Client-side validation: Password must be at least 6 characters, checked before invoking backend.
  - Invokes `signUp(email, password, displayName)` from `frontend/src/services/auth.ts`.
  - Email confirmation detection: If Supabase returns a `user` but `session` is null, displays: `"Check your email to confirm, then log in."` Otherwise redirects to `/`.
- **D-10 (Login Workflow):**
  - Fields: `email`, `password`.
  - Invokes `signIn(email, password)` from `frontend/src/services/auth.ts`.
  - On success: navigates to `location.state?.from?.pathname` or `/`.
- **D-11 (Logout Workflow):**
  - Invokes `signOut()` from `frontend/src/services/auth.ts`.
  - On success: redirects to `/login`.
- **D-12 (Form State & Error Handling):**
  - Form error message rendered with `role="alert"` showing `err.message`.
  - Submit buttons disabled while request is in flight.
  - Never fake success; only transition on successful resolution.

### 5. Architectural Boundaries
- **D-13 (Service Encapsulation):** All components and hooks interact with authentication strictly through `frontend/src/services/auth.ts`. No direct `supabase.auth` calls inside React components.
- **D-14 (Immutability of Foundation):** No modifications to `frontend/src/services/`, `frontend/src/lib/`, or `frontend/src/types/`.
- **D-15 (Legacy Views Preservation):** In `frontend/src/App.tsx` and `main.tsx`, perform minimal wiring to introduce `BrowserRouter`, `AuthProvider`, and new routes. The retired prototype views (`RiderView`, `SmsView`, `EvidenceView`, `IncomeChart`) and `api.ts` remain intact on disk but unrouted.

### 6. Backend Hygiene & Explicit Permissions
- **D-16 (New Migration):** Create `backend/supabase/migrations/20261120000200_explicit_grants.sql`:
  ```sql
  grant usage on schema public to authenticated;
  grant select, update on public.profiles to authenticated;
  grant select, insert, update, delete on public.balance_checkins, public.payouts, public.transactions, public.commitments to authenticated;
  revoke all on those 5 tables from anon;
  ```
- **D-17 (Dynamic Test DB Migration Loader):** Update `backend/scripts/test-db.mjs` to dynamically read and apply all migrations in `backend/supabase/migrations/` in alphabetical/timestamp order. Remove the test harness's blanket `grant ... on all tables` line to ensure tests verify that migrations alone provide the necessary permissions. All 22 tests must remain passing.
- **D-18 (Documentation Update):** Update `docs/CONTRACT.md` and `backend/README.md` to document the new migration.
- **D-19 (Build Cache Hygiene):** Add `frontend/tsconfig.tsbuildinfo` to `.gitignore` and remove it from git tracking via `git rm --cached frontend/tsconfig.tsbuildinfo`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing:**
- `frontend/src/services/auth.ts` — Authentication service API (`signUp`, `signIn`, `signOut`, `getSession`, `onAuthChange`).
- `frontend/src/lib/supabase.ts` — Supabase client initialization.
- `backend/supabase/migrations/20261120000100_init_schema.sql` — Base schema, RLS policies, and trigger definitions.
- `backend/scripts/test-db.mjs` — Local in-memory Postgres (PGlite) test harness.
- `docs/CONTRACT.md` — Shared team contract and data rules.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/services/auth.ts`: Provides clean async wrappers over Supabase Auth with exact types (`Session`, `User`).
- `frontend/src/lib/supabase.ts`: Central Supabase client instance configured with session persistence.

### Established Patterns
- RLS-driven security: Session JWT drives `auth.uid()` in database policies.
- Error unwrapping: Errors bubble up as descriptive JavaScript errors (`Error`).

### Integration Points
- `frontend/src/main.tsx`: Mounts React application into `#root`.
- `frontend/src/App.tsx`: Top-level router definition and context provider injection.

</code_context>

<deferred>
## Deferred Ideas

- **Profile & Onboarding Saving:** Handled in Phase 2 (`useProfile` and onboarding fields persistence).
- **Data Capture Hooks:** Handled in Phase 3 (`useCheckin`, `useTransactions`, `usePayouts`, `useCommitments`).
- **Password Reset / Social Login:** Explicitly out of scope for v1 hackathon build.
- **Visual Styling & Tailwind Polish:** M2 owns styling; M1 delivers unstyled accessible components.

</deferred>

---
*Phase: 01-auth-flow*
