// =====================================================================
// FLOVA Smart Spending Intelligence Engine (Owner: M3 / Phase 15)
// Deterministic behavioral analysis of confirmed personal transactions.
// Identifies category distributions, living vs work splits, week-over-week velocity,
// and spending spikes.
// Invariant: Third-party money (not_mine) is strictly excluded from personal spending.
// =====================================================================

import type { Paise, Transaction } from "../types/contracts";
import { toPaise } from "../lib/money";
import { addDays } from "./runway";

export type TransactionRecord = Partial<Transaction> & {
  id: string;
  type: "income" | "expense";
  amountPaise: Paise;
  date: string;
  expenseType?: "work" | "living" | null;
  inflowCategory?: Transaction["inflow_category"];
};

export interface CategorySpending {
  category: string;
  totalPaise: Paise;
  percentage: number;
  transactionCount: number;
}

export const ANOMALY_THRESHOLDS = {
  MIN_EXPENSES_FOR_SPIKE: 3,
  MIN_SPIKE_PAISE: 100000, // ₹1,000
  SPIKE_MEAN_MULTIPLIER: 3,
  MIN_PRIOR_WEEK_FOR_WOW_PAISE: 50000, // ₹500
  WOW_SURGE_PERCENT: 40,
  MIN_PRIOR_CAT_PAISE: 30000, // ₹300
  CATEGORY_SURGE_MULTIPLIER: 2,
} as const;

export interface SpendingAnomaly {
  kind: "large_expense" | "category_spike" | "weekly_surge";
  category?: string;
  amountPaise: Paise;
  baselinePaise?: Paise;
  changePercent?: number;
  date?: string;
  message: string;
}

export interface SpendingIntelligenceReport {
  totalPersonalExpensesPaise: Paise;
  /** Total confirmed personal cash inflows (earned + non-earned). */
  totalPersonalIncomePaise: Paise;
  /** Confirmed earned income only (legacy null inflow_category falls back to 'earned'). */
  earnedIncomePaise: Paise;
  /** Confirmed non-earned inflows (family_support, pocket_money, gift, donation). */
  nonEarnedInflowPaise: Paise;
  livingPaise: Paise;
  workPaise: Paise;
  livingPercent: number;
  workPercent: number;
  topCategories: CategorySpending[];
  recentWeekExpensesPaise: Paise;
  previousWeekExpensesPaise: Paise;
  weekOverWeekChangePercent: number | null;
  highSpendingSpikes: Array<{ id: string; category: string; amountPaise: Paise; description?: string; date: string }>;
  anomalies: SpendingAnomaly[];
  insights: string[];
}

/**
 * Computes deterministic spending intelligence metrics from confirmed transactions.
 */
