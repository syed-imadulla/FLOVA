// =====================================================================
// FLOVA Financial Engine — Deterministic Group Splitting & Accounting
// Pure TypeScript using integer paise only. Zero floating-point math.
// =====================================================================

import type {
  GroupSettlementEngineItem,
  GroupSplitDirection,
  GroupSplitEngineItem,
  ISOTimestamp,
  Paise,
} from "../types/contracts";
import { isValidPaise, safeAdd, safeSub } from "./validation";

export interface SplitParticipant {
  isSelf: boolean;
  personId: string | null;
}

export interface ComputedSplitShare extends SplitParticipant {
  shareAmountPaise: Paise;
}

export interface GroupAccountingSplit extends ComputedSplitShare {
  direction: GroupSplitDirection;
  remainingAmountPaise: Paise;
  status: "active" | "settled";
}

export interface GroupCashAndBalanceSummary {
  netCashDeltaSinceCheckinPaise: number;
  totalGroupReceivablePaise: Paise;
  totalGroupLiabilityPaise: Paise;
}

/**
 * Splits totalAmountPaise equally among participants.
 * Remainder paise are allocated deterministically (+1 paise to first `rem` participants).
 */
export function splitEqual(
  totalAmountPaise: Paise,
  participants: SplitParticipant[]
): ComputedSplitShare[] {
  if (!isValidPaise(totalAmountPaise) || totalAmountPaise <= 0) {
    throw new Error("totalAmountPaise must be a positive integer.");
  }
  if (!Array.isArray(participants) || participants.length === 0) {
    throw new Error("At least one participant is required.");
  }
  const n = participants.length;
  const base = Math.floor(totalAmountPaise / n);
  const rem = totalAmountPaise - base * n;

  return participants.map((p, idx) => ({
    isSelf: p.isSelf,
    personId: p.isSelf ? null : p.personId,
    shareAmountPaise: idx < rem ? base + 1 : base,
  }));
}

/**
 * Validates custom integer-paise shares summing exactly to totalAmountPaise.
 */
export function splitCustom(
  totalAmountPaise: Paise,
  shares: ComputedSplitShare[]
): ComputedSplitShare[] {
  if (!isValidPaise(totalAmountPaise) || totalAmountPaise <= 0) {
    throw new Error("totalAmountPaise must be a positive integer.");
  }
  if (!Array.isArray(shares) || shares.length === 0) {
    throw new Error("At least one participant share is required.");
  }
  let sum = 0;
  const normalized: ComputedSplitShare[] = shares.map((s) => {
    if (!isValidPaise(s.shareAmountPaise) || s.shareAmountPaise < 0) {
      throw new Error("All participant shares must be non-negative integer paise.");
    }
    sum = safeAdd(sum, s.shareAmountPaise);
    return {
      isSelf: s.isSelf,
      personId: s.isSelf ? null : s.personId,
      shareAmountPaise: s.shareAmountPaise,
    };
  });
  if (sum !== totalAmountPaise) {
    throw new Error(`Sum of shares (${sum}) does not equal total amount (${totalAmountPaise}).`);
  }
  return normalized;
}

/**
 * Splits totalAmountPaise by percentages (e.g. [50, 25, 25] or [33.33, 33.33, 33.34]).
 * Converts percentages to integer basis points (100% = 10,000 bps) and allocates rounding
 * remainders deterministically so total always equals totalAmountPaise.
 */
export function splitPercentage(
  totalAmountPaise: Paise,
  participants: Array<SplitParticipant & { percent: number }>
): ComputedSplitShare[] {
  if (!isValidPaise(totalAmountPaise) || totalAmountPaise <= 0) {
    throw new Error("totalAmountPaise must be a positive integer.");
  }
  if (!Array.isArray(participants) || participants.length === 0) {
    throw new Error("At least one participant is required.");
  }

  let totalBps = 0;
  const bpsList = participants.map((p) => {
    if (typeof p.percent !== "number" || !Number.isFinite(p.percent) || p.percent < 0) {
      throw new Error("Percentages must be non-negative numbers.");
    }
    const bps = Math.round(p.percent * 100);
    totalBps += bps;
    return bps;
  });

  if (totalBps !== 10000) {
    throw new Error(`Percentages must total 100% (got ${(totalBps / 100).toFixed(2)}%).`);
  }

  let allocated = 0;
  const shares = participants.map((p, idx) => {
    const share = Math.floor((totalAmountPaise * bpsList[idx]) / 10000);
    allocated += share;
    return {
      isSelf: p.isSelf,
      personId: p.isSelf ? null : p.personId,
      shareAmountPaise: share,
    };
  });

  let rem = totalAmountPaise - allocated;
  for (let i = 0; rem > 0 && i < shares.length; i++) {
    shares[i].shareAmountPaise += 1;
    rem -= 1;
  }

  return shares;
}

