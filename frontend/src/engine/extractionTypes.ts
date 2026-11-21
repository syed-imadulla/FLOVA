// =====================================================================
// FLOVA AI Financial Extraction DTO Types (M3 Phase 6A MVP)
// Extraction-tier contracts for Groq / LLM natural language & receipt parsing.
// Amounts are decimal rupee strings (e.g. "2500" or "120.50") or null.
// Converted to integer Paise upon user confirmation before DB insert.
// =====================================================================

export type ExtractionEntryIntent =
  | "transaction"
  | "expected_payout"
  | "balance_checkin"
  | "query"
  | "financial_query"
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

/**
 * Basic financial query intents supported for voice / natural language queries.
 * Queries return parameters for M1 backend data retrieval; they NEVER invent balances.
 */
export type FinancialQueryType =
  | "today_spending"
  | "pending_payments"
  | "balance_check"
  | "runway_check"
  | "payout_check"
  | "commitment_check"
  | "general"
  | "other";

export interface ExtractedQueryData {
  query_type: FinancialQueryType;
  /** ISO date string "YYYY-MM-DD" if querying a specific date (defaults to today). */
  target_date?: string | null;
  /** Subject filter if user mentions a specific party or tag (e.g. "Swiggy", "fuel"). */
  filter_subject?: string | null;
  /** Target entity/vendor alias for backward compatibility with M4 */
  target_entity?: string | null;
}

/**
 * Proposed adapter payment method values (extraction-only).
 * NOTE: Explicit M1 approval required before adding to database schema.
 */
export type ProposedPaymentMethod =
  | "cash"
  | "upi"
  | "bank_transfer"
  | "card"
  | "other";

/**
 * Proposed adapter evidence type values (extraction-only).
 * NOTE: Explicit M1 approval required before adding to database schema.
 */
export type ProposedEvidenceType =
  | "voice_transcript"
  | "user_text"
  | "receipt_text"
  | "receipt_image"
  | "bank_sms";

/**
 * Proposed adapter verification status values (extraction-only).
 * NOTE: Receipt evidence must default to "receipt_reported", never "independently_verified".
 * Explicit M1 approval required before adding to database schema.
 */
export type ProposedVerificationStatus =
  | "receipt_reported"
  | "user_asserted"
  | "independently_verified";

/**
 * Single extracted transaction suggestion.
 * A single utterance or receipt may yield multiple suggestions.
 */
export interface ExtractedTransactionData {
  type: "income" | "expense" | null;
  /** Decimal rupee string e.g. "2500" or "300.50". Null if unspecified. */
  amount: string | null;
  /** Canonical category from SUGGESTED_CATEGORIES or mapped to "other". */
  category: string | null;
  /** Required when type='expense' and ownership='mine'. Must be null otherwise. */
  expense_type: "living" | "work" | null;
  /** "mine" for personal money; "not_mine" for COD or platform money. */
  ownership: "mine" | "not_mine" | null;
  /** ISO date string "YYYY-MM-DD". Null if unspecified. */
  date: string | null;
  description: string | null;

  // Receipt & verification metadata (extraction-only, never persisted directly)
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
  input_source?: ExtractionInputSource;
  certainty: number;
  clarification_required: boolean;
  clarification_reason: string | null;
  clarification_questions: string[];
  raw_utterance: string;
}

/**
 * Primary DTO returned by LLM extraction engine.
 * Supports multiple transaction suggestions per utterance, queries, check-ins, and payouts.
 */
export interface FinancialExtractionDTO {
  entry_intent: ExtractionEntryIntent;
  action_intent: ExtractionActionIntent;
  /**
   * For correction/cancel: must match an existing unpersisted draft ID
   * supplied in application context. Model must NEVER invent an ID.
   */
  target_draft_id?: string | null;
  /** Backwards compatibility alias for target_draft_id (consumed by M4 local extractor) */
  target_id?: string | null;
  /** Array of extracted transaction suggestions (supports multi-entry utterances). */
  transactions?: ExtractedTransactionData[];
  /** Backwards compatibility alias for single transaction consumers (e.g. M4 VoiceCapturePage) */
  transaction?: ExtractedTransactionData | null;
  expected_payout: ExtractedPayoutData | null;
  balance_checkin: ExtractedCheckinData | null;
  /** Structured query parameters if entry_intent === "query" or "financial_query". */
  query?: ExtractedQueryData | null;
  /** Backwards compatibility alias for query (consumed by M4 / Phase 9 voice services) */
  financial_query?: ExtractedQueryData | null;
  metadata: ExtractionMetadata;
}
