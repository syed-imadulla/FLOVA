// =====================================================================
// FLOVA Phase 7 Candidate Adapter (Owner: M3)
// Maps FinancialExtractionDTO into ExtractedReceiptCandidate and
// VoiceTransactionCandidate, and adapts candidates for confirmCandidateTransaction.
// =====================================================================

import { toPaise } from "../lib/money";
import type {
  ExpenseType,
  ISODate,
  MoneyOwnership,
  NewTransaction,
  Paise,
  TransactionType,
} from "../types/contracts";
import type {
  ExtractedReceiptCandidate,
  PendingDraftContext,
  VoiceTransactionCandidate,
} from "./candidateTypes";
import { mapCanonicalCategory } from "./extractionAdapter";
import type {
  ExtractedTransactionData,
  FinancialExtractionDTO,
} from "./extractionTypes";
import { isValidPaise } from "./validation";

/**
 * Generates a standard RFC4122 v4 UUID string.
 * Uses crypto.randomUUID() when available (modern browser, Deno, Node 19+).
 * Falls back to RFC4122 v4 UUID generator for environments without crypto.randomUUID.
 */
function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Resolves or creates a stable candidate ID.
 * Hierarchy:
 * 1. If trusted context supplies existingCandidateIds for this slot, reuse it.
 * 2. If a draft ID was authorized and exists, reuse it.
 * 3. Generate once at candidate creation and retain in draft lifecycle.
 */
function resolveCandidateId(
  draftId: string | null,
  index: number,
  context?: PendingDraftContext
): string {
  if (context?.existingCandidateIds && context.existingCandidateIds[index]) {
    return context.existingCandidateIds[index];
  }
  if (draftId) {
    return index === 0 ? draftId : `${draftId}-tx-${index}`;
  }
  return generateUUID();
}

/**
 * Safely converts a decimal rupee string to integer Paise.
 * Rules:
 * - null/undefined remains null (never defaulted to 0).
 * - Malformed, negative, non-numeric, or non-finite strings throw an Error.
 * - Result must pass isValidPaise check.
 */
export function safeConvertRupeeStringToPaise(
  amountRupees: string | null | undefined
): Paise | null {
  if (amountRupees === null || amountRupees === undefined) {
    return null;
  }
  const trimmed = amountRupees.trim();
  if (trimmed === "") {
    return null;
  }

  // Reject negatives or malformed expressions
  if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(trimmed)) {
    throw new Error(
      `Invalid amount '${amountRupees}': must be a positive decimal rupee string without currency symbols or negative signs.`
    );
  }

  const paise = toPaise(trimmed);
  if (!isValidPaise(paise)) {
    throw new Error(
      `Amount '${amountRupees}' converted to paise (${paise}) is outside safe integer limits.`
    );
  }

  return paise;
}

/**
 * Validates and preserves draft IDs against trusted application context.
 * The adapter never invents a draft ID.
 */
function resolveCandidateDraftId(
  dto: FinancialExtractionDTO,
  context?: PendingDraftContext
): string | null {
  const targetId = dto.target_draft_id ?? dto.target_id ?? null;
  if (!targetId) {
    return null;
  }

  if (context && context.authorizedDraftIds) {
    if (!context.authorizedDraftIds.includes(targetId)) {
      throw new Error(
        `DRAFT_ACCESS_DENIED: Draft ID '${targetId}' is not authorized in current pending draft context.`
      );
    }
  }

  return targetId;
}

/**
 * Maps a single ExtractedTransactionData to a VoiceTransactionCandidate.
 */
