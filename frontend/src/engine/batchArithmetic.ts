// =====================================================================
// FLOVA Batch Transaction Arithmetic Engine (Owner: M3 / Phase 15)
// Deterministic integer paise calculation of multi-candidate batch totals,
// net cash movements, category breakdowns, and validation states.
// Invariant: The LLM NEVER calculates financial totals. All math is paise-safe.
// =====================================================================

import type { Paise, VoiceTransactionCandidate, BatchTransactionSummary } from "../types/contracts";

export interface BatchCandidateValidationResult {
  candidateId: string;
  isValid: boolean;
  missingFields: string[];
  issues: string[];
}

/**
 * Deterministically computes summary statistics and category breakdowns for a batch
 * of extracted transaction candidates in integer paise.
 */
export function calculateBatchSummary(candidates: VoiceTransactionCandidate[]): BatchTransactionSummary {
  let totalIncomePaise: Paise = 0;
  let totalExpensesPaise: Paise = 0;
  let validCount = 0;
  let clarificationCount = 0;
  const categoryTotals: Record<string, Paise> = {};

  for (const c of candidates) {
    const amount = c.amountPaise ?? c.amount_paise ?? null;
    const isNeedsReview = c.needsReview || c.clarification_required || (c.missingFields && c.missingFields.length > 0);

    if (isNeedsReview || amount === null || amount <= 0) {
      clarificationCount++;
      continue;
    }

    validCount++;
    const type = c.type;
    const cat = c.category || "other";

    if (type === "income") {
      totalIncomePaise += amount;
    } else if (type === "expense") {
      totalExpensesPaise += amount;
    }

    categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
  }

  const netMovementPaise: Paise = totalIncomePaise - totalExpensesPaise;

  return {
    totalIncomePaise,
    totalExpensesPaise,
    netMovementPaise,
    candidateCount: candidates.length,
    validCount,
    clarificationCount,
    categoryTotals,
  };
}

/**
 * Validates individual transaction candidates within a batch.
 */
export function validateBatchCandidate(candidate: VoiceTransactionCandidate): BatchCandidateValidationResult {
  const issues: string[] = [];
  const missingFields: string[] = [];
  const amount = candidate.amountPaise ?? candidate.amount_paise ?? null;

  if (amount === null || amount === undefined) {
    missingFields.push("amount");
    issues.push("Amount is missing");
  } else if (amount <= 0) {
    issues.push("Amount must be greater than zero");
  } else if (amount > 100000000) {
    issues.push("Amount exceeds ₹10,00,000 maximum transaction limit");
  }

  if (!candidate.type) {
    missingFields.push("type");
    issues.push("Transaction type (income or expense) is missing");
  }

  if (candidate.type === "expense" && (!candidate.ownership || candidate.ownership === "mine")) {
    const expType = candidate.expenseType ?? candidate.expense_type;
    if (!expType) {
      missingFields.push("expenseType");
      issues.push("Expense classification (living or work) is required");
    }
  }

  if (candidate.clarification_required) {
    issues.push("Candidate requires user clarification");
  }

  const id = candidate.id || candidate.candidate_id || "unknown";

  return {
    candidateId: id,
    isValid: issues.length === 0 && missingFields.length === 0,
    missingFields,
    issues,
  };
}
