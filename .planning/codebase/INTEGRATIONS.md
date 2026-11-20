---
last_mapped_commit: d8cfbb2900c410e8e3cca70f6675fa2b766588e0
last_mapped_at: 2026-11-20
---
# External Integrations

**Analysis Date:** 2026-11-20

## APIs & External Services

**Supabase Auth:**

- Used for worker authentication, identity tokens, and secure session management.
- SDK: `@supabase/supabase-js` 2.119.2
- Implementation: `frontend/src/services/auth.ts` (`signUp`, `signIn`, `signOut`, `getSession`, `onAuthChange`)
- Tokens: JWT claims automatically populate `auth.uid()` in Postgres RLS policies.

**Supabase PostgREST:**

- Auto-generated RESTful API over PostgreSQL tables with RLS enforcement.
- Implementation: `frontend/src/services/data.ts`
- Client: `frontend/src/lib/supabase.ts`

**Google Gemini API (Phase 5 stretch):**

- Purpose: Secure natural language parsing for check-ins or transaction capture.
- Constraint: Never accessed directly from browser. Must run via secure server-side Vercel serverless function with JSON schema validation and user confirmation before commit.
- Auth: Server-side `GEMINI_API_KEY` (never exposed in `VITE_` variables).

## Data Storage

**Databases:**

- Supabase PostgreSQL (Managed Postgres 15+)
  - Tables: `public.profiles`, `public.balance_checkins`, `public.payouts`, `public.transactions`, `public.commitments`
  - Migrations: `backend/supabase/migrations/20261120000100_init_schema.sql`
  - Access: PostgREST API with anon key + user bearer JWT
- Local Testing Database:
  - PGlite (`@electric-sql/pglite`) in-memory WASM Postgres runner executing migrations and testing RLS rules without external network access (`backend/scripts/test-db.mjs`).

**File Storage:**

- None required. All data is structured financial logs and user configuration.

**Caching:**

- None in browser. No deceptive offline caching; network errors are surfaced truthfully.

## Authentication & Identity

**Auth Provider:**

- Supabase Auth (GoTrue)
  - Flow: Email + Password authentication
  - Profile Creation Trigger: Database trigger `on_auth_user_created` calls `public.handle_new_user()` to automatically create a row in `public.profiles` on user creation.
  - User ID Binding: `auth.uid()` is used as the default and security policy check across all tables.

## Monitoring & Observability

**Error Tracking:**

- Truthful error propagation via `unwrap()` helper in `frontend/src/lib/supabase.ts`.
- Direct user-facing error reporting (`err.message`), never silently swallowed or masked.

**Logs:**

- Browser console warnings in development.
- Serverless function runtime logs on Vercel.

## CI/CD & Deployment

**Hosting:**

- Vercel: Single Page App hosting with rewrite rules for client routing and serverless function hosting (`api/`).

**CI Pipeline:**

- Required pre-merge checks on `feature/backend`:
  - `cd frontend && npm run build`
  - `cd backend && npm run test:db`
  - `graphify update .` and commit `graphify-out/`

## Environment Configuration

**Required env vars:**

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon publishable key
- `GEMINI_API_KEY` (Server-side only, Phase 5)

**Secrets location:**

- Local: `.env.local` (git-ignored, never committed)
- Production: Vercel Project Environment Variables

## Webhooks & Callbacks

**Incoming:**

- Supabase Auth redirect URLs (configured in Supabase dashboard for production deployment in Phase 7).

**Outgoing:**

- None.

---

*Integration audit: 2026-11-20*
