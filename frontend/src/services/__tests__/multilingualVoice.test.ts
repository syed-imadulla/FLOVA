// =====================================================================
// FLOVA Phase 9.1: Multilingual Voice & Intent Test Suite (Owner: M1)
// Verifies:
// 1. English work expense extraction ("I spent 300 rupees on petrol today")
// 2. Hindi work expense extraction ("आज पेट्रोल पर 300 रुपये खर्च किए।")
// 3. Kannada work expense extraction ("ಇವತ್ತು ಪೆಟ್ರೋಲ್ಗೆ 300 ರೂಪಾಯಿ ಖರ್ಚು ಮಾಡಿದೆ.")
// 4. Urdu work expense extraction ("آج پیٹرول پر 300 روپے خرچ کیے۔")
// 5. Telugu work expense extraction ("ఈరోజు పెట్రోల్ కోసం 300 రూపాయలు ఖర్చు చేశాను.")
// 6. Hindi living expense extraction ("चाय और समोसे पर 40 रुपये खर्च किए")
// 7. Kannada truthful uncertainty / missing amount ("ಪೆಟ್ರೋಲ್ ಹಾಕಿಸಿದೆ")
// 8. Telugu expected payout isolation ("సోమవారం స్విగ్గీ నుండి 1800 వస్తుంది")
// 9. Urdu balance check-in isolation ("میرے پاس نقد 500 اور بینک میں 2000 ہیں")
// 10. Multilingual financial queries across Indic languages
// 11. Code-switching / Hinglish extraction ("300 rupaye petrol ke liye diye")
// 12. Multilingual candidate confirmation with strict UUID idempotency
// =====================================================================

