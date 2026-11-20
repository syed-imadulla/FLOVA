---
last_mapped_commit: d8cfbb2900c410e8e3cca70f6675fa2b766588e0
last_mapped_at: 2026-11-20
---
# Codebase Concerns

**Analysis Date:** 2026-11-20

## Tech Debt

**Legacy Prototype in Frontend:**

- Issue: `frontend/src/App.tsx` and components currently rely on `frontend/src/api.ts` which targets a Python backend `/api` and stores `flova.rider` in `localStorage`.
- Files: `frontend/src/App.tsx`, `frontend/src/api.ts`, `frontend/src/components/RiderView.tsx`.
- Impact: Frontend is not yet wired to the Supabase Auth and database services built by M1.
- Fix approach: Phase 1 builds `AuthProvider` and `useSession` with protected routing; Phase 2-3 builds data hooks (`useProfile`, `useCheckin`, etc.) that M2 can bind UI to.

**ai-engine Python vs. TypeScript Engine:**

- Issue: `ai-engine/` contains Python code for the runway logic and backtest. M3 is responsible for porting/implementing the TypeScript engine in `frontend/src/engine/`.
- Files: `ai-engine/udaan_engine/`, `frontend/src/engine/`.
- Impact: M1 must provide `loadRunwayInput()` returning clean `RunwayInput` in integer paise so M3's engine can plug in seamlessly.
- Fix approach: Phase 4 wires `loadRunwayInput()` to M3's engine interface and validates with the Ravi fixture test.

## Security Considerations

**API Key Leakage Prevention:**

- Risk: Exposing Supabase service-role key or Gemini API key in client bundles.
- Current mitigation: `.env.example` documents that only publishable keys belong in `VITE_` variables. `frontend/src/lib/supabase.ts` throws if missing.
- Rule: Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` may be present in client code. Gemini AI calls must be routed via Vercel server-side functions.

**Row Level Security (RLS) Integrity:**

- Risk: Accidental bypass of user data isolation.
- Mitigation: RLS enabled on all 5 tables in `backend/supabase/migrations/20261120000100_init_schema.sql`. Continuous validation in `backend/scripts/test-db.mjs`.

## Fragile Areas

**Payout Synchronization Triggers:**

- Files: `backend/supabase/migrations/20261120000100_init_schema.sql` (`sync_payout_received`, `transactions_sync_payout`).
- Why fragile: Payout status transitions (`scheduled` -> `partial` -> `settled` and back on delete) depend on trigger order and depth guard.
- Safe modification: Any change to transaction or payout schema must update `backend/scripts/test-db.mjs` to verify all 22 tests pass.

**Check-in Cutoff Logic:**

- Files: `frontend/src/services/data.ts` (`loadRunwayInput`).
- Rule: Same-day check-in rule must compare `createdAt > checkedAt` so transactions already counted in the physical check-in are not double-counted.

## Missing Critical Features (To be delivered in Roadmap)

1. **Authentication Flow (Phase 1):** `AuthProvider`, `useSession`, login/signup/logout screens.
2. **Profile & Onboarding (Phase 2):** `useProfile`, onboarding fields, routing based on `onboarding_completed`.
3. **Data Capture Hooks (Phase 3):** Hooks for check-ins, transactions, payouts, commitments, history edit/delete.
4. **Runway Feed & Fixture (Phase 4):** Integration of `loadRunwayInput()` with M3 engine interface and Ravi test.
5. **Secure AI Function (Phase 5):** Server-side Gemini proxy on Vercel.
6. **Demo Data Seed (Phase 6):** Local test account seed script using service-role key.
7. **Production Deployment (Phase 7):** Vercel deployment and Supabase auth redirect configuration.
8. **Release Freeze (Phase 8):** Final verification and dev -> main merge.

---

*Concerns audit: 2026-11-20*
