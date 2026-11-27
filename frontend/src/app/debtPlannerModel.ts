// =====================================================================
// FLOVA 2.0 | Debt Repayment Planner & Budget Simulator Model (Sprint 6D)
// Pure deterministic adapter over buildDebtRepaymentPlan & compareRepaymentBudgets.
// Invariants:
//   - Integer paise only.
//   - Receivables are NEVER treated as money available for repayment.
//   - Simulated budgets NEVER mutate debt or transaction records.
// =====================================================================

import {
  compareRepaymentBudgets,
  type DebtObligationItem,
  type DebtRepaymentPlan,
  type SafeToSpendResult,
} from "../engine";
import type {
  GroupSplitEngineItem,
  ISODate,
  Paise,
  PeerDebtEngineItem,
} from "../types/contracts";

export interface DebtSimulationSummary {
  dailyBudgetPaise: Paise;
  weeklyBudgetPaise: Paise;
  totalPayoffDays: number | null;
  estimatedPayoffDate: ISODate | null;
  missedDueDatesCount: number;
  exceedsSafeToSpendDaily: boolean;
  exceedsAvailableSafeToSpend: boolean;
  safeDailyAllowancePaise: Paise | null;
  safeToSpendPaise: Paise | null;
}

export interface DebtPlannerViewModel {
  hasDebts: boolean;
  totalOwedPaise: Paise;
  peerOwedPaise: Paise;
  groupOwedPaise: Paise;
  totalReceivablePaise: Paise;
  overdueTotalPaise: Paise;
  overdueCount: number;
  upcomingCount: number;
  recommendedDailySetAsidePaise: Paise;
  recommendedWeeklySetAsidePaise: Paise;
  totalPayoffDays: number | null;
  estimatedPayoffDate: ISODate | null;
  hasInsufficientFunds: boolean;
  immediateShortfallPaise: Paise;
  obligations: DebtObligationItem[];
  simulation: DebtSimulationSummary | null;
}

export interface BuildDebtPlannerModelParams {
  debtPlan: DebtRepaymentPlan | null;
  safeToSpend: SafeToSpendResult | null;
  peerDebts: PeerDebtEngineItem[];
  groupSplits: GroupSplitEngineItem[];
  creditorNamesById?: Record<string, string>;
  todayISO: ISODate;
  simulatedDailyBudgetPaise?: Paise | null;
}

export function buildDebtPlannerModel(
  params: BuildDebtPlannerModelParams
): DebtPlannerViewModel {
  const { debtPlan, safeToSpend, peerDebts, groupSplits, creditorNamesById, todayISO } = params;

  if (!debtPlan) {
    return {
      hasDebts: false,
      totalOwedPaise: 0,
      peerOwedPaise: 0,
      groupOwedPaise: 0,
      totalReceivablePaise: 0,
      overdueTotalPaise: 0,
      overdueCount: 0,
      upcomingCount: 0,
      recommendedDailySetAsidePaise: 0,
      recommendedWeeklySetAsidePaise: 0,
      totalPayoffDays: null,
      estimatedPayoffDate: null,
      hasInsufficientFunds: false,
      immediateShortfallPaise: 0,
      obligations: [],
      simulation: null,
    };
  }

  const hasDebts = debtPlan.totalOwedPaise > 0;
  const overdueCount = debtPlan.obligations.filter((o) => o.urgency === "overdue").length;
  const upcomingCount = debtPlan.obligations.filter((o) => o.urgency !== "overdue").length;

  const safeDailyAllowancePaise =
    safeToSpend?.status === "CONFIRMED" ? safeToSpend.dailySpendingAllowancePaise : null;
  const safeToSpendPaise =
    safeToSpend?.status === "CONFIRMED" ? safeToSpend.safeToSpendUntilNextIncomePaise : null;

  let simulation: DebtSimulationSummary | null = null;
  const simDaily = params.simulatedDailyBudgetPaise;
  if (hasDebts && typeof simDaily === "number" && Number.isSafeInteger(simDaily) && simDaily > 0) {
    const [res] = compareRepaymentBudgets(
      {
        peerDebts,
        groupSplits,
        creditorNamesById,
        todayISO,
        availableCashForDebtPaise:
          safeToSpend?.status === "CONFIRMED" && safeToSpend.confirmedAvailableCashPaise !== null
            ? safeToSpend.confirmedAvailableCashPaise
            : undefined,
      },
      [simDaily]
    );

    if (res) {
      const exceedsSafeToSpendDaily =
        safeDailyAllowancePaise !== null && res.dailyBudgetPaise > safeDailyAllowancePaise;
      const exceedsAvailableSafeToSpend =
        safeToSpendPaise !== null && res.dailyBudgetPaise > safeToSpendPaise;
      simulation = {
        dailyBudgetPaise: res.dailyBudgetPaise,
        weeklyBudgetPaise: res.weeklyBudgetPaise,
        totalPayoffDays: res.totalPayoffDays,
        estimatedPayoffDate: res.estimatedPayoffDate,
        missedDueDatesCount: res.missedDueDatesCount,
        exceedsSafeToSpendDaily,
        exceedsAvailableSafeToSpend,
        safeDailyAllowancePaise,
        safeToSpendPaise,
      };
    }
  }

  return {
    hasDebts,
    totalOwedPaise: debtPlan.totalOwedPaise,
    peerOwedPaise: debtPlan.peerOwedPaise,
    groupOwedPaise: debtPlan.groupOwedPaise,
    totalReceivablePaise: debtPlan.totalReceivablePaise,
    overdueTotalPaise: debtPlan.overdueTotalPaise,
    overdueCount,
    upcomingCount,
    recommendedDailySetAsidePaise: debtPlan.recommendedDailySetAsidePaise,
    recommendedWeeklySetAsidePaise: debtPlan.recommendedWeeklySetAsidePaise,
    totalPayoffDays: debtPlan.totalPayoffDays,
    estimatedPayoffDate: debtPlan.estimatedPayoffDate,
    hasInsufficientFunds: debtPlan.hasInsufficientFunds,
    immediateShortfallPaise: debtPlan.immediateShortfallPaise,
    obligations: debtPlan.obligations,
    simulation,
  };
}
