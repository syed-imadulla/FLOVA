// =====================================================================
// FLOVA 2.0 | Sprint 3A — Group D: Group Expenses Tools (Read-Only)
// =====================================================================

import { todayLocalISO } from "../data/dates";
import { computeGroupBalances } from "../services/groupExpenses";
import type { ISODate, Paise, SettlementDirection } from "../types/contracts";
import {
  assertAuthenticatedDataSource,
  filterOwnedRows,
  toolFailure,
  toolSuccess,
  type FinancialToolDataSource,
  type FinancialToolDefinition,
} from "./types";

export interface GroupFilterInput {
  groupId?: string;
  groupName?: string;
  todayISO?: ISODate;
}

export interface GroupsAndMembersOutput {
  groupCount: number;
  groups: Array<{
    id: string;
    name: string;
    description: string | null;
    members: Array<{ isSelf: boolean; personId: string | null; name: string }>;
  }>;
}

export interface GroupBalancesOutput {
  groups: Array<{
    groupId: string;
    groupName: string;
    totalSpendPaise: Paise;
    balances: Array<{ isSelf: boolean; personId: string | null; name: string; netBalanceWithYouPaise: number }>;
  }>;
}

export interface UnsettledGroupExpensesOutput {
  totalUnsettledReceivablePaise: Paise;
  totalUnsettledPayablePaise: Paise;
  expenses: Array<{
    id: string;
    groupId: string;
    groupName: string;
    description: string;
    totalAmountPaise: Paise;
    expenseDate: ISODate;
    unsettledSplits: Array<{
      splitId: string;
      personId: string | null;
      personName: string;
      direction: "they_owe" | "you_owe" | "self_share" | "third_party";
      remainingAmountPaise: Paise;
    }>;
  }>;
}

export interface GroupSettlementHistoryOutput {
  totalCount: number;
  settlements: Array<{
    id: string;
    splitId: string;
    groupName: string;
    direction: SettlementDirection;
    amountPaise: Paise;
    settledAt: string;
    notes: string | null;
  }>;
}

async function loadGroupDataset(ds: FinancialToolDataSource) {
  const [groups, members, people, expenses, splits, settlements] = await Promise.all([
    ds.listExpenseGroups(),
    ds.listGroupMembers(),
    ds.listPeople(),
    ds.listGroupExpenses(),
    ds.listGroupSplits(),
    ds.listGroupSettlements(),
  ]);
  return {
    groups: filterOwnedRows(groups, ds.userId),
    members: filterOwnedRows(members, ds.userId),
    people: filterOwnedRows(people, ds.userId),
    expenses: filterOwnedRows(expenses, ds.userId),
    splits: filterOwnedRows(splits, ds.userId),
    settlements: filterOwnedRows(settlements, ds.userId),
  };
}

function resolveGroups<T extends { id: string; name: string }>(groups: T[], input?: GroupFilterInput): T[] {
  if (input?.groupId) return groups.filter((g) => g.id === input.groupId);
  if (input?.groupName?.trim()) {
    const needle = input.groupName.trim().toLowerCase();
    return groups.filter((g) => g.name.toLowerCase().includes(needle));
  }
  return groups;
}

export const getGroupsAndMembersTool: FinancialToolDefinition<GroupFilterInput, GroupsAndMembersOutput> = {
  name: "get_groups_and_members",
  category: "group_expenses",
  description: "List expense groups and their resolved member names.",
  access: "read_only",
  inputSchema: { required: [], optional: ["groupId", "groupName", "todayISO"] },
  outputSchema: "GroupsAndMembersOutput",
  async execute(input, ds) {
    const asOfDate = input?.todayISO ?? todayLocalISO();
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_groups_and_members", "UNAUTHENTICATED", authErr, asOfDate);

    try {
      const data = await loadGroupDataset(ds);
      const personMap = new Map(data.people.map((p) => [p.id, p.name]));
      const targetGroups = resolveGroups(data.groups, input);
      if ((input?.groupId || input?.groupName) && targetGroups.length === 0) {
        return toolFailure("get_groups_and_members", "NOT_FOUND", "Matching expense group not found.", asOfDate);
      }

      const groups = targetGroups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        members: data.members
          .filter((m) => m.group_id === g.id)
          .map((m) => ({
            isSelf: m.is_self,
            personId: m.person_id,
            name: m.is_self ? "You" : (m.person_id ? personMap.get(m.person_id) ?? "Member" : "Member"),
          })),
      }));

      return toolSuccess("get_groups_and_members", { groupCount: groups.length, groups }, groups.length > 0, asOfDate);
    } catch (err) {
      return toolFailure("get_groups_and_members", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load groups.", asOfDate);
    }
  },
};

