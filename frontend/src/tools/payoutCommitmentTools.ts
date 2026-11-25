// =====================================================================
// FLOVA 2.0 | Sprint 3A — Group E: Payouts & Commitments Tools (Read-Only)
// Expected payouts are never treated as received cash.
// =====================================================================

import { todayLocalISO } from "../data/dates";
import { calculateConfirmedBalance, isValidISODate } from "../engine";
import { toPaise } from "../lib/money";
import type { ISODate, Paise, PayoutStatus } from "../types/contracts";
import {
  assertAuthenticatedDataSource,
  filterOwnedRows,
  toolFailure,
  toolSuccess,
  type FinancialToolDefinition,
} from "./types";

export interface PayoutCommitmentInput {
  todayISO?: ISODate;
}

export interface UpcomingPayoutsOutput {
  totalExpectedPaise: Paise;
  nextPayout: {
    id: string;
    source: string | null;
    kind: string;
    expectedPaise: Paise;
    receivedPaise: Paise;
    expectedDate: ISODate | null;
    status: PayoutStatus;
  } | null;
  payouts: Array<{
    id: string;
    source: string | null;
    kind: string;
    expectedPaise: Paise;
    receivedPaise: Paise;
    expectedDate: ISODate | null;
    status: PayoutStatus;
  }>;
}

export interface PayoutHistoryOutput {
  totalCount: number;
  payouts: Array<{
    id: string;
    source: string | null;
    kind: string;
    expectedPaise: Paise;
    receivedPaise: Paise;
    expectedDate: ISODate | null;
    status: PayoutStatus;
  }>;
}

export interface UpcomingCommitmentsOutput {
  totalUpcomingPaise: Paise;
  remainingAfterCommitmentsPaise: number | null;
  commitments: Array<{
    id: string;
    title: string;
    kind: string;
    amountPaise: Paise;
    dueDate: ISODate;
  }>;
}

export interface OverdueObligationsOutput {
  overdueCommitmentsCount: number;
  overdueCommitmentsTotalPaise: Paise;
  overdueCommitments: Array<{ id: string; title: string; amountPaise: Paise; dueDate: ISODate }>;
  overduePeerDebtsCount: number;
  overduePeerDebtsTotalPaise: Paise;
  overduePeerDebts: Array<{ id: string; personName: string; remainingAmountPaise: Paise; dueDate: ISODate }>;
}

