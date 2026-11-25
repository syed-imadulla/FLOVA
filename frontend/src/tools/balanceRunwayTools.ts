// =====================================================================
// FLOVA 2.0 | Sprint 3A — Group A: Balance & Runway Tools (Read-Only)
// =====================================================================

import { todayLocalISO } from "../data/dates";
import { calculateConfirmedBalance, calculateDailyRunway, isValidISODate } from "../engine";
import type { ISODate, Paise } from "../types/contracts";
import {
  assertAuthenticatedDataSource,
  toolFailure,
  toolSuccess,
  type FinancialToolDataSource,
  type FinancialToolDefinition,
  type ToolResult,
} from "./types";

export interface BalanceRunwayInput {
  todayISO?: ISODate;
  horizonDays?: number;
}

export interface ConfirmedBalanceOutput {
  cashPaise: Paise;
  bankPaise: Paise;
  confirmedBalancePaise: number;
  custodialOwedPaise: number;
  earnedIncomePaise: Paise;
  nonEarnedInflowPaise: Paise;
  checkedAt: string;
}

export interface AvailableLiquidityOutput {
  confirmedBalancePaise: number;
  safeBufferPaise: Paise;
  availableLiquidityPaise: Paise;
  peerReceivableExcludedPaise: Paise;
  groupReceivableExcludedPaise: Paise;
}

export interface SustainableCapitalOutput {
  availableLiquidityPaise: Paise;
  peerLiabilityPaise: Paise;
  groupLiabilityPaise: Paise;
  sustainableCapitalPaise: Paise;
}

export interface DailySafeToSpendOutput {
  safeToSpendTodayPaise: Paise;
  dailyEssentialExpensePaise: Paise;
  availableLiquidityPaise: Paise;
  sustainableCapitalPaise: Paise;
  runwayDays: number;
  afterCommitmentsRemainingPaise: number;
}

export interface RunwayAndCommitmentsOutput {
  runwayDays: number;
  sustainableRunwayDays: number;
  firstShortfallDate: ISODate | null;
  projectedEndBalancePaise: number;
  upcomingCommitmentsTotalPaise: Paise;
  upcomingCommitments: Array<{ id: string; title: string; amountPaise: Paise; dueDate: ISODate; kind: string }>;
}

async function loadValidatedRunway(
  toolName: string,
  input: BalanceRunwayInput,
  ds: FinancialToolDataSource
): Promise<
  | { ok: true; asOfDate: ISODate; runwayInput: Awaited<ReturnType<FinancialToolDataSource["loadRunwayInput"]>> }
  | { ok: false; result: ToolResult<never> }
> {
  const asOfDate = input?.todayISO ?? todayLocalISO();
  if (!isValidISODate(asOfDate)) {
    return { ok: false, result: toolFailure(toolName, "INVALID_INPUT", `Invalid todayISO: "${asOfDate}".`, todayLocalISO()) };
  }
  const authErr = assertAuthenticatedDataSource(ds);
  if (authErr) return { ok: false, result: toolFailure(toolName, "UNAUTHENTICATED", authErr, asOfDate) };

  if (input?.horizonDays !== undefined && (!Number.isInteger(input.horizonDays) || input.horizonDays < 1 || input.horizonDays > 365)) {
    return { ok: false, result: toolFailure(toolName, "INVALID_INPUT", "horizonDays must be an integer between 1 and 365.", asOfDate) };
  }

  try {
    const runwayInput = await ds.loadRunwayInput();
    return { ok: true, asOfDate, runwayInput };
  } catch (err) {
    return {
      ok: false,
      result: toolFailure(toolName, "SERVICE_ERROR", err instanceof Error ? err.message : "Failed to load runway input.", asOfDate),
    };
  }
}

