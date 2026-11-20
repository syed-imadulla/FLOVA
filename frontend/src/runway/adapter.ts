import { calculateConfirmedBalance, calculateDailyRunway, type DailyProjectionEntry, type RunwayProjectionResult } from "../engine";
import type { ISODate, RunwayInput } from "../types/contracts";

export interface ProcessedRunway {
  status: "PROJECTED" | "INSUFFICIENT_INFORMATION" | "INVALID_INPUT";
  confirmedBalancePaise: number | null;
  custodialOwedPaise: number | null;
  dailyEssentialExpensePaise: number | null;
  firstShortfallDate: ISODate | null;
  projectedZeroBalanceDate: ISODate | null;
  runwayDays: number | null;
  projections: DailyProjectionEntry[];
  missingInputs: string[];
  upcomingCommitments: Array<{ id: string; title: string; amount: number; dueDate: string }>;
  expectedPayouts: Array<{ id: string; kind: string; expected: number; expectedDate?: string | null; status: string }>;
  reason?: string;
}

export function processRunwayFeed(
  input: RunwayInput | null,
  options: { horizonDays?: number; startDate?: ISODate } = {}
): ProcessedRunway {
  const missingInputs: string[] = [];

  if (!input || !input.latestCheckin) {
    missingInputs.push("Balance check-in");
  }

  if (!input || input.profile.dailyLivingEstimate === null) {
    missingInputs.push("Daily living estimate (food, personal)");
  }

  if (!input || input.profile.dailyWorkEstimate === null) {
    missingInputs.push("Daily work estimate (fuel, phone)");
  }

  const upcomingCommitments = input?.commitments
    ? input.commitments.map((c) => ({
        id: c.id,
        title: c.title,
        amount: c.amount,
        dueDate: c.dueDate,
      }))
    : [];

  const expectedPayouts = input?.payouts
    ? input.payouts
        .filter((p) => p.status === "scheduled" || p.status === "estimated" || p.status === "unearned")
        .map((p) => ({
          id: p.id,
          kind: p.kind,
          expected: p.expected,
          expectedDate: p.expectedDate ?? null,
          status: p.status,
        }))
    : [];

  if (!input || missingInputs.length > 0) {
    // If check-in exists, we can still report confirmed starting balance
    let confirmedBal: number | null = null;
    let custodial: number | null = null;
    if (input && input.latestCheckin) {
      const balRes = calculateConfirmedBalance(input);
      if (balRes.status === "CONFIRMED") {
        confirmedBal = balRes.confirmedBalancePaise;
        custodial = balRes.custodialOwedPaise;
      }
    }

    return {
      status: "INSUFFICIENT_INFORMATION",
      confirmedBalancePaise: confirmedBal,
      custodialOwedPaise: custodial,
      dailyEssentialExpensePaise: null,
      firstShortfallDate: null,
      projectedZeroBalanceDate: null,
      runwayDays: null,
      projections: [],
      missingInputs,
      upcomingCommitments,
      expectedPayouts,
      reason: `Not enough information yet. Missing: ${missingInputs.join(", ")}.`,
    };
  }

  const horizon = options.horizonDays ?? 7;
  const projectionResult: RunwayProjectionResult = calculateDailyRunway({
    ...input,
    horizonDays: horizon,
    startDate: options.startDate,
  });

  const balanceRes = calculateConfirmedBalance(input);

  return {
    status: projectionResult.status,
    confirmedBalancePaise: projectionResult.startingConfirmedBalancePaise ?? balanceRes.confirmedBalancePaise,
    custodialOwedPaise: balanceRes.custodialOwedPaise,
    dailyEssentialExpensePaise: projectionResult.dailyEssentialExpensePaise,
    firstShortfallDate: projectionResult.firstShortfallDate,
    projectedZeroBalanceDate: projectionResult.projectedZeroBalanceDate,
    runwayDays: projectionResult.runwayDays,
    projections: projectionResult.projections,
    missingInputs: [],
    upcomingCommitments,
    expectedPayouts,
    reason: projectionResult.reason,
  };
}
