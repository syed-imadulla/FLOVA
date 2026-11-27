// =====================================================================
// FLOVA 2.0 | Intelligent Debt Repayment Planner (Sprint 5D)
// Pure deterministic integer-paise planner consolidating peer_debts
// (you_owe) and group_expense_splits (you_owe) without double-counting.
// Invariant: Receivables (they_owe) are segregated and NEVER treated as
// available cash. Simulations NEVER mutate database records.
// =====================================================================

import type {
  GroupSplitEngineItem,
  ISODate,
  Paise,
  PeerDebtEngineItem,
} from "../types/contracts";
import { validatePeerDebt } from "./peerDebtEngine";
import { addDays } from "./runway";
import { isValidISODate, isValidPaise, safeAdd } from "./validation";

export type DebtUrgency = "overdue" | "due_soon" | "upcoming" | "no_due_date";

export interface DebtObligationItem {
  id: string;
  source: "peer_debt" | "group_split";
  personId: string | null;
  creditorName: string;
  title: string;
  totalAmountPaise: Paise;
  remainingAmountPaise: Paise;
  dueDate: ISODate | null;
  urgency: DebtUrgency;
  priorityRank: number;
  daysUntilDue: number | null;
  recommendedDailySetAsidePaise: Paise;
  estimatedPayoffDays: number | null;
  estimatedPayoffDate: ISODate | null;
  willMissDueDate: boolean;
}

export interface CreditorDebtSummary {
  personId: string | null;
  creditorName: string;
  totalRemainingPaise: Paise;
  peerRemainingPaise: Paise;
  groupRemainingPaise: Paise;
  earliestDueDate: ISODate | null;
}

export interface DebtRepaymentPlannerInput {
  peerDebts?: PeerDebtEngineItem[];
  groupSplits?: GroupSplitEngineItem[];
  /** Optional lookup for creditor names on group splits (keyed by personId or groupExpenseId). */
  creditorNamesById?: Record<string, string>;
  todayISO: ISODate;
  /** Optional user-defined daily repayment budget in integer paise. */
  dailyRepaymentBudgetPaise?: Paise;
  /** Optional liquid cash available for debt payoff (to flag insufficient immediate funds). */
  availableCashForDebtPaise?: Paise;
}

export interface DebtRepaymentPlan {
  totalOwedPaise: Paise;
  peerOwedPaise: Paise;
  groupOwedPaise: Paise;
  /** Segregated receivables (they_owe) — NEVER treated as available cash. */
  totalReceivablePaise: Paise;
  overdueTotalPaise: Paise;
  hasRepaymentCapacity: boolean;
  hasInsufficientFunds: boolean;
  immediateShortfallPaise: Paise;
  dailyRepaymentBudgetPaise: Paise;
  recommendedDailySetAsidePaise: Paise;
  recommendedWeeklySetAsidePaise: Paise;
  totalPayoffDays: number | null;
  estimatedPayoffDate: ISODate | null;
  obligations: DebtObligationItem[];
  owedByCreditor: CreditorDebtSummary[];
  explanation: string[];
}

export interface RepaymentBudgetComparison {
  dailyBudgetPaise: Paise;
  weeklyBudgetPaise: Paise;
  totalPayoffDays: number | null;
  estimatedPayoffDate: ISODate | null;
  missedDueDatesCount: number;
}

function diffCalendarDays(fromISO: ISODate, toISO: ISODate): number {
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}

/**
 * Builds a deterministic, prioritized debt repayment plan in integer paise.
 */
