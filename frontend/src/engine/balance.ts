// =====================================================================
// FLOVA Financial Engine — Confirmed Balance Calculation (M3)
// Strictly pure TypeScript: independent of React, Supabase, DOM, fetch or Gemini.
// =====================================================================

import type { Paise, RunwayInput } from "../types/contracts";
import { safeAdd, safeSub, validateBalanceCheckin } from "./validation";

export type ConfirmedBalanceStatus =
  | "CONFIRMED"
  | "INSUFFICIENT_INFORMATION"
  | "INVALID_INPUT";

export interface ConfirmedBalanceBreakdown {
  startingPersonalPaise: Paise;
  confirmedIncomePaise: Paise;
  confirmedExpensePaise: Paise;
  netTransactionsPaise: number;
  endingPersonalPaise: number;
}

export interface ConfirmedBalanceResult {
  status: ConfirmedBalanceStatus;
  confirmedBalancePaise: number | null;
  custodialOwedPaise: number | null;
  breakdown?: ConfirmedBalanceBreakdown;
  reason?: string;
  appliedTransactionCount?: number;
}

/**
 * Calculates confirmed personal liquid balance strictly adhering to FLOVA data contract:
 * 1. Starts from latest check-in: (cash + bank - notMine).
 * 2. Deduplicates same-day entries: counts transactions where createdAt > checkedAt.
 * 3. Applies confirmed own transactions (ownership === "mine"):
 *    - type === "income" -> increases personal balance.
 *    - type === "expense" -> decreases personal balance.
 * 4. Treats custodial / third-party money (ownership === "not_mine") as non-personal:
 *    - COD collection (income) increases custodial liability.
 *    - COD remittance/handover (expense) decreases custodial liability.
 *    - Does NOT modify personal liquid balance.
 * 5. Payouts:
 *    - Expected/scheduled/unearned/cancelled payouts are strictly EXCLUDED.
 *    - Settled/received payouts are already tracked as linked income transactions,
 *      so payouts.received is NEVER added again, preventing double-counting.
 * 6. Returns INSUFFICIENT_INFORMATION if no valid check-in exists (never assumes 0).
 */
export function calculateConfirmedBalance(input: RunwayInput): ConfirmedBalanceResult {
  if (!input || !input.latestCheckin) {
    return {
      status: "INSUFFICIENT_INFORMATION",
      confirmedBalancePaise: null,
      custodialOwedPaise: null,
      reason: "No balance check-in found. Confirmed balance cannot be determined without a verified baseline.",
    };
  }

  const checkinValidation = validateBalanceCheckin(input.latestCheckin);
  if (!checkinValidation.valid) {
    return {
      status: "INVALID_INPUT",
      confirmedBalancePaise: null,
      custodialOwedPaise: null,
      reason: checkinValidation.errors.join("; "),
    };
  }

  const { cash, bank, notMine, checkedAt } = input.latestCheckin;

  // Initial balances established at check-in moment
  const startingPersonal = safeSub(safeAdd(cash, bank), notMine);
  let runningPersonal: number = startingPersonal;
  let runningCustodial: number = notMine;

  let confirmedIncome = 0;
  let confirmedExpense = 0;
  let appliedCount = 0;

  const seenTransactionIds = new Set<string>();

  // Process transactions recorded since check-in
  if (Array.isArray(input.transactionsSinceCheckin)) {
    for (const tx of input.transactionsSinceCheckin) {
      // Deduplicate by ID
      if (seenTransactionIds.has(tx.id)) {
        continue;
      }
      seenTransactionIds.add(tx.id);

      // Timestamp gate: count only transactions created AFTER the check-in was captured
      // (transactions created at or before checkedAt were already included in the physical count)
      if (tx.createdAt <= checkedAt) {
        continue;
      }

      appliedCount++;

      if (tx.ownership === "mine") {
        if (tx.type === "income") {
          confirmedIncome = safeAdd(confirmedIncome, tx.amount);
          runningPersonal = safeAdd(runningPersonal, tx.amount);
        } else if (tx.type === "expense") {
          confirmedExpense = safeAdd(confirmedExpense, tx.amount);
          runningPersonal = safeSub(runningPersonal, tx.amount);
        }
      } else if (tx.ownership === "not_mine") {
        // Custodial / third-party money (e.g. Cash On Delivery)
        if (tx.type === "income") {
          // COD cash collected: increases custodial liability owed to platform
          runningCustodial = safeAdd(runningCustodial, tx.amount);
        } else if (tx.type === "expense") {
          // COD cash remitted / handed over: decreases custodial liability
          runningCustodial = safeSub(runningCustodial, tx.amount);
        }
      }
    }
  }

  return {
    status: "CONFIRMED",
    confirmedBalancePaise: runningPersonal,
    custodialOwedPaise: runningCustodial,
    breakdown: {
      startingPersonalPaise: startingPersonal,
      confirmedIncomePaise: confirmedIncome,
      confirmedExpensePaise: confirmedExpense,
      netTransactionsPaise: safeSub(confirmedIncome, confirmedExpense),
      endingPersonalPaise: runningPersonal,
    },
    appliedTransactionCount: appliedCount,
  };
}
