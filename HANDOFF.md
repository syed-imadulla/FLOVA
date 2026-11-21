# FLOVA — Handoff & Full Context (2026-11-21)

Read this first. It covers what FLOVA is, how the code is organised, what is live, how to run, test
and deploy it, the rules that must not be broken, and what is still open. The written plan lives in
`.planning/` (ROADMAP.md, STATE.md, phases/).

---

## 1. Product

**FLOVA — "Every rupee has a story. FLOVA remembers."**
FLOVA is a voice-first money companion for people with irregular income: delivery riders, drivers,
freelancers, service and repair workers, small vendors, daily-wage workers and seasonal workers.
It answers one question honestly: *how much money do I really have, and how long will it last?*

Core principles. Do not break these.
1. Capture by voice, receipt or manual entry. **AI only suggests; the user confirms before anything is saved.**
2. **Financial maths is deterministic** TypeScript (`frontend/src/engine`). AI never calculates balances.
3. Personal money, money held for others (`ownership = not_mine`, e.g. COD), expected payouts and estimates are kept apart.
4. Never invent amounts, dates or classifications. A missing value stays `null` and blocks saving until the user fills it.
5. Supabase Auth plus RLS. The client never sends `user_id`; database defaults use `auth.uid()`.

Occupation (`work_profile`), income behaviour (`income_variability`) and payout timing (`payout_pattern`)
are three separate concepts. COD is **opt-in** (`handles_cod`, default false).

---

## 2. Stack & architecture

| Layer | What |
|---|---|
| Frontend | React 18, Vite 5.4.11, TypeScript 5.6, Tailwind 3, installable PWA (`public/manifest.webmanifest`, `public/sw.js`, network-first) |
| Auth / DB | Supabase Auth and Postgres with RLS. Project ref **`msjzkylvafuwlkkujxpv`** (name: `flova`) |
| Backend logic | Supabase Edge Functions only (no custom API server): `process-voice`, `extract-receipt` |
| AI | Groq, called only from the Edge Functions: Whisper for speech-to-text, a chat model for understanding, a vision model for receipt photos |
| Money | Postgres stores `numeric(12,2)` rupees; the app and engine use **integer paise**. Always convert with `frontend/src/lib/money.ts` (`toPaise`, `formatINR`, …) |
| Deploy target | Vercel (Phase 11, not done yet) |

---

## 3. Git state