/**
 * Derives the exact accounting obligations for a group expense without double-counting:
 * - selfSharePaise: Only the user's own share becomes their consumption expense in `transactions`.
 * - Non-self splits when paidBySelf=true become `they_owe` receivables.
 * - Self split when paidBySelf=false becomes `you_owe` liability owed to paidByPersonId.
 */
export function computeGroupExpenseAccounting(input: {
  totalAmountPaise: Paise;
  paidBySelf: boolean;
  paidByPersonId: string | null;
  shares: ComputedSplitShare[];
}): {
  selfSharePaise: Paise;
  splits: GroupAccountingSplit[];
} {
  splitCustom(input.totalAmountPaise, input.shares);

  if (!input.paidBySelf && !input.paidByPersonId) {
    throw new Error("paidByPersonId is required when paidBySelf is false.");
  }

  let selfSharePaise: Paise = 0;
  const splits: GroupAccountingSplit[] = input.shares.map((s) => {
    if (s.isSelf) {
      selfSharePaise = safeAdd(selfSharePaise, s.shareAmountPaise);
    }

    if (input.paidBySelf) {
      if (s.isSelf || s.shareAmountPaise === 0) {
        return {
          ...s,
          direction: "self_share",
          remainingAmountPaise: 0,
          status: "settled",
        };
      }
      return {
        ...s,
        direction: "they_owe",
        remainingAmountPaise: s.shareAmountPaise,
        status: "active",
      };
    }

    // Paid by another participant
    if (s.isSelf && s.shareAmountPaise > 0) {
      return {
        ...s,
        direction: "you_owe",
        remainingAmountPaise: s.shareAmountPaise,
        status: "active",
      };
    }

    return {
      ...s,
      direction: "third_party",
      remainingAmountPaise: 0,
      status: "settled",
    };
  });

  return { selfSharePaise, splits };
}

/**
 * Computes net cash delta since latest check-in, total group receivables, and total group liabilities.
 */
export function calculateGroupCashAndBalances(input: {
  groupSplits?: GroupSplitEngineItem[];
  groupSettlements?: GroupSettlementEngineItem[];
  checkedAt: ISOTimestamp;
}): GroupCashAndBalanceSummary {
  let netCashDelta = 0;
  let totalReceivable: Paise = 0;
  let totalLiability: Paise = 0;

  const seenSplits = new Set<string>();
  const seenSettlements = new Set<string>();

  if (Array.isArray(input.groupSplits)) {
    for (const sp of input.groupSplits) {
      if (!sp || seenSplits.has(sp.id)) continue;
      seenSplits.add(sp.id);

      if (sp.createdAt > input.checkedAt) {
        if (sp.direction === "they_owe") {
          // User paid for participant's share -> cash left wallet
          netCashDelta = safeSub(netCashDelta, sp.shareAmountPaise);
        } else if (sp.direction === "you_owe") {
          // Payer paid user's share -> offsets self_share expense in transactions so Day 1 cash impact is 0
          netCashDelta = safeAdd(netCashDelta, sp.shareAmountPaise);
        }
      }

      if (sp.status === "active" || sp.status === "partially_settled") {
        if (sp.direction === "they_owe") {
          totalReceivable = safeAdd(totalReceivable, sp.remainingAmountPaise);
        } else if (sp.direction === "you_owe") {
          totalLiability = safeAdd(totalLiability, sp.remainingAmountPaise);
        }
      }
    }
  }

  if (Array.isArray(input.groupSettlements)) {
    for (const gs of input.groupSettlements) {
      if (!gs || seenSettlements.has(gs.id)) continue;
      seenSettlements.add(gs.id);

      if (gs.createdAt > input.checkedAt) {
        if (gs.direction === "repayment_in") {
          netCashDelta = safeAdd(netCashDelta, gs.amountPaise);
        } else if (gs.direction === "repayment_out") {
          netCashDelta = safeSub(netCashDelta, gs.amountPaise);
        }
      }
    }
  }

  return {
    netCashDeltaSinceCheckinPaise: netCashDelta,
    totalGroupReceivablePaise: totalReceivable,
    totalGroupLiabilityPaise: totalLiability,
  };
}
