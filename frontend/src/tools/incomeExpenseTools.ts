// =====================================================================
// FLOVA 2.0 | Sprint 3A — Group B: Income & Expenses Tools (Read-Only)
// Segregates earned vs non-earned inflows; excludes custodial not_mine.
// =====================================================================

import { todayLocalISO } from "../data/dates";
import { addDays, analyzeSpendingIntelligence } from "../engine";
import { toPaise } from "../lib/money";
import type { ExpenseType, ISODate, Paise, Transaction } from "../types/contracts";
import { resolveDateRange } from "./dateRange";
import {
  assertAuthenticatedDataSource,
  filterOwnedRows,
  toolFailure,
  toolSuccess,
  type DateRangeInput,
  type FinancialToolDefinition,
} from "./types";

export interface IncomeRangeOutput {
  fromDate: ISODate;
  toDate: ISODate;
  totalInflowPaise: Paise;
  earnedPaise: Paise;
  nonEarnedPaise: Paise;
  byInflowCategory: Record<string, Paise>;
  transactionCount: number;
}

export interface ExpensesRangeOutput {
  fromDate: ISODate;
  toDate: ISODate;
  totalExpensePaise: Paise;
  livingPaise: Paise;
  workPaise: Paise;
  byCategory: Record<string, Paise>;
  transactionCount: number;
}

export interface CategorySpendingInput extends DateRangeInput {
  category: string;
  expenseType?: ExpenseType;
}

export interface CategorySpendingOutput {
  category: string;
  fromDate: ISODate;
  toDate: ISODate;
  totalPaise: Paise;
  transactionCount: number;
  items: Array<{ id: string; date: ISODate; amountPaise: Paise; description: string | null; expenseType: ExpenseType | null }>;
}

export interface TransactionHistoryInput extends DateRangeInput {
  type?: "income" | "expense";
  category?: string;
  limit?: number;
}

export interface TransactionHistoryOutput {
  fromDate: ISODate;
  toDate: ISODate;
  totalCount: number;
  transactions: Array<{
    id: string;
    type: "income" | "expense";
    amountPaise: Paise;
    category: string;
    expenseType: ExpenseType | null;
    inflowCategory: string | null;
    date: ISODate;
    description: string | null;
  }>;
}

export interface ComparePeriodsInput {
  currentPeriod?: "today" | "this_week" | "this_month";
  todayISO?: ISODate;
}

export interface ComparePeriodsOutput {
  currentRange: { fromDate: ISODate; toDate: ISODate; totalPaise: Paise };
  previousRange: { fromDate: ISODate; toDate: ISODate; totalPaise: Paise };
  deltaPaise: number;
  direction: "up" | "down" | "flat";
  weekOverWeekChangePercent: number | null;
}

