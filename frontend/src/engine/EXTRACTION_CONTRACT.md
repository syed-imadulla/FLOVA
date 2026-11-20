# FLOVA AI Extraction Contract Specification (v1 · Owner: M3)

## 1. Overview & Architectural Boundaries

This document defines the standardized **AI Extraction Data Transfer Object (DTO)** and **Strict JSON Schema** for natural language financial text and receipt parsing in FLOVA.

### Architectural Rules
1. **Separation of Concerns:**
   - The AI extraction engine (Groq / Gemini) outputs raw structured DTOs containing extraction metadata (`certainty`, `clarification_required`, `clarification_questions`).
   - The AI model **never** writes directly to the database or calls backend persistence services.
   - Extraction metadata fields are **extraction-only** and are **never inserted into database tables**.
2. **Decimal Safety:**
   - All extracted amounts in the DTO are represented as **decimal rupee strings** (e.g., `"450"`, `"120.50"`), nullable (`null` if omitted).
   - Amounts are converted to integer `Paise` using `toPaise()` in `frontend/src/lib/money.ts` only upon user review and validation prior to persistence. No floating-point financial arithmetic is permitted.
3. **No Fabricated Data:**
   - Missing amounts, dates, or categories remain `null`. The extractor must **never** default missing financial values to `0` or invent dates.
4. **Preservation of Ownership & Payout Separation:**
   - Cash On Delivery (COD) collections and remittances must explicitly set `ownership: "not_mine"`. COD money must never be classified as personal income or expense.
   - Expected payouts must extract as `expected_payout` entities and must **never** be generated as received `income` transactions.

---

## 2. Existing FLOVA Contract Enum Alignment

The extraction DTO strictly aligns with existing FLOVA enums in `frontend/src/types/contracts.ts` and `docs/CONTRACT.md`:

| Enum / Field | Allowed Values | Contract Notes |
|---|---|---|
| **Entry Intent** | `"transaction"`, `"expected_payout"`, `"balance_checkin"`, `"unknown"` | Core discriminator for the financial entity type. |
| **Action Intent** | `"create"`, `"correct"`, `"clarify"`, `"cancel"`, `"unknown"` | Supports conversation and amendment lifecycle. |
| **Transaction Type** | `"income"`, `"expense"` | Matches `TRANSACTION_TYPES`. Always positive amount; type indicates flow. |
| **Expense Type** | `"living"`, `"work"` | Matches `EXPENSE_TYPES`. Required for own expenses (`ownership: "mine"`). Must be `null` for income or `not_mine`. |
| **Money Ownership** | `"mine"`, `"not_mine"` | Matches `MONEY_OWNERSHIP`. Default `"mine"`. COD collections and handovers are `"not_mine"`. |
| **Suggested Categories (Income)** | `"earnings"`, `"tips"`, `"payout"`, `"incentive"`, `"advance"`, `"cod_collection"`, `"other"` | Preset presets in `SUGGESTED_CATEGORIES.income`. Custom string allowed (≤ 40 chars). |
| **Suggested Categories (Expense)**| `"food"`, `"fuel"`, `"phone"`, `"maintenance"`, `"rent"`, `"emi"`, `"cod_handover"`, `"other"` | Preset presets in `SUGGESTED_CATEGORIES.expense`. Custom string allowed (≤ 40 chars). |
| **Payout Kind** | `"platform_payout"`, `"incentive"`, `"client_payment"`, `"advance"`, `"other"` | Matches `PAYOUT_KINDS`. |
| **Payout Status (Extraction)** | `"scheduled"`, `"estimated"`, `"unearned"` | Extractor **only** extracts forward-looking statuses. `partial`, `settled`, `cancelled` are DB-trigger/lifecycle managed. |
| **Entry Source** | `"voice"`, `"ai_suggestion"` | When saved to database, `source` is set to `"voice"` or `"ai_suggestion"`. |

---

## 3. TypeScript DTO Definitions

