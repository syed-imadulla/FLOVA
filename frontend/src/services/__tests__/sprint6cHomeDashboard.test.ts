import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { composeFinancialIntelligence } from "../../app/financialIntelligence";
import { buildHomeDashboardModel } from "../../app/homeDashboardModel";
import type { RunwayInput, Transaction, WishGoal } from "../../types/contracts";

function makeRunwayInput(overrides: Partial<RunwayInput> = {}): RunwayInput {
  return {
    profile: {
      workProfile: "delivery",
      payoutPattern: "weekly",
      incomeVariability: "variable",
      handlesCod: true,
      dailyLivingEstimate: 25000,
      dailyWorkEstimate: 15000,
      safeRunwayBuffer: 200000,
    },
    latestCheckin: {
      cash: 500000,
      bank: 1000000,
      notMine: 50000,
      checkedAt: "2026-11-20T09:00:00Z",
    },
    transactionsSinceCheckin: [],
    payouts: [
      {
        id: "p1",
        kind: "platform_payout",
        expected: 300000,
        received: 0,
        expectedDate: "2026-11-30",
        status: "scheduled",
      },
    ],
    commitments: [
      {
        id: "c1",
        title: "Overdue fee",
        amount: 40000,
        dueDate: "2026-11-25",
        kind: "bill",
      },
      {
        id: "c2",
        title: "Phone bill",
        amount: 60000,
        dueDate: "2026-11-29",
        kind: "bill",
      },
    ],
    peerDebts: [
      {
        id: "pd-owe",
        personId: "p-1",
        personName: "Ravi",
        direction: "you_owe",
        totalAmountPaise: 120000,
        remainingAmountPaise: 120000,
        status: "active",
        dueDate: "2026-11-26",
        createdAt: "2026-11-10T10:00:00Z",
      },
      {
        id: "pd-rec",
        personId: "p-2",
        personName: "Sita",
        direction: "they_owe",
        totalAmountPaise: 100000,
        remainingAmountPaise: 100000,
        status: "active",
        dueDate: "2026-12-03",
        createdAt: "2026-11-10T10:00:00Z",
      },
    ],
    debtSettlements: [],
    groupSplits: [],
    groupSettlements: [],
    ...overrides,
  };
}

const MONTH_TXS: Transaction[] = [
  {
    id: "t1",
    user_id: "u1",
    type: "income",
    amount: "7000.00",
    ownership: "mine",
    expense_type: null,
    inflow_category: "earned",
    category: "delivery",
    description: "Earnings",
    transaction_date: "2026-11-15",
    created_at: "2026-11-15T10:00:00Z",
    updated_at: "2026-11-15T10:00:00Z",
    payout_id: null,
    source: "manual",
  },
  {
    id: "t2",
    user_id: "u1",
    type: "income",
    amount: "1500.00",
    ownership: "mine",
    expense_type: null,
    inflow_category: "gift",
    category: "gift",
    description: "Gift",
    transaction_date: "2026-11-16",
    created_at: "2026-11-16T10:00:00Z",
    updated_at: "2026-11-16T10:00:00Z",
    payout_id: null,
    source: "manual",
  },
  {
    id: "t3",
    user_id: "u1",
    type: "expense",
    amount: "1200.00",
    ownership: "mine",
    expense_type: "living",
    inflow_category: null,
    category: "food",
    description: "Food",
    transaction_date: "2026-11-17",
    created_at: "2026-11-17T10:00:00Z",
    updated_at: "2026-11-17T10:00:00Z",
    payout_id: null,
    source: "manual",
  },
];

const WISH_GOALS: WishGoal[] = [
  {
    id: "w1",
    user_id: "u1",
    title: "Helmet",
    target_amount: "5000.00",
    saved_amount: "1000.00",
    target_date: "2026-12-20",
    status: "active",
    category: null,
    icon: null,
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-10T00:00:00Z",
  },
];

describe("Sprint 6C: HomeScreen Dashboard Intelligence Mapping", () => {
  it("maps confirmed cash, safe-to-spend, daily allowance, sustainable capital, safety & health", () => {
    const snap = composeFinancialIntelligence({
      runwayInput: makeRunwayInput(),
      monthTransactions: MONTH_TXS,
      wishGoals: WISH_GOALS,
      todayISO: "2026-11-27",
    });
    const model = buildHomeDashboardModel(snap);

    assert.equal(model.isUnavailable, false);
    assert.equal(model.hasConfirmedBalance, true);
    assert.equal(model.confirmedCashPaise, 1450000); // ₹14,500 (excludes ₹3,000 payout & ₹1,000 receivable)
    assert.equal(model.sustainableCapitalPaise, 1130000); // 1450000 - 120000 debt - 200000 cushion
    assert.ok(model.safeToSpendPaise !== null && model.safeToSpendPaise < model.confirmedCashPaise);
    assert.ok(model.dailyAllowancePaise !== null && model.dailyAllowancePaise > 0);
    assert.equal(model.receivablesPaise, 100000);
    assert.equal(model.custodialOwedPaise, 50000);

    // Safety summary captures overdue commitment (40000) + overdue peer debt (120000) = 160000
    assert.equal(model.safetySummary.show, true);
    assert.equal(model.safetySummary.overdueObligationsPaise, 160000);
    assert.equal(model.safetySummary.overdueCount, 2);
    assert.equal(model.safetySummary.debtPressureLevel, "high");
    assert.equal(model.safetySummary.safetyCushionPaise, 200000);

    // Health summary & monthly earned separation
    assert.equal(model.healthSummary.show, true);
    assert.equal(model.monthlyOverview.earnedIncomePaise, 700000);
    assert.equal(model.monthlyOverview.nonEarnedInflowPaise, 150000);
    assert.equal(model.monthlyOverview.expensePaise, 120000);
  });

  it("handles unavailable and missing-checkin states without fabricating ₹0", () => {
    const unavailable = buildHomeDashboardModel(null);
    assert.equal(unavailable.isUnavailable, true);
    assert.equal(unavailable.hasConfirmedBalance, false);
    assert.equal(unavailable.confirmedCashPaise, null);
    assert.equal(unavailable.safeToSpendPaise, null);
    assert.equal(unavailable.dailyAllowancePaise, null);
    assert.equal(unavailable.safetySummary.show, false);

    const noCheckinSnap = composeFinancialIntelligence({
      runwayInput: makeRunwayInput({ latestCheckin: undefined }),
      todayISO: "2026-11-27",
    });
    const noCheckin = buildHomeDashboardModel(noCheckinSnap);
    assert.equal(noCheckin.isUnavailable, false);
    assert.equal(noCheckin.hasConfirmedBalance, false);
    assert.equal(noCheckin.confirmedCashPaise, null);
    assert.equal(noCheckin.safeToSpendPaise, null);
  });
});
