// =====================================================================
// FLOVA 2.0 | Sprint 3B — Deterministic Natural-Language Response Builder
// Formats Sprint 3A tool outputs into concise, accurate responses.
// Never invents figures; explains missing baselines or empty records honestly.
// =====================================================================

import { formatINR } from "../lib/money";
import type { ToolResult } from "../tools/types";
import type { ResolvedIntent, SupportedLanguage } from "./conversationTypes";

function periodLabel(period: string | undefined, lang: SupportedLanguage): string {
  if (lang === "hi") {
    if (period === "today") return "Aaj";
    if (period === "yesterday") return "Kal";
    if (period === "this_week") return "Is hafte";
    if (period === "last_month") return "Pichle mahine";
    return "Is mahine";
  }
  if (lang === "kn") {
    if (period === "today") return "ಇವತ್ತು";
    if (period === "yesterday") return "ನಿನ್ನೆ";
    if (period === "this_week") return "ಈ ವಾರ";
    if (period === "last_month") return "ಕಳೆದ ತಿಂಗಳು";
    return "ಈ ತಿಂಗಳು";
  }
  if (period === "today") return "Today";
  if (period === "yesterday") return "Yesterday";
  if (period === "this_week") return "This week";
  if (period === "last_month") return "Last month";
  return "This month";
}

