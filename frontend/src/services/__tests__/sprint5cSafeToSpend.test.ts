// =====================================================================
// FLOVA 2.0 | Sprint 5C: Safe-to-Spend Intelligence Tests
// Covers normal/irregular/zero expected income, upcoming & overdue bills,
// peer debt + group liabilities without double-counting, receivables exclusion,
// emergency buffer, insufficient funds, zero balance, and month-end boundaries.
// =====================================================================

import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateSafeToSpend } from "../../engine/safeToSpend";
import type { RunwayInput } from "../../types/contracts";

function makeBaseInput(overrides?: Partial<RunwayInput>): RunwayInput {
  return {
    profile: {
      workProfile: "delivery",
      payoutPattern: "weekly",
      incomeVariability: "variable",
      dailyLivingEstimate: 20000,
      dailyWorkEstimate: 10000,
      safeRunwayBuffer: 100000, // ₹1,000
    },
    latestCheckin: {
      cash: 500000, // ₹5,000
      bank: 500000, // ₹5,000
      notMine: 0,
      checkedAt: "2026-11-20T00:00:00Z",
    },
    transactionsSinceCheckin: [],
    payouts: [
      {
        id: "p1",
        kind: "platform_payout",
        expected: 300000, // ₹3,000 projected (MUST NOT be added to cash)
        received: 0,
        expectedDate: "2026-11-25",
        status: "scheduled",
      },
    ],
    commitments: [],
    ...overrides,
  };
}

test("Sprint 5C: Normal situation with upcoming bills, buffer, and projected payout separation", () => {
  const input = makeBaseInput({
    commitments: [
      { id: "c1", title: "Phone", amount: 50000, dueDate: "2026-11-23", kind: "bill" }, // before 11-25
      { id: "c2", title: "Rent", amount: 200000, dueDate: "2026-11-29", kind: "bill" }, // after 11-25, within Nov
    ],
  });

  const res = calculateSafeToSpend({ runwayInput: input, todayISO: "2026-11-21" });
  assert.equal(res.status, "CONFIRMED");
  // Confirmed cash = ₹10,000 (1,000,000 paise); ₹3,000 expected payout is NOT added
  assert.equal(res.confirmedAvailableCashPaise, 1000000);
  assert.equal(res.projectedNextIncomePaise, 300000);
  assert.equal(res.isConservativeFallback, false);
  // Sustainable capital = 1,000,000 - 100,000 (buffer) = 900,000
  assert.equal(res.sustainableCapitalPaise, 900000);
  // Safe to spend until 2026-11-25 (4 days) = 900,000 - 50,000 (Phone) = 850,000
  assert.equal(res.safeToSpendUntilNextIncomePaise, 850000);
  assert.equal(res.planningHorizonDays, 4);
  assert.equal(res.dailySpendingAllowancePaise, Math.floor(850000 / 4));
  // Remaining monthly (10 days: Nov 21..30) = 900,000 - (50,000 + 200,000) = 650,000
  assert.equal(res.remainingDaysInMonth, 10);
  assert.equal(res.remainingMonthlyAllowancePaise, 650000);
  assert.equal(res.shortfallPaise, 0);
});

test("Sprint 5C: Irregular/missing expected income uses conservative fallback without inflating cash", () => {
  const input = makeBaseInput({
    payouts: [],
    profile: {
      workProfile: "freelancer",
      payoutPattern: "variable",
      incomeVariability: "unpredictable",
      dailyLivingEstimate: 20000,
      dailyWorkEstimate: 10000,
      safeRunwayBuffer: 100000,
    },
  });

  const res = calculateSafeToSpend({ runwayInput: input, todayISO: "2026-11-21" });
  assert.equal(res.isConservativeFallback, true);
  assert.equal(res.nextExpectedIncomeDate, null);
  assert.equal(res.projectedNextIncomePaise, 0);
  // Freelancer (14) + unpredictable (+5) capped at 18 days
  assert.equal(res.planningHorizonDays, 18);
  assert.equal(res.safeToSpendUntilNextIncomePaise, 900000);
  assert.ok(res.explanation.some((e) => e.includes("conservative 18-day horizon")));
});

