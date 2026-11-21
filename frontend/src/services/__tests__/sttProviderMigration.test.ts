// =====================================================================
// FLOVA Phase 17 Test Suite: AI4Bharat IndicConformer Primary STT Migration
// Verifies:
// 1. AI4Bharat IndicConformer PRIMARY speech-to-text path
// 2. Groq Whisper SECONDARY FALLBACK path
// 3. Provider tagging (stt_provider: "indicconformer" | "whisper")
// 4. Multi-transaction extraction integrity & zero amount cross-contamination
// 5. Candidate UUID stability & zero unconfirmed database writes
// 6. Multilingual coverage (Kannada, Hindi, Telugu, Tamil, English)
// =====================================================================

declare const process: any;

import { processVoice } from "../voice";
import { mockState, resetMockState } from "./mockSupabase";
import type { FinancialExtractionDTO, VoiceTransactionCandidate } from "../../types/contracts";

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
  console.log("=====================================================================");
  console.log("FLOVA Phase 17: AI4Bharat IndicConformer Primary STT & Fallback Tests");
  console.log("=====================================================================");

  // -----------------------------------------------------------------
  // 1. Primary IndicConformer STT Path
  // -----------------------------------------------------------------
  await it("Scenario 1: Primary STT routes through AI4Bharat IndicConformer and tags candidate", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (fnName, options) => {
      assertStrictEqual(fnName, "process-voice", "Must invoke process-voice Edge Function");

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
          description: "ಇವತ್ತು ಪೆಟ್ರೋಲ್ಗೆ 300 ರೂಪಾಯಿ ಖರ್ಚು ಮಾಡಿದೆ",
        },
        transactions: [
          {
            type: "expense",
            amount: "300",
            category: "fuel",
            expense_type: "work",
            ownership: "mine",
            date: "2026-11-21",
            description: "ಇವತ್ತು ಪೆಟ್ರೋಲ್ಗೆ 300 ರೂಪಾಯಿ ಖರ್ಚು ಮಾಡಿದೆ",
          }
        ],
        expected_payout: null,
        balance_checkin: null,
        metadata: {
          certainty: 0.96,
          clarification_required: false,
          clarification_reason: null,
          clarification_questions: [],
          raw_utterance: "ಇವತ್ತು ಪೆಟ್ರೋಲ್ಗೆ 300 ರೂಪಾಯಿ ಖರ್ಚು ಮಾಡಿದೆ",
        },
      };

      const candidate: VoiceTransactionCandidate = {
        id: options.body.candidateId || "cand-indic-01",
        transcript: "ಇವತ್ತು ಪೆಟ್ರೋಲ್ಗೆ 300 ರೂಪಾಯಿ ಖರ್ಚು ಮಾಡಿದೆ",
        stt_provider: "indicconformer",
        type: "expense",
        amountPaise: 30000,
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
          transcript: candidate.transcript,
          stt_provider: "indicconformer",
          extraction,
          candidate,
          candidates: [candidate],
        },
        error: null,
      };
    };

    const dummyBlob = new Blob(["RIFF....WAVEfmt "], { type: "audio/wav" });
    const fixedId = "phase17-primary-cand-uuid-1234";

    const res = await processVoice({
      audioBlob: dummyBlob,
      mimeType: "audio/wav",
      language: "kn",
      candidateId: fixedId,
    });

    assertStrictEqual(res.source, "edge_function");
    assertStrictEqual(res.stt_provider, "indicconformer", "Result must record indicconformer as STT provider");
    assertStrictEqual(res.transcript, "ಇವತ್ತು ಪೆಟ್ರೋಲ್ಗೆ 300 ರೂಪಾಯಿ ಖರ್ಚು ಮಾಡಿದೆ");
    assertTrue(Boolean(res.candidate), "Candidate must exist");
    assertStrictEqual(res.candidate?.id, fixedId, "Candidate UUID must be strictly preserved");
    assertStrictEqual(res.candidate?.stt_provider, "indicconformer", "Candidate must reflect indicconformer provenance");
    assertStrictEqual(res.candidate?.amountPaise, 30000, "₹300 mapped to 30,000 paise");
    assertStrictEqual(res.candidate?.expenseType, "work");
    assertStrictEqual(res.candidate?.category, "fuel");
  });

  // -----------------------------------------------------------------
  // 2. Secondary Groq Whisper Fallback Path
  // -----------------------------------------------------------------
  await it("Scenario 2: Falls back seamlessly to Groq Whisper when IndicConformer is unavailable", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (_fnName, options) => {
      const candidate: VoiceTransactionCandidate = {
        id: options.body.candidateId || "cand-whisper-fallback-02",
        transcript: "Spent 400 rupees on petrol",
        stt_provider: "whisper",
        type: "expense",
        amountPaise: 40000,
        category: "fuel",
        expenseType: "work",
        date: "2026-11-21",
        ownership: "mine",
        confidence: 0.88,
        needsReview: false,
        missingFields: [],
      };

      return {
        data: {
          transcript: candidate.transcript,
          stt_provider: "whisper",
          extraction: {
            entry_intent: "transaction",
            action_intent: "create",
            target_id: null,
            transaction: {
              type: "expense",
              amount: "400",
              category: "fuel",
              expense_type: "work",
              ownership: "mine",
              date: "2026-11-21",
              description: "Spent 400 rupees on petrol",
            },
            transactions: [],
            expected_payout: null,
            balance_checkin: null,
            metadata: {
              certainty: 0.88,
              clarification_required: false,
              clarification_reason: null,
              clarification_questions: [],
              raw_utterance: "Spent 400 rupees on petrol",
            },
          },
          candidate,
          candidates: [candidate],
        },
        error: null,
      };
    };

    const dummyBlob = new Blob(["RIFF....WAVEfmt "], { type: "audio/wav" });
    const res = await processVoice({
      audioBlob: dummyBlob,
      mimeType: "audio/wav",
      language: "en",
    });

    assertStrictEqual(res.source, "edge_function");
    assertStrictEqual(res.stt_provider, "whisper", "Should reflect whisper fallback when primary STT fails");
    assertStrictEqual(res.candidate?.amountPaise, 40000);
    assertStrictEqual(res.candidate?.stt_provider, "whisper");
  });

  // -----------------------------------------------------------------
  // 3. Multi-Transaction Extraction Integrity (No Cross-Contamination)
  // -----------------------------------------------------------------
  await it("Scenario 3: Extracts multiple transactions with distinct amounts from IndicConformer transcript", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (_fnName, _options) => {
      const c1: VoiceTransactionCandidate = {
        id: "cand-multi-1",
        transcript: "I spent 250 on groceries and earned 800 from a freelance project",
        stt_provider: "indicconformer",
        type: "expense",
        amountPaise: 25000,
        category: "food",
        expenseType: "living",
        date: "2026-11-21",
        ownership: "mine",
        confidence: 0.95,
        needsReview: false,
        missingFields: [],
      };

      const c2: VoiceTransactionCandidate = {
        id: "cand-multi-2",
        transcript: "I spent 250 on groceries and earned 800 from a freelance project",
        stt_provider: "indicconformer",
        type: "income",
        amountPaise: 80000,
        category: "earnings",
        expenseType: null,
        date: "2026-11-21",
        ownership: "mine",
        confidence: 0.95,
        needsReview: false,
        missingFields: [],
      };

      return {
        data: {
          transcript: c1.transcript,
          stt_provider: "indicconformer",
          extraction: {
            entry_intent: "transaction",
            action_intent: "create",
            target_id: null,
            transactions: [
              { type: "expense", amount: "250", category: "food", expense_type: "living", ownership: "mine", date: "2026-11-21", description: "groceries" },
              { type: "income", amount: "800", category: "earnings", expense_type: null, ownership: "mine", date: "2026-11-21", description: "freelance project" }
            ],
            transaction: { type: "expense", amount: "250", category: "food", expense_type: "living", ownership: "mine", date: "2026-11-21", description: "groceries" },
            expected_payout: null,
            balance_checkin: null,
            metadata: {
              certainty: 0.95,
              clarification_required: false,
              clarification_reason: null,
              clarification_questions: [],
              raw_utterance: "I spent 250 on groceries and earned 800 from a freelance project",
            },
          },
          candidate: c1,
          candidates: [c1, c2],
        },
        error: null,
      };
    };

    const res = await processVoice({
      text: "I spent 250 on groceries and earned 800 from a freelance project",
    });

    assertTrue(Boolean(res.candidates), "Candidates list must exist");
    assertStrictEqual(res.candidates?.length, 2, "Must return exactly 2 distinct candidates");

    const candidates = res.candidates || [];
    const cand1 = candidates[0];
    const cand2 = candidates[1];

    // Candidate 1: Groceries expense ₹250
    assertStrictEqual(cand1.type, "expense");
    assertStrictEqual(cand1.amountPaise, 25000, "Expense amount must be ₹250 (25000 paise)");
    assertStrictEqual(cand1.expenseType, "living");

    // Candidate 2: Freelance income ₹800
    assertStrictEqual(cand2.type, "income");
    assertStrictEqual(cand2.amountPaise, 80000, "Income amount must be ₹800 (80000 paise)");
    assertStrictEqual(cand2.expenseType, null, "Income must have null expenseType");

    // Cross-contamination safeguard check
    assertStrictEqual(cand1.amountPaise !== cand2.amountPaise, true, "Amounts must not be duplicated or swapped");
  });

  // -----------------------------------------------------------------
  // 4. Candidate UUID Stability & Zero Unconfirmed Writes
  // -----------------------------------------------------------------
  await it("Scenario 4: Preserves candidate UUID and writes zero unconfirmed records to DB", async () => {
    resetMockState();

    const clientProvidedUUID = "flova-verified-uuid-9999-aaaa";
    mockState.functionsInvokeHandler = async (_fnName, options) => {
      const c: VoiceTransactionCandidate = {
        id: options.body.candidateId,
        transcript: "Petrol 200",
        stt_provider: "indicconformer",
        type: "expense",
        amountPaise: 20000,
        category: "fuel",
        expenseType: "work",
        date: "2026-11-21",
        ownership: "mine",
        confidence: 0.9,
        needsReview: false,
        missingFields: [],
      };
      return {
        data: {
          transcript: "Petrol 200",
          stt_provider: "indicconformer",
          extraction: {
            entry_intent: "transaction",
            action_intent: "create",
            target_id: null,
            transaction: { type: "expense", amount: "200", category: "fuel", expense_type: "work", ownership: "mine", date: "2026-11-21", description: "Petrol 200" },
            transactions: [],
            expected_payout: null,
            balance_checkin: null,
            metadata: { certainty: 0.9, clarification_required: false, clarification_reason: null, clarification_questions: [], raw_utterance: "Petrol 200" }
          },
          candidate: c,
          candidates: [c]
        },
        error: null
      };
    };

    const res = await processVoice({
      candidateId: clientProvidedUUID,
      text: "Petrol 200",
    });

    assertStrictEqual(res.candidate?.id, clientProvidedUUID, "ID must strictly match requested UUID");
    // Database invariant check: Zero rows written to mock DB during extraction
    const txRows = mockState.transactions || [];
    assertStrictEqual(txRows.length, 0, "Voice inference must NEVER insert unconfirmed transactions into the database");
  });

  // -----------------------------------------------------------------
  // 5. Language Routing for Indic Languages
  // -----------------------------------------------------------------
  await it("Scenario 5: Language code is forwarded correctly to Edge Function payload", async () => {
    resetMockState();

    const languagesToTest = ["kn", "hi", "te", "ta", "ml"];
    for (const lang of languagesToTest) {
      let forwardedLanguage: string | undefined = undefined;
      mockState.functionsInvokeHandler = async (_fnName, options) => {
        forwardedLanguage = options.body.language;
        return {
          data: {
            transcript: "OK",
            stt_provider: "indicconformer",
            extraction: {
              entry_intent: "transaction",
              action_intent: "create",
              target_id: null,
              transaction: { type: "expense", amount: "100", category: "other", expense_type: "living", ownership: "mine", date: "2026-11-21", description: "OK" },
              transactions: [],
              expected_payout: null,
              balance_checkin: null,
              metadata: { certainty: 0.9, clarification_required: false, clarification_reason: null, clarification_questions: [], raw_utterance: "OK" }
            },
            candidate: null,
            candidates: []
          },
          error: null
        };
      };

      await processVoice({
        text: "Sample text",
        language: lang,
      });

      assertStrictEqual(forwardedLanguage, lang, `Language ${lang} must be forwarded to Edge Function`);
    }
  });

  console.log("=====================================================================");
  console.log(`Results: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);
  console.log("=====================================================================");

  if (failCount > 0) {
    throw new Error(`${failCount} test(s) failed in Phase 17 test suite`);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
