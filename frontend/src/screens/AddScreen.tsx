// Add / Review — the single place a transaction is confirmed, whether it came from
// manual entry, a voice note or a receipt scan. The candidate id is fixed for the life of the
// screen, so pressing Confirm again after a network error never creates a duplicate.
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { emptyDraft, TransactionForm, type TxDraft, type TxSubmit } from "../app/TransactionForm";
import { categoryLabel } from "../app/categories";
import { useDataVersion } from "../data/DataVersionProvider";
import { formatINR } from "../lib/money";
import { useProfile } from "../profile/useProfile";
import { addTransaction, confirmCandidateTransaction } from "../services/data";
import type { ExtractedReceiptCandidate, VoiceTransactionCandidate } from "../types/contracts";
import { Screen } from "../ui/kit";

export interface QueuedReviewCandidate {
  candidateId: string;
  draft: TxDraft;
  aiNote?: string;
  merchant?: string | null;
  transcript?: string;
}

export interface ReviewState {
  /** Omitted for a manual entry opened with pre-filled values (e.g. paying a bill). */
  origin?: "voice" | "receipt";
  candidateId?: string;
  draft: TxDraft;
  aiNote?: string;
  merchant?: string | null;
  transcript?: string;
  /** Queue of additional candidates to review sequentially (e.g. from multi-transaction voice utterances) */
  remainingCandidates?: QueuedReviewCandidate[];
  /** 1-based index and total count for multi-entry progress indication */
  queueIndex?: number;
  queueTotal?: number;
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  throw new Error("This browser can't generate a secure id. Please update it.");
}

export function AddScreen() {
  const navigate = useNavigate();
  const { bump } = useDataVersion();
  const { profile } = useProfile();
  const location = useLocation();
  const review = (location.state as ReviewState | null) ?? null;
  const [fallbackId] = useState<string>(() => newId());
  const activeCandidateId = review?.candidateId || fallbackId;

  async function save(v: TxSubmit) {
    if (review?.origin === "receipt") {
      const c: ExtractedReceiptCandidate = {
        id: activeCandidateId,
        merchant: review.merchant ?? null,
        amountPaise: v.amountPaise,
        category: v.category,
        expenseType: v.expenseType,
        date: v.date,
        description: v.note || null,
        ownership: "mine",
        needsReview: false,
        missingFields: [],
      };
      await confirmCandidateTransaction(c);
    } else if (review?.origin === "voice") {
      const c: VoiceTransactionCandidate = {
        id: activeCandidateId,
        transcript: review.transcript || "",
        description: v.note || review.transcript || null,
        type: v.type,
        amountPaise: v.amountPaise,
        category: v.category,
        expenseType: v.expenseType,
        date: v.date,
        ownership: v.ownership,
        needsReview: false,
        missingFields: [],
      };
      await confirmCandidateTransaction(c);
    } else {
      await addTransaction({
        id: activeCandidateId,
        type: v.type,
        amount: v.amountPaise,
        category: v.category,
        description: v.note || undefined,
        expenseType: v.expenseType ?? undefined,
        ownership: v.ownership,
        date: v.date,
        source: "manual",
      });
    }
    bump();
    const what = v.type === "income" ? "income" : `${categoryLabel(v.category).toLowerCase()} expense`;

    // Sequential review of remaining candidates in a multi-transaction capture
    if (review?.remainingCandidates && review.remainingCandidates.length > 0) {
      const [nextCandidate, ...rest] = review.remainingCandidates;
      const currentIdx = review.queueIndex ?? 1;
      const total = review.queueTotal ?? review.remainingCandidates.length + 1;
      navigate("/add", {
        replace: true,
        state: {
          origin: review.origin,
          candidateId: nextCandidate.candidateId,
          draft: nextCandidate.draft,
          aiNote: nextCandidate.aiNote ?? `Saved ${formatINR(v.amountPaise)}. Now reviewing transaction ${currentIdx + 1} of ${total}:`,
          transcript: nextCandidate.transcript ?? review.transcript,
          merchant: nextCandidate.merchant,
          remainingCandidates: rest,
          queueIndex: currentIdx + 1,
          queueTotal: total,
        } satisfies ReviewState,
      });
      return;
    }

    navigate("/activity", { replace: true, state: { flash: `Saved ${formatINR(v.amountPaise)} ${what}.` } });
  }

  const queueTotal = review?.queueTotal;
  const queueIndex = review?.queueIndex;
  const title = review?.origin
    ? queueTotal && queueTotal > 1
      ? `Review details (${queueIndex} of ${queueTotal})`
      : "Review details"
    : "Add income or expense";

  function handleCancel() {
    if (review?.remainingCandidates && review.remainingCandidates.length > 0) {
      const [nextCandidate, ...rest] = review.remainingCandidates;
      const currentIdx = review.queueIndex ?? 1;
      const total = review.queueTotal ?? review.remainingCandidates.length + 1;
      navigate("/add", {
        replace: true,
        state: {
          origin: review.origin,
          candidateId: nextCandidate.candidateId,
          draft: nextCandidate.draft,
          aiNote: nextCandidate.aiNote ?? `Discarded previous transaction. Now reviewing ${currentIdx + 1} of ${total}:`,
          transcript: nextCandidate.transcript ?? review.transcript,
          merchant: nextCandidate.merchant,
          remainingCandidates: rest,
          queueIndex: currentIdx + 1,
          queueTotal: total,
        } satisfies ReviewState,
      });
    } else if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/app");
    }
  }

  return (
    <Screen
      title={title}
      subtitle={review?.origin ? "Check and change anything before saving" : "Recorded only when you confirm"}
      back
    >
      <TransactionForm
        key={activeCandidateId}
        initial={review?.draft ?? emptyDraft("expense")}
        lockType={review?.origin === "receipt"}
        allowNotMine={review?.origin !== "receipt"}
        aiNote={review?.aiNote}
        workProfile={profile?.work_profile}
        onSubmit={save}
        onCancel={handleCancel}
        cancelLabel={review?.origin ? (review?.remainingCandidates?.length ? "Skip" : "Discard") : "Cancel"}
      />
    </Screen>
  );
}
