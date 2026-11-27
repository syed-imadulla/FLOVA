import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { composeFinancialIntelligence } from "../../app/financialIntelligence";
import { buildHomeDashboardModel } from "../../app/homeDashboardModel";
import {
  buildCommitmentsIntelligenceModel,
  buildStructuredInsights,
} from "../../app/insightsCommitmentsModel";
import { calculateSafeToSpend } from "../../engine";
import { computeMoneyOverview } from "../peerDebts";
import type { Commitment, PeerDebt, Person, RunwayInput, Transaction } from "../../types/contracts";

function makeDeviceScenarioInput(overrides: Partial<RunwayInput> = {}): RunwayInput {
  return {
    profile: {
      workProfile: "delivery",
      payoutPattern: "daily",
      incomeVariability: "variable",
      handlesCod: true,
      dailyLivingEstimate: 20000, // ₹200
      dailyWorkEstimate: 15000,   // ₹150
      safeRunwayBuffer: 0,
    },
    latestCheckin: {
      cash: 227900,
      bank: 630000,
      notMine: 130000, // ₹7,279 confirmed cash
      checkedAt: "2026-11-27T08:00:00Z",
    },
    transactionsSinceCheckin: [],
    payouts: [
      {
        id: "p-today",
        kind: "platform_payout",
        expected: 100000,
        received: 0,
        expectedDate: "2026-11-27", // Same-day expected payout (1-day horizon)
        status: "scheduled",
      },
    ],
    commitments: [
      {
        id: "c-rent",
        title: "QA Room rent",
        amount: 450000, // ₹4,500
        dueDate: "2026-11-28", // Due tomorrow!
        kind: "bill",
      },
    ],
    peerDebts: [],
    debtSettlements: [],
    groupSplits: [],
    groupSettlements: [],
    ...overrides,
  };
}