export function analyzeSpendingIntelligence(
  transactions: TransactionRecord[],
  todayISO: string
): SpendingIntelligenceReport {
  // Filter only personal confirmed transactions (exclude third-party / not_mine)
  const personalTxs = transactions.filter(
    (t) => !t.ownership || t.ownership === "mine"
  );

  let totalPersonalExpensesPaise: Paise = 0;
  let totalPersonalIncomePaise: Paise = 0;
  let earnedIncomePaise: Paise = 0;
  let nonEarnedInflowPaise: Paise = 0;
  let livingPaise: Paise = 0;
  let workPaise: Paise = 0;

  const categoryMap: Record<string, { totalPaise: Paise; count: number }> = {};
  const expenseAmounts: number[] = [];

  // Pure UTC ISO calendar-date windows:
  // Recent 7-day window: [today - 6 .. today] (7 calendar days inclusive)
  // Prior 7-day window:  [today - 13 .. today - 7] (7 calendar days inclusive)
  const recentWindowStart = addDays(todayISO, -6);
  const priorWindowStart = addDays(todayISO, -13);
  const priorWindowEnd = addDays(todayISO, -7);

  let recentWeekExpensesPaise: Paise = 0;
  let previousWeekExpensesPaise: Paise = 0;
  const recentCatTotals: Record<string, Paise> = {};
  const priorCatTotals: Record<string, Paise> = {};

  for (const t of personalTxs) {
    const amt = t.amountPaise ?? (t.amount ? toPaise(t.amount) : 0);
    const date = t.date || t.transaction_date || "";

    if (t.type === "income") {
      totalPersonalIncomePaise += amt;
      const inflowCat = t.inflowCategory ?? t.inflow_category ?? "earned";
      if (inflowCat === "earned") {
        earnedIncomePaise += amt;
      } else {
        nonEarnedInflowPaise += amt;
      }
    } else if (t.type === "expense") {
      totalPersonalExpensesPaise += amt;
      expenseAmounts.push(amt);

      const expType = t.expenseType || t.expense_type;
      if (expType === "work") {
        workPaise += amt;
      } else {
        livingPaise += amt;
      }

      const cat = t.category || "other";
      if (!categoryMap[cat]) {
        categoryMap[cat] = { totalPaise: 0, count: 0 };
      }
      categoryMap[cat].totalPaise += amt;
      categoryMap[cat].count += 1;

      // Week-over-week window using pure ISO date string comparison
      if (date && date >= recentWindowStart && date <= todayISO) {
        recentWeekExpensesPaise += amt;
        recentCatTotals[cat] = (recentCatTotals[cat] ?? 0) + amt;
      } else if (date && date >= priorWindowStart && date <= priorWindowEnd) {
        previousWeekExpensesPaise += amt;
        priorCatTotals[cat] = (priorCatTotals[cat] ?? 0) + amt;
      }
    }
  }

  // Percentages for living vs work
  const livingPercent = totalPersonalExpensesPaise > 0 ? Math.round((livingPaise / totalPersonalExpensesPaise) * 100) : 0;
  const workPercent = totalPersonalExpensesPaise > 0 ? Math.round((workPaise / totalPersonalExpensesPaise) * 100) : 0;

  // Top categories sorted by total spent
  const topCategories: CategorySpending[] = Object.entries(categoryMap)
    .map(([category, stats]) => ({
      category,
      totalPaise: stats.totalPaise,
      percentage: totalPersonalExpensesPaise > 0 ? Math.round((stats.totalPaise / totalPersonalExpensesPaise) * 100) : 0,
      transactionCount: stats.count,
    }))
    .sort((a, b) => b.totalPaise - a.totalPaise);

  // Week-over-week calculation
  let weekOverWeekChangePercent: number | null = null;
  if (previousWeekExpensesPaise > 0) {
    weekOverWeekChangePercent = Math.round(
      ((recentWeekExpensesPaise - previousWeekExpensesPaise) / previousWeekExpensesPaise) * 100
    );
  }

  // Detect high spending spikes (> 3x mean expense, guarded by minimum sample count)
  const meanExpensePaise = expenseAmounts.length > 0
    ? totalPersonalExpensesPaise / expenseAmounts.length
    : 0;
  const spikeThresholdPaise = Math.max(
    ANOMALY_THRESHOLDS.MIN_SPIKE_PAISE,
    meanExpensePaise * ANOMALY_THRESHOLDS.SPIKE_MEAN_MULTIPLIER
  );

  const highSpendingSpikes: Array<{ id: string; category: string; amountPaise: Paise; description?: string; date: string }> = [];
  const anomalies: SpendingAnomaly[] = [];

  if (expenseAmounts.length >= ANOMALY_THRESHOLDS.MIN_EXPENSES_FOR_SPIKE) {
    for (const t of personalTxs) {
      if (t.type === "expense") {
        const amt = t.amountPaise ?? (t.amount ? toPaise(t.amount) : 0);
        if (amt >= spikeThresholdPaise) {
          const cat = t.category || "other";
          const d = t.date || t.transaction_date || todayISO;
          highSpendingSpikes.push({
            id: t.id,
            category: cat,
            amountPaise: amt,
            description: t.description || undefined,
            date: d,
          });
          anomalies.push({
            kind: "large_expense",
            category: cat,
            amountPaise: amt,
            baselinePaise: Math.round(meanExpensePaise),
            date: d,
            message: `Large ${cat.replace(/_/g, " ")} expense of ₹${(amt / 100).toLocaleString("en-IN")} (>3× your ₹${(Math.round(meanExpensePaise) / 100).toLocaleString("en-IN")} average).`,
          });
        }
      }
    }
  }

  // Detect category spending surges (recent 7 days >= 2x prior 7 days with meaningful baseline)
  for (const [cat, recentAmt] of Object.entries(recentCatTotals)) {
    const priorAmt = priorCatTotals[cat] ?? 0;
    if (
      priorAmt >= ANOMALY_THRESHOLDS.MIN_PRIOR_CAT_PAISE &&
      recentAmt >= priorAmt * ANOMALY_THRESHOLDS.CATEGORY_SURGE_MULTIPLIER
    ) {
      const pct = Math.round(((recentAmt - priorAmt) / priorAmt) * 100);
      anomalies.push({
        kind: "category_spike",
        category: cat,
        amountPaise: recentAmt,
        baselinePaise: priorAmt,
        changePercent: pct,
        message: `${cat.replace(/_/g, " ")} spending jumped +${pct}% this week (₹${(recentAmt / 100).toLocaleString("en-IN")} vs ₹${(priorAmt / 100).toLocaleString("en-IN")} prior week).`,
      });
    }
  }

  // Detect significant overall week-over-week surge
  if (
    weekOverWeekChangePercent !== null &&
    previousWeekExpensesPaise >= ANOMALY_THRESHOLDS.MIN_PRIOR_WEEK_FOR_WOW_PAISE &&
    weekOverWeekChangePercent >= ANOMALY_THRESHOLDS.WOW_SURGE_PERCENT
  ) {
    anomalies.push({
      kind: "weekly_surge",
      amountPaise: recentWeekExpensesPaise,
      baselinePaise: previousWeekExpensesPaise,
      changePercent: weekOverWeekChangePercent,
      message: `Weekly spending rose +${weekOverWeekChangePercent}% (₹${(recentWeekExpensesPaise / 100).toLocaleString("en-IN")} vs ₹${(previousWeekExpensesPaise / 100).toLocaleString("en-IN")} prior week).`,
    });
  }

  // Generate grounded insights
  const insights: string[] = [];
  if (topCategories.length > 0) {
    const top = topCategories[0];
    const catLabel = top.category.replace(/_/g, " ");
    insights.push(`${catLabel.charAt(0).toUpperCase() + catLabel.slice(1)} is your top expense category (${top.percentage}% of all spending).`);
  }

  if (workPercent > 0 && livingPercent > 0) {
    insights.push(`Your spending is split ${workPercent}% work-related and ${livingPercent}% personal living.`);
  }

  if (weekOverWeekChangePercent !== null) {
    if (weekOverWeekChangePercent > 15) {
      insights.push(`Spending this week increased by ${weekOverWeekChangePercent}% compared to the prior 7 days.`);
    } else if (weekOverWeekChangePercent < -15) {
      insights.push(`Spending this week is ${Math.abs(weekOverWeekChangePercent)}% lower than the prior 7 days.`);
    }
  }

  if (highSpendingSpikes.length > 0) {
    insights.push(`Detected ${highSpendingSpikes.length} unusually large expense(s) exceeding normal daily range.`);
  }

  return {
    totalPersonalExpensesPaise,
    totalPersonalIncomePaise,
    earnedIncomePaise,
    nonEarnedInflowPaise,
    livingPaise,
    workPaise,
    livingPercent,
    workPercent,
    topCategories,
    recentWeekExpensesPaise,
    previousWeekExpensesPaise,
    weekOverWeekChangePercent,
    highSpendingSpikes,
    anomalies,
    insights,
  };
}
