// =====================================================================
// FLOVA 2.0 | Deterministic Financial Health Engine (Sprint 5E)
// Evaluates runway coverage, buffer adequacy, debt-to-liquidity ratio,
// earned income vs expenses, net savings rate, and upcoming pressure
// using actual integer-paise records without arbitrary weighted scores.
// =====================================================================

import type { ISODate, Paise, RunwayInput } from "../types/contracts";
import { calculateAdaptiveBuffer } from "./adaptiveBuffer";
import { calculateConfirmedBalance } from "./balance";
import { buildDebtRepaymentPlan } from "./debtRepaymentPlanner";
import { calculateDailyRunway } from "./runway";
import { isValidISODate, isValidPaise, safeAdd } from "./validation";

export type HealthIndicatorStatus = "healthy" | "watch" | "attention" | "insufficient_data";

export interface FinancialHealthIndicator {
  id:
    | "runway_coverage"
    | "buffer_adequacy"
    | "debt_to_liquidity"
    | "income_vs_expense"
    | "net_savings_rate"
    | "upcoming_pressure";
  label: string;
  status: HealthIndicatorStatus;
  valueText: string;
  explanation: string;
}

export interface FinancialHealthInput {
  runwayInput: RunwayInput;
  todayISO: ISODate;
  /** Optional period earned income & personal expenses (in paise) for savings/trend indicators. */
  periodEarnedIncomePaise?: Paise;
  periodExpensesPaise?: Paise;
}

export interface FinancialHealthReport {
  overallStatus: HealthIndicatorStatus;
  summary: string;
  netSavingsRatePercent: number | null;
  debtToLiquidityPercent: number | null;
  indicators: FinancialHealthIndicator[];
}

