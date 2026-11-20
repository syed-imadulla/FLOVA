// =====================================================================
// FLOVA AI Financial Extraction Prompt & Validation Layer (M3 Phase 6A)
// Contains system prompts, JSON schemas, mock responses, and output validation.
// =====================================================================

import { isValidISODate, isValidPaise } from "./validation";
import { toPaise } from "../lib/money";
import type {
  FinancialExtractionDTO,
  ExtractedTransactionData,
  ExtractionEntryIntent,
  ExtractionActionIntent,
} from "./extractionTypes";
import { mapCanonicalCategory } from "./extractionAdapter";

/**
 * System prompt governing Groq / LLM financial intent extraction for FLOVA.
 * Designed for general-purpose users: individuals, freelancers, gig workers, vendors, and small businesses.
 */
export const EXTRACTION_SYSTEM_PROMPT = `You are FLOVA Financial Engine AI, an extraction assistant for individuals, freelancers, gig workers, street vendors, and small businesses.
Your role is to extract structured financial entries from natural language voice transcripts or typed text into a single, valid JSON object matching the FinancialExtractionDTO specification.

RULES:
1. OUTPUT STRICT JSON ONLY:
   Output ONLY valid JSON. No markdown codeblocks (\`\`\`json), no preamble, no commentary.

2. MULTIPLE TRANSACTIONS:
   A single user statement may describe multiple financial events (e.g. "Received 2500 from customer and spent 300 on raw materials").
   Extract EACH distinct transaction into the "transactions" array.

3. AMOUNTS AS DECIMAL RUPEE STRINGS:
   Represent amounts as decimal rupee strings without commas or currency symbols (e.g. "2500", "120.50").
   Do NOT convert to paise. Do NOT invent missing amounts; use null if not specified.
   Negative amounts are strictly prohibited; indicate direction via transaction type ("income" or "expense").

4. CANONICAL CATEGORIES ONLY:
   Allowed Income Categories: "earnings", "tips", "payout", "incentive", "advance", "cod_collection", "other".
   Allowed Expense Categories: "food", "fuel", "phone", "maintenance", "rent", "emi", "cod_handover", "other".
   If the user's category is outside this canonical set (e.g., "raw materials", "electricity", "stationery"), map category to "other", describe the actual item in "description", and set "clarification_required": true with a suggested question.

5. EXPENSE TYPE CLASSIFICATION:
   For personal/own expenses ("ownership": "mine"):
   - "work": business raw materials, fuel, phone for work, shop rent, bike/vehicle repair, work tools.
   - "living": personal food/groceries, tea, home electricity, personal rent, family expenses.
   Do NOT assume all expenses are business expenses.
   "expense_type" MUST be null for all income and for "not_mine" custodial transactions.

6. CASH ON DELIVERY (COD) & CUSTODIAL MONEY:
   - COD collections: type="income", ownership="not_mine", category="cod_collection", expense_type=null.
   - COD handovers: type="expense", ownership="not_mine", category="cod_handover", expense_type=null.
   COD money is NEVER personal income or personal expense.

7. EXPECTED PAYOUTS VS RECEIVED INCOME:
   - Forward-looking payouts (e.g., "Swiggy payout expected Monday", "client payment due next week") MUST use entry_intent="expected_payout".
   - Set status="scheduled" | "estimated" | "unearned".
   - NEVER put expected payouts into the "transactions" array as received income.

8. BASIC FINANCIAL QUERIES:
   - For user questions like "How much did I spend today?" or "Check my pending payments", set entry_intent="query".
   - Set query.query_type="today_spending" | "pending_payments".
   - Do NOT invent financial numbers, balances, or transactions. The backend will look up actual data.

9. RECEIPT EVIDENCE & VERIFICATION SAFETY:
   - If evidence is from a receipt, set verification_status="receipt_reported".
   - NEVER assign "independently_verified". All AI suggestions require user review.

10. CORRECTION INTENT SAFETY:
    - If action_intent="correct" or "cancel", target_draft_id must only match a draft ID provided in the user context.
    - NEVER invent target draft IDs. Never update persisted database records.`;

