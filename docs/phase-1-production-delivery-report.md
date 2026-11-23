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
| 1.4 Vercel | **Deployed and verified 2026-11-23** | https://myflova.vercel.app from `main` (§8); Supabase Auth URLs updated (§8.3) |
| 1.5 STT service | Decision pending | Remote has no IndicConformer URL/key; voice uses Groq Whisper |
| 1.6 Production E2E QA | **Passed 2026-11-23 after 4 fixes (all deployed)**; mic audio and offline still manual | §9 |

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
3. ~~Commit + push~~: done. `dev` cf2fbe6, `main` 1bcf45c (`--no-ff`); GitHub default branch switched to `main`.
4. ~~Supabase Auth URLs~~: done (§8.3).
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

## 8. Vercel deployment (2026-11-23)

### 8.1 Project
- Vercel project `flova`, imported from `syed-imadulla/FLOVA`, branch `main`, root `frontend`, Vite preset with default build (`npm run build`), output (`dist`) and install (`npm install`). Supabase Marketplace integration intentionally not added (existing project; avoids extra server-side env vars).
- Production domain: **https://myflova.vercel.app** (`flova.vercel.app` was taken). `flova-khaki.vercel.app` redirects with 307, path preserved.

### 8.2 Verification

| Check | Result |
|---|---|
| `http://` → `https://` | 308 permanent redirect |
| HSTS | `max-age=63072000; includeSubDomains; preload` |
| Direct navigation: `/`, `/login`, `/dashboard`, `/add`, `/checkin`, `/payouts`, `/invoices`, `/onboarding`, `/catch-receipt`, unknown path | All 200 with the app shell (`vercel.json` rewrite) |
| Static files `favicon.svg`, `icon-192.png`, `manifest.webmanifest`, `sw.js` | Served as real files with correct content types |
| Deployed JS asset names vs local build | Identical (`index-gdmFKkLQ`, `supabase-34S9942t`, `vendor-BNqLSrbZ`) |
| Secret scan of deployed JS | Only JWT is role `anon` for `msjzkylvafuwlkkujxpv`; no service-role, Groq or IndicConformer keys |
| Supabase host in bundle | `https://msjzkylvafuwlkkujxpv.supabase.co` only |
| Browser: landing page | Renders; console shows only `Service Worker registered`; no errors |
| Browser: `/dashboard` while signed out | Redirects to `/login`; no errors |

Not yet verified on the deployed site: sign-up, login, data writes and voice/receipt flows. These are covered by production QA (§1.6).

### 8.3 Supabase Auth URL configuration (2026-11-23, user-approved)
Before: `site_url = "http://localhost:5173"`, `additional_redirect_urls = []`, so sign-up confirmation emails linked to localhost.

Method: `supabase config pull` into a scratch workdir (repo untouched), edit only the two fields, `config diff` showed exactly 2 changes, then `config push --yes`. Push result: `auth` updated (`additional_redirect_urls`, `site_url`); api, db, storage unchanged. A fresh pull matches the intended config.

After:
```toml
site_url = "https://myflova.vercel.app"
additional_redirect_urls = ["https://myflova.vercel.app/**", "http://localhost:5173/**"]
```
Rollback: same push with the previous two values.

## 9. Production end-to-end QA (2026-11-23)

Environment: https://myflova.vercel.app (build from `main` 1bcf45c), Claude desktop built-in browser, dedicated QA account created by the user (password typed by the user only). All amounts fictional.

### 9.1 Results

