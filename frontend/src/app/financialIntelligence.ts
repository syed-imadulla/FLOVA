// =====================================================================
// FLOVA 2.0 | Pure Financial Intelligence Composition Layer (Sprint 6B)
// Composes existing Sprint 5 engines without duplicating accounting math.
// Invariants:
//   - Integer paise only.
//   - Receivables are NEVER counted as available cash.
//   - Borrowing is NEVER counted as earned income.
//   - Peer/group liabilities and commitments are NEVER double-counted.
//   - Ordinary WISH targets are NEVER treated as reserved money.
//   - Expected payouts are NEVER treated as confirmed cash.
// =====================================================================

import { todayLocalISO } from "../data/dates";
import {
  analyzeWishGoals,
  assessFinancialHealth,
  buildDebtRepaymentPlan,
  calculateSafeToSpend,
  normalizeWishGoalForEngine,
  type DebtRepaymentPlan,
  type FinancialHealthReport,
  type SafeToSpendResult,
  type WishGoalInput,
  type WishIntelligenceReport,
} from "../engine";
import { summarise, type MonthSummary } from "../engine/monthSummary";
import { processRunwayFeed, type ProcessedRunway } from "../runway/adapter";
import type {
  ISODate,
  Paise,
  RunwayInput,
  Transaction,
  WishGoal,
} from "../types/contracts";
import type { Wish } from "../wish/types";

export type FinancialIntelligenceStatus =
  | "ready"
  | "insufficient_data"
  | "invalid_input"
  | "unavailable";

export interface ObligationsSummary {
  totalLiabilitiesPaise: Paise;
  peerDebtLiabilityPaise: Paise;
  groupLiabilityPaise: Paise;
  overdueCommitmentsPaise: Paise;
  upcomingCommitmentsUntilIncomePaise: Paise;
  upcomingCommitmentsMonthPaise: Paise;
  upcomingCommitmentsCount: number;
  overdueDebtCount: number;
  debtPressureLevel: "none" | "low" | "moderate" | "high";
}

export interface FinancialIntelligenceSnapshot {
  status: FinancialIntelligenceStatus;
  todayISO: ISODate;
  missingInputs: string[];
  reason?: string;
  confirmedCashPaise: Paise | null;
  availableLiquidityPaise: Paise | null;
  sustainableCapitalPaise: Paise | null;
  safetyCushionPaise: Paise;
  safeToSpendPaise: Paise | null;
  dailySpendingAllowancePaise: Paise | null;
  remainingMonthlyAllowancePaise: Paise | null;
  receivablesPaise: Paise;
  obligations: ObligationsSummary;
  monthSummary: MonthSummary | null;
  runway: ProcessedRunway;
  safeToSpend: SafeToSpendResult | null;
  financialHealth: FinancialHealthReport | null;
  debtPlan: DebtRepaymentPlan | null;
  wishReport: WishIntelligenceReport;
}

export interface ComposeFinancialIntelligenceParams {
  runwayInput: RunwayInput | null;
  monthTransactions?: Transaction[] | null;
  wishGoals?: WishGoal[];
  localWish?: Wish | null;
  /** Explicit per-goal reservations in paise (never auto-derived from target amounts). */
  explicitWishReservationsById?: Record<string, Paise>;
  /** Total explicit WISH/savings reservation in paise (if not specified per goal). */
  explicitReservedGoalsPaise?: Paise;
  dailyRepaymentBudgetPaise?: Paise;
  creditorNamesById?: Record<string, string>;
  todayISO?: ISODate;
  horizonDays?: number;
  conservativeFallbackDays?: number;
}