/**
 * Strict JSON schema definition for Groq / LLM structured outputs.
 */
export const EXTRACTION_RESPONSE_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "FinancialExtractionDTO",
  type: "object",
  required: [
    "entry_intent",
    "action_intent",
    "target_draft_id",
    "transactions",
    "expected_payout",
    "balance_checkin",
    "metadata",
  ],
  additionalProperties: false,
  properties: {
    entry_intent: {
      type: "string",
      enum: ["transaction", "expected_payout", "balance_checkin", "query", "unknown"],
    },
    action_intent: {
      type: "string",
      enum: ["create", "correct", "clarify", "cancel", "unknown"],
    },
    target_draft_id: { type: ["string", "null"] },
    transactions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "type",
          "amount",
          "category",
          "expense_type",
          "ownership",
          "date",
          "description",
        ],
        properties: {
          type: { type: ["string", "null"], enum: ["income", "expense", null] },
          amount: { type: ["string", "null"], pattern: "^[0-9]+(\\.[0-9]{1,2})?$" },
          category: { type: ["string", "null"], maxLength: 40 },
          expense_type: { type: ["string", "null"], enum: ["living", "work", null] },
          ownership: { type: ["string", "null"], enum: ["mine", "not_mine", null] },
          date: { type: ["string", "null"], pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" },
          description: { type: ["string", "null"], maxLength: 200 },
          payment_method: {
            type: ["string", "null"],
            enum: ["cash", "upi", "bank_transfer", "card", "other", null],
          },
          evidence_type: {
            type: ["string", "null"],
            enum: ["voice_transcript", "user_text", "receipt_text", "receipt_image", "bank_sms", null],
          },
          verification_status: {
            type: ["string", "null"],
            enum: ["receipt_reported", "user_asserted", "independently_verified", null],
          },
          merchant_or_counterparty: { type: ["string", "null"], maxLength: 80 },
          external_reference: { type: ["string", "null"], maxLength: 80 },
        },
      },
    },
    expected_payout: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["expected_amount", "kind", "source", "expected_date", "status", "note"],
      properties: {
        expected_amount: { type: ["string", "null"], pattern: "^[0-9]+(\\.[0-9]{1,2})?$" },
        kind: {
          type: ["string", "null"],
          enum: ["platform_payout", "incentive", "client_payment", "advance", "other", null],
        },
        source: { type: ["string", "null"], maxLength: 80 },
        expected_date: { type: ["string", "null"], pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" },
        status: { type: ["string", "null"], enum: ["scheduled", "estimated", "unearned", null] },
        note: { type: ["string", "null"], maxLength: 200 },
      },
    },
    balance_checkin: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["cash_amount", "bank_amount", "not_mine_amount", "note", "checked_at"],
      properties: {
        cash_amount: { type: ["string", "null"], pattern: "^[0-9]+(\\.[0-9]{1,2})?$" },
        bank_amount: { type: ["string", "null"], pattern: "^[0-9]+(\\.[0-9]{1,2})?$" },
        not_mine_amount: { type: ["string", "null"], pattern: "^[0-9]+(\\.[0-9]{1,2})?$" },
        note: { type: ["string", "null"], maxLength: 200 },
        checked_at: { type: ["string", "null"] },
      },
    },
    query: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["query_type"],
      properties: {
        query_type: { type: "string", enum: ["today_spending", "pending_payments", "other"] },
        target_date: { type: ["string", "null"] },
        filter_subject: { type: ["string", "null"] },
      },
    },
    metadata: {
      type: "object",
      additionalProperties: false,
      required: [
        "input_source",
        "certainty",
        "clarification_required",
        "clarification_reason",
        "clarification_questions",
        "raw_utterance",
      ],
      properties: {
        input_source: {
          type: "string",
          enum: ["text", "voice_transcript", "shared_receipt_text", "shared_receipt_image"],
        },
        certainty: { type: "number", minimum: 0, maximum: 1 },
        clarification_required: { type: "boolean" },
        clarification_reason: { type: ["string", "null"] },
        clarification_questions: {
          type: "array",
          items: { type: "string" },
        },
        raw_utterance: { type: "string" },
      },
    },
  },
};