describe("Sprint 6H: Critical Device QA Fixes", () => {
  it("Fix 1: HomeScreen and InsightsScreen receive identical Financial Health from shared intelligence", () => {
    const txs: Transaction[] = [
      {
        id: "t1",
        user_id: "u1",
        type: "income",
        amount: "22355.00",
        ownership: "mine",
        expense_type: null,
        inflow_category: "earned",
        category: "delivery",
        description: "Earned",
        transaction_date: "2026-11-22",
        created_at: "2026-11-22T10:00:00Z",
        updated_at: "2026-11-22T10:00:00Z",
        payout_id: null,
        source: "manual",
      },
      {
        id: "t2",
        user_id: "u1",
        type: "expense",
        amount: "20045.00",
        ownership: "mine",
        expense_type: "living",
        inflow_category: null,
        category: "food",
        description: "Expenses",
        transaction_date: "2026-11-24",
        created_at: "2026-11-24T10:00:00Z",
        updated_at: "2026-11-24T10:00:00Z",
        payout_id: null,
        source: "manual",
      },
    ];

    const intel = composeFinancialIntelligence({
      runwayInput: makeDeviceScenarioInput(),
      monthTransactions: txs,
      todayISO: "2026-11-27",
    });

    const homeModel = buildHomeDashboardModel(intel);
    assert.equal(homeModel.healthSummary.status, intel.financialHealth?.overallStatus);
    assert.equal(homeModel.healthSummary.summary, intel.financialHealth?.summary);
  });

  it("Fix 2: reproduces exact device scenario (₹7,279 cash, ₹4,500 rent due tomorrow, 1-day payout) and protects tomorrow's bill", () => {
    const res = calculateSafeToSpend({
      runwayInput: makeDeviceScenarioInput(),
      todayISO: "2026-11-27",
    });

    // Confirmed cash = ₹7,279 (expected payout ₹1,000 is NEVER counted)
    assert.equal(res.confirmedAvailableCashPaise, 727900);
    assert.equal(res.planningHorizonDays, 1);
    assert.equal(res.inputs.upcomingCommitmentsUntilIncomePaise, 0);
    assert.equal(res.inputs.upcomingCommitmentsMonthPaise, 450000);
    // Remaining monthly allowance deducts tomorrow's ₹4,500 rent: 727900 - 450000 = 277900
    assert.equal(res.remainingMonthlyAllowancePaise, 277900);
    // Daily allowance MUST NOT be ₹7,279/day on a 1-day horizon with tomorrow's rent due;
    // it is capped to the monthly pace (277900 / 4 days = 69475 paise/day)
    assert.equal(res.dailySpendingAllowancePaise, Math.floor(277900 / 4));

    const home = buildHomeDashboardModel(
      composeFinancialIntelligence({
        runwayInput: makeDeviceScenarioInput(),
        todayISO: "2026-11-27",
      })
    );
    assert.equal(home.laterMonthCommitmentsPaise, 450000);

    const commitments = buildCommitmentsIntelligenceModel({
      items: [
        {
          id: "c-rent",
          user_id: "u1",
          title: "QA Room rent",
          amount: "4500.00",
          due_date: "2026-11-28",
          kind: "bill",
          category: "rent",
          status: "upcoming",
          created_at: "2026-11-20T00:00:00Z",
          updated_at: "2026-11-20T00:00:00Z",
        },
      ] as Commitment[],
      filter: "upcoming",
      intel: composeFinancialIntelligence({
        runwayInput: makeDeviceScenarioInput(),
        todayISO: "2026-11-27",
      }),
      todayISO: "2026-11-27",
    });
    assert.equal(commitments.laterMonthCommitmentsPaise, 450000);
    assert.equal(commitments.remainingMonthlyAllowancePaise, 277900);
  });

  it("Fix 2b: handles bill due today, missing/delayed income, multiple bills, and insufficient cash", () => {
    const dueToday = calculateSafeToSpend({
      runwayInput: makeDeviceScenarioInput({
        commitments: [
          { id: "c1", title: "Today bill", amount: 200000, dueDate: "2026-11-27", kind: "bill" },
          { id: "c2", title: "Tomorrow bill", amount: 300000, dueDate: "2026-11-28", kind: "bill" },
        ],
      }),
      todayISO: "2026-11-27",
    });
    assert.equal(dueToday.safeToSpendUntilNextIncomePaise, 527900);
    assert.equal(dueToday.remainingMonthlyAllowancePaise, 227900);

    const missingIncome = calculateSafeToSpend({
      runwayInput: makeDeviceScenarioInput({ payouts: [] }),
      todayISO: "2026-11-27",
    });
    assert.equal(missingIncome.isConservativeFallback, true);
    assert.ok(missingIncome.planningHorizonDays >= 1);

    const insufficient = calculateSafeToSpend({
      runwayInput: makeDeviceScenarioInput({
        commitments: [
          { id: "c-big", title: "Big bill", amount: 900000, dueDate: "2026-11-27", kind: "bill" },
        ],
      }),
      todayISO: "2026-11-27",
    });
    assert.equal(insufficient.safeToSpendUntilNextIncomePaise, 0);
    assert.equal(insufficient.shortfallPaise, 900000 - 727900);
  });

  it("Fix 3: buildStructuredInsights does not duplicate Safe-to-Spend or spending anomalies", () => {
    const intel = composeFinancialIntelligence({
      runwayInput: makeDeviceScenarioInput(),
      todayISO: "2026-11-27",
    });
    const insights = buildStructuredInsights({ intel });
    assert.equal(insights.some((i) => i.id === "safe-to-spend"), false);
    assert.equal(insights.some((i) => i.id === "spending-anomaly"), false);
  });

  it("Fix 4: MoneyScreen active counts exclude settled records while preserving settled history", () => {
    const people: Person[] = [
      {
        id: "p-1",
        user_id: "u1",
        name: "Safiya",
        phone: null,
        relationship: null,
        upi_id: null,
        is_favorite: false,
        created_at: "2026-11-01T00:00:00Z",
        updated_at: "2026-11-01T00:00:00Z",
      },
    ];
    const debts: PeerDebt[] = [
      {
        id: "d-settled",
        user_id: "u1",
        person_id: "p-1",
        direction: "you_owe",
        total_amount_paise: 100000,
        remaining_amount_paise: 0,
        status: "settled",
        due_date: null,
        reason: null,
        created_at: "2026-11-10T00:00:00Z",
        updated_at: "2026-11-12T00:00:00Z",
      },
    ];
    const overview = computeMoneyOverview(people, debts, []);
    const activeRepayCount = overview.payables.filter(
      (d) => d.status === "active" || d.status === "partially_settled"
    ).length;

    assert.equal(overview.totalToRepayPaise, 0);
    assert.equal(activeRepayCount, 0);
    assert.equal(overview.payables.length, 1); // Settled history preserved
  });
});
