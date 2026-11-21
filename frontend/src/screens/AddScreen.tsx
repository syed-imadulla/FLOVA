// Add / Review — the single place a transaction is confirmed, whether it came from
// manual entry, a voice note or a receipt scan. The candidate id is fixed for the life of the
// screen, so pressing Confirm again after a network error never creates a duplicate.
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { emptyDraft, TransactionForm, type TxDraft, type TxSubmit } from "../app/TransactionForm";
import { categoryLabel } from "../app/categories";
import { useDataVersion } from "../data/DataVersionProvider";
import { formatINR } from "../lib/money";
import { addTransaction, confirmCandidateTransaction } from "../services/data";
import type { ExtractedReceiptCandidate, VoiceTransactionCandidate } from "../types/contracts";
import { Screen } from "../ui/kit";

export interface ReviewState {
  /** Omitted for a manual entry opened with pre-filled values (e.g. paying a bill). */
  origin?: "voice" | "receipt";
  candidateId?: string;
  draft: TxDraft;
  aiNote?: string;
  merchant?: string | null;
  transcript?: string;
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  throw new Error("This browser can't generate a secure id. Please update it.");
}

export function AddScreen() {
  const navigate = useNavigate();
  const { bump } = useDataVersion();
  const review = (useLocation().state as ReviewState | null) ?? null;
  const [candidateId] = useState<string>(() => review?.candidateId || newId());

  async function save(v: TxSubmit) {
    if (review?.origin === "receipt") {
      const c: ExtractedReceiptCandidate = {
        id: candidateId,
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
        id: candidateId,
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
        id: candidateId,
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
    navigate("/activity", { replace: true, state: { flash: `Saved ${formatINR(v.amountPaise)} ${what}.` } });
  }

  return (
    <Screen
      title={review?.origin ? "Review details" : "Add income or expense"}
      subtitle={review?.origin ? "Check and change anything before saving" : "Recorded only when you confirm"}
      back
    >
      <TransactionForm
        initial={review?.draft ?? emptyDraft("expense")}
        lockType={review?.origin === "receipt"}
        allowNotMine={review?.origin !== "receipt"}
        aiNote={review?.aiNote}
        onSubmit={save}
        onCancel={() => navigate(-1)}
        cancelLabel={review?.origin ? "Discard" : "Cancel"}
      />
    </Screen>
  );
}