export const getIncomeForRangeTool: FinancialToolDefinition<DateRangeInput, IncomeRangeOutput> = {
  name: "get_income_for_range",
  category: "income_expenses",
  description: "Get personal income for a date range, distinguishing earned income from family support, pocket money, gifts, and donations.",
  access: "read_only",
  inputSchema: { required: [], optional: ["period", "fromDate", "toDate", "todayISO"] },
  outputSchema: "IncomeRangeOutput",
  async execute(input, ds) {
    const range = resolveDateRange(input ?? {});
    if (!range.ok) return toolFailure("get_income_for_range", "INVALID_INPUT", range.error, range.todayISO);
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_income_for_range", "UNAUTHENTICATED", authErr, range.todayISO);

    try {
      const all = filterOwnedRows(await ds.listTransactions({ from: range.fromDate, to: range.toDate, limit: 500 }), ds.userId);
      const relevant = all.filter(
        (t) => t.type === "income" && t.ownership === "mine" && t.transaction_date >= range.fromDate && t.transaction_date <= range.toDate
      );

      let totalInflowPaise = 0;
      let earnedPaise = 0;
      let nonEarnedPaise = 0;
      const byInflowCategory: Record<string, Paise> = {};

      for (const t of relevant) {
        const amt = toPaise(t.amount);
        totalInflowPaise += amt;
        const ic = t.inflow_category ?? "earned";
        if (ic === "earned") earnedPaise += amt;
        else nonEarnedPaise += amt;
        byInflowCategory[ic] = (byInflowCategory[ic] ?? 0) + amt;
      }

      return toolSuccess(
        "get_income_for_range",
        {
          fromDate: range.fromDate,
          toDate: range.toDate,
          totalInflowPaise,
          earnedPaise,
          nonEarnedPaise,
          byInflowCategory,
          transactionCount: relevant.length,
        },
        relevant.length > 0,
        range.todayISO
      );
    } catch (err) {
      return toolFailure("get_income_for_range", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load income.", range.todayISO);
    }
  },
};

export const getExpensesForRangeTool: FinancialToolDefinition<DateRangeInput, ExpensesRangeOutput> = {
  name: "get_expenses_for_range",
  category: "income_expenses",
  description: "Get personal expenses for a date range, split into living vs work and by category (excluding custodial funds).",
  access: "read_only",
  inputSchema: { required: [], optional: ["period", "fromDate", "toDate", "todayISO"] },
  outputSchema: "ExpensesRangeOutput",
  async execute(input, ds) {
    const range = resolveDateRange(input ?? {});
    if (!range.ok) return toolFailure("get_expenses_for_range", "INVALID_INPUT", range.error, range.todayISO);
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_expenses_for_range", "UNAUTHENTICATED", authErr, range.todayISO);

    try {
      const all = filterOwnedRows(await ds.listTransactions({ from: range.fromDate, to: range.toDate, limit: 500 }), ds.userId);
      const relevant = all.filter(
        (t) => t.type === "expense" && t.ownership === "mine" && t.transaction_date >= range.fromDate && t.transaction_date <= range.toDate
      );

      let totalExpensePaise = 0;
      let livingPaise = 0;
      let workPaise = 0;
      const byCategory: Record<string, Paise> = {};

      for (const t of relevant) {
        const amt = toPaise(t.amount);
        totalExpensePaise += amt;
        if (t.expense_type === "living") livingPaise += amt;
        else if (t.expense_type === "work") workPaise += amt;
        const cat = t.category || "other";
        byCategory[cat] = (byCategory[cat] ?? 0) + amt;
      }

      return toolSuccess(
        "get_expenses_for_range",
        {
          fromDate: range.fromDate,
          toDate: range.toDate,
          totalExpensePaise,
          livingPaise,
          workPaise,
          byCategory,
          transactionCount: relevant.length,
        },
        relevant.length > 0,
        range.todayISO
      );
    } catch (err) {
      return toolFailure("get_expenses_for_range", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load expenses.", range.todayISO);
    }
  },
};

export const getSpendingByCategoryTool: FinancialToolDefinition<CategorySpendingInput, CategorySpendingOutput> = {
  name: "get_spending_by_category",
  category: "income_expenses",
  description: "Get deterministic total and itemized personal expenses for a specific category.",
  access: "read_only",
  inputSchema: { required: ["category"], optional: ["period", "fromDate", "toDate", "todayISO", "expenseType"] },
  outputSchema: "CategorySpendingOutput",
  async execute(input, ds) {
    const range = resolveDateRange(input ?? {});
    if (!range.ok) return toolFailure("get_spending_by_category", "INVALID_INPUT", range.error, range.todayISO);
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_spending_by_category", "UNAUTHENTICATED", authErr, range.todayISO);

    const catClean = input?.category?.trim();
    if (!catClean) {
      return toolFailure("get_spending_by_category", "INVALID_INPUT", "category is required.", range.todayISO);
    }

    try {
      const needle = catClean.toLowerCase();
      const all = filterOwnedRows(await ds.listTransactions({ from: range.fromDate, to: range.toDate, limit: 500 }), ds.userId);
      const matching = all.filter((t) => {
        if (t.type !== "expense" || t.ownership !== "mine") return false;
        if (t.transaction_date < range.fromDate || t.transaction_date > range.toDate) return false;
        if (input.expenseType && t.expense_type !== input.expenseType) return false;
        const cat = (t.category || "").toLowerCase();
        const desc = (t.description || "").toLowerCase();
        return cat === needle || cat.includes(needle) || desc.includes(needle);
      });

      const items = matching.map((t) => ({
        id: t.id,
        date: t.transaction_date,
        amountPaise: toPaise(t.amount),
        description: t.description,
        expenseType: t.expense_type,
      }));

      return toolSuccess(
        "get_spending_by_category",
        {
          category: catClean,
          fromDate: range.fromDate,
          toDate: range.toDate,
          totalPaise: items.reduce((s, i) => s + i.amountPaise, 0),
          transactionCount: items.length,
          items,
        },
        items.length > 0,
        range.todayISO
      );
    } catch (err) {
      return toolFailure("get_spending_by_category", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load category spending.", range.todayISO);
    }
  },
};

export const getTransactionHistoryTool: FinancialToolDefinition<TransactionHistoryInput, TransactionHistoryOutput> = {
  name: "get_transaction_history",
  category: "income_expenses",
  description: "Get personal transaction history for a date range with optional type, category, and limit filters.",
  access: "read_only",
  inputSchema: { required: [], optional: ["period", "fromDate", "toDate", "todayISO", "type", "category", "limit"] },
  outputSchema: "TransactionHistoryOutput",
  async execute(input, ds) {
    const range = resolveDateRange(input ?? {});
    if (!range.ok) return toolFailure("get_transaction_history", "INVALID_INPUT", range.error, range.todayISO);
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_transaction_history", "UNAUTHENTICATED", authErr, range.todayISO);

    const limit = input?.limit ?? 50;
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
      return toolFailure("get_transaction_history", "INVALID_INPUT", "limit must be an integer between 1 and 500.", range.todayISO);
    }

    try {
      const all = filterOwnedRows(await ds.listTransactions({ from: range.fromDate, to: range.toDate, limit: 500 }), ds.userId);
      const catNeedle = input?.category?.trim().toLowerCase();
      const filtered = all.filter((t: Transaction) => {
        if (t.ownership !== "mine") return false;
        if (t.transaction_date < range.fromDate || t.transaction_date > range.toDate) return false;
        if (input?.type && t.type !== input.type) return false;
        if (catNeedle && !(t.category || "").toLowerCase().includes(catNeedle)) return false;
        return true;
      });

      const sliced = filtered.slice(0, limit).map((t) => ({
        id: t.id,
        type: t.type,
        amountPaise: toPaise(t.amount),
        category: t.category,
        expenseType: t.expense_type,
        inflowCategory: t.inflow_category ?? null,
        date: t.transaction_date,
        description: t.description,
      }));

      return toolSuccess(
        "get_transaction_history",
        {
          fromDate: range.fromDate,
          toDate: range.toDate,
          totalCount: filtered.length,
          transactions: sliced,
        },
        filtered.length > 0,
        range.todayISO
      );
    } catch (err) {
      return toolFailure("get_transaction_history", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load transactions.", range.todayISO);
    }
  },
};

export const compareSpendingPeriodsTool: FinancialToolDefinition<ComparePeriodsInput, ComparePeriodsOutput> = {
  name: "compare_spending_periods",
  category: "income_expenses",
  description: "Compare personal spending between the current period and the immediately preceding equivalent period.",
  access: "read_only",
  inputSchema: { required: [], optional: ["currentPeriod", "todayISO"] },
  outputSchema: "ComparePeriodsOutput",
  async execute(input, ds) {
    const todayISO = input?.todayISO ?? todayLocalISO();
    const curPeriod = input?.currentPeriod ?? "this_month";
    const curRange = resolveDateRange({ period: curPeriod, todayISO });
    if (!curRange.ok) return toolFailure("compare_spending_periods", "INVALID_INPUT", curRange.error, curRange.todayISO);
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("compare_spending_periods", "UNAUTHENTICATED", authErr, curRange.todayISO);

    const prevTo = addDays(curRange.fromDate, -1);
    const prevFrom =
      curPeriod === "today"
        ? prevTo
        : curPeriod === "this_week"
          ? addDays(prevTo, -6)
          : `${prevTo.slice(0, 7)}-01`;

    try {
      const all = filterOwnedRows(await ds.listTransactions({ from: prevFrom, to: curRange.toDate, limit: 500 }), ds.userId);
      let curTotal = 0;
      let prevTotal = 0;
      for (const t of all) {
        if (t.type !== "expense" || t.ownership !== "mine") continue;
        const amt = toPaise(t.amount);
        if (t.transaction_date >= curRange.fromDate && t.transaction_date <= curRange.toDate) curTotal += amt;
        else if (t.transaction_date >= prevFrom && t.transaction_date <= prevTo) prevTotal += amt;
      }

      const intel = analyzeSpendingIntelligence(
        all.map((t) => ({
          id: t.id,
          type: t.type,
          amountPaise: toPaise(t.amount),
          date: t.transaction_date,
          category: t.category,
          ownership: t.ownership,
          expenseType: t.expense_type,
        })),
        todayISO
      );

      const delta = curTotal - prevTotal;
      return toolSuccess(
        "compare_spending_periods",
        {
          currentRange: { fromDate: curRange.fromDate, toDate: curRange.toDate, totalPaise: curTotal },
          previousRange: { fromDate: prevFrom, toDate: prevTo, totalPaise: prevTotal },
          deltaPaise: delta,
          direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
          weekOverWeekChangePercent: intel.weekOverWeekChangePercent,
        },
        all.length > 0,
        todayISO
      );
    } catch (err) {
      return toolFailure("compare_spending_periods", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to compare spending.", todayISO);
    }
  },
};

export const INCOME_EXPENSE_TOOLS = [
  getIncomeForRangeTool,
  getExpensesForRangeTool,
  getSpendingByCategoryTool,
  getTransactionHistoryTool,
  compareSpendingPeriodsTool,
];
