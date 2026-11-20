// =====================================================================
// FLOVA Phase 7: Financial Data Contracts & Timeline Unit Tests
// Tests chronological activity merging, check-in segregation, and
// AI/Voice candidate confirmation with truthful missing-data handling.
// =====================================================================

import { confirmCandidateTransaction, listActivityTimeline } from "../data";
import { mockState, resetMockState } from "./mockSupabase";
import type {
  BalanceCheckin,
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

async function it(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    passCount++;
    console.log(`  ✔ ${name}`);
  } catch (err) {
    failCount++;
    console.error(`  ✘ ${name}`);
    console.error(err);
  }
}

async function runTests() {
  console.log("=================================================");
  console.log("FLOVA Phase 7: Activity & Candidate Contract Tests");
  console.log("=================================================\n");

  // -----------------------------------------------------------------
  // 1. Activity Timeline & Check-in Segregation Tests
  // -----------------------------------------------------------------
  await it("Test 1: Activity timeline merges transactions and check-ins chronologically", async () => {
    resetMockState();

    const checkin1: BalanceCheckin = {
      id: "chk-1",
      user_id: "user-1",
      cash_amount: "1500.00",
      bank_amount: "2500.00",
      not_mine_amount: "600.00",
      note: "Morning check-in",
      checked_at: "2026-11-19T08:00:00Z",
      created_at: "2026-11-19T08:00:00Z",
    };

    const tx1: Transaction = {
      id: "tx-1",
      user_id: "user-1",
      type: "income",
      amount: "650.00",
      category: "earnings",
      description: "Platform delivery earnings",
      expense_type: null,
      ownership: "mine",
      payout_id: null,
      transaction_date: "2026-11-19",
      source: "demo",
      created_at: "2026-11-19T10:00:00Z",
      updated_at: "2026-11-19T10:00:00Z",
    };

    const tx2: Transaction = {
      id: "tx-2",
      user_id: "user-1",
      type: "expense",
      amount: "120.00",
      category: "fuel",
      description: "Petrol refill",
      expense_type: "work",
      ownership: "mine",
      payout_id: null,
      transaction_date: "2026-11-19",
      source: "demo",
      created_at: "2026-11-19T14:00:00Z",
      updated_at: "2026-11-19T14:00:00Z",
    };

    mockState.balanceCheckins = [checkin1];
    mockState.transactions = [tx1, tx2];

    const timeline = await listActivityTimeline();
    assertStrictEqual(timeline.length, 3, "Timeline must contain 3 items");

    // Chronological order descending by timestamp: tx2 (14:00), tx1 (10:00), checkin1 (08:00)
    assertStrictEqual(timeline[0].id, "tx-2");
    assertStrictEqual(timeline[1].id, "tx-1");
    assertStrictEqual(timeline[2].id, "chk-1");
  });

  await it("Test 2: Check-ins are strictly segregated as kind='checkin' and type='checkin'", async () => {
    resetMockState();

    mockState.balanceCheckins = [
      {
        id: "chk-morning",
        user_id: "user-1",
        cash_amount: "1500.00",
        bank_amount: "2500.00",
        not_mine_amount: "600.00",
        note: "Daily pocket check",
        checked_at: "2026-11-20T08:00:00Z",
        created_at: "2026-11-20T08:00:00Z",
      },
    ];

    const timeline = await listActivityTimeline();
    assertStrictEqual(timeline.length, 1);
    const item = timeline[0];

    assertStrictEqual(item.kind, "checkin", "Kind must be 'checkin'");
    assertStrictEqual(item.type, "checkin", "Type must be 'checkin' (NEVER income or expense)");
    assertTrue(item.amountPaise === undefined, "Check-in item must not define root amountPaise");
    assertTrue(item.snapshot !== undefined, "Check-in item must include balance snapshot");
    assertStrictEqual(item.snapshot?.cashPaise, 150000);
    assertStrictEqual(item.snapshot?.bankPaise, 250000);
    assertStrictEqual(item.snapshot?.notMinePaise, 60000);
    assertStrictEqual(item.snapshot?.totalPersonalPaise, 340000, "Personal liquid cash = 1500 + 2500 - 600 = 3400 (340,000 paise)");
  });

  await it("Test 3: Payout receipts are flagged with kind='payout_receipt'", async () => {
    resetMockState();

    mockState.transactions = [
      {
        id: "tx-payout-1",
        user_id: "user-1",
        type: "income",
        amount: "1800.00",
        category: "payout",
        description: "Swiggy weekly settlement",
        expense_type: null,
        ownership: "mine",
        payout_id: "payout-uuid-1",
        transaction_date: "2026-11-23",
        source: "manual",
        created_at: "2026-11-23T11:00:00Z",
        updated_at: "2026-11-23T11:00:00Z",
      },
    ];

    const timeline = await listActivityTimeline();
    assertStrictEqual(timeline.length, 1);
    assertStrictEqual(timeline[0].kind, "payout_receipt");
    assertStrictEqual(timeline[0].payoutId, "payout-uuid-1");
    assertStrictEqual(timeline[0].amountPaise, 180000);
  });

  await it("Test 4: listActivityTimeline limits returned items when limit is specified", async () => {
    resetMockState();

    mockState.transactions = [
      {
        id: "tx-1",
        user_id: "user-1",
        type: "expense",
        amount: "50.00",
        category: "chai",
        description: "Tea",
        expense_type: "living",
        ownership: "mine",
        payout_id: null,
        transaction_date: "2026-11-20",
        source: "manual",
        created_at: "2026-11-20T09:00:00Z",
        updated_at: "2026-11-20T09:00:00Z",
      },
      {
        id: "tx-2",
        user_id: "user-1",
        type: "expense",
        amount: "100.00",
        category: "fuel",
        description: "Petrol",
        expense_type: "work",
        ownership: "mine",
        payout_id: null,
        transaction_date: "2026-11-20",
        source: "manual",
        created_at: "2026-11-20T10:00:00Z",
        updated_at: "2026-11-20T10:00:00Z",
      },
    ];

    const timeline = await listActivityTimeline({ limit: 1 });
    assertStrictEqual(timeline.length, 1, "Should respect limit=1");
    assertStrictEqual(timeline[0].id, "tx-2", "Should return the most recent transaction");
  });

  // -----------------------------------------------------------------
  // 2. Candidate Confirmation Tests (FLOVA Catch & Voice)
  // -----------------------------------------------------------------
  await it("Test 5: Valid receipt candidate confirms successfully as living/work expense", async () => {
    resetMockState();

    const candidate: ExtractedReceiptCandidate = {
      merchant: "Indian Oil Petrol Bunk",
      amountPaise: 12000, // ₹120.00
      category: "fuel",
      expenseType: "work",
      date: "2026-11-20",
      notes: "Receipt #4592",
      confidence: 0.95,
      needsReview: false,
      missingFields: [],
    };

    const tx = await confirmCandidateTransaction(candidate);
    assertStrictEqual(tx.type, "expense");
    assertStrictEqual(tx.amount, "120.00");
    assertStrictEqual(tx.category, "fuel");
    assertStrictEqual(tx.expense_type, "work");
    assertStrictEqual(tx.description, "Indian Oil Petrol Bunk - Receipt #4592");
    assertStrictEqual(tx.source, "ai_suggestion");
    assertStrictEqual(mockState.transactions.length, 1);
  });

  await it("Test 6: Receipt candidate missing amount rejects confirmation with review requirement", async () => {
    resetMockState();

    const candidate: ExtractedReceiptCandidate = {
      merchant: "Corner Tea Shop",
      amountPaise: null, // Missing amount
      category: "food",
      expenseType: "living",
      date: "2026-11-20",
      notes: null,
      needsReview: true,
      missingFields: ["amount"],
    };

    let thrown = false;
    try {
      await confirmCandidateTransaction(candidate);
    } catch (err: any) {
      thrown = true;
      assertTrue(err.message.includes("amount is missing or invalid"), "Should require user review for missing amount");
    }
    assertTrue(thrown, "Missing amount candidate must throw on confirmation");
    assertStrictEqual(mockState.transactions.length, 0, "No row should be inserted");
  });

  await it("Test 7: Receipt candidate missing expenseType rejects confirmation", async () => {
    resetMockState();

    const candidate: ExtractedReceiptCandidate = {
      merchant: "Shell Petrol Bunk",
      amountPaise: 25000, // ₹250.00
      category: "fuel",
      expenseType: null, // Missing living vs work
      date: "2026-11-20",
      notes: null,
      needsReview: true,
      missingFields: ["expenseType"],
    };

    let thrown = false;
    try {
      await confirmCandidateTransaction(candidate);
    } catch (err: any) {
      thrown = true;
      assertTrue(err.message.includes("Choose whether this expense is living or work"), "Should enforce expenseType requirement");
    }
    assertTrue(thrown, "Candidate missing expenseType must throw on confirmation");
  });

  await it("Test 8: Valid voice candidate confirms successfully", async () => {
    resetMockState();

    const candidate: VoiceTransactionCandidate = {
      transcript: "Received 500 rupees tip from customer",
      type: "income",
      amountPaise: 50000, // ₹500.00
      category: "tips",
      expenseType: null,
      date: "2026-11-20",
      ownership: "mine",
      confidence: 0.98,
      needsReview: false,
      missingFields: [],
    };

    const tx = await confirmCandidateTransaction(candidate);
    assertStrictEqual(tx.type, "income");
    assertStrictEqual(tx.amount, "500.00");
    assertStrictEqual(tx.category, "tips");
    assertStrictEqual(tx.description, "Received 500 rupees tip from customer");
    assertStrictEqual(tx.source, "voice");
    assertStrictEqual(mockState.transactions.length, 1);
  });

  await it("Test 9: Voice candidate with expense enforces living vs work selection", async () => {
    resetMockState();

    const candidate: VoiceTransactionCandidate = {
      transcript: "Spent 40 rupees on snack",
      type: "expense",
      amountPaise: 4000,
      category: "food",
      expenseType: null, // Missing living/work
      date: "2026-11-20",
      ownership: "mine",
      needsReview: true,
      missingFields: ["expenseType"],
    };

    let thrown = false;
    try {
      await confirmCandidateTransaction(candidate);
    } catch (err: any) {
      thrown = true;
      assertTrue(err.message.includes("Choose whether this expense is living or work"), "Should enforce living vs work selection");
    }
    assertTrue(thrown, "Voice expense candidate without expenseType must throw");
  });

  await it("Test 10: Retains candidate client idempotency ID when provided", async () => {
    resetMockState();

    const candidateId = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
    const candidate: ExtractedReceiptCandidate = {
      id: candidateId,
      merchant: "Apollo Pharmacy",
      amountPaise: 18000,
      category: "medical",
      expenseType: "living",
      date: "2026-11-20",
      notes: null,
      needsReview: false,
      missingFields: [],
    };

    const tx = await confirmCandidateTransaction(candidate);
    assertStrictEqual(tx.id, candidateId, "Should preserve client-generated UUID for idempotency");
  });

  console.log("\n=================================================");
  console.log(`Results: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);
  console.log("=================================================\n");

  if (failCount > 0) {
    (globalThis as any).process?.exit(1);
  }
}

runTests();