export const getUpcomingPayoutsTool: FinancialToolDefinition<PayoutCommitmentInput, UpcomingPayoutsOutput> = {
  name: "get_upcoming_payouts",
  category: "payouts_commitments",
  description: "Get upcoming/scheduled/estimated payouts (forward-looking only, excluded from liquid cash).",
  access: "read_only",
  inputSchema: { required: [], optional: ["todayISO"] },
  outputSchema: "UpcomingPayoutsOutput",
  async execute(input, ds) {
    const asOfDate = input?.todayISO ?? todayLocalISO();
    if (!isValidISODate(asOfDate)) return toolFailure("get_upcoming_payouts", "INVALID_INPUT", "Invalid todayISO.", todayLocalISO());
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_upcoming_payouts", "UNAUTHENTICATED", authErr, asOfDate);

    try {
      const all = filterOwnedRows(await ds.listPayouts(), ds.userId);
      const active = all
        .filter((p) => p.status === "scheduled" || p.status === "estimated" || p.status === "unearned" || p.status === "partial")
        .map((p) => ({
          id: p.id,
          source: p.source,
          kind: p.kind,
          expectedPaise: toPaise(p.expected_amount),
          receivedPaise: toPaise(p.received_amount),
          expectedDate: p.expected_date,
          status: p.status,
        }));

      const totalExpectedPaise = active.reduce((s, p) => s + Math.max(0, p.expectedPaise - p.receivedPaise), 0);
      return toolSuccess(
        "get_upcoming_payouts",
        { totalExpectedPaise, nextPayout: active[0] ?? null, payouts: active },
        active.length > 0,
        asOfDate
      );
    } catch (err) {
      return toolFailure("get_upcoming_payouts", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load payouts.", asOfDate);
    }
  },
};

export const getPayoutHistoryTool: FinancialToolDefinition<PayoutCommitmentInput, PayoutHistoryOutput> = {
  name: "get_payout_history",
  category: "payouts_commitments",
  description: "Get full payout history and status (settled, partial, scheduled, estimated, unearned, cancelled).",
  access: "read_only",
  inputSchema: { required: [], optional: ["todayISO"] },
  outputSchema: "PayoutHistoryOutput",
  async execute(input, ds) {
    const asOfDate = input?.todayISO ?? todayLocalISO();
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_payout_history", "UNAUTHENTICATED", authErr, asOfDate);

    try {
      const all = filterOwnedRows(await ds.listPayouts(), ds.userId);
      const payouts = all.map((p) => ({
        id: p.id,
        source: p.source,
        kind: p.kind,
        expectedPaise: toPaise(p.expected_amount),
        receivedPaise: toPaise(p.received_amount),
        expectedDate: p.expected_date,
        status: p.status,
      }));
      return toolSuccess("get_payout_history", { totalCount: payouts.length, payouts }, payouts.length > 0, asOfDate);
    } catch (err) {
      return toolFailure("get_payout_history", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load payout history.", asOfDate);
    }
  },
};

export const getUpcomingCommitmentsTool: FinancialToolDefinition<PayoutCommitmentInput, UpcomingCommitmentsOutput> = {
  name: "get_upcoming_commitments",
  category: "payouts_commitments",
  description: "Get upcoming bills/commitments and remaining cash after commitments.",
  access: "read_only",
  inputSchema: { required: [], optional: ["todayISO"] },
  outputSchema: "UpcomingCommitmentsOutput",
  async execute(input, ds) {
    const asOfDate = input?.todayISO ?? todayLocalISO();
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_upcoming_commitments", "UNAUTHENTICATED", authErr, asOfDate);

    try {
      const [commitments, runwayInput] = await Promise.all([ds.listCommitments("upcoming"), ds.loadRunwayInput()]);
      const owned = filterOwnedRows(commitments, ds.userId);
      const mapped = owned.map((c) => ({
        id: c.id,
        title: c.title,
        kind: c.kind,
        amountPaise: toPaise(c.amount),
        dueDate: c.due_date,
      }));
      const totalUpcomingPaise = mapped.reduce((s, c) => s + c.amountPaise, 0);

      const bal = calculateConfirmedBalance(runwayInput);
      const safeBuffer = runwayInput.profile.safeRunwayBuffer ?? 0;
      const remainingAfterCommitmentsPaise =
        bal.status === "CONFIRMED" && bal.confirmedBalancePaise !== null
          ? Math.max(0, bal.confirmedBalancePaise - safeBuffer) - totalUpcomingPaise
          : null;

      return toolSuccess(
        "get_upcoming_commitments",
        { totalUpcomingPaise, remainingAfterCommitmentsPaise, commitments: mapped },
        mapped.length > 0,
        asOfDate
      );
    } catch (err) {
      return toolFailure("get_upcoming_commitments", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load commitments.", asOfDate);
    }
  },
};

export const getOverdueObligationsTool: FinancialToolDefinition<PayoutCommitmentInput, OverdueObligationsOutput> = {
  name: "get_overdue_obligations",
  category: "payouts_commitments",
  description: "Get overdue upcoming commitments and overdue personal payables (due_date < todayISO).",
  access: "read_only",
  inputSchema: { required: [], optional: ["todayISO"] },
  outputSchema: "OverdueObligationsOutput",
  async execute(input, ds) {
    const asOfDate = input?.todayISO ?? todayLocalISO();
    if (!isValidISODate(asOfDate)) return toolFailure("get_overdue_obligations", "INVALID_INPUT", "Invalid todayISO.", todayLocalISO());
    const authErr = assertAuthenticatedDataSource(ds);
    if (authErr) return toolFailure("get_overdue_obligations", "UNAUTHENTICATED", authErr, asOfDate);

    try {
      const [commitments, people, debts] = await Promise.all([
        ds.listCommitments("upcoming"),
        ds.listPeople(),
        ds.listPeerDebts(),
      ]);
      const overdueCommitments = filterOwnedRows(commitments, ds.userId)
        .filter((c) => c.due_date < asOfDate)
        .map((c) => ({ id: c.id, title: c.title, amountPaise: toPaise(c.amount), dueDate: c.due_date }));

      const personMap = new Map(filterOwnedRows(people, ds.userId).map((p) => [p.id, p.name]));
      const overduePeerDebts = filterOwnedRows(debts, ds.userId)
        .filter((d) => d.direction === "you_owe" && d.status !== "settled" && d.due_date !== null && d.due_date < asOfDate)
        .map((d) => ({
          id: d.id,
          personName: personMap.get(d.person_id) ?? "Unknown",
          remainingAmountPaise: d.remaining_amount_paise,
          dueDate: d.due_date!,
        }));

      const hasData = overdueCommitments.length > 0 || overduePeerDebts.length > 0;
      return toolSuccess(
        "get_overdue_obligations",
        {
          overdueCommitmentsCount: overdueCommitments.length,
          overdueCommitmentsTotalPaise: overdueCommitments.reduce((s, c) => s + c.amountPaise, 0),
          overdueCommitments,
          overduePeerDebtsCount: overduePeerDebts.length,
          overduePeerDebtsTotalPaise: overduePeerDebts.reduce((s, d) => s + d.remainingAmountPaise, 0),
          overduePeerDebts,
        },
        hasData,
        asOfDate
      );
    } catch (err) {
      return toolFailure("get_overdue_obligations", "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load overdue obligations.", asOfDate);
    }
  },
};

export const PAYOUT_COMMITMENT_TOOLS = [
  getUpcomingPayoutsTool,
  getPayoutHistoryTool,
  getUpcomingCommitmentsTool,
  getOverdueObligationsTool,
];
