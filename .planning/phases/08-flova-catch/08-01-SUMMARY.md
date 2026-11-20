# Phase 8 Plan 01 Summary: Secure FLOVA Catch (Receipt Extraction)

## Outcome
Implemented and verified the end-to-end receipt extraction flow (FLOVA Catch) using Groq via a secure Supabase Edge Function (`extract-receipt`). The service outputs truthful `ExtractedReceiptCandidate` structures, never fabricates missing financial figures, requires explicit user confirmation, and preserves idempotency without exposing API keys in frontend client bundles.

## Key Implementation Details
1. **Supabase Edge Function (`backend/supabase/functions/extract-receipt/index.ts`)**:
   - Strictly server-side inference using `Deno.env.get("GROQ_API_KEY")`.
   - Validates caller authentication via Supabase Auth JWT (`Authorization: Bearer <token>`).
   - Uses Groq's verified models:
     - `llama-3.2-11b-vision-preview` for image receipts (base64 Data URL).
     - `llama-3.3-70b-versatile` for pasted text / SMS receipts.
   - Enforces JSON mode (`response_format: { type: "json_object" }`).
   - Converts amount to integer paise (`Math.round(amount_rupees * 100)`).
   - Truthful uncertainty: If amount is unreadable, sets `amountPaise: null`, `needsReview: true`, and lists missing fields.
   - Strictly read-only: does NOT insert, update, or delete any database rows.

2. **Frontend Service Wrapper (`frontend/src/services/receipt.ts`)**:
   - `extractReceipt({ file, text })`: Converts file to base64 with 5MB validation.
   - Invokes `supabase.functions.invoke("extract-receipt")`.
   - Assigns a client idempotency UUID (`crypto.randomUUID()`) to the candidate.

3. **FLOVA Catch UI Page (`frontend/src/pages/FlovaCatchPage.tsx`)**:
   - Route `/catch` registered with `RequireAuth` and `RequireOnboarded`.
   - Dual input tabs: "Photo / Image Upload" (with camera capture) and "Paste Text / SMS".
   - Candidate review & edit form:
     - Pre-fills detected values (Merchant, Amount in ₹, Date, Category, Description).
     - Displays missing field alert banner when `needsReview` is true.
     - Enforces living vs work classification (`expenseType`).
     - "Confirm & Save" calls `confirmCandidateTransaction()`.
     - "Discard" clears the draft without saving to the database.

4. **Automated Unit & Regression Tests (`frontend/src/services/__tests__/receiptExtraction.test.ts`)**:
   - 8 comprehensive test scenarios covering valid extraction, missing amount uncertainty, unreadable receipts, read-only guarantees before confirmation, discard behavior, candidate editing, idempotency UUID retention across retries, and upstream API error handling.
