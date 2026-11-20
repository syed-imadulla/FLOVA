---
last_mapped_commit: d8cfbb2900c410e8e3cca70f6675fa2b766588e0
last_mapped_at: 2026-11-20
---
# Codebase Structure

**Analysis Date:** 2026-11-20

## Directory Layout

```
FLOVA/
├── .planning/               # GSD planning directory (ROADMAP, STATE, codebase maps)
├── backend/                 # Database migrations, test scripts, backend package (M1)
│   ├── node_modules/
│   ├── scripts/             # Local test runners (test-db.mjs, rls-live-check.mjs)
│   ├── supabase/
│   │   └── migrations/      # Versioned SQL migrations (20261120000100_init_schema.sql)
│   ├── package.json         # Backend scripts & devDependencies
│   └── README.md
├── docs/                    # Team contracts and specifications
│   └── CONTRACT.md          # Shared data contract & rules
├── frontend/                # React + Vite + TypeScript frontend
│   ├── dist/                # Production build artifacts
│   ├── node_modules/
│   ├── src/
│   │   ├── components/      # UI components (EvidenceView, RiderView, SmsView, IncomeChart)
│   │   ├── engine/          # M3 deterministic runway engine (to be implemented)
│   │   ├── lib/             # Core utilities (money.ts, supabase.ts)
│   │   ├── services/        # Data & Auth access services (auth.ts, data.ts)
│   │   ├── types/           # Shared contract type definitions (contracts.ts)
│   │   ├── api.ts           # Legacy prototype API client
│   │   ├── App.tsx          # Root React component
│   │   ├── main.tsx         # Frontend DOM entry point
│   │   ├── styles.css       # Tailwind & custom styles
│   │   └── vite-env.d.ts
│   ├── index.html           # HTML template
│   ├── package.json         # Frontend dependencies & scripts
│   ├── tsconfig.json        # TypeScript configuration
│   └── vite.config.ts       # Vite build configuration
├── ai-engine/               # Legacy Python prototype & backtest simulator
│   ├── tests/               # Pytest suite
│   ├── udaan_engine/        # Python engine modules
│   └── pyproject.toml
├── graphify-out/            # Graphify knowledge graph (graph.json, report)
├── .claude/                 # Agent configuration
├── CONTRIBUTING.md          # Team rules, workflow, Graphify instructions
└── README.md                # Project overview and run instructions
```

## Directory Purposes

**`backend/`:**

- Purpose: Supabase schema definitions, SQL migrations, Row Level Security policies, and local database verification scripts.
- Key files: `backend/supabase/migrations/20261120000100_init_schema.sql`, `backend/scripts/test-db.mjs`.

**`frontend/src/lib/`:**

- Purpose: Low-level foundation utilities for Supabase client connection and decimal-safe currency math.
- Key files: `frontend/src/lib/supabase.ts`, `frontend/src/lib/money.ts`.

**`frontend/src/services/`:**

- Purpose: Typed data access functions wrapping Supabase operations with paise conversion and validation.
- Key files: `frontend/src/services/auth.ts`, `frontend/src/services/data.ts`.

**`frontend/src/types/`:**

- Purpose: Shared TypeScript interfaces and enum constants mirroring the database schema.
- Key files: `frontend/src/types/contracts.ts`.

**`docs/`:**

- Purpose: Team-wide contracts and specifications.
- Key files: `docs/CONTRACT.md`.

## Key File Locations

**Entry Points:**

- `frontend/src/main.tsx`: React DOM mount
- `frontend/src/App.tsx`: Main application shell
- `backend/scripts/test-db.mjs`: Database test execution
- `backend/supabase/migrations/20261120000100_init_schema.sql`: Database schema definition

**Configuration:**

- `frontend/vite.config.ts`: Vite build configuration
- `frontend/tsconfig.json`: TypeScript compiler configuration
- `backend/package.json`: Backend npm scripts
- `frontend/package.json`: Frontend npm scripts

**Core Logic:**

- `frontend/src/lib/money.ts`: Currency conversion and formatting functions
- `frontend/src/services/data.ts`: Data access functions and runway loader
- `frontend/src/services/auth.ts`: Authentication functions

## Naming Conventions

**Files:**

- TypeScript modules & utilities: `camelCase.ts` (`money.ts`, `supabase.ts`, `api.ts`)
- TypeScript components: `PascalCase.tsx` (`App.tsx`, `RiderView.tsx`)
- SQL migrations: `YYYYMMDDHHMMSS_name.sql` (`20261120000100_init_schema.sql`)
- Scripts: `kebab-case.mjs` (`test-db.mjs`, `rls-live-check.mjs`)

**Identifiers:**

- Types & Interfaces: `PascalCase` (`Profile`, `BalanceCheckin`, `RunwayInput`)
- Database Tables & Columns: `snake_case` (`balance_checkins`, `not_mine_amount`, `payout_pattern`)
- Enums: `snake_case` in SQL, `camelCase` / `UPPER_SNAKE_CASE` in TS (`WORK_PROFILES`, `WorkProfile`)

## Where to Add New Code

**Auth & Session Wiring (Phase 1):**

- Context & Provider: `frontend/src/context/AuthContext.tsx` or `frontend/src/hooks/useSession.ts`
- Minimal screens: `frontend/src/components/auth/` (minimal screens for M2 to restyle)

**Profile & Data Hooks (Phases 2 & 3):**

- Hooks: `frontend/src/hooks/useProfile.ts`, `useCheckin.ts`, `useTransactions.ts`, `usePayouts.ts`
- Service extensions: `frontend/src/services/data.ts`

**Runway Engine Wiring (Phase 4):**

- Loader & Fixture tests: `frontend/src/services/data.ts`, `frontend/src/tests/`

**Serverless Functions (Phase 5):**

- Serverless entry points: `api/gemini.ts` (Vercel serverless functions)

**Migrations:**

- New migrations: `backend/supabase/migrations/<timestamp>_<description>.sql`

---

*Structure analysis: 2026-11-20*
