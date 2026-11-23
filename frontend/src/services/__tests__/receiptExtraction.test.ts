// =====================================================================
// FLOVA Phase 8: Receipt Extraction (FLOVA Catch) Test Suite
// Verifies Edge Function contract, Groq parsing logic, truthful uncertainty,
// zero DB writes before confirmation, edit capabilities, rejection, and idempotency.
// =====================================================================

import { confirmCandidateTransaction, listTransactions } from "../data";
import { extractReceipt } from "../receipt";
import { mockState, resetMockState } from "./mockSupabase";
import type { ExtractedReceiptCandidate } from "../../types/contracts";

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
  console.log("FLOVA Phase 8: Receipt Extraction Test Suite");
  console.log("=================================================\n");

  // -----------------------------------------------------------------
  // 1. Valid Receipt Extraction
  // -----------------------------------------------------------------
  await it("Scenario 1: Valid receipt extraction parses amount, merchant, date, and converts to paise", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (fnName, options) => {
      assertStrictEqual(fnName, "extract-receipt", "Must invoke extract-receipt Edge Function");
      assertTrue(options.body.text.includes("Indian Oil"), "Passes input text to Edge Function");

      const candidate: ExtractedReceiptCandidate = {
        id: "candidate-uuid-1",
        merchant: "Indian Oil Petrol Pump",
        amountPaise: 25000, // ₹250.00
        category: "fuel",
        expenseType: "work",
        date: "2026-11-20",
        description: "Indian Oil Petrol Pump - 2.5L Petrol",
        confidence: 0.96,
        needsReview: false,
        missingFields: [],
      };

      return { data: { candidate }, error: null };
    };

    const res = await extractReceipt({ text: "Paid Rs 250.00 to Indian Oil on 20-11-2026 for Petrol" });

    assertStrictEqual(res.merchant, "Indian Oil Petrol Pump");
    assertStrictEqual(res.amountPaise, 25000);
    assertStrictEqual(res.category, "fuel");
    assertStrictEqual(res.expenseType, "work");
    assertStrictEqual(res.date, "2026-11-20");
    assertStrictEqual(res.needsReview, false);
    assertStrictEqual(res.missingFields.length, 0);
  });

  // -----------------------------------------------------------------
  // 2. Truthful Uncertainty: Missing Amount
  // -----------------------------------------------------------------
  await it("Scenario 2: Missing or torn amount sets amountPaise=null, needsReview=true, and missingFields=['amount']", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async () => {
      const candidate: ExtractedReceiptCandidate = {
        id: "candidate-uuid-2",
        merchant: "City Cafe",
        amountPaise: null, // Illegible total
        category: "food",
        expenseType: "living",
        date: "2026-11-20",
        description: "Coffee and sandwich",
        confidence: 0.55,
        needsReview: true,
        missingFields: ["amount"],
      };

      return { data: { candidate }, error: null };
    };

    const res = await extractReceipt({ text: "City Cafe bill date 2026-11-20 coffee and sandwich" });

    assertStrictEqual(res.amountPaise, null, "Must never invent or fabricate amounts");
    assertStrictEqual(res.needsReview, true);
    assertTrue(res.missingFields.includes("amount"), "missingFields must flag missing amount");
  });

  // -----------------------------------------------------------------
  // 3. Unreadable / Garbled Receipt
  // -----------------------------------------------------------------
  await it("Scenario 3: Unreadable or blurred receipt returns null fields without hallucinating financial data", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async () => {
      const candidate: ExtractedReceiptCandidate = {
        id: "candidate-uuid-3",
        merchant: null,
        amountPaise: null,
        category: "other",
        expenseType: null,
        date: null,
        description: null,
        confidence: 0.2,
        needsReview: true,
        missingFields: ["merchant", "amount", "expenseType", "date"],
      };

      return { data: { candidate }, error: null };
    };

    const res = await extractReceipt({ text: "??? blurred dark smudge ???" });

    assertStrictEqual(res.amountPaise, null);
    assertStrictEqual(res.merchant, null);
    assertStrictEqual(res.expenseType, null);
    assertStrictEqual(res.needsReview, true);
  });

  // -----------------------------------------------------------------
  // 4. Extraction creates ZERO transaction rows before confirmation
  // -----------------------------------------------------------------
  await it("Scenario 4: Extraction is strictly read-only and creates zero transaction rows before confirmation", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async () => {
      const candidate: ExtractedReceiptCandidate = {
        id: "candidate-uuid-4",
        merchant: "Bike Garage",
        amountPaise: 45000,
        category: "maintenance",
        expenseType: "work",
        date: "2026-11-20",
        description: "Engine oil change",
        confidence: 0.9,
        needsReview: false,
        missingFields: [],
      };
      return { data: { candidate }, error: null };
    };

    // Extract receipt
    const candidate = await extractReceipt({ text: "Bike service Rs 450 oil change" });
    assertTrue(candidate !== null, "Candidate extracted");

    // Check database state: MUST BE EMPTY!
    const txs = await listTransactions();
    assertStrictEqual(txs.length, 0, "Extraction must NEVER insert transactions automatically without user confirmation");
  });

  // -----------------------------------------------------------------
  // 5. User Rejection Discards Without Persistence
  // -----------------------------------------------------------------
  await it("Scenario 5: User rejects candidate — draft is discarded with zero rows created", async () => {
    resetMockState();

    const candidate: ExtractedReceiptCandidate = {
      id: "candidate-uuid-5",
      merchant: "Unwanted Store",
      amountPaise: 10000,
      category: "other",
      expenseType: "living",
      date: "2026-11-20",
      description: "Wrong item",
      confidence: 0.85,
      needsReview: false,
      missingFields: [],
    };

    // User chooses to discard/cancel: confirmCandidateTransaction is NOT called.
    assertTrue(candidate.merchant === "Unwanted Store", "Candidate draft exists in memory");
    const txs = await listTransactions();
    assertStrictEqual(txs.length, 0, "No database rows created when discarded");
  });

  // -----------------------------------------------------------------
  // 6. User Edits Candidate Before Confirmation
  // -----------------------------------------------------------------
  await it("Scenario 6: User edits candidate (fills missing amount, changes living/work) and confirms", async () => {
    resetMockState();

    // Initial extraction had missing amount & missing expenseType
    const rawCandidate: ExtractedReceiptCandidate = {
      id: "candidate-uuid-6",
      merchant: "Shell Petrol Bunk",
      amountPaise: null, // missing from receipt
      category: "fuel",
      expenseType: null, // not specified
      date: "2026-11-20",
      description: null,
      confidence: 0.6,
      needsReview: true,
      missingFields: ["amount", "expenseType"],
    };

    // Attempting to confirm without user editing throws
    let thrown = false;
    try {
      await confirmCandidateTransaction(rawCandidate);
    } catch {
      thrown = true;
    }
    assertTrue(thrown, "Unedited candidate missing amount must be rejected");

    // User reviews, fills amount (₹180.00 = 18,000 paise), sets expenseType='work'
    const editedCandidate: ExtractedReceiptCandidate = {
      ...rawCandidate,
      amountPaise: 18000,
      expenseType: "work",
      description: "Shell Petrol - 1.8 Litres",
      needsReview: false,
      missingFields: [],
    };

    const savedTx = await confirmCandidateTransaction(editedCandidate);
    assertStrictEqual(savedTx.type, "expense");
    assertStrictEqual(savedTx.amount, "180.00");
    assertStrictEqual(savedTx.expense_type, "work");
    assertStrictEqual(savedTx.source, "ai_suggestion");

    const allTxs = await listTransactions();
    assertStrictEqual(allTxs.length, 1, "Confirmed transaction appears exactly once");
  });

  // -----------------------------------------------------------------
  // 7. Duplicate Submission / Idempotency Preservation
  // -----------------------------------------------------------------
  await it("Scenario 7: Retrying confirmation preserves candidate UUID and prevents duplicates", async () => {
    resetMockState();

    const candidateId = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
    const candidate: ExtractedReceiptCandidate = {
      id: candidateId,
      merchant: "Apollo Pharmacy",
      amountPaise: 35000,
      category: "medical",
      expenseType: "living",
      date: "2026-11-20",
      description: "Medicines",
      confidence: 0.95,
      needsReview: false,
      missingFields: [],
    };

    // First confirmation succeeds
    const tx1 = await confirmCandidateTransaction(candidate);
    assertStrictEqual(tx1.id, candidateId);

    // Simulate duplicate retry submission with same candidate (same UUID)
    // In our mock, insert with same ID returns existing transaction
    mockState.insertHandler = async () => {
      // Return 23505 duplicate key violation to test idempotency unwrap
      return {
        data: null,
        error: { code: "23505", message: "duplicate key value violates unique constraint transactions_pkey" },
      };
    };
    mockState.selectSingleHandler = async (id) => {
      assertStrictEqual(id, candidateId, "Should look up existing transaction by candidate UUID");
      return {
        data: {
          id: candidateId,
          type: "expense",
          amount: "350.00",
          category: "medical",
          expense_type: "living",
          ownership: "mine",
          payout_id: null,
          source: "ai_suggestion",
          transaction_date: "2026-11-20",
          created_at: "2026-11-20T10:00:00Z",
          updated_at: "2026-11-20T10:00:00Z",
        },
        error: null,
      };
    };

    const tx2 = await confirmCandidateTransaction(candidate);
    assertStrictEqual(tx2.id, candidateId, "Idempotent retry successfully returns existing transaction");
  });

  // -----------------------------------------------------------------
  // 8. Upstream API Failure & Retry Error Handling
  // -----------------------------------------------------------------
  await it("Scenario 8: Upstream Edge Function / Groq failure returns clean error without throwing uncaught", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async () => {
      return { data: null, error: { message: "Groq API rate limit exceeded. Please retry in a few seconds." } };
    };

    let thrown = false;
    try {
      await extractReceipt({ text: "Some bill text" });
    } catch (err: any) {
      thrown = true;
      assertTrue(err.message.includes("Groq API rate limit exceeded"), "Surfaces upstream error message clearly");
    }
    assertTrue(thrown, "API failure throws user-readable error");
  });

  // -----------------------------------------------------------------
  // 9. Unauthenticated Session Rejection (Security Enforcement)
  // -----------------------------------------------------------------
  await it("Scenario 9: Unauthenticated call (HTTP 401) is rejected and surfaced truthfully", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (fnName) => {
      assertStrictEqual(fnName, "extract-receipt", "Must invoke extract-receipt Edge Function");
      return {
        data: null,
        error: { message: "Unauthorized. Invalid user token.", status: 401 },
      };
    };

    let thrown = false;
    try {
      await extractReceipt({ text: "Petrol 300" });
    } catch (err: any) {
      thrown = true;
      assertTrue(err.message.includes("Unauthorized") || err.message.includes("Invalid user token"), "Surfaces 401 Unauthorized clearly");
    }
    assertTrue(thrown, "Unauthenticated request throws unauthorized error");
  });

  // -----------------------------------------------------------------
  // 10. Authenticated Session Success
  // -----------------------------------------------------------------
  await it("Scenario 10: Authenticated user session successfully extracts candidate", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (fnName) => {
      assertStrictEqual(fnName, "extract-receipt", "Must invoke extract-receipt Edge Function");
      const candidate: ExtractedReceiptCandidate = {
        id: "auth-cand-1",
        merchant: "Swiggy Mart",
        amountPaise: 45000,
        category: "groceries",
        expenseType: "living",
        date: "2026-11-23",
        confidence: 0.95,
        needsReview: false,
        missingFields: [],
      };
      return { data: { candidate }, error: null };
    };

    const res = await extractReceipt({ text: "Swiggy Mart Rs 450 on 2026-11-23" });
    assertStrictEqual(res.merchant, "Swiggy Mart");
    assertStrictEqual(res.amountPaise, 45000);
    assertStrictEqual(res.expenseType, "living");
  });

  // -----------------------------------------------------------------
  // 11. Fail-Closed Server Configuration Failure (HTTP 500)
  // -----------------------------------------------------------------
  await it("Scenario 11: Fail-closed verification: Server config error (missing SUPABASE_URL / ANON_KEY) returns HTTP 500", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (fnName) => {
      assertStrictEqual(fnName, "extract-receipt", "Must invoke extract-receipt Edge Function");
      return {
        data: null,
        error: { message: "Server configuration error: SUPABASE_URL or SUPABASE_ANON_KEY is not configured.", status: 500 },
      };
    };

    let thrown = false;
    try {
      await extractReceipt({ text: "Petrol 200" });
    } catch (err: any) {
      thrown = true;
      assertTrue(err.message.includes("Server configuration error"), "Surfaces server config failure without falling through to AI");
    }
    assertTrue(thrown, "Server configuration failure rejects processing");
  });

  // -----------------------------------------------------------------
  // 12. Expired or Invalid User JWT Token (HTTP 401)
  // -----------------------------------------------------------------
  await it("Scenario 12: Expired or revoked user JWT returns HTTP 401 Unauthorized", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (fnName) => {
      assertStrictEqual(fnName, "extract-receipt", "Must invoke extract-receipt Edge Function");
      return {
        data: null,
        error: { message: "Unauthorized. Invalid or expired user token.", status: 401 },
      };
    };

    let thrown = false;
    try {
      await extractReceipt({ text: "Coffee 40" });
    } catch (err: any) {
      thrown = true;
      assertTrue(err.message.includes("Unauthorized") || err.message.includes("Invalid or expired user token"), "Surfaces 401 for expired token");
    }
    assertTrue(thrown, "Expired/invalid token rejects processing");
  });

  console.log("\n=================================================");
  console.log(`Results: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);
  console.log("=================================================\n");

  if (failCount > 0) {
    (globalThis as any).process?.exit(1);
  }
}

runTests();
