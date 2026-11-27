// =====================================================================
// FLOVA 2.0 | HomeScreen Dashboard View-Model Mapper (Sprint 6C)
// Pure deterministic mapping from FinancialIntelligenceSnapshot to
// HomeScreen display state. Never fabricates ₹0 when data is missing.
// =====================================================================

import type { HealthIndicatorStatus } from "../engine";
import type { ISODate, Paise } from "../types/contracts";
import type { FinancialIntelligenceSnapshot } from "./financialIntelligence";

export interface HomeSafetySummary {
  show: boolean;
  safetyCushionPaise: Paise;
  upcomingBillsPaise: Paise;
  upcomingBillsCount: number;
  overdueObligationsPaise: Paise;
  overdueCount: number;
  totalLiabilitiesPaise: Paise;
  debtPressureLevel: "none" | "low" | "moderate" | "high";
}

export interface HomeHealthSummary {
  show: boolean;
  status: HealthIndicatorStatus;
  badgeLabel: string;
  summary: string;
  netSavingsRatePercent: number | null;
}

export interface HomeDashboardModel {
  isUnavailable: boolean;
  hasConfirmedBalance: boolean;
  confirmedCashPaise: Paise | null;
  safeToSpendPaise: Paise | null;
  dailyAllowancePaise: Paise | null;
  remainingMonthlyAllowancePaise: Paise | null;
  sustainableCapitalPaise: Paise | null;
  safetyCushionPaise: Paise;
  custodialOwedPaise: Paise;
  receivablesPaise: Paise;
  nextExpectedIncomeDate: ISODate | null;
  isConservativeFallback: boolean;
  laterMonthCommitmentsPaise: Paise;
  safetySummary: HomeSafetySummary;
  healthSummary: HomeHealthSummary;
  monthlyOverview: {
    earnedIncomePaise: Paise | null;
    nonEarnedInflowPaise: Paise | null;
    expensePaise: Paise | null;
  };
}

function healthBadgeLabel(status: HealthIndicatorStatus): string {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "watch":
      return "Watch";
    case "attention":
      return "Needs attention";
    default:
      return "Needs baseline";
  }
}

export function buildHomeDashboardModel(
  snapshot: FinancialIntelligenceSnapshot | null
): HomeDashboardModel {
  if (!snapshot || snapshot.status === "unavailable") {
    return {
      isUnavailable: true,
      hasConfirmedBalance: false,
      confirmedCashPaise: null,
      safeToSpendPaise: null,
      dailyAllowancePaise: null,
      remainingMonthlyAllowancePaise: null,
      sustainableCapitalPaise: null,
      safetyCushionPaise: 0,
      custodialOwedPaise: 0,
      receivablesPaise: 0,
      nextExpectedIncomeDate: null,
      isConservativeFallback: true,
      laterMonthCommitmentsPaise: 0,
      safetySummary: {
        show: false,
        safetyCushionPaise: 0,
        upcomingBillsPaise: 0,
        upcomingBillsCount: 0,
        overdueObligationsPaise: 0,
        overdueCount: 0,
        totalLiabilitiesPaise: 0,
        debtPressureLevel: "none",
      },
      healthSummary: {
        show: false,
        status: "insufficient_data",
        badgeLabel: "Needs baseline",
        summary: "Financial health data is unavailable right now.",
        netSavingsRatePercent: null,
      },
      monthlyOverview: {
        earnedIncomePaise: null,
        nonEarnedInflowPaise: null,
        expensePaise: null,
      },
    };
  }

  const hasConfirmedBalance = snapshot.confirmedCashPaise !== null;
  const upcomingBillsPaise =
    snapshot.obligations.upcomingCommitmentsUntilIncomePaise > 0
      ? snapshot.obligations.upcomingCommitmentsUntilIncomePaise
      : snapshot.obligations.upcomingCommitmentsMonthPaise;

  const overdueCommitmentsPaise = snapshot.obligations.overdueCommitmentsPaise;
  const overdueDebtPaise = snapshot.debtPlan?.overdueTotalPaise ?? 0;
  const overdueObligationsPaise = overdueCommitmentsPaise + overdueDebtPaise;

  const overdueCommitmentsCount =
    overdueCommitmentsPaise > 0
      ? snapshot.runway.upcomingCommitments.filter(
          (c) => c.dueDate < snapshot.todayISO
        ).length
      : 0;
  const overdueCount =
    overdueCommitmentsCount + snapshot.obligations.overdueDebtCount;

  const showSafety =
    hasConfirmedBalance ||
    snapshot.obligations.upcomingCommitmentsCount > 0 ||
    snapshot.obligations.totalLiabilitiesPaise > 0 ||
    snapshot.safetyCushionPaise > 0;

  const healthStatus: HealthIndicatorStatus =
    snapshot.financialHealth?.overallStatus ?? "insufficient_data";

  return {
    isUnavailable: false,
    hasConfirmedBalance,
    confirmedCashPaise: snapshot.confirmedCashPaise,
    safeToSpendPaise: snapshot.safeToSpendPaise,
    dailyAllowancePaise: snapshot.dailySpendingAllowancePaise,
    remainingMonthlyAllowancePaise: snapshot.remainingMonthlyAllowancePaise,
    sustainableCapitalPaise: snapshot.sustainableCapitalPaise,
    safetyCushionPaise: snapshot.safetyCushionPaise,
    custodialOwedPaise: snapshot.runway.custodialOwedPaise ?? 0,
    receivablesPaise: snapshot.receivablesPaise,
    nextExpectedIncomeDate:
      snapshot.safeToSpend?.nextExpectedIncomeDate ?? null,
    isConservativeFallback:
      snapshot.safeToSpend?.isConservativeFallback ?? true,
    laterMonthCommitmentsPaise: Math.max(
      0,
      snapshot.obligations.upcomingCommitmentsMonthPaise -
        snapshot.obligations.upcomingCommitmentsUntilIncomePaise
    ),
    safetySummary: {
      show: showSafety,
      safetyCushionPaise: snapshot.safetyCushionPaise,
      upcomingBillsPaise,
      upcomingBillsCount: snapshot.obligations.upcomingCommitmentsCount,
      overdueObligationsPaise,
      overdueCount,
      totalLiabilitiesPaise: snapshot.obligations.totalLiabilitiesPaise,
      debtPressureLevel: snapshot.obligations.debtPressureLevel,
    },
    healthSummary: {
      show: snapshot.financialHealth !== null,
      status: healthStatus,
      badgeLabel: healthBadgeLabel(healthStatus),
      summary:
        snapshot.financialHealth?.summary ??
        "Complete a check-in to unlock financial health insights.",
      netSavingsRatePercent:
        snapshot.financialHealth?.netSavingsRatePercent ?? null,
    },
    monthlyOverview: {
      earnedIncomePaise: snapshot.monthSummary?.earnedIncome ?? null,
      nonEarnedInflowPaise: snapshot.monthSummary?.nonEarnedInflow ?? null,
      expensePaise: snapshot.monthSummary?.expense ?? null,
    },
  };
}
