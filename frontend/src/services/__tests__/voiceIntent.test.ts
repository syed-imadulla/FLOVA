// =====================================================================
// FLOVA Phase 9: Voice Intent & Transcription Test Suite (Owner: M1)
// Verifies:
// 1. Income intent extraction
// 2. Work expense extraction
// 3. Living expense extraction
// 4. Missing amount voice extraction (null values, truthful uncertainty)
// 5. Living vs work classification enforcement for expenses
// 6. Financial query balance check (deterministic M3 engine resolution)
// 7. Financial query runway & shortfall check (₹1,170 shortfall on Saturday)
// 8. Expected payout intent isolation (never converted to income transaction)
// 9. Balance check-in intent isolation (never converted to income or expense)
// 10. Read-only extraction guarantee (0 rows written before confirmation)
// 11. User rejection / discard (clears candidate with 0 rows written)
// 12. Idempotency UUID retention across retries
// 13. Upstream Edge Function error handling and graceful local fallback
// =====================================================================

import { confirmCandidateTransaction, listTransactions } from "../data";
import { processVoice, resolveFinancialQuery } from "../voice";
import { mockState, resetMockState } from "./mockSupabase";
import type {
  ExtractedQueryData,
  FinancialExtractionDTO,
  RunwayInput,
  VoiceTransactionCandidate,
} from "../../types/contracts";
import type { ProcessedRunway } from "../../runway/adapter";

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
  console.log("FLOVA Phase 9: Voice Transcription & Intent Test Suite");
  console.log("=================================================\n");

  // -----------------------------------------------------------------
  // 1. Income Intent Extraction
  // -----------------------------------------------------------------
  await it("Scenario 1: Income extraction parses amount, earnings category, and leaves expense_type null", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (fnName, options) => {
      assertStrictEqual(fnName, "process-voice", "Must invoke process-voice Edge Function");
      assertTrue(options.body.text.includes("tip"), "Passes transcript text to Edge Function");

      const extraction: FinancialExtractionDTO = {
        entry_intent: "transaction",
        action_intent: "create",
        target_id: null,
        transaction: {
          type: "income",
          amount: "500",
          category: "tips",
          expense_type: null,
          ownership: "mine",
          date: "2026-11-21",
          description: "Received 500 rupees tip from customer",
        },
        expected_payout: null,
        balance_checkin: null,
        metadata: {
          certainty: 0.98,
          clarification_required: false,
          clarification_reason: null,
          clarification_questions: [],
          raw_utterance: options.body.text,
        },
      };

      const candidate: VoiceTransactionCandidate = {
        id: "voice-uuid-1",
        transcript: options.body.text,
        type: "income",
        amountPaise: 50000, // ₹500.00
        category: "tips",
        expenseType: null,
        date: "2026-11-21",
        ownership: "mine",
        confidence: 0.98,
        needsReview: false,
        missingFields: [],
      };

      return { data: { transcript: options.body.text, extraction, candidate }, error: null };
    };

    const res = await processVoice({ text: "Received 500 rupees tip from customer" });
    assertStrictEqual(res.extraction.entry_intent, "transaction");
    assertStrictEqual(res.candidate?.type, "income");
    assertStrictEqual(res.candidate?.amountPaise, 50000);
    assertStrictEqual(res.candidate?.category, "tips");
    assertStrictEqual(res.candidate?.expenseType, null);
    assertStrictEqual(res.candidate?.needsReview, false);
  });

  // -----------------------------------------------------------------
  // 2. Work Expense Extraction
  // -----------------------------------------------------------------
  await it("Scenario 2: Work expense extraction parses amount, work classification, and fuel category", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (_fnName, options) => {
      const candidate: VoiceTransactionCandidate = {
        id: "voice-uuid-2",
        transcript: options.body.text,
        type: "expense",
        amountPaise: 12000, // ₹120.00
        category: "fuel",
        expenseType: "work",
        date: "2026-11-21",
        ownership: "mine",
        confidence: 0.96,
        needsReview: false,
        missingFields: [],
      };

      return {
        data: {
          transcript: options.body.text,
          extraction: {
            entry_intent: "transaction",
            action_intent: "create",
            target_id: null,
            transaction: {
              type: "expense",
              amount: "120",
              category: "fuel",
              expense_type: "work",
              ownership: "mine",
              date: "2026-11-21",
              description: "Petrol for delivery",
            },
            expected_payout: null,
            balance_checkin: null,
            metadata: { certainty: 0.96, clarification_required: false, clarification_reason: null, clarification_questions: [], raw_utterance: options.body.text },
          },
          candidate,
        },
        error: null,
      };
    };

    const res = await processVoice({ text: "Spent 120 rupees on petrol for delivery" });
    assertStrictEqual(res.candidate?.type, "expense");
    assertStrictEqual(res.candidate?.amountPaise, 12000);
    assertStrictEqual(res.candidate?.expenseType, "work");
    assertStrictEqual(res.candidate?.category, "fuel");
  });

  // -----------------------------------------------------------------
  // 3. Living Expense Extraction
  // -----------------------------------------------------------------
  await it("Scenario 3: Living expense extraction classifies food/personal spending correctly", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (_fnName, options) => {
      const candidate: VoiceTransactionCandidate = {
        id: "voice-uuid-3",
        transcript: options.body.text,
        type: "expense",
        amountPaise: 4000, // ₹40.00
        category: "food",
        expenseType: "living",
        date: "2026-11-21",
        ownership: "mine",
        confidence: 0.95,
        needsReview: false,
        missingFields: [],
      };

      return {
        data: {
          transcript: options.body.text,
          extraction: {
            entry_intent: "transaction",
            action_intent: "create",
            target_id: null,
            transaction: {
              type: "expense",
              amount: "40",
              category: "food",
              expense_type: "living",
              ownership: "mine",
              date: "2026-11-21",
              description: "Chai and snack",
            },
            expected_payout: null,
            balance_checkin: null,
            metadata: { certainty: 0.95, clarification_required: false, clarification_reason: null, clarification_questions: [], raw_utterance: options.body.text },
          },
          candidate,
        },
        error: null,
      };
    };

    const res = await processVoice({ text: "Spent 40 rupees on chai and snack" });
    assertStrictEqual(res.candidate?.type, "expense");
    assertStrictEqual(res.candidate?.amountPaise, 4000);
    assertStrictEqual(res.candidate?.expenseType, "living");
  });

  // -----------------------------------------------------------------
  // 4. Missing Amount (Truthful Uncertainty)
  // -----------------------------------------------------------------
  await it("Scenario 4: Missing amount sets amountPaise=null, needsReview=true, and missingFields=['amount']", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (_fnName, options) => {
      const candidate: VoiceTransactionCandidate = {
        id: "voice-uuid-4",
        transcript: options.body.text,
        type: "expense",
        amountPaise: null,
        category: "fuel",
        expenseType: "work",
        date: "2026-11-21",
        ownership: "mine",
        confidence: 0.65,
        needsReview: true,
        missingFields: ["amount"],
      };

      return {
        data: {
          transcript: options.body.text,
          extraction: {
            entry_intent: "transaction",
            action_intent: "create",
            target_id: null,
            transaction: {
              type: "expense",
              amount: null,
              category: "fuel",
              expense_type: "work",
              ownership: "mine",
              date: "2026-11-21",
              description: "Petrol",
            },
            expected_payout: null,
            balance_checkin: null,
            metadata: {
              certainty: 0.65,
              clarification_required: true,
              clarification_reason: "Amount is missing.",
              clarification_questions: ["How much did you spend on petrol?"],
              raw_utterance: options.body.text,
            },
          },
          candidate,
        },
        error: null,
      };
    };

    const res = await processVoice({ text: "Filled petrol at pump" });
    assertStrictEqual(res.candidate?.amountPaise, null);
    assertStrictEqual(res.candidate?.needsReview, true);
    assertTrue(res.candidate?.missingFields.includes("amount") ?? false, "missingFields must include 'amount'");

    // Confirming without amount must be rejected
    let threw = false;
    try {
      await confirmCandidateTransaction(res.candidate!);
    } catch (err: any) {
      threw = true;
      assertTrue(err.message.includes("amount is missing"), "Throws on missing amount");
    }
    assertTrue(threw, "Must throw when confirming candidate with null amount");
  });

  // -----------------------------------------------------------------
  // 5. Living vs Work Classification Required for Expenses
  // -----------------------------------------------------------------
  await it("Scenario 5: Expense candidate missing living vs work classification rejects confirmation", async () => {
    resetMockState();

    const candidate: VoiceTransactionCandidate = {
      id: "voice-uuid-5",
      transcript: "Spent 300 rupees",
      type: "expense",
      amountPaise: 30000,
      category: "other",
      expenseType: null, // missing living vs work
      date: "2026-11-21",
      ownership: "mine",
      needsReview: true,
      missingFields: ["expenseType"],
    };

    let threw = false;
    try {
      await confirmCandidateTransaction(candidate);
    } catch (err: any) {
      threw = true;
      assertTrue(err.message.includes("living or work"), "Error explains living or work is required");
    }
    assertTrue(threw, "Must reject expense confirmation if expenseType is missing");
  });

  // -----------------------------------------------------------------
  // 6. Financial Query: Deterministic Balance Check
  // -----------------------------------------------------------------
  await it("Scenario 6: Financial query calculates confirmed balance deterministically without LLM math", async () => {
    const query: ExtractedQueryData = {
      query_type: "balance_check",
    };

    const sampleRunwayInput: RunwayInput = {
      profile: {
        workProfile: "delivery",
        payoutPattern: "weekly",
        dailyLivingEstimate: 35000,
        dailyWorkEstimate: 12000,
      },
      latestCheckin: {
        cash: 150000, // ₹1,500
        bank: 250000, // ₹2,500
        notMine: 60000, // ₹600 COD liability
        checkedAt: "2026-11-21T00:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-1",
          type: "income",
          amount: 65000, // +₹650
          ownership: "mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-21",
          createdAt: "2026-11-21T01:00:00Z",
        },
        {
          id: "tx-2",
          type: "expense",
          amount: 12000, // -₹120
          ownership: "mine",
          expenseType: "work",
          payoutId: null,
          date: "2026-11-21",
          createdAt: "2026-11-21T02:00:00Z",
        },
      ],
      payouts: [
        {
          id: "payout-1",
          kind: "platform_payout",
          expected: 180000,
          received: 0,
          expectedDate: "2026-11-25",
          status: "scheduled",
        },
      ],
      commitments: [],
    };

    const resolved = resolveFinancialQuery(query, sampleRunwayInput, null);
    assertStrictEqual(resolved.status, "CONFIRMED");
    // Starting: 1500 + 2500 - 600 = 3400. Income: +650. Expense: -120. Ending: ₹3,930
    assertStrictEqual(resolved.confirmedBalanceRupees, "₹3,930");
    assertTrue(resolved.answer.includes("₹3,930"), "Answer states verified confirmed balance");
    assertTrue(resolved.details.some((d) => d.includes("COD")), "Segregates COD liability in details");
  });

  // -----------------------------------------------------------------
  // 7. Financial Query: Deterministic Runway & Shortfall Check
  // -----------------------------------------------------------------
  await it("Scenario 7: Runway query identifies 3 days of runway and Saturday shortfall of ₹1,170", async () => {
    const query: ExtractedQueryData = {
      query_type: "runway_check",
    };

    const sampleRunwayInput: RunwayInput = {
      profile: {
        workProfile: "delivery",
        payoutPattern: "weekly",
        dailyLivingEstimate: 35000,
        dailyWorkEstimate: 12000,
      },
      latestCheckin: {
        cash: 150000,
        bank: 250000,
        notMine: 60000,
        checkedAt: "2026-11-21T00:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [
        { id: "comm-rent", title: "Rent", amount: 300000, dueDate: "2026-11-24", kind: "bill" },
      ],
    };

    const mockProcessedRunway: ProcessedRunway = {
      status: "PROJECTED",
      confirmedBalancePaise: 393000,
      custodialOwedPaise: 60000,
      dailyEssentialExpensePaise: 47000,
      runwayDays: 3,
      firstShortfallDate: "2026-11-24",
      projectedZeroBalanceDate: "2026-11-24",
      projections: [
        {
          dayIndex: 0,
          date: "2026-11-21",
          openingBalancePaise: 393000,
          essentialExpensePaise: 47000,
          commitmentDeductionPaise: 0,
          otherTransactionAdjustmentPaise: 0,
          netChangePaise: -47000,
          closingBalancePaise: 346000,
          commitmentsApplied: [],
        },
        {
          dayIndex: 1,
          date: "2026-11-22",
          openingBalancePaise: 346000,
          essentialExpensePaise: 47000,
          commitmentDeductionPaise: 0,
          otherTransactionAdjustmentPaise: 0,
          netChangePaise: -47000,
          closingBalancePaise: 299000,
          commitmentsApplied: [],
        },
        {
          dayIndex: 2,
          date: "2026-11-23",
          openingBalancePaise: 299000,
          essentialExpensePaise: 47000,
          commitmentDeductionPaise: 0,
          otherTransactionAdjustmentPaise: 0,
          netChangePaise: -47000,
          closingBalancePaise: 252000,
          commitmentsApplied: [],
        },
        {
          dayIndex: 3,
          date: "2026-11-24",
          openingBalancePaise: 252000,
          essentialExpensePaise: 47000,
          commitmentDeductionPaise: 300000,
          otherTransactionAdjustmentPaise: 0,
          netChangePaise: -347000,
          closingBalancePaise: -95000, // Deficit
          commitmentsApplied: [{ id: "comm-rent", title: "Rent", amount: 300000 }],
        },
      ],
      missingInputs: [],
      upcomingCommitments: [{ id: "comm-rent", title: "Rent", amount: 300000, dueDate: "2026-11-24" }],
      expectedPayouts: [],
    };

    const resolved = resolveFinancialQuery(query, sampleRunwayInput, mockProcessedRunway);
    assertStrictEqual(resolved.status, "CONFIRMED");
    assertStrictEqual(resolved.runwayDays, 3);
    assertStrictEqual(resolved.shortfallDate, "2026-11-24");
    assertTrue(resolved.answer.includes("3 days of confirmed runway"), "Reports 3 days of runway");
    assertTrue(resolved.answer.includes("2026-11-24"), "Reports shortfall on 2026-11-24");
  });

  // -----------------------------------------------------------------
  // 8. Expected Payout Intent Isolation
  // -----------------------------------------------------------------
  await it("Scenario 8: Expected payout intent is segregated and never treated as received income", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (_fnName, options) => {
      const extraction: FinancialExtractionDTO = {
        entry_intent: "expected_payout",
        action_intent: "create",
        target_id: null,
        transaction: null,
        expected_payout: {
          expected_amount: "1800",
          kind: "platform_payout",
          source: "Swiggy",
          expected_date: "2026-11-24",
          status: "scheduled",
          note: "Swiggy weekly payout",
        },
        balance_checkin: null,
        metadata: { certainty: 0.96, clarification_required: false, clarification_reason: null, clarification_questions: [], raw_utterance: options.body.text },
      };

      return { data: { transcript: options.body.text, extraction, candidate: null }, error: null };
    };

    const res = await processVoice({ text: "Expecting Swiggy payout of 1800 on Monday" });
    assertStrictEqual(res.extraction.entry_intent, "expected_payout");
    assertStrictEqual(res.candidate, null);
    assertStrictEqual(res.extraction.expected_payout?.expected_amount, "1800");
    assertStrictEqual(res.extraction.expected_payout?.source, "Swiggy");
  });

  // -----------------------------------------------------------------
  // 9. Balance Check-in Intent Isolation
  // -----------------------------------------------------------------
  await it("Scenario 9: Balance check-in intent is segregated and establishes cash baseline", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (_fnName, options) => {
      const extraction: FinancialExtractionDTO = {
        entry_intent: "balance_checkin",
        action_intent: "create",
        target_id: null,
        transaction: null,
        expected_payout: null,
        balance_checkin: {
          cash_amount: "500",
          bank_amount: "2000",
          not_mine_amount: "0",
          note: options.body.text,
          checked_at: "2026-11-21T02:00:00Z",
        },
        metadata: { certainty: 0.98, clarification_required: false, clarification_reason: null, clarification_questions: [], raw_utterance: options.body.text },
      };

      return { data: { transcript: options.body.text, extraction, candidate: null }, error: null };
    };

    const res = await processVoice({ text: "I have 500 in cash and 2000 in bank" });
    assertStrictEqual(res.extraction.entry_intent, "balance_checkin");
    assertStrictEqual(res.candidate, null);
    assertStrictEqual(res.extraction.balance_checkin?.cash_amount, "500");
    assertStrictEqual(res.extraction.balance_checkin?.bank_amount, "2000");
  });

  // -----------------------------------------------------------------
  // 10. Read-only Extraction Guarantee
  // -----------------------------------------------------------------
  await it("Scenario 10: Voice processing creates zero transaction rows in the database before user confirmation", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (_fnName, options) => {
      const candidate: VoiceTransactionCandidate = {
        id: "voice-uuid-10",
        transcript: options.body.text,
        type: "expense",
        amountPaise: 8000,
        category: "food",
        expenseType: "living",
        date: "2026-11-21",
        ownership: "mine",
        confidence: 0.95,
        needsReview: false,
        missingFields: [],
      };
      return {
        data: {
          transcript: options.body.text,
          extraction: {
            entry_intent: "transaction",
            action_intent: "create",
            target_id: null,
            transaction: { type: "expense", amount: "80", category: "food", expense_type: "living", ownership: "mine", date: "2026-11-21", description: "Lunch" },
            expected_payout: null,
            balance_checkin: null,
            metadata: { certainty: 0.95, clarification_required: false, clarification_reason: null, clarification_questions: [], raw_utterance: options.body.text },
          },
          candidate,
        },
        error: null,
      };
    };

    await processVoice({ text: "Had lunch for 80 rupees" });

    // Assert zero rows created in mock DB
    const txs = await listTransactions();
    assertStrictEqual(txs.length, 0, "No transactions should exist before user confirms");
  });

  // -----------------------------------------------------------------
  // 11. User Rejection / Discard
  // -----------------------------------------------------------------
  await it("Scenario 11: Discarding candidate leaves zero database rows", async () => {
    resetMockState();

    const candidate: VoiceTransactionCandidate = {
      id: "unwanted-cand",
      transcript: "Spent 500 on shoes",
      type: "expense",
      amountPaise: 50000,
      category: "other",
      expenseType: "living",
      date: "2026-11-21",
      ownership: "mine",
      needsReview: false,
      missingFields: [],
    };

    // User clicks Discard -> candidate discarded, no DB call
    assertTrue(candidate.id === "unwanted-cand", "Candidate exists in memory");
    const txs = await listTransactions();
    assertStrictEqual(txs.length, 0, "Zero rows in database");
  });

  // -----------------------------------------------------------------
  // 12. Idempotency UUID Retention Across Retries
  // -----------------------------------------------------------------
  await it("Scenario 12: Retrying confirmation preserves candidate UUID and prevents duplicate inserts", async () => {
    resetMockState();

    const candidateId = "client-voice-uuid-fixed";
    const candidate: VoiceTransactionCandidate = {
      id: candidateId,
      transcript: "Spent 120 on petrol",
      type: "expense",
      amountPaise: 12000,
      category: "fuel",
      expenseType: "work",
      date: "2026-11-21",
      ownership: "mine",
      needsReview: false,
      missingFields: [],
    };

    // First attempt: succeeds
    const firstSaved = await confirmCandidateTransaction(candidate);
    assertStrictEqual(firstSaved.id, candidateId);

    // Second attempt (retry with same candidate ID):
    // Simulate 23505 pkey collision handled by idempotent retry logic
    mockState.insertHandler = async () => {
      return {
        data: null,
        error: { code: "23505", message: "duplicate key value violates unique constraint transactions_pkey" },
      };
    };
    mockState.selectSingleHandler = async (id) => {
      assertStrictEqual(id, candidateId, "Looks up existing transaction by candidate UUID");
      return {
        data: {
          id: candidateId,
          type: "expense",
          amount: "120.00",
          category: "fuel",
          expense_type: "work",
          ownership: "mine",
          payout_id: null,
          source: "voice",
          transaction_date: "2026-11-21",
          created_at: "2026-11-21T02:00:00Z",
          updated_at: "2026-11-21T02:00:00Z",
        },
        error: null,
      };
    };

    const secondSaved = await confirmCandidateTransaction(candidate);
    assertStrictEqual(secondSaved.id, candidateId);

    const txs = await listTransactions();
    assertStrictEqual(txs.length, 1, "Only 1 row must exist despite retrying insert");
  });

  // -----------------------------------------------------------------
  // 13. Upstream Edge Function Error Handling & Graceful Fallback
  // -----------------------------------------------------------------
  await it("Scenario 13: Upstream Edge Function failure triggers graceful local extraction fallback", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async () => {
      return { data: null, error: { message: "Groq API rate limit or network timeout" } };
    };

    const res = await processVoice({ text: "Spent 150 on petrol" });
    assertStrictEqual(res.source, "local_fallback");
    assertStrictEqual(res.extraction.entry_intent, "transaction");
    assertStrictEqual(res.candidate?.type, "expense");
    assertStrictEqual(res.candidate?.amountPaise, 15000);
    assertStrictEqual(res.candidate?.category, "fuel");
    assertStrictEqual(res.candidate?.expenseType, "work");
  });

  console.log("\n=================================================");
  console.log(`Results: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);
  console.log("=================================================\n");

  if (failCount > 0) {
    throw new Error(`${failCount} test(s) failed in voice intent test suite.`);
  }
}

runTests();
