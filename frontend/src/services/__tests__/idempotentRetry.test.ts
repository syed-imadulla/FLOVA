import { addTransaction, receivePayout } from "../data";
import { mockState } from "./mockSupabase";
import type { NewTransaction, Transaction } from "../../types/contracts";

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

function it(name: string, fn: () => Promise<void> | void): Promise<void> | void {
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
  console.log("FLOVA Idempotent Retry UX & Regression Test Suite");
  console.log("=================================================\n");

  // Scenario A: Normal transaction insertion
  await it("Scenario A: Normal transaction insertion assigns UUID and succeeds", async () => {
    mockState.insertHandler = async (payloadRaw: unknown) => {
      const payload = payloadRaw as Record<string, unknown>;
      assertTrue(typeof payload.id === "string" && payload.id.length > 0, "Client UUID must be present");
      assertStrictEqual(payload.type, "expense");
      assertStrictEqual(payload.amount, "150.00");
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
          payout_id: payload.payout_id,
          transaction_date: "2026-11-21",
          source: payload.source,
          created_at: "2026-11-21T00:00:00Z",
          updated_at: "2026-11-21T00:00:00Z",
        },
        error: null,
      };
    };

    const newTx: NewTransaction = {
      type: "expense",
      amount: 15000,
      category: "fuel",
      expenseType: "work",
      ownership: "mine",
    };

    const res = await addTransaction(newTx);
    assertStrictEqual(res.amount, "150.00");
    assertTrue(typeof newTx.id === "string", "newTx should have retained its generated UUID");
    assertStrictEqual(res.id, newTx.id);
  });

  // Scenario B: First insert succeeds with provided UUID
  await it("Scenario B: First insert succeeds with provided UUID", async () => {
    const fixedId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    mockState.insertHandler = async (payloadRaw: unknown) => {
      const payload = payloadRaw as Record<string, unknown>;
      assertStrictEqual(payload.id, fixedId);
      return {
        data: {
          id: fixedId,
          user_id: "user-123",
          type: payload.type,
          amount: payload.amount,
          category: payload.category,
          description: null,
          expense_type: payload.expense_type,
          ownership: "mine",
          payout_id: null,
          transaction_date: "2026-11-21",
          source: "manual",
          created_at: "2026-11-21T00:00:00Z",
          updated_at: "2026-11-21T00:00:00Z",
        },
        error: null,
      };
    };

    const res = await addTransaction({
      id: fixedId,
      type: "expense",
      amount: 25000,
      category: "maintenance",
      expenseType: "work",
    });
    assertStrictEqual(res.id, fixedId);
    assertStrictEqual(res.amount, "250.00");
  });

  // Scenario C: Retry after first insert committed (duplicate PK response, existing row found, matching payload)
  await it("Scenario C: Retry after commit returns existing transaction as success", async () => {
    const retryId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const committedRow: Transaction = {
      id: retryId,
      user_id: "user-123",
      type: "expense",
      amount: "300.00",
      category: "food",
      description: "lunch",
      expense_type: "living",
      ownership: "mine",
      payout_id: null,
      transaction_date: "2026-11-21",
      source: "manual",
      created_at: "2026-11-21T00:00:00Z",
      updated_at: "2026-11-21T00:00:00Z",
    };

    // Simulate insert failure due to previous commit
    mockState.insertHandler = async () => ({
      data: null,
      error: {
        code: "23505",
        message: 'duplicate key value violates unique constraint "transactions_pkey"',
        details: `Key (id)=(${retryId}) already exists.`,
      },
    });

    // Simulate query returning the committed row
    mockState.selectSingleHandler = async (id: string) => {
      assertStrictEqual(id, retryId);
      return { data: committedRow, error: null };
    };

    const txPayload: NewTransaction = {
      id: retryId,
      type: "expense",
      amount: 30000,
      category: "food",
      description: "lunch",
      expenseType: "living",
      ownership: "mine",
    };

    const res = await addTransaction(txPayload);
    assertStrictEqual(res.id, retryId);
    assertStrictEqual(res.amount, "300.00");
    assertStrictEqual(res.category, "food");
  });

  // Scenario D: Duplicate UUID with different financial data (must return conflict error)
  await it("Scenario D: Duplicate UUID with conflicting financial data throws conflict error", async () => {
    const conflictId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const existingRow: Transaction = {
      id: conflictId,
      user_id: "user-123",
      type: "expense",
      amount: "500.00", // committed as 500.00 (50000 paise)
      category: "fuel",
      description: null,
      expense_type: "work",
      ownership: "mine",
      payout_id: null,
      transaction_date: "2026-11-21",
      source: "manual",
      created_at: "2026-11-21T00:00:00Z",
      updated_at: "2026-11-21T00:00:00Z",
    };

    mockState.insertHandler = async () => ({
      data: null,
      error: {
        code: "23505",
        message: 'duplicate key value violates unique constraint "transactions_pkey"',
        details: `Key (id)=(${conflictId}) already exists.`,
      },
    });

    mockState.selectSingleHandler = async () => ({
      data: existingRow,
      error: null,
    });

    // Submitting with different amount (40000 paise != 50000 paise)
    const conflictingPayload: NewTransaction = {
      id: conflictId,
      type: "expense",
      amount: 40000,
      category: "fuel",
      expenseType: "work",
    };

    let caughtError: Error | null = null;
    try {
      await addTransaction(conflictingPayload);
    } catch (err) {
      caughtError = err as Error;
    }

    assertTrue(caughtError !== null, "Must throw conflict error");
    assertTrue(
      caughtError!.message.includes("Transaction ID conflict"),
      `Expected conflict error, got: ${caughtError!.message}`
    );
  });

  // Scenario E: Duplicate UUID with no existing visible row (RLS isolation -> propagates original error)
  await it("Scenario E: Duplicate UUID with hidden/missing row propagates original database error", async () => {
    const foreignId = "dddddddd-dddd-dddd-dddd-dddddddddddd";

    mockState.insertHandler = async () => ({
      data: null,
      error: {
        code: "23505",
        message: 'duplicate key value violates unique constraint "transactions_pkey"',
        details: `Key (id)=(${foreignId}) already exists.`,
      },
    });

    // RLS policy hides the row because user_id does not match auth.uid()
    mockState.selectSingleHandler = async () => ({
      data: null,
      error: null,
    });

    let caughtError: Error | null = null;
    try {
      await addTransaction({
        id: foreignId,
        type: "income",
        amount: 10000,
        category: "earnings",
      });
    } catch (err) {
      caughtError = err as Error;
    }

    assertTrue(caughtError !== null, "Must propagate original error");
    assertTrue(
      caughtError!.message.includes("Save transaction failed: duplicate key value violates unique constraint"),
      `Expected pkey error propagation, got: ${caughtError!.message}`
    );
  });

  // Scenario F: Other unique constraint violation is not treated as idempotent retry
  await it("Scenario F: Non-pkey 23505 violation is not treated as idempotent retry", async () => {
    const otherId = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";

    mockState.insertHandler = async () => ({
      data: null,
      error: {
        code: "23505",
        message: 'duplicate key value violates unique constraint "payouts_id_user_unique"',
        details: 'Key (id, user_id)=(...) already exists.',
      },
    });

    let selectCalled = false;
    mockState.selectSingleHandler = async () => {
      selectCalled = true;
      return { data: null, error: null };
    };

    let caughtError: Error | null = null;
    try {
      await addTransaction({
        id: otherId,
        type: "income",
        amount: 10000,
        category: "earnings",
      });
    } catch (err) {
      caughtError = err as Error;
    }

    assertTrue(caughtError !== null, "Must propagate original error");
    assertStrictEqual(selectCalled, false, "Must not query transactions on non-pkey error");
    assertTrue(caughtError!.message.includes("payouts_id_user_unique"), "Must report original constraint");
  });

  // Scenario G: Payout receipt retries benefit from idempotent retry
  await it("Scenario G: Payout receipt retry succeeds without creating duplicate record", async () => {
    const payoutReceiptId = "ffffffff-ffff-ffff-ffff-ffffffffffff";
    const payoutId = "pppppppp-pppp-pppp-pppp-pppppppppppp";

    const committedReceipt: Transaction = {
      id: payoutReceiptId,
      user_id: "user-123",
      type: "income",
      amount: "600.00",
      category: "payout",
      description: null,
      expense_type: null,
      ownership: "mine",
      payout_id: payoutId,
      transaction_date: "2026-11-21",
      source: "manual",
      created_at: "2026-11-21T00:00:00Z",
      updated_at: "2026-11-21T00:00:00Z",
    };

    mockState.insertHandler = async () => ({
      data: null,
      error: {
        code: "23505",
        message: 'duplicate key value violates unique constraint "transactions_pkey"',
        details: `Key (id)=(${payoutReceiptId}) already exists.`,
      },
    });

    mockState.selectSingleHandler = async () => ({
      data: committedReceipt,
      error: null,
    });

    // Payout receipt retry with same idempotency ID
    const res = await receivePayout(payoutId, 60000, "2026-11-21", payoutReceiptId);
    assertStrictEqual(res.id, payoutReceiptId);
    assertStrictEqual(res.payout_id, payoutId);
    assertStrictEqual(res.amount, "600.00");
  });

  console.log("\n=================================================");
  console.log(`Results: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);
  console.log("=================================================");

  if (failCount > 0) {
    const proc = (globalThis as unknown as { process?: { exit: (code: number) => void } }).process;
    proc?.exit(1);
  }
}

void runTests();
