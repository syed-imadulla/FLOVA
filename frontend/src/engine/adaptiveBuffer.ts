// =====================================================================
// FLOVA Adaptive Safety Buffer Engine (Owner: M3 / Phase 15)
// Recommends an explainable emergency cash cushion tailored to the user's
// specific work profile, earning variability, essential living/work costs,
// and upcoming commitments.
// Invariant: The recommended buffer is a planning boundary and is NEVER
// silently deducted from confirmed balance.
// =====================================================================

import type { Paise, Profile } from "../types/contracts";
import { toPaise } from "../lib/money";

export type ProfileLike = Partial<Profile> & {
  workProfile?: string;
  incomeVariability?: string;
  [key: string]: any;
};

export interface AdaptiveBufferInput {
  profile?: ProfileLike | null;
  dailyLivingEstimatePaise: Paise;
  dailyWorkEstimatePaise: Paise;
  commitments?: Array<{ amount: Paise; [key: string]: any }>;
  horizonDaysOverride?: number;
}

export interface AdaptiveBufferRecommendation {
  recommendedBufferPaise: Paise;
  essentialDailyCostPaise: Paise;
  protectionDays: number;
  baseLivingBufferPaise: Paise;
  baseWorkBufferPaise: Paise;
  upcomingCommitmentPaise: Paise;
  explanation: string[];
  assumptions: string[];
  hasSufficientData: boolean;
}

/**
 * Derives default protection horizon in calendar days based on user's work profile
 * and income variability patterns.
 */
export function deriveProtectionHorizon(profile?: ProfileLike | null): number {
  if (!profile) return 7;

  let days = 7;
  const wp = profile.work_profile || profile.workProfile;
  switch (wp) {
    case "daily_wage":
      days = 3; // Daily earners plan over shorter 3-day horizons
      break;
    case "delivery":
    case "driver":
      days = 7; // Weekly payout cadence aligns with 7-day protection
      break;
    case "service":
    case "small_vendor":
    case "independent_business":
      days = 10;
      break;
    case "freelancer":
    case "seasonal_worker":
      days = 14; // Delayed invoices and milestones warrant 14-day cushion
      break;
    default:
      days = 7;
      break;
  }

  // If income variability is unpredictable or intermittent, add precautionary buffer days
  const iv = profile.income_variability || profile.incomeVariability;
  if (iv === "unpredictable") {
    days = Math.min(18, days + 5);
  } else if (iv === "intermittent") {
    days = Math.min(18, days + 3);
  } else if (iv === "seasonal") {
    days = Math.min(18, days + 4);
  }

  return Math.min(18, days);
}

/**
 * Calculates an explainable adaptive safety buffer recommendation.
 */
export function calculateAdaptiveBuffer(input: AdaptiveBufferInput): AdaptiveBufferRecommendation {
  const { profile, dailyLivingEstimatePaise, dailyWorkEstimatePaise, commitments = [], horizonDaysOverride } = input;

  const protectionDays = horizonDaysOverride && horizonDaysOverride > 0
    ? horizonDaysOverride
    : deriveProtectionHorizon(profile);

  const essentialDailyCostPaise = Math.max(0, dailyLivingEstimatePaise) + Math.max(0, dailyWorkEstimatePaise);
  const baseLivingBufferPaise = Math.max(0, dailyLivingEstimatePaise) * protectionDays;
  const baseWorkBufferPaise = Math.max(0, dailyWorkEstimatePaise) * protectionDays;

  // Calculate commitments coming due within the protection horizon (c.amount is in integer paise)
  let upcomingCommitmentPaise: Paise = 0;
  for (const c of commitments) {
    if (c.status !== "paid" && c.status !== "cancelled") {
      const amt = typeof c.amount === "number" ? c.amount : toPaise(c.amount);
      upcomingCommitmentPaise += amt;
    }
  }

  const recommendedBufferPaise = baseLivingBufferPaise + baseWorkBufferPaise + upcomingCommitmentPaise;

  const hasSufficientData = essentialDailyCostPaise > 0;

  const explanation: string[] = [];
  const assumptions: string[] = [];

  const profileName = profile?.work_profile ? profile.work_profile.replace(/_/g, " ") : "independent earner";
  assumptions.push(`Planned protection horizon: ${protectionDays} days based on ${profileName} profile.`);

  if (profile?.income_variability && profile.income_variability !== "regular") {
    assumptions.push(`Added safety margin for ${profile.income_variability} income.`);
  }

  if (essentialDailyCostPaise > 0) {
    explanation.push(
      `Covers essential living and work needs for ${protectionDays} days (₹${(essentialDailyCostPaise / 100).toLocaleString("en-IN")}/day).`
    );
  } else {
    explanation.push(
      `Daily essential expenses have not been recorded yet. Set your daily baseline in profile for an accurate buffer.`
    );
  }

  if (upcomingCommitmentPaise > 0) {
    explanation.push(
      `Includes ₹${(upcomingCommitmentPaise / 100).toLocaleString("en-IN")} in upcoming bills and debt commitments.`
    );
  }

  return {
    recommendedBufferPaise,
    essentialDailyCostPaise,
    protectionDays,
    baseLivingBufferPaise,
    baseWorkBufferPaise,
    upcomingCommitmentPaise,
    explanation,
    assumptions,
    hasSufficientData,
  };
}
