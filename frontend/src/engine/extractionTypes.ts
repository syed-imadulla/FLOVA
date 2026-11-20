// =====================================================================
// FLOVA AI Financial Extraction DTO Types (M3 Phase 5)
// Extraction-tier contracts for Groq / LLM natural language parsing.
// Amounts are decimal rupee strings (e.g. "450" or "120.50") or null.
// Converted to integer Paise upon user confirmation before DB insert.
// =====================================================================

export type ExtractionEntryIntent =
  | "transaction"
  | "expected_payout"
  | "balance_checkin"
  | "financial_query"
  | "unknown";

export type ExtractionActionIntent =
  | "create"
  | "correct"
  | "clarify"
  | "cancel"
  | "unknown";

export interface ExtractedTransactionData {
  type: "income" | "expense" | null;
  amount: string | null;
  category: string | null;
  expense_type: "living" | "work" | null;
  ownership: "mine" | "not_mine" | null;
  date: string | null;
  description: string | null;
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

export interface ExtractedQueryData {
  query_type: "runway_check" | "balance_check" | "payout_check" | "commitment_check" | "general";
  target_date?: string | null;
  target_entity?: string | null;
}

export interface ExtractionMetadata {
  certainty: number;
  clarification_required: boolean;
  clarification_reason: string | null;
  clarification_questions: string[];
  raw_utterance: string;
}

export interface FinancialExtractionDTO {
  entry_intent: ExtractionEntryIntent;
  action_intent: ExtractionActionIntent;
  target_id: string | null;
  transaction: ExtractedTransactionData | null;
  expected_payout: ExtractedPayoutData | null;
  balance_checkin: ExtractedCheckinData | null;
  financial_query?: ExtractedQueryData | null;
  metadata: ExtractionMetadata;
}
