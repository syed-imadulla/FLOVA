import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { composeFinancialIntelligence } from "../../app/financialIntelligence";
import { buildWishIntelligenceModel } from "../../app/wishIntelligenceModel";
import type { RunwayInput, WishGoal } from "../../types/contracts";

function makeRunwayInput(overrides: Partial<RunwayInput> = {}): RunwayInput {
  return {
    profile: {
      workProfile: "delivery",
      payoutPattern: "weekly",
      incomeVariability: "variable",
      handlesCod: false,
      dailyLivingEstimate: 20000,
      dailyWorkEstimate: 10000,
      safeRunwayBuffer: 100000, // ₹1,000
    },
    latestCheckin: {
      cash: 250000, // ₹2,500
      bank: 250000, // ₹2,500
      notMine: 0,
      checkedAt: "2026-11-20T09:00:00Z",
    },
    transactionsSinceCheckin: [],
    payouts: [
      {
        id: "p1",
        kind: "platform_payout",
        expected: 300000,
        received: 0,
        expectedDate: "2026-12-07", // 10 days from 2026-11-27
        status: "scheduled",
      },
    ],
    commitments: [],
    peerDebts: [],
    debtSettlements: [],
    groupSplits: [],
    groupSettlements: [],
    ...overrides,
  };
}

function makeGoal(overrides: Partial<WishGoal> = {}): WishGoal {
  return {
    id: "w1",
    user_id: "u1",
    title: "Emergency Phone",
    target_amount: "10000.00", // ₹10,000
    saved_amount: "2500.00",   // ₹2,500
    target_date: "2026-12-27", // 30 days left -> ₹7,500 left => ₹250/day
    status: "active",
    category: null,
    icon: null,
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-20T00:00:00Z",
    ...overrides,
  };
}

describe("Sprint 6E: WISH Goal Intelligence & Contribution Simulator", () => {
  it("computes progress, remaining amount, and daily/weekly/monthly required contributions", () => {
    const intel = composeFinancialIntelligence({
      runwayInput: makeRunwayInput(),
      wishGoals: [makeGoal()],
      todayISO: "2026-11-27",
    });

    const model = buildWishIntelligenceModel({
      wishGoals: [makeGoal()],
      safeToSpend: intel.safeToSpend,
      todayISO: "2026-11-27",
    });

    const g = model.primaryGoal!;
    assert.equal(g.targetPaise, 1000000);
    assert.equal(g.savedPaise, 250000);
    assert.equal(g.remainingPaise, 750000);
    assert.equal(g.percentCompleted, 25);
    assert.equal(g.daysRemaining, 30);
    assert.equal(g.isOverdue, false);
    // 750000 / 30 = 25000 paise/day (₹250/day), 175000/week, 750000/month
    assert.equal(g.requiredDailyPaise, 25000);
    assert.equal(g.requiredWeeklyPaise, 175000);
    assert.equal(g.requiredMonthlyPaise, 750000);
    // Daily safe-to-spend = (500000 - 100000) / 10 = 40000/day >= 25000/day -> achievable!
    assert.equal(g.achievableByTargetDate, true);
  });

  it("identifies overdue, paused, and completed goals accurately", () => {
    const overdue = makeGoal({ id: "w-od", target_date: "2026-11-20" });
    const paused = makeGoal({ id: "w-p", status: "paused", target_date: "2026-12-27" });
    const completed = makeGoal({ id: "w-c", status: "completed", saved_amount: "10000.00" });

    const intel = composeFinancialIntelligence({
      runwayInput: makeRunwayInput(),
      wishGoals: [overdue, paused, completed],
      todayISO: "2026-11-27",
    });

    const model = buildWishIntelligenceModel({
      wishGoals: [overdue, paused, completed],
      safeToSpend: intel.safeToSpend,
      todayISO: "2026-11-27",
    });

    assert.equal(model.report.activeCount, 1);
    assert.equal(model.report.pausedCount, 1);
    assert.equal(model.report.completedCount, 1);
    assert.equal(model.primaryGoal?.isOverdue, true);
    assert.equal(model.primaryGoal?.achievableByTargetDate, false);
  });

  it("never deducts ordinary WISH targets from Safe-to-Spend, only explicit reservations", () => {
    const goal = makeGoal({ target_amount: "50000.00", saved_amount: "0.00" });
    const ordinary = composeFinancialIntelligence({
      runwayInput: makeRunwayInput(),
      wishGoals: [goal],
      todayISO: "2026-11-27",
    });
    const explicit = composeFinancialIntelligence({
      runwayInput: makeRunwayInput(),
      wishGoals: [goal],
      explicitWishReservationsById: { w1: 100000 }, // ₹1,000 reserved
      todayISO: "2026-11-27",
    });

    assert.equal(ordinary.safeToSpendPaise, 400000);
    assert.equal(explicit.safeToSpendPaise, 300000);
  });

  it("simulates contributions against Safe-to-Spend and target date without mutating balances", () => {
    const intel = composeFinancialIntelligence({
      runwayInput: makeRunwayInput(),
      wishGoals: [makeGoal()],
      todayISO: "2026-11-27",
    });

    // Safe-to-Spend daily = 40000 paise/day (₹400/day)
    // Test ₹2,100/week -> ₹300/day <= ₹400/day (compatible!)
    const compatible = buildWishIntelligenceModel({
      wishGoals: [makeGoal()],
      safeToSpend: intel.safeToSpend,
      todayISO: "2026-11-27",
      simulatedContributionPaise: 210000,
      simulatedCadence: "weekly",
    });
    assert.equal(compatible.simulation?.compatibleWithSafeToSpend, true);
    assert.equal(compatible.simulation?.estimatedDays, 28); // ceil(750000 / 210000) * 7 = 28 days
    assert.equal(compatible.simulation?.estimatedCompletionDate, "2026-12-25");
    assert.equal(compatible.simulation?.meetsTargetDate, true);

    // Test ₹1,000/day -> exceeds ₹400/day Safe-to-Spend
    const incompatible = buildWishIntelligenceModel({
      wishGoals: [makeGoal()],
      safeToSpend: intel.safeToSpend,
      todayISO: "2026-11-27",
      simulatedContributionPaise: 100000,
      simulatedCadence: "daily",
    });
    assert.equal(incompatible.simulation?.compatibleWithSafeToSpend, false);
  });

  it("does not invent an ETA when target date and contribution rate are missing", () => {
    const noEtaGoal = makeGoal({ target_date: null });
    const intel = composeFinancialIntelligence({
      runwayInput: makeRunwayInput({ latestCheckin: undefined }),
      wishGoals: [noEtaGoal],
      todayISO: "2026-11-27",
    });

    const model = buildWishIntelligenceModel({
      wishGoals: [noEtaGoal],
      safeToSpend: intel.safeToSpend,
      todayISO: "2026-11-27",
    });

    assert.equal(model.primaryGoal?.estimatedCompletionDate, null);
    assert.equal(model.primaryGoal?.requiredDailyPaise, null);
    assert.equal(model.dailySafeToSpendPaise, null);
  });
});
