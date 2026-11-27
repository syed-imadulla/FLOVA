import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDebtPlannerModel } from "../../app/debtPlannerModel";
import { composeFinancialIntelligence } from "../../app/financialIntelligence";
import { computePeopleSummaries } from "../peerDebts";
import type {
  GroupExpenseSplit,
  PeerDebt,
  Person,
  RunwayInput,
} from "../../types/contracts";

function makeRunwayInput(overrides: Partial<RunwayInput> = {}): RunwayInput {
  return {
    profile: {
      workProfile: "delivery",
      payoutPattern: "weekly",
      incomeVariability: "variable",
      handlesCod: false,
      dailyLivingEstimate: 20000, // ₹200
      dailyWorkEstimate: 10000,   // ₹100
      safeRunwayBuffer: 100000,   // ₹1,000
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
        expectedDate: "2026-12-04",
        status: "scheduled",
      },
    ],
    commitments: [],
    peerDebts: [
      {
        id: "d-upcoming",
        personId: "p-1",
        personName: "Asha",
        direction: "you_owe",
        totalAmountPaise: 100000,
        remainingAmountPaise: 60000, // ₹600 remaining after partial repayment
        status: "partially_settled",
        dueDate: "2026-12-01",
        createdAt: "2026-11-10T10:00:00Z",
      },
      {
        id: "d-overdue",
        personId: "p-2",
        personName: "Ravi",
        direction: "you_owe",
        totalAmountPaise: 100000,
        remainingAmountPaise: 100000, // ₹1,000 overdue
        status: "active",
        dueDate: "2026-11-25",
        createdAt: "2026-11-05T10:00:00Z",
      },
      {
        id: "d-rec",
        personId: "p-3",
        personName: "Sita",
        direction: "they_owe",
        totalAmountPaise: 200000,
        remainingAmountPaise: 200000, // ₹2,000 receivable (must stay separate)
        status: "active",
        dueDate: "2026-11-29",
        createdAt: "2026-11-12T10:00:00Z",
      },
    ],
    debtSettlements: [],
    groupSplits: [
      {
        id: "gs-1",
        groupExpenseId: "ge-1",
        isSelf: true,
        personId: null,
        direction: "you_owe",
        shareAmountPaise: 40000,
        remainingAmountPaise: 40000, // ₹400 group split owed
        status: "active",
        createdAt: "2026-11-18T10:00:00Z",
      },
    ],
    groupSettlements: [],
    ...overrides,
  };
}

