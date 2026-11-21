import { confirmCandidateTransaction } from "../data";
import { mockState } from "./mockSupabase";
import type {
  ExtractedReceiptCandidate,
  Transaction,
  VoiceTransactionCandidate,
} from "../../types/contracts";

let passCount = 0;
let failCount = 0;

function assertTrue(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertStrictEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(message ?? `Assertion failed: expected ${String(expected)}, but got ${String(actual)}`);
  }
}

function it(name: string, fn: () => Promise<void> | void) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res.then(
        () => {
          passCount++;
          console.log(`  ✔ ${name}`);
        },
        (err) => {
          failCount++;
          console.error(`  ✘ ${name}`);
          console.error(err);
        }
      );
    } else {
      passCount++;
      console.log(`  ✔ ${name}`);
    }
  } catch (err) {
    failCount++;
    console.error(`  ✘ ${name}`);
    console.error(err);
  }
}

async function runTests() {
  console.log("=================================================");
  console.log("FLOVA Candidate ID Stability & Idempotency Tests");
  console.log("=================================================\n");

  // Scenario 1: Candidate ID stability across camelCase candidate interface
  await it("Scenario 1: Candidate with camelCase id propagates stable ID to persisted transaction", async () => {
    const testCandidateId = "88888888-8888-4888-8888-888888888888";
    mockState.insertHandler = async (rawPayload: unknown) => {
      const payload = rawPayload as any;
      assertStrictEqual(payload.id, testCandidateId, "Candidate ID must be preserved exactly on insert");
      assertStrictEqual(payload.type, "expense");
      assertStrictEqual(payload.amount, "250.00");
      assertStrictEqual(payload.expense_type, "living");
      return {
        data: {
          id: payload.id,
          user_id: "user-123",
          type: payload.type,
          amount: payload.amount,
          category: payload.category,
          description: payload.description,
          expense_type: payload.expense_type,
          ownership: payload.ownership,
          payout_id: null,
          transaction_date: "2026-11-21",
          source: payload.source,
          created_at: "2026-11-21T00:00:00Z",
          updated_at: "2026-11-21T00:00:00Z",
        },
        error: null,
      };
    };

    const candidate: VoiceTransactionCandidate = {
      id: testCandidateId,
      transcript: "Groceries ₹250",
      type: "expense",
      amountPaise: 25000,
      category: "food",
      expenseType: "living",
      date: "2026-11-21",
      ownership: "mine",
      needsReview: false,
      missingFields: [],
    };

    const saved = await confirmCandidateTransaction(candidate);
    assertStrictEqual(saved.id, testCandidateId);
    assertStrictEqual(saved.amount, "250.00");
  });

  // Scenario 2: Candidate ID stability across snake_case candidate interface (PR #15 M3 candidate_id)
  await it("Scenario 2: Candidate with snake_case candidate_id propagates stable ID to persisted transaction", async () => {
    const testCandidateId = "77777777-7777-4777-8777-777777777777";
    mockState.insertHandler = async (rawPayload: unknown) => {
      const payload = rawPayload as any;
      assertStrictEqual(payload.id, testCandidateId, "Snake_case candidate_id must propagate to payload.id");
      assertStrictEqual(payload.type, "expense");
      assertStrictEqual(payload.amount, "120.00");
      assertStrictEqual(payload.expense_type, "work");
      return {
        data: {
          id: payload.id,
          user_id: "user-123",
          type: payload.type,
          amount: payload.amount,
          category: payload.category,
          description: payload.description,
          expense_type: payload.expense_type,
          ownership: payload.ownership,
          payout_id: null,
          transaction_date: "2026-11-21",
          source: payload.source,
          created_at: "2026-11-21T00:00:00Z",
          updated_at: "2026-11-21T00:00:00Z",
        },
        error: null,
      };
    };

    // M3 candidate format with snake_case properties
    const candidate: any = {
      candidate_id: testCandidateId,
      draft_id: null,
      type: "expense",
      amount_paise: 12000,
      category: "fuel",
      expense_type: "work",
      ownership: "mine",
      date: "2026-11-21",
      raw_utterance: "Petrol 120 rupees",
      clarification_required: false,
      clarification_questions: [],
    };

    const saved = await confirmCandidateTransaction(candidate);
    assertStrictEqual(saved.id, testCandidateId);
    assertStrictEqual(saved.amount, "120.00");
  });

  // Scenario 3: Retrying confirmation with identical candidate ID returns existing record without duplicate
  await it("Scenario 3: Repeated confirmation retry with same candidate ID recovers cleanly via 23505 handler", async () => {
    const testCandidateId = "99999999-9999-4999-8999-999999999999";
    const existingRow: Transaction = {
      id: testCandidateId,
      user_id: "user-123",
      type: "expense",
      amount: "300.00",
      category: "tools",
      description: "Hardware Store",
      expense_type: "work",
      ownership: "mine",
      payout_id: null,
      transaction_date: "2026-11-21",
      source: "ai_suggestion",
      created_at: "2026-11-21T00:00:00Z",
      updated_at: "2026-11-21T00:00:00Z",
    };

    // First call inserts, but simulates a retry where DB returns primary key violation
    mockState.insertHandler = async () => ({
      data: null,
      error: {
        code: "23505",
        message: 'duplicate key value violates unique constraint "transactions_pkey"',
        details: `Key (id)=(${testCandidateId}) already exists.`,
      },
    });

    // Mock selectSingle handler returns the previously committed transaction
    mockState.selectSingleHandler = async (_id: string) => ({
      data: existingRow,
      error: null,
    });

    const receiptCandidate: ExtractedReceiptCandidate = {
      id: testCandidateId,
      merchant: "Hardware Store",
      amountPaise: 30000,
      category: "tools",
      expenseType: "work",
      date: "2026-11-21",
      ownership: "mine",
      needsReview: false,
      missingFields: [],
    };

    const saved = await confirmCandidateTransaction(receiptCandidate);
    assertStrictEqual(saved.id, testCandidateId);
    assertStrictEqual(saved.amount, "300.00");
  });

  // Scenario 4: Missing amount throws error without database writes
  await it("Scenario 4: Candidate missing amount rejects confirmation with zero database writes", async () => {
    let writeAttempted = false;
    mockState.insertHandler = async () => {
      writeAttempted = true;
      return { data: null, error: null };
    };

    const candidate: VoiceTransactionCandidate = {
      id: "55555555-5555-4555-8555-555555555555",
      transcript: "Bought chai",
      type: "expense",
      amountPaise: null,
      category: "food",
      expenseType: "living",
      date: "2026-11-21",
      ownership: "mine",
      needsReview: true,
      missingFields: ["amount"],
    };

    let errorCaught = false;
    try {
      await confirmCandidateTransaction(candidate);
    } catch (e: any) {
      errorCaught = true;
      assertTrue(e.message.includes("amount is missing or invalid"), "Error must mention missing amount");
    }

    assertStrictEqual(errorCaught, true);
    assertStrictEqual(writeAttempted, false, "Zero database writes must occur when amount is missing");
  });

  // Scenario 5: Missing living/work expenseType throws error without database writes
  await it("Scenario 5: Candidate missing expenseType rejects confirmation with zero database writes", async () => {
    let writeAttempted = false;
    mockState.insertHandler = async () => {
      writeAttempted = true;
      return { data: null, error: null };
    };

    const candidate: VoiceTransactionCandidate = {
      id: "44444444-4444-4444-8444-444444444444",
      transcript: "Paid 50 rupees",
      type: "expense",
      amountPaise: 5000,
      category: "other",
      expenseType: null,
      date: "2026-11-21",
      ownership: "mine",
      needsReview: true,
      missingFields: ["expenseType"],
    };

    let errorCaught = false;
    try {
      await confirmCandidateTransaction(candidate);
    } catch (e: any) {
      errorCaught = true;
      assertTrue(e.message.includes("living or work"), "Error must mention living or work");
    }

    assertStrictEqual(errorCaught, true);
    assertStrictEqual(writeAttempted, false, "Zero database writes must occur when expenseType is missing");
  });

  console.log("\n=================================================");
  console.log(`Results: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);
  console.log("=================================================");
  if (failCount > 0) {
    const proc = (globalThis as unknown as { process?: { exit: (code: number) => void } }).process;
    proc?.exit(1);
  }
}

runTests();
