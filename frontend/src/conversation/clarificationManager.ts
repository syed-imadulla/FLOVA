// =====================================================================
// FLOVA 2.0 | Sprint 3B — Clarification Manager
// Asks concise questions only when required; never assumes an ambiguous person.
// =====================================================================

import type { ConversationContextState, PendingClarification, ResolvedIntent } from "./conversationTypes";

export function evaluateClarification(
  intent: ResolvedIntent,
  _context: ConversationContextState
): PendingClarification | null {
  if (intent.personAmbiguousCandidates && intent.personAmbiguousCandidates.length > 0) {
    const names = intent.personAmbiguousCandidates.slice(0, 4).join(", ");
    return {
      kind: "person",
      prompt: `Which person did you mean? (${names})`,
      candidates: intent.personAmbiguousCandidates,
      originalTopic: intent.topic,
    };
  }

  if (intent.topic === "person_debt" && !intent.personQuery) {
    return {
      kind: "person",
      prompt: "Which person's balance would you like to check?",
      originalTopic: "person_debt",
    };
  }

  if (intent.topic === "potential_income_draft") {
    const amtText = intent.amountPaise ? `₹${(intent.amountPaise / 100).toLocaleString("en-IN")}` : "income";
    return {
      kind: "income_source",
      prompt: `I noticed a potential ${amtText} income entry, and the income source is missing. Nothing was saved (read-only mode) — use Add or Voice Review when ready to confirm.`,
      originalTopic: "potential_income_draft",
    };
  }

  if (intent.topic === "potential_expense_draft") {
    const amtText = intent.amountPaise ? `₹${(intent.amountPaise / 100).toLocaleString("en-IN")}` : "expense";
    return {
      kind: "expense_type",
      prompt: `I noticed a potential ${amtText} expense entry. Nothing was saved (read-only mode) — use Add or Voice Review when ready to classify and confirm.`,
      originalTopic: "potential_expense_draft",
    };
  }

  if (intent.topic === "potential_repayment_draft") {
    const who = intent.personQuery ? ` from ${intent.personQuery}` : "";
    const amtText = intent.amountPaise ? `₹${(intent.amountPaise / 100).toLocaleString("en-IN")}` : "repayment";
    return {
      kind: "person",
      prompt: `I noticed a potential ${amtText} repayment${who}. Nothing was saved (read-only mode) — use People or Voice Review when ready to confirm.`,
      originalTopic: "potential_repayment_draft",
    };
  }

  return null;
}
