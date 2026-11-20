// =====================================================================
// FLOVA Financial Engine — Daily Runway Projection (M3 Phase 2)
// Pure, deterministic TypeScript calculation of confirmed-only cash-flow
// projection across a requested calendar horizon.
// Independent of React, Supabase, network fetch, and Gemini.
// =====================================================================

import type { ISODate, Paise, RunwayInput } from "../types/contracts";
import { calculateConfirmedBalance } from "./balance";
import { isValidISODate, isValidPaise, safeAdd, safeSub } from "./validation";

export interface DailyProjectionEntry {
  dayIndex: number;
  date: ISODate;
  openingBalancePaise: number;
  essentialExpensePaise: Paise;
  commitmentDeductionPaise: Paise;
  otherTransactionAdjustmentPaise: number;
  netChangePaise: number;
  closingBalancePaise: number;
  commitmentsApplied: Array<{ id: string; title: string; amount: Paise }>;
  remainingLivingBudgetPaise?: Paise;
  remainingWorkBudgetPaise?: Paise;
}

export type RunwayProjectionStatus =
  | "PROJECTED"
  | "INSUFFICIENT_INFORMATION"
  | "INVALID_INPUT";

export interface RunwayProjectionResult {
  status: RunwayProjectionStatus;
  startingConfirmedBalancePaise: number | null;
  dailyEssentialExpensePaise: Paise | null;
  horizonDays: number;
  runwayDays: number | null;
  firstShortfallDate: ISODate | null;
  projectedZeroBalanceDate: ISODate | null;
  minClosingBalancePaise: number | null;
  projections: DailyProjectionEntry[];
  reason?: string;
}

export interface RunwayProjectionInput extends RunwayInput {
  horizonDays?: number;
  startDate?: ISODate;
}

/**
 * Deterministically adds a number of calendar days to an ISO YYYY-MM-DD date using UTC math.
 */
