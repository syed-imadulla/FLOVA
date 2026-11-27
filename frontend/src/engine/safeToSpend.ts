// =====================================================================
// FLOVA 2.0 | Safe-to-Spend & Daily/Monthly Allowance Engine (Sprint 5C)
// Deterministic integer-paise recommendations reusing calculateConfirmedBalance
// and adaptiveBuffer horizons without double-counting liabilities or bills.
// Invariant: Projected/expected income and receivables are NEVER treated as
// confirmed available cash.
// =====================================================================

import type { ISODate, Paise, RunwayInput } from "../types/contracts";
import { deriveProtectionHorizon } from "./adaptiveBuffer";
import { calculateConfirmedBalance, type ConfirmedBalanceStatus } from "./balance";
import { monthRange } from "./monthSummary";
import { addDays } from "./runway";
import { isValidISODate, isValidPaise, safeAdd, safeSub } from "./validation";

export interface SafeToSpendInput {
  runwayInput: RunwayInput;
  todayISO: ISODate;
  /** Optional explicit user-reserved savings/WISH goal paise (never auto-deducted). */
  explicitReservedGoalsPaise?: Paise;
  /** Optional fallback horizon days when no reliable future income date exists. */
  conservativeFallbackDays?: number;
}

export interface SafeToSpendResult {
  status: ConfirmedBalanceStatus;
  /** Confirmed liquid personal cash (cash + bank - not_mine + post-checkin deltas). */
  confirmedAvailableCashPaise: Paise | null;
  /** Unencumbered capital: max(0, confirmed - peer/group liabilities - safeBuffer). */
  sustainableCapitalPaise: Paise | null;
  /** Safe-to-spend until next expected income date (or conservative horizon). */
  safeToSpendUntilNextIncomePaise: Paise | null;
  /** Recommended daily spending allowance over the active planning horizon. */
  dailySpendingAllowancePaise: Paise | null;
  /** Safe-to-spend remaining for the rest of the calendar month. */
  remainingMonthlyAllowancePaise: Paise | null;
  /** Shortfall if confirmed funds cannot cover liabilities, buffer, and due bills. */
  shortfallPaise: Paise;
  /** True when no reliable future payout date is available (conservative mode). */
  isConservativeFallback: boolean;
  /** Next expected income date (informational; payout amount is NEVER added to cash). */
  nextExpectedIncomeDate: ISODate | null;
  /** Projected next payout amount (kept strictly separate from confirmed cash). */
  projectedNextIncomePaise: Paise;
  planningHorizonDays: number;
  remainingDaysInMonth: number;
  inputs: {
    totalLiabilitiesPaise: Paise;
    peerDebtLiabilityPaise: Paise;
    groupLiabilityPaise: Paise;
    totalReceivablesPaise: Paise;
    safeBufferPaise: Paise;
    overdueCommitmentsPaise: Paise;
    upcomingCommitmentsUntilIncomePaise: Paise;
    upcomingCommitmentsMonthPaise: Paise;
    explicitReservedGoalsPaise: Paise;
  };
  explanation: string[];
  reason?: string;
}

function diffCalendarDays(fromISO: ISODate, toISO: ISODate): number {
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  const fromUtc = Date.UTC(fy, fm - 1, fd);
  const toUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((toUtc - fromUtc) / 86400000);
}

/**
 * Computes deterministic safe-to-spend, daily allowance, and remaining monthly allowance.
 */