function mapTransactionToVoiceCandidate(
  tx: ExtractedTransactionData,
  dto: FinancialExtractionDTO,
  index: number,
  draftId: string | null,
  context?: PendingDraftContext
): VoiceTransactionCandidate {
  const amountPaise = safeConvertRupeeStringToPaise(tx.amount);
  const type: TransactionType = tx.type ?? "expense";

  // Category canonicalization
  const catRes = mapCanonicalCategory(tx.category, type);

  // Ownership & COD rules
  let ownership: MoneyOwnership = tx.ownership ?? "mine";
  const isCod =
    catRes.category === "cod_collection" ||
    catRes.category === "cod_handover" ||
    (tx.description && /cod|cash on delivery/i.test(tx.description));

  if (isCod) {
    ownership = "not_mine";
  }

  // Expense type rule: required for own expenses; must be null for income or not_mine
  let expenseType: ExpenseType | null = null;
  if (type === "expense" && ownership === "mine") {
    expenseType = tx.expense_type ?? null;
  }

  const clarificationQuestions: string[] = [
    ...(dto.metadata?.clarification_questions ?? []),
  ];
  let clarificationRequired = dto.metadata?.clarification_required ?? false;

  if (amountPaise === null) {
    clarificationRequired = true;
    if (!clarificationQuestions.some((q) => q.toLowerCase().includes("amount"))) {
      clarificationQuestions.push("How much was the transaction amount?");
    }
  }
  if (type === "expense" && ownership === "mine" && !expenseType) {
    clarificationRequired = true;
    if (!clarificationQuestions.some((q) => q.toLowerCase().includes("living") || q.toLowerCase().includes("work"))) {
      clarificationQuestions.push("Was this expense for living (personal) or work?");
    }
  }
  if (catRes.requiresClarification) {
    clarificationRequired = true;
  }

  // Fix A: missing date stays null. Never silently use new Date().
  // Trusted application context can supply a date without inventing one.
  const extractedDate = (tx.date as ISODate) ?? null;
  const contextualDate = context?.trustedDate ?? null;
  const resolvedDate = extractedDate ?? contextualDate;

  const candidateId = resolveCandidateId(draftId, index, context);

  return {
    candidate_id: candidateId,
    draft_id: draftId,
    type,
    amount_paise: amountPaise,
    amount_rupees: tx.amount ?? null,
    category: catRes.category,
    expense_type: expenseType,
    ownership,
    date: resolvedDate,
    extracted_date: extractedDate,
    contextual_date: contextualDate,
    description: tx.description ?? null,
    payment_method: tx.payment_method ?? null,
    counterparty: tx.merchant_or_counterparty ?? null,
    evidence_type: tx.evidence_type ?? "voice_transcript",
    verification_status: "user_asserted",
    clarification_required: clarificationRequired,
    clarification_questions: clarificationQuestions,
    raw_utterance: dto.metadata?.raw_utterance ?? "",
  };
}

/**
 * Maps a single ExtractedTransactionData to an ExtractedReceiptCandidate.
 * Enforces verification_status = "receipt_reported", NEVER "independently_verified".
 */
function mapTransactionToReceiptCandidate(
  tx: ExtractedTransactionData,
  dto: FinancialExtractionDTO,
  index: number,
  draftId: string | null,
  context?: PendingDraftContext
): ExtractedReceiptCandidate {
  const amountPaise = safeConvertRupeeStringToPaise(tx.amount);
  const type: TransactionType = tx.type ?? "expense";

  const catRes = mapCanonicalCategory(tx.category, type);

  let ownership: MoneyOwnership = tx.ownership ?? "mine";
  if (catRes.category === "cod_collection" || catRes.category === "cod_handover") {
    ownership = "not_mine";
  }

  let expenseType: ExpenseType | null = null;
  if (type === "expense" && ownership === "mine") {
    expenseType = tx.expense_type ?? null;
  }

  const clarificationQuestions: string[] = [
    ...(dto.metadata?.clarification_questions ?? []),
  ];
  let clarificationRequired = dto.metadata?.clarification_required ?? false;

  if (amountPaise === null) {
    clarificationRequired = true;
    clarificationQuestions.push("How much was the receipt total?");
  }
  if (type === "expense" && ownership === "mine" && !expenseType) {
    clarificationRequired = true;
    clarificationQuestions.push("Was this receipt for living or work expenses?");
  }
  if (catRes.requiresClarification) {
    clarificationRequired = true;
  }

  // Fix A: missing date stays null. Never silently use new Date().
  const extractedDate = (tx.date as ISODate) ?? null;
  const contextualDate = context?.trustedDate ?? null;
  const resolvedDate = extractedDate ?? contextualDate;

  const candidateId = resolveCandidateId(draftId, index, context);

  return {
    candidate_id: candidateId,
    draft_id: draftId,
    type,
    amount_paise: amountPaise,
    amount_rupees: tx.amount ?? null,
    category: catRes.category,
    expense_type: expenseType,
    ownership,
    date: resolvedDate,
    extracted_date: extractedDate,
    contextual_date: contextualDate,
    description: tx.description ?? null,
    payment_method: tx.payment_method ?? null,
    merchant: tx.merchant_or_counterparty ?? null,
    external_reference: tx.external_reference ?? null,
    evidence_type: tx.evidence_type === "receipt_text" ? "receipt_text" : "receipt_image",
    // Strict invariant: NEVER independently_verified
    verification_status: "receipt_reported",
    clarification_required: clarificationRequired,
    clarification_questions: clarificationQuestions,
    raw_utterance: dto.metadata?.raw_utterance ?? "",
  };
}

