// =====================================================================
// FLOVA AI Extraction Prompt & Core Engine Tests (M3 Phase 6A)
// Covers general-purpose classifications, multi-transaction parsing,
// query intents, missing amounts, COD ownership, and model output validation.
// =====================================================================

import {
  adaptExtractedPayout,
  adaptExtractedTransactions,
  MOCK_EXTRACTION_RESPONSES,
  validateExtractionOutput,
} from "../index";
import { assertStrictEqual, describe, it } from "./testUtils";

describe("Core AI Extraction Engine & Prompts (Phase 6A)", () => {
  it("1. freelancer income", () => {
    // "I received 2500 from a client for website development."
    const mock = MOCK_EXTRACTION_RESPONSES.freelancer_income;
    const validation = validateExtractionOutput(mock);

    assertStrictEqual(validation.valid, true);
    assertStrictEqual(validation.errors.length, 0);

    const dto = validation.dto!;
    assertStrictEqual(dto.entry_intent, "transaction");
    assertStrictEqual(dto.transactions.length, 1);

    const tx = dto.transactions[0];
    assertStrictEqual(tx.type, "income");
    assertStrictEqual(tx.amount, "2500");
    assertStrictEqual(tx.category, "earnings");
    assertStrictEqual(tx.description, "Website development");
    assertStrictEqual(tx.ownership, "mine");
    assertStrictEqual(tx.payment_method, "bank_transfer");

    const adapted = adaptExtractedTransactions(dto);
    assertStrictEqual(adapted.length, 1);
    assertStrictEqual(adapted[0].type, "income");
    assertStrictEqual(adapted[0].amount, 250000); // 2500 INR = 250,000 paise
    assertStrictEqual(adapted[0].category, "earnings");
    assertStrictEqual(adapted[0].ownership, "mine");
  });

  it("2. shop owner expense", () => {
    // "Bought raw materials worth 300."
    const mock = MOCK_EXTRACTION_RESPONSES.shop_owner_expense;
    const validation = validateExtractionOutput(mock);

    assertStrictEqual(validation.valid, true);
    const dto = validation.dto!;
    assertStrictEqual(dto.transactions.length, 1);

    const tx = dto.transactions[0];
    assertStrictEqual(tx.type, "expense");
    assertStrictEqual(tx.amount, "300");
    assertStrictEqual(tx.category, "other");
    assertStrictEqual(tx.expense_type, "work");
    assertStrictEqual(tx.ownership, "mine");

    const adapted = adaptExtractedTransactions(dto);
    assertStrictEqual(adapted[0].type, "expense");
    assertStrictEqual(adapted[0].amount, 30000); // 300 INR = 30,000 paise
    assertStrictEqual(adapted[0].expenseType, "work");
    assertStrictEqual(adapted[0].ownership, "mine");
  });

  it("3. street vendor cash income", () => {
    // "Received 500 cash from customers."
    const mock = MOCK_EXTRACTION_RESPONSES.street_vendor_cash;
    const validation = validateExtractionOutput(mock);

    assertStrictEqual(validation.valid, true);
    const dto = validation.dto!;
    const tx = dto.transactions[0];

    assertStrictEqual(tx.type, "income");
    assertStrictEqual(tx.amount, "500");
    assertStrictEqual(tx.category, "earnings");
    assertStrictEqual(tx.payment_method, "cash");

    const adapted = adaptExtractedTransactions(dto);
    assertStrictEqual(adapted[0].amount, 50000);
    assertStrictEqual(adapted[0].ownership, "mine");
  });

  it("4. individual electricity expense", () => {
    // "Paid 200 for electricity."
    const mock = MOCK_EXTRACTION_RESPONSES.individual_electricity;
    const validation = validateExtractionOutput(mock);

    assertStrictEqual(validation.valid, true);
    const dto = validation.dto!;
    const tx = dto.transactions[0];

    assertStrictEqual(tx.type, "expense");
    assertStrictEqual(tx.amount, "200");
    assertStrictEqual(tx.category, "other");
    // Not a business expense: living expense
    assertStrictEqual(tx.expense_type, "living");

    const adapted = adaptExtractedTransactions(dto);
    assertStrictEqual(adapted[0].amount, 20000);
    assertStrictEqual(adapted[0].expenseType, "living");
  });

  it("5. two transactions in one statement", () => {
    // "I received 2500 from a customer and spent 300 on raw materials."
    const mock = MOCK_EXTRACTION_RESPONSES.two_transactions;
    const validation = validateExtractionOutput(mock);

    assertStrictEqual(validation.valid, true);
    const dto = validation.dto!;
    assertStrictEqual(dto.transactions.length, 2);

    const adapted = adaptExtractedTransactions(dto);
    assertStrictEqual(adapted.length, 2);

    // Income ₹2500
    assertStrictEqual(adapted[0].type, "income");
    assertStrictEqual(adapted[0].amount, 250000);

    // Expense ₹300 (work)
    assertStrictEqual(adapted[1].type, "expense");
    assertStrictEqual(adapted[1].amount, 30000);
    assertStrictEqual(adapted[1].expenseType, "work");
  });

  it("6. missing amount", () => {
    // "Filled petrol at Shell station" (omitted amount)
    const mock = MOCK_EXTRACTION_RESPONSES.missing_amount;
    const validation = validateExtractionOutput(mock);

    assertStrictEqual(validation.valid, true);
    const dto = validation.dto!;
    assertStrictEqual(dto.transactions[0].amount, null);
    assertStrictEqual(dto.metadata.clarification_required, true);
    assertStrictEqual(dto.metadata.clarification_questions.length > 0, true);
  });

  it("7. missing or ambiguous ownership on COD collection", () => {
    // Model emits COD transaction without explicitly flagging ownership: "not_mine"
    const rawWithAmbiguousOwnership = {
      entry_intent: "transaction",
      action_intent: "create",
      target_draft_id: null,
      transactions: [
        {
          type: "income",
          amount: "600",
          category: "cod_collection",
          expense_type: null,
          ownership: null, // Ambiguous / missing
          date: "2026-11-21",
          description: "Customer COD cash for order #402",
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
        raw_utterance: "Collected 600 COD",
      },
    };

    const validation = validateExtractionOutput(rawWithAmbiguousOwnership);
    assertStrictEqual(validation.valid, true);
    // Safety check: COD is automatically sanitized to "not_mine"
    assertStrictEqual(validation.dto!.transactions[0]!.ownership, "not_mine");

    const adapted = adaptExtractedTransactions(validation.dto!);
    assertStrictEqual(adapted[0].ownership, "not_mine");
    assertStrictEqual(adapted[0].expenseType, undefined); // Enforce: not_mine has no expenseType
  });

  it("8. unknown category", () => {
    // "Spent 50 on stationery"
    const mock = MOCK_EXTRACTION_RESPONSES.unknown_category;
    const validation = validateExtractionOutput(mock);

    assertStrictEqual(validation.valid, true);
    const dto = validation.dto!;
    assertStrictEqual(dto.transactions[0].category, "other");
    assertStrictEqual(dto.metadata.clarification_required, true);
  });

  it("9. expected payout versus received income", () => {
    // "Expecting 3000 platform payout on Friday"
    const mock = MOCK_EXTRACTION_RESPONSES.expected_payout;
    const validation = validateExtractionOutput(mock);

    assertStrictEqual(validation.valid, true);
    const dto = validation.dto!;
    assertStrictEqual(dto.entry_intent, "expected_payout");
    assertStrictEqual(dto.transactions.length, 0); // MUST NOT be in transactions!

    // Adapting transactions yields empty array
    const adaptedTx = adaptExtractedTransactions(dto);
    assertStrictEqual(adaptedTx.length, 0);

    // Adapting payout yields forward-looking NewPayout
    const adaptedPayout = adaptExtractedPayout(dto);
    assertStrictEqual(adaptedPayout !== null, true);
    assertStrictEqual(adaptedPayout!.expected, 300000);
    assertStrictEqual(adaptedPayout!.status, "scheduled");
  });

  it("10. today's spending query intent", () => {
    // "How much did I spend today?"
    const mock = MOCK_EXTRACTION_RESPONSES.today_spending_query;
    const validation = validateExtractionOutput(mock);

    assertStrictEqual(validation.valid, true);
    const dto = validation.dto!;
    assertStrictEqual(dto.entry_intent, "query");
    assertStrictEqual(dto.query?.query_type, "today_spending");
    assertStrictEqual(dto.transactions.length, 0); // No fabricated transactions
  });

  it("11. pending payments query intent", () => {
    // "Show me all my pending payments"
    const mock = MOCK_EXTRACTION_RESPONSES.pending_payments_query;
    const validation = validateExtractionOutput(mock);

    assertStrictEqual(validation.valid, true);
    const dto = validation.dto!;
    assertStrictEqual(dto.entry_intent, "query");
    assertStrictEqual(dto.query?.query_type, "pending_payments");
    assertStrictEqual(dto.transactions.length, 0); // No fabricated transactions
  });

  it("12. invalid structured model output", () => {
    // Case A: Malformed JSON string
    const malformedJson = "{ invalid json content: 123 ";
    const resA = validateExtractionOutput(malformedJson);
    assertStrictEqual(resA.valid, false);
    assertStrictEqual(resA.errors.length > 0, true);

    // Case B: Negative amount
    const negativeAmountJson = JSON.stringify({
      entry_intent: "transaction",
      action_intent: "create",
      target_draft_id: null,
      transactions: [
        {
          type: "expense",
          amount: "-350",
          category: "fuel",
          expense_type: "work",
          ownership: "mine",
          date: "2026-11-21",
          description: "Petrol",
        },
      ],
      metadata: { input_source: "text", certainty: 0.9, clarification_required: false },
    });
    const resB = validateExtractionOutput(negativeAmountJson);
    assertStrictEqual(resB.valid, false);
    assertStrictEqual(resB.errors.some((e) => e.includes("malformed or negative amount")), true);

    // Case C: Model erroneously assigns "independently_verified"
    const unsafeVerification = {
      entry_intent: "transaction",
      action_intent: "create",
      target_draft_id: null,
      transactions: [
        {
          type: "expense",
          amount: "150",
          category: "food",
          expense_type: "living",
          ownership: "mine",
          date: "2026-11-21",
          description: "Lunch",
          evidence_type: "receipt_image",
          verification_status: "independently_verified", // UNSAFE!
        },
      ],
      metadata: { input_source: "shared_receipt_image", certainty: 0.95, clarification_required: false },
    };
    const resC = validateExtractionOutput(unsafeVerification);
    assertStrictEqual(resC.valid, true);
    // Strict safety invariant: Must be forced to "receipt_reported"
    assertStrictEqual(resC.dto!.transactions[0]!.verification_status, "receipt_reported");

    // Case D: Invalid entry intent
    const invalidIntent = {
      entry_intent: "unsupported_intent",
      action_intent: "create",
      metadata: {},
    };
    const resD = validateExtractionOutput(invalidIntent);
    assertStrictEqual(resD.valid, false);
    assertStrictEqual(resD.errors.some((e) => e.includes("Invalid entry_intent")), true);
  });
});