test("Sprint 5C: Overdue bills, peer debt, group obligations, and receivables (no double-counting)", () => {
  const input = makeBaseInput({
    commitments: [
      { id: "c-over", title: "Overdue Water", amount: 50000, dueDate: "2026-11-19", kind: "bill" },
    ],
    peerDebts: [
      {
        id: "pd-owe",
        personId: "p1",
        direction: "you_owe",
        totalAmountPaise: 200000,
        remainingAmountPaise: 200000,
        status: "active",
        dueDate: "2026-11-24",
        createdAt: "2026-11-10T00:00:00Z", // pre-checkin
      },
      {
        id: "pd-rec",
        personId: "p2",
        direction: "they_owe",
        totalAmountPaise: 400000,
        remainingAmountPaise: 400000,
        status: "active",
        dueDate: null,
        createdAt: "2026-11-10T00:00:00Z", // receivable: NEVER cash
      },
    ],
    groupSplits: [
      {
        id: "gs-owe",
        groupExpenseId: "ge-1",
        isSelf: true,
        personId: null,
        direction: "you_owe",
        shareAmountPaise: 100000,
        remainingAmountPaise: 100000,
        status: "active",
        createdAt: "2026-11-10T00:00:00Z",
      },
    ],
  });

  const res = calculateSafeToSpend({ runwayInput: input, todayISO: "2026-11-21" });
  // Confirmed cash = 1,000,000 (₹4,000 receivable is NOT added)
  assert.equal(res.confirmedAvailableCashPaise, 1000000);
  assert.equal(res.inputs.totalReceivablesPaise, 400000);
  // Liabilities = 200,000 (peer) + 100,000 (group) = 300,000 (counted once)
  assert.equal(res.inputs.totalLiabilitiesPaise, 300000);
  assert.equal(res.inputs.peerDebtLiabilityPaise, 200000);
  assert.equal(res.inputs.groupLiabilityPaise, 100000);
  // Sustainable = 1,000,000 - 300,000 - 100,000 (buffer) = 600,000
  assert.equal(res.sustainableCapitalPaise, 600000);
  // Overdue bill (50,000) deducted -> safe to spend = 550,000
  assert.equal(res.inputs.overdueCommitmentsPaise, 50000);
  assert.equal(res.safeToSpendUntilNextIncomePaise, 550000);
});

test("Sprint 5C: Insufficient funds, zero balance, and month-end boundary", () => {
  // Zero balance & liabilities -> shortfall reported, allowances clamped to 0
  const zeroInput = makeBaseInput({
    latestCheckin: { cash: 0, bank: 0, notMine: 0, checkedAt: "2026-11-20T00:00:00Z" },
    commitments: [{ id: "c1", title: "EMI", amount: 150000, dueDate: "2026-11-30", kind: "debt" }],
  });
  const zeroRes = calculateSafeToSpend({ runwayInput: zeroInput, todayISO: "2026-11-30" });
  assert.equal(zeroRes.remainingDaysInMonth, 1);
  assert.equal(zeroRes.sustainableCapitalPaise, 0);
  assert.equal(zeroRes.safeToSpendUntilNextIncomePaise, 0);
  assert.equal(zeroRes.dailySpendingAllowancePaise, 0);
  assert.equal(zeroRes.remainingMonthlyAllowancePaise, 0);
  // Shortfall: buffer (100,000) + EMI (150,000) = 250,000
  assert.equal(zeroRes.shortfallPaise, 250000);

  // Explicit WISH goal reserve is only applied when explicitly passed
  const normal = makeBaseInput({ payouts: [] });
  const withoutGoal = calculateSafeToSpend({ runwayInput: normal, todayISO: "2026-11-30" });
  const withGoal = calculateSafeToSpend({
    runwayInput: normal,
    todayISO: "2026-11-30",
    explicitReservedGoalsPaise: 200000,
  });
  assert.equal(withoutGoal.remainingMonthlyAllowancePaise! - withGoal.remainingMonthlyAllowancePaise!, 200000);
});
