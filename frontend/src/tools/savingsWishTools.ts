// =====================================================================
// FLOVA 2.0 | Sprint 3A — Group F: Savings & WISH Tools (Read-Only)
// =====================================================================

import { todayLocalISO } from "../data/dates";
import { toPaise } from "../lib/money";
import { calculateWish } from "../wish/types";
import type { ISODate, Paise } from "../types/contracts";
import {
  assertAuthenticatedDataSource,
  filterOwnedRows,
  toolFailure,
  toolSuccess,
  type FinancialToolDefinition,
} from "./types";

export interface WishQueryInput {
  goalId?: string;
  todayISO?: ISODate;
}

export interface ActiveSavingsGoalsOutput {
  goalCount: number;
  totalSavedPaise: Paise;
  totalTargetPaise: Paise;
  goals: Array<{
    id: string;
    title: string;
    targetPaise: Paise;
    savedPaise: Paise;
    remainingPaise: Paise;
    progressPercent: number;
    status: string;
    targetDate: string | null;
  }>;
}

export interface GoalProgressOutput {
  goalId: string;
  title: string;
  targetPaise: Paise;
  savedPaise: Paise;
  remainingPaise: Paise;
  progressPercent: number;
  contributionCount: number;
}

export interface WishContributionsOutput {
  totalCount: number;
  totalContributedPaise: Paise;
  contributions: Array<{
    id: string;
    goalId: string;
    goalTitle: string;
    amountPaise: Paise;
    contributedAt: string;
    notes: string | null;
  }>;
}

export interface RemainingTargetsOutput {
  activeGoalCount: number;
  totalRemainingPaise: Paise;
  targets: Array<{ goalId: string; title: string; remainingPaise: Paise }>;
}

async function resolveGoals(ds: FinancialToolDataSourceLike) {
  const dbGoals = filterOwnedRows(await ds.listWishGoals(), ds.userId);
  if (dbGoals.length > 0) {
    return dbGoals.map((g) => {
      const targetPaise = toPaise(g.target_amount);
      const savedPaise = toPaise(g.saved_amount);
      const remainingPaise = Math.max(0, targetPaise - savedPaise);
      const progressPercent = targetPaise > 0 ? Math.min(100, Math.round((savedPaise / targetPaise) * 100)) : 0;
      return {
        id: g.id,
        title: g.title,
        targetPaise,
        savedPaise,
        remainingPaise,
        progressPercent,
        status: g.status,
        targetDate: g.target_date ?? null,
        contributions: g.contributions ?? [],
      };
    });
  }

  const activeWish = await ds.getActiveWish(ds.userId);
  if (activeWish) {
    const calc = calculateWish(activeWish);
    return [
      {
        id: activeWish.id,
        title: activeWish.name,
        targetPaise: activeWish.targetPaise,
        savedPaise: calc.savedPaise,
        remainingPaise: calc.remainingPaise,
        progressPercent: calc.progressPercent,
        status: activeWish.status,
        targetDate: null,
        contributions: [],
      },
    ];
  }
  return [];
}

type FinancialToolDataSourceLike = Parameters<FinancialToolDefinition<WishQueryInput, unknown>["execute"]>[1];

