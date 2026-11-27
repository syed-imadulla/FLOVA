// =====================================================================
// FLOVA 2.0 | WISH Goal Intelligence & Simulator Model (Sprint 6E)
// Pure deterministic adapter over analyzeWishGoals, normalizeWishGoalForEngine,
// simulateWishContribution, and SafeToSpendResult.
// Invariants:
//   - Integer paise only.
//   - Ordinary WISH goals NEVER reduce confirmed cash or safe-to-spend.
//   - Read-only simulations NEVER reserve or transfer money.
// =====================================================================

import {
  analyzeWishGoals,
  normalizeWishGoalForEngine,
  simulateWishContribution,
  type SafeToSpendResult,
  type WishContributionCadence,
  type WishGoalAnalysis,
  type WishGoalInput,
  type WishIntelligenceReport,
} from "../engine";
import type { ISODate, Paise, WishGoal } from "../types/contracts";
import type { Wish } from "../wish/types";

export interface WishSimulationResult {
  contributionPaise: Paise;
  cadence: WishContributionCadence;
  dailyEquivalentPaise: Paise;
  remainingPaise: Paise;
  estimatedDays: number | null;
  estimatedCompletionDate: ISODate | null;
  compatibleWithSafeToSpend: boolean | null;
  dailySafeToSpendPaise: Paise | null;
  meetsTargetDate: boolean | null;
  daysVsTargetDate: number | null; // negative = days early, positive = days late
}

export interface WishIntelligenceViewModel {
  report: WishIntelligenceReport;
  primaryGoal: WishGoalAnalysis | null;
  otherGoals: WishGoalAnalysis[];
  dailySafeToSpendPaise: Paise | null;
  safeToSpendPaise: Paise | null;
  simulation: WishSimulationResult | null;
}

function diffCalendarDays(fromISO: ISODate, toISO: ISODate): number {
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}

export function simulateWishWithSafeToSpend(params: {
  goal: Pick<WishGoalAnalysis, "targetPaise" | "savedPaise" | "status" | "targetDate">;
  contributionPaise: Paise;
  cadence: WishContributionCadence;
  todayISO: ISODate;
  safeToSpend: SafeToSpendResult | null;
}): WishSimulationResult | null {
  const { goal, contributionPaise, cadence, todayISO, safeToSpend } = params;
  if (!Number.isSafeInteger(contributionPaise) || contributionPaise <= 0) {
    return null;
  }

  const sim = simulateWishContribution(
    {
      targetPaise: goal.targetPaise,
      savedPaise: goal.savedPaise,
      status: goal.status,
    },
    contributionPaise,
    cadence,
    todayISO
  );

  const dailyEquivalentPaise =
    cadence === "daily"
      ? contributionPaise
      : cadence === "weekly"
        ? Math.ceil(contributionPaise / 7)
        : Math.ceil(contributionPaise / 30);

  const dailySafeToSpendPaise =
    safeToSpend?.status === "CONFIRMED" ? safeToSpend.dailySpendingAllowancePaise : null;
  const safeToSpendTotal =
    safeToSpend?.status === "CONFIRMED" ? safeToSpend.safeToSpendUntilNextIncomePaise : null;

  let compatibleWithSafeToSpend: boolean | null = null;
  if (dailySafeToSpendPaise !== null) {
    const exceedsDaily = dailyEquivalentPaise > dailySafeToSpendPaise;
    const exceedsTotal =
      safeToSpendTotal !== null && dailyEquivalentPaise > safeToSpendTotal;
    compatibleWithSafeToSpend = !exceedsDaily && !exceedsTotal;
  }

  let meetsTargetDate: boolean | null = null;
  let daysVsTargetDate: number | null = null;
  if (goal.targetDate && sim.estimatedCompletionDate) {
    daysVsTargetDate = diffCalendarDays(goal.targetDate, sim.estimatedCompletionDate);
    meetsTargetDate = daysVsTargetDate <= 0;
  }

  return {
    contributionPaise,
    cadence,
    dailyEquivalentPaise,
    remainingPaise: sim.remainingPaise,
    estimatedDays: sim.estimatedDays,
    estimatedCompletionDate: sim.estimatedCompletionDate,
    compatibleWithSafeToSpend,
    dailySafeToSpendPaise,
    meetsTargetDate,
    daysVsTargetDate,
  };
}

export function buildWishIntelligenceModel(params: {
  wishGoals?: WishGoal[];
  localWish?: Wish | null;
  safeToSpend: SafeToSpendResult | null;
  todayISO: ISODate;
  simulatedContributionPaise?: Paise | null;
  simulatedCadence?: WishContributionCadence;
}): WishIntelligenceViewModel {
  const { wishGoals = [], localWish = null, safeToSpend, todayISO } = params;

  const goals: WishGoalInput[] = [];
  if (wishGoals.length > 0) {
    for (const g of wishGoals) {
      goals.push(
        normalizeWishGoalForEngine(g, {
          contributionPaise:
            localWish && localWish.id === g.id ? localWish.contributionPaise : undefined,
          cadence:
            localWish && localWish.id === g.id ? localWish.cadence : undefined,
          explicitlyReservedPaise: 0,
        })
      );
    }
  } else if (localWish) {
    goals.push({
      id: localWish.id,
      title: localWish.name,
      targetPaise: localWish.targetPaise,
      savedPaise: localWish.savedPaise,
      targetDate: null,
      status: localWish.status,
      contributionPaise: localWish.contributionPaise,
      cadence: localWish.cadence,
      explicitlyReservedPaise: 0,
    });
  }

  const dailySafeToSpendPaise =
    safeToSpend?.status === "CONFIRMED" ? safeToSpend.dailySpendingAllowancePaise : null;
  const safeToSpendPaise =
    safeToSpend?.status === "CONFIRMED" ? safeToSpend.safeToSpendUntilNextIncomePaise : null;

  const report = analyzeWishGoals({
    goals,
    todayISO,
    dailySafeToSpendPaise,
  });

  const primaryGoal =
    report.goals.find((g) => g.isActive) ??
    report.goals[0] ??
    null;
  const otherGoals = primaryGoal
    ? report.goals.filter((g) => g.id !== primaryGoal.id)
    : [];

  let simulation: WishSimulationResult | null = null;
  if (
    primaryGoal &&
    params.simulatedContributionPaise &&
    params.simulatedContributionPaise > 0
  ) {
    simulation = simulateWishWithSafeToSpend({
      goal: primaryGoal,
      contributionPaise: params.simulatedContributionPaise,
      cadence: params.simulatedCadence ?? "weekly",
      todayISO,
      safeToSpend,
    });
  }

  return {
    report,
    primaryGoal,
    otherGoals,
    dailySafeToSpendPaise,
    safeToSpendPaise,
    simulation,
  };
}
