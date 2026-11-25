// =====================================================================
// FLOVA Financial Engine — Peer Debt & Settlement Engine (Sprint 1)
// Strictly pure TypeScript: independent of React, Supabase, DOM, or fetch.
// Single Source of Truth for borrowed, lent, repayment_in, repayment_out.
// =====================================================================

import type {
  DebtSettlementEngineItem,
  ISODate,
  ISOTimestamp,
  Paise,
  PeerDebtEngineItem,
  SettlementDirection,
} from "../types/contracts";
import { isValidISODate, isValidPaise, safeAdd, safeSub } from "./validation";

export interface SettlementApplicationResult {
  valid: boolean;
  error?: string;
  updatedDebt?: PeerDebtEngineItem;
  cashDeltaPaise?: number;
}

export interface PeerDebtSummary {
  /** Net cash impact of peer debt events created AFTER latest check-in (paise). */
  netCashDeltaSinceCheckinPaise: number;
  /** Total unpaid borrowed principal owed by user (L_outstanding, paise). */
  totalOwedByUserPaise: Paise;
  /** Total unpaid lent principal owed to user (receivable asset, NEVER liquid cash, paise). */
  totalReceivablePaise: Paise;
  /** Active/partially-settled you_owe debts with due dates, ready for horizon filtering. */
  dueDebtCommitments: Array<{ id: string; title: string; amount: Paise; dueDate: ISODate }>;
}

/**
 * Validates a peer debt record's invariants in integer paise.
 */
