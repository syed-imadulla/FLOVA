// =====================================================================
// FLOVA 2.0 | WISH Goal Intelligence Engine (Sprint 5F)
// Pure deterministic integer-paise analysis for WISH savings goals.
// Accounting invariants:
//   - A WISH target is NOT automatically reserved money.
//   - Only explicitly reserved amounts reduce safe-to-spend.
//   - Goal progress stays strictly separate from confirmed account balances.
//   - Never promises a completion date when contribution rate is unknown.
// =====================================================================

import { toPaise } from "../lib/money";
import type { ISODate, Paise, WishGoal } from "../types/contracts";
import { addDays } from "./runway";
import { isValidISODate, isValidPaise, safeAdd } from "./validation";

export type WishGoalEngineStatus = "active" | "completed" | "paused" | "cancelled" | "archived";
export type WishContributionCadence = "daily" | "weekly" | "monthly";

export interface WishGoalInput {
  id: string;
  title: string;
  targetPaise: Paise;
  savedPaise: Paise;
  targetDate?: ISODate | null;
  status: WishGoalEngineStatus;
  contributionPaise?: Paise;
  cadence?: WishContributionCadence;
  /** Optional explicit user-reserved paise for this goal (never auto-reserved from target). */
  explicitlyReservedPaise?: Paise;
}

export interface WishGoalAnalysis {
  id: string;
  title: string;
  status: WishGoalEngineStatus;
  targetPaise: Paise;
  savedPaise: Paise;
  remainingPaise: Paise;
  percentCompleted: number;
  isCompleted: boolean;
  isActive: boolean;
  targetDate: ISODate | null;
  daysRemaining: number | null;
  isOverdue: boolean;
  requiredDailyPaise: Paise | null;
  requiredWeeklyPaise: Paise | null;
  requiredMonthlyPaise: Paise | null;
  estimatedDaysToComplete: number | null;
  estimatedCompletionDate: ISODate | null;
  achievableByTargetDate: boolean | null;
  needsAttention: boolean;
  attentionReason: string | null;
  explanation: string;
}

export interface WishIntelligenceInput {
  goals: WishGoalInput[];
  todayISO: ISODate;
  /** Optional daily safe-to-spend allowance (paise) to check capacity without double-counting. */
  dailySafeToSpendPaise?: Paise | null;
}

export interface WishIntelligenceReport {
  totalSavedPaise: Paise;
  totalRemainingActivePaise: Paise;
  totalRequiredDailyPaise: Paise;
  totalRequiredWeeklyPaise: Paise;
  /** Only explicitly reserved goal paise; ordinary WISH targets are 0 here. */
  explicitReservedGoalsPaise: Paise;
  hasInsufficientSafeToSpend: boolean;
  activeCount: number;
  completedCount: number;
  pausedCount: number;
  cancelledCount: number;
  goalNeedingAttention: WishGoalAnalysis | null;
  goals: WishGoalAnalysis[];
  summary: string;
}

function diffCalendarDays(fromISO: ISODate, toISO: ISODate): number {
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}

/**
 * Converts a Supabase WishGoal row into integer-paise WishGoalInput.
 */
export function normalizeWishGoalForEngine(
  goal: WishGoal,
  options?: {
    contributionPaise?: Paise;
    cadence?: WishContributionCadence;
    explicitlyReservedPaise?: Paise;
  }
): WishGoalInput {
  return {
    id: goal.id,
    title: goal.title,
    targetPaise: toPaise(goal.target_amount),
    savedPaise: toPaise(goal.saved_amount),
    targetDate: goal.target_date ?? null,
    status: goal.status,
    contributionPaise: options?.contributionPaise,
    cadence: options?.cadence,
    explicitlyReservedPaise: options?.explicitlyReservedPaise,
  };
}

/**
 * Simulates completion timeline for a given contribution rate (e.g., ₹500/week).
 * Returns null ETA if contributionPaise <= 0 or goal is paused/cancelled/archived.
 */
