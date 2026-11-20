// =====================================================================
// FLOVA Deterministic Financial Insights Engine (Owner: M3)
// Generates explainable, grounded financial insights from verified records.
// Zero LLM hallucinations, zero RAG, 100% deterministic arithmetic.
// =====================================================================

import { formatINR } from "../lib/money";
import type { ActivityItem, ISODate, RunwayInput } from "../types/contracts";
import type { ProcessedRunway } from "../runway/adapter";
import { todayLocalISO } from "../data/dates";

export type InsightSeverity = "info" | "warning" | "urgent";

export interface FinancialInsight {
  id: string;
  type: "budget_burn" | "shortfall_warning" | "payout_coverage" | "cod_liability";
  title: string;
  message: string;
  severity: InsightSeverity;
  amountPaise?: number;
  date?: string;
  actionLabel?: string;
  actionUrl?: string;
}

export interface GenerateInsightsOptions {
  today?: ISODate;
}

/**
 * Evaluates the 4 core deterministic financial insights rules:
 * 1. Daily Budget Burn: Day 0 spend exceeding living or work estimates.
 * 2. Runway Shortfall Countdown: Upcoming cash depletion date & projected deficit.
 * 3. Payout-Commitment Coverage Match: Matching future platform payouts to upcoming bills.
 * 4. Custodial COD Liability Reminder: Outstanding collected cash owed to platform.
 */
export function generateFinancialInsights(
  runwayInput: RunwayInput | null,
  processedRunway: ProcessedRunway | null,
  activityItems: ActivityItem[] = [],
  options: GenerateInsightsOptions = {}
): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  const today = options.today || todayLocalISO();

  if (!runwayInput || !processedRunway) {
    return insights;
  }

  // -----------------------------------------------------------------
  // 1. Daily Budget Burn Alert
  // -----------------------------------------------------------------
  const dailyWorkEstimate = runwayInput.profile.dailyWorkEstimate;
  const dailyLivingEstimate = runwayInput.profile.dailyLivingEstimate;

  let todayWorkSpend = 0;
  let todayLivingSpend = 0;

  for (const item of activityItems) {
    if (item.date === today && item.type === "expense" && item.ownership !== "not_mine") {
      const paise = item.amountPaise || 0;
      if (item.expenseType === "work") {
        todayWorkSpend += paise;
      } else if (item.expenseType === "living") {
        todayLivingSpend += paise;
      }
    }
  }

  if (dailyWorkEstimate !== null && todayWorkSpend > dailyWorkEstimate) {
    const excess = todayWorkSpend - dailyWorkEstimate;
    insights.push({
      id: "insight-work-budget-burn",
      type: "budget_burn",
      title: "Work Budget Exceeded Today",
      message: `You spent ${formatINR(todayWorkSpend)} on work expenses today (${formatINR(excess)} over your ${formatINR(dailyWorkEstimate)} daily estimate).`,
      severity: "warning",
      amountPaise: excess,
      date: today,
      actionLabel: "View Expenses",
      actionUrl: "/activity?type=expense",
    });
  } else if (dailyLivingEstimate !== null && todayLivingSpend > dailyLivingEstimate) {
    const excess = todayLivingSpend - dailyLivingEstimate;
    insights.push({
      id: "insight-living-budget-burn",
      type: "budget_burn",
      title: "Living Budget Exceeded Today",
      message: `You spent ${formatINR(todayLivingSpend)} on living expenses today (${formatINR(excess)} over your ${formatINR(dailyLivingEstimate)} daily estimate).`,
      severity: "warning",
      amountPaise: excess,
      date: today,
      actionLabel: "View Expenses",
      actionUrl: "/activity?type=expense",
    });
  }

  // -----------------------------------------------------------------
  // 2. Runway Shortfall Countdown Warning
  // -----------------------------------------------------------------
  if (processedRunway.status === "PROJECTED" && processedRunway.firstShortfallDate) {
    const shortfallDate = processedRunway.firstShortfallDate;
    const matchingProj = processedRunway.projections.find((p) => p.date === shortfallDate);
    const deficitPaise = matchingProj ? Math.abs(matchingProj.closingBalancePaise) : 0;

    const daysUntil = Math.max(
      0,
      Math.round((new Date(shortfallDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
    );

    const isUrgent = daysUntil <= 2;
    const timeLabel = daysUntil === 0 ? "today" : daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days (${shortfallDate})`;

    insights.push({
      id: "insight-shortfall-warning",
      type: "shortfall_warning",
      title: `Projected Shortfall ${timeLabel}`,
      message: `At current spending, your confirmed money is projected to fall short by ${formatINR(deficitPaise)} on ${shortfallDate}.`,
      severity: isUrgent ? "urgent" : "warning",
      amountPaise: deficitPaise,
      date: shortfallDate,
      actionLabel: "Review Bills & Runway",
      actionUrl: "/commitments",
    });
  }

  // -----------------------------------------------------------------
  // 3. Payout-to-Commitment Coverage Match
  // -----------------------------------------------------------------
  if (Array.isArray(runwayInput.commitments) && Array.isArray(runwayInput.payouts)) {
    const scheduledPayouts = runwayInput.payouts.filter(
      (p) => p.status === "scheduled" || p.status === "estimated"
    );

    for (const commitment of runwayInput.commitments) {
      const match = scheduledPayouts.find((p) => {
        if (!p.expectedDate) return false;
        // Payout arrives on or up to 2 days before commitment
        return p.expectedDate <= commitment.dueDate;
      });

      if (match) {
        insights.push({
          id: `insight-coverage-${commitment.id}`,
          type: "payout_coverage",
          title: `Expected Payout Covers ${commitment.title}`,
          message: `Your scheduled ${formatINR(match.expected)} ${match.kind} from ${match.id ? "platform" : ""} on ${match.expectedDate} will help cover ${commitment.title} (${formatINR(commitment.amount)} due ${commitment.dueDate}).`,
          severity: "info",
          amountPaise: match.expected,
          date: match.expectedDate || undefined,
          actionLabel: "View Payouts",
          actionUrl: "/payouts",
        });
        break; // Surface the first prominent match
      }
    }
  }

  // -----------------------------------------------------------------
  // 4. Custodial COD Liability Reminder
  // -----------------------------------------------------------------
  const custodialPaise = processedRunway.custodialOwedPaise ?? 0;
  if (custodialPaise > 0) {
    insights.push({
      id: "insight-cod-liability",
      type: "cod_liability",
      title: "Custodial Cash Held",
      message: `You are holding ${formatINR(custodialPaise)} in cash collected on delivery. This is safely segregated from your personal spending balance.`,
      severity: "info",
      amountPaise: custodialPaise,
      actionLabel: "Remit to Platform",
      actionUrl: "/add",
    });
  }

  return insights;
}
