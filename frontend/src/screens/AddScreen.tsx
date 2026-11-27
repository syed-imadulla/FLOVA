// Add / Review — the single place a transaction is confirmed, whether it came from
// manual entry, a voice note or a receipt scan. The candidate id is fixed for the life of the
// screen, so pressing Confirm again after a network error never creates a duplicate.
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { emptyDraft, TransactionForm, type TxDraft, type TxSubmit } from "../app/TransactionForm";
import { categoryLabel, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../app/categories";
import { useDataVersion } from "../data/DataVersionProvider";
import { todayLocalISO } from "../data/dates";
import { formatINR } from "../lib/money";
import { useProfile } from "../profile/useProfile";
import { addTransaction, confirmCandidateTransaction } from "../services/data";
import { saveTransactionWithReceipt } from "../services/receiptStorage";
import { calculateBatchSummary } from "../engine/batchArithmetic";
import type { ExtractedReceiptCandidate, VoiceTransactionCandidate, ExpenseType, TransactionType } from "../types/contracts";
import { Button, Card, Notice, Screen, Segmented } from "../ui/kit";
import { IconTrash } from "../ui/icons";

export interface QueuedReviewCandidate {
  candidateId: string;
  draft: TxDraft;
  aiNote?: string;
  merchant?: string | null;
  transcript?: string;
}

export interface ReviewState {
  /** Omitted for a manual entry opened with pre-filled values (e.g. paying a bill). */
  origin?: "voice" | "receipt" | "upi_screenshot" | "shared_upi" | "batch_voice";
  candidateId?: string;
  receiptFile?: File;
  draft: TxDraft;
  aiNote?: string;
  merchant?: string | null;
  transcript?: string;
  /** Queue of additional candidates to review sequentially (e.g. from multi-transaction voice utterances) */
  remainingCandidates?: QueuedReviewCandidate[];
  /** Complete list of candidates for batch review together */
  batchCandidates?: VoiceTransactionCandidate[];
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
  subtotalPaise?: number | null;
  taxPaise?: number | null;
  discountPaise?: number | null;
  arithmeticDiscrepancy?: string | null;
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

  // Batch review state
  const [batchCandidates, setBatchCandidates] = useState<VoiceTransactionCandidate[]>(
    () => review?.batchCandidates || []
  );
  const [batchMode, setBatchMode] = useState<boolean>(
    () => !!review?.batchCandidates && review.batchCandidates.length > 1
  );
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  async function save(v: TxSubmit) {
    const persistCandidate = async (receiptPath: string | null) => {
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
          paymentMethod: v.paymentMethod ?? null,
          receiptPath,
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
          inflowCategory: v.inflowCategory,
          paymentMethod: v.paymentMethod,
          receiptPath,
          ownership: v.ownership,
          date: v.date,
          source: "manual",
        });
      }
    };

    if (review?.receiptFile) {
      await saveTransactionWithReceipt(review.receiptFile, activeCandidateId, persistCandidate);
    } else {
      await persistCandidate(null);
    }
    bump();
    const what = v.type === "income" ? "income" : `${categoryLabel(v.category, v.type).toLowerCase()} expense`;

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

  // Confirm all transactions in a batch
  async function confirmAllBatch() {
    if (batchCandidates.length === 0) return;
    setBatchSubmitting(true);
    setBatchError(null);

    try {
      for (const cand of batchCandidates) {
        const amountPaise = cand.amountPaise ?? cand.amount_paise ?? null;
        if (!amountPaise || amountPaise <= 0) {
          throw new Error(`Transaction "${cand.description || cand.category || "entry"}" is missing an amount.`);
        }
        if (!cand.type) {
          throw new Error(`Please choose whether "${cand.description || "entry"}" is income or expense.`);
        }
        if (cand.type === "expense" && (!cand.ownership || cand.ownership === "mine") && !cand.expenseType && !cand.expense_type) {
          throw new Error(`Please choose whether "${cand.description || "expense"}" is living or work.`);
        }

        await confirmCandidateTransaction({
          id: cand.id || cand.candidate_id || newId(),
          transcript: cand.transcript || review?.transcript || "",
          description: cand.description || null,
          type: cand.type,
          amountPaise,
          category: cand.category || (cand.type === "income" ? "earnings" : "other"),
          expenseType: cand.expenseType ?? cand.expense_type ?? null,
          date: cand.date || todayLocalISO(),
          ownership: cand.ownership || "mine",
          needsReview: false,
          missingFields: [],
        });
      }

      bump();
      const summary = calculateBatchSummary(batchCandidates);
      navigate("/activity", {
        replace: true,
        state: {
          flash: `Saved ${batchCandidates.length} transactions (${formatINR(summary.totalIncomePaise)} income, ${formatINR(summary.totalExpensesPaise)} expenses).`,
        },
      });
    } catch (err: any) {
      setBatchError(err.message || "Failed to confirm batch transactions.");
    } finally {
      setBatchSubmitting(false);
    }
  }

  function updateBatchCandidate(id: string, patch: Partial<VoiceTransactionCandidate>) {
    setBatchCandidates((prev) =>
      prev.map((c) => {
        const candId = c.id || c.candidate_id;
        if (candId === id) {
          return { ...c, ...patch, needsReview: false, clarification_required: false };
        }
        return c;
      })
    );
  }

  function removeBatchCandidate(id: string) {
    setBatchCandidates((prev) => prev.filter((c) => (c.id || c.candidate_id) !== id));
  }

  const queueTotal = review?.queueTotal;
  const queueIndex = review?.queueIndex;
  const title = batchMode
    ? `Batch Review (${batchCandidates.length} transactions)`
    : review?.origin
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

  // --- Render Batch Review View ---
  if (batchMode && batchCandidates.length > 0) {
    const summary = calculateBatchSummary(batchCandidates);

    return (
      <Screen
        title={title}
        subtitle="Review and edit all extracted transactions together"
        back
      >
        {batchError && (
          <div className="mb-4">
            <Notice tone="danger" title="Error">
              {batchError}
            </Notice>
          </div>
        )}

        {/* Batch Summary Card */}
        <Card className="p-4 mb-4">
          <p className="text-xs font-semibold text-neutral-500 mb-2">BATCH ARITHMETIC SUMMARY</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-emerald-50/70 p-2.5 border border-emerald-100">
              <span className="block text-[11px] font-semibold text-emerald-800">Total Income</span>
              <span className="text-base font-extrabold text-emerald-950 tabular-nums">
                {formatINR(summary.totalIncomePaise)}
              </span>
            </div>
            <div className="rounded-xl bg-red-50/70 p-2.5 border border-red-100">
              <span className="block text-[11px] font-semibold text-red-800">Total Expenses</span>
              <span className="text-base font-extrabold text-red-950 tabular-nums">
                {formatINR(summary.totalExpensesPaise)}
              </span>
            </div>
            <div className="rounded-xl bg-sky-50/70 p-2.5 border border-sky-100">
              <span className="block text-[11px] font-semibold text-sky-800">Net Movement</span>
              <span className="text-base font-extrabold text-sky-950 tabular-nums">
                {summary.netMovementPaise >= 0 ? "+" : ""}{formatINR(summary.netMovementPaise)}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2 text-center">
            Note: Net movement is transaction difference, not your confirmed bank balance.
          </p>
        </Card>

        {/* Candidate Cards */}
        <div className="space-y-3 mb-6">
          {batchCandidates.map((c, idx) => {
            const candId = c.id || c.candidate_id || `cand-${idx}`;
            const amountPaise = c.amountPaise ?? c.amount_paise ?? 0;
            const isClarification = c.clarification_required || !c.type || !amountPaise;

            return (
              <Card
                key={candId}
                className={`p-3.5 space-y-3 border ${
                  isClarification ? "border-amber-300 bg-amber-50/30" : "border-neutral-200"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-600">Entry #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeBatchCandidate(candId)}
                    className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <IconTrash size={13} /> Remove
                  </button>
                </div>

                {isClarification && (
                  <Notice tone="warn" title="Clarification Needed">
                    {!c.type ? "Is this money you earned or money you spent?" : "Please verify the amount."}
                  </Notice>
                )}

                {/* Type selector */}
                <Segmented
                  value={c.type || "expense"}
                  onChange={(val) => updateBatchCandidate(candId, { type: val as TransactionType, expenseType: val === "income" ? null : "living" })}
                  options={[
                    { value: "expense", label: "Expense" },
                    { value: "income", label: "Income" },
                  ]}
                />

                {/* Amount and description */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={amountPaise ? (amountPaise / 100).toString() : ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateBatchCandidate(candId, { amountPaise: isNaN(val) ? null : Math.round(val * 100) });
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-neutral-300 font-bold text-sm"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Category</label>
                    <select
                      value={c.category || (c.type === "income" ? "earnings" : "other")}
                      onChange={(e) => updateBatchCandidate(candId, { category: e.target.value })}
                      className="w-full h-10 px-2 rounded-xl border border-neutral-300 text-xs bg-white"
                    >
                      {(c.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Expense living/work split */}
                {c.type === "expense" && (
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Expense Type</label>
                    <Segmented
                      value={c.expenseType ?? c.expense_type ?? "living"}
                      onChange={(val) => updateBatchCandidate(candId, { expenseType: val as ExpenseType })}
                      options={[
                        { value: "living", label: "Living (personal)" },
                        { value: "work", label: "Work" },
                      ]}
                    />
                  </div>
                )}

                {/* Date and Note */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Date</label>
                    <input
                      type="date"
                      value={c.date || todayLocalISO()}
                      onChange={(e) => updateBatchCandidate(candId, { date: e.target.value })}
                      className="w-full h-9 px-2 rounded-xl border border-neutral-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Note</label>
                    <input
                      type="text"
                      value={c.description || ""}
                      onChange={(e) => updateBatchCandidate(candId, { description: e.target.value })}
                      placeholder="e.g. Petrol, Groceries"
                      className="w-full h-9 px-2 rounded-xl border border-neutral-300"
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Batch Action Buttons */}
        <div className="space-y-2">
          <Button
            variant="primary"
            className="w-full h-12 font-bold"
            disabled={batchCandidates.length === 0 || batchSubmitting}
            onClick={confirmAllBatch}
          >
            {batchSubmitting ? "Saving all..." : `Confirm All (${batchCandidates.length}) Transactions`}
          </Button>

          <Button
            variant="secondary"
            className="w-full text-xs"
            onClick={() => setBatchMode(false)}
          >
            Review Step-by-Step Individually
          </Button>

          <Button
            variant="ghost"
            className="w-full text-xs text-neutral-500"
            onClick={() => navigate("/app")}
          >
            Discard Batch
          </Button>
        </div>
      </Screen>
    );
  }

  // --- Render Single / Sequential Review View ---
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

      {review?.arithmeticDiscrepancy && (
        <div className="mb-4">
          <Notice tone="warn" title="Arithmetic Discrepancy">
            {review.arithmeticDiscrepancy}
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