/**
 * Deterministic mock extraction responses for tests, offline development, and frontend testing.
 */
export const MOCK_EXTRACTION_RESPONSES: Record<string, FinancialExtractionDTO> = {
  freelancer_income: {
    entry_intent: "transaction",
    action_intent: "create",
    target_draft_id: null,
    transactions: [
      {
        type: "income",
        amount: "2500",
        category: "earnings",
        expense_type: null,
        ownership: "mine",
        date: "2026-11-21",
        description: "Website development",
        payment_method: "bank_transfer",
        merchant_or_counterparty: "Client",
      },
    ],
    expected_payout: null,
    balance_checkin: null,
    query: null,
    metadata: {
      input_source: "voice_transcript",
      certainty: 0.98,
      clarification_required: false,
      clarification_reason: null,
      clarification_questions: [],
      raw_utterance: "I received 2500 from a client for website development.",
    },
  },

  shop_owner_expense: {
    entry_intent: "transaction",
    action_intent: "create",
    target_draft_id: null,
    transactions: [
      {
        type: "expense",
        amount: "300",
        category: "other",
        expense_type: "work",
        ownership: "mine",
        date: "2026-11-21",
        description: "Raw materials",
      },
    ],
    expected_payout: null,
    balance_checkin: null,
    query: null,
    metadata: {
      input_source: "text",
      certainty: 0.95,
      clarification_required: false,
      clarification_reason: null,
      clarification_questions: [],
      raw_utterance: "Bought raw materials worth 300.",
    },
  },

  street_vendor_cash: {
    entry_intent: "transaction",
    action_intent: "create",
    target_draft_id: null,
    transactions: [
      {
        type: "income",
        amount: "500",
        category: "earnings",
        expense_type: null,
        ownership: "mine",
        date: "2026-11-21",
        description: "Customers",
        payment_method: "cash",
      },
    ],
    expected_payout: null,
    balance_checkin: null,
    query: null,
    metadata: {
      input_source: "voice_transcript",
      certainty: 0.97,
      clarification_required: false,
      clarification_reason: null,
      clarification_questions: [],
      raw_utterance: "Received 500 cash from customers.",
    },
  },

  individual_electricity: {
    entry_intent: "transaction",
    action_intent: "create",
    target_draft_id: null,
    transactions: [
      {
        type: "expense",
        amount: "200",
        category: "other",
        expense_type: "living",
        ownership: "mine",
        date: "2026-11-21",
        description: "Electricity bill",
      },
    ],
    expected_payout: null,
    balance_checkin: null,
    query: null,
    metadata: {
      input_source: "text",
      certainty: 0.96,
      clarification_required: false,
      clarification_reason: null,
      clarification_questions: [],
      raw_utterance: "Paid 200 for electricity.",
    },
  },

  two_transactions: {
    entry_intent: "transaction",
    action_intent: "create",
    target_draft_id: null,
    transactions: [
      {
        type: "income",
        amount: "2500",
        category: "earnings",
        expense_type: null,
        ownership: "mine",
        date: "2026-11-21",
        description: "Customer payment",
      },
      {
        type: "expense",
        amount: "300",
        category: "other",
        expense_type: "work",
        ownership: "mine",
        date: "2026-11-21",
        description: "Raw materials",
      },
    ],
    expected_payout: null,
    balance_checkin: null,
    query: null,
    metadata: {
      input_source: "voice_transcript",
      certainty: 0.96,
      clarification_required: false,
      clarification_reason: null,
      clarification_questions: [],
      raw_utterance: "I received 2500 from a customer and spent 300 on raw materials.",
    },
  },

  missing_amount: {
    entry_intent: "transaction",
    action_intent: "create",
    target_draft_id: null,
    transactions: [
      {
        type: "expense",
        amount: null,
        category: "fuel",
        expense_type: "work",
        ownership: "mine",
        date: "2026-11-21",
        description: "Petrol at Shell station",
      },
    ],
    expected_payout: null,
    balance_checkin: null,
    query: null,
    metadata: {
      input_source: "voice_transcript",
      certainty: 0.85,
      clarification_required: true,
      clarification_reason: "Transaction amount was not specified.",
      clarification_questions: ["How much did you spend on petrol at Shell station?"],
      raw_utterance: "Filled petrol at Shell station",
    },
  },

  cod_collection: {
    entry_intent: "transaction",
    action_intent: "create",
    target_draft_id: null,
    transactions: [
      {
        type: "income",
        amount: "600",
        category: "cod_collection",
        expense_type: null,
        ownership: "not_mine",
        date: "2026-11-21",
        description: "Order #402 COD",
      },
    ],
    expected_payout: null,
    balance_checkin: null,
    query: null,
    metadata: {
      input_source: "text",
      certainty: 0.97,
      clarification_required: false,
      clarification_reason: null,
      clarification_questions: [],
      raw_utterance: "Collected 600 cash on delivery for order 402",
    },
  },

  unknown_category: {
    entry_intent: "transaction",
    action_intent: "create",
    target_draft_id: null,
    transactions: [
      {
        type: "expense",
        amount: "50",
        category: "other",
        expense_type: "work",
        ownership: "mine",
        date: "2026-11-21",
        description: "Stationery for shop",
      },
    ],
    expected_payout: null,
    balance_checkin: null,
    query: null,
    metadata: {
      input_source: "text",
      certainty: 0.92,
      clarification_required: true,
      clarification_reason: "Category 'stationery' mapped to 'other'. Please confirm standard classification.",
      clarification_questions: ["Should stationery be recorded under 'other' work expense?"],
      raw_utterance: "Spent 50 on stationery",
    },
  },

  expected_payout: {
    entry_intent: "expected_payout",
    action_intent: "create",
    target_draft_id: null,
    transactions: [],
    expected_payout: {
      expected_amount: "3000",
      kind: "platform_payout",
      source: "Swiggy",
      expected_date: "2026-11-27",
      status: "scheduled",
      note: "Weekly platform payout",
    },
    balance_checkin: null,
    query: null,
    metadata: {
      input_source: "voice_transcript",
      certainty: 0.95,
      clarification_required: false,
      clarification_reason: null,
      clarification_questions: [],
      raw_utterance: "Expecting 3000 platform payout on Friday",
    },
  },

  today_spending_query: {
    entry_intent: "query",
    action_intent: "unknown",
    target_draft_id: null,
    transactions: [],
    expected_payout: null,
    balance_checkin: null,
    query: {
      query_type: "today_spending",
      target_date: "2026-11-21",
      filter_subject: null,
    },
    metadata: {
      input_source: "voice_transcript",
      certainty: 0.98,
      clarification_required: false,
      clarification_reason: null,
      clarification_questions: [],
      raw_utterance: "How much did I spend today?",
    },
  },

  pending_payments_query: {
    entry_intent: "query",
    action_intent: "unknown",
    target_draft_id: null,
    transactions: [],
    expected_payout: null,
    balance_checkin: null,
    query: {
      query_type: "pending_payments",
      target_date: null,
      filter_subject: null,
    },
    metadata: {
      input_source: "voice_transcript",
      certainty: 0.97,
      clarification_required: false,
      clarification_reason: null,
      clarification_questions: [],
      raw_utterance: "Show me all my pending payments",
    },
  },
};

