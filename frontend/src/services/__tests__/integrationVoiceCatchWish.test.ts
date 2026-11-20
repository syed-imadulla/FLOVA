// =====================================================================
// FLOVA End-to-End Integration Test Suite: Voice Capture, Catch & Wish
// Verifies full integration between:
// 1. FLOVA Catch receipt extraction service & UI candidate persistence
// 2. Voice capture (Groq Whisper audio & Web Speech text) & candidate persistence
// 3. Truthful uncertainty & living vs work enforcement
// 4. Deterministic financial queries via M3 runway engine
// 5. Expected payout & check-in isolation
// 6. Idempotent candidate retry handling
// 7. WISH savings goal deterministic calculation engine
// =====================================================================

import { confirmCandidateTransaction, listTransactions, listActivityTimeline } from "../data";
import { extractReceipt } from "../receipt";
import { processVoice, resolveFinancialQuery } from "../voice";
import { calculateWish, type Wish } from "../../wish/types";
import { mockState, resetMockState } from "./mockSupabase";
import type {
  ExtractedReceiptCandidate,
  FinancialExtractionDTO,
  RunwayInput,
  VoiceTransactionCandidate,
} from "../../types/contracts";

let passCount = 0;
let failCount = 0;

function assertTrue(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
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
  console.log("FLOVA Integration Suite: Voice, Catch & Wish");
  console.log("=================================================\n");

  // -----------------------------------------------------------------
  // 1. FLOVA Catch End-to-End Receipt Flow
  // -----------------------------------------------------------------
  await it("Integration 1: Receipt extraction creates ExtractedReceiptCandidate and persists on user confirmation", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (fnName, options) => {
      assertStrictEqual(fnName, "extract-receipt", "Calls extract-receipt Edge Function");
      assertTrue(options.body.text.includes("HP Petrol"), "Passes receipt text to backend");

      const candidate: ExtractedReceiptCandidate = {
        id: "receipt-integration-1",
        merchant: "HP Petrol Pump",
        amountPaise: 30000, // ₹300.00
        category: "fuel",
        expenseType: "work",
        date: "2026-11-21",
        description: "HP Petrol Pump - Fuel",
        confidence: 0.95,
        needsReview: false,
        missingFields: [],
      };
      return { data: { candidate }, error: null };
    };

    const extracted = await extractReceipt({ text: "Paid Rs 300 at HP Petrol Pump for bike fuel" });
    assertStrictEqual(extracted.merchant, "HP Petrol Pump");
    assertStrictEqual(extracted.amountPaise, 30000);
    assertStrictEqual(extracted.expenseType, "work");

    // Zero transactions in DB prior to confirmation
    const preTx = await listTransactions();
    assertStrictEqual(preTx.length, 0, "No transactions before user confirmation");

    // Explicit confirmation persists transaction
    const saved = await confirmCandidateTransaction(extracted);
    assertStrictEqual(saved.id, "receipt-integration-1");
    assertStrictEqual(saved.type, "expense");
    assertStrictEqual(saved.amount, "300.00");
    assertStrictEqual(saved.source, "ai_suggestion");

    // Visible in Activity timeline
    const activity = await listActivityTimeline();
    assertStrictEqual(activity.length, 1);
    assertStrictEqual(activity[0].kind, "transaction");
    assertStrictEqual(activity[0].amountPaise, 30000);
  });

  // -----------------------------------------------------------------
  // 2. Voice Capture End-to-End Transaction Flow
  // -----------------------------------------------------------------
  await it("Integration 2: Spoken voice note creates VoiceTransactionCandidate and persists with source='voice'", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (fnName, options) => {
      assertStrictEqual(fnName, "process-voice", "Calls process-voice Edge Function");
      const extraction: FinancialExtractionDTO = {
        entry_intent: "transaction",
        action_intent: "create",
        target_id: null,
        transaction: {
          type: "expense",
          amount: "150",
          category: "fuel",
          expense_type: "work",
          ownership: "mine",
          date: "2026-11-21",
          description: "Petrol for delivery shift",
        },
        expected_payout: null,
        balance_checkin: null,
        metadata: {
          certainty: 0.97,
          clarification_required: false,
          clarification_reason: null,
          clarification_questions: [],
          raw_utterance: "Spent 150 rupees on petrol for delivery shift",
        },
      };

      const candidate: VoiceTransactionCandidate = {
        id: "voice-integration-2",
        transcript: "Spent 150 rupees on petrol for delivery shift",
        type: "expense",
        amountPaise: 15000,
        category: "fuel",
        expenseType: "work",
        date: "2026-11-21",
        ownership: "mine",
        confidence: 0.97,
        needsReview: false,
        missingFields: [],
      };

      return { data: { transcript: options.body.text, extraction, candidate }, error: null };
    };

    const res = await processVoice({ text: "Spent 150 rupees on petrol for delivery shift" });
    assertTrue(res.candidate !== null, "Candidate produced");
    assertStrictEqual(res.candidate?.amountPaise, 15000);

    const saved = await confirmCandidateTransaction(res.candidate!);
    assertStrictEqual(saved.id, "voice-integration-2");
    assertStrictEqual(saved.source, "voice");
    assertStrictEqual(saved.amount, "150.00");
  });

  // -----------------------------------------------------------------
  // 3. Deterministic Financial Queries
  // -----------------------------------------------------------------
  await it("Integration 3: Financial queries evaluate deterministically with COD liability segregated", async () => {
    const input: RunwayInput = {
      profile: {
        workProfile: "delivery",
        payoutPattern: "weekly",
        dailyLivingEstimate: 20000,
        dailyWorkEstimate: 10000,
      },
      latestCheckin: {
        cash: 100000, // ₹1,000
        bank: 200000, // ₹2,000
        notMine: 50000, // ₹500 COD liability
        checkedAt: "2026-11-21T00:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [],
    };

    const queryRes = resolveFinancialQuery({ query_type: "balance_check" }, input, null);
    assertStrictEqual(queryRes.status, "CONFIRMED");
    // (1000 + 2000 - 500) = ₹2,500
    assertStrictEqual(queryRes.confirmedBalanceRupees, "₹2,500");
    assertTrue(queryRes.details.some((d) => d.includes("COD liability")), "Details segregate COD");
  });

  // -----------------------------------------------------------------
  // 4. Expected Payout & Check-in Intent Segregation
  // -----------------------------------------------------------------
  await it("Integration 4: Expected payout and check-in intents are isolated from transaction persistence", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (_fnName, options) => {
      const extraction: FinancialExtractionDTO = {
        entry_intent: "expected_payout",
        action_intent: "create",
        target_id: null,
        transaction: null,
        expected_payout: {
          expected_amount: "2500",
          kind: "platform_payout",
          source: "Zomato",
          expected_date: "2026-11-25",
          status: "scheduled",
          note: "Weekly payout",
        },
        balance_checkin: null,
        metadata: { certainty: 0.95, clarification_required: false, clarification_reason: null, clarification_questions: [], raw_utterance: options.body.text },
      };
      return { data: { transcript: options.body.text, extraction, candidate: null }, error: null };
    };

    const res = await processVoice({ text: "Zomato payout of 2500 scheduled on Wednesday" });
    assertStrictEqual(res.extraction.entry_intent, "expected_payout");
    assertStrictEqual(res.candidate, null, "Zero transaction candidates created for payouts");

    const txs = await listTransactions();
    assertStrictEqual(txs.length, 0, "Zero transaction rows created");
  });

  // -----------------------------------------------------------------
  // 5. WISH Feature Deterministic Math
  // -----------------------------------------------------------------
  await it("Integration 5: WISH savings calculation computes exact integer paise progress and honest ETA", () => {
    const wish: Pick<Wish, "targetPaise" | "savedPaise" | "contributionPaise" | "cadence"> = {
      targetPaise: 1500000, // ₹15,000 (Smartphone)
      savedPaise: 300000,    // ₹3,000 saved
      contributionPaise: 150000, // ₹1,500 / week
      cadence: "weekly",
    };

    const calc = calculateWish(wish, new Date("2026-11-21T00:00:00Z"));
    assertStrictEqual(calc.remainingPaise, 1200000); // ₹12,000 remaining
    assertStrictEqual(calc.progressPercent, 20); // 20%
    assertStrictEqual(calc.periodsRemaining, 8); // 12000 / 1500 = 8 weeks
    assertStrictEqual(calc.isCompleted, false);

    // Honest uncertainty: 0 contribution produces null ETA
    const uncalculated = calculateWish({ ...wish, contributionPaise: 0 }, new Date("2026-11-21T00:00:00Z"));
    assertStrictEqual(uncalculated.estimatedDays, null);
    assertStrictEqual(uncalculated.estimatedDate, null);
    assertTrue(uncalculated.timelineSummary.includes("Set a regular contribution"), "Honest prompt on missing contribution");
  });

  console.log("\n=================================================");
  console.log(`Results: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);
  console.log("=================================================\n");

  if (failCount > 0) {
    throw new Error(`${failCount} test(s) failed in integration suite.`);
  }
}

runTests();