export function addDays(dateStr: ISODate, days: number): ISODate {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const year = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates confirmed-only day-by-day cash-flow projection and runway metrics:
 *
 * 1. Starting Balance:
 *    - Reuses calculateConfirmedBalance().
 *    - If check-in is missing or invalid, returns INSUFFICIENT_INFORMATION / INVALID_INPUT.
 *
 * 2. Essential Daily Expense Baseline:
 *    - Both dailyLivingEstimate and dailyWorkEstimate must be defined numbers (not null).
 *    - If either is null, returns INSUFFICIENT_INFORMATION (never fabricates 0).
 *
 * 3. Daily Progression (for each day in horizon):
 *    - Day 0 opens with starting confirmed personal balance.
 *    - Subsequent days open with the previous day's closing balance.
 *    - Deducts essential daily expense (living + work).
 *    - Deducts confirmed personal commitments due on that specific date (applied once).
 *    - Excludes expected, scheduled, unearned, or cancelled payouts.
 *    - Excludes custodial COD money.
 *    - Prevents double counting: transactions already in starting balance are not reapplied.
 *    - Preserves negative balances (never clamps to 0).
 *
 * 4. Output Metrics:
 *    - firstShortfallDate: First date when projected closing balance becomes negative (< 0).
 *    - projectedZeroBalanceDate: First date when projected closing balance reaches zero or below (<= 0).
 *    - runwayDays: Count of complete days essential expenses are fully covered before first shortfall.
 */
export function calculateDailyRunway(input: RunwayProjectionInput): RunwayProjectionResult {
  const horizon = input.horizonDays && input.horizonDays > 0 ? Math.floor(input.horizonDays) : 30;

  // 1. Compute and validate confirmed starting balance
  const balanceResult = calculateConfirmedBalance(input);
  if (balanceResult.status !== "CONFIRMED") {
    return {
      status: balanceResult.status,
      startingConfirmedBalancePaise: null,
      dailyEssentialExpensePaise: null,
      horizonDays: horizon,
      runwayDays: null,
      firstShortfallDate: null,
      projectedZeroBalanceDate: null,
      minClosingBalancePaise: null,
      projections: [],
      reason: balanceResult.reason,
    };
  }

  // 2. Validate essential daily expense baseline
  const { dailyLivingEstimate, dailyWorkEstimate } = input.profile;
  if (dailyLivingEstimate === null || dailyWorkEstimate === null) {
    return {
      status: "INSUFFICIENT_INFORMATION",
      startingConfirmedBalancePaise: balanceResult.confirmedBalancePaise,
      dailyEssentialExpensePaise: null,
      horizonDays: horizon,
      runwayDays: null,
      firstShortfallDate: null,
      projectedZeroBalanceDate: null,
      minClosingBalancePaise: null,
      projections: [],
      reason:
        "Missing daily expense baseline: dailyLivingEstimate and dailyWorkEstimate must both be specified (not null) to calculate runway.",
    };
  }

  if (!isValidPaise(dailyLivingEstimate) || !isValidPaise(dailyWorkEstimate)) {
    return {
      status: "INVALID_INPUT",
      startingConfirmedBalancePaise: balanceResult.confirmedBalancePaise,
      dailyEssentialExpensePaise: null,
      horizonDays: horizon,
      runwayDays: null,
      firstShortfallDate: null,
      projectedZeroBalanceDate: null,
      minClosingBalancePaise: null,
      projections: [],
      reason: "Daily expense estimates must be valid non-negative integer paise.",
    };
  }

  const dailyEssentialExpense = safeAdd(dailyLivingEstimate, dailyWorkEstimate);

  // 3. Anchor date determination
  const startDate = input.startDate ?? input.latestCheckin!.checkedAt.slice(0, 10);
  if (!isValidISODate(startDate)) {
    return {
      status: "INVALID_INPUT",
      startingConfirmedBalancePaise: balanceResult.confirmedBalancePaise,
      dailyEssentialExpensePaise: dailyEssentialExpense,
      horizonDays: horizon,
      runwayDays: null,
      firstShortfallDate: null,
      projectedZeroBalanceDate: null,
      minClosingBalancePaise: null,
      projections: [],
      reason: `Invalid start date for projection: ${startDate}. Expected YYYY-MM-DD.`,
    };
  }

  // 4. Group upcoming commitments by due date
  const commitmentsByDate = new Map<ISODate, Array<{ id: string; title: string; amount: Paise }>>();
  if (Array.isArray(input.commitments)) {
    for (const c of input.commitments) {
      if (c && isValidPaise(c.amount) && c.amount > 0 && isValidISODate(c.dueDate)) {
        const existing = commitmentsByDate.get(c.dueDate) ?? [];
        existing.push({ id: c.id, title: c.title, amount: c.amount });
        commitmentsByDate.set(c.dueDate, existing);
      }
    }
  }

  // 5. Option A — Remaining Daily Budget Calculation for Current Projection Date (Day 0)
  // Deduct only estimated daily expenses that the worker has not already spent today.
  // This prevents double-counting expenses already included in the confirmed available balance.
  let livingExpensesSpentToday: Paise = 0;
  let workExpensesSpentToday: Paise = 0;

  const seenExpenseTxIds = new Set<string>();
  if (Array.isArray(input.transactionsSinceCheckin)) {
    for (const tx of input.transactionsSinceCheckin) {
      if (!tx || seenExpenseTxIds.has(tx.id)) {
        continue;
      }
      seenExpenseTxIds.add(tx.id);

      // Count user's own expenses occurring on the current projection date (startDate)
      // Note: Counted even if created before check-in because they consume today's budget allocation.
      if (tx.date === startDate && tx.ownership === "mine" && tx.type === "expense") {
        if (tx.expenseType === "living") {
          livingExpensesSpentToday = safeAdd(livingExpensesSpentToday, tx.amount);
        } else if (tx.expenseType === "work") {
          workExpensesSpentToday = safeAdd(workExpensesSpentToday, tx.amount);
        }
      }
    }
  }

  // Budgets cannot be negative; overspending in one category does not create additional spending
  const remainingLiving = Math.max(0, safeSub(dailyLivingEstimate, livingExpensesSpentToday));
  const remainingWork = Math.max(0, safeSub(dailyWorkEstimate, workExpensesSpentToday));
  const remainingDailyBudget = safeAdd(remainingLiving, remainingWork);

  // 6. Day-by-day cash flow projection
  const projections: DailyProjectionEntry[] = [];
  let currentBalance: number = balanceResult.confirmedBalancePaise!;
  let firstShortfallDate: ISODate | null = null;
  let projectedZeroBalanceDate: ISODate | null = null;
  let minClosingBalance: number = currentBalance;
  let coveredDaysCount = 0;

  for (let d = 0; d < horizon; d++) {
    const currentDate = addDays(startDate, d);
    const openingBalance = currentBalance;

    // Commitment deductions for this day
    let dayCommitmentTotal: Paise = 0;
    const dayCommitments = commitmentsByDate.get(currentDate) ?? [];
    for (const comm of dayCommitments) {
      dayCommitmentTotal = safeAdd(dayCommitmentTotal, comm.amount);
    }

    // Option A: On Day 0 (current projection date), deduct only the remaining daily budget.
    // From tomorrow onward (d > 0), apply the full daily living + work baseline.
    const dayEssentialExpense = d === 0 ? remainingDailyBudget : dailyEssentialExpense;

    const totalOutflow = safeAdd(dayEssentialExpense, dayCommitmentTotal);
    const otherAdjustments = 0; // Pure confirmed-only scenario: no speculative income

    const netChange = safeSub(otherAdjustments, totalOutflow);
    const closingBalance = safeAdd(openingBalance, netChange);

    projections.push({
      dayIndex: d,
      date: currentDate,
      openingBalancePaise: openingBalance,
      essentialExpensePaise: dayEssentialExpense,
      commitmentDeductionPaise: dayCommitmentTotal,
      otherTransactionAdjustmentPaise: otherAdjustments,
      netChangePaise: netChange,
      closingBalancePaise: closingBalance,
      commitmentsApplied: [...dayCommitments],
      ...(d === 0 ? {
        remainingLivingBudgetPaise: remainingLiving,
        remainingWorkBudgetPaise: remainingWork,
      } : {}),
    });

    if (closingBalance < minClosingBalance) {
      minClosingBalance = closingBalance;
    }

    // Zero-balance date: First date closing balance reaches zero or below (<= 0)
    if (projectedZeroBalanceDate === null && closingBalance <= 0) {
      projectedZeroBalanceDate = currentDate;
    }

    // Shortfall date: First date closing balance becomes strictly negative (< 0)
    if (firstShortfallDate === null) {
      if (closingBalance < 0) {
        firstShortfallDate = currentDate;
      } else {
        coveredDaysCount++;
      }
    }

    currentBalance = closingBalance;
  }

  const runwayDays = firstShortfallDate !== null ? coveredDaysCount : horizon;

  return {
    status: "PROJECTED",
    startingConfirmedBalancePaise: balanceResult.confirmedBalancePaise,
    dailyEssentialExpensePaise: dailyEssentialExpense,
    horizonDays: horizon,
    runwayDays,
    firstShortfallDate,
    projectedZeroBalanceDate,
    minClosingBalancePaise: minClosingBalance,
    projections,
  };
}