export function buildToolResponse(
  toolResult: ToolResult<any>,
  intent: ResolvedIntent
): string {
  const lang = intent.language;

  if (!toolResult.ok) {
    if (toolResult.error?.code === "INSUFFICIENT_BASELINE") {
      return lang === "hi"
        ? "Balance check-in nahi mila. Pehle check-in karein taaki sahi balance aur safe spend calculate ho sake."
        : "No balance check-in found yet. Complete a balance check-in first so I can calculate your actual balance.";
    }
    if (toolResult.error?.code === "NOT_FOUND") {
      return toolResult.error.message;
    }
    return toolResult.error?.message || "Could not retrieve your financial records right now. Please try again.";
  }

  const d = toolResult.data;
  switch (toolResult.toolName) {
    case "get_confirmed_balance":
      return lang === "hi"
        ? `Aapka confirmed balance ${formatINR(d.confirmedBalancePaise)} hai.`
        : `Your confirmed personal balance is ${formatINR(d.confirmedBalancePaise)}.`;

    case "get_available_liquidity":
      return lang === "hi"
        ? `Aapke paas ${formatINR(d.availableLiquidityPaise)} spendable liquidity hai (confirmed ${formatINR(d.confirmedBalancePaise)}, buffer ${formatINR(d.safeBufferPaise)}).`
        : `You have ${formatINR(d.availableLiquidityPaise)} in available liquidity (confirmed balance ${formatINR(d.confirmedBalancePaise)} after ${formatINR(d.safeBufferPaise)} buffer).`;

    case "get_sustainable_capital":
      return `Your debt-free sustainable capital is ${formatINR(d.sustainableCapitalPaise)} (after ${formatINR(d.peerLiabilityPaise + d.groupLiabilityPaise)} in liabilities).`;

    case "get_daily_safe_to_spend":
      return lang === "hi"
        ? `Today aap safely ${formatINR(d.safeToSpendTodayPaise)} spend kar sakte hain, current records aur upcoming commitments ke hisaab se.`
        : `You can safely spend up to ${formatINR(d.safeToSpendTodayPaise)} today (${d.runwayDays} runway days, ${formatINR(d.availableLiquidityPaise)} available liquidity).`;

    case "get_runway_and_commitments":
      return d.firstShortfallDate
        ? `Your projected runway is ${d.runwayDays} days, with a potential shortfall starting on ${d.firstShortfallDate}.`
        : `Your projected runway is ${d.runwayDays} days with ${formatINR(d.upcomingCommitmentsTotalPaise)} in upcoming commitments.`;

    case "get_expenses_for_range": {
      const lbl = periodLabel(intent.period, lang);
      if (!toolResult.hasData) {
        return lang === "hi" ? `${lbl} koi kharch record nahi mila.` : `${lbl}, you have ₹0 recorded in personal expenses.`;
      }
      return lang === "hi"
        ? `${lbl} aapne ${formatINR(d.totalExpensePaise)} spend kiye hain (${formatINR(d.livingPaise)} living, ${formatINR(d.workPaise)} work).`
        : `${lbl}, you spent ${formatINR(d.totalExpensePaise)} (${formatINR(d.livingPaise)} living, ${formatINR(d.workPaise)} work).`;
    }

    case "get_spending_by_category": {
      const lbl = periodLabel(intent.period, lang);
      if (!toolResult.hasData) {
        return `${lbl}, you have ₹0 recorded on ${d.category}.`;
      }
      return lang === "hi"
        ? `${lbl} aapne ${d.category} par ${formatINR(d.totalPaise)} spend kiye hain.`
        : `${lbl}, you spent ${formatINR(d.totalPaise)} on ${d.category} across ${d.transactionCount} transaction(s).`;
    }

    case "get_income_for_range": {
      const lbl = periodLabel(intent.period, lang);
      if (!toolResult.hasData) {
        return `${lbl}, no income entries were found.`;
      }
      return `${lbl}, your total inflows are ${formatINR(d.totalInflowPaise)} (${formatINR(d.earnedPaise)} earned, ${formatINR(d.nonEarnedPaise)} support/other).`;
    }

    case "compare_spending_periods":
      if (!toolResult.hasData) {
        return "No spending records found to compare across periods yet.";
      }
      return d.direction === "up"
        ? `Spending is up by ${formatINR(d.deltaPaise)} (${formatINR(d.currentRange.totalPaise)} vs ${formatINR(d.previousRange.totalPaise)}).`
        : d.direction === "down"
          ? `Spending is down by ${formatINR(Math.abs(d.deltaPaise))} (${formatINR(d.currentRange.totalPaise)} vs ${formatINR(d.previousRange.totalPaise)}).`
          : `Spending is flat at ${formatINR(d.currentRange.totalPaise)}.`;

    case "get_money_owed_to_user":
      if (!toolResult.hasData) return "Nobody owes you money right now.";
      return `You are owed ${formatINR(d.totalReceivablePaise)} in total (${d.debtors.map((x: any) => `${x.name}: ${formatINR(x.amountPaise)}`).join(", ")}).`;

    case "get_money_user_owes":
      if (!toolResult.hasData) return "You don't owe anyone money right now.";
      return `You owe ${formatINR(d.totalPayablePaise)} in total (${d.creditors.map((x: any) => `${x.name}: ${formatINR(x.amountPaise)}`).join(", ")}).`;

    case "get_person_outstanding_balance":
      return lang === "hi"
        ? `${d.name}: ${d.statusLabel}.`
        : `${d.name}: ${d.statusLabel}.`;

    case "get_group_balances":
      if (!toolResult.hasData) return "No expense groups found yet.";
      return d.groups
        .map((g: any) => `${g.groupName}: total ${formatINR(g.totalSpendPaise)}`)
        .join("; ");

    case "get_upcoming_payouts":
      if (!toolResult.hasData || !d.nextPayout) return "No upcoming payouts are scheduled right now.";
      return `Next expected payout: ${formatINR(d.nextPayout.expectedPaise)} from ${d.nextPayout.source ?? d.nextPayout.kind}${d.nextPayout.expectedDate ? ` on ${d.nextPayout.expectedDate}` : ""}.`;

    case "get_upcoming_commitments":
      if (!toolResult.hasData) return "No upcoming bills or commitments are scheduled.";
      return `You have ${d.commitments.length} upcoming commitment(s) totaling ${formatINR(d.totalUpcomingPaise)}${d.remainingAfterCommitmentsPaise !== null ? ` (${formatINR(d.remainingAfterCommitmentsPaise)} remaining after bills)` : ""}.`;

    case "get_overdue_obligations":
      if (!toolResult.hasData) return "You have no overdue bills or peer repayments.";
      return `Overdue: ${d.overdueCommitmentsCount} commitment(s) (${formatINR(d.overdueCommitmentsTotalPaise)}) and ${d.overduePeerDebtsCount} peer debt(s) (${formatINR(d.overduePeerDebtsTotalPaise)}).`;

    case "get_active_savings_goals":
      if (!toolResult.hasData) return "You have no active WISH savings goals yet.";
      return `You have saved ${formatINR(d.totalSavedPaise)} toward ${formatINR(d.totalTargetPaise)} across ${d.goalCount} active goal(s).`;

    default:
      return "Your financial records were checked.";
  }
}