export interface ValidationContext {
  availableDraftIds?: string[];
  currentDate?: string;
}

export interface ValidatedFinancialExtractionDTO extends FinancialExtractionDTO {
  target_draft_id: string | null;
  transactions: ExtractedTransactionData[];
}

export interface ExtractionValidationResult {
  valid: boolean;
  dto: ValidatedFinancialExtractionDTO | null;
  errors: string[];
}

/**
 * Validates and sanitizes raw model output against the FinancialExtractionDTO contract.
 * Rejects invalid JSON, illegal structures, negative amounts, invalid enums, and unsafe verification claims.
 */
export function validateExtractionOutput(
  rawInput: unknown,
  context: ValidationContext = {}
): ExtractionValidationResult {
  const errors: string[] = [];

  // Step 1: Parse if string
  let parsed: any;
  if (typeof rawInput === "string") {
    try {
      // Strip markdown code fence if model erroneously included it
      const cleaned = rawInput.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (err: any) {
      return {
        valid: false,
        dto: null,
        errors: [`Invalid JSON output from model: ${err.message}`],
      };
    }
  } else if (rawInput && typeof rawInput === "object") {
    parsed = rawInput;
  } else {
    return {
      valid: false,
      dto: null,
      errors: ["Extraction output must be a valid JSON object or string."],
    };
  }

  // Step 2: Validate root fields
  const validEntryIntents: ExtractionEntryIntent[] = [
    "transaction",
    "expected_payout",
    "balance_checkin",
    "query",
    "unknown",
  ];
  if (!validEntryIntents.includes(parsed.entry_intent)) {
    errors.push(`Invalid entry_intent: '${parsed.entry_intent}'.`);
  }

  const validActionIntents: ExtractionActionIntent[] = [
    "create",
    "correct",
    "clarify",
    "cancel",
    "unknown",
  ];
  if (!validActionIntents.includes(parsed.action_intent)) {
    errors.push(`Invalid action_intent: '${parsed.action_intent}'.`);
  }

  if (!parsed.metadata || typeof parsed.metadata !== "object") {
    errors.push("Missing required 'metadata' object.");
  }

  // Step 3: Validate and sanitize transactions
  const sanitizedTransactions: ExtractedTransactionData[] = [];
  if (parsed.transactions !== undefined) {
    if (!Array.isArray(parsed.transactions)) {
      errors.push("'transactions' must be an array.");
    } else {
      for (let i = 0; i < parsed.transactions.length; i++) {
        const tx = parsed.transactions[i];
        if (!tx || typeof tx !== "object") {
          errors.push(`Transaction at index ${i} is not an object.`);
          continue;
        }

        // Validate type
        if (tx.type !== "income" && tx.type !== "expense" && tx.type !== null) {
          errors.push(`Transaction at index ${i} has invalid type '${tx.type}'.`);
        }

        // Validate amount
        if (tx.amount !== null && tx.amount !== undefined) {
          if (typeof tx.amount !== "string" || !/^[0-9]+(\.[0-9]{1,2})?$/.test(tx.amount)) {
            errors.push(
              `Transaction at index ${i} has malformed or negative amount '${tx.amount}'. Must be a positive decimal rupee string.`
            );
          } else {
            try {
              const p = toPaise(tx.amount);
              if (!isValidPaise(p)) {
                errors.push(`Transaction at index ${i} amount is outside safe limits.`);
              }
            } catch (e: any) {
              errors.push(`Transaction at index ${i} amount failed paise conversion: ${e.message}`);
            }
          }
        }

        // Validate date if present
        if (tx.date) {
          if (!isValidISODate(tx.date)) {
            errors.push(`Transaction at index ${i} has invalid ISO date '${tx.date}'.`);
          }
        }

        // Validate ownership & COD rules
        let ownership = tx.ownership ?? "mine";
        if (ownership !== "mine" && ownership !== "not_mine") {
          errors.push(`Transaction at index ${i} has invalid ownership '${tx.ownership}'.`);
          ownership = "mine";
        }

        const isCod =
          tx.category === "cod_collection" ||
          tx.category === "cod_handover" ||
          (tx.description && /cod|cash on delivery/i.test(tx.description));

        if (isCod) {
          ownership = "not_mine";
        }

        // Validate expense_type
        // Fix B: never default missing or invalid expense_type to "living".
        // Invalid values are rejected; missing values remain null and require clarification.
        let expenseType = tx.expense_type;
        if (tx.type === "income" || ownership === "not_mine") {
          expenseType = null; // Enforce DB rule: expense_type must be null for income and not_mine
        } else if (tx.type === "expense" && ownership === "mine") {
          if (expenseType !== "living" && expenseType !== "work" && expenseType !== null) {
            errors.push(`Transaction at index ${i} has invalid expense_type '${expenseType}'.`);
            expenseType = null; // Fix B: reject invalid value, leave null — requires clarification
          }
        }

        // Strict receipt verification safety: NEVER allow independently_verified
        let verificationStatus = tx.verification_status;
        if (
          tx.evidence_type === "receipt_text" ||
          tx.evidence_type === "receipt_image" ||
          verificationStatus === "independently_verified"
        ) {
          verificationStatus = "receipt_reported";
        }

        // Category canonical mapping
        const catMap = mapCanonicalCategory(tx.category, tx.type ?? "expense");

        sanitizedTransactions.push({
          type: tx.type ?? null,
          amount: tx.amount ?? null,
          category: catMap.category,
          expense_type: expenseType,
          ownership,
          // Fix A: missing date must remain null. Never silently use context.currentDate
          // as a fallback — that conflates "not stated" with "today". A date may only come
          // from the model's explicit extraction. Application context date is provided to M2
          // for display purposes only, not injected into persisted records.
          date: tx.date ?? null,
          description: tx.description ?? null,
          payment_method: tx.payment_method ?? null,
          evidence_type: tx.evidence_type ?? null,
          verification_status: verificationStatus ?? "user_asserted",
          merchant_or_counterparty: tx.merchant_or_counterparty ?? null,
          external_reference: tx.external_reference ?? null,
        });
      }
    }
  }

  // Step 4: Validate expected payout safety
  if (parsed.expected_payout) {
    const ep = parsed.expected_payout;
    if (ep.expected_amount !== null && ep.expected_amount !== undefined) {
      if (typeof ep.expected_amount !== "string" || !/^[0-9]+(\.[0-9]{1,2})?$/.test(ep.expected_amount)) {
        errors.push(`Expected payout amount '${ep.expected_amount}' is malformed.`);
      }
    }
    if (ep.status && !["scheduled", "estimated", "unearned"].includes(ep.status)) {
      errors.push(`Expected payout has invalid extraction status '${ep.status}'.`);
    }
  }

  // Step 5: Correction safety against context
  let targetDraftId = parsed.target_draft_id ?? null;
  if (parsed.action_intent === "correct" || parsed.action_intent === "cancel") {
    if (targetDraftId && context.availableDraftIds && !context.availableDraftIds.includes(targetDraftId)) {
      errors.push(`Target draft ID '${targetDraftId}' was not found in available unpersisted drafts.`);
      targetDraftId = null;
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      dto: null,
      errors,
    };
  }

  // Build clean DTO
  let clarificationRequired = Boolean(parsed.metadata?.clarification_required);
  const clarificationQuestions: string[] = Array.isArray(parsed.metadata?.clarification_questions)
    ? [...parsed.metadata.clarification_questions]
    : [];

  // Enforce clarification flags for missing critical fields
  for (const tx of sanitizedTransactions) {
    if (tx.amount === null) {
      clarificationRequired = true;
      if (!clarificationQuestions.some((q) => q.toLowerCase().includes("amount"))) {
        clarificationQuestions.push("How much was the transaction amount?");
      }
    }
    if (tx.type === "expense" && tx.ownership === "mine" && !tx.expense_type) {
      clarificationRequired = true;
      if (!clarificationQuestions.some((q) => q.toLowerCase().includes("living") || q.toLowerCase().includes("work"))) {
        clarificationQuestions.push("Was this expense for living (personal) or work?");
      }
    }
  }

  const dto: ValidatedFinancialExtractionDTO = {
    entry_intent: parsed.entry_intent,
    action_intent: parsed.action_intent,
    target_draft_id: targetDraftId,
    transactions: sanitizedTransactions,
    expected_payout: parsed.expected_payout ?? null,
    balance_checkin: parsed.balance_checkin ?? null,
    query: parsed.query ?? null,
    metadata: {
      input_source: parsed.metadata?.input_source ?? "text",
      certainty: typeof parsed.metadata?.certainty === "number" ? parsed.metadata.certainty : 1.0,
      clarification_required: clarificationRequired,
      clarification_reason: parsed.metadata?.clarification_reason ?? null,
      clarification_questions: clarificationQuestions,
      raw_utterance: parsed.metadata?.raw_utterance ?? "",
    },
  };

  return {
    valid: true,
    dto,
    errors: [],
  };
}