export function buildDebtRepaymentPlan(input: DebtRepaymentPlannerInput): DebtRepaymentPlan {
  const {
    peerDebts = [],
    groupSplits = [],
    creditorNamesById = {},
    todayISO,
    dailyRepaymentBudgetPaise: rawBudget = 0,
    availableCashForDebtPaise,
  } = input;

  if (!isValidISODate(todayISO)) {
    throw new Error(`Invalid todayISO date: ${todayISO}. Expected YYYY-MM-DD.`);
  }

  const dailyBudgetPaise = isValidPaise(rawBudget) ? rawBudget : 0;

  let peerOwedPaise: Paise = 0;
  let groupOwedPaise: Paise = 0;
  let totalReceivablePaise: Paise = 0;
  let overdueTotalPaise: Paise = 0;

  const seenPeerIds = new Set<string>();
  const seenSplitIds = new Set<string>();

  type RawObligation = Omit<
    DebtObligationItem,
    "priorityRank" | "estimatedPayoffDays" | "estimatedPayoffDate" | "willMissDueDate"
  > & { createdAt: string };

  const rawList: RawObligation[] = [];

  for (const d of peerDebts) {
    if (!d || seenPeerIds.has(d.id)) continue;
    seenPeerIds.add(d.id);

    const check = validatePeerDebt(d);
    if (!check.valid) {
      throw new Error(`Invalid peer debt ${d.id}: ${check.errors.join("; ")}`);
    }

    if (d.status !== "active" && d.status !== "partially_settled") continue;

    if (d.direction === "they_owe") {
      totalReceivablePaise = safeAdd(totalReceivablePaise, d.remainingAmountPaise);
      continue;
    }

    if (d.remainingAmountPaise <= 0) continue;
    peerOwedPaise = safeAdd(peerOwedPaise, d.remainingAmountPaise);

    const dueDate = d.dueDate && isValidISODate(d.dueDate) ? d.dueDate : null;
    const daysUntilDue = dueDate ? diffCalendarDays(todayISO, dueDate) : null;
    let urgency: DebtUrgency = "no_due_date";
    if (daysUntilDue !== null) {
      if (daysUntilDue < 0) {
        urgency = "overdue";
        overdueTotalPaise = safeAdd(overdueTotalPaise, d.remainingAmountPaise);
      } else if (daysUntilDue <= 7) {
        urgency = "due_soon";
      } else {
        urgency = "upcoming";
      }
    }

    const recommendedDaily =
      daysUntilDue !== null
        ? Math.ceil(d.remainingAmountPaise / Math.max(1, daysUntilDue))
        : Math.ceil(d.remainingAmountPaise / 30);

    const name = d.personName || creditorNamesById[d.personId] || "Contact";
    rawList.push({
      id: d.id,
      source: "peer_debt",
      personId: d.personId,
      creditorName: name,
      title: `Repay ${name}`,
      totalAmountPaise: d.totalAmountPaise,
      remainingAmountPaise: d.remainingAmountPaise,
      dueDate,
      urgency,
      daysUntilDue,
      recommendedDailySetAsidePaise: recommendedDaily,
      createdAt: d.createdAt,
    });
  }

  for (const sp of groupSplits) {
    if (!sp || seenSplitIds.has(sp.id)) continue;
    seenSplitIds.add(sp.id);

    if (sp.status !== "active" && sp.status !== "partially_settled") continue;

    if (sp.direction === "they_owe") {
      totalReceivablePaise = safeAdd(totalReceivablePaise, sp.remainingAmountPaise);
      continue;
    }

    if (sp.direction !== "you_owe" || sp.remainingAmountPaise <= 0) continue;
    groupOwedPaise = safeAdd(groupOwedPaise, sp.remainingAmountPaise);

    const name =
      (sp.personId ? creditorNamesById[sp.personId] : undefined) ||
      creditorNamesById[sp.groupExpenseId] ||
      "Group member";

    rawList.push({
      id: sp.id,
      source: "group_split",
      personId: sp.personId,
      creditorName: name,
      title: `Group share owed (${name})`,
      totalAmountPaise: sp.shareAmountPaise,
      remainingAmountPaise: sp.remainingAmountPaise,
      dueDate: null,
      urgency: "no_due_date",
      daysUntilDue: null,
      recommendedDailySetAsidePaise: Math.ceil(sp.remainingAmountPaise / 30),
      createdAt: sp.createdAt,
    });
  }

  const totalOwedPaise = safeAdd(peerOwedPaise, groupOwedPaise);

  // Deterministic prioritization: overdue -> dated upcoming (earliest due) -> undated (smallest balance first)
  rawList.sort((a, b) => {
    const aHasDue = a.dueDate !== null;
    const bHasDue = b.dueDate !== null;
    if (aHasDue && !bHasDue) return -1;
    if (!aHasDue && bHasDue) return 1;
    if (aHasDue && bHasDue && a.dueDate !== b.dueDate) {
      return a.dueDate!.localeCompare(b.dueDate!);
    }
    if (a.remainingAmountPaise !== b.remainingAmountPaise) {
      return a.remainingAmountPaise - b.remainingAmountPaise;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });

  const hasRepaymentCapacity = totalOwedPaise === 0 || dailyBudgetPaise > 0;
  let cumulativePaise = 0;

  const obligations: DebtObligationItem[] = rawList.map((item, idx) => {
    cumulativePaise = safeAdd(cumulativePaise, item.remainingAmountPaise);
    const estimatedPayoffDays =
      dailyBudgetPaise > 0 ? Math.ceil(cumulativePaise / dailyBudgetPaise) : null;
    const estimatedPayoffDate =
      estimatedPayoffDays !== null ? addDays(todayISO, estimatedPayoffDays) : null;
    const willMissDueDate = Boolean(
      item.dueDate &&
        (estimatedPayoffDate === null || estimatedPayoffDate > item.dueDate)
    );

    return {
      id: item.id,
      source: item.source,
      personId: item.personId,
      creditorName: item.creditorName,
      title: item.title,
      totalAmountPaise: item.totalAmountPaise,
      remainingAmountPaise: item.remainingAmountPaise,
      dueDate: item.dueDate,
      urgency: item.urgency,
      priorityRank: idx + 1,
      daysUntilDue: item.daysUntilDue,
      recommendedDailySetAsidePaise: item.recommendedDailySetAsidePaise,
      estimatedPayoffDays,
      estimatedPayoffDate,
      willMissDueDate,
    };
  });

  // Group by creditor
  const creditorMap = new Map<string, CreditorDebtSummary>();
  for (const ob of obligations) {
    const key = ob.personId ?? ob.creditorName;
    const existing = creditorMap.get(key) ?? {
      personId: ob.personId,
      creditorName: ob.creditorName,
      totalRemainingPaise: 0,
      peerRemainingPaise: 0,
      groupRemainingPaise: 0,
      earliestDueDate: null,
    };
    existing.totalRemainingPaise = safeAdd(existing.totalRemainingPaise, ob.remainingAmountPaise);
    if (ob.source === "peer_debt") {
      existing.peerRemainingPaise = safeAdd(existing.peerRemainingPaise, ob.remainingAmountPaise);
    } else {
      existing.groupRemainingPaise = safeAdd(existing.groupRemainingPaise, ob.remainingAmountPaise);
    }
    if (ob.dueDate && (!existing.earliestDueDate || ob.dueDate < existing.earliestDueDate)) {
      existing.earliestDueDate = ob.dueDate;
    }
    creditorMap.set(key, existing);
  }
  const owedByCreditor = [...creditorMap.values()].sort(
    (a, b) => b.totalRemainingPaise - a.totalRemainingPaise
  );

  const recommendedDailySetAsidePaise = obligations.reduce(
    (acc, ob) => safeAdd(acc, ob.recommendedDailySetAsidePaise),
    0
  );
  const recommendedWeeklySetAsidePaise =
    totalOwedPaise > 0
      ? Math.min(totalOwedPaise, recommendedDailySetAsidePaise * 7)
      : 0;

  const totalPayoffDays =
    totalOwedPaise === 0
      ? 0
      : dailyBudgetPaise > 0
        ? Math.ceil(totalOwedPaise / dailyBudgetPaise)
        : null;
  const estimatedPayoffDate =
    totalPayoffDays !== null ? addDays(todayISO, totalPayoffDays) : null;

  const hasInsufficientFunds =
    availableCashForDebtPaise !== undefined &&
    Math.max(0, availableCashForDebtPaise) < totalOwedPaise;
  const immediateShortfallPaise =
    availableCashForDebtPaise !== undefined && hasInsufficientFunds
      ? totalOwedPaise - Math.max(0, availableCashForDebtPaise)
      : 0;

  const explanation: string[] = [];
  if (totalOwedPaise === 0) {
    explanation.push("You have no outstanding peer or group debt obligations.");
  } else {
    explanation.push(
      `Total owed: ₹${(totalOwedPaise / 100).toLocaleString("en-IN")} (Peer: ₹${(peerOwedPaise / 100).toLocaleString("en-IN")}, Group: ₹${(groupOwedPaise / 100).toLocaleString("en-IN")}).`
    );
    if (overdueTotalPaise > 0) {
      explanation.push(
        `₹${(overdueTotalPaise / 100).toLocaleString("en-IN")} is overdue and prioritized first.`
      );
    }
    explanation.push(
      `Recommended set-aside: ₹${(recommendedDailySetAsidePaise / 100).toLocaleString("en-IN")}/day (₹${(recommendedWeeklySetAsidePaise / 100).toLocaleString("en-IN")}/week).`
    );
    if (dailyBudgetPaise <= 0) {
      explanation.push(
        "Repayment budget is ₹0/day. Payoff timeline cannot be estimated until repayment capacity is available."
      );
    } else {
      explanation.push(
        `At ₹${(dailyBudgetPaise / 100).toLocaleString("en-IN")}/day, all obligations clear in ${totalPayoffDays} day(s) (by ${estimatedPayoffDate}).`
      );
    }
    if (hasInsufficientFunds) {
      explanation.push(
        `Immediate liquid cash is short by ₹${(immediateShortfallPaise / 100).toLocaleString("en-IN")} to settle all debts today.`
      );
    }
  }
  if (totalReceivablePaise > 0) {
    explanation.push(
      `₹${(totalReceivablePaise / 100).toLocaleString("en-IN")} owed to you is tracked separately and not counted as cash.`
    );
  }

  return {
    totalOwedPaise,
    peerOwedPaise,
    groupOwedPaise,
    totalReceivablePaise,
    overdueTotalPaise,
    hasRepaymentCapacity,
    hasInsufficientFunds,
    immediateShortfallPaise,
    dailyRepaymentBudgetPaise: dailyBudgetPaise,
    recommendedDailySetAsidePaise,
    recommendedWeeklySetAsidePaise,
    totalPayoffDays,
    estimatedPayoffDate,
    obligations,
    owedByCreditor,
    explanation,
  };
}

/**
 * Compares multiple hypothetical daily repayment budgets without mutating records.
 */
export function compareRepaymentBudgets(
  input: Omit<DebtRepaymentPlannerInput, "dailyRepaymentBudgetPaise">,
  dailyBudgetsPaise: Paise[]
): RepaymentBudgetComparison[] {
  return dailyBudgetsPaise.map((budget) => {
    const plan = buildDebtRepaymentPlan({ ...input, dailyRepaymentBudgetPaise: budget });
    return {
      dailyBudgetPaise: plan.dailyRepaymentBudgetPaise,
      weeklyBudgetPaise: plan.dailyRepaymentBudgetPaise * 7,
      totalPayoffDays: plan.totalPayoffDays,
      estimatedPayoffDate: plan.estimatedPayoffDate,
      missedDueDatesCount: plan.obligations.filter((o) => o.willMissDueDate).length,
    };
  });
}