```typescript
/**
 * Primary intent of the natural language or voice statement.
 */
export type ExtractionEntryIntent =
  | "transaction"
  | "expected_payout"
  | "balance_checkin"
  | "unknown";

/**
 * Operational action intended by the user (supports corrections & clarifications).
 */
export type ExtractionActionIntent =
  | "create"    // New financial entry
  | "correct"   // Modification to a pending or previously extracted item
  | "clarify"   // User answering an agent clarification question
  | "cancel"    // User discarding a suggestion
  | "unknown";  // Ambiguous or non-financial input

/**
 * Extracted transaction payload (Income, Personal Expense, or COD Handover/Collection).
 */
export interface ExtractedTransactionData {
  type: "income" | "expense" | null;
  /** Decimal rupee string e.g. "450" or "120.50". Null if unspecified. */
  amount: string | null;
  /** Category identifier or free-text string (max 40 chars). */
  category: string | null;
  /** Required when type='expense' and ownership='mine'. Must be null otherwise. */
  expense_type: "living" | "work" | null;
  /** "mine" for personal money; "not_mine" for COD or platform money. */
  ownership: "mine" | "not_mine" | null;
  /** ISO date string "YYYY-MM-DD". Null if unspecified. */
  date: string | null;
  description: string | null;
}

/**
 * Extracted expected payout payload (Platform payouts, future incentives, client advances).
 * Note: Expected payouts NEVER represent received cash.
 */
export interface ExtractedPayoutData {
  /** Decimal rupee string e.g. "3500". Null if unspecified. */
  expected_amount: string | null;
  kind: "platform_payout" | "incentive" | "client_payment" | "advance" | "other" | null;
  source: string | null;
  /** ISO date string "YYYY-MM-DD". Null if date is unknown or uncertain. */
  expected_date: string | null;
  status: "scheduled" | "estimated" | "unearned" | null;
  note: string | null;
}

/**
 * Extracted wallet & bank check-in payload.
 */
export interface ExtractedCheckinData {
  /** Decimal rupee string for physical cash in hand. Null if omitted. */
  cash_amount: string | null;
  /** Decimal rupee string for bank account balance. Null if omitted. */
  bank_amount: string | null;
  /** Decimal rupee string for custodial COD money in possession. Default "0" if explicit. */
  not_mine_amount: string | null;
  note: string | null;
  /** ISO timestamp if specified; defaults to current instant upon confirmation. */
  checked_at: string | null;
}

/**
 * Metadata capturing ambiguity and clarification needs.
 * Extracted for UI orchestration; NEVER persisted into core tables.
 */
export interface ExtractionMetadata {
  /** Confidence score between 0.0 and 1.0. */
  certainty: number;
  /** True if essential financial data is missing or ambiguous. */
  clarification_required: boolean;
  /** Human-readable explanation of why clarification is needed. */
  clarification_reason: string | null;
  /** Targeted questions to ask the worker to resolve the ambiguity. */
  clarification_questions: string[];
  /** Raw utterance or transcription segment. */
  raw_utterance: string;
}

/**
 * Complete AI Extraction DTO returned by Groq / LLM inference.
 */
export interface FinancialExtractionDTO {
  entry_intent: ExtractionEntryIntent;
  action_intent: ExtractionActionIntent;
  /** If action_intent is "correct" or "cancel", target entry ID if referenced. */
  target_id: string | null;
  transaction: ExtractedTransactionData | null;
  expected_payout: ExtractedPayoutData | null;
  balance_checkin: ExtractedCheckinData | null;
  metadata: ExtractionMetadata;
}
```

---

