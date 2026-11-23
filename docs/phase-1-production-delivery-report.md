# FLOVA Phase 1 Production Delivery Report

**Last updated:** 2026-11-23
**Supabase project:** `msjzkylvafuwlkkujxpv` (flova, ap-south-1, PostgreSQL 17)
**Repository HEAD:** `b60b212` on `main` (= `origin/main` = `dev`), working tree has uncommitted production fixes.

Every result below was observed in this session unless marked *previous agent claim*.

---

## 1. Status by stage

| Stage | Status | Evidence |
|---|---|---|
| 1.1 Codebase audit | **Verified** | Tests, typecheck, build and bundle scan below |
| 1.2 Local production fixes | **Verified, uncommitted** | `git status` shows 9 modified + 6 new files (see §2) |
| 1.3 CP1 Migration history | **Verified** | `migration list --remote` shows all 7 versions local = remote |
| 1.3 CP2 Database permissions | **Applied and verified 2026-11-23** | User-approved `db push`; post-migration ACLs, triggers and history verified (§5.7) |
| 1.3 CP3 Edge Function deploy | **Deployed and verified 2026-11-23** | `process-voice` v8, `extract-receipt` v12 (§7) |
| 1.4 Vercel | Not started (needs approval + commit/push) | No `.vercel/` link, no GitHub deployments |
| 1.5 STT service | Decision pending | Remote has no IndicConformer URL/key; voice uses Groq Whisper |
| 1.6 Production E2E QA | Not started | Depends on CP2, CP3, 1.4 |

## 2. Repository state

