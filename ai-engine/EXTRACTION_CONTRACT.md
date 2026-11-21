# FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)

## 1. Overview & Architectural Boundaries

This document defines the standardized **AI Extraction Data Transfer Object (DTO)**, **Validation Adapter Rules**, and **Strict JSON Schema** for natural language financial text, voice transcripts, and receipt parsing in FLOVA.

### Architectural Rules
1. **Separation of Concerns:**
   - The AI extraction engine (Groq / Gemini) outputs raw structured DTOs containing extraction metadata (`input_source`, `certainty`, `clarification_required`, `clarification_questions`).
   - The AI model **never** writes directly to the database or calls backend persistence services.
   - Extraction metadata fields and proposed adapter fields are **extraction-only** and are **never inserted into database tables** without explicit M1 schema approval.
2. **Decimal Safety:**
   - All extracted amounts in the DTO are represented as **decimal rupee strings** (e.g., `"2500"`, `"120.50"`), nullable (`null` if omitted).
   - Amounts are converted to integer `Paise` using `toPaise()` in `frontend/src/lib/money.ts` only upon user review and validation prior to persistence. No floating-point financial arithmetic is permitted.
3. **No Fabricated Data:**
   - Missing amounts, dates, or categories remain `null`. The extractor must **never** default missing financial values to `0` or invent dates.
4. **Preservation of Ownership & Payout Separation:**
   - Cash On Delivery (COD) collections and remittances must explicitly set `ownership: "not_mine"`. COD money must never be classified as personal income or expense.
   - Expected payouts must extract as `expected_payout` entities and must **never** be generated as received `income` transactions.
5. **Multiple Transactions per Utterance:**
   - Single utterances or receipts frequently describe multiple financial movements (e.g., *"received 2500 from customer and spent 300 on raw materials"*). The DTO represents transactions as an array `transactions: ExtractedTransactionData[]`.
6. **Receipt Verification Safety:**
   - Extracted receipt metadata (`evidence_type`, `verification_status`) MUST default to `"receipt_reported"`, and **NEVER** `"independently_verified"`.
   - All receipt extension values (`payment_method`, `evidence_type`, `verification_status`) are proposed adapter values requiring M1 schema approval before database persistence.
7. **Canonical Category Normalization:**
   - Only categories present in `SUGGESTED_CATEGORIES` (`income`: `["earnings", "tips", "payout", "incentive", "advance", "cod_collection", "other"]`; `expense`: `["food", "fuel", "phone", "maintenance", "rent", "emi", "cod_handover", "other"]`) are accepted directly.
   - Unknown or colloquial categories are mapped to `"other"` and flagged for user clarification.
8. **Correction Safety & Target Draft Scoping:**
   - The AI model must **never** invent target IDs or modify persisted transactions.
   - Corrections require an existing unpersisted draft ID (`target_draft_id`) passed in the application context. If missing, invented, or ambiguous across multiple draft matches, the adapter requires clarification and halts automatic application.
9. **Balance Check-in Completeness:**
   - Missing physical cash or bank amounts must remain `null`. They cannot default to zero. If either is missing, the adapter requires clarification before creating a `NewBalanceCheckin`.
10. **Voice & Text Financial Queries:**
    - Basic financial queries (e.g., *"How much did I spend today?"*, *"Show pending payments"*) are classified as `entry_intent: "query"`.
    - The engine extracts query parameters (`query_type`, `target_date`, `filter_subject`) for M1 backend service retrieval. It **never** fabricates balances or answers.

---

## 2. Existing FLOVA Contract Enum Alignment

The extraction DTO strictly aligns with existing FLOVA enums in `frontend/src/types/contracts.ts` and `docs/CONTRACT.md`:

| Enum / Field | Allowed Values | Contract Notes |
|---|---|---|
| **Entry Intent** | `"transaction"`, `"expected_payout"`, `"balance_checkin"`, `"query"`, `"unknown"` | Core discriminator for the financial entity type. |
| **Action Intent** | `"create"`, `"correct"`, `"clarify"`, `"cancel"`, `"unknown"` | Supports conversation and amendment lifecycle. |
| **Input Source** | `"text"`, `"voice_transcript"`, `"shared_receipt_text"`, `"shared_receipt_image"` | Discriminates user input medium. |
| **Query Type** | `"today_spending"`, `"pending_payments"`, `"other"` | Supported financial query intents. |
| **Transaction Type** | `"income"`, `"expense"` | Matches `TRANSACTION_TYPES`. Always positive amount; type indicates flow. |
| **Expense Type** | `"living"`, `"work"` | Matches `EXPENSE_TYPES`. Required for own expenses (`ownership: "mine"`). Must be `null` for income or `not_mine`. |
| **Money Ownership** | `"mine"`, `"not_mine"` | Matches `MONEY_OWNERSHIP`. Default `"mine"`. COD collections and handovers are `"not_mine"`. |
| **Canonical Income Categories** | `"earnings"`, `"tips"`, `"payout"`, `"incentive"`, `"advance"`, `"cod_collection"`, `"other"` | Enforced via `SUGGESTED_CATEGORIES.income`. Unknown categories map to `"other"`. |
| **Canonical Expense Categories**| `"food"`, `"fuel"`, `"phone"`, `"maintenance"`, `"rent"`, `"emi"`, `"cod_handover"`, `"other"` | Enforced via `SUGGESTED_CATEGORIES.expense`. Unknown categories map to `"other"`. |
| **Payout Kind** | `"platform_payout"`, `"incentive"`, `"client_payment"`, `"advance"`, `"other"` | Matches `PAYOUT_KINDS`. |
| **Payout Status (Extraction)** | `"scheduled"`, `"estimated"`, `"unearned"` | Extractor **only** extracts forward-looking statuses. `partial`, `settled`, `cancelled` are DB-trigger/lifecycle managed. |

