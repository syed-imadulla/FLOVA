---
last_mapped_commit: d8cfbb2900c410e8e3cca70f6675fa2b766588e0
last_mapped_at: 2026-11-20
---
# Technology Stack

**Analysis Date:** 2026-11-20

## Languages

**Primary:**

- TypeScript 5.6.3 - Frontend application code, types, services, and shared contract (`frontend/src/`)
- SQL (PostgreSQL 15+ / Supabase plpgsql) - Database schema, migrations, RLS policies, constraints, triggers (`backend/supabase/migrations/`)

**Secondary:**

- JavaScript (Node.js ESM) - Database test runners, PGlite scripts (`backend/scripts/test-db.mjs`, `backend/scripts/rls-live-check.mjs`)
- Python 3.10+ - AI engine simulation, backtest models, prototype scripts (`ai-engine/udaan_engine/`)

## Runtime

**Environment:**

- Browser (Modern evergreen browsers supporting ES modules) - Frontend UI runtime
- Node.js 20+ (LTS) - Backend test runners, script execution, build tooling
- PostgreSQL (via Supabase managed Postgres and local PGlite WASM) - Database runtime

**Package Manager:**

- npm 10.x - Frontend and backend package management
- Lockfiles: `frontend/package-lock.json` present, `backend/package-lock.json` present

## Frameworks

**Core:**

- React 18.3.1 (`frontend/package.json`) - Declarative UI library
- Vite 5.4.11 (`frontend/package.json`) - Frontend development server and production bundler
- Supabase (`@supabase/supabase-js` 2.119.2) - Authentication, database client, and Row Level Security enforcement

**Testing:**

- PGlite 0.5.17 (`@electric-sql/pglite` in `backend/package.json`) - In-memory PostgreSQL WASM runtime for deterministic local RLS and schema test suite (`backend/scripts/test-db.mjs`)
- pytest (in `ai-engine/`) - Python unit tests for backtest simulation

**Build/Dev:**

- TypeScript 5.6.3 (`tsc -b`) - Typechecking and declaration emit
- `@vitejs/plugin-react` 4.3.4 - Fast Refresh and JSX transformation
- Graphify 0.9.92 (`graphifyy[sql]`) - AST-based repository knowledge graph and architecture query tooling

## Key Dependencies

**Critical:**

- `@supabase/supabase-js` 2.119.2 - Single client interface for Auth and PostgREST database operations (`frontend/src/lib/supabase.ts`)
- `@electric-sql/pglite` 0.5.17 - Real Postgres in WASM for zero-dependency local migration and RLS testing (`backend/scripts/test-db.mjs`)
- `react` / `react-dom` 18.3.1 - Component rendering and state hooks

**Infrastructure:**

- Tailwind CSS / PostCSS - Utility-first styling (`frontend/src/styles.css`)

## Configuration

**Environment:**

- Frontend: `.env.local` (copied from `.env.example`). Allowed client variables:
  - `VITE_SUPABASE_URL` - Supabase project endpoint
  - `VITE_SUPABASE_PUBLISHABLE_KEY` - Public anon key safe for browser with RLS
  - Note: Service-role keys and AI provider keys are forbidden in client code
- Backend: Standard Supabase environment variables for live RLS tests

**Build:**

- `frontend/tsconfig.json` - TypeScript compilation settings (ES2020 target, bundler module resolution, strict mode)
- `frontend/vite.config.ts` - Vite React plugin configuration

## Platform Requirements

**Development:**

- Linux / macOS / Windows with Node.js 20+, npm, and Python 3.10+
- Git with branch `feature/backend` targeting `dev`
- Graphify CLI (`graphify update .`)

**Production:**

- Frontend: Vercel (Single Page App deployment)
- Backend: Supabase (Managed Postgres with Auth and Row Level Security)
- Serverless: Vercel Serverless Function (Phase 5 secure Gemini AI integration)

---

*Stack analysis: 2026-11-20*
*Update after major dependency changes*
