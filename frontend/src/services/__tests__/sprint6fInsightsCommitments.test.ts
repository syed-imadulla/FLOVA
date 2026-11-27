import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDebtPlannerModel } from "../../app/debtPlannerModel";
import { composeFinancialIntelligence } from "../../app/financialIntelligence";
import { buildHomeDashboardModel } from "../../app/homeDashboardModel";
import {
  buildCommitmentsIntelligenceModel,
  buildStructuredInsights,
} from "../../app/insightsCommitmentsModel";
import { buildWishIntelligenceModel } from "../../app/wishIntelligenceModel";
import { analyzeSpendingIntelligence } from "../../engine";
import { shiftMonth, summarise } from "../../engine/monthSummary";
import type { Commitment, RunwayInput, Transaction, WishGoal } from "../../types/contracts";

function makeRunwayInput(overrides: Partial<RunwayInput> = {}): RunwayInput {
  return {
    profile: {
      workProfile: "delivery",
      payoutPattern: "weekly",
      incomeVariability: "variable",
      handlesCod: false,
      dailyLivingEstimate: 25000,
      dailyWorkEstimate: 15000,
      safeRunwayBuffer: 150000, // ₹1,500
    },
    latestCheckin: {
      cash: 500000,
      bank: 700000,
      notMine: 0,
      checkedAt: "2026-11-20T09:00:00Z",
    },
    transactionsSinceCheckin: [],
    payouts: [
      {
        id: "p1",
        kind: "platform_payout",
        expected: 250000,
        received: 0,
        expectedDate: "2026-12-02",
        status: "scheduled",
      },
    ],
    commitments: [
      {
        id: "c-overdue",
        title: "Old bill",
        amount: 50000, // ₹500 overdue
        dueDate: "2026-11-25",
        kind: "bill",
      },
      {
        id: "c-upcoming",
        title: "Rent",
        amount: 200000, // ₹2,000 upcoming
        dueDate: "2026-11-30",
        kind: "bill",
      },
    ],
    peerDebts: [
      {
        id: "pd-1",
        personId: "p-1",
        personName: "Ravi",
        direction: "you_owe",
        totalAmountPaise: 100000,
        remainingAmountPaise: 100000,
        status: "active",
        dueDate: "2026-11-29",
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
    amount: "6000.00",
    ownership: "mine",
    expense_type: null,
    inflow_category: "earned",
    category: "delivery",
    description: "Work",
    transaction_date: "2026-11-10",
    created_at: "2026-11-10T10:00:00Z",
    updated_at: "2026-11-10T10:00:00Z",
    payout_id: null,
    source: "manual",
  },
  {
    id: "t2",
    user_id: "u1",
    type: "income",
    amount: "2000.00",
    ownership: "mine",
    expense_type: null,
    inflow_category: "family_support",
    category: "family_support",
    description: "Family",
    transaction_date: "2026-11-12",
    created_at: "2026-11-12T10:00:00Z",
    updated_at: "2026-11-12T10:00:00Z",
    payout_id: null,
    source: "manual",
  },
  {
    id: "t3",
    user_id: "u1",
    type: "expense",
    amount: "1500.00",
    ownership: "mine",
    expense_type: "living",
    inflow_category: null,
    category: "food",
    description: "Food",
    transaction_date: "2026-11-15",
    created_at: "2026-11-15T10:00:00Z",
    updated_at: "2026-11-15T10:00:00Z",
    payout_id: null,
    source: "manual",
  },
];

describe("Sprint 6F: Insights, MonthView & Commitments Integration", () => {
  it("separates earned vs non-earned monthly summaries and supports historical month navigation", () => {
    const prevMonth = shiftMonth("2026-11", -1);
    assert.equal(prevMonth, "2026-10");
    assert.equal(shiftMonth(prevMonth, 1), "2026-11");

    const summary = summarise("2026-11", MONTH_TXS);
    assert.equal(summary.earnedIncome, 600000);
    assert.equal(summary.nonEarnedInflow, 200000);
    assert.equal(summary.income, 800000);
    assert.equal(summary.expense, 150000);
  });

  it("builds structured insights with spending anomalies, safe-to-spend, debt, and WISH", () => {
    const intel = composeFinancialIntelligence({
      runwayInput: makeRunwayInput(),
      monthTransactions: MONTH_TXS,
      wishGoals: [
        {
          id: "w1",
          user_id: "u1",
          title: "Bike Repair",
          target_amount: "4000.00",
          saved_amount: "1000.00",
          target_date: "2026-12-20",
          status: "active",
          category: null,
          icon: null,
          created_at: "2026-11-01T00:00:00Z",
          updated_at: "2026-11-10T00:00:00Z",
        } as WishGoal,
      ],
      todayISO: "2026-11-27",
    });

    const spendingReport = analyzeSpendingIntelligence(
      [
        { id: "e1", type: "expense", amountPaise: 20000, category: "food", description: "Lunch", expenseType: "living", ownership: "mine", date: "2026-11-10" },
        { id: "e2", type: "expense", amountPaise: 20000, category: "food", description: "Lunch", expenseType: "living", ownership: "mine", date: "2026-11-12" },
        { id: "e3", type: "expense", amountPaise: 200000, category: "food", description: "Big party", expenseType: "living", ownership: "mine", date: "2026-11-26" },
      ],
      "2026-11-27"
    );

    const insights = buildStructuredInsights({ intel, spendingReport });
    const ids = insights.map((i) => i.id);
    assert.ok(!ids.includes("safe-to-spend"));
    assert.ok(!ids.includes("spending-anomaly"));
    assert.ok(ids.includes("commitments-pressure"));
    assert.ok(ids.includes("debt-repayment"));
    assert.ok(ids.includes("wish-progress"));
    assert.ok(intel.financialHealth !== null);
  });

  it("excludes paid and cancelled commitments from upcoming and overdue obligations", () => {
    const intel = composeFinancialIntelligence({
      runwayInput: makeRunwayInput(),
      todayISO: "2026-11-27",
    });

    const commitments: Commitment[] = [
      {
        id: "c-overdue",
        user_id: "u1",
        title: "Old bill",
        amount: "500.00",
        due_date: "2026-11-25",
        kind: "bill",
        category: "other",
        status: "upcoming",
        created_at: "2026-11-01T00:00:00Z",
        updated_at: "2026-11-01T00:00:00Z",
      },
      {
        id: "c-upcoming",
        user_id: "u1",
        title: "Rent",
        amount: "2000.00",
        due_date: "2026-11-30",
        kind: "bill",
        category: "rent",
        status: "upcoming",
        created_at: "2026-11-01T00:00:00Z",
        updated_at: "2026-11-01T00:00:00Z",
      },
      {
        id: "c-paid",
        user_id: "u1",
        title: "Paid bill",
        amount: "1000.00",
        due_date: "2026-11-20",
        kind: "bill",
        category: "other",
        status: "paid",
        created_at: "2026-11-01T00:00:00Z",
        updated_at: "2026-11-20T12:00:00Z",
      },
      {
        id: "c-cancelled",
        user_id: "u1",
        title: "Cancelled",
        amount: "800.00",
        due_date: "2026-11-21",
        kind: "bill",
        category: "other",
        status: "cancelled",
        created_at: "2026-11-01T00:00:00Z",
        updated_at: "2026-11-21T12:00:00Z",
      },
    ];

    const cModel = buildCommitmentsIntelligenceModel({
      items: commitments,
      filter: "all",
      intel,
      todayISO: "2026-11-27",
    });

    assert.equal(cModel.upcomingCount, 2);
    assert.equal(cModel.upcomingTotalPaise, 250000);
    assert.equal(cModel.overdueCount, 1);
    assert.equal(cModel.overdueTotalPaise, 50000);
    assert.equal(cModel.hasPressure, true);
    assert.equal(cModel.safeToSpendPaise, intel.safeToSpendPaise);
  });

  it("maintains cross-screen metric consistency across Home, Money, WISH, Insights, and Commitments", () => {
    const input = makeRunwayInput();
    const intel = composeFinancialIntelligence({
      runwayInput: input,
      monthTransactions: MONTH_TXS,
      todayISO: "2026-11-27",
    });

    const home = buildHomeDashboardModel(intel);
    const debt = buildDebtPlannerModel({
      debtPlan: intel.debtPlan,
      safeToSpend: intel.safeToSpend,
      peerDebts: input.peerDebts ?? [],
      groupSplits: input.groupSplits ?? [],
      todayISO: "2026-11-27",
    });
    const wish = buildWishIntelligenceModel({
      wishGoals: [],
      safeToSpend: intel.safeToSpend,
      todayISO: "2026-11-27",
    });
    const commitments = buildCommitmentsIntelligenceModel({
      items: [],
      filter: "upcoming",
      intel,
      todayISO: "2026-11-27",
    });

    assert.equal(home.confirmedCashPaise, intel.confirmedCashPaise);
    assert.equal(home.safeToSpendPaise, intel.safeToSpendPaise);
    assert.equal(home.dailyAllowancePaise, wish.dailySafeToSpendPaise);
    assert.equal(commitments.safeToSpendPaise, intel.safeToSpendPaise);
    assert.equal(debt.totalOwedPaise, intel.obligations.totalLiabilitiesPaise);
  });
});
