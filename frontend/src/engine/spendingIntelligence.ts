// =====================================================================
// FLOVA Smart Spending Intelligence Engine (Owner: M3 / Phase 15)
// Deterministic behavioral analysis of confirmed personal transactions.
// Identifies category distributions, living vs work splits, week-over-week velocity,
// and spending spikes.
// Invariant: Third-party money (not_mine) is strictly excluded from personal spending.
// =====================================================================

import type { Paise, Transaction } from "../types/contracts";
import { toPaise } from "../lib/money";

export type TransactionRecord = Partial<Transaction> & {
  id: string;
  type: "income" | "expense";
  amountPaise: Paise;
  date: string;
  expenseType?: "work" | "living" | null;
};

export interface CategorySpending {
  category: string;
  totalPaise: Paise;
  percentage: number;
  transactionCount: number;
}

export interface SpendingIntelligenceReport {
  totalPersonalExpensesPaise: Paise;
  totalPersonalIncomePaise: Paise;
  livingPaise: Paise;
  workPaise: Paise;
  livingPercent: number;
  workPercent: number;
  topCategories: CategorySpending[];
  recentWeekExpensesPaise: Paise;
  previousWeekExpensesPaise: Paise;
  weekOverWeekChangePercent: number | null;
  highSpendingSpikes: Array<{ id: string; category: string; amountPaise: Paise; description?: string; date: string }>;
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
  let livingPaise: Paise = 0;
  let workPaise: Paise = 0;

  const categoryMap: Record<string, { totalPaise: Paise; count: number }> = {};
  const expenseAmounts: number[] = [];

  // Dates for week-over-week comparison
  const today = new Date(todayISO);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 14);
  const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split("T")[0];

  let recentWeekExpensesPaise: Paise = 0;
  let previousWeekExpensesPaise: Paise = 0;

  for (const t of personalTxs) {
    const amt = t.amountPaise ?? (t.amount ? toPaise(t.amount) : 0);
    const date = t.date || t.transaction_date || "";

    if (t.type === "income") {
      totalPersonalIncomePaise += amt;
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

      // Week-over-week window
      if (date && date >= sevenDaysAgoStr && date <= todayISO) {
        recentWeekExpensesPaise += amt;
      } else if (date && date >= fourteenDaysAgoStr && date < sevenDaysAgoStr) {
        previousWeekExpensesPaise += amt;
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

  // Detect high spending spikes (> 3x mean expense)
  const meanExpensePaise = expenseAmounts.length > 0
    ? totalPersonalExpensesPaise / expenseAmounts.length
    : 0;
  const spikeThresholdPaise = Math.max(100000, meanExpensePaise * 3); // at least ₹1,000 and 3x average

  const highSpendingSpikes: Array<{ id: string; category: string; amountPaise: Paise; description?: string; date: string }> = [];
  for (const t of personalTxs) {
    if (t.type === "expense") {
      const amt = t.amountPaise ?? (t.amount ? toPaise(t.amount) : 0);
      if (amt >= spikeThresholdPaise) {
        highSpendingSpikes.push({
          id: t.id,
          category: t.category || "other",
          amountPaise: amt,
          description: t.description || undefined,
          date: t.date || t.transaction_date || todayISO,
        });
      }
    }
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
    livingPaise,
    workPaise,
    livingPercent,
    workPercent,
    topCategories,
    recentWeekExpensesPaise,
    previousWeekExpensesPaise,
    weekOverWeekChangePercent,
    highSpendingSpikes,
    insights,
  };
}
