# Phase 7 Plan 01 Summary: Financial Data Contracts & Timeline Helpers

## Outcome
Extended FLOVA's shared data contracts and data service helpers to support AI receipt extraction (FLOVA Catch), voice transaction capture, and unified chronological activity timelines without altering underlying database schema or violating RLS.

## Key Implementation Details
1. **Candidate Models (`frontend/src/types/contracts.ts`)**:
   - `ExtractedReceiptCandidate`: Supports missing/uncertain data representation (`amountPaise: Paise | null`, `needsReview: boolean`, `missingFields: string[]`). Never fabricates financial figures.
   - `VoiceTransactionCandidate`: Represents unstructured voice intent with truthful optionality (`type: TransactionType | null`, `amountPaise: Paise | null`, `expenseType: ExpenseType | null`).
   - `ActivityItem`: Unifies transactions and balance check-ins into a single chronological feed for Phase 10 screens.

2. **Check-in Segregation & Timeline Helper (`frontend/src/services/data.ts`)**:
   - `listActivityTimeline(opts)`: Fetches transactions and balance check-ins, merges them deterministically by timestamp descending.
   - Check-ins are given `kind: "checkin"` and `type: "checkin"`. Root `amountPaise` is omitted so callers/UI components never tally check-in cash/bank as income or expenses.
   - Payout receipts are flagged with `kind: "payout_receipt"` and link `payoutId`.

3. **Safe Candidate Confirmation (`frontend/src/services/data.ts`)**:
   - `confirmCandidateTransaction(candidate)`: Validates that essential financial values exist before writing to the database.
   - Missing or non-positive amounts throw an explicit user-review error.
   - Expenses (both receipt and voice) require explicit living vs work categorization (`expenseType`).
   - Retains client-generated UUID for full idempotency across retries.

4. **Automated Unit Tests (`frontend/src/services/__tests__/activityContracts.test.ts`)**:
   - 10 comprehensive unit tests verifying chronological sorting, check-in segregation, payout receipt identification, limit slicing, candidate confirmation, and validation errors for missing fields.