import { confirmCandidateTransaction, listTransactions } from "../data";
import { processVoice, resolveFinancialQuery } from "../voice";
import { mockState, resetMockState } from "./mockSupabase";
import type {
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
  console.log("FLOVA Phase 9.1: Multilingual Voice Test Suite");
  console.log("=================================================\n");

  // -----------------------------------------------------------------
  // 1. English Work Expense
  // -----------------------------------------------------------------
  await it("Scenario 1 [English]: Work expense parses ₹300, work, fuel", async () => {
    resetMockState();

    const result = await processVoice({
      text: "I spent 300 rupees on petrol today",
      language: "en",
    });

    assertStrictEqual(result.extraction.entry_intent, "transaction");
    assertStrictEqual(result.extraction.transaction?.amount, "300");
    assertStrictEqual(result.extraction.transaction?.type, "expense");
    assertStrictEqual(result.extraction.transaction?.expense_type, "work");
    assertStrictEqual(result.extraction.transaction?.category, "fuel");
    assertStrictEqual(result.candidate?.amountPaise, 30000);
    assertStrictEqual(result.candidate?.expenseType, "work");
    assertStrictEqual(result.candidate?.needsReview, false);
  });

  // -----------------------------------------------------------------
  // 2. Hindi Work Expense
  // -----------------------------------------------------------------
  await it("Scenario 2 [Hindi]: 'आज पेट्रोल पर 300 रुपये खर्च किए।' parses ₹300, work, fuel", async () => {
    resetMockState();

    const result = await processVoice({
      text: "आज पेट्रोल पर 300 रुपये खर्च किए।",
      language: "hi",
    });

    assertStrictEqual(result.extraction.entry_intent, "transaction");
    assertStrictEqual(result.extraction.transaction?.amount, "300");
    assertStrictEqual(result.extraction.transaction?.type, "expense");
    assertStrictEqual(result.extraction.transaction?.expense_type, "work");
    assertStrictEqual(result.extraction.transaction?.category, "fuel");
    assertStrictEqual(result.candidate?.amountPaise, 30000);
    assertStrictEqual(result.candidate?.expenseType, "work");
    assertStrictEqual(result.candidate?.needsReview, false);
  });

  // -----------------------------------------------------------------
  // 3. Kannada Work Expense
  // -----------------------------------------------------------------
  await it("Scenario 3 [Kannada]: 'ಇವತ್ತು ಪೆಟ್ರೋಲ್ಗೆ 300 ರೂಪಾಯಿ ಖರ್ಚು ಮಾಡಿದೆ.' parses ₹300, work, fuel", async () => {
    resetMockState();

    const result = await processVoice({
      text: "ಇವತ್ತು ಪೆಟ್ರೋಲ್ಗೆ 300 ರೂಪಾಯಿ ಖರ್ಚು ಮಾಡಿದೆ.",
      language: "kn",
    });

    assertStrictEqual(result.extraction.entry_intent, "transaction");
    assertStrictEqual(result.extraction.transaction?.amount, "300");
    assertStrictEqual(result.extraction.transaction?.type, "expense");
    assertStrictEqual(result.extraction.transaction?.expense_type, "work");
    assertStrictEqual(result.extraction.transaction?.category, "fuel");
    assertStrictEqual(result.candidate?.amountPaise, 30000);
    assertStrictEqual(result.candidate?.expenseType, "work");
    assertStrictEqual(result.candidate?.needsReview, false);
  });

  // -----------------------------------------------------------------
  // 4. Urdu Work Expense
  // -----------------------------------------------------------------
  await it("Scenario 4 [Urdu]: 'آج پیٹرول پر 300 روپے خرچ کیے۔' parses ₹300, work, fuel", async () => {
    resetMockState();

    const result = await processVoice({
      text: "آج پیٹرول پر 300 روپے خرچ کیے۔",
      language: "ur",
    });

    assertStrictEqual(result.extraction.entry_intent, "transaction");
    assertStrictEqual(result.extraction.transaction?.amount, "300");
    assertStrictEqual(result.extraction.transaction?.type, "expense");
    assertStrictEqual(result.extraction.transaction?.expense_type, "work");
    assertStrictEqual(result.extraction.transaction?.category, "fuel");
    assertStrictEqual(result.candidate?.amountPaise, 30000);
    assertStrictEqual(result.candidate?.expenseType, "work");
    assertStrictEqual(result.candidate?.needsReview, false);
  });

  // -----------------------------------------------------------------
  // 5. Telugu Work Expense
  // -----------------------------------------------------------------
  await it("Scenario 5 [Telugu]: 'ఈరోజు పెట్రోల్ కోసం 300 రూపాయలు ఖర్చు చేశాను.' parses ₹300, work, fuel", async () => {
    resetMockState();

    const result = await processVoice({
      text: "ఈరోజు పెట్రోల్ కోసం 300 రూపాయలు ఖర్చు చేశాను.",
      language: "te",
    });

    assertStrictEqual(result.extraction.entry_intent, "transaction");
    assertStrictEqual(result.extraction.transaction?.amount, "300");
    assertStrictEqual(result.extraction.transaction?.type, "expense");
    assertStrictEqual(result.extraction.transaction?.expense_type, "work");
    assertStrictEqual(result.extraction.transaction?.category, "fuel");
    assertStrictEqual(result.candidate?.amountPaise, 30000);
    assertStrictEqual(result.candidate?.expenseType, "work");
    assertStrictEqual(result.candidate?.needsReview, false);
  });

  // -----------------------------------------------------------------
  // 6. Hindi Living Expense
  // -----------------------------------------------------------------
  await it("Scenario 6 [Hindi]: 'चाय और समोसे पर 40 रुपये खर्च किए' parses ₹40, living, food", async () => {
    resetMockState();

    const result = await processVoice({
      text: "चाय और समोसे पर 40 रुपये खर्च किए",
      language: "hi",
    });

    assertStrictEqual(result.extraction.entry_intent, "transaction");
    assertStrictEqual(result.extraction.transaction?.amount, "40");
    assertStrictEqual(result.extraction.transaction?.type, "expense");
    assertStrictEqual(result.extraction.transaction?.expense_type, "living");
    assertStrictEqual(result.extraction.transaction?.category, "food");
    assertStrictEqual(result.candidate?.amountPaise, 4000);
    assertStrictEqual(result.candidate?.expenseType, "living");
  });

  // -----------------------------------------------------------------
  // 7. Kannada Missing Amount (Truthful Uncertainty)
  // -----------------------------------------------------------------
  await it("Scenario 7 [Kannada]: 'ಪೆಟ್ರೋಲ್ ಹಾಕಿಸಿದೆ' extracts null amount, needsReview=true", async () => {
    resetMockState();

    const result = await processVoice({
      text: "ಪೆಟ್ರೋಲ್ ಹಾಕಿಸಿದೆ",
      language: "kn",
    });

    assertStrictEqual(result.extraction.entry_intent, "transaction");
    assertStrictEqual(result.extraction.transaction?.amount, null);
    assertStrictEqual(result.extraction.transaction?.type, "expense");
    assertStrictEqual(result.extraction.transaction?.expense_type, "work");
    assertStrictEqual(result.extraction.transaction?.category, "fuel");
    assertStrictEqual(result.extraction.metadata.clarification_required, true);
    assertTrue(
      result.extraction.metadata.clarification_questions.some((q) => q.includes("amount") || q.includes("How much")),
      "Must have clarification question for missing amount"
    );
    assertStrictEqual(result.candidate?.amountPaise, null);
    assertStrictEqual(result.candidate?.needsReview, true);
    assertTrue(result.candidate!.missingFields.includes("amount"), "missingFields must include amount");
  });

  // -----------------------------------------------------------------
  // 8. Telugu Expected Payout Isolation
  // -----------------------------------------------------------------
  await it("Scenario 8 [Telugu]: 'సోమవారం స్విగ్గీ నుండి 1800 వస్తుంది' parses expected_payout, never income transaction", async () => {
    resetMockState();

    const result = await processVoice({
      text: "సోమవారం స్విగ్గీ నుండి 1800 వస్తుంది",
      language: "te",
    });

    assertStrictEqual(result.extraction.entry_intent, "expected_payout");
    assertStrictEqual(result.extraction.expected_payout?.expected_amount, "1800");
    assertStrictEqual(result.extraction.expected_payout?.source, "Swiggy");
    assertStrictEqual(result.candidate, null, "Expected payout MUST NEVER generate a transaction candidate");

    // Verify 0 transaction rows written
    const txs = await listTransactions();
    assertStrictEqual(txs.length, 0, "Zero transactions created in database");
  });

  // -----------------------------------------------------------------
  // 9. Urdu Balance Check-in Isolation
  // -----------------------------------------------------------------
  await it("Scenario 9 [Urdu]: 'میرے پاس نقد 500 اور بینک میں 2000 ہیں' parses balance_checkin", async () => {
    resetMockState();

    const result = await processVoice({
      text: "میرے پاس نقد 500 اور بینک میں 2000 ہیں",
      language: "ur",
    });

    assertStrictEqual(result.extraction.entry_intent, "balance_checkin");
    assertStrictEqual(result.extraction.balance_checkin?.cash_amount, "500");
    assertStrictEqual(result.extraction.balance_checkin?.bank_amount, "2000");
    assertStrictEqual(result.candidate, null, "Check-in MUST NEVER generate a transaction candidate");

    // Verify 0 transaction rows written
    const txs = await listTransactions();
    assertStrictEqual(txs.length, 0, "Zero transactions created in database");
  });

  // -----------------------------------------------------------------
  // 10. Multilingual Financial Queries
  // -----------------------------------------------------------------
  await it("Scenario 10 [Queries]: Hindi, Kannada, Urdu & Telugu queries resolve deterministically", async () => {
    resetMockState();

    const queries = [
      { text: "कितना पैसा बचा है?", lang: "hi" },
      { text: "ಎಷ್ಟು ದುಡ್ಡು ಉಳಿದಿದೆ?", lang: "kn" },
      { text: "کتنے پیسے بچے ہیں؟", lang: "ur" },
      { text: "ఎంత డబ్బు మిగిలి ఉంది?", lang: "te" },
    ];

    const mockRunwayInput: RunwayInput = {
      latestCheckin: {
        cash: 40000, // ₹400
        bank: 200000, // ₹2,000
        notMine: 0,
        checkedAt: "2026-11-21T06:00:00Z",
      },
      payouts: [],
      transactionsSinceCheckin: [],
      commitments: [],
      profile: {
        workProfile: "delivery",
        payoutPattern: "weekly",
        dailyLivingEstimate: 30000,
        dailyWorkEstimate: 15000,
      },
    };

    const mockProcessedRunway: ProcessedRunway = {
      status: "PROJECTED",
      confirmedBalancePaise: 240000, // ₹2,400
      custodialOwedPaise: null,
      dailyEssentialExpensePaise: 45000,
      firstShortfallDate: null,
      projectedZeroBalanceDate: null,
      runwayDays: 5,
      projections: [],
      missingInputs: [],
      upcomingCommitments: [],
      expectedPayouts: [],
    };

    for (const q of queries) {
      const result = await processVoice({ text: q.text, language: q.lang });
      assertStrictEqual(result.extraction.entry_intent, "financial_query");
      assertStrictEqual(result.extraction.financial_query?.query_type, "balance_check");
      assertStrictEqual(result.candidate, null);

      const resolution = resolveFinancialQuery(
        result.extraction.financial_query!,
        mockRunwayInput,
        mockProcessedRunway
      );

      assertStrictEqual(resolution.status, "CONFIRMED");
      assertStrictEqual(resolution.confirmedBalanceRupees, "₹2,400");
    }
  });

  // -----------------------------------------------------------------
  // 11. Hinglish / Code-Switching Extraction
  // -----------------------------------------------------------------
  await it("Scenario 11 [Code-switching]: '300 rupaye petrol ke liye diye' parses ₹300, work, fuel", async () => {
    resetMockState();

    const result = await processVoice({
      text: "300 rupaye petrol ke liye diye",
      language: "hi",
    });

    assertStrictEqual(result.extraction.entry_intent, "transaction");
    assertStrictEqual(result.extraction.transaction?.amount, "300");
    assertStrictEqual(result.extraction.transaction?.type, "expense");
    assertStrictEqual(result.extraction.transaction?.expense_type, "work");
    assertStrictEqual(result.extraction.transaction?.category, "fuel");
  });

  // -----------------------------------------------------------------
  // 12. Multilingual Confirmation & Idempotency
  // -----------------------------------------------------------------
  await it("Scenario 12 [Idempotency]: Candidate UUID preserved and confirmed without duplication", async () => {
    resetMockState();

    const fixedCandidateId = "c8b02da2-1b12-404d-bd16-9ad0c0ea9591";

    const result = await processVoice({
      text: "ಇವತ್ತು ಪೆಟ್ರೋಲ್ಗೆ 300 ರೂಪಾಯಿ ಖರ್ಚು ಮಾಡಿದೆ.",
      candidateId: fixedCandidateId,
      language: "kn",
    });

    assertTrue(result.candidate !== null, "Candidate must be created");
    assertStrictEqual(result.candidate!.id, fixedCandidateId, "Candidate preserves fixed UUID");

    // First confirmation
    const tx1 = await confirmCandidateTransaction(result.candidate!);

    assertStrictEqual(tx1.id, fixedCandidateId);
    assertStrictEqual(Number(tx1.amount), 300);
    assertStrictEqual(tx1.type, "expense");
    assertStrictEqual(tx1.expense_type, "work");

    // Second confirmation (retry with same UUID)
    const tx2 = await confirmCandidateTransaction(result.candidate!);

    assertStrictEqual(tx2.id, fixedCandidateId);

    // Verify exactly one row in DB
    const all = await listTransactions();
    assertStrictEqual(all.length, 1, "Exactly one transaction exists after idempotent retry");
    assertStrictEqual(all[0].id, fixedCandidateId);
  });

  // -----------------------------------------------------------------
  // 13. Edge Function Groq Whisper + Llama 3.3 Multilingual Flow
  // -----------------------------------------------------------------
  await it("Scenario 13 [Remote Edge Function]: Passes ISO-639-1 language to process-voice and maps candidate", async () => {
    resetMockState();

    let capturedPayload: any = null;
    mockState.functionsInvokeHandler = async (fnName, options) => {
      assertStrictEqual(fnName, "process-voice", "Must invoke process-voice Edge Function");
      capturedPayload = options.body;

      const extraction: FinancialExtractionDTO = {
        entry_intent: "transaction",
        action_intent: "create",
        target_id: null,
        transaction: {
          type: "expense",
          amount: "300",
          category: "fuel",
          expense_type: "work",
          ownership: "mine",
          date: "2026-11-21",
          description: "ಪೆಟ್ರೋಲ್ ಖರ್ಚು 300 ರೂಪಾಯಿ",
        },
        expected_payout: null,
        balance_checkin: null,
        metadata: {
          certainty: 0.98,
          clarification_required: false,
          clarification_reason: null,
          clarification_questions: [],
          raw_utterance: "ಇವತ್ತು ಪೆಟ್ರೋಲ್ಗೆ 300 ರೂಪಾಯಿ ಖರ್ಚು ಮಾಡಿದೆ.",
        },
      };

      const candidate: VoiceTransactionCandidate = {
        id: options.body.candidateId || "edge-cand-kn-1",
        transcript: "ಇವತ್ತು ಪೆಟ್ರೋಲ್ಗೆ 300 ರೂಪಾಯಿ ಖರ್ಚು ಮಾಡಿದೆ.",
        type: "expense",
        amountPaise: 30000,
        category: "fuel",
        expenseType: "work",
        date: "2026-11-21",
        ownership: "mine",
        confidence: 0.98,
        needsReview: false,
        missingFields: [],
      };

      return {
        data: {
          transcript: candidate.transcript,
          extraction,
          candidate,
        },
        error: null,
      };
    };

    const result = await processVoice({
      text: "ಇವತ್ತು ಪೆಟ್ರೋಲ್ಗೆ 300 ರೂಪಾಯಿ ಖರ್ಚು ಮಾಡಿದೆ.",
      language: "kn",
    });

    assertStrictEqual(result.source, "edge_function");
    assertStrictEqual(capturedPayload.language, "kn", "Passes language='kn' to Edge Function payload");
    assertStrictEqual(result.candidate?.amountPaise, 30000);
    assertStrictEqual(result.candidate?.expenseType, "work");
    assertStrictEqual(result.candidate?.category, "fuel");
  });

  console.log("\n=================================================");
  console.log(`Results: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);
  console.log("=================================================\n");

  if (failCount > 0) {
    throw new Error(`${failCount} test(s) failed in multilingual voice test suite.`);
  }
}

runTests();
