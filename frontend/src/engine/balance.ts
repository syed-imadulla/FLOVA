// =====================================================================
// FLOVA Financial Engine — Confirmed Balance Calculation (M3)
// Strictly pure TypeScript: independent of React, Supabase, DOM, fetch or Gemini.
// =====================================================================

import type { Paise, RunwayInput } from "../types/contracts";
import { calculateGroupCashAndBalances } from "./groupSplitEngine";
import { calculatePeerDebtSummary } from "./peerDebtEngine";
import { safeAdd, safeSub, validateBalanceCheckin, validatePayout } from "./validation";

export type ConfirmedBalanceStatus =
  | "CONFIRMED"
  | "INSUFFICIENT_INFORMATION"
  | "INVALID_INPUT";

export interface ConfirmedBalanceBreakdown {
  startingPersonalPaise: Paise;
  confirmedIncomePaise: Paise;
  earnedIncomePaise?: Paise;
  nonEarnedInflowPaise?: Paise;
  confirmedExpensePaise: Paise;
  netTransactionsPaise: number;
  peerDebtCashDeltaPaise?: number;
  endingPersonalPaise: number;
}

export interface ConfirmedBalanceResult {
  status: ConfirmedBalanceStatus;
  confirmedBalancePaise: number | null;
  custodialOwedPaise: number | null;
  peerLiabilityPaise?: Paise;
  peerReceivablePaise?: Paise;
  groupLiabilityPaise?: Paise;
  groupReceivablePaise?: Paise;
  breakdown?: ConfirmedBalanceBreakdown;
  reason?: string;
  appliedTransactionCount?: number;
}

/**
 * Calculates confirmed personal liquid balance strictly adhering to FLOVA data contract:
 * 1. Starts from latest check-in: (cash + bank - notMine).
 * 2. Validates payouts against contract rules:
 *    - Rejects invalid amounts, received > expected, or inconsistent statuses.
 *    - Expected/scheduled/unearned/cancelled payouts are strictly EXCLUDED from confirmed balance.
 * 3. Deduplicates same-day entries: counts transactions where createdAt > checkedAt.
 * 4. Applies confirmed own transactions (ownership === "mine"):
 *    - type === "income" -> increases personal balance.
 *    - type === "expense" -> decreases personal balance.
 * 5. Handles Cash On Delivery (COD) and custodial liability lifecycle (ownership === "not_mine"):
 *    - Collections (income) increase custodial liability owed to platform.
 *    - Remittances (expense) decrease custodial liability.
 *    - Rejects invalid lifecycle transitions if remittance exceeds outstanding liability.
 *    - Custodial money NEVER modifies personal available balance.
 * 6. Payout Deduplication:
 *    - Payout receipts are already income transactions, so payouts.received is NEVER
 *      added on top of transactions, preventing double-counting.
 * 7. Returns INSUFFICIENT_INFORMATION if no valid check-in exists (never assumes 0).
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

  // Validate payouts structure and contract consistency
  if (Array.isArray(input.payouts)) {
    for (const p of input.payouts) {
      const pRes = validatePayout(p);
      if (!pRes.valid) {
        return {
          status: "INVALID_INPUT",
          confirmedBalancePaise: null,
          custodialOwedPaise: null,
          reason: `Invalid payout ${p.id}: ${pRes.errors.join("; ")}`,
        };
      }
    }
  }

  const { cash, bank, notMine, checkedAt } = input.latestCheckin;

  // Initial balances established at check-in moment
  const startingPersonal = safeSub(safeAdd(cash, bank), notMine);
  let runningPersonal: number = startingPersonal;
  let runningCustodial: number = notMine;

  let confirmedIncome = 0;
  let earnedIncome = 0;
  let nonEarnedInflow = 0;
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
      if (tx.createdAt <= checkedAt) {
        continue;
      }

      appliedCount++;

      if (tx.ownership === "mine") {
        if (tx.type === "income") {
          confirmedIncome = safeAdd(confirmedIncome, tx.amount);
          const inflowCat = tx.inflowCategory ?? "earned";
          if (inflowCat === "earned") {
            earnedIncome = safeAdd(earnedIncome, tx.amount);
          } else {
            nonEarnedInflow = safeAdd(nonEarnedInflow, tx.amount);
          }
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
          if (tx.amount > runningCustodial) {
            return {
              status: "INVALID_INPUT",
              confirmedBalancePaise: null,
              custodialOwedPaise: null,
              reason: `Invalid COD lifecycle transition: remittance of ${tx.amount} paise exceeds outstanding custodial liability of ${runningCustodial} paise.`,
            };
          }
          runningCustodial = safeSub(runningCustodial, tx.amount);
        }
      }
    }
  }

  // Integrate peer debt cash movements (borrowed, lent, repayments) created AFTER latest check-in.
  // Single source of truth: these are never duplicated in transactions.
  let peerLiabilityPaise: Paise = 0;
  let peerReceivablePaise: Paise = 0;
  let peerDebtCashDeltaPaise = 0;
  if ((input.peerDebts && input.peerDebts.length > 0) || (input.debtSettlements && input.debtSettlements.length > 0)) {
    try {
      const peerSummary = calculatePeerDebtSummary({
        peerDebts: input.peerDebts,
        debtSettlements: input.debtSettlements,
        checkedAt,
      });
      peerLiabilityPaise = peerSummary.totalOwedByUserPaise;
      peerReceivablePaise = peerSummary.totalReceivablePaise;
      peerDebtCashDeltaPaise = peerSummary.netCashDeltaSinceCheckinPaise;
      runningPersonal = safeAdd(runningPersonal, peerDebtCashDeltaPaise);
    } catch (err) {
      return {
        status: "INVALID_INPUT",
        confirmedBalancePaise: null,
        custodialOwedPaise: null,
        reason: err instanceof Error ? err.message : "Invalid peer debt input.",
      };
    }
  }

  let groupLiabilityPaise: Paise = 0;
  let groupReceivablePaise: Paise = 0;
  if ((input.groupSplits && input.groupSplits.length > 0) || (input.groupSettlements && input.groupSettlements.length > 0)) {
    const groupSummary = calculateGroupCashAndBalances({
      groupSplits: input.groupSplits,
      groupSettlements: input.groupSettlements,
      checkedAt,
    });
    groupLiabilityPaise = groupSummary.totalGroupLiabilityPaise;
    groupReceivablePaise = groupSummary.totalGroupReceivablePaise;
    peerLiabilityPaise = safeAdd(peerLiabilityPaise, groupLiabilityPaise);
    peerReceivablePaise = safeAdd(peerReceivablePaise, groupReceivablePaise);
    runningPersonal = safeAdd(runningPersonal, groupSummary.netCashDeltaSinceCheckinPaise);
  }

  return {
    status: "CONFIRMED",
    confirmedBalancePaise: runningPersonal,
    custodialOwedPaise: runningCustodial,
    peerLiabilityPaise,
    peerReceivablePaise,
    groupLiabilityPaise,
    groupReceivablePaise,
    breakdown: {
      startingPersonalPaise: startingPersonal,
      confirmedIncomePaise: confirmedIncome,
      earnedIncomePaise: earnedIncome,
      nonEarnedInflowPaise: nonEarnedInflow,
      confirmedExpensePaise: confirmedExpense,
      netTransactionsPaise: safeSub(confirmedIncome, confirmedExpense),
      peerDebtCashDeltaPaise,
      endingPersonalPaise: runningPersonal,
    },
    appliedTransactionCount: appliedCount,
  };
}
