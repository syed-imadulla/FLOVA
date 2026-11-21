// =====================================================================
// FLOVA AI Extraction DTO Tests (M3 Phase 5B MVP)
// Tests multi-transaction extraction, receipt metadata defaults,
// category mapping, correction safety, and check-in null preservation.
// =====================================================================

import {
  adaptExtractedCheckin,
  adaptExtractedTransactions,
  mapCanonicalCategory,
  resolveCorrectionIntent,
  sanitizeExtractedTransaction,
  type FinancialExtractionDTO,
} from "../index";
import { assertStrictEqual, describe, it } from "./testUtils";

describe("AI Financial Extraction DTO (Phase 5B)", () => {
  it("1. two transactions in one sentence (income + expense)", () => {
    // "I received 2500 from a customer and spent 300 on raw materials."
    const dto: FinancialExtractionDTO = {
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
      metadata: {
        input_source: "voice_transcript",
        certainty: 0.96,
        clarification_required: false,
        clarification_reason: null,
        clarification_questions: [],
        raw_utterance: "I received 2500 from a customer and spent 300 on raw materials.",
      },
    };

    assertStrictEqual(dto.transactions?.length, 2);
    const adapted = adaptExtractedTransactions(dto);
    assertStrictEqual(adapted.length, 2);

    // Transaction 1: Income ₹2,500 = 250,000 paise
    assertStrictEqual(adapted[0].type, "income");
    assertStrictEqual(adapted[0].amount, 250000);
    assertStrictEqual(adapted[0].category, "earnings");
    assertStrictEqual(adapted[0].ownership, "mine");

    // Transaction 2: Expense ₹300 = 30,000 paise
    assertStrictEqual(adapted[1].type, "expense");
    assertStrictEqual(adapted[1].amount, 30000);
    assertStrictEqual(adapted[1].category, "other");
    assertStrictEqual(adapted[1].expenseType, "work");
    assertStrictEqual(adapted[1].ownership, "mine");
  });

  it("2. receipt evidence defaults to receipt_reported, never independently_verified", () => {
    const rawTx = {
      type: "expense" as const,
      amount: "450",
      category: "fuel",
      expense_type: "work" as const,
      ownership: "mine" as const,
      date: "2026-11-21",
      description: "Petrol bunk receipt",
      evidence_type: "receipt_image" as const,
      // Even if raw inference hypothetically claims independently_verified:
      verification_status: "independently_verified" as const,
    };

    const sanitized = sanitizeExtractedTransaction(rawTx);
    // Strict enforcement: receipt evidence MUST default to receipt_reported
    assertStrictEqual(sanitized.verification_status, "receipt_reported");
  });

  it("3. unknown category maps to 'other' and requires clarification", () => {
    // Canonical category test
    const canonRes = mapCanonicalCategory("fuel", "expense");
    assertStrictEqual(canonRes.category, "fuel");
    assertStrictEqual(canonRes.isCanonical, true);
    assertStrictEqual(canonRes.requiresClarification, false);

    // Unknown category test (e.g. "groceries" or "raw_materials")
    const unknownRes = mapCanonicalCategory("raw_materials", "expense");
    assertStrictEqual(unknownRes.category, "other");
    assertStrictEqual(unknownRes.isCanonical, false);
    assertStrictEqual(unknownRes.requiresClarification, true);

    // Missing category test
    const missingRes = mapCanonicalCategory(null, "income");
    assertStrictEqual(missingRes.category, "other");
    assertStrictEqual(missingRes.requiresClarification, true);
  });

  it("4. correction with supplied target ID succeeds, invented IDs rejected", () => {
    const availableDrafts = ["draft-uuid-101", "draft-uuid-102"];

    // A. Valid correction referencing existing draft
    const validDto: FinancialExtractionDTO = {
      entry_intent: "transaction",
      action_intent: "correct",
      target_draft_id: "draft-uuid-101",
      transactions: [{
        type: "expense",
        amount: "150",
        category: "fuel",
        expense_type: "work",
        ownership: "mine",
        date: "2026-11-21",
        description: "Corrected petrol amount",
      }],
      expected_payout: null,
      balance_checkin: null,
      metadata: {
        input_source: "voice_transcript",
        certainty: 0.95,
        clarification_required: false,
        clarification_reason: null,
        clarification_questions: [],
        raw_utterance: "Actually it was 150 for petrol",
      },
    };

    const validRes = resolveCorrectionIntent(validDto, availableDrafts);
    assertStrictEqual(validRes.valid, true);
    assertStrictEqual(validRes.resolvedDraftId, "draft-uuid-101");
    assertStrictEqual(validRes.requiresClarification, false);

    // B. Invalid correction with unsupplied / invented target ID
    const inventedDto: FinancialExtractionDTO = {
      ...validDto,
      target_draft_id: "invented-id-999",
    };
    const invalidRes = resolveCorrectionIntent(inventedDto, availableDrafts);
    assertStrictEqual(invalidRes.valid, false);
    assertStrictEqual(invalidRes.requiresClarification, true);
    assertStrictEqual(
      invalidRes.error,
      "Target draft ID 'invented-id-999' not found in active pending drafts. Model cannot update persisted transactions."
    );
  });

  it("5. ambiguous correction across multiple matching drafts requires clarification", () => {
    const availableDrafts = ["draft-petrol-1", "draft-petrol-2"];
    const matchingCandidates = ["draft-petrol-1", "draft-petrol-2"];

    const dto: FinancialExtractionDTO = {
      entry_intent: "transaction",
      action_intent: "correct",
      target_draft_id: "draft-petrol-1",
      transactions: [{
        type: "expense",
        amount: "200",
        category: "fuel",
        expense_type: "work",
        ownership: "mine",
        date: "2026-11-21",
        description: "Updated petrol",
      }],
      expected_payout: null,
      balance_checkin: null,
      metadata: {
        input_source: "voice_transcript",
        certainty: 0.70,
        clarification_required: true,
        clarification_reason: "Multiple petrol expenses found in drafts.",
        clarification_questions: ["Did you want to update the ₹120 petrol draft or the ₹150 petrol draft?"],
        raw_utterance: "Change the petrol expense to 200",
      },
    };

    const res = resolveCorrectionIntent(dto, availableDrafts, matchingCandidates);
    assertStrictEqual(res.valid, false);
    assertStrictEqual(res.requiresClarification, true);
    assertStrictEqual(
      res.error,
      "Ambiguous correction: multiple pending drafts match (draft-petrol-1, draft-petrol-2). Clarification required."
    );
  });

  it("6. missing check-in amount remains null and requires clarification", () => {
    // User says "I have ₹1500 cash" but mentions no bank amount
    const dto: FinancialExtractionDTO = {
      entry_intent: "balance_checkin",
      action_intent: "create",
      target_draft_id: null,
      transactions: [],
      expected_payout: null,
      balance_checkin: {
        cash_amount: "1500",
        bank_amount: null, // Missing bank amount!
        not_mine_amount: "0",
        note: "Partial check-in",
        checked_at: "2026-11-21T01:30:00Z",
      },
      metadata: {
        input_source: "voice_transcript",
        certainty: 0.85,
        clarification_required: true,
        clarification_reason: "Bank balance is missing.",
        clarification_questions: ["How much money do you currently have in your bank account?"],
        raw_utterance: "I have ₹1500 cash in my pocket",
      },
    };

    const res = adaptExtractedCheckin(dto);
    // Must NOT silently convert missing bank_amount to 0!
    assertStrictEqual(res.checkin, null);
    assertStrictEqual(res.requiresClarification, true);
    assertStrictEqual(res.missingFields.includes("bank_amount"), true);
  });
});
