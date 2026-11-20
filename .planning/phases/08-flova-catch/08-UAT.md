# Phase 8 UAT: Secure FLOVA Catch (Receipt Extraction)

## User Acceptance Criteria & Results

| # | Acceptance Criterion | Test Method | Result | Evidence |
|---|----------------------|-------------|--------|----------|
| UAT-8.1 | Secure Edge Function name is consistently `extract-receipt`. | Inspection & test suite | PASS | Edge Function path: `backend/supabase/functions/extract-receipt/index.ts`. Client invokes `"extract-receipt"`. |
| UAT-8.2 | Groq is used exclusively through Edge Function (Zero Gemini, Zero frontend keys). | Edge Function code & bundle scan | PASS | `llama-3.2-11b-vision-preview` & `llama-3.3-70b-versatile` used in Edge Function. `grep` on `dist/` confirms zero secrets. |
| UAT-8.3 | Authenticated user JWT validation enforced. | Edge Function JWT verification check | PASS | Function checks `Authorization` header and validates token with `supabase.auth.getUser()`, returning `401` on invalid tokens. |
| UAT-8.4 | Aligned with Phase 7 `ExtractedReceiptCandidate` using `description`, not `notes`. | Contract typing in `contracts.ts` & `data.ts` | PASS | `ExtractedReceiptCandidate` uses `description: string | null` directly matching `Transaction.description`. |
| UAT-8.5 | Extraction is strictly read-only and creates zero transaction rows before confirmation. | `receiptExtraction.test.ts` (Scenario 4) | PASS | Calling `extractReceipt()` inserts 0 rows into `public.transactions`. |
| UAT-8.6 | Truthful uncertainty: missing amounts produce `amountPaise: null` and flag `needsReview: true`. | `receiptExtraction.test.ts` (Scenario 2 & 3) | PASS | Unclear totals never fabricate numbers; `needsReview: true` and `missingFields: ["amount"]`. |
| UAT-8.7 | User can edit candidate fields before confirmation. | `receiptExtraction.test.ts` (Scenario 6) | PASS | User fills missing amount, selects work/living, saves as verified transaction. |
| UAT-8.8 | User rejection discards draft without touching database. | `receiptExtraction.test.ts` (Scenario 5) | PASS | Discarding candidate leaves database transaction count at 0. |
| UAT-8.9 | Retrying confirmation preserves candidate UUID for idempotency. | `receiptExtraction.test.ts` (Scenario 7) | PASS | Candidate UUID preserved across retries, resolving duplicate key violations via Phase 5 recovery. |
| UAT-8.10 | Frontend TypeScript and production build compile with zero errors. | `npm run build` (`tsc -b && vite build`) | PASS | Production build completed in 2.18s with 0 errors. |
