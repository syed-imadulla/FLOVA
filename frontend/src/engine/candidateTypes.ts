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
}

/**
 * Candidate transaction derived from voice transcript or natural language text.
 */
export interface VoiceTransactionCandidate {
  candidate_id: string;
  draft_id: string | null;
  type: TransactionType;
  /** Integer paise converted safely from decimal string, or null if missing. */
  amount_paise: Paise | null;
  /** Preserved raw decimal rupee string (e.g. "2500" or "120.50"). */
  amount_rupees: string | null;
  category: string;
  expense_type: ExpenseType | null;
  ownership: MoneyOwnership;
  date: ISODate | null;
  description: string | null;
  payment_method: ProposedPaymentMethod | null;
  counterparty: string | null;
  evidence_type: ProposedEvidenceType;
  verification_status: ProposedVerificationStatus;
  clarification_required: boolean;
  clarification_questions: string[];
  raw_utterance: string;
}

/**
 * Candidate transaction derived from receipt OCR or image.
 * Verification status MUST ALWAYS default to "receipt_reported", never "independently_verified".
 */
export interface ExtractedReceiptCandidate {
  candidate_id: string;
  draft_id: string | null;
  type: TransactionType;
  amount_paise: Paise | null;
  amount_rupees: string | null;
  category: string;
  expense_type: ExpenseType | null;
  ownership: MoneyOwnership;
  date: ISODate | null;
  description: string | null;
  payment_method: ProposedPaymentMethod | null;
  merchant: string | null;
  external_reference: string | null;
  evidence_type: ProposedEvidenceType;
  verification_status: "receipt_reported";
  clarification_required: boolean;
  clarification_questions: string[];
  raw_utterance: string;
}
