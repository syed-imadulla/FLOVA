// =====================================================================
// FLOVA 2.0 | Sprint 3C — Explicit Confirmation Gate & Idempotency
// Zero writes occur before explicit user approval matching exact draftId
// and contentHash. Protects against expiration, concurrent taps, and retries.
// =====================================================================

import type { ReviewState } from "../screens/AddScreen";
import { paiseToInput } from "../app/moneyText";
import { splitCustom } from "../engine";
import { computeDraftContentHash, validateDraft } from "./draftManager";
import type { DraftConfirmationResult, DraftWriteDeps, FinancialDraft } from "./draftTypes";

const confirmedKeysByUser = new Map<string, Set<string>>();
const inFlightDraftIds = new Set<string>();

export function resetConfirmationGateForTests(): void {
  confirmedKeysByUser.clear();
  inFlightDraftIds.clear();
}

export interface ConfirmDraftParams {
  draft: FinancialDraft;
  approvedDraftId: string;
  approvedContentHash: string;
  approvingUserId: string;
  deps: DraftWriteDeps;
  nowMs?: number;
}

export async function confirmAndExecuteDraft(params: ConfirmDraftParams): Promise<DraftConfirmationResult> {
  const { draft, approvedDraftId, approvedContentHash, approvingUserId, deps } = params;
  const nowMs = params.nowMs ?? Date.now();

  if (!approvingUserId || !deps.userId) {
    return { ok: false, draft, errorCode: "UNAUTHENTICATED", message: "Authentication is required before saving." };
  }
  if (draft.userId !== approvingUserId || deps.userId !== approvingUserId) {
    return { ok: false, draft, errorCode: "USER_MISMATCH", message: "Cross-user draft confirmation is forbidden." };
  }

  // Bind approval strictly to exact draftId and unmodified contents
  const actualHash = computeDraftContentHash(draft);
  if (draft.draftId !== approvedDraftId || draft.contentHash !== approvedContentHash || actualHash !== approvedContentHash) {
    return {
      ok: false,
      draft,
      errorCode: "MODIFIED_AFTER_APPROVAL",
      message: "Draft was modified after approval. Please review and confirm the updated draft again.",
    };
  }

  if (nowMs >= draft.expiresAt || draft.validationStatus === "expired") {
    return {
      ok: false,
      draft: { ...draft, validationStatus: "expired" },
      errorCode: "EXPIRED_DRAFT",
      message: "This draft has expired. Please create a fresh draft.",
    };
  }

  if (inFlightDraftIds.has(draft.draftId)) {
    return {
      ok: false,
      draft,
      errorCode: "CONCURRENT_CONFIRMATION",
      message: "Confirmation is already in progress for this draft.",
    };
  }

  const userKeys = confirmedKeysByUser.get(draft.userId);
  if (userKeys?.has(draft.idempotencyKey) || draft.validationStatus === "confirmed") {
    return {
      ok: false,
      draft,
      errorCode: "DUPLICATE_CONFIRMATION",
      message: "This draft has already been confirmed and saved.",
    };
  }

  const checked = validateDraft(draft, deps.peerDebts, nowMs);
  if (checked.validationStatus !== "valid" || checked.amountPaise === null) {
    return {
      ok: false,
      draft: checked,
      errorCode: "INVALID_DRAFT",
      message: checked.validationErrors[0] || `Draft is incomplete (missing: ${checked.missingFields.join(", ")}).`,
    };
  }

  inFlightDraftIds.add(draft.draftId);
  try {
    let recordId: string | undefined;

    if (checked.operationType === "income" || checked.operationType === "expense") {
      const saved = await deps.addTransaction({
        id: checked.idempotencyKey,
        type: checked.operationType,
        amount: checked.amountPaise,
        category: checked.category ?? (checked.operationType === "income" ? "earnings" : "other"),
        description: checked.description,
        expenseType: checked.operationType === "expense" ? (checked.expenseType ?? undefined) : undefined,
        inflowCategory: checked.operationType === "income" ? (checked.inflowCategory ?? "earned") : undefined,
        ownership: "mine",
        date: checked.date,
        source: "voice",
      });
      recordId = saved.id;
    } else if (checked.operationType === "peer_debt") {
      let personId = checked.personRef?.id;
      if (!personId && checked.personRef?.name) {
        const existing = deps.people.find((p) => p.name.toLowerCase() === checked.personRef!.name.toLowerCase());
        personId = existing ? existing.id : (await deps.createPerson({ name: checked.personRef.name })).id;
      }
      if (!personId) throw new Error("Person is required for peer debt.");
      const saved = await deps.createPeerDebt({
        id: checked.idempotencyKey,
        personId,
        direction: checked.debtDirection!,
        totalAmountPaise: checked.amountPaise,
        reason: checked.description,
        createdAt: `${checked.date}T12:00:00Z`,
      });
      recordId = saved.id;
    } else if (checked.operationType === "debt_settlement") {
      const debt = deps.peerDebts.find((d) => d.id === checked.debtId);
      if (!debt) throw new Error("Matching peer debt not found.");
      const saved = await deps.recordDebtSettlement(debt, {
        id: checked.idempotencyKey,
        direction: checked.settlementDirection!,
        amountPaise: checked.amountPaise,
        notes: checked.description,
        settledAt: `${checked.date}T12:00:00Z`,
      });
      recordId = saved.id;
    } else if (checked.operationType === "group_expense") {
      if (!checked.groupRef?.id) throw new Error("Group ID is required for group expense.");
      const included = (checked.groupShares ?? []).filter((s) => s.included);
      const shares = splitCustom(
        checked.amountPaise,
        included.map((s) => ({ isSelf: s.isSelf, personId: s.personId, shareAmountPaise: s.shareAmountPaise }))
      );
      const saved = await deps.recordGroupExpense({
        groupId: checked.groupRef.id,
        description: checked.description,
        totalAmountPaise: checked.amountPaise,
        paidBySelf: Boolean(checked.paidBySelf),
        paidByPersonId: checked.paidBySelf ? null : (checked.paidByPersonId ?? null),
        expenseDate: checked.date,
        splitType: checked.splitType ?? "equal",
        shares,
      });
      recordId = saved.expense.id;
    }

    if (!confirmedKeysByUser.has(draft.userId)) {
      confirmedKeysByUser.set(draft.userId, new Set());
    }
    confirmedKeysByUser.get(draft.userId)!.add(draft.idempotencyKey);

    return {
      ok: true,
      draft: { ...checked, validationStatus: "confirmed" },
      message: "Confirmed and saved to database.",
      recordId,
    };
  } catch (err) {
    return {
      ok: false,
      draft: checked,
      errorCode: "SERVICE_ERROR",
      message: err instanceof Error ? err.message : "Database write failed.",
    };
  } finally {
    inFlightDraftIds.delete(draft.draftId);
  }
}

/**
 * Adapts an income/expense FinancialDraft to the existing /add ReviewState
 * so VoiceScreen can reuse AddScreen without any UI redesign.
 */
export function toAddReviewState(draft: FinancialDraft, transcript: string): ReviewState {
  if (draft.operationType !== "income" && draft.operationType !== "expense") {
    throw new Error(`toAddReviewState supports only income/expense drafts, got ${draft.operationType}`);
  }
  return {
    origin: "voice",
    candidateId: draft.idempotencyKey,
    transcript,
    aiNote: `Prepared ${draft.operationType} draft. Review and tap Save to confirm.`,
    draft: {
      type: draft.operationType,
      amount: paiseToInput(draft.amountPaise),
      category: draft.category ?? "",
      expenseType: draft.expenseType ?? "",
      ownership: "mine",
      date: draft.date,
      note: draft.description,
    },
  };
}