export const getGroupBalancesTool: FinancialToolDefinition<GroupFilterInput, GroupBalancesOutput> = {
  name: "get_group_balances",
  category: "group_expenses",
  description: "Compute deterministic per-member net balances for one or all expense groups.",
  access: "read_only",
  inputSchema: { required: [], optional: ["groupId", "groupName", "todayISO"] },
  outputSchema: "GroupBalancesOutput",
  async execute(input, ds) {
    const asOfDate = input?.todayISO ?? todayLocalISO();
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_group_balances", "UNAUTHENTICATED", authErr, asOfDate);

    try {
      const data = await loadGroupDataset(ds);
      const targetGroups = resolveGroups(data.groups, input);
      if ((input?.groupId || input?.groupName) && targetGroups.length === 0) {
        return toolFailure("get_group_balances", "NOT_FOUND", "Matching expense group not found.", asOfDate);
      }

      const groups = targetGroups.map((g) => {
        const gMembers = data.members.filter((m) => m.group_id === g.id);
        const gExpenses = data.expenses.filter((e) => e.group_id === g.id);
        const expIds = new Set(gExpenses.map((e) => e.id));
        const gSplits = data.splits.filter((s) => expIds.has(s.group_expense_id));
        const balances = computeGroupBalances(gMembers, gExpenses, gSplits, data.people);
        return {
          groupId: g.id,
          groupName: g.name,
          totalSpendPaise: gExpenses.reduce((sum, e) => sum + e.total_amount_paise, 0),
          balances: balances.map((b) => ({
            isSelf: b.isSelf,
            personId: b.personId,
            name: b.name,
            netBalanceWithYouPaise: b.netBalanceWithYouPaise,
          })),
        };
      });

      return toolSuccess("get_group_balances", { groups }, groups.length > 0, asOfDate);
    } catch (err) {
      return toolFailure("get_group_balances", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to compute group balances.", asOfDate);
    }
  },
};

export const getUnsettledGroupExpensesTool: FinancialToolDefinition<GroupFilterInput, UnsettledGroupExpensesOutput> = {
  name: "get_unsettled_group_expenses",
  category: "group_expenses",
  description: "List group expenses that still have unsettled split balances.",
  access: "read_only",
  inputSchema: { required: [], optional: ["groupId", "groupName", "todayISO"] },
  outputSchema: "UnsettledGroupExpensesOutput",
  async execute(input, ds) {
    const asOfDate = input?.todayISO ?? todayLocalISO();
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_unsettled_group_expenses", "UNAUTHENTICATED", authErr, asOfDate);

    try {
      const data = await loadGroupDataset(ds);
      const personMap = new Map(data.people.map((p) => [p.id, p.name]));
      const targetGroups = resolveGroups(data.groups, input);
      const groupMap = new Map(targetGroups.map((g) => [g.id, g.name]));

      let totalRec = 0;
      let totalPay = 0;
      const unsettledExpenses: UnsettledGroupExpensesOutput["expenses"] = [];

      for (const exp of data.expenses) {
        const gName = groupMap.get(exp.group_id);
        if (!gName) continue;
        const activeSplits = data.splits.filter(
          (s) => s.group_expense_id === exp.id && s.status !== "settled" && s.remaining_amount_paise > 0
        );
        if (activeSplits.length === 0) continue;

        for (const s of activeSplits) {
          if (s.direction === "they_owe") totalRec += s.remaining_amount_paise;
          else if (s.direction === "you_owe") totalPay += s.remaining_amount_paise;
        }

        unsettledExpenses.push({
          id: exp.id,
          groupId: exp.group_id,
          groupName: gName,
          description: exp.description,
          totalAmountPaise: exp.total_amount_paise,
          expenseDate: exp.expense_date,
          unsettledSplits: activeSplits.map((s) => ({
            splitId: s.id,
            personId: s.person_id,
            personName: s.is_self ? "You" : (s.person_id ? personMap.get(s.person_id) ?? "Member" : "Member"),
            direction: s.direction,
            remainingAmountPaise: s.remaining_amount_paise,
          })),
        });
      }

      return toolSuccess(
        "get_unsettled_group_expenses",
        {
          totalUnsettledReceivablePaise: totalRec,
          totalUnsettledPayablePaise: totalPay,
          expenses: unsettledExpenses,
        },
        unsettledExpenses.length > 0,
        asOfDate
      );
    } catch (err) {
      return toolFailure("get_unsettled_group_expenses", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load unsettled expenses.", asOfDate);
    }
  },
};

export const getGroupSettlementHistoryTool: FinancialToolDefinition<GroupFilterInput, GroupSettlementHistoryOutput> = {
  name: "get_group_settlement_history",
  category: "group_expenses",
  description: "Get group expense settlement history, optionally filtered by group.",
  access: "read_only",
  inputSchema: { required: [], optional: ["groupId", "groupName", "todayISO"] },
  outputSchema: "GroupSettlementHistoryOutput",
  async execute(input, ds) {
    const asOfDate = input?.todayISO ?? todayLocalISO();
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_group_settlement_history", "UNAUTHENTICATED", authErr, asOfDate);

    try {
      const data = await loadGroupDataset(ds);
      const targetGroups = resolveGroups(data.groups, input);
      const groupMap = new Map(targetGroups.map((g) => [g.id, g.name]));
      const expMap = new Map(data.expenses.map((e) => [e.id, e]));
      const splitMap = new Map(data.splits.map((s) => [s.id, s]));

      const settlements = data.settlements
        .map((st) => {
          const split = splitMap.get(st.group_expense_split_id);
          const exp = split ? expMap.get(split.group_expense_id) : undefined;
          const groupName = exp ? groupMap.get(exp.group_id) : undefined;
          if (!groupName) return null;
          return {
            id: st.id,
            splitId: st.group_expense_split_id,
            groupName,
            direction: st.direction,
            amountPaise: st.amount_paise,
            settledAt: st.settled_at,
            notes: st.notes,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      return toolSuccess(
        "get_group_settlement_history",
        { totalCount: settlements.length, settlements },
        settlements.length > 0,
        asOfDate
      );
    } catch (err) {
      return toolFailure("get_group_settlement_history", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load group settlements.", asOfDate);
    }
  },
};

export const GROUP_EXPENSE_TOOLS = [
  getGroupsAndMembersTool,
  getGroupBalancesTool,
  getUnsettledGroupExpensesTool,
  getGroupSettlementHistoryTool,
];
