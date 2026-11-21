// =====================================================================
// FLOVA Voice Service (Owner: M1)
// Connects frontend to Supabase Edge Function 'process-voice'.
// Zero API keys in frontend code. Server-side Groq Whisper + Llama 3.3.
// Includes deterministic financial query resolution using M3 runway engine.
// Graceful fallback to local extraction if Edge Function is offline.
// =====================================================================

import { supabase } from "../lib/supabase";
import { formatINR, toPaise } from "../lib/money";
import { calculateConfirmedBalance } from "../engine/balance";
import { extractTransaction } from "../voice/extractTransaction";
import type {
  ExtractedQueryData,
  FinancialExtractionDTO,
  RunwayInput,
  VoiceTransactionCandidate,
} from "../types/contracts";
import type { ProcessedRunway } from "../runway/adapter";

export interface VoiceProcessInput {
  audioBlob?: Blob;
  mimeType?: string;
  text?: string;
  candidateId?: string;
  language?: string;
}

export interface VoiceProcessResult {
  transcript: string;
  extraction: FinancialExtractionDTO;
  candidate: VoiceTransactionCandidate | null;
  candidates?: VoiceTransactionCandidate[];
  stt_provider?: "indicconformer" | "whisper" | "manual_text";
  source: "edge_function" | "local_fallback";
}

export interface QueryResolutionResult {
  queryType: string;
  answer: string;
  details: string[];
  status: "CONFIRMED" | "INSUFFICIENT_INFORMATION" | "NO_DATA";
  confirmedBalanceRupees?: string | null;
  runwayDays?: number | null;
  shortfallDate?: string | null;
  shortfallAmountRupees?: string | null;
}

/**
 * Converts a Blob to a base64 Data URL string.
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  if (typeof FileReader !== "undefined") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        resolve(res);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(blob);
    });
  } else if (typeof blob.arrayBuffer === "function") {
    const arrayBuf = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = typeof btoa === "function" ? btoa(binary) : (globalThis as any).Buffer?.from(arrayBuf).toString("base64");
    return `data:${blob.type || "audio/webm"};base64,${b64}`;
  } else {
    throw new Error("No Blob conversion mechanism available in this runtime.");
  }
}

/**
 * Processes spoken audio or typed text via the secure 'process-voice' Edge Function.
 * If unconfigured or offline, gracefully falls back to local extraction pattern matching.
 */
