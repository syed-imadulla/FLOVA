// =====================================================================
// FLOVA Financial Scenario Simulator (Owner: M3 / Phase 15)
// Simulates "What-If" financial perturbations (income shocks, payout delays,
// expense cuts, or emergency costs) using the deterministic runway engine.
// Invariant: Scenarios are strictly hypothetical and NEVER modify real database rows.
// =====================================================================

import type { RunwayInput, Paise, ISODate } from "../types/contracts";
import { calculateDailyRunway } from "./runway";
import { calculateConfirmedBalance } from "./balance";

export interface ScenarioParameters {
  incomeChangePercent?: number; // e.g. -30 (30% less income), +20 (20% bonus)
  /** Optional forecasted income basis (paise) when no pending payouts exist. */
  expectedIncomeBasisPaise?: Paise;
  dailySpendingChangePaise?: Paise; // e.g. -10000 (spend ₹100 less each day)
  payoutDelayDays?: number; // e.g. 7 (upcoming payouts delayed by 1 week)
  oneTimeExpensePaise?: Paise; // e.g. 300000 (unexpected ₹3,000 emergency expense)
  oneTimeIncomePaise?: Paise; // e.g. 200000 (unexpected ₹2,000 extra payment)
  oneTimeEventDate?: ISODate;
}

export interface ScenarioSimulationResult {
  isHypothetical: true;
  baseline: {
    confirmedBalancePaise: Paise;
    closingBalancePaise: Paise;
    runwayDays: number;
    firstShortfallDate: ISODate | null;
    firstBufferShortfallDate: ISODate | null;
  };
  simulated: {
    confirmedBalancePaise: Paise;
    closingBalancePaise: Paise;
    runwayDays: number;
    firstShortfallDate: ISODate | null;
    firstBufferShortfallDate: ISODate | null;
  };
  deltaClosingBalancePaise: Paise;
  runwayDaysDelta: number;
  explanation: string;
}

/**
 * Executes a deterministic "What-If" scenario against the user's runway inputs.
 */
