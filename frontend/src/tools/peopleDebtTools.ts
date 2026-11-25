// =====================================================================
// FLOVA 2.0 | Sprint 3A — Group C: People & Debts Tools (Read-Only)
// Receivables are never treated as available cash.
// =====================================================================

import { todayLocalISO } from "../data/dates";
import { computeMoneyOverview, computePeopleSummaries } from "../services/peerDebts";
import type { ISODate, Paise, SettlementDirection } from "../types/contracts";
import {
  assertAuthenticatedDataSource,
  filterOwnedRows,
  toolFailure,
  toolSuccess,
  type FinancialToolDataSource,
  type FinancialToolDefinition,
} from "./types";

export interface PeopleQueryInput {
  todayISO?: ISODate;
}

export interface PersonLookupInput {
  personId?: string;
  personName?: string;
  todayISO?: ISODate;
}

export interface SettlementHistoryInput extends PersonLookupInput {
  limit?: number;
}

export interface PeopleSummariesOutput {
  peopleCount: number;
  totalToReceivePaise: Paise;
  totalToRepayPaise: Paise;
  summaries: Array<{
    personId: string;
    name: string;
    netBalancePaise: number;
    receivableRemainingPaise: Paise;
    payableRemainingPaise: Paise;
    statusLabel: string;
  }>;
}

export interface MoneyOwedToUserOutput {
  totalReceivablePaise: Paise;
  personalReceivablePaise: Paise;
  groupReceivablePaise: Paise;
  isAvailableCash: false;
  debtors: Array<{ personId: string; name: string; amountPaise: Paise }>;
}

export interface MoneyUserOwesOutput {
  totalPayablePaise: Paise;
  personalPayablePaise: Paise;
  groupPayablePaise: Paise;
  creditors: Array<{ personId: string; name: string; amountPaise: Paise }>;
}

export interface DebtSettlementHistoryOutput {
  totalCount: number;
  settlements: Array<{
    id: string;
    debtId: string;
    personId: string;
    personName: string;
    direction: SettlementDirection;
    amountPaise: Paise;
    settledAt: string;
    notes: string | null;
  }>;
}

export interface PersonOutstandingOutput {
  personId: string;
  name: string;
  netBalancePaise: number;
  receivableRemainingPaise: Paise;
  payableRemainingPaise: Paise;
  totalLentPaise: Paise;
  totalReceivedPaise: Paise;
  totalBorrowedPaise: Paise;
  totalRepaidPaise: Paise;
  statusLabel: string;
  activeDebts: Array<{
    id: string;
    direction: "they_owe" | "you_owe";
    totalAmountPaise: Paise;
    remainingAmountPaise: Paise;
    reason: string | null;
    dueDate: ISODate | null;
  }>;
}

async function loadPeopleDataset(ds: FinancialToolDataSource) {
  const [people, peerDebts, debtSettlements, groupExpenses, groupSplits, groupSettlements] = await Promise.all([
    ds.listPeople(),
    ds.listPeerDebts(),
    ds.listDebtSettlements(),
    ds.listGroupExpenses(),
    ds.listGroupSplits(),
    ds.listGroupSettlements(),
  ]);
  const ownedPeople = filterOwnedRows(people, ds.userId);
  const ownedDebts = filterOwnedRows(peerDebts, ds.userId);
  const ownedSettlements = filterOwnedRows(debtSettlements, ds.userId);
  const ownedGroupExpenses = filterOwnedRows(groupExpenses, ds.userId);
  const ownedGroupSplits = filterOwnedRows(groupSplits, ds.userId);
  const ownedGroupSettlements = filterOwnedRows(groupSettlements, ds.userId);

  const payerMap = new Map(ownedGroupExpenses.map((e) => [e.id, e.paid_by_self ? null : e.paid_by_person_id]));
  const summaries = computePeopleSummaries(
    ownedPeople,
    ownedDebts,
    ownedSettlements,
    ownedGroupSplits,
    ownedGroupSettlements,
    payerMap
  );
  const overview = computeMoneyOverview(ownedPeople, ownedDebts, ownedGroupSplits);
  return { ownedPeople, ownedDebts, ownedSettlements, summaries, overview };
}