| Area | Test | Expected | Result |
|---|---|---|---|
| Auth | Signed-out `/dashboard` | Redirect to `/login` | PASS |
| Auth | Sign-up, sign-in, session survives reloads | Session kept | PASS (only console errors were 2× 400 from a mistyped sign-in password before QA started) |
| Onboarding | Delivery, weekly pay, COD on, ₹200 living + ₹150 work | Saved, home loads | PASS |
| Check-in | Cash 1,500, bank 3,000, COD 800 | Available ₹3,700; ₹800 held | PASS (preview and saved value) |
| Budget | Daily budget | ₹350 | PASS |
| Runway | Weekly payer, no bills | 7-day protection window (`adaptiveBuffer.ts:54`) | PASS |
| Expense | ₹120 fuel, work | −₹120 | PASS |
| Income | ₹650 delivery earnings | +₹650 | PASS |
| Not-mine | ₹500 COD collection, "isn't mine" | Held ₹1,300, available unchanged, not in Earned | PASS: available ₹4,230, held ₹1,300, earned ₹650 |
| Payout | Expected ₹3,800 on 27 Nov | Not counted in available | PASS |
| Partial settlement | Received ₹2,000 of ₹3,800 | Available ₹6,230, ₹1,800 still expected | PASS |
| Bill | Rent ₹4,500 due 28 Nov | Shortfall on 28 Nov (6,230 − 230 − 4×350 = 4,600 < 4,500 + 350) | PASS: "Possible shortfall in 5 days, 28 Nov" |
| Invoice | Create receivable ₹5,000 | Saved | **FAIL → fixed locally** (§9.2) |
| AI text (Hinglish) | "aaj khane pe 180 rupaye kharch kiye" | Review screen, nothing saved before confirm | PASS: ₹180, Food, Living, 2026-11-23 (IST); confirmed → available ₹6,050 |
| SMS/UPI text | Fictional bank SMS ₹240, "22-11-2026" | Review screen | PASS: ₹240, Fuel, Work, 2026-11-22 |
| AI reject | Discard the SMS suggestion | Nothing saved | PASS: available unchanged |
| Receipt photo (vision) | Generated fictional receipt image, ₹630, 21/11/2026 | Review with items | PASS: ₹630, Groceries, Living, 2026-11-21, 3 line items |
| Back-dated entry | Receipt dated before check-in | Counted in monthly spend, not subtracted from check-in balance | PASS: spent ₹930, available stays ₹6,050 (`data.ts:171-173` + `balance.ts:108-111`) |
| ₹10 lakh daily limit | Income ₹9,99,000 with ₹2,950 already today | Rejected by DB trigger, nothing saved | PASS: "Daily transaction limit of ₹10,00,000 exceeded … existing ₹2950.00" (trigger works after CP2 revokes) |
| Isolation | REST with QA session on 7 tables | Only own rows | PASS (14 users in DB; QA sees only its own) |
| Isolation | Insert as another `user_id` | Refused | PASS: 403 `42501` |
| Isolation | PATCH rows where `user_id <> me` | 0 rows | PASS |
| Mobile 375 px | 11 screens | No horizontal overflow | PASS; 2 tap targets < 32 px (info icon, "See all") noted for Phase 2 |
| Direct navigation / refresh | Every screen reloaded directly | App shell + session kept | PASS |