describe("Sprint 6D: Debt Repayment Planner & People Clarity", () => {
  it("orders overdue debts first, includes partial repayments and group splits, and excludes receivables", () => {
    const input = makeRunwayInput();
    const intel = composeFinancialIntelligence({
      runwayInput: input,
      todayISO: "2026-11-27",
    });

    const model = buildDebtPlannerModel({
      debtPlan: intel.debtPlan,
      safeToSpend: intel.safeToSpend,
      peerDebts: input.peerDebts ?? [],
      groupSplits: input.groupSplits ?? [],
      todayISO: "2026-11-27",
    });

    assert.equal(model.hasDebts, true);
    // Total owed = 60000 (partial) + 100000 (overdue) + 40000 (group) = 200000 (₹2,000)
    assert.equal(model.totalOwedPaise, 200000);
    assert.equal(model.peerOwedPaise, 160000);
    assert.equal(model.groupOwedPaise, 40000);
    // Receivables kept strictly separate
    assert.equal(model.totalReceivablePaise, 200000);
    assert.equal(model.overdueTotalPaise, 100000);
    assert.equal(model.overdueCount, 1);

    // Overdue obligation is prioritized first, followed by dated upcoming, then undated group split
    assert.equal(model.obligations[0].id, "d-overdue");
    assert.equal(model.obligations[0].urgency, "overdue");
    assert.equal(model.obligations[1].id, "d-upcoming");
    assert.equal(model.obligations[2].source, "group_split");
  });

  it("simulates repayment budgets and flags safe-to-spend shortfall without mutating data", () => {
    const input = makeRunwayInput();
    const intel = composeFinancialIntelligence({
      runwayInput: input,
      todayISO: "2026-11-27",
    });

    // Safe-to-spend = 500000 - 200000 liabilities - 100000 buffer = 200000 over 7 days (~28571 paise/day)
    const affordable = buildDebtPlannerModel({
      debtPlan: intel.debtPlan,
      safeToSpend: intel.safeToSpend,
      peerDebts: input.peerDebts ?? [],
      groupSplits: input.groupSplits ?? [],
      todayISO: "2026-11-27",
      simulatedDailyBudgetPaise: 20000, // ₹200/day
    });
    assert.equal(affordable.simulation?.exceedsSafeToSpendDaily, false);
    assert.equal(affordable.simulation?.totalPayoffDays, 10);

    const tooAggressive = buildDebtPlannerModel({
      debtPlan: intel.debtPlan,
      safeToSpend: intel.safeToSpend,
      peerDebts: input.peerDebts ?? [],
      groupSplits: input.groupSplits ?? [],
      todayISO: "2026-11-27",
      simulatedDailyBudgetPaise: 100000, // ₹1,000/day > daily allowance
    });
    assert.equal(tooAggressive.simulation?.exceedsSafeToSpendDaily, true);
    assert.equal(tooAggressive.simulation?.totalPayoffDays, 2);
  });

  it("handles empty and insufficient-data states cleanly", () => {
    const emptyInput = makeRunwayInput({ peerDebts: [], groupSplits: [] });
    const emptyIntel = composeFinancialIntelligence({
      runwayInput: emptyInput,
      todayISO: "2026-11-27",
    });
    const emptyModel = buildDebtPlannerModel({
      debtPlan: emptyIntel.debtPlan,
      safeToSpend: emptyIntel.safeToSpend,
      peerDebts: [],
      groupSplits: [],
      todayISO: "2026-11-27",
      simulatedDailyBudgetPaise: 50000,
    });
    assert.equal(emptyModel.hasDebts, false);
    assert.equal(emptyModel.totalOwedPaise, 0);
    assert.equal(emptyModel.simulation, null);

    const noCheckin = composeFinancialIntelligence({
      runwayInput: makeRunwayInput({ latestCheckin: undefined }),
      todayISO: "2026-11-27",
    });
    const noCheckinModel = buildDebtPlannerModel({
      debtPlan: noCheckin.debtPlan,
      safeToSpend: noCheckin.safeToSpend,
      peerDebts: noCheckin.safeToSpend ? [] : makeRunwayInput().peerDebts ?? [],
      groupSplits: makeRunwayInput().groupSplits ?? [],
      todayISO: "2026-11-27",
      simulatedDailyBudgetPaise: 50000,
    });
    assert.equal(noCheckinModel.simulation?.safeDailyAllowancePaise, null);
  });

  it("distinguishes personal vs group balances in computePeopleSummaries without duplication", () => {
    const people: Person[] = [
      {
        id: "p-1",
        user_id: "u1",
        name: "Asha",
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
        direction: "they_owe",
        total_amount_paise: 50000,
        remaining_amount_paise: 30000,
        status: "partially_settled",
        due_date: null,
        reason: "Loan",
        created_at: "2026-11-05T00:00:00Z",
        updated_at: "2026-11-06T00:00:00Z",
      },
    ];
    const splits: GroupExpenseSplit[] = [
      {
        id: "gs-1",
        user_id: "u1",
        group_expense_id: "ge-1",
        person_id: "p-1",
        is_self: false,
        direction: "they_owe",
        share_amount_paise: 20000,
        remaining_amount_paise: 20000,
        status: "active",
        created_at: "2026-11-10T00:00:00Z",
        updated_at: "2026-11-10T00:00:00Z",
      },
    ];

    const [summary] = computePeopleSummaries(people, debts, [], splits, [], new Map());
    assert.equal(summary.personalReceivablePaise, 30000);
    assert.equal(summary.groupReceivablePaise, 20000);
    assert.equal(summary.netBalancePaise, 50000);
  });
});
