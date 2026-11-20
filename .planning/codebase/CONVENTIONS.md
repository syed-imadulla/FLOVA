---
last_mapped_commit: d8cfbb2900c410e8e3cca70f6675fa2b766588e0
last_mapped_at: 2026-11-20
---
# Coding Conventions

**Analysis Date:** 2026-11-20

## Naming Patterns

**Files:**

- React components: `PascalCase.tsx` (`App.tsx`, `EvidenceView.tsx`, `RiderView.tsx`)
- TypeScript library modules: `camelCase.ts` (`money.ts`, `supabase.ts`, `contracts.ts`, `auth.ts`, `data.ts`)
- Database migrations: `YYYYMMDDHHMMSS_description.sql`
- Node scripts: `kebab-case.mjs` (`test-db.mjs`)

**Variables & Functions:**

- Functions: `camelCase` (`toPaise`, `paiseToRupeeString`, `formatINR`, `getMyProfile`, `addCheckin`)
- Constants & Enums: `UPPER_SNAKE_CASE` arrays (`WORK_PROFILES`, `PAYOUT_PATTERNS`, `TRANSACTION_TYPES`)

**Types & Interfaces:**

- Interfaces: `PascalCase` (`Profile`, `BalanceCheckin`, `Payout`, `Transaction`, `Commitment`, `RunwayInput`)
- Type Aliases: `PascalCase` (`WorkProfile`, `Paise`, `RupeeString`, `ISODate`)

## Code Style

**Formatting:**

- 2-space indentation
- Semicolons used consistently
- Double quotes in TypeScript imports and string literals

**TypeScript Rules:**

- Strict type-checking enabled (`tsconfig.json`)
- No explicit `any` where typed contracts exist
- Money values must use `Paise` (integer) or `RupeeString` (`string | number`) as defined in `contracts.ts`

## Import Organization

**Order:**

1. External libraries (`react`, `@supabase/supabase-js`)
2. Internal libraries and helpers (`../lib/supabase`, `../lib/money`)
3. Types and contracts (`../types/contracts`)

**Path Aliases:**

- Standard relative imports (`../lib/money`, `../types/contracts`)

## Error Handling

**Patterns:**

- Always unwrap Supabase results with `unwrap(result, actionName)` from `frontend/src/lib/supabase.ts`.
- Throw descriptive Errors that explain the operation and underlying message (`throw new Error(\`${action} failed: ${result.error.message}\`)`).
- In UI, surface errors directly to users; never fail silently or pretend operations succeeded.

## Financial & Money Conventions

**Rules:**

- All currency math must be conducted in integer **paise**.
- Conversion from rupee strings/numbers must use `toPaise()` or `toPaiseOrNull()`.
- Conversion to database rupee representation must use `paiseToRupeeString()`.
- Display formatting must use `formatINR()`.
- Never use floating-point math (`amount * 100` or `amount / 100`) directly on money values.
- Missing values must remain `null` to indicate "not enough information", never defaulted to `0`.

## Database Interaction Conventions

**Rules:**

- All data operations must go through service functions in `frontend/src/services/`.
- Never send `user_id` in insert/update queries; the database fills it from `auth.uid()`.
- Row Level Security (RLS) is active on all personal tables.

---

*Convention analysis: 2026-11-20*