### 9.2 Bug found: invoice creation failed in production
- Symptom: "Failed to create invoice: new row for relation "invoices" violates check constraint "invoices_status_check"".
- Cause: `frontend/src/services/invoices.ts` inserted `status: "draft"`; the DB allows `uploaded, unpaid, partially_paid, paid, overdue, cancelled` (and the app's own `InvoiceStatus` type has no `draft`). The unit test asserted `"draft"` against a mock with no CHECK constraint, so it never failed.
- Not caused by CP2 (a permission error would be `42501`).
- Fix: insert `status: "unpaid"` (DB default, starting state for the settlement trigger). Tests updated; new test 8 reads the allowed statuses from the migration SQL and fails on the old code (`status "draft" must be one of …`). All 17 frontend service suites pass; `tsc` clean.
- Other hard-coded enum values (`scheduled`, `bill`, `upcoming`, `active`) checked against the DB: all valid.
- **Status: deployed** (`main` d6079cc, bundle `index-COubbUhj.js`). Production re-test: "Invoice created: ₹5,000", outstanding ₹5,000. PASS.

### 9.2b Bugs found during the re-test: columns that do not exist
- Recording an invoice payment failed in production: "Could not find the 'payment_reference' column of 'invoice_settlements'". Nothing was saved.
- A new schema-conformance test (`frontend/src/services/__tests__/schemaConformance.test.ts`) parses every table/column from the migrations and every `.insert/.update/.upsert` in the frontend, and found one more: `wish_goals.reward_note` (WISH goal creation; the WISH service is not yet wired to any screen, so no user impact today).
- Both columns confirmed absent on the live database (read-only `information_schema` query).
- Fix (frontend only, no DB change): settlement references are stored in `notes` (`notes · reference`); `reward_note` removed from the WISH insert and input type.
- All frontend service suites (18, including the new conformance test) and engine suites pass; `tsc` clean.
- **Status: deployed** (`main` 4a2457f, bundle `index-Dd8HdVGR.js`). Production re-test: the settlement saved (note stored in `notes`). PASS for the column fix, but see §9.2c.

### 9.2c Bug found: typed payment amount silently truncated (financial correctness)
- Re-test: QA typed ₹1,500 into the payment field, which is pre-filled with the outstanding `5000.00`. The click put the cursor inside the pre-filled text, giving something like `5000.001500`. The app recorded **₹5,000** and marked the invoice paid (confirmed in the DB: one settlement of 5000, invoice `paid`). Fictional QA data only.
- Root cause: `toPaise` (`frontend/src/lib/money.ts`) drops digits after the 2nd decimal place by design (safe for DB values, which are numeric(12,2)). Every other money form validates typed text with `parseRequiredRupees` first ("Cannot have more than 2 decimal places"); `InvoicesScreen` did not, for either invoice totals or payments.
- Fix: `InvoicesScreen` validates both amounts with `parseRequiredRupees` and passes exact paise; payments above the outstanding amount are refused with a clear message; new `toPaiseStrict` rejects >2 decimals in the invoice and WISH services' rupee-string paths.
- Test 9 in `invoiceIntelligence.test.ts` fails on the previous code with exactly this symptom and passes with the fix. All frontend suites pass; `tsc` clean; build passes.
- **Status: deployed** (`main` 38f48a1, bundle `index-BOhggNz-.js`). Production re-test on new invoice QA-002 (₹5,000):

| Step | Result |
|---|---|
| Click into pre-filled field and type 1500 (field = `5000.001500`) | Refused: "Cannot have more than 2 decimal places"; nothing saved. PASS |
| Select field, enter 1500 | "Recorded payment of ₹1,500"; outstanding ₹3,500, paid 30%. PASS |
| Pay ₹4,000 against ₹3,500 outstanding | Refused: "Payment is more than the ₹3,500 still outstanding." PASS |
| Available money after invoices and payments | Unchanged at ₹6,050 (invoices are not liquid money). PASS |

QA-001 keeps the accidental ₹5,000 settlement from the bug as fictional test data.

### 9.2d Logout
- "Sign out" on `/more` → `/login`, Supabase session removed from storage, `/dashboard` redirects to `/login`. PASS

### 9.2e WISH
- The WISH screen persists through `src/wish/wishService.ts`, whose writes pass the schema-conformance test. `src/services/wish.ts` (fixed in §9.2b) is not used by any screen. WISH was not exercised live in this QA pass.

### 9.3 Not covered yet (manual)
- Real microphone audio → Groq Whisper. The Claude desktop browser pane blocks microphone access, so this needs one spoken sentence on `/voice` in a normal browser or phone. The typed path through the same LLM passed.
- Offline / slow-network behaviour (the built-in browser cannot throttle).
- WISH goal create/contribute live.

### 9.4 QA summary
- 4 production bugs found and fixed, each with a regression test that fails on the old code: invoice status `draft` (create failed), `invoice_settlements.payment_reference` (payment failed), `wish_goals.reward_note` (latent), typed invoice amount truncation (wrong amount recorded).
- New guard: `schemaConformance.test.ts` checks every frontend write against the migrations, closing the mock-database blind spot that hid three of the four.
- All core money flows (check-in, income, expense, not-mine, payouts, partial settlement, bills/runway, AI text/SMS/receipt with confirm and discard, ₹10 lakh limit, isolation, mobile, logout) pass on production.


## 10. IndicConformer Step 0 (2026-11-23)

Plan: `docs/indicconformer-production-plan.md`. Finding: the STT service had no real inference (the ONNX decode returned a fixed Kannada "₹300 petrol" sentence for any audio), model weights were never present, the Phase 17 benchmark was mock output, and the service fell back to a public hard-coded key and accepted any caller when no key was set.

Fixes (`main` 80e0f59): decoder raises → service returns 503 (Groq Whisper fallback); no default `FLOVA_STT_INTERNAL_KEY`, unset key → 503, constant-time key compare; `process-voice` calls IndicConformer only when both `INDICCONFORMER_URL` and `INDICCONFORMER_KEY` are set; CLAUDE.md, VOICE-STT.md, ENVIRONMENT.md, DEPLOYMENT.md corrected; benchmark file labelled mock. 4 new Python tests (28 total pass); the fake-transcript test fails on the old code. `make test` passes.

Redeploy (user-approved): live `process-voice` v8 backed up first (identical to `1bcf45c`), deployed **v9** (`verify_jwt=true`). Live source equals the repo; old key string absent. Probes: no auth 401, anon key 401 (function check), forged JWT 401 (gateway). Authenticated smoke test (user run, sign-in 11:26:14 UTC, after v9 deployed at 11:23:47 UTC): `PASS process-voice: HTTP 200 candidates=2`, `PASS extract-receipt: HTTP 200`. Voice continues on Groq Whisper (IndicConformer not configured).

Rollback: redeploy `process-voice` from `1bcf45c` in a temporary worktree (§7.6).
