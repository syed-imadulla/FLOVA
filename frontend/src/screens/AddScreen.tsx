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
import { Notice, Screen } from "../ui/kit";

export interface QueuedReviewCandidate {
  candidateId: string;
  draft: TxDraft;
  aiNote?: string;
  merchant?: string | null;
  transcript?: string;
}

export interface ReviewState {
  /** Omitted for a manual entry opened with pre-filled values (e.g. paying a bill). */
  origin?: "voice" | "receipt" | "upi_screenshot" | "shared_upi";
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
  paymentStatus?: "successful" | "pending" | "failed" | "unknown";
  upiReference?: string | null;
  upiApp?: string | null;
  dateFallback?: boolean;
  extractedDate?: string | null;
  scannedAt?: string;
  duplicateWarning?: string | null;
  items?: Array<{ name: string; quantity?: number; price?: number }>;
  possibleTotals?: number[];
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
    if (review?.origin === "receipt" || review?.origin === "upi_screenshot" || review?.origin === "shared_upi") {
      const c: ExtractedReceiptCandidate = {
        id: activeCandidateId,
        merchant: review.merchant ?? null,
        amountPaise: v.amountPaise,
        type: v.type,
        category: v.category,
        expenseType: v.expenseType,
        date: v.date,
        description: v.note || null,
        ownership: v.ownership,
        needsReview: false,
        missingFields: [],
        kind: review.origin === "receipt" ? "physical_receipt" : "upi_screenshot",
        paymentStatus: review.paymentStatus,
        upiReference: review.upiReference ?? null,
        upiApp: review.upiApp ?? null,
        dateFallback: review.dateFallback,
        extractedDate: review.extractedDate ?? null,
        scannedAt: review.scannedAt,
        items: review.items,
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
      {review?.duplicateWarning && (
        <div className="mb-4">
          <Notice tone="warn" title="Possible Duplicate Payment">
            {review.duplicateWarning}
          </Notice>
        </div>
      )}

      {review?.paymentStatus === "pending" && (
        <div className="mb-4">
          <Notice tone="warn" title="Payment Pending Confirmation">
            This UPI transaction is currently marked pending. Check your bank or UPI app before saving.
          </Notice>
        </div>
      )}

      {review?.paymentStatus === "failed" && (
        <div className="mb-4">
          <Notice tone="danger" title="Payment Failed / Declined">
            This payment was not successful. If you confirm, it will still be recorded as a completed transaction.
          </Notice>
        </div>
      )}

      {review?.dateFallback && (
        <div className="mb-4">
          <Notice tone="info" title="Date Defaulted to Today">
            No clear transaction date was detected on the receipt, so today's date ({review.draft.date}) was used. You can change it below.
          </Notice>
        </div>
      )}

      {review?.items && review.items.length > 0 && (
        <div className="mb-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-3.5 text-xs">
          <p className="font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
            Detected Items ({review.items.length}):
          </p>
          <ul className="space-y-1">
            {review.items.map((it, idx) => (
              <li key={idx} className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                <span>{it.quantity && it.quantity > 1 ? `${it.quantity}x ` : ""}{it.name}</span>
                {it.price != null && (
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    {formatINR(it.price)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

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
