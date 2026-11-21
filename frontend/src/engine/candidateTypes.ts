// =====================================================================
// FLOVA Phase 7 Candidate Contracts (Owner: M3)
// Candidate representations for voice and receipt transactions awaiting user confirmation.
// =====================================================================

import type {
  ExpenseType,
  ISODate,
  MoneyOwnership,
  Paise,
  TransactionType,
} from "../types/contracts";
import type {
  ProposedEvidenceType,
  ProposedPaymentMethod,
  ProposedVerificationStatus,
} from "./extractionTypes";

export interface PendingDraftContext {
  /** Trusted pending draft IDs belonging to the authenticated user. */
  authorizedDraftIds: string[];
  /** Optional existing candidate IDs for mapping idempotency across repeated runs. */
  existingCandidateIds?: string[];
  /** Explicit trusted application date (e.g. client local ISO date) if user context supplies one. */
  trustedDate?: ISODate;
}

/**
 * Candidate transaction derived from voice transcript or natural language text.
 * Supports both candidate_id (Phase 7 M3) and id (shared contracts), plus camelCase aliases.
 */
export interface VoiceTransactionCandidate {
  candidate_id: string;
  /** Shared contracts alias for candidate_id */
  id?: string;
  draft_id: string | null;
  type: TransactionType;
  /** Integer paise converted safely from decimal string, or null if missing. */
  amount_paise: Paise | null;
  /** Shared contracts alias for amount_paise */
  amountPaise?: Paise | null;
  /** Preserved raw decimal rupee string (e.g. "2500" or "120.50"). */
  amount_rupees: string | null;
  category: string;
  expense_type: ExpenseType | null;
  /** Shared contracts alias for expense_type */
  expenseType?: ExpenseType | null;
  ownership: MoneyOwnership;
  date: ISODate | null;
  /** Explicit date extracted from user text/utterance, or null if omitted. */
  extracted_date?: ISODate | null;
  /** Date supplied by trusted application context, if any. */
  contextual_date?: ISODate | null;
  description: string | null;
  payment_method: ProposedPaymentMethod | null;
  counterparty: string | null;
  evidence_type: ProposedEvidenceType;
  verification_status: ProposedVerificationStatus;
  clarification_required: boolean;
  /** Shared contracts alias for clarification_required */
  needsReview?: boolean;
  clarification_questions: string[];
  /** Shared contracts alias for clarification_questions */
  missingFields?: string[];
  raw_utterance: string;
  /** Shared contracts alias for raw_utterance */
  transcript?: string;
  confidence?: number;
}

/**
 * Candidate transaction derived from receipt OCR or image.
 * Verification status MUST ALWAYS default to "receipt_reported", never "independently_verified".
 * Supports both candidate_id (Phase 7 M3) and id (shared contracts), plus camelCase aliases.
 */
export interface ExtractedReceiptCandidate {
  candidate_id: string;
  /** Shared contracts alias for candidate_id */
  id?: string;
  draft_id: string | null;
  type: TransactionType;
  amount_paise: Paise | null;
  /** Shared contracts alias for amount_paise */
  amountPaise?: Paise | null;
  amount_rupees: string | null;
  category: string;
  expense_type: ExpenseType | null;
  /** Shared contracts alias for expense_type */
  expenseType?: ExpenseType | null;
  ownership: MoneyOwnership;
  date: ISODate | null;
  /** Explicit date extracted from user text/utterance, or null if omitted. */
  extracted_date?: ISODate | null;
  /** Date supplied by trusted application context, if any. */
  contextual_date?: ISODate | null;
  description: string | null;
  payment_method: ProposedPaymentMethod | null;
  merchant: string | null;
  external_reference: string | null;
  evidence_type: ProposedEvidenceType;
  verification_status: "receipt_reported";
  clarification_required: boolean;
  /** Shared contracts alias for clarification_required */
  needsReview?: boolean;
  clarification_questions: string[];
  /** Shared contracts alias for clarification_questions */
  missingFields?: string[];
  raw_utterance: string;
  notes?: string | null;
  confidence?: number;
  rawExtractedData?: Record<string, unknown>;
}
