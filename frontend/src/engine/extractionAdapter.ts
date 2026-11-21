// =====================================================================
// FLOVA AI Financial Extraction Adapter (M3 Phase 5B MVP)
// Validates, sanitizes, and adapts AI extraction DTOs into FLOVA contracts.
// =====================================================================

import { toPaise } from "../lib/money";
import type {
  ExpenseType,
  MoneyOwnership,
  NewBalanceCheckin,
  NewPayout,
  NewTransaction,
  TransactionType,
} from "../types/contracts";
import { SUGGESTED_CATEGORIES } from "../types/contracts";
import type {
  ExtractedTransactionData,
  FinancialExtractionDTO,
} from "./extractionTypes";

export interface CategoryMappingResult {
  category: string;
  isCanonical: boolean;
  requiresClarification: boolean;
}

/**
 * Maps a raw category string to canonical SUGGESTED_CATEGORIES.
 * Unknown categories map to "other" and flag clarification needed.
 */
export function mapCanonicalCategory(
  rawCategory: string | null | undefined,
  type: TransactionType
): CategoryMappingResult {
  if (!rawCategory || typeof rawCategory !== "string") {
    return { category: "other", isCanonical: false, requiresClarification: true };
  }

  const normalized = rawCategory.trim().toLowerCase();
  const canonicalList = SUGGESTED_CATEGORIES[type] as readonly string[];

  if (canonicalList.includes(normalized)) {
    return { category: normalized, isCanonical: true, requiresClarification: false };
  }

  // Non-canonical category: map to "other" and flag clarification
  return { category: "other", isCanonical: false, requiresClarification: true };
}

export interface CorrectionResolutionResult {
  valid: boolean;
  resolvedDraftId: string | null;
  requiresClarification: boolean;
  error?: string;
}

/**
 * Validates correction intent against application-supplied pending draft IDs.
 * Rules:
 * 1. Target draft ID must be supplied in context.
 * 2. Model cannot invent draft IDs.
 * 3. Model cannot update persisted records.
 * 4. Ambiguous candidates trigger clarification.
 */
export function resolveCorrectionIntent(
  dto: FinancialExtractionDTO,
  availableDraftIds: string[],
  matchingCandidateIds: string[] = []
): CorrectionResolutionResult {
  if (dto.action_intent !== "correct" && dto.action_intent !== "cancel") {
    return { valid: true, resolvedDraftId: null, requiresClarification: false };
  }

  // If multiple candidates could match the user utterance (e.g. "change the petrol one" when 2 petrol drafts exist)
  if (matchingCandidateIds.length > 1) {
    return {
      valid: false,
      resolvedDraftId: null,
      requiresClarification: true,
      error: `Ambiguous correction: multiple pending drafts match (${matchingCandidateIds.join(", ")}). Clarification required.`,
    };
  }

  const targetId = dto.target_draft_id;
  if (!targetId) {
    return {
      valid: false,
      resolvedDraftId: null,
      requiresClarification: true,
      error: "Correction missing target draft ID. Model must not invent IDs.",
    };
  }

  if (!availableDraftIds.includes(targetId)) {
    return {
      valid: false,
      resolvedDraftId: null,
      requiresClarification: true,
      error: `Target draft ID '${targetId}' not found in active pending drafts. Model cannot update persisted transactions.`,
    };
  }

  return { valid: true, resolvedDraftId: targetId, requiresClarification: false };
}

/**
 * Sanitizes extracted transaction data and ensures receipt verification status defaults
 * strictly to "receipt_reported", never "independently_verified".
 */
export function sanitizeExtractedTransaction(
  raw: ExtractedTransactionData
): ExtractedTransactionData {
  let verificationStatus = raw.verification_status;
  if (raw.evidence_type === "receipt_text" || raw.evidence_type === "receipt_image") {
    // Receipt evidence must default to receipt_reported, never independently_verified
    verificationStatus = "receipt_reported";
  }

  const type = raw.type ?? "expense";
  const catRes = mapCanonicalCategory(raw.category, type);

  return {
    ...raw,
    category: catRes.category,
    verification_status: verificationStatus ?? "user_asserted",
  };
}