Uncommitted changes (unchanged from handoff, plus this session's additions):

```
 M ai-engine/stt_service/{config,conformer_engine,main}.py, ai-engine/tests/test_stt_service.py
 M backend/supabase/functions/{extract-receipt,process-voice}/index.ts
 M frontend/index.html, frontend/vite.config.ts, frontend/src/services/__tests__/receiptExtraction.test.ts
 M backend/scripts/test-db.mjs                         (this session: 6 hardening tests)
 M docs/remote-remediation-plan.md                     (this session: rollback MAINTAIN fix)
?? backend/supabase/functions/{deno.d.ts,tsconfig.json}
?? backend/supabase/migrations/20261123150000_harden_anon_and_triggers.sql   (this session)
?? docs/*.md (4 previous-agent docs + this report), frontend/vercel.json
```

## 3. Automated verification (2026-11-23)

| Check | Result |
|---|---|
| `make test` (frontend services + engine/runway/wish/profile/data, backend DB + seed, Python STT) | exit 0 |
| Backend schema/RLS/triggers (`npm run test:db`) | **60 passed** (54 existing + 6 new hardening) |
| Demo seed / isolation (`npm run test:seed`) | 17 passed |
| Python STT (`pytest`) | 24 passed |
| Frontend `tsc --noEmit` | 0 errors |
| Edge Function `tsc` (`backend/supabase/functions/tsconfig.json`) | 0 errors |
| `npm run build` (Vite) | Passed; chunks vendor 164 kB, supabase 230 kB, index 260 kB |
| Bundle secret scan (`frontend/dist`) | Only JWT is role `anon`; `sb_secret_` string is supabase-js library code; no service-role or Groq key |

## 4. Remote Supabase (read-only inspection)

- **Tables:** 10, RLS enabled on all. Core 5 have no anon grants. Phase 16 tables (`invoices`, `invoice_items`, `invoice_settlements`, `wish_goals`, `wish_contributions`) have `anon=arwdDxtm`.
- **Functions:** all 9 public functions have `{=X, anon=X, authenticated=X, service_role=X}`. SECURITY DEFINER: `check_daily_transaction_limit`, `sync_invoice_settlement`, `sync_wish_contribution`, `handle_new_user`, `rls_auto_enable`.
- **Triggers:** `auth.users → handle_new_user`, `transactions → check_daily_transaction_limit`, `invoice_settlements → sync_invoice_settlement`, `wish_contributions → sync_wish_contribution`; event trigger `ensure_rls → rls_auto_enable`.
- **Default privileges (root cause):** `pg_default_acl` for `postgres` and `supabase_admin` in `public` grants `anon` full access on new tables and EXECUTE on new functions. Every future migration that creates a table must revoke anon explicitly (or default privileges must be changed in a separately approved migration).
- **Storage:** one bucket `receipts`, `public=false`, no `storage.objects` policies (deny-all). The frontend does not use Storage, so this is safe.
- **Edge Functions:** `process-voice` v7, `extract-receipt` v11, both `verify_jwt=true`.
- **Secret names** (values not read): `GROQ_API_KEY` + platform defaults. No `INDICCONFORMER_URL` / `INDICCONFORMER_KEY` → IndicConformer is not reachable from production; Groq Whisper fallback carries all remote voice traffic.

## 5. Checkpoint 2: Security hardening migration

### 5.1 Migration
`backend/supabase/migrations/20261123150000_harden_anon_and_triggers.sql`

Same intent as the previous plan, with one fix: `rls_auto_enable()` is created by the Supabase platform, not FLOVA migrations, so the original unguarded `REVOKE` broke the local DB test harness. It is now wrapped in `IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL`.

### 5.2 ACL impact

| Object | Before | After |
|---|---|---|
| 5 Phase 16 tables | `postgres, anon, authenticated, service_role = arwdDxtm` | anon removed; others unchanged |
| `check_daily_transaction_limit`, `sync_invoice_settlement`, `sync_wish_contribution` | `PUBLIC, postgres, anon, authenticated, service_role = X` | `postgres, authenticated, service_role = X` |
| `handle_new_user`, `rls_auto_enable` | same as above | `postgres, service_role = X` |

### 5.3 Trigger safety (verified, not assumed)
New test-db cases revoke EXECUTE on `check_daily_transaction_limit` and `sync_wish_contribution` from **every** API role, then write as `authenticated`: the wish sync trigger updated `saved_amount` and the ₹10 lakh daily limit still rejected an over-limit insert. PostgreSQL checks EXECUTE only at `CREATE TRIGGER` time and on direct calls. No frontend code calls `.rpc()`.

### 5.4 Dry-run
```
npx supabase db push --remote=msjzkylvafuwlkkujxpv --dry-run
Would push these migrations:
 • 20261123150000_harden_anon_and_triggers.sql
```

### 5.5 Apply command (approved by user, executed 2026-11-23)
```bash
cd backend && npx supabase db push --remote=msjzkylvafuwlkkujxpv --yes
```

### 5.6 Rollback (exact inverse, only what the migration changed)
The previous plan's rollback omitted `MAINTAIN` (the `m` in `arwdDxtm` on PG17); corrected here and in `remote-remediation-plan.md`.

```sql
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON
  public.invoices, public.invoice_items, public.invoice_settlements,
  public.wish_goals, public.wish_contributions
TO anon;
GRANT EXECUTE ON FUNCTION public.check_daily_transaction_limit(),
  public.sync_invoice_settlement(), public.sync_wish_contribution() TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user(), public.rls_auto_enable()
  TO PUBLIC, anon, authenticated;
```
Then `npx supabase migration repair --status reverted 20261123150000 --remote=msjzkylvafuwlkkujxpv`. ACL entry order may differ after re-grant; privileges are identical.

### 5.7 Post-migration verification (2026-11-23)
- `db push --yes` output: `Applying migration 20261123150000_harden_anon_and_triggers.sql... Finished supabase db push.`
- `migration list --remote`: 8/8 versions local = remote (7 baseline + `20261123150000`).
- Phase 16 tables: `{postgres, authenticated, service_role = arwdDxtm}`; anon removed. Core 5 tables unchanged.
- `check_daily_transaction_limit`, `sync_invoice_settlement`, `sync_wish_contribution`: `{postgres, authenticated, service_role = X}`.
- `handle_new_user`, `rls_auto_enable`: `{postgres, service_role = X}`.
- Untouched (out of scope, SECURITY INVOKER): `set_updated_at`, `payouts_guard_received`, `sync_payout_received`, `transactions_sync_payout` still allow PUBLIC/anon EXECUTE; RLS and missing anon table grants make that harmless.
- Triggers `on_auth_user_created`, `transactions_daily_limit_trigger`, `invoice_settlements_sync_trigger`, `wish_contributions_sync_trigger` and event trigger `ensure_rls`: enabled.
- Live REST probe with the anon key: `GET /rest/v1/invoices`, `/wish_goals`, `/transactions` all return `42501` permission denied.
- Not yet checked live: an authenticated write through each trigger (covered by local PGlite tests; to be exercised in production QA §1.6).

## 6. Open items and blockers

1. ~~CP2~~: done (§5.7).
2. ~~CP3~~: done (§7).
3. **Commit + push**: Vercel builds from GitHub, so the production fixes (incl. `frontend/vercel.json`) must be committed to `dev`, merged to `main` and pushed. Needs approval.
4. **Vercel**: needs the user to create/import the project (root `frontend`, build `npm run build`, output `dist`, env `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`/`VITE_SUPABASE_ANON_KEY`), and the Supabase Auth Site URL / redirect URLs updated to the Vercel domain.
5. **STT decision**: keep Groq-Whisper-only in production for now, or host IndicConformer (Render/Railway) and set `INDICCONFORMER_URL` + `INDICCONFORMER_KEY` secrets.
6. **Default privileges**: decide whether to change `pg_default_acl` so future tables don't grant anon.
7. **E2E QA** on the deployed site with a dedicated test account and fictional data.

## 7. Checkpoint 3: Edge Function deployment (2026-11-23)

### 7.1 Pre-deploy backup
Deployed source downloaded with `supabase functions download --use-api --workdir <scratch>` (local files untouched). Both files were byte-identical to `HEAD` (`b60b212`), so the rollback target is exactly the committed code.

### 7.2 Deploy
```bash
cd backend && npx supabase functions deploy extract-receipt process-voice --remote=msjzkylvafuwlkkujxpv --use-api --yes
```
Result: `process-voice` v7 → **v8**, `extract-receipt` v11 → **v12**, both `ACTIVE`, `verify_jwt=true`. Re-downloaded live source is byte-identical to the local working-tree files.

### 7.3 Unauthorized probes (both functions)

| Request | Result | Layer |
|---|---|---|
| No `Authorization` header | 401 | Gateway (`verify_jwt`) |
| Anon key as bearer | 401 `Unauthorized. Invalid or expired user token.` | Function's own `getUser` check (anon bypass closed) |
| Forged JWT (bad signature) | 401 `UNAUTHORIZED_LEGACY_JWT` | Gateway |
| CORS preflight `OPTIONS` | 200 | — |

### 7.4 Authenticated check: passed
Production had no dedicated test account, so `backend/scripts/edge-smoke.mjs` (`npm run test:edge-smoke`) was added and run by the user with their own account (credentials prompted, password hidden, not recorded). Fictional inputs only; Edge Functions return candidates and write nothing to the database.

```
PASS process-voice: HTTP 200 candidates=2 keys=transcript,stt_provider,extraction,candidate,candidates
PASS extract-receipt: HTTP 200 keys=candidate,rawText
All authenticated Edge Function checks passed
```
`process-voice` returned 2 candidates for "got 650 from a delivery payout, spent 120 on petrol" (one income, one expense). Audio transcription (Groq Whisper path) was not exercised here; it is covered in production QA §1.6.

### 7.5 STT in production
No `INDICCONFORMER_URL` / `INDICCONFORMER_KEY` secrets, so `process-voice` skips IndicConformer and uses Groq Whisper. Both code paths remain in the deployed function.

### 7.6 Rollback
```bash
git worktree add --detach ../flova-baseline b60b212
cd ../flova-baseline/backend && npx supabase functions deploy extract-receipt process-voice --remote=msjzkylvafuwlkkujxpv --use-api --yes
cd - && git worktree remove ../flova-baseline
```