function normalizeGoals(
  wishGoals: WishGoal[] | undefined,
  localWish: Wish | null | undefined,
  explicitById: Record<string, Paise>
): WishGoalInput[] {
  if (wishGoals && wishGoals.length > 0) {
    return wishGoals.map((goal) =>
      normalizeWishGoalForEngine(goal, {
        explicitlyReservedPaise: explicitById[goal.id] ?? 0,
      })
    );
  }

  if (localWish) {
    return [
      {
        id: localWish.id,
        title: localWish.name,
        targetPaise: localWish.targetPaise,
        savedPaise: localWish.savedPaise,
        targetDate: null,
        status: localWish.status,
        contributionPaise: localWish.contributionPaise,
        cadence: localWish.cadence,
        explicitlyReservedPaise: explicitById[localWish.id] ?? 0,
      },
    ];
  }

  return [];
}

function deriveDebtPressureLevel(
  totalLiabilitiesPaise: Paise,
  confirmedCashPaise: Paise | null,
  overdueDebtCount: number
): ObligationsSummary["debtPressureLevel"] {
  if (totalLiabilitiesPaise <= 0) return "none";
  if (overdueDebtCount > 0) return "high";
  if (confirmedCashPaise === null || confirmedCashPaise <= 0) return "high";
  const ratioPct = (totalLiabilitiesPaise * 100) / confirmedCashPaise;
  if (ratioPct >= 50) return "high";
  if (ratioPct >= 20) return "moderate";
  return "low";
}