- Only two branches exist: **`dev`** and **`main`**, both at `e8a0cf9` (Merge PR #21). All work is merged.
- **Day-to-day work and bug fixes go on `dev`.** Bring `main` up to date (fast-forward) when releasing.
- All old feature, backup and fix branches were deleted after confirming each one's content was already in `dev`.
- Merged PRs: #1–#14, #16, #18, #20 (consolidated #15 and #19), #21 (app shell, screens, AI). Closed as superseded: #15, #17, #19.
- No branch protection; the merge-commit policy is used for PRs.

---

## 4. Repository map

```
frontend/
  src/App.tsx                 routes: public (/, /login, /signup), /onboarding, then one persistent app layout
  src/app/AppLayout.tsx       authenticated shell and bottom navbar (Home · Activity · Mic · Insights · More)
  src/ui/kit.tsx, icons.tsx   UI kit: Screen, Card, Button, Field, MoneyInput, Segmented, Chip, Sheet, Notice, Skeleton, Splash…
  src/screens/                one file per screen (see §5)
  src/app/                    shared app pieces: TransactionForm, ActivityRow, categories, profileLabels,
                              useActivity, useMonthSummary, moneyText
  src/services/data.ts        ALL Supabase reads/writes (addTransaction, confirmCandidateTransaction, receivePayout,
                              listActivityTimeline, loadRunwayInput, …)
  src/services/voice.ts       processVoice() → Edge Function, local fallback; resolveFinancialQuery()
  src/services/receipt.ts     extractReceipt() → Edge Function
  src/engine/                 deterministic runway/balance engine and M3 extraction contracts and adapters (tests in __tests__)
  src/runway/                 useRunway() hook and adapter (engine result → UI shape, incl. safe buffer fields)
  src/data/                   data hooks (useTransactions, usePayouts, useCommitments, useLatestCheckin) and DataVersionProvider
  src/voice/                  useSpeechToText (browser speech recognition, 10 languages), useAudioRecorder (Whisper path),
                              extractTransaction (local multilingual fallback: en/hi/kn/ta/te/ur)
  src/wish/                   WISH savings goal (localStorage only — see open issues)
  src/components/landing/     public landing page (FlovaNavbar rebuilt in 10.2)
  src/components/*.tsx        older prototype components (RiderView, HeroSection, …): not routed, candidates for removal
backend/
  supabase/migrations/        5 migrations (all applied on the hosted project — see §8)
  supabase/functions/         process-voice/index.ts, extract-receipt/index.ts
  scripts/                    test-db.mjs (PGlite schema/RLS), seed-demo.mjs, rls-live-check.mjs, payout sync tests
ai-engine/                    extraction contract docs
.planning/                    GSD: PROJECT, REQUIREMENTS, ROADMAP, STATE, phases/<n>/ plans and summaries
graphify-out/                 knowledge graph (commit it; rebuilt whole each time, large diffs are expected)
```

---

## 5. Screens (all inside the bottom-navbar layout)

| Route | Screen | Notes |
|---|---|---|
| `/app` | Home | Available money (engine), today's budget, shortfall/cushion status, quick actions, "This month" card, recent activity |
| `/activity` | Activity | Filters, grouped by day, tap to edit or delete (delete asks for confirmation) |
| `/voice` | Add by voice | Voice/Type tabs, language chips (Auto, en, hi, kn, ta, te, ml, mr, bn, gu, ur), live transcript |
| `/add` | Add / Review | **The only confirm path** for manual, voice and receipt entries (router state `ReviewState`) |
| `/catch` | Scan receipt | Photo or pasted SMS → `extract-receipt` → `/add` review |
| `/checkin` | Balance check-in | Cash, bank, held-for-others. Voice can pre-fill it |
| `/insights` | Runway · Month · Insights | `?tab=month` opens the monthly income/expense timeline |
| `/payouts` | Expected payments | Mark received (idempotency id per sheet) and cancel. Voice can pre-fill |
| `/commitments` | Bills & debts | Mark paid, optionally recording the expense |
| `/wish` | WISH | Savings goal |
| `/more` | More | Links to everything, plus sign out |
| `/profile` | Profile & settings | Work, variability, payout timing, COD, daily estimates, safety cushion |
| `/onboarding` | Onboarding | Pre-app; sets `onboarding_completed` |

Old URLs redirect: `/dashboard → /app`, `/history`, `/transactions → /activity`, `/overview → /insights`,
`/settings → /profile`, `/plan → /commitments`.

---

## 6. Rules the code relies on (keep them)

- **Candidate identity:** each review screen fixes one UUID for its lifetime (`AddScreen` `useState(() => id)`), so pressing Confirm again after a network error never creates a duplicate. `addTransaction` treats a primary-key conflict with identical data as success.
- **Refresh after writes:** every mutation calls `useDataVersion().bump()` (directly or through the data hooks), so runway, lists and month totals reload.
- **Validation:** `TransactionForm` blocks saving without an amount, category, or (for own expenses) living/work. Category hints never auto-select living/work.
- **Safe runway buffer:** spendable = `max(0, confirmed − buffer)`. The confirmed balance is never reduced. `firstBufferShortfallDate` and `firstShortfallDate` are separate.
- **CSS:** `styles.css` still has legacy global element rules, scoped with `:where(:not(.flova-app *, .flova-landing *))`. New app UI must sit under `.flova-app` (AppLayout, Splash, Onboarding do this) or the legacy rules leak in.
- **No flicker:** the bottom navbar mounts once, screens have no entry animation, and loading uses fixed-size skeletons.
- **Graphify:** before exploring code, run `graphify query "<question>"`; after changing code, run `graphify update .` (see CLAUDE.md).

---

## 7. AI layer (Edge Functions)

- **`process-voice`**: input `{ text? | audioBase64?, mimeType?, language?, candidateId }`. Audio → Whisper → chat model → `FinancialExtractionDTO` plus candidate (keeps `candidateId`). Intents: `transaction`, `expected_payout`, `balance_checkin`, `financial_query`.
- **`extract-receipt`**: input `{ imageBase64? | text?, mimeType? }` → `ExtractedReceiptCandidate` (always `receipt_reported`).
- **Model selection is self-healing.** Each function lists the models the key can use and tries a preference list: chat prefers `openai/gpt-oss-120b`, vision prefers Llama 4 Maverick/Scout, speech prefers `whisper-large-v3-turbo`. It moves to the next model on 404/403/429 or "model not found / decommissioned". Optional secrets `GROQ_CHAT_MODEL`, `GROQ_VISION_MODEL` and `GROQ_STT_MODEL` pin a model.
- **Dates:** the prompt includes today's date in India, so "today", "yesterday" and weekday names become real dates.
- **Client fallback:** when the function fails, `processVoice` uses the local extractor, and the UI shows "FLOVA AI is offline" or "basic on-device matching".
- **Speech path on phones:** the browser's speech recognition turns speech into text (language from the chip), and the text goes to `process-voice`. Browsers without speech recognition record audio and use Whisper.

**Live-verified 2026-11-21** (deployed version): English, Tamil, Hindi, Kannada and Telugu transactions; "Swiggy payout 2000 coming on Friday" → payout due 2026-11-27; "Yesterday spent 80 on tea" → 2026-11-20; a balance query; receipt text (₹1,200 Sharma Kirana).

### Deploying functions
```bash
npx supabase functions deploy process-voice extract-receipt --project-ref msjzkylvafuwlkkujxpv --workdir backend --use-api
```
`--use-api` skips Docker. Add `--yes` to run without the prompt. Each function's helper code lives inside its own `index.ts`, because shared imports were not reliably uploaded with `--use-api`.

### Secrets
`GROQ_API_KEY` is set on the project. **Action needed: the current key was typed in plain text in a terminal and is in shell history — revoke it at console.groq.com and set a new one with a hidden prompt:**
```bash
read -rsp "Groq API key: " GROQ_KEY && echo && npx supabase secrets set GROQ_API_KEY="$GROQ_KEY" --project-ref msjzkylvafuwlkkujxpv; unset GROQ_KEY
```

---

## 8. Database

Migrations in `backend/supabase/migrations`. All five are **confirmed applied** on the hosted project (checked
2026-11-21 via `information_schema`: `work_profile` default `'other'`, `income_variability` default `'variable'`,
`handles_cod` default `false`, `safe_runway_buffer` nullable). `20261121000200` adds the enum values and columns;
`20261121000201` sets the default. They are split to avoid Postgres error 55P04. Never re-run migrations by hand
without checking first.

---

## 9. Run, test, build

Env files (git-ignored): `frontend/.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`),
`backend/.env.local`. Node 24.