export async function processVoice(input: VoiceProcessInput): Promise<VoiceProcessResult> {
  const candidateId = input.candidateId || (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `cand-${Date.now()}`);

  let audioBase64: string | undefined = undefined;
  if (input.audioBlob) {
    try {
      audioBase64 = await blobToBase64(input.audioBlob);
    } catch (err) {
      console.warn("Failed to convert audio blob to base64, proceeding with text fallback if available:", err);
    }
  }

  // 1. Attempt invocation via Supabase Edge Function
  if (audioBase64 || (input.text && input.text.trim())) {
    try {
      const { data, error } = await supabase.functions.invoke("process-voice", {
        body: {
          audioBase64,
          mimeType: input.mimeType || input.audioBlob?.type || "audio/webm",
          text: input.text?.trim(),
          candidateId,
          language: input.language,
        },
      });

      if (!error && data && data.extraction) {
        return {
          transcript: data.transcript || input.text || "",
          extraction: data.extraction,
          candidate: data.candidate || (data.candidates && data.candidates[0]) || null,
          candidates: data.candidates || (data.candidate ? [data.candidate] : undefined),
          stt_provider: data.stt_provider,
          source: "edge_function",
        };
      }
      if (error) {
        console.warn("Edge Function process-voice returned error, falling back to local extractor:", error.message || error);
      }
    } catch (err) {
      console.warn("Failed to call Edge Function process-voice, falling back to local extractor:", err);
    }
  }

  // 2. Graceful Local Fallback (ensures demo reliability under unstable network)
  const fallbackText = input.text?.trim() || "";
  const localDTO = extractTransaction(fallbackText, input.language);

  const localCandidates: VoiceTransactionCandidate[] = [];
  const localTxList = Array.isArray(localDTO.transactions) && localDTO.transactions.length > 0
    ? localDTO.transactions
    : localDTO.transaction ? [localDTO.transaction] : [];

  if (localDTO.entry_intent === "transaction" && localTxList.length > 0) {
    for (let i = 0; i < localTxList.length; i++) {
      const tx = localTxList[i];
      let amountPaise: number | null = null;
      if (tx.amount) {
        try {
          amountPaise = toPaise(tx.amount);
        } catch {
          amountPaise = null;
        }
      }

      const missingFields: string[] = [];
      if (amountPaise === null) missingFields.push("amount");
      if (!tx.type) missingFields.push("type");
      if (tx.type === "expense" && (!tx.ownership || tx.ownership === "mine") && !tx.expense_type) {
        missingFields.push("expenseType");
      }

      const candId =
        i === 0
          ? candidateId
          : typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${candidateId}-${i}`;

      localCandidates.push({
        id: candId,
        transcript: fallbackText,
        type: tx.type,
        amountPaise,
        category: tx.category || (tx.type === "income" ? "earnings" : "other"),
        expenseType: tx.expense_type,
        date: tx.date,
        ownership: tx.ownership || "mine",
        confidence: localDTO.metadata.certainty,
        needsReview: missingFields.length > 0 || localDTO.metadata.clarification_required,
        missingFields,
      });
    }
  }

  return {
    transcript: fallbackText,
    extraction: localDTO,
    candidate: localCandidates[0] || null,
    candidates: localCandidates.length > 0 ? localCandidates : undefined,
    source: "local_fallback",
  };
}

/**
 * Deterministically resolves natural language financial queries using authenticated
 * database inputs and the M3 deterministic runway engine.
 * The LLM only classifies the intent; balance calculations and shortfall checks are 100% deterministic.
 */
export function resolveFinancialQuery(
  query: ExtractedQueryData,
  runwayInput: RunwayInput | null,
  processedRunway: ProcessedRunway | null
): QueryResolutionResult {
  const queryType = query.query_type || "general";

  if (!runwayInput || !runwayInput.latestCheckin) {
    return {
      queryType,
      status: "INSUFFICIENT_INFORMATION",
      answer: "No balance check-in found. Please complete a balance check-in first to verify your cash in hand and bank balance.",
      details: ["A verified check-in baseline is required before calculating balances or runway."],
    };
  }

  // 1. Calculate confirmed balance deterministically via M3 balance engine
  const balanceResult = calculateConfirmedBalance(runwayInput);
  const confirmedBalancePaise = balanceResult.confirmedBalancePaise;
  const confirmedRupees = confirmedBalancePaise !== null ? formatINR(confirmedBalancePaise) : null;

  // 2. Query: Balance Check
  if (queryType === "balance_check") {
    if (balanceResult.status !== "CONFIRMED" || confirmedBalancePaise === null) {
      return {
        queryType,
        status: "INSUFFICIENT_INFORMATION",
        answer: "Your confirmed balance cannot be determined accurately.",
        details: [balanceResult.reason || "Missing baseline data."],
      };
    }

    const starting = balanceResult.breakdown?.startingPersonalPaise ?? 0;
    const income = balanceResult.breakdown?.confirmedIncomePaise ?? 0;
    const expenses = balanceResult.breakdown?.confirmedExpensePaise ?? 0;
    const custodial = balanceResult.custodialOwedPaise ?? 0;

    const details = [
      `Starting personal baseline: ${formatINR(starting)}`,
      `Confirmed income added: +${formatINR(income)}`,
      `Confirmed expenses deducted: -${formatINR(expenses)}`,
    ];

    if (custodial > 0) {
      details.push(`Custodial COD liability owed to platform: ${formatINR(custodial)} (segregated, not included in personal balance)`);
    }

    return {
      queryType,
      status: "CONFIRMED",
      answer: `Your current confirmed personal liquid balance is ${confirmedRupees}.`,
      details,
      confirmedBalanceRupees: confirmedRupees,
    };
  }

  // 3. Query: Runway or Shortfall Check
  if (queryType === "runway_check") {
    if (!processedRunway || processedRunway.status !== "PROJECTED") {
      const missing = processedRunway?.missingInputs.join(", ") || "daily living/work estimates";
      return {
        queryType,
        status: "INSUFFICIENT_INFORMATION",
        answer: `Cannot compute daily runway. Missing essential baseline: ${missing}.`,
        details: ["Both daily living estimate and daily work estimate are required for deterministic cash runway projections."],
      };
    }

    const runwayDays = processedRunway.runwayDays;
    const shortfallDate = processedRunway.firstShortfallDate;

    let answer = "";
    const details: string[] = [
      `Confirmed personal balance: ${confirmedRupees}`,
      `Daily essential baseline: ${formatINR(processedRunway.dailyEssentialExpensePaise ?? 0)}/day`,
    ];

    if (shortfallDate) {
      // Find projection on shortfall date
      const shortfallProj = processedRunway.projections.find((p) => p.date === shortfallDate);
      const shortfallPaise = shortfallProj ? Math.abs(shortfallProj.closingBalancePaise) : 0;
      const shortfallRupees = formatINR(shortfallPaise);

      answer = `You have ${runwayDays} days of confirmed runway. A projected shortfall of ${shortfallRupees} occurs on ${shortfallDate}.`;
      details.push(`First projected deficit date: ${shortfallDate}`);
      if (shortfallProj && shortfallProj.commitmentsApplied.length > 0) {
        const commNames = shortfallProj.commitmentsApplied.map((c) => `${c.title} (${formatINR(c.amount)})`).join(", ");
        details.push(`Commitments due on this date: ${commNames}`);
      }

      return {
        queryType,
        status: "CONFIRMED",
        answer,
        details,
        confirmedBalanceRupees: confirmedRupees,
        runwayDays,
        shortfallDate,
        shortfallAmountRupees: shortfallRupees,
      };
    } else {
      answer = `You have ${runwayDays}+ days of confirmed runway with no projected shortfall over the next 7 days.`;
      return {
        queryType,
        status: "CONFIRMED",
        answer,
        details,
        confirmedBalanceRupees: confirmedRupees,
        runwayDays,
      };
    }
  }

  // 4. Query: Payout Check
  if (queryType === "payout_check") {
    const activePayouts = runwayInput.payouts.filter((p) => p.status === "scheduled" || p.status === "estimated" || p.status === "unearned");
    if (activePayouts.length === 0) {
      return {
        queryType,
        status: "CONFIRMED",
        answer: "You have no upcoming platform payouts scheduled.",
        details: ["All previous payouts have been settled or no upcoming payouts are recorded."],
        confirmedBalanceRupees: confirmedRupees,
      };
    }

    const payoutList = activePayouts
      .map((p) => `${formatINR(p.expected)} from ${p.kind}${p.expectedDate ? ` expected on ${p.expectedDate}` : ""}`)
      .join("; ");

    return {
      queryType,
      status: "CONFIRMED",
      answer: `You have ${activePayouts.length} upcoming expected payout(s): ${payoutList}.`,
      details: [
        "Expected payouts are forward-looking and do not modify your current confirmed balance until received.",
      ],
      confirmedBalanceRupees: confirmedRupees,
    };
  }

  // 5. Query: Commitment / Bill Check
  if (queryType === "commitment_check") {
    const upcoming = runwayInput.commitments;
    if (upcoming.length === 0) {
      return {
        queryType,
        status: "CONFIRMED",
        answer: "You have no upcoming commitments or bills scheduled.",
        details: ["Zero upcoming commitments recorded."],
        confirmedBalanceRupees: confirmedRupees,
      };
    }

    const commList = upcoming
      .map((c) => `${c.title}: ${formatINR(c.amount)} due ${c.dueDate}`)
      .join("; ");

    return {
      queryType,
      status: "CONFIRMED",
      answer: `Upcoming commitments: ${commList}.`,
      details: ["Commitments are deducted on their due dates in the daily runway projection."],
      confirmedBalanceRupees: confirmedRupees,
    };
  }

  // 6. General Overview
  return {
    queryType: "general",
    status: "CONFIRMED",
    answer: `Confirmed balance: ${confirmedRupees}. ${processedRunway?.runwayDays !== null ? `${processedRunway?.runwayDays} days of runway.` : ""}`,
    details: [
      `Confirmed balance: ${confirmedRupees}`,
      `Upcoming commitments: ${runwayInput.commitments.length}`,
      `Scheduled payouts: ${runwayInput.payouts.filter((p) => p.status === "scheduled").length}`,
    ],
    confirmedBalanceRupees: confirmedRupees,
    runwayDays: processedRunway?.runwayDays,
  };
}
