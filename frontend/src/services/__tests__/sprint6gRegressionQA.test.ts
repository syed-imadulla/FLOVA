import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDebtPlannerModel } from "../../app/debtPlannerModel";
import { composeFinancialIntelligence } from "../../app/financialIntelligence";
import { buildHomeDashboardModel } from "../../app/homeDashboardModel";
import { buildCommitmentsIntelligenceModel } from "../../app/insightsCommitmentsModel";
import { buildWishIntelligenceModel } from "../../app/wishIntelligenceModel";
import { summarise } from "../../engine/monthSummary";
import { computeMoneyOverview, computePeopleSummaries } from "../peerDebts";
import type {
  Commitment,
  GroupExpenseSplit,
  PeerDebt,
  Person,
  RunwayInput,
  Transaction,
  WishGoal,
} from "../../types/contracts";

function makeFullScenarioInput(): RunwayInput {
  return {
    profile: {
      workProfile: "delivery",
      payoutPattern: "weekly",
      incomeVariability: "variable",
      handlesCod: true,
      dailyLivingEstimate: 25000, // ₹250
      dailyWorkEstimate: 15000,   // ₹150
      safeRunwayBuffer: 200000,   // ₹2,000 cushion
    },
    latestCheckin: {
      cash: 600000, // ₹6,000
      bank: 900000, // ₹9,000
      notMine: 100000, // ₹1,000 custodial COD
      checkedAt: "2026-11-20T09:00:00Z",
    },
    transactionsSinceCheckin: [],
    payouts: [
      {
        id: "p1",
        kind: "platform_payout",
        expected: 400000, // ₹4,000 expected payout -> NEVER confirmed cash
        received: 0,
        expectedDate: "2026-12-02",
        status: "scheduled",
      },
    ],
    commitments: [
      {
        id: "c1",
        title: "Electricity bill",
        amount: 100000, // ₹1,000 upcoming
        dueDate: "2026-11-30",
        kind: "bill",
      },
    ],
    peerDebts: [
      {
        id: "pd-owe",
        personId: "p-1",
        personName: "Ravi",
        direction: "you_owe",
        totalAmountPaise: 200000,
        remainingAmountPaise: 120000, // ₹1,200 remaining after ₹800 partial repayment
        status: "partially_settled",
        dueDate: "2026-11-29",
        createdAt: "2026-11-10T10:00:00Z",
      },
      {
        id: "pd-rec",
        personId: "p-2",
        personName: "Sita",
        direction: "they_owe",
        totalAmountPaise: 150000,
        remainingAmountPaise: 150000, // ₹1,500 receivable -> NEVER cash
        status: "active",
        dueDate: "2026-12-05",
        createdAt: "2026-11-12T10:00:00Z",
      },
    ],
    debtSettlements: [],
    groupSplits: [
      {
        id: "gs-owe",
        groupExpenseId: "ge-1",
        isSelf: true,
        personId: null,
        direction: "you_owe",
        shareAmountPaise: 80000,
        remainingAmountPaise: 80000, // ₹800 group split owed
        status: "active",
        createdAt: "2026-11-15T10:00:00Z",
      },
    ],
    groupSettlements: [],
  };
}

