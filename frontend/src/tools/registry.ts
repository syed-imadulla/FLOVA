// =====================================================================
// FLOVA 2.0 | Sprint 3A — Financial Tool Registry (Read-Only)
// =====================================================================

import { todayLocalISO } from "../data/dates";
import { BALANCE_RUNWAY_TOOLS } from "./balanceRunwayTools";
import { GROUP_EXPENSE_TOOLS } from "./groupExpenseTools";
import { INCOME_EXPENSE_TOOLS } from "./incomeExpenseTools";
import { PAYOUT_COMMITMENT_TOOLS } from "./payoutCommitmentTools";
import { PEOPLE_DEBT_TOOLS } from "./peopleDebtTools";
import { SAVINGS_WISH_TOOLS } from "./savingsWishTools";
import {
  toolFailure,
  type FinancialToolDataSource,
  type FinancialToolDefinition,
  type ToolCategory,
  type ToolResult,
} from "./types";

export const ALL_FINANCIAL_TOOLS: ReadonlyArray<FinancialToolDefinition<any, any>> = [
  ...BALANCE_RUNWAY_TOOLS,
  ...INCOME_EXPENSE_TOOLS,
  ...PEOPLE_DEBT_TOOLS,
  ...GROUP_EXPENSE_TOOLS,
  ...PAYOUT_COMMITMENT_TOOLS,
  ...SAVINGS_WISH_TOOLS,
];

const TOOL_MAP = new Map<string, FinancialToolDefinition<any, any>>(
  ALL_FINANCIAL_TOOLS.map((t) => [t.name, t])
);

export function getToolByName(name: string): FinancialToolDefinition<any, any> | undefined {
  return TOOL_MAP.get(name);
}

export function listTools(category?: ToolCategory): ReadonlyArray<FinancialToolDefinition<any, any>> {
  if (!category) return ALL_FINANCIAL_TOOLS;
  return ALL_FINANCIAL_TOOLS.filter((t) => t.category === category);
}

export async function executeFinancialTool<TOutput = unknown>(
  toolName: string,
  input: Record<string, unknown>,
  ds: FinancialToolDataSource
): Promise<ToolResult<TOutput>> {
  const tool = TOOL_MAP.get(toolName);
  if (!tool) {
    return toolFailure<TOutput>(toolName, "NOT_FOUND", `Unknown financial tool: "${toolName}".`, todayLocalISO());
  }
  return tool.execute(input ?? {}, ds) as Promise<ToolResult<TOutput>>;
}