### Proposed Adapter Extensions (Extraction-Only · Requiring M1 Approval)
| Field | Proposed Allowed Values | Restriction Note |
|---|---|---|
| **Proposed Payment Method** | `"cash"`, `"upi"`, `"bank_transfer"`, `"card"`, `"other"` | Extraction-tier only. Requires M1 approval before DB addition. |
| **Proposed Evidence Type** | `"voice_transcript"`, `"user_text"`, `"receipt_text"`, `"receipt_image"`, `"bank_sms"` | Extraction-tier only. Defaults to `"receipt_reported"` for receipts. |
| **Proposed Verification Status** | `"receipt_reported"`, `"user_asserted"`, `"independently_verified"` | MUST default to `"receipt_reported"`, NEVER `"independently_verified"`. |

---

## 3. TypeScript DTO Definitions

```typescript
export type ExtractionEntryIntent =
  | "transaction"
  | "expected_payout"
  | "balance_checkin"
  | "query"
  | "unknown";

export type ExtractionActionIntent =
  | "create"
  | "correct"
  | "clarify"
  | "cancel"
  | "unknown";

export type ExtractionInputSource =
  | "text"
  | "voice_transcript"
  | "shared_receipt_text"
  | "shared_receipt_image";

export type FinancialQueryType =
  | "today_spending"
  | "pending_payments"
  | "other";

export interface ExtractedQueryData {
  query_type: FinancialQueryType;
  target_date?: string | null;
  filter_subject?: string | null;
}

export interface ExtractedTransactionData {
  type: "income" | "expense" | null;
  amount: string | null;
  category: string | null;
  expense_type: "living" | "work" | null;
  ownership: "mine" | "not_mine" | null;
  date: string | null;
  description: string | null;
  payment_method?: ProposedPaymentMethod | null;
  evidence_type?: ProposedEvidenceType | null;
  verification_status?: ProposedVerificationStatus | null;
  merchant_or_counterparty?: string | null;
  external_reference?: string | null;
}

export interface ExtractedPayoutData {
  expected_amount: string | null;
  kind: "platform_payout" | "incentive" | "client_payment" | "advance" | "other" | null;
  source: string | null;
  expected_date: string | null;
  status: "scheduled" | "estimated" | "unearned" | null;
  note: string | null;
}

export interface ExtractedCheckinData {
  cash_amount: string | null;
  bank_amount: string | null;
  not_mine_amount: string | null;
  note: string | null;
  checked_at: string | null;
}

export interface ExtractionMetadata {
  input_source: ExtractionInputSource;
  certainty: number;
  clarification_required: boolean;
  clarification_reason: string | null;
  clarification_questions: string[];
  raw_utterance: string;
}

export interface FinancialExtractionDTO {
  entry_intent: ExtractionEntryIntent;
  action_intent: ExtractionActionIntent;
  target_draft_id: string | null;
  transactions: ExtractedTransactionData[];
  expected_payout: ExtractedPayoutData | null;
  balance_checkin: ExtractedCheckinData | null;
  query?: ExtractedQueryData | null;
  metadata: ExtractionMetadata;
}
```

---

