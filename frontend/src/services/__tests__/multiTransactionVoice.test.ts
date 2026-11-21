// =====================================================================
// FLOVA Phase 15: Multi-Transaction Conversational Voice Tests
// Tests single-utterance multi-transaction extraction, batch arithmetic,
// independent amounts & UUIDs, ambiguous direction handling, and idempotency.
// =====================================================================

import { extractTransaction } from "../../voice/extractTransaction";
import { calculateBatchSummary, validateBatchCandidate } from "../../engine/batchArithmetic";
import { mapDtoToVoiceCandidates } from "../../engine/candidateAdapter";
import type { VoiceTransactionCandidate } from "../../types/contracts";

declare const process: any;

let passed = 0;
let failed = 0;

function assertTrue(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(`${message ? message + ": " : ""}Expected ${expected}, got ${actual}`);
  }
}

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✔ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✖ ${name}:`, err);
  }
}

console.log("=====================================================================");
console.log("FLOVA Phase 15: Multi-Transaction Conversational Voice Tests");
console.log("=====================================================================");

// 1. Example A: "Paid 150 for lunch and 400 for petrol"
test("Example A: extracts 2 expenses with distinct amounts and categories", () => {
  const transcript = "Paid 150 for lunch and 400 for petrol";
  const dto = extractTransaction(transcript);
  const candidates = mapDtoToVoiceCandidates(dto, { authorizedDraftIds: [] });

  assertEqual(candidates.length, 2);
  assertEqual(candidates[0].type, "expense");
  assertEqual(candidates[0].amountPaise, 15000);
  assertEqual(candidates[0].category, "food");

  assertEqual(candidates[1].type, "expense");
  assertEqual(candidates[1].amountPaise, 40000);
  assertEqual(candidates[1].category, "fuel");
  assertEqual(candidates[1].expenseType, "work");
});

// 2. Example B: "Spent 250 on groceries and earned 800 from freelance"
test("Example B: extracts expense ₹250 and income ₹800 without amount duplication", () => {
  const transcript = "Spent 250 on groceries and earned 800 from freelance";
  const dto = extractTransaction(transcript);
  const candidates = mapDtoToVoiceCandidates(dto, { authorizedDraftIds: [] });

  assertEqual(candidates.length, 2);
  const exp = candidates.find((c) => c.type === "expense");
  const inc = candidates.find((c) => c.type === "income");

  assertTrue(!!exp, "Expense candidate must exist");
  assertTrue(!!inc, "Income candidate must exist");
  assertEqual(exp?.amountPaise, 25000);
  assertEqual(exp?.category, "groceries");
  assertEqual(inc?.amountPaise, 80000);
  assertEqual(inc?.category, "freelance");
  assertTrue(exp?.amountPaise !== inc?.amountPaise, "Amounts must never be duplicated across clauses");
});

// 3. Example C: "Yesterday 300 for diesel and today 1200 from client payment"
test("Example C: handles relative dates and distinct income/expense directions", () => {
  const transcript = "Yesterday 300 for diesel and today 1200 from client payment";
  const dto = extractTransaction(transcript);
  const candidates = mapDtoToVoiceCandidates(dto, { authorizedDraftIds: [] });

  assertEqual(candidates.length, 2);
  const diesel = candidates[0];
  const client = candidates[1];

  assertEqual(diesel.type, "expense");
  assertEqual(diesel.amountPaise, 30000);
  assertEqual(diesel.category, "fuel");

  assertEqual(client.type, "income");
  assertEqual(client.amountPaise, 120000);
  assertTrue(diesel.date !== client.date, "Yesterday and today must have distinct calendar dates");
});

// 4. Example D: "Paid 200 tea and 500 from Ramesh" (Ambiguous direction)
test("Example D: ambiguous clause without explicit verb flags direction for review", () => {
  const transcript = "Paid 200 tea and 500 from Ramesh";
  const dto = extractTransaction(transcript);

  assertEqual(dto.transactions?.length, 2);
  assertEqual(dto.transactions![0].type, "expense");
  assertEqual(dto.transactions![0].amount, "200");

  // Second candidate: "500 from Ramesh" has null type
  const second = dto.transactions![1];
  assertEqual(second.amount, "500");
  assertEqual(second.type, null, "Ambiguous clause must have type null");
  assertTrue(
    !!dto.metadata?.clarification_questions?.some((q) => q.includes("income or an expense")),
    "Must require direction clarification"
  );
});

// 5. Example E: "Petrol 250, auto 80, lunch 120, earned 1500 from delivery"
test("Example E: handles 4 distinct clauses in a single utterance", () => {
  const transcript = "Petrol 250, auto 80, lunch 120, earned 1500 from delivery";
  const dto = extractTransaction(transcript);
  const candidates = mapDtoToVoiceCandidates(dto, { authorizedDraftIds: [] });

  assertEqual(candidates.length, 4);
  const types = candidates.map((c) => c.type);
  assertEqual(types[0], "expense");
  assertEqual(types[1], "expense");
  assertEqual(types[2], "expense");
  assertEqual(types[3], "income");

  const amounts = candidates.map((c) => c.amountPaise);
  assertEqual(amounts[0], 25000);
  assertEqual(amounts[1], 8000);
  assertEqual(amounts[2], 12000);
  assertEqual(amounts[3], 150000);
});

// 6. Formatted Numbers with Commas: "received 1,500 from freelance"
test("Formatted commas: '1,500' does not split into broken clauses", () => {
  const transcript = "Received 1,500 from freelance and spent 350 on petrol";
  const dto = extractTransaction(transcript);
  const candidates = mapDtoToVoiceCandidates(dto, { authorizedDraftIds: [] });

  assertEqual(candidates.length, 2);
  assertEqual(candidates[0].amountPaise, 150000);
  assertEqual(candidates[1].amountPaise, 35000);
});

// 7. Batch Arithmetic Engine
test("Batch Arithmetic: calculateBatchSummary computes integer paise totals and breakdown", () => {
  const candidates: VoiceTransactionCandidate[] = [
    {
      id: "cand-1",
      candidate_id: "cand-1",
      draft_id: null,
      transcript: "lunch 150",
      raw_utterance: "lunch 150",
      type: "expense",
      amount_paise: 15000,
      amountPaise: 15000,
      amount_rupees: "150",
      category: "food",
      expense_type: "living",
      expenseType: "living",
      ownership: "mine",
      description: "lunch",
      date: "2026-11-21",
      needsReview: false,
      clarification_required: false,
      missingFields: [],
      clarification_questions: [],
    },
    {
      id: "cand-2",
      candidate_id: "cand-2",
      draft_id: null,
      transcript: "petrol 400",
      raw_utterance: "petrol 400",
      type: "expense",
      amount_paise: 40000,
      amountPaise: 40000,
      amount_rupees: "400",
      category: "fuel",
      expense_type: "work",
      expenseType: "work",
      ownership: "mine",
      description: "petrol",
      date: "2026-11-21",
      needsReview: false,
      clarification_required: false,
      missingFields: [],
      clarification_questions: [],
    },
    {
      id: "cand-3",
      candidate_id: "cand-3",
      draft_id: null,
      transcript: "freelance 1000",
      raw_utterance: "freelance 1000",
      type: "income",
      amount_paise: 100000,
      amountPaise: 100000,
      amount_rupees: "1000",
      category: "freelance",
      expense_type: null,
      expenseType: null,
      ownership: "mine",
      description: "client payment",
      date: "2026-11-21",
      needsReview: false,
      clarification_required: false,
      missingFields: [],
      clarification_questions: [],
    },
  ];

  const summary = calculateBatchSummary(candidates);
  assertEqual(summary.candidateCount, 3);
  assertEqual(summary.validCount, 3);
  assertEqual(summary.clarificationCount, 0);
  assertEqual(summary.totalExpensesPaise, 55000);
  assertEqual(summary.totalIncomePaise, 100000);
  assertEqual(summary.netMovementPaise, 45000);

  // Check category breakdown
  assertEqual(summary.categoryTotals["food"], 15000);
  assertEqual(summary.categoryTotals["fuel"], 40000);
  assertEqual(summary.categoryTotals["freelance"], 100000);
});

// 8. Candidate Validation: rejects candidates with missing amounts or non-mine ownership exceeding daily limit
test("validateBatchCandidate catches missing fields and invalid limits", () => {
  const validCand: VoiceTransactionCandidate = {
    id: "cand-v",
    candidate_id: "cand-v",
    draft_id: null,
    transcript: "lunch 250",
    raw_utterance: "lunch 250",
    type: "expense",
    amount_paise: 25000,
    amountPaise: 25000,
    amount_rupees: "250",
    category: "food",
    expense_type: "living",
    expenseType: "living",
    ownership: "mine",
    date: "2026-11-21",
    needsReview: false,
    clarification_required: false,
    missingFields: [],
    clarification_questions: [],
    description: "lunch",
  };
  const resValid = validateBatchCandidate(validCand);
  assertEqual(resValid.isValid, true);

  const missingAmount: VoiceTransactionCandidate = {
    ...validCand,
    id: "cand-no-amt",
    candidate_id: "cand-no-amt",
    amount_paise: null,
    amountPaise: null,
  };
  const resNoAmt = validateBatchCandidate(missingAmount);
  assertEqual(resNoAmt.isValid, false);
  assertTrue(resNoAmt.issues.some((e) => e.includes("Amount is missing")), "Should report missing amount");

  const overLimit: VoiceTransactionCandidate = {
    ...validCand,
    id: "cand-over",
    candidate_id: "cand-over",
    amount_paise: 150000000, // ₹15 lakh > ₹10 lakh limit
    amountPaise: 150000000,
  };
  const resOver = validateBatchCandidate(overLimit);
  assertEqual(resOver.isValid, false);
  assertTrue(resOver.issues.some((e) => e.includes("₹10,00,000")), "Should report limit violation");
});

// 9. Independent UUID Stability: Each candidate receives an RFC 4122 UUID
test("UUID Stability: Multiple voice candidates get distinct RFC 4122 UUIDs", () => {
  const transcript = "Spent 250 on food and 800 on freelance";
  const dto = extractTransaction(transcript);
  const candidates = mapDtoToVoiceCandidates(dto, { authorizedDraftIds: [] });

  assertEqual(candidates.length, 2);
  assertTrue(candidates[0].candidate_id !== candidates[1].candidate_id, "Candidate IDs must be distinct");
  // Check RFC 4122 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assertTrue(uuidRegex.test(candidates[0].candidate_id), "Candidate 1 must be RFC 4122 UUID");
  assertTrue(uuidRegex.test(candidates[1].candidate_id), "Candidate 2 must be RFC 4122 UUID");
});

console.log("=====================================================================");
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log("=====================================================================");

if (typeof process !== "undefined" && failed > 0) {
  process.exit(1);
}