export const getConfirmedBalanceTool: FinancialToolDefinition<BalanceRunwayInput, ConfirmedBalanceOutput> = {
  name: "get_confirmed_balance",
  category: "balance_runway",
  description: "Get confirmed personal cash and bank balance, excluding custodial not-mine funds and unreceived receivables.",
  access: "read_only",
  inputSchema: { required: [], optional: ["todayISO"] },
  outputSchema: "ConfirmedBalanceOutput",
  async execute(input, ds) {
    const loaded = await loadValidatedRunway("get_confirmed_balance", input ?? {}, ds);
    if (!loaded.ok) return loaded.result;
    const { asOfDate, runwayInput } = loaded;

    const bal = calculateConfirmedBalance(runwayInput);
    if (bal.status !== "CONFIRMED" || bal.confirmedBalancePaise === null || !runwayInput.latestCheckin) {
      return toolFailure(
        "get_confirmed_balance",
        "INSUFFICIENT_BASELINE",
        bal.reason || "No balance check-in found.",
        asOfDate
      );
    }

    return toolSuccess(
      "get_confirmed_balance",
      {
        cashPaise: runwayInput.latestCheckin.cash,
        bankPaise: runwayInput.latestCheckin.bank,
        confirmedBalancePaise: bal.confirmedBalancePaise,
        custodialOwedPaise: bal.custodialOwedPaise ?? 0,
        earnedIncomePaise: bal.breakdown?.earnedIncomePaise ?? 0,
        nonEarnedInflowPaise: bal.breakdown?.nonEarnedInflowPaise ?? 0,
        checkedAt: runwayInput.latestCheckin.checkedAt,
      },
      true,
      asOfDate
    );
  },
};

export const getAvailableLiquidityTool: FinancialToolDefinition<BalanceRunwayInput, AvailableLiquidityOutput> = {
  name: "get_available_liquidity",
  category: "balance_runway",
  description: "Get spendable available liquidity after safe buffer, strictly excluding peer/group receivables.",
  access: "read_only",
  inputSchema: { required: [], optional: ["todayISO"] },
  outputSchema: "AvailableLiquidityOutput",
  async execute(input, ds) {
    const loaded = await loadValidatedRunway("get_available_liquidity", input ?? {}, ds);
    if (!loaded.ok) return loaded.result;
    const { asOfDate, runwayInput } = loaded;

    const bal = calculateConfirmedBalance(runwayInput);
    if (bal.status !== "CONFIRMED" || bal.confirmedBalancePaise === null) {
      return toolFailure("get_available_liquidity", "INSUFFICIENT_BASELINE", bal.reason || "No balance check-in found.", asOfDate);
    }
    const safeBuffer = runwayInput.profile.safeRunwayBuffer ?? 0;
    const availableLiquidityPaise = Math.max(0, bal.confirmedBalancePaise - safeBuffer);

    return toolSuccess(
      "get_available_liquidity",
      {
        confirmedBalancePaise: bal.confirmedBalancePaise,
        safeBufferPaise: safeBuffer,
        availableLiquidityPaise,
        peerReceivableExcludedPaise: bal.peerReceivablePaise ?? 0,
        groupReceivableExcludedPaise: bal.groupReceivablePaise ?? 0,
      },
      true,
      asOfDate
    );
  },
};

export const getSustainableCapitalTool: FinancialToolDefinition<BalanceRunwayInput, SustainableCapitalOutput> = {
  name: "get_sustainable_capital",
  category: "balance_runway",
  description: "Get debt-free sustainable capital (available liquidity minus peer and group liabilities).",
  access: "read_only",
  inputSchema: { required: [], optional: ["todayISO"] },
  outputSchema: "SustainableCapitalOutput",
  async execute(input, ds) {
    const loaded = await loadValidatedRunway("get_sustainable_capital", input ?? {}, ds);
    if (!loaded.ok) return loaded.result;
    const { asOfDate, runwayInput } = loaded;

    const bal = calculateConfirmedBalance(runwayInput);
    if (bal.status !== "CONFIRMED" || bal.confirmedBalancePaise === null) {
      return toolFailure("get_sustainable_capital", "INSUFFICIENT_BASELINE", bal.reason || "No balance check-in found.", asOfDate);
    }
    const safeBuffer = runwayInput.profile.safeRunwayBuffer ?? 0;
    const availableLiquidityPaise = Math.max(0, bal.confirmedBalancePaise - safeBuffer);
    const peerLiab = bal.peerLiabilityPaise ?? 0;
    const groupLiab = bal.groupLiabilityPaise ?? 0;
    const sustainableCapitalPaise = Math.max(0, bal.confirmedBalancePaise - peerLiab - groupLiab - safeBuffer);

    return toolSuccess(
      "get_sustainable_capital",
      {
        availableLiquidityPaise,
        peerLiabilityPaise: peerLiab,
        groupLiabilityPaise: groupLiab,
        sustainableCapitalPaise,
      },
      true,
      asOfDate
    );
  },
};