export const getActiveSavingsGoalsTool: FinancialToolDefinition<WishQueryInput, ActiveSavingsGoalsOutput> = {
  name: "get_active_savings_goals",
  category: "savings_wish",
  description: "Get active WISH savings goals and totals.",
  access: "read_only",
  inputSchema: { required: [], optional: ["todayISO"] },
  outputSchema: "ActiveSavingsGoalsOutput",
  async execute(input, ds) {
    const asOfDate = input?.todayISO ?? todayLocalISO();
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_active_savings_goals", "UNAUTHENTICATED", authErr, asOfDate);

    try {
      const goals = (await resolveGoals(ds)).filter((g) => g.status === "active");
      return toolSuccess(
        "get_active_savings_goals",
        {
          goalCount: goals.length,
          totalSavedPaise: goals.reduce((s, g) => s + g.savedPaise, 0),
          totalTargetPaise: goals.reduce((s, g) => s + g.targetPaise, 0),
          goals: goals.map(({ contributions: _c, ...rest }) => rest),
        },
        goals.length > 0,
        asOfDate
      );
    } catch (err) {
      return toolFailure("get_active_savings_goals", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load savings goals.", asOfDate);
    }
  },
};

export const getGoalProgressTool: FinancialToolDefinition<WishQueryInput, GoalProgressOutput> = {
  name: "get_goal_progress",
  category: "savings_wish",
  description: "Get progress for a specific WISH goal (or primary active goal).",
  access: "read_only",
  inputSchema: { required: [], optional: ["goalId", "todayISO"] },
  outputSchema: "GoalProgressOutput",
  async execute(input, ds) {
    const asOfDate = input?.todayISO ?? todayLocalISO();
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_goal_progress", "UNAUTHENTICATED", authErr, asOfDate);

    try {
      const goals = await resolveGoals(ds);
      const target = input?.goalId ? goals.find((g) => g.id === input.goalId) : goals[0];
      if (!target) {
        return toolFailure("get_goal_progress", "NOT_FOUND", "No savings goal found.", asOfDate);
      }
      return toolSuccess(
        "get_goal_progress",
        {
          goalId: target.id,
          title: target.title,
          targetPaise: target.targetPaise,
          savedPaise: target.savedPaise,
          remainingPaise: target.remainingPaise,
          progressPercent: target.progressPercent,
          contributionCount: target.contributions.length,
        },
        true,
        asOfDate
      );
    } catch (err) {
      return toolFailure("get_goal_progress", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load goal progress.", asOfDate);
    }
  },
};

export const getWishContributionsTool: FinancialToolDefinition<WishQueryInput, WishContributionsOutput> = {
  name: "get_wish_contributions",
  category: "savings_wish",
  description: "Get contribution history for WISH savings goals.",
  access: "read_only",
  inputSchema: { required: [], optional: ["goalId", "todayISO"] },
  outputSchema: "WishContributionsOutput",
  async execute(input, ds) {
    const asOfDate = input?.todayISO ?? todayLocalISO();
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_wish_contributions", "UNAUTHENTICATED", authErr, asOfDate);

    try {
      const goals = await resolveGoals(ds);
      const filtered = input?.goalId ? goals.filter((g) => g.id === input.goalId) : goals;
      const contributions = filtered.flatMap((g) =>
        g.contributions.map((c) => ({
          id: c.id,
          goalId: g.id,
          goalTitle: g.title,
          amountPaise: toPaise(c.amount),
          contributedAt: c.contributed_at,
          notes: c.notes ?? null,
        }))
      );

      return toolSuccess(
        "get_wish_contributions",
        {
          totalCount: contributions.length,
          totalContributedPaise: contributions.reduce((s, c) => s + c.amountPaise, 0),
          contributions,
        },
        contributions.length > 0,
        asOfDate
      );
    } catch (err) {
      return toolFailure("get_wish_contributions", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load contributions.", asOfDate);
    }
  },
};

export const getRemainingTargetAmountsTool: FinancialToolDefinition<WishQueryInput, RemainingTargetsOutput> = {
  name: "get_remaining_target_amounts",
  category: "savings_wish",
  description: "Get remaining target amounts for all active WISH savings goals.",
  access: "read_only",
  inputSchema: { required: [], optional: ["todayISO"] },
  outputSchema: "RemainingTargetsOutput",
  async execute(input, ds) {
    const asOfDate = input?.todayISO ?? todayLocalISO();
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_remaining_target_amounts", "UNAUTHENTICATED", authErr, asOfDate);

    try {
      const active = (await resolveGoals(ds)).filter((g) => g.status === "active");
      const targets = active.map((g) => ({
        goalId: g.id,
        title: g.title,
        remainingPaise: g.remainingPaise,
      }));
      return toolSuccess(
        "get_remaining_target_amounts",
        {
          activeGoalCount: targets.length,
          totalRemainingPaise: targets.reduce((s, t) => s + t.remainingPaise, 0),
          targets,
        },
        targets.length > 0,
        asOfDate
      );
    } catch (err) {
      return toolFailure("get_remaining_target_amounts", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load remaining targets.", asOfDate);
    }
  },
};

export const SAVINGS_WISH_TOOLS = [
  getActiveSavingsGoalsTool,
  getGoalProgressTool,
  getWishContributionsTool,
  getRemainingTargetAmountsTool,
];
