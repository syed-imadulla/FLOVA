// =====================================================================
// FLOVA Statistical Income Forecasting Engine (Owner: M3 / Phase 15)
// Projects future earnings based on historical confirmed income, payout cadences,
// and earning variability. Communicates confidence bounds and data availability.
// Invariant: Expected payouts and predicted earnings remain strictly separate.
// =====================================================================

import type { Paise, Transaction, Payout } from "../types/contracts";
import { toPaise } from "../lib/money";

export interface IncomeForecastInput {
  transactions: Array<Partial<Transaction> & { id: string; type: "income" | "expense"; amountPaise: Paise; date: string }>;
  payouts?: Payout[];
  forecastHorizonDays?: 7 | 14 | 30;
}

export interface IncomeForecastResult {
  hasSufficientData: boolean;
  forecastPeriodDays: number;
  expectedPaise: Paise;
  lowerBoundPaise: Paise;
  upperBoundPaise: Paise;
  confidence: "high" | "moderate" | "low" | "insufficient";
  averageDailyIncomePaise: Paise;
  historicalSampleCount: number;
  dataSummary: string;
}

/**
 * Projects future earnings using historical confirmed income records.
 */
export function generateIncomeForecast(input: IncomeForecastInput): IncomeForecastResult {
  const { transactions, forecastHorizonDays = 7 } = input;

  // Filter only personal confirmed income transactions
  const incomeRecords = transactions.filter(
    (t) => t.type === "income" && (!t.ownership || t.ownership === "mine")
  );

  if (incomeRecords.length < 3) {
    return {
      hasSufficientData: false,
      forecastPeriodDays: forecastHorizonDays,
      expectedPaise: 0,
      lowerBoundPaise: 0,
      upperBoundPaise: 0,
      confidence: "insufficient",
      averageDailyIncomePaise: 0,
      historicalSampleCount: incomeRecords.length,
      dataSummary: "Need at least 3 confirmed income entries to generate a realistic earning forecast.",
    };
  }

  // Calculate distinct calendar days with income
  const amounts = incomeRecords.map((t) => t.amountPaise ?? (t.amount ? toPaise(t.amount) : 0));
  const totalHistoricalIncomePaise = amounts.reduce((acc, v) => acc + v, 0);

  // Group by date to find daily averages
  const dateTotals: Record<string, number> = {};
  for (const t of incomeRecords) {
    const d = t.date || t.transaction_date || "unknown";
    const amt = t.amountPaise ?? (t.amount ? toPaise(t.amount) : 0);
    dateTotals[d] = (dateTotals[d] || 0) + amt;
  }

  const dailyAmounts = Object.values(dateTotals);
  const activeDaysCount = dailyAmounts.length;
  const meanDailyPaise = Math.round(totalHistoricalIncomePaise / Math.max(1, activeDaysCount));

  // Compute variance and standard deviation
  let varianceSum = 0;
  for (const amt of dailyAmounts) {
    varianceSum += Math.pow(amt - meanDailyPaise, 2);
  }
  const stdDevPaise = Math.round(Math.sqrt(varianceSum / Math.max(1, activeDaysCount)));

  // Estimate forecast over the requested horizon
  // Assuming independent earner active ratio (e.g. 5 to 6 earning days per week)
  const activeDaysRatio = Math.min(1.0, activeDaysCount / 14); // relative to typical fortnight
  const projectedActiveDays = Math.max(1, Math.round(forecastHorizonDays * (activeDaysRatio > 0 ? activeDaysRatio : 0.7)));

  const expectedPaise = meanDailyPaise * projectedActiveDays;
  const marginPaise = Math.round(stdDevPaise * Math.sqrt(projectedActiveDays));

  const lowerBoundPaise = Math.max(0, expectedPaise - marginPaise);
  const upperBoundPaise = expectedPaise + marginPaise;

  const coefficientOfVariation = meanDailyPaise > 0 ? stdDevPaise / meanDailyPaise : 1.0;
  let confidence: "high" | "moderate" | "low" = "moderate";
  if (activeDaysCount >= 7 && coefficientOfVariation < 0.35) {
    confidence = "high";
  } else if (coefficientOfVariation > 0.75 || activeDaysCount < 4) {
    confidence = "low";
  }

  return {
    hasSufficientData: true,
    forecastPeriodDays: forecastHorizonDays,
    expectedPaise,
    lowerBoundPaise,
    upperBoundPaise,
    confidence,
    averageDailyIncomePaise: meanDailyPaise,
    historicalSampleCount: incomeRecords.length,
    dataSummary: `Based on ${incomeRecords.length} recorded payments across ${activeDaysCount} active earning days.`,
  };
}