export function assessFinancialHealth(input: FinancialHealthInput): FinancialHealthReport {
  const { runwayInput, todayISO } = input;
  const bal = calculateConfirmedBalance(runwayInput);
  const runway = calculateDailyRunway({ ...runwayInput, startDate: todayISO, horizonDays: 14 });

  const dailyLiving = runwayInput.profile.dailyLivingEstimate ?? 0;
  const dailyWork = runwayInput.profile.dailyWorkEstimate ?? 0;
  const bufferRec = calculateAdaptiveBuffer({
    profile: {
      work_profile: runwayInput.profile.workProfile,
      income_variability: runwayInput.profile.incomeVariability,
    },
    dailyLivingEstimatePaise: isValidPaise(dailyLiving) ? dailyLiving : 0,
    dailyWorkEstimatePaise: isValidPaise(dailyWork) ? dailyWork : 0,
    commitments: (runwayInput.commitments ?? []).map((c) => ({ amount: c.amount, status: "upcoming" })),
  });

  const debtPlan = buildDebtRepaymentPlan({
    peerDebts: runwayInput.peerDebts,
    groupSplits: runwayInput.groupSplits,
    todayISO: isValidISODate(todayISO) ? todayISO : "2026-11-27",
    availableCashForDebtPaise: bal.confirmedBalancePaise ?? undefined,
  });

  // Derive period earned income & expenses from input if not explicitly provided
  let earnedIncomePaise = input.periodEarnedIncomePaise ?? 0;
  let expensesPaise = input.periodExpensesPaise ?? 0;
  if (input.periodEarnedIncomePaise === undefined || input.periodExpensesPaise === undefined) {
    let calcEarned = 0;
    let calcExp = 0;
    for (const tx of runwayInput.transactionsSinceCheckin ?? []) {
      if (tx.ownership !== "mine") continue;
      if (tx.type === "income" && (tx.inflowCategory ?? "earned") === "earned") {
        calcEarned = safeAdd(calcEarned, tx.amount);
      } else if (tx.type === "expense") {
        calcExp = safeAdd(calcExp, tx.amount);
      }
    }
    if (input.periodEarnedIncomePaise === undefined) earnedIncomePaise = calcEarned;
    if (input.periodExpensesPaise === undefined) expensesPaise = calcExp;
  }

  const indicators: FinancialHealthIndicator[] = [];

  // 1. Runway coverage
  if (runway.status !== "PROJECTED" || runway.runwayDays === null) {
    indicators.push({
      id: "runway_coverage",
      label: "Runway coverage",
      status: "insufficient_data",
      valueText: "Needs baseline",
      explanation: "Record a balance check-in and daily living/work estimates to measure runway.",
    });
  } else {
    const targetDays = bufferRec.protectionDays;
    const days = runway.runwayDays;
    const status: HealthIndicatorStatus =
      days >= targetDays ? "healthy" : days >= 3 ? "watch" : "attention";
    indicators.push({
      id: "runway_coverage",
      label: "Runway coverage",
      status,
      valueText: `${days} day${days === 1 ? "" : "s"}`,
      explanation:
        status === "healthy"
          ? `Covers your ${targetDays}-day protection target.`
          : `Below your ${targetDays}-day recommended protection horizon.`,
    });
  }

  // 2. Emergency buffer adequacy
  const confirmed = bal.confirmedBalancePaise;
  if (confirmed === null || !bufferRec.hasSufficientData) {
    indicators.push({
      id: "buffer_adequacy",
      label: "Safety buffer",
      status: "insufficient_data",
      valueText: "Not enough data",
      explanation: "Add a balance check-in and daily cost baseline to check buffer adequacy.",
    });
  } else {
    const targetBuf = Math.max(
      runwayInput.profile.safeRunwayBuffer ?? 0,
      bufferRec.recommendedBufferPaise
    );
    const ratioPct = targetBuf > 0 ? Math.round((Math.max(0, confirmed) * 100) / targetBuf) : 100;
    const status: HealthIndicatorStatus =
      confirmed >= targetBuf ? "healthy" : ratioPct >= 50 ? "watch" : "attention";
    indicators.push({
      id: "buffer_adequacy",
      label: "Safety buffer",
      status,
      valueText: `${Math.min(999, ratioPct)}% of target`,
      explanation:
        status === "healthy"
          ? "Confirmed cash covers your recommended safety cushion."
          : `Confirmed cash is below your ₹${(targetBuf / 100).toLocaleString("en-IN")} safety target.`,
    });
  }

  // 3. Debt-to-liquidity ratio
  let debtToLiquidityPercent: number | null = null;
  if (confirmed === null) {
    indicators.push({
      id: "debt_to_liquidity",
      label: "Debt vs cash",
      status: "insufficient_data",
      valueText: "Needs check-in",
      explanation: "Record a balance check-in to compare liabilities against liquid cash.",
    });
  } else if (debtPlan.totalOwedPaise === 0) {
    debtToLiquidityPercent = 0;
    indicators.push({
      id: "debt_to_liquidity",
      label: "Debt vs cash",
      status: "healthy",
      valueText: "₹0 owed",
      explanation: "No outstanding peer or group debt.",
    });
  } else if (confirmed <= 0) {
    indicators.push({
      id: "debt_to_liquidity",
      label: "Debt vs cash",
      status: "attention",
      valueText: `₹${(debtPlan.totalOwedPaise / 100).toLocaleString("en-IN")} owed`,
      explanation: "Outstanding debt exceeds available confirmed cash.",
    });
  } else {
    debtToLiquidityPercent = Math.round((debtPlan.totalOwedPaise * 100) / confirmed);
    const status: HealthIndicatorStatus =
      debtToLiquidityPercent <= 25 ? "healthy" : debtToLiquidityPercent <= 60 ? "watch" : "attention";
    indicators.push({
      id: "debt_to_liquidity",
      label: "Debt vs cash",
      status,
      valueText: `${debtToLiquidityPercent}% of cash`,
      explanation: `₹${(debtPlan.totalOwedPaise / 100).toLocaleString("en-IN")} owed against ₹${(confirmed / 100).toLocaleString("en-IN")} cash.`,
    });
  }

  // 4. Earned income vs expenses & 5. Net savings rate
  let netSavingsRatePercent: number | null = null;
  if (earnedIncomePaise === 0 && expensesPaise === 0) {
    indicators.push(
      {
        id: "income_vs_expense",
        label: "Earned vs spent",
        status: "insufficient_data",
        valueText: "No records",
        explanation: "Record earned income and expenses to compare cash flow.",
      },
      {
        id: "net_savings_rate",
        label: "Net savings rate",
        status: "insufficient_data",
        valueText: "Needs earnings",
        explanation: "Need confirmed earned income records to calculate savings rate.",
      }
    );
  } else {
    const net = earnedIncomePaise - expensesPaise;
    const ieStatus: HealthIndicatorStatus =
      net >= 0 ? "healthy" : Math.abs(net) <= Math.round(earnedIncomePaise * 0.1) ? "watch" : "attention";
    indicators.push({
      id: "income_vs_expense",
      label: "Earned vs spent",
      status: ieStatus,
      valueText: `${net >= 0 ? "+" : "-"}₹${(Math.abs(net) / 100).toLocaleString("en-IN")}`,
      explanation:
        net >= 0
          ? "Earned income covers your personal spending."
          : "Personal spending exceeds earned income in this period.",
    });

    if (earnedIncomePaise === 0) {
      indicators.push({
        id: "net_savings_rate",
        label: "Net savings rate",
        status: "insufficient_data",
        valueText: "Needs earnings",
        explanation: "Need earned income (excluding gifts/borrowing) to compute savings rate.",
      });
    } else {
      netSavingsRatePercent = Math.round((net * 100) / earnedIncomePaise);
      const srStatus: HealthIndicatorStatus =
        netSavingsRatePercent >= 20 ? "healthy" : netSavingsRatePercent >= 0 ? "watch" : "attention";
      indicators.push({
        id: "net_savings_rate",
        label: "Net savings rate",
        status: srStatus,
        valueText: `${netSavingsRatePercent}%`,
        explanation:
          srStatus === "healthy"
            ? "Saving at least 20% of earned income."
            : srStatus === "watch"
              ? "Breaking even, but under 20% savings cushion."
              : "Negative savings rate — spending exceeds earned income.",
      });
    }
  }

  // 6. Upcoming financial pressure (overdue + next 7 days commitments vs sustainable capital)
  const due7AndOverdue = (runwayInput.commitments ?? [])
    .filter((c) => c.amount > 0 && c.dueDate <= (isValidISODate(todayISO) ? todayISO.slice(0, 10) : "2026-11-27"))
    .reduce((s, c) => safeAdd(s, c.amount), 0);
  const upcomingBillsTotal = (runwayInput.commitments ?? []).reduce(
    (s, c) => (c.amount > 0 ? safeAdd(s, c.amount) : s),
    0
  );
  const sustainable = runway.sustainableCapitalPaise ?? (confirmed !== null ? Math.max(0, confirmed - debtPlan.totalOwedPaise) : null);

  if (sustainable === null) {
    indicators.push({
      id: "upcoming_pressure",
      label: "Upcoming bills",
      status: "insufficient_data",
      valueText: "Needs check-in",
      explanation: "Check in your balance to measure upcoming bill pressure.",
    });
  } else if (upcomingBillsTotal === 0 && debtPlan.overdueTotalPaise === 0) {
    indicators.push({
      id: "upcoming_pressure",
      label: "Upcoming bills",
      status: "healthy",
      valueText: "Clear",
      explanation: "No upcoming bills or overdue debt recorded.",
    });
  } else {
    const totalPressure = safeAdd(upcomingBillsTotal, debtPlan.overdueTotalPaise);
    const status: HealthIndicatorStatus =
      due7AndOverdue > sustainable || totalPressure > sustainable
        ? "attention"
        : totalPressure > Math.round(sustainable * 0.6)
          ? "watch"
          : "healthy";
    indicators.push({
      id: "upcoming_pressure",
      label: "Upcoming bills",
      status,
      valueText: `₹${(totalPressure / 100).toLocaleString("en-IN")}`,
      explanation:
        status === "healthy"
          ? "Sustainable capital comfortably covers upcoming obligations."
          : "Upcoming bills/debts take a large share of your unencumbered cash.",
    });
  }

  // Deterministic rule-based overall assessment (no arbitrary weights)
  const attentionCount = indicators.filter((i) => i.status === "attention").length;
  const watchCount = indicators.filter((i) => i.status === "watch").length;
  const insufficientCount = indicators.filter((i) => i.status === "insufficient_data").length;

  let overallStatus: HealthIndicatorStatus = "healthy";
  if (insufficientCount >= 4 || confirmed === null) {
    overallStatus = "insufficient_data";
  } else if (attentionCount > 0) {
    overallStatus = "attention";
  } else if (watchCount > 0) {
    overallStatus = "watch";
  }

  const summary =
    overallStatus === "insufficient_data"
      ? "Add a balance check-in and a few income/expense records to unlock a complete health check."
      : overallStatus === "attention"
        ? `${attentionCount} area(s) need immediate attention based on your confirmed balances and obligations.`
        : overallStatus === "watch"
          ? `Finances are stable, with ${watchCount} area(s) to watch.`
          : "All measured financial health indicators look healthy.";

  return {
    overallStatus,
    summary,
    netSavingsRatePercent,
    debtToLiquidityPercent,
    indicators,
  };
}
