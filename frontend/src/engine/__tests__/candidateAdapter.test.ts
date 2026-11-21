// =====================================================================
// FLOVA Phase 7 Candidate Adapter Tests (Owner: M3)
// Tests mapping FinancialExtractionDTO to VoiceTransactionCandidate and
// ExtractedReceiptCandidate, safe paise conversion, receipt safety invariants,
// draft authorization, and confirmCandidateTransaction persistence delegation.
// =====================================================================

import {
  candidateToNewTransaction,
  confirmCandidateTransaction,
  deriveDeterministicUUID,
  isValidUUID,
  mapDtoToReceiptCandidates,
  mapDtoToVoiceCandidates,
  safeConvertRupeeStringToPaise,
  RFC_4122_UUID_REGEX,
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
    assertStrictEqual(safeConvertRupeeStringToPaise("1000000"), 100000000); // ₹10,00,000 upper boundary
  });

  it("2. invalid and unsafe amount rejection", () => {
    // Over ₹10 Lakh application limit must throw
    assertThrows(() => safeConvertRupeeStringToPaise("1000001"), /exceeds ₹10,00,000/);
    assertThrows(() => safeConvertRupeeStringToPaise("1500000"), /exceeds ₹10,00,000/);

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
    const testCandidateUUID = "550e8400-e29b-41d4-a716-446655440000";
    const candidate = {
      candidate_id: testCandidateUUID,
      draft_id: testCandidateUUID,
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
    assertStrictEqual(newTx.id, testCandidateUUID);
    assertStrictEqual(isValidUUID(newTx.id), true);
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
    // Missing amount (valid candidate_id to test amount validation in isolation)
    const invalidAmountCandidate = {
      candidate_id: "550e8400-e29b-41d4-a716-446655440010",
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
    const draftUUID = "550e8400-e29b-41d4-a716-446655440000";
    const retainedUUID = "123e4567-e89b-12d3-a456-426614174000";
    const dtoWithDraft: FinancialExtractionDTO = {
      entry_intent: "transaction",
      action_intent: "correct",
      target_draft_id: draftUUID,
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
      authorizedDraftIds: [draftUUID],
      existingCandidateIds: [retainedUUID],
    };

    // Repeated mapping preserves same candidate_id
    const [run1] = mapDtoToVoiceCandidates(dtoWithDraft, ctx);
    const [run2] = mapDtoToVoiceCandidates(dtoWithDraft, ctx);
    assertStrictEqual(run1?.candidate_id, retainedUUID);
    assertStrictEqual(run2?.candidate_id, retainedUUID);
    assertStrictEqual(run1?.candidate_id, run2?.candidate_id);
    assertStrictEqual(isValidUUID(run1?.candidate_id), true);

    // Confirmation retries preserve identical transaction ID
    const tx1 = candidateToNewTransaction(run1!);
    const tx2 = candidateToNewTransaction(run1!);
    assertStrictEqual(tx1.id, retainedUUID);
    assertStrictEqual(tx2.id, retainedUUID);
    assertStrictEqual(tx1.id, tx2.id);
    assertStrictEqual(isValidUUID(tx1.id), true);

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
    assertStrictEqual(isValidUUID(receivedIds[0]), true);
  });

  it("15. one transaction with a draft ID produces a valid, stable RFC 4122 UUID matching draft ID", () => {
    const draftUUID = "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d";
    const dto: FinancialExtractionDTO = {
      entry_intent: "transaction",
      action_intent: "create",
      target_draft_id: draftUUID,
      transactions: [
        {
          type: "income",
          amount: "1500",
          category: "earnings",
          expense_type: null,
          ownership: "mine",
          date: "2026-11-21",
          description: "Consulting fee",
        },
      ],
      expected_payout: null,
      balance_checkin: null,
      metadata: {
        input_source: "voice_transcript",
        certainty: 0.98,
        clarification_required: false,
        clarification_reason: null,
        clarification_questions: [],
        raw_utterance: "Earned 1500 consulting",
      },
    };

    const ctx: PendingDraftContext = { authorizedDraftIds: [draftUUID] };
    const [cand] = mapDtoToVoiceCandidates(dto, ctx);
    assertStrictEqual(isValidUUID(cand?.candidate_id), true);
    assertStrictEqual(cand?.candidate_id, draftUUID);

    const newTx = candidateToNewTransaction(cand!);
    assertStrictEqual(isValidUUID(newTx.id), true);
    assertStrictEqual(newTx.id, draftUUID);
  });

  it("16. multiple transactions with a draft ID produce distinct valid RFC 4122 UUIDs without string appending", () => {
    const draftUUID = "b2c3d4e5-f6a7-4b2c-9d3e-4f5a6b7c8d9e";
    const dto: FinancialExtractionDTO = {
      entry_intent: "transaction",
      action_intent: "create",
      target_draft_id: draftUUID,
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
          category: "fuel",
          expense_type: "work",
          ownership: "mine",
          date: "2026-11-21",
          description: "Petrol for delivery",
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
        raw_utterance: "Received 2500 from customer and spent 300 on petrol",
      },
    };

    const ctx: PendingDraftContext = { authorizedDraftIds: [draftUUID] };
    const candidates = mapDtoToVoiceCandidates(dto, ctx);
    assertStrictEqual(candidates.length, 2);

    const c0 = candidates[0]!;
    const c1 = candidates[1]!;

    // Both IDs must be valid RFC 4122 UUIDs
    assertStrictEqual(isValidUUID(c0.candidate_id), true);
    assertStrictEqual(isValidUUID(c1.candidate_id), true);

    // Primary key safety: candidates MUST NOT share the same UUID
    assertStrictEqual(c0.candidate_id !== c1.candidate_id, true);

    // Rule: MUST NOT append string suffixes like '-tx-N' to UUIDs
    assertStrictEqual(c0.candidate_id.includes("-tx-"), false);
    assertStrictEqual(c1.candidate_id.includes("-tx-"), false);

    // Candidate 0 reuses valid draft UUID; Candidate 1 has a distinct deterministic UUID
    assertStrictEqual(c0.candidate_id, draftUUID);
    assertStrictEqual(c1.candidate_id, deriveDeterministicUUID(`${draftUUID}:tx:1`));

    // Re-mapping produces identical deterministic UUIDs (idempotency)
    const [c0_again, c1_again] = mapDtoToVoiceCandidates(dto, ctx);
    assertStrictEqual(c0.candidate_id, c0_again!.candidate_id);
    assertStrictEqual(c1.candidate_id, c1_again!.candidate_id);

    // Confirming each candidate produces distinct valid UUID transactions
    const tx0 = candidateToNewTransaction(c0);
    const tx1 = candidateToNewTransaction(c1);
    assertStrictEqual(isValidUUID(tx0.id), true);
    assertStrictEqual(isValidUUID(tx1.id), true);
    assertStrictEqual(tx0.id !== tx1.id, true);
  });

  it("17. missing draft ID produces distinct valid RFC 4122 UUIDs for each candidate", () => {
    const dto: FinancialExtractionDTO = {
      entry_intent: "transaction",
      action_intent: "create",
      target_draft_id: null,
      transactions: [
        {
          type: "income",
          amount: "500",
          category: "earnings",
          expense_type: null,
          ownership: "mine",
          date: "2026-11-21",
          description: "Shop sales",
        },
        {
          type: "expense",
          amount: "100",
          category: "food",
          expense_type: "living",
          ownership: "mine",
          date: "2026-11-21",
          description: "Lunch",
        },
      ],
      expected_payout: null,
      balance_checkin: null,
      metadata: {
        input_source: "voice_transcript",
        certainty: 0.95,
        clarification_required: false,
        clarification_reason: null,
        clarification_questions: [],
        raw_utterance: "Made 500 sales and spent 100 on lunch",
      },
    };

    const candidates = mapDtoToVoiceCandidates(dto);
    assertStrictEqual(candidates.length, 2);

    const c0 = candidates[0]!;
    const c1 = candidates[1]!;

    assertStrictEqual(isValidUUID(c0.candidate_id), true);
    assertStrictEqual(isValidUUID(c1.candidate_id), true);
    assertStrictEqual(c0.candidate_id !== c1.candidate_id, true);

    const tx0 = candidateToNewTransaction(c0);
    const tx1 = candidateToNewTransaction(c1);
    assertStrictEqual(isValidUUID(tx0.id), true);
    assertStrictEqual(isValidUUID(tx1.id), true);
    assertStrictEqual(tx0.id !== tx1.id, true);
  });

  it("18. repeated mapping with retained candidate IDs preserves exact candidate identity", () => {
    const retained0 = "c3d4e5f6-a7b8-4c3d-ae4f-5a6b7c8d9e0f";
    const retained1 = "d4e5f6a7-b8c9-4d4e-bf5a-6b7c8d9e0f1a";

    const dto: FinancialExtractionDTO = {
      entry_intent: "transaction",
      action_intent: "create",
      target_draft_id: null,
      transactions: [
        {
          type: "expense",
          amount: "200",
          category: "fuel",
          expense_type: "work",
          ownership: "mine",
          date: "2026-11-21",
          description: "Petrol",
        },
        {
          type: "expense",
          amount: "50",
          category: "food",
          expense_type: "living",
          ownership: "mine",
          date: "2026-11-21",
          description: "Chai",
        },
      ],
      expected_payout: null,
      balance_checkin: null,
      metadata: {
        input_source: "text",
        certainty: 0.9,
        clarification_required: false,
        clarification_reason: null,
        clarification_questions: [],
        raw_utterance: "Petrol 200 and chai 50",
      },
    };

    const ctx: PendingDraftContext = {
      authorizedDraftIds: [],
      existingCandidateIds: [retained0, retained1],
    };

    const firstRun = mapDtoToVoiceCandidates(dto, ctx);
    assertStrictEqual(firstRun[0]?.candidate_id, retained0);
    assertStrictEqual(firstRun[1]?.candidate_id, retained1);

    const secondRun = mapDtoToVoiceCandidates(dto, ctx);
    assertStrictEqual(secondRun[0]?.candidate_id, retained0);
    assertStrictEqual(secondRun[1]?.candidate_id, retained1);
    assertStrictEqual(firstRun[0]?.candidate_id, secondRun[0]?.candidate_id);
    assertStrictEqual(firstRun[1]?.candidate_id, secondRun[1]?.candidate_id);
  });

  it("19. UUID validity for every candidate across voice and receipt modes", () => {
    const voiceDto: FinancialExtractionDTO = {
      entry_intent: "transaction",
      action_intent: "create",
      transactions: [
        {
          type: "income",
          amount: "2000",
          category: "earnings",
          expense_type: null,
          ownership: "mine",
          date: "2026-11-21",
          description: "Voice income",
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
        raw_utterance: "Voice income 2000",
      },
    };

    const receiptDto: FinancialExtractionDTO = {
      entry_intent: "transaction",
      action_intent: "create",
      transactions: [
        {
          type: "expense",
          amount: "650",
          category: "maintenance",
          expense_type: "work",
          ownership: "mine",
          date: "2026-11-21",
          description: "Bike oil change",
          evidence_type: "receipt_image",
          verification_status: "receipt_reported",
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
        raw_utterance: "Receipt 650 bike oil",
      },
    };

    const [voiceCand] = mapDtoToVoiceCandidates(voiceDto);
    const [receiptCand] = mapDtoToReceiptCandidates(receiptDto);

    assertStrictEqual(isValidUUID(voiceCand?.candidate_id), true);
    assertStrictEqual(isValidUUID(receiptCand?.candidate_id), true);
    assertStrictEqual(RFC_4122_UUID_REGEX.test(voiceCand!.candidate_id), true);
    assertStrictEqual(RFC_4122_UUID_REGEX.test(receiptCand!.candidate_id), true);
  });

  it("20. confirmation retry using same candidate identity preserves identical transaction UUID", async () => {
    const dto: FinancialExtractionDTO = {
      entry_intent: "transaction",
      action_intent: "create",
      transactions: [
        {
          type: "income",
          amount: "3200",
          category: "earnings",
          expense_type: null,
          ownership: "mine",
          date: "2026-11-21",
          description: "Project milestone",
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
        raw_utterance: "Got 3200 milestone",
      },
    };

    const [candidate] = mapDtoToVoiceCandidates(dto);
    const candidateUUID = candidate!.candidate_id;
    assertStrictEqual(isValidUUID(candidateUUID), true);

    // Initial adaptation and retry adaptation yield identical valid UUIDs
    const txAttempt1 = candidateToNewTransaction(candidate!);
    const txAttempt2 = candidateToNewTransaction(candidate!);
    assertStrictEqual(txAttempt1.id, candidateUUID);
    assertStrictEqual(txAttempt2.id, candidateUUID);
    assertStrictEqual(txAttempt1.id, txAttempt2.id);
    assertStrictEqual(isValidUUID(txAttempt1.id), true);

    // Persistence delegation across retries receives the exact same UUID
    const deliveredIds: string[] = [];
    const mockPersist = async (tx: any) => {
      deliveredIds.push(tx.id);
      return tx;
    };

    await confirmCandidateTransaction(candidate!, mockPersist);
    await confirmCandidateTransaction(candidate!, mockPersist);
    await confirmCandidateTransaction(candidate!, mockPersist);

    assertStrictEqual(deliveredIds.length, 3);
    assertStrictEqual(deliveredIds[0], candidateUUID);
    assertStrictEqual(deliveredIds[1], candidateUUID);
    assertStrictEqual(deliveredIds[2], candidateUUID);
  });

  it("21. candidateToNewTransaction strictly rejects invalid or missing candidate IDs without draft_id fallback", () => {
    const validDraftUUID = "550e8400-e29b-41d4-a716-446655440000";

    const baseCandidate = {
      type: "income" as const,
      amount_paise: 100000,
      amount_rupees: "1000",
      category: "earnings",
      expense_type: null,
      ownership: "mine" as const,
      date: "2026-11-21" as any,
      description: "Test income",
      payment_method: "cash" as const,
      counterparty: null,
      evidence_type: "voice_transcript" as const,
      verification_status: "user_asserted" as const,
      clarification_required: false,
      clarification_questions: [],
      raw_utterance: "Received 1000 cash",
    };

    // 1. Missing candidate_id throws clear error
    assertThrows(
      () =>
        candidateToNewTransaction({
          ...baseCandidate,
          candidate_id: "" as any,
          draft_id: null,
        }),
      /Cannot confirm candidate transaction: candidate_id '' is missing or not a valid RFC 4122 UUID/
    );

    // 2. Non-UUID candidate_id throws clear error
    assertThrows(
      () =>
        candidateToNewTransaction({
          ...baseCandidate,
          candidate_id: "not-a-uuid-string" as any,
          draft_id: null,
        }),
      /Cannot confirm candidate transaction: candidate_id 'not-a-uuid-string' is missing or not a valid RFC 4122 UUID/
    );

    // 3. Invariant: NEVER falls back to draft_id when candidate_id is invalid or missing
    // Even if draft_id is a perfectly valid RFC 4122 UUID, candidate_id must still be valid
    assertThrows(
      () =>
        candidateToNewTransaction({
          ...baseCandidate,
          candidate_id: "invalid-id" as any,
          draft_id: validDraftUUID,
        }),
      /Cannot confirm candidate transaction: candidate_id 'invalid-id' is missing or not a valid RFC 4122 UUID/
    );

    assertThrows(
      () =>
        candidateToNewTransaction({
          ...baseCandidate,
          candidate_id: "" as any,
          draft_id: validDraftUUID,
        }),
      /Cannot confirm candidate transaction: candidate_id '' is missing or not a valid RFC 4122 UUID/
    );
  });

  it("22. deterministic fallback stability and sibling disambiguation", () => {
    const seed1 = "test-draft-uuid:tx:1";
    const seed2 = "test-draft-uuid:tx:2";

    // 1. Output conforms to RFC 4122 format
    const uuid1 = deriveDeterministicUUID(seed1);
    const uuid2 = deriveDeterministicUUID(seed2);
    assertStrictEqual(isValidUUID(uuid1), true);
    assertStrictEqual(isValidUUID(uuid2), true);
    assertStrictEqual(RFC_4122_UUID_REGEX.test(uuid1), true);
    assertStrictEqual(RFC_4122_UUID_REGEX.test(uuid2), true);

    // 2. Deterministic stability across calls
    const uuid1_again = deriveDeterministicUUID(seed1);
    assertStrictEqual(uuid1, uuid1_again);

    // 3. Sibling indices produce distinct UUIDs
    assertStrictEqual(uuid1 !== uuid2, true);
  });
});
