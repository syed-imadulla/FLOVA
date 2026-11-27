// =====================================================================
// FLOVA 2.0 | Insights & Commitments View-Model Helpers (Sprint 6F)
// Pure deterministic adapters over Sprint 5/6B outputs.
// Never fabricates recommendations or double-counts commitments.
// =====================================================================

import type { SpendingIntelligenceReport } from "../engine";
import { formatINR, toPaise } from "../lib/money";
import type { Commitment, CommitmentStatus, ISODate, Paise } from "../types/contracts";
import type { FinancialIntelligenceSnapshot } from "./financialIntelligence";

export interface StructuredInsight {
  id: string;
  tone: "danger" | "warn" | "info" | "brand";
  title: string;
  whatHappened: string;
  whyItMatters: string;
  nextActionLabel: string;
  nextActionTo: string;
}

export function buildStructuredInsights(params: {
  intel: FinancialIntelligenceSnapshot | null;
  spendingReport?: SpendingIntelligenceReport | null;
}): StructuredInsight[] {
  const { intel } = params;
  const out: StructuredInsight[] = [];

  // Safe-to-Spend and Spending Anomalies are rendered in dedicated cards on InsightsScreen;
  // structured cards focus on upcoming obligations, debt repayment, and WISH goals without duplication.
  if (intel && (intel.obligations.overdueCommitmentsPaise > 0 || intel.obligations.upcomingCommitmentsUntilIncomePaise > 0)) {
    const hasOverdue = intel.obligations.overdueCommitmentsPaise > 0;
    out.push({
      id: "commitments-pressure",
      tone: hasOverdue ? "danger" : "info",
      title: hasOverdue ? "Overdue bills need attention" : "Upcoming bills accounted for",
      whatHappened: hasOverdue
        ? `${formatINR(intel.obligations.overdueCommitmentsPaise)} in overdue bills plus ${formatINR(intel.obligations.upcomingCommitmentsUntilIncomePaise)} upcoming.`
        : `${formatINR(intel.obligations.upcomingCommitmentsUntilIncomePaise)} in upcoming bills before your next expected income.`,
      whyItMatters: "Keeping bill due dates current ensures Safe-to-Spend does not overestimate free cash.",
      nextActionLabel: "Manage bills",
      nextActionTo: "/commitments",
    });
  }

  if (intel?.debtPlan && intel.debtPlan.totalOwedPaise > 0) {
    out.push({
      id: "debt-repayment",
      tone: intel.debtPlan.overdueTotalPaise > 0 ? "danger" : "warn",
      title: "Debt repayment plan",
      whatHappened: `You owe ${formatINR(intel.debtPlan.totalOwedPaise)} (suggested set-aside ${formatINR(intel.debtPlan.recommendedDailySetAsidePaise)}/day).`,
      whyItMatters: "Clearing overdue and dated debts first protects your sustainable capital.",
      nextActionLabel: "Open Money planner",
      nextActionTo: "/money",
    });
  }

  if (intel?.wishReport && (intel.wishReport.activeCount > 0 || intel.wishReport.completedCount > 0)) {
    out.push({
      id: "wish-progress",
      tone: intel.wishReport.hasInsufficientSafeToSpend ? "warn" : "brand",
      title: "WISH savings goals",
      whatHappened: intel.wishReport.summary,
      whyItMatters: "Ordinary WISH targets stay separate from Safe-to-Spend so essential bills come first.",
      nextActionLabel: "Open WISH",
      nextActionTo: "/wish",
    });
  }

  return out;
}

export interface CommitmentsIntelligenceModel {
  upcomingCount: number;
  upcomingTotalPaise: Paise;
  overdueCount: number;
  overdueTotalPaise: Paise;
  displayedTotalPaise: Paise;
  confirmedCashPaise: Paise | null;
  safeToSpendPaise: Paise | null;
  remainingMonthlyAllowancePaise: Paise | null;
  upcomingCommitmentsUntilIncomePaise: Paise;
  laterMonthCommitmentsPaise: Paise;
  nextExpectedIncomeDate: ISODate | null;
  shortfallPaise: Paise;
  hasPressure: boolean;
}

export function buildCommitmentsIntelligenceModel(params: {
  items: Commitment[];
  filter: CommitmentStatus | "all";
  intel: FinancialIntelligenceSnapshot | null;
  todayISO: ISODate;
}): CommitmentsIntelligenceModel {
  const { items, intel, todayISO } = params;

  // Strictly count only status === "upcoming" as active obligations (exclude paid/cancelled)
  const upcomingItems = items.filter((c) => c.status === "upcoming");
  const overdueItems = upcomingItems.filter((c) => c.due_date < todayISO);

  const upcomingTotalPaise = upcomingItems.reduce((sum, c) => sum + toPaise(c.amount), 0);
  const overdueTotalPaise = overdueItems.reduce((sum, c) => sum + toPaise(c.amount), 0);
  const displayedTotalPaise = items.reduce((sum, c) => sum + toPaise(c.amount), 0);

  const upcomingCommitmentsUntilIncomePaise =
    intel?.obligations.upcomingCommitmentsUntilIncomePaise ?? 0;
  const upcomingCommitmentsMonthPaise =
    intel?.obligations.upcomingCommitmentsMonthPaise ?? 0;
  const laterMonthCommitmentsPaise = Math.max(
    0,
    upcomingCommitmentsMonthPaise - upcomingCommitmentsUntilIncomePaise
  );

  const shortfallPaise = intel?.safeToSpend?.shortfallPaise ?? 0;
  const hasPressure =
    overdueTotalPaise > 0 ||
    shortfallPaise > 0 ||
    Boolean(intel?.runway.firstShortfallDate);

  return {
    upcomingCount: upcomingItems.length,
    upcomingTotalPaise,
    overdueCount: overdueItems.length,
    overdueTotalPaise,
    displayedTotalPaise,
    confirmedCashPaise: intel?.confirmedCashPaise ?? null,
    safeToSpendPaise: intel?.safeToSpendPaise ?? null,
    remainingMonthlyAllowancePaise: intel?.remainingMonthlyAllowancePaise ?? null,
    upcomingCommitmentsUntilIncomePaise,
    laterMonthCommitmentsPaise,
    nextExpectedIncomeDate: intel?.safeToSpend?.nextExpectedIncomeDate ?? null,
    shortfallPaise,
    hasPressure,
  };
}