## 4. Strict JSON Schema (OpenAPI 3.1 / Draft 2020-12 Compatible)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "FinancialExtractionDTO",
  "type": "object",
  "required": [
    "entry_intent",
    "action_intent",
    "target_id",
    "transaction",
    "expected_payout",
    "balance_checkin",
    "metadata"
  ],
  "additionalProperties": false,
  "properties": {
    "entry_intent": {
      "type": "string",
      "enum": ["transaction", "expected_payout", "balance_checkin", "unknown"]
    },
    "action_intent": {
      "type": "string",
      "enum": ["create", "correct", "clarify", "cancel", "unknown"]
    },
    "target_id": {
      "type": ["string", "null"]
    },
    "transaction": {
      "type": ["object", "null"],
      "additionalProperties": false,
      "required": ["type", "amount", "category", "expense_type", "ownership", "date", "description"],
      "properties": {
        "type": { "type": ["string", "null"], "enum": ["income", "expense", null] },
        "amount": { "type": ["string", "null"], "pattern": "^[0-9]+(\\.[0-9]{1,2})?$" },
        "category": { "type": ["string", "null"], "maxLength": 40 },
        "expense_type": { "type": ["string", "null"], "enum": ["living", "work", null] },
        "ownership": { "type": ["string", "null"], "enum": ["mine", "not_mine", null] },
        "date": { "type": ["string", "null"], "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" },
        "description": { "type": ["string", "null"], "maxLength": 200 }
      }
    },
    "expected_payout": {
      "type": ["object", "null"],
      "additionalProperties": false,
      "required": ["expected_amount", "kind", "source", "expected_date", "status", "note"],
      "properties": {
        "expected_amount": { "type": ["string", "null"], "pattern": "^[0-9]+(\\.[0-9]{1,2})?$" },
        "kind": { "type": ["string", "null"], "enum": ["platform_payout", "incentive", "client_payment", "advance", "other", null] },
        "source": { "type": ["string", "null"], "maxLength": 80 },
        "expected_date": { "type": ["string", "null"], "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" },
        "status": { "type": ["string", "null"], "enum": ["scheduled", "estimated", "unearned", null] },
        "note": { "type": ["string", "null"], "maxLength": 200 }
      }
    },
    "balance_checkin": {
      "type": ["object", "null"],
      "additionalProperties": false,
      "required": ["cash_amount", "bank_amount", "not_mine_amount", "note", "checked_at"],
      "properties": {
        "cash_amount": { "type": ["string", "null"], "pattern": "^[0-9]+(\\.[0-9]{1,2})?$" },
        "bank_amount": { "type": ["string", "null"], "pattern": "^[0-9]+(\\.[0-9]{1,2})?$" },
        "not_mine_amount": { "type": ["string", "null"], "pattern": "^[0-9]+(\\.[0-9]{1,2})?$" },
        "note": { "type": ["string", "null"], "maxLength": 200 },
        "checked_at": { "type": ["string", "null"] }
      }
    },
    "metadata": {
      "type": "object",
      "additionalProperties": false,
      "required": ["certainty", "clarification_required", "clarification_reason", "clarification_questions", "raw_utterance"],
      "properties": {
        "certainty": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
        "clarification_required": { "type": "boolean" },
        "clarification_reason": { "type": ["string", "null"] },
        "clarification_questions": {
          "type": "array",
          "items": { "type": "string" }
        },
        "raw_utterance": { "type": "string" }
      }
    }
  }
}
```

---

## 5. Five Concrete Extraction Examples

### Example 1: Simple Personal Income
**User says:** *"Got ₹650 from Zomato orders today"*
```json
{
  "entry_intent": "transaction",
  "action_intent": "create",
  "target_id": null,
  "transaction": {
    "type": "income",
    "amount": "650",
    "category": "earnings",
    "expense_type": null,
    "ownership": "mine",
    "date": "2026-11-21",
    "description": "Zomato orders"
  },
  "expected_payout": null,
  "balance_checkin": null,
  "metadata": {
    "certainty": 0.98,
    "clarification_required": false,
    "clarification_reason": null,
    "clarification_questions": [],
    "raw_utterance": "Got ₹650 from Zomato orders today"
  }
}
```

### Example 2: Personal Work Expense
**User says:** *"Filled ₹120 petrol just now"*
```json
{
  "entry_intent": "transaction",
  "action_intent": "create",
  "target_id": null,
  "transaction": {
    "type": "expense",
    "amount": "120",
    "category": "fuel",
    "expense_type": "work",
    "ownership": "mine",
    "date": "2026-11-21",
    "description": "Petrol"
  },
  "expected_payout": null,
  "balance_checkin": null,
  "metadata": {
    "certainty": 0.97,
    "clarification_required": false,
    "clarification_reason": null,
    "clarification_questions": [],
    "raw_utterance": "Filled ₹120 petrol just now"
  }
}
```

### Example 3: Expected Platform Payout (Forward-Looking)
**User says:** *"Swiggy payout of ₹1,800 is expected on Monday"*
```json
{
  "entry_intent": "expected_payout",
  "action_intent": "create",
  "target_id": null,
  "transaction": null,
  "expected_payout": {
    "expected_amount": "1800",
    "kind": "platform_payout",
    "source": "Swiggy",
    "expected_date": "2026-11-23",
    "status": "scheduled",
    "note": "Weekly Swiggy payout"
  },
  "balance_checkin": null,
  "metadata": {
    "certainty": 0.95,
    "clarification_required": false,
    "clarification_reason": null,
    "clarification_questions": [],
    "raw_utterance": "Swiggy payout of ₹1,800 is expected on Monday"
  }
}
```

### Example 4: Cash On Delivery (COD) Collection
**User says:** *"Collected ₹600 cash on delivery from customer for order #402"*
```json
{
  "entry_intent": "transaction",
  "action_intent": "create",
  "target_id": null,
  "transaction": {
    "type": "income",
    "amount": "600",
    "category": "cod_collection",
    "expense_type": null,
    "ownership": "not_mine",
    "date": "2026-11-21",
    "description": "Order #402 COD collection"
  },
  "expected_payout": null,
  "balance_checkin": null,
  "metadata": {
    "certainty": 0.96,
    "clarification_required": false,
    "clarification_reason": null,
    "clarification_questions": [],
    "raw_utterance": "Collected ₹600 cash on delivery from customer for order #402"
  }
}
```

### Example 5: Complete Balance Check-In
**User says:** *"I have ₹1500 cash in my pocket and ₹2500 in my bank account. ₹600 of the cash is COD money."*
```json
{
  "entry_intent": "balance_checkin",
  "action_intent": "create",
  "target_id": null,
  "transaction": null,
  "expected_payout": null,
  "balance_checkin": {
    "cash_amount": "1500",
    "bank_amount": "2500",
    "not_mine_amount": "600",
    "note": "Wallet and bank check-in",
    "checked_at": "2026-11-21T01:15:00Z"
  },
  "metadata": {
    "certainty": 0.99,
    "clarification_required": false,
    "clarification_reason": null,
    "clarification_questions": [],
    "raw_utterance": "I have ₹1500 cash in my pocket and ₹2500 in my bank account. ₹600 of the cash is COD money."
  }
}
```

---

## 6. Ambiguity Handling & Clarification Rules

When processing colloquial or incomplete voice/text messages:

1. **Expense Classification Ambiguity:**
   - If user says *"Spent ₹300"* without category:
     - `amount`: `"300"`, `type`: `"expense"`, `category`: `"other"`, `expense_type`: `null`.
     - `clarification_required`: `true`.
     - `clarification_reason`: `"Expense type must be specified as living (food/personal) or work (fuel/phone/maintenance)."`.
     - `clarification_questions`: `["Was this ₹300 spent on living expenses (food, tea) or work expenses (petrol, bike, phone)?"]`.
2. **Missing Amount:**
   - If user says *"Put petrol today"*:
     - `amount`: `null`.
     - `clarification_required`: `true`.
     - `clarification_reason`: `"Amount was not provided."`.
     - `clarification_questions`: `["How much did you spend on petrol?"]`.
3. **Ambiguous Check-in Aggregates:**
   - If user says *"I have ₹4,000 in total"*:
     - `clarification_required`: `true`.
     - `clarification_reason`: `"Breakdown between physical cash and bank balance is required to track cash runway."`.
     - `clarification_questions`: `["How much of that ₹4,000 is physical cash in hand, and how much is in your bank account?"]`.
4. **Correction Commands:**
   - If user says *"Actually it was ₹150 not ₹120 for petrol"*:
     - `entry_intent`: `"transaction"`.
     - `action_intent`: `"correct"`.
     - `transaction.amount`: `"150"`.
     - `metadata.clarification_required`: `false`.

---

## 7. Mapping to FLOVA Application Contracts (Consumer Adapter)

When the worker clicks **Confirm** in the client UI, the client converts the verified DTO to M1's service interfaces:

```typescript
import { toPaise } from "../lib/money";
import type { NewTransaction, NewPayout, NewBalanceCheckin } from "../types/contracts";