/**
 * Extracts transactions list supporting both multi-entry array (transactions)
 * and single entry (transaction) backwards-compatibility.
 */
function getTransactionsFromDto(dto: FinancialExtractionDTO): ExtractedTransactionData[] {
  if (Array.isArray(dto.transactions) && dto.transactions.length > 0) {
    return dto.transactions;
  }
  if (dto.transaction) {
    return [dto.transaction];
  }
  return [];
}

/**
 * Maps FinancialExtractionDTO into VoiceTransactionCandidate[].
 * Invariant: Expected payouts NEVER map into candidates.
 */
export function mapDtoToVoiceCandidates(
  dto: FinancialExtractionDTO,
  context?: PendingDraftContext
): VoiceTransactionCandidate[] {
  // Invariant 3: Expected payouts must NEVER become candidate transactions
  if (dto.entry_intent === "expected_payout" || dto.entry_intent === "balance_checkin" || dto.entry_intent === "query") {
    return [];
  }

  const txList = getTransactionsFromDto(dto);
  if (txList.length === 0) {
    return [];
  }

  const draftId = resolveCandidateDraftId(dto, context);

  return txList.map((tx, idx) => mapTransactionToVoiceCandidate(tx, dto, idx, draftId, context));
}

/**
 * Maps FinancialExtractionDTO into ExtractedReceiptCandidate[].
 * Invariant: Expected payouts NEVER map into candidates.
 * Invariant: Receipt verification status is strictly "receipt_reported".
 */
export function mapDtoToReceiptCandidates(
  dto: FinancialExtractionDTO,
  context?: PendingDraftContext
): ExtractedReceiptCandidate[] {
  // Invariant 3: Expected payouts must NEVER become candidate transactions
  if (dto.entry_intent === "expected_payout" || dto.entry_intent === "balance_checkin" || dto.entry_intent === "query") {
    return [];
  }

  const txList = getTransactionsFromDto(dto);
  if (txList.length === 0) {
    return [];
  }

  const draftId = resolveCandidateDraftId(dto, context);

  return txList.map((tx, idx) => mapTransactionToReceiptCandidate(tx, dto, idx, draftId, context));
}

/**
 * Adapts a candidate (voice or receipt) into a validated NewTransaction payload.
 * Does NOT persist or write to database.
 */
export function candidateToNewTransaction(
  candidate: VoiceTransactionCandidate | ExtractedReceiptCandidate
): NewTransaction {
  if (candidate.amount_paise === null || candidate.amount_paise <= 0) {
    throw new Error("Cannot confirm candidate transaction: invalid or missing amount.");
  }
  if (
    candidate.type === "expense" &&
    candidate.ownership === "mine" &&
    !candidate.expense_type
  ) {
    throw new Error(
      "Cannot confirm candidate transaction: own expenses require an expense_type ('living' or 'work')."
    );
  }

  return {
    // Stable ID: reuse draft_id if available, otherwise candidate_id.
    id: candidate.draft_id ?? candidate.candidate_id,
    type: candidate.type,
    amount: candidate.amount_paise,
    category: candidate.category,
    description: candidate.description ?? undefined,
    expenseType:
      candidate.type === "expense" && candidate.ownership === "mine"
        ? (candidate.expense_type ?? undefined)
        : undefined,
    ownership: candidate.ownership,
    date: candidate.date ?? undefined,
    source: candidate.evidence_type === "voice_transcript" ? "voice" : "ai_suggestion",
  };
}

/**
 * Phase 7 candidate confirmation flow.
 * Adapts candidate into NewTransaction and delegates persistence to the caller's persistence function.
 * The adapter does NOT perform database writes or balance calculations itself.
 */
export async function confirmCandidateTransaction<T = NewTransaction>(
  candidate: VoiceTransactionCandidate | ExtractedReceiptCandidate,
  persistFn?: (tx: NewTransaction) => Promise<T>
): Promise<T | NewTransaction> {
  const newTx = candidateToNewTransaction(candidate);
  if (persistFn) {
    return await persistFn(newTx);
  }
  return newTx;
}