export function validatePeerDebt(debt: PeerDebtEngineItem): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!debt || typeof debt !== "object") {
    return { valid: false, errors: ["Peer debt record is required."] };
  }
  if (!isValidPaise(debt.totalAmountPaise) || debt.totalAmountPaise <= 0) {
    errors.push("totalAmountPaise must be a positive integer.");
  }
  if (!isValidPaise(debt.remainingAmountPaise) || debt.remainingAmountPaise < 0) {
    errors.push("remainingAmountPaise must be a non-negative integer.");
  } else if (isValidPaise(debt.totalAmountPaise) && debt.remainingAmountPaise > debt.totalAmountPaise) {
    errors.push("remainingAmountPaise cannot exceed totalAmountPaise.");
  }
  if (debt.direction !== "you_owe" && debt.direction !== "they_owe") {
    errors.push(`Invalid peer debt direction: ${String(debt.direction)}`);
  }
  if (!["active", "partially_settled", "settled", "forgiven"].includes(debt.status)) {
    errors.push(`Invalid peer debt status: ${String(debt.status)}`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validates and applies a partial or full settlement against a peer debt.
 * Enforces:
 * 1. Positive integer-paise amount.
 * 2. Direction match (you_owe -> repayment_out, they_owe -> repayment_in).
 * 3. Active/partially_settled status.
 * 4. Optimistic concurrency protection (optional expectedRemainingPaise).
 * 5. Over-settlement prevention (amount <= remainingAmountPaise).
 */
export function validateAndApplySettlement(
  debt: PeerDebtEngineItem,
  settlement: {
    id: string;
    direction: SettlementDirection;
    amountPaise: Paise;
  },
  options?: { expectedRemainingPaise?: Paise }
): SettlementApplicationResult {
  const debtCheck = validatePeerDebt(debt);
  if (!debtCheck.valid) {
    return { valid: false, error: debtCheck.errors.join("; ") };
  }

  if (!isValidPaise(settlement.amountPaise) || settlement.amountPaise <= 0) {
    return { valid: false, error: "Settlement amount must be a positive integer in paise." };
  }

  const expectedDir: SettlementDirection = debt.direction === "you_owe" ? "repayment_out" : "repayment_in";
  if (settlement.direction !== expectedDir) {
    return {
      valid: false,
      error: `Invalid settlement direction '${settlement.direction}' for debt direction '${debt.direction}'. Expected '${expectedDir}'.`,
    };
  }

  if (debt.status !== "active" && debt.status !== "partially_settled") {
    return { valid: false, error: `Cannot settle peer debt in status '${debt.status}'.` };
  }

  if (
    options?.expectedRemainingPaise !== undefined &&
    options.expectedRemainingPaise !== debt.remainingAmountPaise
  ) {
    return {
      valid: false,
      error: `Concurrent settlement conflict: expected remaining ${options.expectedRemainingPaise}, actual ${debt.remainingAmountPaise}.`,
    };
  }

  if (settlement.amountPaise > debt.remainingAmountPaise) {
    return {
      valid: false,
      error: `Over-settlement rejected: ${settlement.amountPaise} exceeds remaining ${debt.remainingAmountPaise}.`,
    };
  }

  const newRemaining = safeSub(debt.remainingAmountPaise, settlement.amountPaise);
  const newStatus = newRemaining === 0 ? "settled" : "partially_settled";
  const cashDeltaPaise =
    settlement.direction === "repayment_in" ? settlement.amountPaise : -settlement.amountPaise;

  return {
    valid: true,
    cashDeltaPaise,
    updatedDebt: {
      ...debt,
      remainingAmountPaise: newRemaining,
      status: newStatus,
    },
  };
}

/**
 * Computes deterministic peer debt cash deltas (since check-in), outstanding liabilities,
 * receivables, and upcoming debt commitments in pure integer paise.
 */
export function calculatePeerDebtSummary(input: {
  peerDebts?: PeerDebtEngineItem[];
  debtSettlements?: DebtSettlementEngineItem[];
  checkedAt: ISOTimestamp;
}): PeerDebtSummary {
  let netCashDelta = 0;
  let totalOwedByUser: Paise = 0;
  let totalReceivable: Paise = 0;
  const dueDebtCommitments: Array<{ id: string; title: string; amount: Paise; dueDate: ISODate }> = [];

  const seenDebtIds = new Set<string>();
  const seenSettlementIds = new Set<string>();

  if (Array.isArray(input.peerDebts)) {
    for (const d of input.peerDebts) {
      if (!d || seenDebtIds.has(d.id)) continue;
      seenDebtIds.add(d.id);

      const check = validatePeerDebt(d);
      if (!check.valid) {
        throw new Error(`Invalid peer debt ${d.id}: ${check.errors.join("; ")}`);
      }

      // Cash movement at debt origination (only if created AFTER latest check-in)
      if (d.createdAt > input.checkedAt) {
        if (d.direction === "you_owe") {
          // Borrowed money increases cash on hand
          netCashDelta = safeAdd(netCashDelta, d.totalAmountPaise);
        } else {
          // Lent money decreases cash on hand
          netCashDelta = safeSub(netCashDelta, d.totalAmountPaise);
        }
      }

      // Outstanding balances (independent of check-in timestamp)
      if (d.status === "active" || d.status === "partially_settled") {
        if (d.direction === "you_owe") {
          totalOwedByUser = safeAdd(totalOwedByUser, d.remainingAmountPaise);
          if (d.dueDate && isValidISODate(d.dueDate) && d.remainingAmountPaise > 0) {
            dueDebtCommitments.push({
              id: d.id,
              title: d.personName ? `Repay ${d.personName}` : "Peer debt repayment",
              amount: d.remainingAmountPaise,
              dueDate: d.dueDate,
            });
          }
        } else {
          // Receivable asset: segregated from cash and available liquidity
          totalReceivable = safeAdd(totalReceivable, d.remainingAmountPaise);
        }
      }
    }
  }

  if (Array.isArray(input.debtSettlements)) {
    for (const s of input.debtSettlements) {
      if (!s || seenSettlementIds.has(s.id)) continue;
      seenSettlementIds.add(s.id);

      if (!isValidPaise(s.amountPaise) || s.amountPaise <= 0) {
        throw new Error(`Invalid settlement ${s.id}: amountPaise must be positive integer.`);
      }

      if (s.createdAt > input.checkedAt) {
        if (s.direction === "repayment_in") {
          netCashDelta = safeAdd(netCashDelta, s.amountPaise);
        } else if (s.direction === "repayment_out") {
          netCashDelta = safeSub(netCashDelta, s.amountPaise);
        }
      }
    }
  }

  return {
    netCashDeltaSinceCheckinPaise: netCashDelta,
    totalOwedByUserPaise: totalOwedByUser,
    totalReceivablePaise: totalReceivable,
    dueDebtCommitments,
  };
}