## 4. Strict JSON Schema (Draft 2020-12 Compatible)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "FinancialExtractionDTO",
  "type": "object",
  "required": [
    "entry_intent",
    "action_intent",
    "target_draft_id",
    "transactions",
    "expected_payout",
    "balance_checkin",
    "metadata"
  ],
  "additionalProperties": false,
  "properties": {
    "entry_intent": {
      "type": "string",
      "enum": ["transaction", "expected_payout", "balance_checkin", "query", "unknown"]
    },
    "action_intent": {
      "type": "string",
      "enum": ["create", "correct", "clarify", "cancel", "unknown"]
    },
    "target_draft_id": {
      "type": ["string", "null"]
    },
    "transactions": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "type",
          "amount",
          "category",
          "expense_type",
          "ownership",
          "date",
          "description"
        ],
        "properties": {
          "type": { "type": ["string", "null"], "enum": ["income", "expense", null] },
          "amount": { "type": ["string", "null"], "pattern": "^[0-9]+(\\.[0-9]{1,2})?$" },
          "category": { "type": ["string", "null"], "maxLength": 40 },
          "expense_type": { "type": ["string", "null"], "enum": ["living", "work", null] },
          "ownership": { "type": ["string", "null"], "enum": ["mine", "not_mine", null] },
          "date": { "type": ["string", "null"], "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" },
          "description": { "type": ["string", "null"], "maxLength": 200 },
          "payment_method": {
            "type": ["string", "null"],
            "enum": ["cash", "upi", "bank_transfer", "card", "other", null]
          },
          "evidence_type": {
            "type": ["string", "null"],
            "enum": ["voice_transcript", "user_text", "receipt_text", "receipt_image", "bank_sms", null]
          },
          "verification_status": {
            "type": ["string", "null"],
            "enum": ["receipt_reported", "user_asserted", "independently_verified", null]
          },
          "merchant_or_counterparty": { "type": ["string", "null"], "maxLength": 80 },
          "external_reference": { "type": ["string", "null"], "maxLength": 80 }
        }
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
    "query": {
      "type": ["object", "null"],
      "additionalProperties": false,
      "required": ["query_type"],
      "properties": {
        "query_type": { "type": "string", "enum": ["today_spending", "pending_payments", "other"] },
        "target_date": { "type": ["string", "null"] },
        "filter_subject": { "type": ["string", "null"] }
      }
    },
    "metadata": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "input_source",
        "certainty",
        "clarification_required",
        "clarification_reason",
        "clarification_questions",
        "raw_utterance"
      ],
      "properties": {
        "input_source": {
          "type": "string",
          "enum": ["text", "voice_transcript", "shared_receipt_text", "shared_receipt_image"]
        },
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

## 5. Concrete Extraction Examples

### Example 1: Multi-Transaction Sentence (Income + Expense)
**User says:** *"Received 2500 from customer and spent 300 on raw materials"*
```json
{
  "entry_intent": "transaction",
  "action_intent": "create",
  "target_draft_id": null,
  "transactions": [
    {
      "type": "income",
      "amount": "2500",
      "category": "earnings",
      "expense_type": null,
      "ownership": "mine",
      "date": "2026-11-21",
      "description": "Customer payment"
    },
    {
      "type": "expense",
      "amount": "300",
      "category": "other",
      "expense_type": "work",
      "ownership": "mine",
      "date": "2026-11-21",
      "description": "Raw materials"
    }
  ],
  "expected_payout": null,
  "balance_checkin": null,
  "query": null,
  "metadata": {
    "input_source": "voice_transcript",
    "certainty": 0.96,
    "clarification_required": false,
    "clarification_reason": null,
    "clarification_questions": [],
    "raw_utterance": "Received 2500 from customer and spent 300 on raw materials"
  }
}
```

### Example 2: Today's Spending Voice Query
**User says:** *"How much did I spend today?"*
```json
{
  "entry_intent": "query",
  "action_intent": "unknown",
  "target_draft_id": null,
  "transactions": [],
  "expected_payout": null,
  "balance_checkin": null,
  "query": {
    "query_type": "today_spending",
    "target_date": "2026-11-21",
    "filter_subject": null
  },
  "metadata": {
    "input_source": "voice_transcript",
    "certainty": 0.98,
    "clarification_required": false,
    "clarification_reason": null,
    "clarification_questions": [],
    "raw_utterance": "How much did I spend today?"
  }
}
```

### Example 3: Pending Payments Voice Query
**User says:** *"Show me all my pending payments"*
```json
{
  "entry_intent": "query",
  "action_intent": "unknown",
  "target_draft_id": null,
  "transactions": [],
  "expected_payout": null,
  "balance_checkin": null,
  "query": {
    "query_type": "pending_payments",
    "target_date": null,
    "filter_subject": null
  },
  "metadata": {
    "input_source": "voice_transcript",
    "certainty": 0.97,
    "clarification_required": false,
    "clarification_reason": null,
    "clarification_questions": [],
    "raw_utterance": "Show me all my pending payments"
  }
}
```

---

## 6. M1 Backend & Edge Function Integration

See `ai-engine/M1_GROQ_INTEGRATION.md` for full backend specifications:
- Canonical voice/text endpoint: `POST /functions/v1/process-voice`
- Dedicated receipt endpoint: `POST /functions/v1/extract-receipt`
- Model: `llama-3.3-70b-versatile` (Groq API, JSON mode)
- Secret key: `GROQ_API_KEY` kept server-side only in Supabase secrets
- Client passes audio blob (Mode 1) or `input_text` JSON (Mode 2); Edge function runs inference with `EXTRACTION_SYSTEM_PROMPT` and returns raw JSON for M3 client-side validation (`validateExtractionOutput`).