export interface CheckinAdaptationResult {
  checkin: NewBalanceCheckin | null;
  requiresClarification: boolean;
  missingFields: string[];
}

/**
 * Adapts extracted checkin data to NewBalanceCheckin.
 * Preserves cash, bank, and not_mine separately.
 * Requires clarification if cash or bank is missing (null); never silently defaults to 0.
 */
export function adaptExtractedCheckin(dto: FinancialExtractionDTO): CheckinAdaptationResult {
  const checkinData = dto.balance_checkin;
  if (!checkinData) {
    return { checkin: null, requiresClarification: true, missingFields: ["balance_checkin"] };
  }

  const missing: string[] = [];
  if (checkinData.cash_amount === null || checkinData.cash_amount === undefined) {
    missing.push("cash_amount");
  }
  if (checkinData.bank_amount === null || checkinData.bank_amount === undefined) {
    missing.push("bank_amount");
  }

  if (missing.length > 0) {
    return {
      checkin: null,
      requiresClarification: true,
      missingFields: missing,
    };
  }

  const notMinePaise = checkinData.not_mine_amount ? toPaise(checkinData.not_mine_amount) : 0;

  return {
    checkin: {
      cash: toPaise(checkinData.cash_amount!),
      bank: toPaise(checkinData.bank_amount!),
      notMine: notMinePaise,
      note: checkinData.note ?? undefined,
      checkedAt: checkinData.checked_at ?? undefined,
    },
    requiresClarification: false,
    missingFields: [],
  };
}

/**
 * Adapts an array of extracted transaction suggestions into validated NewTransaction inputs.
 */
export function adaptExtractedTransactions(dto: FinancialExtractionDTO): NewTransaction[] {
  if (dto.entry_intent !== "transaction" || !Array.isArray(dto.transactions)) {
    return [];
  }

  const results: NewTransaction[] = [];
  for (const tx of dto.transactions) {
    const sanitized = sanitizeExtractedTransaction(tx);

    // Fix C: null/missing amount must remain absent — never default to 0.
    if (!sanitized.amount) {
      // Skip transactions without an amount; callers should use Phase 7 candidates
      // which carry clarification_required=true for missing amounts.
      continue;
    }

    const amountPaise = toPaise(sanitized.amount);
    const type: TransactionType = sanitized.type ?? "expense";
    const ownership: MoneyOwnership = sanitized.ownership ?? "mine";
    let expenseType: ExpenseType | undefined = undefined;

    if (type === "expense" && ownership === "mine") {
      // Fix B: never default missing expense_type to "living".
      // If expense_type is missing for an own expense, skip — requires clarification.
      if (!sanitized.expense_type) {
        continue;
      }
      expenseType = sanitized.expense_type;
    }

    results.push({
      type,
      amount: amountPaise,
      category: sanitized.category ?? "other",
      expenseType,
      ownership,
      date: sanitized.date ?? undefined,
      description: sanitized.description ?? undefined,
      source: "ai_suggestion",
    });
  }
  return results;
}

/**
 * Adapts extracted payout data into NewPayout input.
 * Expected payouts strictly remain forward-looking (scheduled/estimated/unearned)
 * and NEVER become received income.
 */
export function adaptExtractedPayout(dto: FinancialExtractionDTO): NewPayout | null {
  if (dto.entry_intent !== "expected_payout" || !dto.expected_payout) {
    return null;
  }

  const p = dto.expected_payout;
  if (!p.expected_amount) {
    return null;
  }

  return {
    expected: toPaise(p.expected_amount),
    kind: p.kind ?? "platform_payout",
    source: p.source ?? undefined,
    expectedDate: p.expected_date ?? null,
    status: p.status ?? "scheduled",
    note: p.note ?? undefined,
  };
}