describe("Sprint 6G: Full Financial Regression & Cross-Screen QA", () => {
  it("enforces all 10 accounting invariants across shared snapshot and screen models", () => {
    const input = makeFullScenarioInput();
    const monthTxs: Transaction[] = [
      {
        id: "tx-e",
        user_id: "u1",
        type: "income",
        amount: "5000.00",
        ownership: "mine",
        expense_type: null,
        inflow_category: "earned",
        category: "delivery",
        description: "Delivery",
        transaction_date: "2026-11-18",
        created_at: "2026-11-18T10:00:00Z",
        updated_at: "2026-11-18T10:00:00Z",
        payout_id: null,
        source: "manual",
      },
      {
        id: "tx-g",
        user_id: "u1",
        type: "income",
        amount: "1000.00",
        ownership: "mine",
        expense_type: null,
        inflow_category: "gift",
        category: "gift",
        description: "Gift",
        transaction_date: "2026-11-19",
        created_at: "2026-11-19T10:00:00Z",
        updated_at: "2026-11-19T10:00:00Z",
        payout_id: null,
        source: "manual",
      },
    ];
    const wishGoals: WishGoal[] = [
      {
        id: "w1",
        user_id: "u1",
        title: "Laptop",
        target_amount: "30000.00", // Ordinary ₹30,000 target
        saved_amount: "5000.00",
        target_date: "2027-02-01",
        status: "active",
        category: null,
        icon: null,
        created_at: "2026-11-01T00:00:00Z",
        updated_at: "2026-11-10T00:00:00Z",
      },
    ];

    const ordinarySnap = composeFinancialIntelligence({
      runwayInput: input,
      monthTransactions: monthTxs,
      wishGoals,
      todayISO: "2026-11-27",
    });

    // 1. Confirmed Cash = 6000 + 9000 - 1000 custodial = 1400000 (₹14,000)
    // Excludes ₹4,000 expected payout and ₹1,500 receivable.
    assert.equal(ordinarySnap.confirmedCashPaise, 1400000);

    // 2. Borrowing is not earned income (monthSummary.earnedIncome = ₹5,000, gift = ₹1,000)
    const monthSum = summarise("2026-11", monthTxs);
    assert.equal(monthSum.earnedIncome, 500000);
    assert.equal(monthSum.nonEarnedInflow, 100000);

    // 3. Liabilities = 120000 (peer) + 80000 (group) = 200000 (no duplication)
    assert.equal(ordinarySnap.obligations.totalLiabilitiesPaise, 200000);
    assert.equal(ordinarySnap.receivablesPaise, 150000);

    // 4. Sustainable Capital = 1400000 - 200000 - 200000 = 1000000 (₹10,000)
    assert.equal(ordinarySnap.sustainableCapitalPaise, 1000000);

    // 5. Ordinary WISH target is NOT reserved -> Safe-to-Spend = 1000000 - 100000 bill = 900000 (₹9,000)
    assert.equal(ordinarySnap.safeToSpendPaise, 900000);

    // 6. Explicit WISH reservation reduces Safe-to-Spend exactly once
    const explicitSnap = composeFinancialIntelligence({
      runwayInput: input,
      monthTransactions: monthTxs,
      wishGoals,
      explicitWishReservationsById: { w1: 150000 }, // ₹1,500 explicit reservation
      todayISO: "2026-11-27",
    });
    assert.equal(explicitSnap.safeToSpendPaise, 750000);

    // 7. Cross-screen consistency + non-mutating simulations
    const inputBefore = JSON.stringify(input);
    const home = buildHomeDashboardModel(ordinarySnap);
    const debt = buildDebtPlannerModel({
      debtPlan: ordinarySnap.debtPlan,
      safeToSpend: ordinarySnap.safeToSpend,
      peerDebts: input.peerDebts ?? [],
      groupSplits: input.groupSplits ?? [],
      todayISO: "2026-11-27",
      simulatedDailyBudgetPaise: 50000,
    });
    const wish = buildWishIntelligenceModel({
      wishGoals,
      safeToSpend: ordinarySnap.safeToSpend,
      todayISO: "2026-11-27",
      simulatedContributionPaise: 100000,
      simulatedCadence: "weekly",
    });
    const commitments = buildCommitmentsIntelligenceModel({
      items: [
        {
          id: "c1",
          user_id: "u1",
          title: "Electricity bill",
          amount: "1000.00",
          due_date: "2026-11-30",
          kind: "bill",
          category: "utilities",
          status: "upcoming",
          created_at: "2026-11-01T00:00:00Z",
          updated_at: "2026-11-01T00:00:00Z",
        },
        {
          id: "c-paid",
          user_id: "u1",
          title: "Paid bill",
          amount: "500.00",
          due_date: "2026-11-20",
          kind: "bill",
          category: "utilities",
          status: "paid",
          created_at: "2026-11-01T00:00:00Z",
          updated_at: "2026-11-20T00:00:00Z",
        },
      ] as Commitment[],
      filter: "all",
      intel: ordinarySnap,
      todayISO: "2026-11-27",
    });

    assert.equal(home.confirmedCashPaise, 1400000);
    assert.equal(home.safeToSpendPaise, 900000);
    assert.equal(commitments.upcomingTotalPaise, 100000);
    assert.equal(commitments.safeToSpendPaise, 900000);
    assert.equal(debt.totalOwedPaise, 200000);
    assert.equal(wish.dailySafeToSpendPaise, ordinarySnap.dailySpendingAllowancePaise);
    assert.equal(JSON.stringify(input), inputBefore);
  });

  it("keeps MoneyScreen overview and PeopleScreen summaries consistent for peer + group splits", () => {
    const people: Person[] = [
      {
        id: "p-1",
        user_id: "u1",
        name: "Ravi",
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
        id: "pd-1",
        user_id: "u1",
        person_id: "p-1",
        direction: "you_owe",
        total_amount_paise: 200000,
        remaining_amount_paise: 120000,
        status: "partially_settled",
        due_date: "2026-11-29",
        reason: null,
        created_at: "2026-11-10T10:00:00Z",
        updated_at: "2026-11-15T10:00:00Z",
      },
    ];
    const splits: GroupExpenseSplit[] = [
      {
        id: "gs-1",
        user_id: "u1",
        group_expense_id: "ge-1",
        person_id: null,
        is_self: true,
        direction: "you_owe",
        share_amount_paise: 80000,
        remaining_amount_paise: 80000,
        status: "active",
        created_at: "2026-11-15T10:00:00Z",
        updated_at: "2026-11-15T10:00:00Z",
      },
    ];

    const moneyOverview = computeMoneyOverview(people, debts, splits);
    const peopleSummaries = computePeopleSummaries(
      people,
      debts,
      [],
      splits,
      [],
      new Map([["ge-1", "p-1"]])
    );

    assert.equal(moneyOverview.personalToRepayPaise, 120000);
    assert.equal(moneyOverview.groupToRepayPaise, 80000);
    assert.equal(moneyOverview.totalToRepayPaise, 200000);
    assert.equal(peopleSummaries[0].personalPayablePaise, 120000);
    assert.equal(peopleSummaries[0].groupPayablePaise, 80000);
    assert.equal(peopleSummaries[0].netBalancePaise, -200000);
  });
});