```bash
cd frontend && npm install && npm run dev
```
```bash
cd frontend && npm run build
```
Tests (from `frontend/`):
```bash
node --experimental-strip-types --no-warnings --experimental-loader ./src/engine/__tests__/loader.mjs src/engine/__tests__/runTests.ts
```
```bash
for f in src/services/__tests__/*.test.ts; do node --experimental-strip-types --no-warnings --experimental-loader ./src/services/__tests__/mockLoader.mjs $f; done
```
Also with the engine loader: `src/profile/__tests__/parseRupees.test.ts`, `src/data/__tests__/dates.test.ts`,
`src/runway/__tests__/ravi.test.ts`, `src/wish/__tests__/wish.test.ts`. Backend (from `backend/`):
`npm run test:db`, `npm run test:seed`.

**Last verified on `dev` (e8a0cf9):** engine 113/113 · services 76/76 · parseRupees, dates, ravi, wish pass ·
test:db 39/39 · test:seed 17/17 · production build passes. Every screen was checked in a browser at 375px.

Phone testing: serve a production build (`npm run preview -- --port 4173`) and expose it with
`cloudflared tunnel --url http://localhost:4173` (gives an HTTPS link; HTTPS is required for the microphone).

---

## 10. Open issues / next work

1. **Rotate the Groq API key** (see §7). Security.
2. **WISH is stored in localStorage only.** It needs a `wishes` table, RLS and a migration to sync across devices.
3. **Not yet verified on a real phone:** speaking into the mic, and receipt **photo** extraction. Text and receipt-text paths are verified.
4. **Groq free tier:** about 8k tokens/min per model. Model fallback helps; a paid tier or a shorter prompt would fix it properly.
5. Receipt category is sometimes broader than ideal (e.g. "food" for groceries). The user can correct it in review.
6. Older unrouted prototype components in `frontend/src/components/*.tsx` (RiderView, HeroSection, LandingSections, …) and `src/api.ts` are probably dead code. Verify and remove.
7. Full UI translation (beyond voice language) is not done. Dark mode is not done (the app renders light).
8. Roadmap: **Phase 11 Deployment readiness** (Vercel SPA config, production env vars, Supabase auth redirect URLs) and **Phase 12 Final verification** are pending.
9. The bundle is about 500 kB+, so Vite warns. Route-level code splitting would help.