export function simulateWishContribution(
  goal: Pick<WishGoalInput, "targetPaise" | "savedPaise" | "status">,
  contributionPaise: Paise,
  cadence: WishContributionCadence,
  todayISO: ISODate
): {
  remainingPaise: Paise;
  estimatedDays: number | null;
  estimatedCompletionDate: ISODate | null;
} {
  const target = Math.max(0, Math.floor(goal.targetPaise));
  const saved = Math.max(0, Math.floor(goal.savedPaise));
  const remainingPaise = Math.max(0, target - saved);

  if (goal.status === "completed" || (target > 0 && remainingPaise === 0)) {
    return { remainingPaise: 0, estimatedDays: 0, estimatedCompletionDate: todayISO };
  }
  if (goal.status !== "active" || !isValidPaise(contributionPaise) || contributionPaise <= 0 || !isValidISODate(todayISO)) {
    return { remainingPaise, estimatedDays: null, estimatedCompletionDate: null };
  }

  const periodDays = cadence === "daily" ? 1 : cadence === "weekly" ? 7 : 30;
  const periods = Math.ceil(remainingPaise / contributionPaise);
  const estimatedDays = periods * periodDays;
  return {
    remainingPaise,
    estimatedDays,
    estimatedCompletionDate: addDays(todayISO, estimatedDays),
  };
}

