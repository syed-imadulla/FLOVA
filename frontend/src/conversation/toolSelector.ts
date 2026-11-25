// =====================================================================
// FLOVA 2.0 | Sprint 3B — Read-Only Tool Selector
// Maps ResolvedIntent to Sprint 3A read-only tools. Blocks any non-read-only call.
// =====================================================================

import { getToolByName } from "../tools/registry";
import type { ISODate } from "../types/contracts";
import type { ResolvedIntent, ToolSelection } from "./conversationTypes";

export function selectReadOnlyTool(intent: ResolvedIntent, todayISO: ISODate): ToolSelection | null {
  let candidate: { toolName: string; input: Record<string, unknown> } | null = null;

  switch (intent.topic) {
    case "balance":
      candidate = { toolName: "get_confirmed_balance", input: { todayISO } };
      break;
    case "liquidity":
      candidate = { toolName: "get_available_liquidity", input: { todayISO } };
      break;
    case "sustainable_capital":
      candidate = { toolName: "get_sustainable_capital", input: { todayISO } };
      break;
    case "safe_to_spend":
      candidate = { toolName: "get_daily_safe_to_spend", input: { todayISO } };
      break;
    case "runway":
      candidate = { toolName: "get_runway_and_commitments", input: { todayISO } };
      break;
    case "spending":
      if (intent.category) {
        candidate = {
          toolName: "get_spending_by_category",
          input: {
            category: intent.category,
            period: intent.period ?? "this_month",
            fromDate: intent.fromDate,
            toDate: intent.toDate,
            todayISO,
          },
        };
      } else {
        candidate = {
          toolName: "get_expenses_for_range",
          input: {
            period: intent.period ?? "this_month",
            fromDate: intent.fromDate,
            toDate: intent.toDate,
            todayISO,
          },
        };
      }
      break;
    case "income":
      candidate = {
        toolName: "get_income_for_range",
        input: {
          period: intent.period ?? "this_month",
          fromDate: intent.fromDate,
          toDate: intent.toDate,
          todayISO,
        },
      };
      break;
    case "spending_comparison":
      candidate = {
        toolName: "compare_spending_periods",
        input: {
          currentPeriod: intent.period === "today" || intent.period === "this_week" ? intent.period : "this_month",
          todayISO,
        },
      };
      break;
    case "debts_owed_to_me":
      candidate = { toolName: "get_money_owed_to_user", input: { todayISO } };
      break;
    case "debts_i_owe":
      candidate = { toolName: "get_money_user_owes", input: { todayISO } };
      break;
    case "person_debt":
      if (intent.personQuery) {
        candidate = { toolName: "get_person_outstanding_balance", input: { personName: intent.personQuery, todayISO } };
      }
      break;
    case "group_balances":
      candidate = {
        toolName: "get_group_balances",
        input: intent.groupQuery ? { groupName: intent.groupQuery, todayISO } : { todayISO },
      };
      break;
    case "payouts":
      candidate = { toolName: "get_upcoming_payouts", input: { todayISO } };
      break;
    case "commitments":
      candidate = { toolName: "get_upcoming_commitments", input: { todayISO } };
      break;
    case "overdue":
      candidate = { toolName: "get_overdue_obligations", input: { todayISO } };
      break;
    case "savings_goals":
      candidate = { toolName: "get_active_savings_goals", input: { todayISO } };
      break;
    default:
      return null;
  }

  if (!candidate) return null;
  const toolDef = getToolByName(candidate.toolName);
  if (!toolDef || toolDef.access !== "read_only") {
    return null;
  }

  return {
    toolName: candidate.toolName,
    input: candidate.input,
    access: "read_only",
  };
}