export const getPeopleSummariesTool: FinancialToolDefinition<PeopleQueryInput, PeopleSummariesOutput> = {
  name: "get_people_summaries",
  category: "people_debts",
  description: "Get financial balance summaries for all contacts (combining personal debts and group balances).",
  access: "read_only",
  inputSchema: { required: [], optional: ["todayISO"] },
  outputSchema: "PeopleSummariesOutput",
  async execute(input, ds) {
    const asOfDate = input?.todayISO ?? todayLocalISO();
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_people_summaries", "UNAUTHENTICATED", authErr, asOfDate);

    try {
      const { summaries, overview } = await loadPeopleDataset(ds);
      return toolSuccess(
        "get_people_summaries",
        {
          peopleCount: summaries.length,
          totalToReceivePaise: overview.totalToReceivePaise,
          totalToRepayPaise: overview.totalToRepayPaise,
          summaries: summaries.map((s) => ({
            personId: s.person.id,
            name: s.person.name,
            netBalancePaise: s.netBalancePaise,
            receivableRemainingPaise: s.receivableRemainingPaise,
            payableRemainingPaise: s.payableRemainingPaise,
            statusLabel: s.statusLabel,
          })),
        },
        summaries.length > 0,
        asOfDate
      );
    } catch (err) {
      return toolFailure("get_people_summaries", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load people.", asOfDate);
    }
  },
};

export const getMoneyOwedToUserTool: FinancialToolDefinition<PeopleQueryInput, MoneyOwedToUserOutput> = {
  name: "get_money_owed_to_user",
  category: "people_debts",
  description: "Get total money owed to the user (receivables only; never treated as available cash).",
  access: "read_only",
  inputSchema: { required: [], optional: ["todayISO"] },
  outputSchema: "MoneyOwedToUserOutput",
  async execute(input, ds) {
    const asOfDate = input?.todayISO ?? todayLocalISO();
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_money_owed_to_user", "UNAUTHENTICATED", authErr, asOfDate);

    try {
      const { summaries, overview } = await loadPeopleDataset(ds);
      const debtors = summaries
        .filter((s) => s.netBalancePaise > 0)
        .map((s) => ({ personId: s.person.id, name: s.person.name, amountPaise: s.netBalancePaise }));
      return toolSuccess(
        "get_money_owed_to_user",
        {
          totalReceivablePaise: overview.totalToReceivePaise,
          personalReceivablePaise: overview.personalToReceivePaise,
          groupReceivablePaise: overview.groupToReceivePaise,
          isAvailableCash: false,
          debtors,
        },
        debtors.length > 0,
        asOfDate
      );
    } catch (err) {
      return toolFailure("get_money_owed_to_user", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load receivables.", asOfDate);
    }
  },
};

export const getMoneyUserOwesTool: FinancialToolDefinition<PeopleQueryInput, MoneyUserOwesOutput> = {
  name: "get_money_user_owes",
  category: "people_debts",
  description: "Get total money the user owes to others (personal borrowing + group payables).",
  access: "read_only",
  inputSchema: { required: [], optional: ["todayISO"] },
  outputSchema: "MoneyUserOwesOutput",
  async execute(input, ds) {
    const asOfDate = input?.todayISO ?? todayLocalISO();
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_money_user_owes", "UNAUTHENTICATED", authErr, asOfDate);

    try {
      const { summaries, overview } = await loadPeopleDataset(ds);
      const creditors = summaries
        .filter((s) => s.netBalancePaise < 0)
        .map((s) => ({ personId: s.person.id, name: s.person.name, amountPaise: Math.abs(s.netBalancePaise) }));
      return toolSuccess(
        "get_money_user_owes",
        {
          totalPayablePaise: overview.totalToRepayPaise,
          personalPayablePaise: overview.personalToRepayPaise,
          groupPayablePaise: overview.groupToRepayPaise,
          creditors,
        },
        creditors.length > 0,
        asOfDate
      );
    } catch (err) {
      return toolFailure("get_money_user_owes", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load payables.", asOfDate);
    }
  },
};

export const getDebtSettlementHistoryTool: FinancialToolDefinition<SettlementHistoryInput, DebtSettlementHistoryOutput> = {
  name: "get_debt_settlement_history",
  category: "people_debts",
  description: "Get peer debt repayment/settlement history, optionally filtered by person.",
  access: "read_only",
  inputSchema: { required: [], optional: ["personId", "personName", "limit", "todayISO"] },
  outputSchema: "DebtSettlementHistoryOutput",
  async execute(input, ds) {
    const asOfDate = input?.todayISO ?? todayLocalISO();
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_debt_settlement_history", "UNAUTHENTICATED", authErr, asOfDate);

    try {
      const { ownedPeople, ownedDebts, ownedSettlements } = await loadPeopleDataset(ds);
      const personMap = new Map(ownedPeople.map((p) => [p.id, p]));
      const debtMap = new Map(ownedDebts.map((d) => [d.id, d]));

      let rows = ownedSettlements.map((s) => {
        const debt = debtMap.get(s.debt_id);
        const person = debt ? personMap.get(debt.person_id) : undefined;
        return {
          id: s.id,
          debtId: s.debt_id,
          personId: debt?.person_id ?? "",
          personName: person?.name ?? "Unknown",
          direction: s.direction,
          amountPaise: s.amount_paise,
          settledAt: s.settled_at,
          notes: s.notes,
        };
      });

      if (input?.personId) {
        rows = rows.filter((r) => r.personId === input.personId);
      } else if (input?.personName) {
        const needle = input.personName.trim().toLowerCase();
        rows = rows.filter((r) => r.personName.toLowerCase().includes(needle));
      }

      const limit = input?.limit ?? 50;
      return toolSuccess(
        "get_debt_settlement_history",
        { totalCount: rows.length, settlements: rows.slice(0, limit) },
        rows.length > 0,
        asOfDate
      );
    } catch (err) {
      return toolFailure("get_debt_settlement_history", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load settlements.", asOfDate);
    }
  },
};

export const getPersonOutstandingBalanceTool: FinancialToolDefinition<PersonLookupInput, PersonOutstandingOutput> = {
  name: "get_person_outstanding_balance",
  category: "people_debts",
  description: "Get outstanding balance and active debts for a specific person by ID or name.",
  access: "read_only",
  inputSchema: { required: [], optional: ["personId", "personName", "todayISO"] },
  outputSchema: "PersonOutstandingOutput",
  async execute(input, ds) {
    const asOfDate = input?.todayISO ?? todayLocalISO();
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_person_outstanding_balance", "UNAUTHENTICATED", authErr, asOfDate);

    if (!input?.personId && !input?.personName?.trim()) {
      return toolFailure("get_person_outstanding_balance", "INVALID_INPUT", "Either personId or personName is required.", asOfDate);
    }

    try {
      const { ownedDebts, summaries } = await loadPeopleDataset(ds);
      const target = input.personId
        ? summaries.find((s) => s.person.id === input.personId)
        : summaries.find((s) => s.person.name.toLowerCase().includes(input.personName!.trim().toLowerCase()));

      if (!target) {
        return toolFailure("get_person_outstanding_balance", "NOT_FOUND", "Person not found.", asOfDate);
      }

      const activeDebts = ownedDebts
        .filter((d) => d.person_id === target.person.id && d.status !== "settled")
        .map((d) => ({
          id: d.id,
          direction: d.direction,
          totalAmountPaise: d.total_amount_paise,
          remainingAmountPaise: d.remaining_amount_paise,
          reason: d.reason,
          dueDate: d.due_date,
        }));

      return toolSuccess(
        "get_person_outstanding_balance",
        {
          personId: target.person.id,
          name: target.person.name,
          netBalancePaise: target.netBalancePaise,
          receivableRemainingPaise: target.receivableRemainingPaise,
          payableRemainingPaise: target.payableRemainingPaise,
          totalLentPaise: target.totalLentPaise,
          totalReceivedPaise: target.totalReceivedPaise,
          totalBorrowedPaise: target.totalBorrowedPaise,
          totalRepaidPaise: target.totalRepaidPaise,
          statusLabel: target.statusLabel,
          activeDebts,
        },
        true,
        asOfDate
      );
    } catch (err) {
      return toolFailure("get_person_outstanding_balance", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load person balance.", asOfDate);
    }
  },
};

export const PEOPLE_DEBT_TOOLS = [
  getPeopleSummariesTool,
  getMoneyOwedToUserTool,
  getMoneyUserOwesTool,
  getDebtSettlementHistoryTool,
  getPersonOutstandingBalanceTool,
];
