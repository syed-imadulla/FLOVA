// =====================================================================
// FLOVA 2.0 | Sprint 3A — Deterministic Financial Tool Layer Contracts
// Provider-independent, strictly READ-ONLY, integer-paise typed tools.
// =====================================================================

import type {
  Commitment,
  DebtSettlement,
  ExpenseGroup,
  ExpenseGroupMember,
  GroupExpense,
  GroupExpenseSplit,
  GroupSettlement,
  ISODate,
  Payout,
  PeerDebt,
  Person,
  RunwayInput,
  Transaction,
  WishGoal,
} from "../types/contracts";
import type { Wish } from "../wish/types";
import { loadRunwayInput, listCommitments, listPayouts, listTransactions } from "../services/data";
import { listDebtSettlements, listPeerDebts, listPeople } from "../services/peerDebts";
import {
  listExpenseGroups,
  listGroupExpenses,
  listGroupMembers,
  listGroupSettlements,
  listGroupSplits,
} from "../services/groupExpenses";
import { listWishGoals } from "../services/wish";
import { getActiveWish } from "../wish/wishService";

export type ToolCategory =
  | "balance_runway"
  | "income_expenses"
  | "people_debts"
  | "group_expenses"
  | "payouts_commitments"
  | "savings_wish";

export type ToolAccessMode = "read_only";

export type ToolErrorCode =
  | "INVALID_INPUT"
  | "UNAUTHENTICATED"
  | "NO_DATA"
  | "INSUFFICIENT_BASELINE"
  | "NOT_FOUND"
  | "SERVICE_ERROR";

export interface ToolError {
  code: ToolErrorCode;
  message: string;
}

export interface ToolResult<T> {
  ok: boolean;
  toolName: string;
  access: ToolAccessMode;
  data: T | null;
  hasData: boolean;
  error?: ToolError;
  metadata: {
    currency: "INR";
    unit: "paise";
    asOfDate: ISODate;
  };
}

export type RelativePeriod =
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "last_month"
  | "custom";

export interface DateRangeInput {
  period?: RelativePeriod;
  fromDate?: ISODate;
  toDate?: ISODate;
  todayISO?: ISODate;
}

export interface FinancialToolDataSource {
  userId: string;
  loadRunwayInput: () => Promise<RunwayInput>;
  listTransactions: (opts?: { from?: string; to?: string; limit?: number }) => Promise<Transaction[]>;
  listPeople: () => Promise<Person[]>;
  listPeerDebts: () => Promise<PeerDebt[]>;
  listDebtSettlements: (debtId?: string) => Promise<DebtSettlement[]>;
  listExpenseGroups: () => Promise<ExpenseGroup[]>;
  listGroupMembers: (groupId?: string) => Promise<ExpenseGroupMember[]>;
  listGroupExpenses: (groupId?: string) => Promise<GroupExpense[]>;
  listGroupSplits: (groupExpenseId?: string) => Promise<GroupExpenseSplit[]>;
  listGroupSettlements: (splitId?: string) => Promise<GroupSettlement[]>;
  listPayouts: () => Promise<Payout[]>;
  listCommitments: (status?: "upcoming" | "paid" | "cancelled" | "all") => Promise<Commitment[]>;
  listWishGoals: () => Promise<WishGoal[]>;
  getActiveWish: (userId: string) => Promise<Wish | null>;
}

export interface ToolSchemaDescription {
  required: string[];
  optional: string[];
}

export interface FinancialToolDefinition<TInput, TOutput> {
  name: string;
  category: ToolCategory;
  description: string;
  access: ToolAccessMode;
  inputSchema: ToolSchemaDescription;
  outputSchema: string;
  execute: (input: TInput, ds: FinancialToolDataSource) => Promise<ToolResult<TOutput>>;
}

export function createSupabaseToolDataSource(userId: string): FinancialToolDataSource {
  return {
    userId,
    loadRunwayInput,
    listTransactions,
    listPeople,
    listPeerDebts,
    listDebtSettlements,
    listExpenseGroups,
    listGroupMembers,
    listGroupExpenses,
    listGroupSplits,
    listGroupSettlements,
    listPayouts,
    listCommitments,
    listWishGoals,
    getActiveWish,
  };
}

export function toolSuccess<T>(
  toolName: string,
  data: T,
  hasData: boolean,
  asOfDate: ISODate
): ToolResult<T> {
  return {
    ok: true,
    toolName,
    access: "read_only",
    data,
    hasData,
    metadata: { currency: "INR", unit: "paise", asOfDate },
  };
}

export function toolFailure<T>(
  toolName: string,
  code: ToolErrorCode,
  message: string,
  asOfDate: ISODate
): ToolResult<T> {
  return {
    ok: false,
    toolName,
    access: "read_only",
    data: null,
    hasData: false,
    error: { code, message },
    metadata: { currency: "INR", unit: "paise", asOfDate },
  };
}

export function assertAuthenticatedDataSource(ds: FinancialToolDataSource): string | null {
  if (!ds || typeof ds.userId !== "string" || ds.userId.trim().length === 0) {
    return "Authenticated userId is required to access financial records.";
  }
  return null;
}

/** Filters records by user_id when present on rows (defense-in-depth alongside Supabase RLS). */
export function filterOwnedRows<T extends { user_id?: string }>(rows: T[], userId: string): T[] {
  return rows.filter((r) => !r.user_id || r.user_id === userId);
}
