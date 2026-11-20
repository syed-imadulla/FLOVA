---
last_mapped_commit: d8cfbb2900c410e8e3cca70f6675fa2b766588e0
last_mapped_at: 2026-11-20
---
# Testing Patterns

**Analysis Date:** 2026-11-20

## Test Framework

**Database Test Runner:**

- Node.js ESM test runner (`node scripts/test-db.mjs`)
- In-memory engine: `@electric-sql/pglite` 0.5.17 (Postgres in WASM)
- Execution: `backend/scripts/test-db.mjs`

**Frontend Verification:**

- TypeScript compiler & Vite production build (`tsc -b && vite build`)

**Python Prototype Tests:**

- pytest in `ai-engine/tests/test_engine.py`

**Run Commands:**

```bash

# Run database schema & RLS test suite (22 assertions)

cd backend && npm run test:db

# Run frontend build & typecheck

cd frontend && npm run build

# Run live Supabase RLS check (requires configured .env.local)

cd backend && npm run test:rls-live

# Run Python prototype tests

cd ai-engine && pytest -q
```

## Test File Organization

**Location:**

- Database tests: `backend/scripts/test-db.mjs`
- AI engine prototype tests: `ai-engine/tests/test_engine.py`

## Test Structure

**PGlite Database Test Pattern:**

```javascript
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";

const db = new PGlite();
// 1. Setup Supabase auth schema stubs & roles (anon, authenticated, auth.uid())
// 2. Load and execute migration SQL file
// 3. Grant schema permissions
// 4. Test User A actions, User B isolation, check constraints, triggers
```

**Assertion Helper:**

```javascript
let pass = 0, fail = 0;
const ok = (c, m) => {
  if (c) { pass++; console.log("  PASS", m); }
  else { fail++; console.log("  FAIL", m); }
};
```

## Mocking & Isolation

**Role Switching in PGlite:**

- Testing acts as a specific user via JWT claim simulation:
  ```javascript
  const as = async (uid, sql) => {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid}', false); set role authenticated;`);
    return db.query(sql);
  };
  ```

**What to Test in Database Tests:**

- Auto-profile creation on user sign-up
- RLS read/write isolation between distinct user IDs
- Foreign key user matching (User B cannot link transaction to User A's payout)
- Check constraints (`expense_type_rule`, `not_mine_within_total`, amount > 0)
- Payout synchronization trigger behavior (partial, settled, rollback on delete)
- Payout received_amount edit protection
- Anonymous access denial

## Required Pre-Shipping Checks

Every pull request from `feature/backend` into `dev` must verify:

```bash
cd frontend && npm run build
cd backend && npm run test:db
```

---

*Testing analysis: 2026-11-20*