export function simulateScenario(
  input: RunwayInput,
  params: ScenarioParameters
): ScenarioSimulationResult {
  // 1. Calculate baseline
  const baselineBalanceRes = calculateConfirmedBalance(input);
  const baselineRunway = calculateDailyRunway(input);

  const baselineConfirmedPaise = baselineBalanceRes.confirmedBalancePaise ?? 0;
  const baselineProjections = baselineRunway.projections;
  const baselineLastEntry = baselineProjections[baselineProjections.length - 1];
  const baselineClosingPaise = baselineLastEntry ? baselineLastEntry.closingBalancePaise : baselineConfirmedPaise;
  const baselineRunwayDays = baselineRunway.runwayDays ?? 0;

  // 2. Clone and perturb input
  const modifiedInput: RunwayInput = JSON.parse(JSON.stringify(input));

  // A. Adjust daily baseline expenses (e.g. spend ₹100 less/more per day)
  if (params.dailySpendingChangePaise) {
    const half = Math.round(params.dailySpendingChangePaise / 2);
    if (modifiedInput.profile.dailyLivingEstimate !== null) {
      modifiedInput.profile.dailyLivingEstimate = Math.max(0, modifiedInput.profile.dailyLivingEstimate + half);
    }
    if (modifiedInput.profile.dailyWorkEstimate !== null) {
      modifiedInput.profile.dailyWorkEstimate = Math.max(0, modifiedInput.profile.dailyWorkEstimate + half);
    }
  }

  // B. Adjust payout delay
  if (params.payoutDelayDays && params.payoutDelayDays > 0) {
    for (const p of modifiedInput.payouts) {
      if (p.expectedDate) {
        const d = new Date(p.expectedDate + "T00:00:00Z");
        d.setUTCDate(d.getUTCDate() + params.payoutDelayDays);
        p.expectedDate = d.toISOString().split("T")[0];
      }
    }
  }

  // C. Add one-time hypothetical expense / income
  const todayISO = new Date().toISOString().split("T")[0];
  const eventDate = params.oneTimeEventDate || todayISO;

  if (params.oneTimeExpensePaise && params.oneTimeExpensePaise > 0) {
    modifiedInput.transactionsSinceCheckin.push({
      id: "sim-expense-1",
      type: "expense",
      amount: params.oneTimeExpensePaise,
      ownership: "mine",
      expenseType: "living",
      payoutId: null,
      date: eventDate,
      createdAt: new Date().toISOString(),
    });
  }

  if (params.oneTimeIncomePaise && params.oneTimeIncomePaise > 0) {
    modifiedInput.transactionsSinceCheckin.push({
      id: "sim-income-1",
      type: "income",
      amount: params.oneTimeIncomePaise,
      ownership: "mine",
      expenseType: null,
      payoutId: null,
      date: eventDate,
      createdAt: new Date().toISOString(),
    });
  }

  // D. Compute expected-income shift basis WITHOUT altering confirmedBalancePaise
  let expectedIncomeBasis = 0;
  let earliestPayoutDate: ISODate | null = null;
  for (const p of modifiedInput.payouts) {
    if (p.status === "cancelled" || p.status === "settled" || p.status === "unearned") continue;
    const rem = Math.max(0, (p.expected ?? 0) - (p.received ?? 0));
    if (rem > 0) {
      expectedIncomeBasis += rem;
      if (p.expectedDate && (!earliestPayoutDate || p.expectedDate < earliestPayoutDate)) {
        earliestPayoutDate = p.expectedDate;
      }
    }
  }
  if (expectedIncomeBasis === 0 && params.expectedIncomeBasisPaise && params.expectedIncomeBasisPaise > 0) {
    expectedIncomeBasis = params.expectedIncomeBasisPaise;
  }

  const hasIncomeShift = Boolean(params.incomeChangePercent && params.incomeChangePercent !== 0);
  const projectedIncomeDeltaPaise =
    hasIncomeShift && expectedIncomeBasis > 0
      ? Math.round(expectedIncomeBasis * (params.incomeChangePercent! / 100))
      : 0;

  // 3. Calculate simulated runway (confirmed cash remains strictly separated from forecasted income)
  const simulatedBalanceRes = calculateConfirmedBalance(modifiedInput);
  const simulatedRunway = calculateDailyRunway(modifiedInput);

  const simulatedConfirmedPaise = simulatedBalanceRes.confirmedBalancePaise ?? 0;
  const simulatedProjections = simulatedRunway.projections.map((entry) => ({ ...entry }));

  let simulatedFirstShortfall = simulatedRunway.firstShortfallDate;
  let simulatedFirstBufferShortfall = simulatedRunway.firstBufferShortfallDate ?? null;
  let simulatedRunwayDays = simulatedRunway.runwayDays ?? 0;

  if (projectedIncomeDeltaPaise !== 0 && simulatedProjections.length > 0) {
    const startIdx = earliestPayoutDate
      ? Math.max(0, simulatedProjections.findIndex((d) => d.date >= earliestPayoutDate!))
      : 0;
    const safeBuffer = simulatedRunway.safeRunwayBufferPaise ?? 0;

    simulatedFirstShortfall = null;
    simulatedFirstBufferShortfall = null;
    let coveredDays = 0;
    let hitZero = false;

    for (let i = 0; i < simulatedProjections.length; i++) {
      if (i >= startIdx) {
        simulatedProjections[i].closingBalancePaise += projectedIncomeDeltaPaise;
        if (i > startIdx) {
          simulatedProjections[i].openingBalancePaise += projectedIncomeDeltaPaise;
        }
      }
      const close = simulatedProjections[i].closingBalancePaise;
      if (!hitZero && close < 0) {
        hitZero = true;
        simulatedFirstShortfall = simulatedProjections[i].date;
      }
      if (!hitZero) {
        coveredDays++;
      }
      if (safeBuffer > 0 && simulatedFirstBufferShortfall === null && close < safeBuffer) {
        simulatedFirstBufferShortfall = simulatedProjections[i].date;
      }
    }
    simulatedRunwayDays = coveredDays;
  }

  const simulatedLastEntry = simulatedProjections[simulatedProjections.length - 1];
  const simulatedClosingPaise = simulatedLastEntry
    ? simulatedLastEntry.closingBalancePaise
    : simulatedConfirmedPaise + projectedIncomeDeltaPaise;

  const deltaClosingBalancePaise = simulatedClosingPaise - baselineClosingPaise;
  const runwayDaysDelta = simulatedRunwayDays - baselineRunwayDays;

  // 4. Generate plain-English explanation
  const parts: string[] = [];
  if (hasIncomeShift) {
    if (expectedIncomeBasis > 0) {
      parts.push(`expected income changes by ${params.incomeChangePercent! > 0 ? "+" : ""}${params.incomeChangePercent}%`);
    } else {
      parts.push("no expected payouts or forecast basis available for income shift");
    }
  }
  if (params.dailySpendingChangePaise) {
    const dir = params.dailySpendingChangePaise < 0 ? "spending ₹" + Math.abs(params.dailySpendingChangePaise / 100) + " less/day" : "spending ₹" + (params.dailySpendingChangePaise / 100) + " more/day";
    parts.push(dir);
  }
  if (params.oneTimeExpensePaise) {
    parts.push(`unexpected expense of ₹${params.oneTimeExpensePaise / 100}`);
  }
  if (params.payoutDelayDays) {
    parts.push(`payouts delayed by ${params.payoutDelayDays} days`);
  }

  const scenarioDesc = parts.length > 0 ? parts.join(", ") : "custom adjustments";
  let impactDesc = "";
  if (runwayDaysDelta > 0) {
    impactDesc = `extends your financial runway by ${runwayDaysDelta} day(s).`;
  } else if (runwayDaysDelta < 0) {
    impactDesc = `shortens your financial runway by ${Math.abs(runwayDaysDelta)} day(s).`;
  } else {
    impactDesc = `changes your closing balance by ${deltaClosingBalancePaise >= 0 ? "+" : ""}₹${(deltaClosingBalancePaise / 100).toLocaleString("en-IN")}.`;
  }

  const explanation = `If ${scenarioDesc}, this ${impactDesc}`;

  return {
    isHypothetical: true,
    baseline: {
      confirmedBalancePaise: baselineConfirmedPaise,
      closingBalancePaise: baselineClosingPaise,
      runwayDays: baselineRunwayDays,
      firstShortfallDate: baselineRunway.firstShortfallDate,
      firstBufferShortfallDate: baselineRunway.firstBufferShortfallDate ?? null,
    },
    simulated: {
      confirmedBalancePaise: simulatedConfirmedPaise,
      closingBalancePaise: simulatedClosingPaise,
      runwayDays: simulatedRunwayDays,
      firstShortfallDate: simulatedFirstShortfall,
      firstBufferShortfallDate: simulatedFirstBufferShortfall,
    },
    deltaClosingBalancePaise,
    runwayDaysDelta,
    explanation,
  };
}
