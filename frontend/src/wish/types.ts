// =====================================================================
// FLOVA WISH — Types & Calculations
// Minimalist, deterministic savings goal tracking.
// Money is strictly held in integer paise. No floating-point arithmetic.
// =====================================================================

import type { Paise } from "../types/contracts";

export type ContributionCadence = "weekly" | "monthly";
export type WishStatus = "active" | "completed" | "archived";

export interface Wish {
  id: string;
  userId: string;
  name: string;
  targetPaise: Paise;
  savedPaise: Paise;
  contributionPaise: Paise;
  cadence: ContributionCadence;
  imageUrl?: string | null;
  productUrl?: string | null;
  notes?: string | null;
  status: WishStatus;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  completedAt?: string | null; // ISO timestamp
}

export interface CreateWishInput {
  name: string;
  targetPaise: Paise;
  initialSavedPaise?: Paise;
  contributionPaise?: Paise;
  cadence?: ContributionCadence;
  imageUrl?: string | null;
  productUrl?: string | null;
  notes?: string | null;
}

export interface WishCalculation {
  targetPaise: Paise;
  savedPaise: Paise;
  remainingPaise: Paise;
  progressRatio: number; // 0.0 - 1.0
  progressPercent: number; // 0 - 100
  isCompleted: boolean;
  periodsRemaining: number | null;
  cadence: ContributionCadence;
  estimatedDays: number | null;
  estimatedDate: string | null; // YYYY-MM-DD
  timelineSummary: string;
}

/**
 * Calculates deterministic progress and timeline for a wish.
 * Honest: Does not invent an ETA if contribution is 0 or negative.
 */
export function calculateWish(wish: Pick<Wish, "targetPaise" | "savedPaise" | "contributionPaise" | "cadence">, today = new Date()): WishCalculation {
  const target = Math.max(0, Math.floor(wish.targetPaise));
  const saved = Math.max(0, Math.floor(wish.savedPaise));
  const remaining = Math.max(0, target - saved);
  const contribution = Math.max(0, Math.floor(wish.contributionPaise || 0));
  const cadence = wish.cadence || "weekly";

  const progressRatio = target > 0 ? Math.min(1, saved / target) : 0;
  const progressPercent = Math.min(100, Math.round(progressRatio * 100));
  const isCompleted = target > 0 && saved >= target;

  if (isCompleted) {
    return {
      targetPaise: target,
      savedPaise: saved,
      remainingPaise: 0,
      progressRatio: 1,
      progressPercent: 100,
      isCompleted: true,
      periodsRemaining: 0,
      cadence,
      estimatedDays: 0,
      estimatedDate: formatDateISO(today),
      timelineSummary: "Target reached. Ready to purchase without financial strain.",
    };
  }

  if (contribution <= 0) {
    return {
      targetPaise: target,
      savedPaise: saved,
      remainingPaise: remaining,
      progressRatio,
      progressPercent,
      isCompleted: false,
      periodsRemaining: null,
      cadence,
      estimatedDays: null,
      estimatedDate: null,
      timelineSummary: "Set a regular contribution to calculate your target date.",
    };
  }

  // Calculate periods remaining
  const periods = Math.ceil(remaining / contribution);
  const totalDays = Math.ceil(periods * (cadence === "weekly" ? 7 : 30));

  const targetDate = new Date(today.getTime());
  targetDate.setDate(targetDate.getDate() + totalDays);

  const unitLabel = cadence === "weekly"
    ? periods === 1 ? "week" : "weeks"
    : periods === 1 ? "month" : "months";

  const formattedTargetDate = formatMonthYear(targetDate);
  const timelineSummary = `~${periods} ${unitLabel} at current pace (${formattedTargetDate})`;

  return {
    targetPaise: target,
    savedPaise: saved,
    remainingPaise: remaining,
    progressRatio,
    progressPercent,
    isCompleted: false,
    periodsRemaining: periods,
    cadence,
    estimatedDays: totalDays,
    estimatedDate: formatDateISO(targetDate),
    timelineSummary,
  };
}

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