export function analyzeWishGoals(input: WishIntelligenceInput): WishIntelligenceReport {
  const { goals, todayISO, dailySafeToSpendPaise } = input;
  if (!isValidISODate(todayISO)) {
    throw new Error(`Invalid todayISO date: ${todayISO}. Expected YYYY-MM-DD.`);
  }

  let totalSavedPaise: Paise = 0;
  let totalRemainingActivePaise: Paise = 0;
  let totalRequiredDailyPaise: Paise = 0;
  let totalRequiredWeeklyPaise: Paise = 0;
  let explicitReservedGoalsPaise: Paise = 0;

  let activeCount = 0;
  let completedCount = 0;
  let pausedCount = 0;
  let cancelledCount = 0;

  const analyses: WishGoalAnalysis[] = [];

  for (const g of goals) {
    const targetPaise = Math.max(0, Math.floor(g.targetPaise));
    const savedPaise = Math.max(0, Math.floor(g.savedPaise));
    const remainingPaise = Math.max(0, targetPaise - savedPaise);
    const percentCompleted =
      targetPaise > 0 ? Math.min(100, Math.round((savedPaise / targetPaise) * 100)) : 0;

    const isCompleted = g.status === "completed" || (targetPaise > 0 && savedPaise >= targetPaise);
    const isActive = g.status === "active" && !isCompleted;

    if (isCompleted) completedCount++;
    else if (g.status === "active") activeCount++;
    else if (g.status === "paused") pausedCount++;
    else if (g.status === "cancelled" || g.status === "archived") cancelledCount++;

    if (g.status !== "cancelled" && g.status !== "archived") {
      totalSavedPaise = safeAdd(totalSavedPaise, savedPaise);
    }
    if (isActive) {
      totalRemainingActivePaise = safeAdd(totalRemainingActivePaise, remainingPaise);
      if (isValidPaise(g.explicitlyReservedPaise) && g.explicitlyReservedPaise! > 0) {
        explicitReservedGoalsPaise = safeAdd(explicitReservedGoalsPaise, g.explicitlyReservedPaise!);
      }
    }

    const targetDate = g.targetDate && isValidISODate(g.targetDate) ? g.targetDate : null;
    const daysRemaining = targetDate ? diffCalendarDays(todayISO, targetDate) : null;
    const isOverdue = isActive && daysRemaining !== null && daysRemaining < 0;

    let requiredDailyPaise: Paise | null = null;
    let requiredWeeklyPaise: Paise | null = null;
    let requiredMonthlyPaise: Paise | null = null;

    if (isActive && targetDate !== null && daysRemaining !== null) {
      const effectiveDays = Math.max(1, daysRemaining);
      requiredDailyPaise = Math.ceil(remainingPaise / effectiveDays);
      requiredWeeklyPaise = Math.min(remainingPaise, Math.ceil((remainingPaise * 7) / effectiveDays));
      requiredMonthlyPaise = Math.min(remainingPaise, Math.ceil((remainingPaise * 30) / effectiveDays));

      totalRequiredDailyPaise = safeAdd(totalRequiredDailyPaise, requiredDailyPaise);
      totalRequiredWeeklyPaise = safeAdd(totalRequiredWeeklyPaise, requiredWeeklyPaise);
    }

    const sim = simulateWishContribution(
      { targetPaise, savedPaise, status: isCompleted ? "completed" : g.status },
      g.contributionPaise ?? 0,
      g.cadence ?? "weekly",
      todayISO
    );

    let achievableByTargetDate: boolean | null = null;
    if (isCompleted) {
      achievableByTargetDate = true;
    } else if (isActive && targetDate !== null) {
      if (isOverdue) {
        achievableByTargetDate = false;
      } else if (
        dailySafeToSpendPaise !== null &&
        dailySafeToSpendPaise !== undefined &&
        requiredDailyPaise !== null
      ) {
        achievableByTargetDate = requiredDailyPaise <= dailySafeToSpendPaise;
        if (achievableByTargetDate && sim.estimatedCompletionDate !== null) {
          achievableByTargetDate = sim.estimatedCompletionDate <= targetDate;
        }
      } else if (sim.estimatedCompletionDate !== null) {
        achievableByTargetDate = sim.estimatedCompletionDate <= targetDate;
      }
    }

    let needsAttention = false;
    let attentionReason: string | null = null;
    if (isActive) {
      if (isOverdue) {
        needsAttention = true;
        attentionReason = `Target date ${targetDate} has passed with ₹${(remainingPaise / 100).toLocaleString("en-IN")} remaining.`;
      } else if (achievableByTargetDate === false) {
        needsAttention = true;
        attentionReason = `Requires ₹${((requiredDailyPaise ?? 0) / 100).toLocaleString("en-IN")}/day, which exceeds current safe-to-spend pace.`;
      }
    }

    let explanation = "";
    if (isCompleted) {
      explanation = `${g.title} is completed (₹${(savedPaise / 100).toLocaleString("en-IN")} saved).`;
    } else if (g.status === "paused") {
      explanation = `${g.title} is paused with ₹${(remainingPaise / 100).toLocaleString("en-IN")} remaining.`;
    } else if (g.status === "cancelled" || g.status === "archived") {
      explanation = `${g.title} is ${g.status}.`;
    } else if (requiredWeeklyPaise !== null) {
      explanation = `${g.title}: ₹${(remainingPaise / 100).toLocaleString("en-IN")} left; save ₹${(requiredWeeklyPaise / 100).toLocaleString("en-IN")}/week to reach by ${targetDate}.`;
    } else if (sim.estimatedCompletionDate !== null) {
      explanation = `${g.title}: ₹${(remainingPaise / 100).toLocaleString("en-IN")} left; estimated completion on ${sim.estimatedCompletionDate}.`;
    } else {
      explanation = `${g.title}: ₹${(remainingPaise / 100).toLocaleString("en-IN")} left. Set a contribution rate or target date to project completion.`;
    }

    analyses.push({
      id: g.id,
      title: g.title,
      status: isCompleted ? "completed" : g.status,
      targetPaise,
      savedPaise,
      remainingPaise,
      percentCompleted,
      isCompleted,
      isActive,
      targetDate,
      daysRemaining,
      isOverdue,
      requiredDailyPaise,
      requiredWeeklyPaise,
      requiredMonthlyPaise,
      estimatedDaysToComplete: sim.estimatedDays,
      estimatedCompletionDate: sim.estimatedCompletionDate,
      achievableByTargetDate,
      needsAttention,
      attentionReason,
      explanation,
    });
  }

  const hasInsufficientSafeToSpend =
    dailySafeToSpendPaise !== null &&
    dailySafeToSpendPaise !== undefined &&
    totalRequiredDailyPaise > dailySafeToSpendPaise;

  const attentionCandidates = analyses
    .filter((a) => a.isActive && a.needsAttention)
    .sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      return (a.daysRemaining ?? 99999) - (b.daysRemaining ?? 99999);
    });
  const goalNeedingAttention = attentionCandidates[0] ?? null;

  const summary =
    activeCount === 0 && completedCount === 0
      ? "No active savings goals yet."
      : `Saved ₹${(totalSavedPaise / 100).toLocaleString("en-IN")} across goals with ₹${(totalRemainingActivePaise / 100).toLocaleString("en-IN")} remaining for ${activeCount} active goal(s).`;

  return {
    totalSavedPaise,
    totalRemainingActivePaise,
    totalRequiredDailyPaise,
    totalRequiredWeeklyPaise,
    explicitReservedGoalsPaise,
    hasInsufficientSafeToSpend,
    activeCount,
    completedCount,
    pausedCount,
    cancelledCount,
    goalNeedingAttention,
    goals: analyses,
    summary,
  };
}
