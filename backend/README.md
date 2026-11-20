# FLOVA backend (M1)

Supabase Auth + PostgreSQL with Row Level Security. There is no custom API server: the React app talks to Supabase
through `frontend/src/services/`, and RLS makes sure each signed-in worker only ever reads or changes their own rows.
(The earlier FastAPI + SQLite prototype is in git history up to commit `effb828`.)

| Path | What |
|---|---|
| `supabase/migrations/20261120000100_init_schema.sql` | enums, 5 tables, triggers, indexes, RLS policies |
| `scripts/test-db.mjs` | runs the migration on a local Postgres (PGlite) and tests RLS, constraints and payout sync: no Supabase needed |
| `scripts/rls-live-check.mjs` | the same User A vs User B isolation checks against the real Supabase project |
| `../docs/CONTRACT.md` | field names, enums and recording rules for the whole team |
| `../frontend/src/types/contracts.ts` | the same contract as TypeScript types |
| `../frontend/src/services/` | auth and data functions the UI calls |

## Set up Supabase (once)
1. Create a project at supabase.com (region: Mumbai `ap-south-1`).
2. **SQL Editor → New query** → paste `supabase/migrations/20261120000100_init_schema.sql` → **Run**.
   With the Supabase CLI instead: `cd backend && supabase link --project-ref <ref> && supabase db push`.
3. **Authentication → Sign In / Providers → Email**: email + password on. Turning **Confirm email** off speeds up the demo.
4. **Project Settings → API**: copy the Project URL and the publishable (anon) key into `frontend/.env.local`,
   `backend/.env.local` and Vercel's environment variables. Never put the service-role key in a `VITE_` variable.

## Test
```bash
cd backend
npm install
npm run test:db         # local: 22 checks, including User B cannot read/edit/delete/insert as User A
npm run test:rls-live   # real project: needs backend/.env.local filled in
```

## Tables
`profiles` (auto-created at sign-up) · `balance_checkins` · `transactions` · `payouts` · `commitments`.
Money is `numeric(12,2)` rupees in the database and integer paise in the app. Full details: `../docs/CONTRACT.md`.
