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
import { MAX_TRANSACTION_LIMIT_PAISE } from "../lib/limits";
import { isValidPaise } from "./validation";

/**
 * RFC 4122 UUID validation regex (versions 1-5, case-insensitive).
 */
export const RFC_4122_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(id: unknown): id is string {
  return typeof id === "string" && RFC_4122_UUID_REGEX.test(id.trim());
}

/**
 * Generates a standard RFC 4122 v4 random UUID string.
 * Uses crypto.randomUUID() when available (modern browser, Deno, Node 19+).
 * Falls back to RFC 4122 v4 generator for environments without crypto.randomUUID.
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().toLowerCase();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    .replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    })
    .toLowerCase();
}

/**
 * 32-bit FNV-1a non-cryptographic hash for deterministic seed derivation.
 *
 * Guarantees & Limitations:
 * - Determinism: Identical inputs produce identical 32-bit integer values across runs.
 * - Non-cryptographic: FNV-1a is designed for fast hashing, NOT cryptographic security or collision resistance.
 * - Sibling disambiguation: Intended solely for disambiguating sibling transaction candidates in a multi-transaction draft.
 * - Collisions: Collisions are theoretically possible (birthday bound ~2^16 for 32-bit space). It does NOT offer 122-bit cryptographic collision resistance.
 */
function fnv1a32(str: string, seed = 0x811c9dc5): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Derives a deterministic RFC 4122 v4-formatted UUID from a seed string.
 *
 * Guarantees & Limitations:
 * - Format compliance: Returns a string structurally conforming to RFC 4122 UUID layout (version 4 nibble, variant bits 10xx).
 * - Determinism: Identical seed strings yield identical UUID-formatted strings across runtime sessions.
 * - Non-cryptographic: Does NOT provide cryptographic randomness or 122 bits of cryptographic collision resistance.
 * - Sibling disambiguation: Intended as a synchronous fallback to disambiguate sibling transactions in a multi-transaction draft (`${draftId}:tx:${index}`) without appending non-UUID suffixes like '-tx-1'.
 * - Collisions: Collisions across different arbitrary seed strings are theoretically possible.
 */
export function deriveDeterministicUUID(seed: string): string {
  const h1 = fnv1a32(seed, 0x811c9dc5).toString(16).padStart(8, "0");
  const h2 = fnv1a32(`${seed}:1`, 0x9e3779b9).toString(16).padStart(8, "0");
  const h3 = fnv1a32(`${seed}:2`, 0x6a09e667).toString(16).padStart(8, "0");
  const h4 = fnv1a32(`${seed}:3`, 0xbb67ae85).toString(16).padStart(8, "0");

  const time_low = h1;
  const time_mid = h2.slice(0, 4);
  const time_hi_and_version = `4${h2.slice(5, 8)}`;
  const clock_seq_hi = (((parseInt(h3[0], 16) || 0) & 0x3) | 0x8).toString(16);
  const clock_seq = `${clock_seq_hi}${h3.slice(1, 4)}`;
  const node = `${h4}${h3.slice(4, 8)}`;

  return `${time_low}-${time_mid}-${time_hi_and_version}-${clock_seq}-${node}`.toLowerCase();
}

/**
 * Resolves or creates a stable, valid RFC 4122 UUID for a candidate transaction.
 *
 * Rules:
 * 1. If trusted context supplies existingCandidateIds for this slot, reuse it.
 * 2. If a draft ID was authorized and provided:
 *    - For single transaction (index === 0): reuse draftId if it is a valid UUID, otherwise derive deterministic UUID.
 *    - For multiple transactions (index > 0): deterministically derive a distinct valid UUID from `${draftId}:tx:${index}`.
 *    - NEVER appends string suffixes like "-tx-N" to UUIDs.
 * 3. If neither is supplied: generate a fresh random RFC 4122 v4 UUID.
 */
export function resolveCandidateId(
  draftId: string | null,
  index: number,
  context?: PendingDraftContext
): string {
  if (context?.existingCandidateIds && context.existingCandidateIds[index]) {
    const existing = context.existingCandidateIds[index].trim();
    if (isValidUUID(existing)) {
      return existing.toLowerCase();
    }
    return deriveDeterministicUUID(existing);
  }

  if (draftId) {
    const cleanDraftId = draftId.trim();
    if (index === 0) {
      if (isValidUUID(cleanDraftId)) {
        return cleanDraftId.toLowerCase();
      }
      return deriveDeterministicUUID(cleanDraftId);
    }
    // Sibling transaction in multi-transaction draft: derive deterministic valid RFC 4122 UUID
    return deriveDeterministicUUID(`${cleanDraftId}:tx:${index}`);
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
  if (!isValidPaise(paise) || paise > MAX_TRANSACTION_LIMIT_PAISE) {
    throw new Error(
      `Amount '${amountRupees}' converted to paise (${paise}) is outside safe integer limits or exceeds ₹10,00,000 maximum application limit.`
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
 *
 * Invariants:
 * 1. candidate.candidate_id MUST be an explicit, valid RFC 4122 UUID.
 *    - Rejects invalid or missing candidate IDs with an Error.
 *    - NEVER falls back to candidate.draft_id (which would cause sibling collision on transactions_pkey).
 *    - NEVER silently generates a new UUID during confirmation (which breaks retry idempotency).
 * 2. Amount and expense_type rules are strictly enforced.
 */
export function candidateToNewTransaction(
  candidate: VoiceTransactionCandidate | ExtractedReceiptCandidate
): NewTransaction {
  if (!candidate.candidate_id || !isValidUUID(candidate.candidate_id)) {
    throw new Error(
      `Cannot confirm candidate transaction: candidate_id '${String(
        candidate.candidate_id
      )}' is missing or not a valid RFC 4122 UUID.`
    );
  }

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
    // Preserve candidate UUID strictly; never fall back or mint a new ID during confirmation
    id: candidate.candidate_id.toLowerCase(),
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