export function calculateSafeToSpend(input: SafeToSpendInput): SafeToSpendResult {
  const { runwayInput, todayISO } = input;

  if (!isValidISODate(todayISO)) {
    return {
      status: "INVALID_INPUT",
      confirmedAvailableCashPaise: null,
      sustainableCapitalPaise: null,
      safeToSpendUntilNextIncomePaise: null,
      dailySpendingAllowancePaise: null,
      remainingMonthlyAllowancePaise: null,
      shortfallPaise: 0,
      isConservativeFallback: true,
      nextExpectedIncomeDate: null,
      projectedNextIncomePaise: 0,
      planningHorizonDays: 0,
      remainingDaysInMonth: 0,
      inputs: {
        totalLiabilitiesPaise: 0,
        peerDebtLiabilityPaise: 0,
        groupLiabilityPaise: 0,
        totalReceivablesPaise: 0,
        safeBufferPaise: 0,
        overdueCommitmentsPaise: 0,
        upcomingCommitmentsUntilIncomePaise: 0,
        upcomingCommitmentsMonthPaise: 0,
        explicitReservedGoalsPaise: 0,
      },
      explanation: [],
      reason: `Invalid todayISO date: ${todayISO}. Expected YYYY-MM-DD.`,
    };
  }

  const balanceRes = calculateConfirmedBalance(runwayInput);
  if (balanceRes.status !== "CONFIRMED" || balanceRes.confirmedBalancePaise === null) {
    return {
      status: balanceRes.status,
      confirmedAvailableCashPaise: null,
      sustainableCapitalPaise: null,
      safeToSpendUntilNextIncomePaise: null,
      dailySpendingAllowancePaise: null,
      remainingMonthlyAllowancePaise: null,
      shortfallPaise: 0,
      isConservativeFallback: true,
      nextExpectedIncomeDate: null,
      projectedNextIncomePaise: 0,
      planningHorizonDays: 0,
      remainingDaysInMonth: 0,
      inputs: {
        totalLiabilitiesPaise: 0,
        peerDebtLiabilityPaise: 0,
        groupLiabilityPaise: 0,
        totalReceivablesPaise: 0,
        safeBufferPaise: 0,
        overdueCommitmentsPaise: 0,
        upcomingCommitmentsUntilIncomePaise: 0,
        upcomingCommitmentsMonthPaise: 0,
        explicitReservedGoalsPaise: 0,
      },
      explanation: [],
      reason: balanceRes.reason,
    };
  }

  const confirmedAvailableCashPaise = balanceRes.confirmedBalancePaise;
  // Note: balanceRes.peerLiabilityPaise already includes BOTH peer debts (you_owe) AND group splits (you_owe).
  const totalLiabilitiesPaise = balanceRes.peerLiabilityPaise ?? 0;
  const groupLiabilityPaise = balanceRes.groupLiabilityPaise ?? 0;
  const peerDebtLiabilityPaise = Math.max(0, totalLiabilitiesPaise - groupLiabilityPaise);
  const totalReceivablesPaise = balanceRes.peerReceivablePaise ?? 0;

  const safeBufferPaise: Paise =
    runwayInput.profile.safeRunwayBuffer !== null &&
    runwayInput.profile.safeRunwayBuffer !== undefined &&
    isValidPaise(runwayInput.profile.safeRunwayBuffer)
      ? runwayInput.profile.safeRunwayBuffer
      : 0;

  const explicitReservedGoalsPaise: Paise =
    input.explicitReservedGoalsPaise !== undefined && isValidPaise(input.explicitReservedGoalsPaise)
      ? input.explicitReservedGoalsPaise
      : 0;

  const sustainableCapitalRaw = safeSub(safeSub(confirmedAvailableCashPaise, totalLiabilitiesPaise), safeBufferPaise);
  const sustainableCapitalPaise = Math.max(0, sustainableCapitalRaw);

  // Determine next reliable expected payout date (ONLY for planning horizon; payout money is NOT added to cash)
  const upcomingPayouts = (runwayInput.payouts ?? [])
    .filter((p) => {
      if (!p || p.status === "cancelled" || p.status === "settled" || p.status === "unearned") return false;
      const rem = Math.max(0, (p.expected ?? 0) - (p.received ?? 0));
      return rem > 0 && !!p.expectedDate && isValidISODate(p.expectedDate) && p.expectedDate >= todayISO;
    })
    .sort((a, b) => a.expectedDate!.localeCompare(b.expectedDate!));

  const nextPayout = upcomingPayouts[0] ?? null;
  const nextExpectedIncomeDate = nextPayout?.expectedDate ?? null;
  const projectedNextIncomePaise = nextPayout ? Math.max(0, nextPayout.expected - nextPayout.received) : 0;
  const isConservativeFallback = nextExpectedIncomeDate === null;

  const fallbackDays =
    input.conservativeFallbackDays && input.conservativeFallbackDays > 0
      ? Math.floor(input.conservativeFallbackDays)
      : deriveProtectionHorizon({
          workProfile: runwayInput.profile.workProfile,
          incomeVariability: runwayInput.profile.incomeVariability,
        });

  const planningHorizonDays = nextExpectedIncomeDate
    ? Math.max(1, diffCalendarDays(todayISO, nextExpectedIncomeDate))
    : fallbackDays;

  const horizonEndDate = nextExpectedIncomeDate ?? addDays(todayISO, planningHorizonDays - 1);

  const month = todayISO.slice(0, 7);
  const { to: monthEndDate, daysInMonth } = monthRange(month);
  const dayOfMonth = Number(todayISO.slice(8, 10));
  const remainingDaysInMonth = Math.max(1, daysInMonth - dayOfMonth + 1);

  // Partition upcoming & overdue non-peer commitments (never double-counting peer/group debts)
  let overdueCommitmentsPaise: Paise = 0;
  let upcomingCommitmentsUntilIncomePaise: Paise = 0;
  let upcomingCommitmentsMonthPaise: Paise = 0;

  if (Array.isArray(runwayInput.commitments)) {
    for (const c of runwayInput.commitments) {
      if (!c || !isValidPaise(c.amount) || c.amount <= 0 || !isValidISODate(c.dueDate)) continue;
      if (c.dueDate < todayISO) {
        overdueCommitmentsPaise = safeAdd(overdueCommitmentsPaise, c.amount);
      } else {
        if (c.dueDate <= horizonEndDate) {
          upcomingCommitmentsUntilIncomePaise = safeAdd(upcomingCommitmentsUntilIncomePaise, c.amount);
        }
        if (c.dueDate <= monthEndDate) {
          upcomingCommitmentsMonthPaise = safeAdd(upcomingCommitmentsMonthPaise, c.amount);
        }
      }
    }
  }

  const reservedUntilIncome = safeAdd(
    safeAdd(overdueCommitmentsPaise, upcomingCommitmentsUntilIncomePaise),
    explicitReservedGoalsPaise
  );
  const rawAfterCommitments = safeSub(sustainableCapitalRaw, reservedUntilIncome);
  const shortfallPaise = rawAfterCommitments < 0 ? Math.abs(rawAfterCommitments) : 0;

  const safeToSpendUntilNextIncomePaise = Math.max(0, safeSub(sustainableCapitalPaise, reservedUntilIncome));
  const dailyAllowanceOverHorizon = Math.floor(safeToSpendUntilNextIncomePaise / planningHorizonDays);

  const reservedForMonth = safeAdd(
    safeAdd(overdueCommitmentsPaise, upcomingCommitmentsMonthPaise),
    explicitReservedGoalsPaise
  );
  const remainingMonthlyAllowancePaise = Math.max(0, safeSub(sustainableCapitalPaise, reservedForMonth));
  const dailyMonthlyPace = Math.floor(remainingMonthlyAllowancePaise / remainingDaysInMonth);

  // Use the more conservative daily pace if next income is later than month-end or vice versa
  const dailySpendingAllowancePaise =
    nextExpectedIncomeDate && nextExpectedIncomeDate <= monthEndDate
      ? dailyAllowanceOverHorizon
      : Math.min(dailyAllowanceOverHorizon, dailyMonthlyPace);

  const explanation: string[] = [
    `Confirmed available cash: ₹${(confirmedAvailableCashPaise / 100).toLocaleString("en-IN")}.`,
  ];
  if (totalLiabilitiesPaise > 0) {
    explanation.push(
      `Reserved ₹${(totalLiabilitiesPaise / 100).toLocaleString("en-IN")} for outstanding peer & group liabilities.`
    );
  }
  if (safeBufferPaise > 0) {
    explanation.push(`Protected ₹${(safeBufferPaise / 100).toLocaleString("en-IN")} emergency safety buffer.`);
  }
  if (overdueCommitmentsPaise > 0) {
    explanation.push(
      `Included ₹${(overdueCommitmentsPaise / 100).toLocaleString("en-IN")} in overdue bills.`
    );
  }
  if (upcomingCommitmentsUntilIncomePaise > 0) {
    explanation.push(
      `Set aside ₹${(upcomingCommitmentsUntilIncomePaise / 100).toLocaleString("en-IN")} for bills due before ${horizonEndDate}.`
    );
  }
  if (explicitReservedGoalsPaise > 0) {
    explanation.push(
      `Set aside ₹${(explicitReservedGoalsPaise / 100).toLocaleString("en-IN")} for explicitly reserved goals.`
    );
  }
  if (isConservativeFallback) {
    explanation.push(
      `No confirmed future payout date found; using a conservative ${planningHorizonDays}-day horizon based on confirmed funds only.`
    );
  } else {
    explanation.push(
      `Next expected payout on ${nextExpectedIncomeDate} (${planningHorizonDays} days away); projected payout is not counted as cash.`
    );
  }
  if (shortfallPaise > 0) {
    explanation.push(
      `Shortfall of ₹${(shortfallPaise / 100).toLocaleString("en-IN")} to cover all liabilities, buffer, and due bills.`
    );
  }

  return {
    status: "CONFIRMED",
    confirmedAvailableCashPaise,
    sustainableCapitalPaise,
    safeToSpendUntilNextIncomePaise,
    dailySpendingAllowancePaise,
    remainingMonthlyAllowancePaise,
    shortfallPaise,
    isConservativeFallback,
    nextExpectedIncomeDate,
    projectedNextIncomePaise,
    planningHorizonDays,
    remainingDaysInMonth,
    inputs: {
      totalLiabilitiesPaise,
      peerDebtLiabilityPaise,
      groupLiabilityPaise,
      totalReceivablesPaise,
      safeBufferPaise,
      overdueCommitmentsPaise,
      upcomingCommitmentsUntilIncomePaise,
      upcomingCommitmentsMonthPaise,
      explicitReservedGoalsPaise,
    },
    explanation,
  };
}