export function composeFinancialIntelligence(
  params: ComposeFinancialIntelligenceParams
): FinancialIntelligenceSnapshot {
  const todayISO = params.todayISO ?? todayLocalISO();
  const horizonDays = params.horizonDays ?? 7;
  const runway = processRunwayFeed(params.runwayInput, {
    horizonDays,
    startDate: todayISO,
  });

  const explicitById = params.explicitWishReservationsById ?? {};
  const normalizedGoals = normalizeGoals(
    params.wishGoals,
    params.localWish,
    explicitById
  );

  // Explicit reservations ONLY: ordinary WISH targets never reduce safe-to-spend.
  const explicitFromGoals = normalizedGoals.reduce(
    (sum, g) => sum + (g.explicitlyReservedPaise && g.explicitlyReservedPaise > 0 ? g.explicitlyReservedPaise : 0),
    0
  );
  const explicitReservedGoalsPaise =
    params.explicitReservedGoalsPaise !== undefined
      ? Math.max(0, Math.floor(params.explicitReservedGoalsPaise))
      : explicitFromGoals;

  const monthSummary =
    params.monthTransactions != null
      ? summarise(todayISO.slice(0, 7), params.monthTransactions)
      : null;

  if (!params.runwayInput) {
    const wishReport = analyzeWishGoals({
      goals: normalizedGoals,
      todayISO,
      dailySafeToSpendPaise: null,
    });
    return {
      status: "unavailable",
      todayISO,
      missingInputs: runway.missingInputs,
      reason: runway.reason ?? "Financial data is unavailable.",
      confirmedCashPaise: null,
      availableLiquidityPaise: null,
      sustainableCapitalPaise: null,
      safetyCushionPaise: 0,
      safeToSpendPaise: null,
      dailySpendingAllowancePaise: null,
      remainingMonthlyAllowancePaise: null,
      receivablesPaise: 0,
      obligations: {
        totalLiabilitiesPaise: 0,
        peerDebtLiabilityPaise: 0,
        groupLiabilityPaise: 0,
        overdueCommitmentsPaise: 0,
        upcomingCommitmentsUntilIncomePaise: 0,
        upcomingCommitmentsMonthPaise: 0,
        upcomingCommitmentsCount: 0,
        overdueDebtCount: 0,
        debtPressureLevel: "none",
      },
      monthSummary,
      runway,
      safeToSpend: null,
      financialHealth: null,
      debtPlan: null,
      wishReport,
    };
  }

  const safeToSpend = calculateSafeToSpend({
    runwayInput: params.runwayInput,
    todayISO,
    explicitReservedGoalsPaise,
    conservativeFallbackDays: params.conservativeFallbackDays,
  });

  const confirmedCashPaise =
    safeToSpend.confirmedAvailableCashPaise ?? runway.confirmedBalancePaise;

  const debtPlan = buildDebtRepaymentPlan({
    peerDebts: params.runwayInput.peerDebts,
    groupSplits: params.runwayInput.groupSplits,
    creditorNamesById: params.creditorNamesById,
    todayISO,
    dailyRepaymentBudgetPaise: params.dailyRepaymentBudgetPaise,
    availableCashForDebtPaise:
      confirmedCashPaise !== null ? confirmedCashPaise : undefined,
  });

  const financialHealth = assessFinancialHealth({
    runwayInput: params.runwayInput,
    todayISO,
    periodEarnedIncomePaise: monthSummary?.earnedIncome,
    periodExpensesPaise: monthSummary?.expense,
  });

  const wishReport = analyzeWishGoals({
    goals: normalizedGoals,
    todayISO,
    dailySafeToSpendPaise: safeToSpend.dailySpendingAllowancePaise,
  });

  const overdueDebtCount = debtPlan.obligations.filter(
    (o) => o.urgency === "overdue"
  ).length;

  const totalLiabilitiesPaise =
    safeToSpend.status === "CONFIRMED"
      ? safeToSpend.inputs.totalLiabilitiesPaise
      : debtPlan.totalOwedPaise;

  const peerDebtLiabilityPaise =
    safeToSpend.status === "CONFIRMED"
      ? safeToSpend.inputs.peerDebtLiabilityPaise
      : debtPlan.peerOwedPaise;

  const groupLiabilityPaise =
    safeToSpend.status === "CONFIRMED"
      ? safeToSpend.inputs.groupLiabilityPaise
      : debtPlan.groupOwedPaise;

  const receivablesPaise =
    safeToSpend.status === "CONFIRMED"
      ? safeToSpend.inputs.totalReceivablesPaise
      : debtPlan.totalReceivablePaise;

  const status: FinancialIntelligenceStatus =
    safeToSpend.status === "INVALID_INPUT" || runway.status === "INVALID_INPUT"
      ? "invalid_input"
      : safeToSpend.status === "CONFIRMED" && runway.status === "PROJECTED"
        ? "ready"
        : "insufficient_data";

  return {
    status,
    todayISO,
    missingInputs: runway.missingInputs,
    reason: safeToSpend.reason ?? runway.reason,
    confirmedCashPaise,
    availableLiquidityPaise:
      runway.availableLiquidityPaise ??
      runway.startingSpendableBalancePaise ??
      null,
    sustainableCapitalPaise:
      safeToSpend.sustainableCapitalPaise ??
      runway.sustainableCapitalPaise ??
      null,
    safetyCushionPaise:
      safeToSpend.status === "CONFIRMED"
        ? safeToSpend.inputs.safeBufferPaise
        : runway.safeRunwayBufferPaise ?? 0,
    safeToSpendPaise: safeToSpend.safeToSpendUntilNextIncomePaise,
    dailySpendingAllowancePaise: safeToSpend.dailySpendingAllowancePaise,
    remainingMonthlyAllowancePaise: safeToSpend.remainingMonthlyAllowancePaise,
    receivablesPaise,
    obligations: {
      totalLiabilitiesPaise,
      peerDebtLiabilityPaise,
      groupLiabilityPaise,
      overdueCommitmentsPaise: safeToSpend.inputs.overdueCommitmentsPaise,
      upcomingCommitmentsUntilIncomePaise:
        safeToSpend.inputs.upcomingCommitmentsUntilIncomePaise,
      upcomingCommitmentsMonthPaise:
        safeToSpend.inputs.upcomingCommitmentsMonthPaise,
      upcomingCommitmentsCount: params.runwayInput.commitments.length,
      overdueDebtCount,
      debtPressureLevel: deriveDebtPressureLevel(
        totalLiabilitiesPaise,
        confirmedCashPaise,
        overdueDebtCount
      ),
    },
    monthSummary,
    runway,
    safeToSpend,
    financialHealth,
    debtPlan,
    wishReport,
  };
}