export function dtoToNewTransaction(dto: FinancialExtractionDTO): NewTransaction {
  if (dto.entry_intent !== "transaction" || !dto.transaction || !dto.transaction.amount) {
    throw new Error("Invalid transaction DTO");
  }
  return {
    type: dto.transaction.type ?? "expense",
    amount: toPaise(dto.transaction.amount), // Converts decimal string to integer Paise
    category: dto.transaction.category ?? "other",
    expenseType: dto.transaction.expense_type ?? undefined,
    ownership: dto.transaction.ownership ?? "mine",
    date: dto.transaction.date ?? undefined,
    description: dto.transaction.description ?? undefined,
    source: "ai_suggestion",
  };
}

export function dtoToNewPayout(dto: FinancialExtractionDTO): NewPayout {
  if (dto.entry_intent !== "expected_payout" || !dto.expected_payout || !dto.expected_payout.expected_amount) {
    throw new Error("Invalid expected payout DTO");
  }
  return {
    expected: toPaise(dto.expected_payout.expected_amount),
    kind: dto.expected_payout.kind ?? "platform_payout",
    source: dto.expected_payout.source ?? undefined,
    expectedDate: dto.expected_payout.expected_date ?? null,
    status: dto.expected_payout.status ?? "scheduled",
    note: dto.expected_payout.note ?? undefined,
  };
}

export function dtoToNewCheckin(dto: FinancialExtractionDTO): NewBalanceCheckin {
  if (dto.entry_intent !== "balance_checkin" || !dto.balance_checkin) {
    throw new Error("Invalid checkin DTO");
  }
  return {
    cash: dto.balance_checkin.cash_amount ? toPaise(dto.balance_checkin.cash_amount) : 0,
    bank: dto.balance_checkin.bank_amount ? toPaise(dto.balance_checkin.bank_amount) : 0,
    notMine: dto.balance_checkin.not_mine_amount ? toPaise(dto.balance_checkin.not_mine_amount) : 0,
    note: dto.balance_checkin.note ?? undefined,
    checkedAt: dto.balance_checkin.checked_at ?? undefined,
  };
}
```
