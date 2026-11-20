// =====================================================================
// FLOVA Phase 7 Candidate Adapter Tests (Owner: M3)
// Tests mapping FinancialExtractionDTO to VoiceTransactionCandidate and
// ExtractedReceiptCandidate, safe paise conversion, receipt safety invariants,
// draft authorization, and confirmCandidateTransaction persistence delegation.
// =====================================================================

import {
  candidateToNewTransaction,
  confirmCandidateTransaction,
  mapDtoToReceiptCandidates,
  mapDtoToVoiceCandidates,
  safeConvertRupeeStringToPaise,
  type FinancialExtractionDTO,
  type PendingDraftContext,
} from "../index";
import { assertStrictEqual, assertThrows, describe, it } from "./testUtils";

describe("Phase 7 Candidate Adapter (FinancialExtractionDTO Mapping)", () => {
  it("1. valid rupee string to paise conversion, including decimal values", () => {
    assertStrictEqual(safeConvertRupeeStringToPaise("2500"), 250000);
    assertStrictEqual(safeConvertRupeeStringToPaise("120.50"), 12050);
    assertStrictEqual(safeConvertRupeeStringToPaise("10.05"), 1005);
    assertStrictEqual(safeConvertRupeeStringToPaise("0"), 0);
    assertStrictEqual(safeConvertRupeeStringToPaise("0.00"), 0);
    assertStrictEqual(safeConvertRupeeStringToPaise("1500000"), 150000000);
  });

  it("2. invalid and unsafe amount rejection", () => {
    // Negative amounts must throw
    assertThrows(() => safeConvertRupeeStringToPaise("-100"), /must be a positive decimal/);
    assertThrows(() => safeConvertRupeeStringToPaise("-0.01"), /must be a positive decimal/);

    // Malformed non-numeric strings must throw
    assertThrows(() => safeConvertRupeeStringToPaise("abc"), /must be a positive decimal/);
    assertThrows(() => safeConvertRupeeStringToPaise("12.34.56"), /must be a positive decimal/);
    assertThrows(() => safeConvertRupeeStringToPaise("100,000"), /must be a positive decimal/); // Must be clean decimal without commas
    assertThrows(() => safeConvertRupeeStringToPaise("₹2500"), /must be a positive decimal/); // Must be decimal string without symbols
  });

  it("3. null preservation for missing fields (never invented)", () => {
    assertStrictEqual(safeConvertRupeeStringToPaise(null), null);
    assertStrictEqual(safeConvertRupeeStringToPaise(undefined), null);
    assertStrictEqual(safeConvertRupeeStringToPaise(""), null);

    const dto: FinancialExtractionDTO = {
      entry_intent: "transaction",
      action_intent: "create",
      target_draft_id: null,
      transactions: [
        {
          type: "expense",
          amount: null, // Missing amount
          category: null, // Missing category
          expense_type: null,
          ownership: "mine",
          date: null, // Missing date
          description: null,
          merchant_or_counterparty: null,
          external_reference: null,
        },
      ],
      expected_payout: null,
      balance_checkin: null,
      metadata: {
        input_source: "voice_transcript",
        certainty: 0.5,
        clarification_required: true,
        clarification_reason: "Amount missing",
        clarification_questions: ["How much?"],
        raw_utterance: "Spent some cash",
      },
    };

    const candidates = mapDtoToVoiceCandidates(dto);
    assertStrictEqual(candidates.length, 1);

    const c = candidates[0]!;
    // Missing fields MUST remain null; never invented!
    assertStrictEqual(c.amount_paise, null);
    assertStrictEqual(c.amount_rupees, null);
    assertStrictEqual(c.date, null);
    assertStrictEqual(c.description, null);
    assertStrictEqual(c.counterparty, null);
    assertStrictEqual(c.category, "other"); // Unknown/missing maps to canonical "other"
    assertStrictEqual(c.clarification_required, true);
  });

  it("4. expected payout never becomes received income or candidate transaction", () => {
    const payoutDto: FinancialExtractionDTO = {
      entry_intent: "expected_payout",
      action_intent: "create",
      target_draft_id: null,
      transactions: [],
      expected_payout: {
        expected_amount: "4500",
        kind: "platform_payout",
        source: "Zomato",
        expected_date: "2026-11-25",
        status: "scheduled",
        note: "Weekly payout",
      },
      balance_checkin: null,
      metadata: {
        input_source: "text",
        certainty: 0.95,
        clarification_required: false,
        clarification_reason: null,
        clarification_questions: [],
        raw_utterance: "Zomato payout 4500 coming Wednesday",
      },
    };

    // Expected payouts must NOT produce voice candidates
    const voiceCandidates = mapDtoToVoiceCandidates(payoutDto);
    assertStrictEqual(voiceCandidates.length, 0);

    // Expected payouts must NOT produce receipt candidates
    const receiptCandidates = mapDtoToReceiptCandidates(payoutDto);
    assertStrictEqual(receiptCandidates.length, 0);
  });

  it("5. receipt evidence is strictly receipt_reported, never independently_verified", () => {
    const receiptDto: FinancialExtractionDTO = {
      entry_intent: "transaction",
      action_intent: "create",
      target_draft_id: null,
      transactions: [
        {
          type: "expense",
          amount: "450.50",
          category: "fuel",
          expense_type: "work",
          ownership: "mine",
          date: "2026-11-21",
          description: "Shell Fuel",
          evidence_type: "receipt_image",
          verification_status: "independently_verified", // UNSAFE CLAIM FROM UPSTREAM!
          merchant_or_counterparty: "Shell Gas Station",
          external_reference: "REC-99182",
        },
      ],
      expected_payout: null,
      balance_checkin: null,
      metadata: {
        input_source: "shared_receipt_image",
        certainty: 0.98,
        clarification_required: false,
        clarification_reason: null,
        clarification_questions: [],
        raw_utterance: "Receipt image Shell 450.50",
      },
    };

    const candidates = mapDtoToReceiptCandidates(receiptDto);
    assertStrictEqual(candidates.length, 1);

    const c = candidates[0]!;
    // Strict invariant: receipt suggestions must carry receipt_reported
    assertStrictEqual(c.verification_status, "receipt_reported");
    assertStrictEqual(c.merchant, "Shell Gas Station");
    assertStrictEqual(c.external_reference, "REC-99182");
    assertStrictEqual(c.amount_paise, 45050);
  });

  it("6. multiple transactions in one statement mapped independently", () => {
    // "I received 2500 from a customer and spent 300 on raw materials."
    const multiDto: FinancialExtractionDTO = {
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
          merchant_or_counterparty: "Customer A",
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

    const candidates = mapDtoToVoiceCandidates(multiDto);
    assertStrictEqual(candidates.length, 2);

    // Candidate 1: Income ₹2,500
    assertStrictEqual(candidates[0]!.type, "income");
    assertStrictEqual(candidates[0]!.amount_paise, 250000);
    assertStrictEqual(candidates[0]!.counterparty, "Customer A");

    // Candidate 2: Expense ₹300 (work)
    assertStrictEqual(candidates[1]!.type, "expense");
    assertStrictEqual(candidates[1]!.amount_paise, 30000);
    assertStrictEqual(candidates[1]!.expense_type, "work");
  });

  it("7. unknown category and clarification-required intent handling", () => {
    const unknownCatDto: FinancialExtractionDTO = {
      entry_intent: "transaction",
      action_intent: "create",
      target_draft_id: null,
      transactions: [
        {
          type: "expense",
          amount: "80",
          category: "stationery", // Non-canonical
          expense_type: "work",
          ownership: "mine",
          date: "2026-11-21",
          description: "Pens and notebook",
        },
      ],
      expected_payout: null,
      balance_checkin: null,
      metadata: {
        input_source: "voice_transcript",
        certainty: 0.85,
        clarification_required: true,
        clarification_reason: "Category stationery is non-canonical",
        clarification_questions: ["Is stationery a work expense?"],
        raw_utterance: "Spent 80 on stationery",
      },
    };

    const candidates = mapDtoToVoiceCandidates(unknownCatDto);
    assertStrictEqual(candidates.length, 1);
    assertStrictEqual(candidates[0]!.category, "other");
    assertStrictEqual(candidates[0]!.clarification_required, true);
  });

  it("8. draft ID preservation and rejection when context does not authorize it", () => {
    const trustedContext: PendingDraftContext = {
      authorizedDraftIds: ["draft-101", "draft-102"],
    };

    // Case A: Authorized draft ID is preserved
    const authorizedDto: FinancialExtractionDTO = {
      entry_intent: "transaction",
      action_intent: "correct",
      target_draft_id: "draft-101",
      transactions: [
        {
          type: "expense",
          amount: "150",
          category: "fuel",
          expense_type: "work",
          ownership: "mine",
          date: "2026-11-21",
          description: "Petrol correction",
        },
      ],
      expected_payout: null,
      balance_checkin: null,
      metadata: {
        input_source: "text",
        certainty: 0.99,
        clarification_required: false,
        clarification_reason: null,
        clarification_questions: [],
        raw_utterance: "Actually it was 150 for petrol",
      },
    };

    const candidates = mapDtoToVoiceCandidates(authorizedDto, trustedContext);
    assertStrictEqual(candidates.length, 1);
    assertStrictEqual(candidates[0]!.draft_id, "draft-101");

    // Case B: Unauthorized draft ID throws error
    const unauthorizedDto: FinancialExtractionDTO = {
      ...authorizedDto,
      target_draft_id: "draft-999", // Not in trustedContext!
    };

    assertThrows(() => mapDtoToVoiceCandidates(unauthorizedDto, trustedContext), /DRAFT_ACCESS_DENIED/);
  });

  it("9. candidate confirmation continues through persistence flow without adapter-side writes", async () => {
    const candidate = {
      candidate_id: "cand-1",
      draft_id: "draft-abc",
      type: "income" as const,
      amount_paise: 250000,
      amount_rupees: "2500",
      category: "earnings",
      expense_type: null,
      ownership: "mine" as const,
      date: "2026-11-21" as any,
      description: "Freelance web design",
      payment_method: "upi" as const,
      counterparty: "Acme Corp",
      evidence_type: "voice_transcript" as const,
      verification_status: "user_asserted" as const,
      clarification_required: false,
      clarification_questions: [],
      raw_utterance: "Got 2500 UPI from Acme Corp",
    };

    // 1. Adapting candidate to NewTransaction
    const newTx = candidateToNewTransaction(candidate);
    assertStrictEqual(newTx.id, "draft-abc");
    assertStrictEqual(newTx.type, "income");
    assertStrictEqual(newTx.amount, 250000);
    assertStrictEqual(newTx.category, "earnings");
    assertStrictEqual(newTx.source, "voice");

    // 2. confirmCandidateTransaction invokes injected persist function without performing database calls
    let persistedPayload: any = null;
    const mockPersistService = async (tx: any) => {
      persistedPayload = tx;
      return { ...tx, id: "persisted-row-1" };
    };

    const confirmed = await confirmCandidateTransaction(candidate, mockPersistService);
    assertStrictEqual((confirmed as any).id, "persisted-row-1");
    assertStrictEqual(persistedPayload.amount, 250000);
    assertStrictEqual(persistedPayload.type, "income");
  });

  it("10. confirmation rejects candidates with missing amount or missing expense_type", () => {
    // Missing amount
    const invalidAmountCandidate = {
      candidate_id: "cand-err-1",
      draft_id: null,
      type: "income" as const,
      amount_paise: null, // Missing!
      amount_rupees: null,
      category: "earnings",
      expense_type: null,
      ownership: "mine" as const,
      date: null,
      description: null,
      payment_method: null,
      counterparty: null,
      evidence_type: "voice_transcript" as const,
      verification_status: "user_asserted" as const,
      clarification_required: true,
      clarification_questions: ["Amount?"],
      raw_utterance: "Got money",
    };
    assertThrows(() => candidateToNewTransaction(invalidAmountCandidate), /invalid or missing amount/);

    // Missing expense_type on own expense
    const missingExpenseTypeCandidate = {
      ...invalidAmountCandidate,
      type: "expense" as const,
      amount_paise: 5000,
      expense_type: null, // Required for own expense!
    };
    assertThrows(() => candidateToNewTransaction(missingExpenseTypeCandidate), /expense_type/);
  });

  it("11. missing date stays null and trusted context can supply date without inventing one", () => {
    const dtoNoDate: FinancialExtractionDTO = {
      entry_intent: "transaction",
      action_intent: "create",
      transactions: [
        {
          type: "expense",
          amount: "100",
          category: "food",
          expense_type: "living",
          ownership: "mine",
          date: null, // Model did not extract date
          description: "Tea and snacks",
        },
      ],
      expected_payout: null,
      balance_checkin: null,
      metadata: {
        input_source: "voice_transcript",
        certainty: 0.9,
        clarification_required: false,
        clarification_reason: null,
        clarification_questions: [],
        raw_utterance: "Spent 100 on tea",
      },
    };

    // Case A: Without trusted context, date remains null (never new Date() or system date)
    const [candA] = mapDtoToVoiceCandidates(dtoNoDate);
    assertStrictEqual(candA?.date, null);
    assertStrictEqual(candA?.extracted_date, null);
    assertStrictEqual(candA?.contextual_date, null);

    // Case B: With trusted application context, contextual date is supplied and distinguishable
    const trustedCtx: PendingDraftContext = {
      authorizedDraftIds: [],
      trustedDate: "2026-11-21" as any,
    };
    const [candB] = mapDtoToVoiceCandidates(dtoNoDate, trustedCtx);
    assertStrictEqual(candB?.date, "2026-11-21");
    assertStrictEqual(candB?.extracted_date, null);
    assertStrictEqual(candB?.contextual_date, "2026-11-21");
  });

  it("12. missing expense_type requires clarification and never becomes living", () => {
    const dtoMissingExpenseType: FinancialExtractionDTO = {
      entry_intent: "transaction",
      action_intent: "create",
      transactions: [
        {
          type: "expense",
          amount: "450",
          category: "food",
          expense_type: null, // Missing!
          ownership: "mine",
          date: "2026-11-21",
          description: "Lunch meeting",
        },
      ],
      expected_payout: null,
      balance_checkin: null,
      metadata: {
        input_source: "voice_transcript",
        certainty: 0.85,
        clarification_required: false,
        clarification_reason: null,
        clarification_questions: [],
        raw_utterance: "Spent 450 on lunch",
      },
    };

    const [cand] = mapDtoToVoiceCandidates(dtoMissingExpenseType);
    assertStrictEqual(cand?.expense_type, null);
    assertStrictEqual(cand?.clarification_required, true);
    assertStrictEqual(
      cand?.clarification_questions.some((q) => q.includes("living") || q.includes("work")),
      true
    );

    // Rejection on confirmation attempt before clarification is resolved
    assertThrows(() => candidateToNewTransaction(cand!), /expense_type/);

    // Valid expense_type is preserved correctly
    const validExpenseCand = { ...cand!, expense_type: "work" as const };
    const validTx = candidateToNewTransaction(validExpenseCand);
    assertStrictEqual(validTx.expenseType, "work");
  });

  it("13. missing amount stays null across adapter stages and never converts to zero", () => {
    // safeConvertRupeeStringToPaise
    assertStrictEqual(safeConvertRupeeStringToPaise(null), null);
    assertStrictEqual(safeConvertRupeeStringToPaise(undefined), null);

    const dtoNoAmount: FinancialExtractionDTO = {
      entry_intent: "transaction",
      action_intent: "create",
      transactions: [
        {
          type: "expense",
          amount: null,
          category: "fuel",
          expense_type: "work",
          ownership: "mine",
          date: "2026-11-21",
          description: "Filled petrol",
        },
      ],
      expected_payout: null,
      balance_checkin: null,
      metadata: {
        input_source: "voice_transcript",
        certainty: 0.8,
        clarification_required: true,
        clarification_reason: "Amount missing",
        clarification_questions: ["How much?"],
        raw_utterance: "Filled petrol",
      },
    };

    // Candidate mapping: amount_paise remains strictly null, not 0
    const [cand] = mapDtoToVoiceCandidates(dtoNoAmount);
    assertStrictEqual(cand?.amount_paise, null);
    assertStrictEqual(cand?.amount_rupees, null);
    assertStrictEqual(cand?.clarification_required, true);

    // Confirmation must reject null amounts (never silent 0 insertion)
    assertThrows(() => candidateToNewTransaction(cand!), /invalid or missing amount/);
  });

  it("14. candidate UUID remains stable across repeated mapping and confirmation retries", async () => {
    const dtoWithDraft: FinancialExtractionDTO = {
      entry_intent: "transaction",
      action_intent: "correct",
      target_draft_id: "draft-stable-uuid-1",
      transactions: [
        {
          type: "expense",
          amount: "250",
          category: "fuel",
          expense_type: "work",
          ownership: "mine",
          date: "2026-11-21",
          description: "Petrol",
        },
      ],
      expected_payout: null,
      balance_checkin: null,
      metadata: {
        input_source: "text",
        certainty: 0.95,
        clarification_required: false,
        clarification_reason: null,
        clarification_questions: [],
        raw_utterance: "Petrol 250",
      },
    };

    const ctx: PendingDraftContext = {
      authorizedDraftIds: ["draft-stable-uuid-1"],
      existingCandidateIds: ["candidate-slot-0"],
    };

    // Repeated mapping preserves same candidate_id
    const [run1] = mapDtoToVoiceCandidates(dtoWithDraft, ctx);
    const [run2] = mapDtoToVoiceCandidates(dtoWithDraft, ctx);
    assertStrictEqual(run1?.candidate_id, "candidate-slot-0");
    assertStrictEqual(run2?.candidate_id, "candidate-slot-0");
    assertStrictEqual(run1?.candidate_id, run2?.candidate_id);

    // Confirmation retries preserve identical transaction ID
    const tx1 = candidateToNewTransaction(run1!);
    const tx2 = candidateToNewTransaction(run1!);
    assertStrictEqual(tx1.id, "draft-stable-uuid-1");
    assertStrictEqual(tx2.id, "draft-stable-uuid-1");
    assertStrictEqual(tx1.id, tx2.id);

    // Repeated confirmCandidateTransaction calls send same ID to persistence
    const receivedIds: string[] = [];
    const mockPersist = async (tx: any) => {
      receivedIds.push(tx.id);
      return tx;
    };

    await confirmCandidateTransaction(run1!, mockPersist);
    await confirmCandidateTransaction(run1!, mockPersist);
    assertStrictEqual(receivedIds.length, 2);
    assertStrictEqual(receivedIds[0], receivedIds[1]);
  });
});
