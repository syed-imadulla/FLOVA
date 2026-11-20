# Phase 7 UAT: Financial Data Contracts & Timeline Helpers

## User Acceptance Criteria & Results

| # | Acceptance Criterion | Test Method | Result | Evidence |
|---|----------------------|-------------|--------|----------|
| UAT-7.1 | Activity timeline must distinguish check-ins from financial transactions. Check-ins must not be treated as income or expenses. | `activityContracts.test.ts` (Test 2) | PASS | Checkin items have `kind: "checkin"`, `type: "checkin"`, no root `amountPaise`, and maintain balance snapshots. |
| UAT-7.2 | Timeline merges transactions and check-ins chronologically. | `activityContracts.test.ts` (Test 1 & 4) | PASS | Items sorted descending by timestamp. `limit` parameter limits total returned rows. |
| UAT-7.3 | Receipt candidates support missing/uncertain information without inventing financial data. | `activityContracts.test.ts` (Test 6) | PASS | Missing amount candidate has `amountPaise: null`, `needsReview: true`, `missingFields: ["amount"]`. Confirmation throws without user correction. |
| UAT-7.4 | Living vs work expense classification is strictly enforced on receipt & voice candidates. | `activityContracts.test.ts` (Test 7 & 9) | PASS | Missing `expenseType` blocks confirmation with `"Choose whether this expense is living or work."` |
| UAT-7.5 | Voice transaction candidate confirms with proper source, idempotency ID, and categorization. | `activityContracts.test.ts` (Test 8 & 10) | PASS | Confirms as `source: "voice"` or `ai_suggestion`, preserves UUID across retries. |
| UAT-7.6 | Frontend build and TypeScript type-checking pass with zero warnings/errors. | `npm run build` (`tsc -b && vite build`) | PASS | Production build completed in 1.95s, all types strictly valid. |
