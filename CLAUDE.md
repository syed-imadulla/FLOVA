# CLAUDE.md — FLOVA Engineering Guide

This document defines core conventions, invariants, workflows, and testing commands for FLOVA.

---

## 1. Graphify Knowledge Graph

This project maintains a persistent knowledge graph at `graphify-out/`.
- Run `graphify query "<question>"` before performing broad searches or code exploration.
- Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts.
- When code changes are made, run `graphify update .` to keep the graph current.
- `graphify-out/graph.json` is rebuilt on updates; large diffs in pull requests are expected.

---

## 2. Architecture & Invariants

FLOVA (*"Every rupee has a story. FLOVA remembers."*) is a voice-first financial companion for gig workers with irregular income.

### Core Invariants:
1. **AI Suggests, User Confirms:** AI extraction (STT, vision, LLM) creates reviewable candidates. Transactions are NEVER written directly to the database without user confirmation in `/add`.
2. **Deterministic Mathematics:** All financial balances, runway projections, and limits are calculated in deterministic TypeScript (`frontend/src/engine/`) using **integer paise** (`100 paise = ₹1.00`). LLMs never perform authoritative arithmetic.
3. **Strict Money Segregation:** Personal spendable income, custodial third-party funds (`ownership: 'not_mine'`, e.g. COD collections), and expected payouts are kept separate in memory and PostgreSQL.
4. **Candidate UUID Stability:** A client-generated candidate UUID (`id` / `candidate_id`) must remain stable from capture through `/add` review to final database persistence.
5. **Idempotent Ingestion:** Re-confirming a candidate with the same UUID must be handled idempotently via Postgres `23505` unique constraint handlers, returning the existing transaction rather than erroring or duplicating.
6. **₹10 Lakh Safeguards:** Maximum individual transaction is ₹10,00,000. Maximum aggregate transaction amount per India calendar day (`Asia/Kolkata`) is ₹10,00,000. Enforced via database triggers with row-level locks on user profiles.

---

## 3. Speech-to-Text & AI Architecture

- **Primary STT:** AI4Bharat IndicConformer microservice in `ai-engine/stt_service/` (port 8001), prioritizing language checkpoints for `kn`, `hi`, `te`, `ta`, `ml`, `en`.
- **Secondary Fallback:** Groq Whisper (`whisper-large-v3-turbo` / `whisper-large-v3`) automatically invoked if the primary STT service times out (>7s) or fails.
- **Intent Extraction:** Groq Llama 3.3 Versatile (`llama-3.3-70b-versatile`) via Supabase Edge Function `process-voice`.
- **Receipt Vision OCR:** Groq Qwen 2.5 27B Vision (`qwen/qwen3.8-27b`) via Supabase Edge Function `extract-receipt`.
- **Client Image Downscaling:** `frontend/src/services/imageOptimizer.ts` scales photos up to 20 MB down to 1920px max dimension at 0.85 JPEG compression prior to upload.

---

## 4. Coding Conventions

- **Frontend:** React 18, TypeScript 5.6, Tailwind CSS 3.4. Strict null checks enabled. No unused variables (`noUnusedLocals: true`).
- **Money Values:** Always use helper utilities in `frontend/src/lib/money.ts` (`toPaise`, `formatINR`, `money`).
- **Database Access:** All database queries go through `frontend/src/services/data.ts`. The client never supplies `user_id`; database default `auth.uid()` enforces tenant isolation via RLS.
- **No Secrets in Client:** `VITE_*` environment variables only. Server keys (`GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FLOVA_STT_INTERNAL_KEY`) are restricted to Edge Functions and backend environments.

---

## 5. Development & Testing Commands

### Development Server:
```bash
make dev
```
Starts Frontend (`:5173`), STT Service (`:8001`), and **Public HTTPS Tunnel** concurrently. Share the generated public link for live mobile/remote testing. (Use `make dev TUNNEL=0` to run offline without a tunnel).
Use `make tunnel` to start only the public tunnel.
Use `make dev-status` to inspect service health, and `make stop` to kill all dev processes.

### Automated Testing:
Always run and verify tests before committing. You can execute all tests with a single command from the project root:
```bash
make test
```
Or run individual suites using Make:
- `make test-frontend` — Frontend services, UI, voice intent, and financial engine tests.
- `make test-backend` — Supabase database schema, triggers, and demo seeding tests.
- `make test-stt` — Python IndicConformer STT and udaan engine tests.
- `make build` — Production frontend build verification.

Alternatively, you can run them directly:

```bash
# 1. Frontend Service, UI & Voice Tests (21 suites, 100+ tests)
cd frontend
node --loader ./src/services/__tests__/mockLoader.mjs --test "src/services/__tests__/*.test.ts"

# 2. Deterministic Financial Engine & Runway Tests (9 suites)
cd frontend
node --loader ./src/services/__tests__/mockLoader.mjs --test \
  "src/engine/__tests__/*.test.ts" \
  "src/runway/__tests__/*.test.ts" \
  "src/wish/__tests__/*.test.ts" \
  "src/profile/__tests__/*.test.ts" \
  "src/data/__tests__/*.test.ts"

# 3. Database Schema, Triggers & Row Level Security (54 tests)
cd backend
npm run test:db

# 4. Demo Seeding & Isolation Verification (17 tests)
cd backend
npm run test:seed

# 5. Python STT Service & Engine Tests (23 tests)
cd ai-engine
python3 -m pytest

# 6. Production Build Check
cd frontend
npm run build
```

---

## 6. Git Workflow

- **Active Development:** Work on `dev`. Commit using conventional commits (`feat:`, `fix:`, `docs:`, `test:`).
- **Release:** Merge `dev` into `main` using standard non-fast-forward merge commits (`git merge dev --no-ff`) after full test suite verification.
- **Never:** Force push (`git push -f`) to `dev` or `main`. Never store unencrypted credentials in Git history.