export const getDailySafeToSpendTool: FinancialToolDefinition<BalanceRunwayInput, DailySafeToSpendOutput> = {
  name: "get_daily_safe_to_spend",
  category: "balance_runway",
  description: "Calculate deterministic daily safe-to-spend amount and remaining cash after upcoming commitments.",
  access: "read_only",
  inputSchema: { required: [], optional: ["todayISO", "horizonDays"] },
  outputSchema: "DailySafeToSpendOutput",
  async execute(input, ds) {
    const loaded = await loadValidatedRunway("get_daily_safe_to_spend", input ?? {}, ds);
    if (!loaded.ok) return loaded.result;
    const { asOfDate, runwayInput } = loaded;

    const runway = calculateDailyRunway({
      ...runwayInput,
      horizonDays: input?.horizonDays ?? 30,
      startDate: asOfDate,
    });
    if (runway.status !== "PROJECTED") {
      return toolFailure(
        "get_daily_safe_to_spend",
        "INSUFFICIENT_BASELINE",
        runway.reason || "Missing check-in or daily living/work expense baseline.",
        asOfDate
      );
    }

    const available = runway.availableLiquidityPaise ?? 0;
    const sustainable = runway.sustainableCapitalPaise ?? 0;
    const dailyEssential = runway.dailyEssentialExpensePaise ?? 0;
    const days = Math.max(1, runway.runwayDays ?? 1);
    const perDaySafe = Math.min(available, Math.floor(sustainable / days));
    const commitmentsTotal = runwayInput.commitments.reduce((sum, c) => sum + c.amount, 0);

    return toolSuccess(
      "get_daily_safe_to_spend",
      {
        safeToSpendTodayPaise: Math.max(0, Math.min(available, Math.max(dailyEssential, perDaySafe))),
        dailyEssentialExpensePaise: dailyEssential,
        availableLiquidityPaise: available,
        sustainableCapitalPaise: sustainable,
        runwayDays: runway.runwayDays ?? 0,
        afterCommitmentsRemainingPaise: available - commitmentsTotal,
      },
      true,
      asOfDate
    );
  },
};

export const getRunwayAndCommitmentsTool: FinancialToolDefinition<BalanceRunwayInput, RunwayAndCommitmentsOutput> = {
  name: "get_runway_and_commitments",
  category: "balance_runway",
  description: "Get full deterministic runway projection and upcoming financial commitments.",
  access: "read_only",
  inputSchema: { required: [], optional: ["todayISO", "horizonDays"] },
  outputSchema: "RunwayAndCommitmentsOutput",
  async execute(input, ds) {
    const loaded = await loadValidatedRunway("get_runway_and_commitments", input ?? {}, ds);
    if (!loaded.ok) return loaded.result;
    const { asOfDate, runwayInput } = loaded;

    const runway = calculateDailyRunway({
      ...runwayInput,
      horizonDays: input?.horizonDays ?? 30,
      startDate: asOfDate,
    });
    if (runway.status !== "PROJECTED") {
      return toolFailure(
        "get_runway_and_commitments",
        "INSUFFICIENT_BASELINE",
        runway.reason || "Cannot project runway without check-in and daily estimates.",
        asOfDate
      );
    }

    const lastProj = runway.projections[runway.projections.length - 1];
    const upcomingCommitments = runwayInput.commitments.map((c) => ({
      id: c.id,
      title: c.title,
      amountPaise: c.amount,
      dueDate: c.dueDate,
      kind: c.kind,
    }));

    return toolSuccess(
      "get_runway_and_commitments",
      {
        runwayDays: runway.runwayDays ?? 0,
        sustainableRunwayDays: runway.sustainableRunwayDays ?? runway.runwayDays ?? 0,
        firstShortfallDate: runway.firstShortfallDate,
        projectedEndBalancePaise: lastProj ? lastProj.closingBalancePaise : 0,
        upcomingCommitmentsTotalPaise: upcomingCommitments.reduce((s, c) => s + c.amountPaise, 0),
        upcomingCommitments,
      },
      true,
      asOfDate
    );
  },
};

export const BALANCE_RUNWAY_TOOLS = [
  getConfirmedBalanceTool,
  getAvailableLiquidityTool,
  getSustainableCapitalTool,
  getDailySafeToSpendTool,
  getRunwayAndCommitmentsTool,
];
