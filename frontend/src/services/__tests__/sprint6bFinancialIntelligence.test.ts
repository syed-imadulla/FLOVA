import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  composeFinancialIntelligence,
} from "../../app/financialIntelligence";
import {
  FINANCIAL_TERMS,
  formatFinancialAmount,
} from "../../app/financialTerminology";
import type { RunwayInput, Transaction, WishGoal } from "../../types/contracts";

function makeBaseRunwayInput(overrides: Partial<RunwayInput> = {}): RunwayInput {
  return {
    profile: {
      workProfile: "delivery",
      payoutPattern: "weekly",
      incomeVariability: "variable",
      handlesCod: true,
      dailyLivingEstimate: 25000, // ₹250
      dailyWorkEstimate: 15000,   // ₹150
      safeRunwayBuffer: 200000,   // ₹2,000
    },
    latestCheckin: {
      cash: 500000, // ₹5,000
      bank: 1000000, // ₹10,000
      notMine: 50000, // ₹500 custodial
      checkedAt: "2026-11-20T09:00:00Z",
    },
    transactionsSinceCheckin: [],
    payouts: [
      {
        id: "p1",
        kind: "platform_payout",
        expected: 350000, // ₹3,500 expected, NOT confirmed
        received: 0,
        expectedDate: "2026-11-30",
        status: "scheduled",
      },
    ],
    commitments: [
      {
        id: "c1",
        title: "Internet bill",
        amount: 60000, // ₹600
        dueDate: "2026-11-29",
        kind: "bill",
      },
    ],
    peerDebts: [
      {
        id: "pd-owe",
        personId: "person-1",
        personName: "Ravi",
        direction: "you_owe",
        totalAmountPaise: 120000,
        remainingAmountPaise: 120000, // ₹1,200 owed
        status: "active",
        dueDate: "2026-11-28",
        createdAt: "2026-11-10T10:00:00Z",
      },
      {
        id: "pd-rec",
        personId: "person-2",
        personName: "Sita",
        direction: "they_owe",
        totalAmountPaise: 100000,
        remainingAmountPaise: 100000, // ₹1,000 receivable
        status: "active",
        dueDate: "2026-12-02",
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
        shareAmountPaise: 60000,
        remainingAmountPaise: 60000, // ₹600 owed in group
        status: "active",
        createdAt: "2026-11-15T10:00:00Z",
      },
    ],
    groupSettlements: [],
    ...overrides,
  };
}

const BASE_MONTH_TXS: Transaction[] = [
  {
    id: "tx-earned",
    user_id: "u1",
    type: "income",
    amount: "8000.00",
    ownership: "mine",
    expense_type: null,
    inflow_category: "earned",
    category: "delivery",
    description: "Weekly payout",
    transaction_date: "2026-11-18",
    created_at: "2026-11-18T10:00:00Z",
    updated_at: "2026-11-18T10:00:00Z",
    payout_id: null,
    source: "manual",
  },
  {
    id: "tx-gift",
    user_id: "u1",
    type: "income",
    amount: "2000.00",
    ownership: "mine",
    expense_type: null,
    inflow_category: "family_support",
    category: "family_support",
    description: "Family help",
    transaction_date: "2026-11-19",
    created_at: "2026-11-19T10:00:00Z",
    updated_at: "2026-11-19T10:00:00Z",
    payout_id: null,
    source: "manual",
  },
  {
    id: "tx-exp",
    user_id: "u1",
    type: "expense",
    amount: "1500.00",
    ownership: "mine",
    expense_type: "living",
    inflow_category: null,
    category: "food",
    description: "Groceries",
    transaction_date: "2026-11-22",
    created_at: "2026-11-22T12:00:00Z",
    updated_at: "2026-11-22T12:00:00Z",
    payout_id: null,
    source: "manual",
  },
];

const BASE_WISH_GOALS: WishGoal[] = [
  {
    id: "w1",
    user_id: "u1",
    title: "New Phone",
    target_amount: "20000.00", // ₹20,000 target
    saved_amount: "5000.00",   // ₹5,000 saved
    target_date: "2027-01-27",
    status: "active",
    category: null,
    icon: null,
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-20T00:00:00Z",
  },
];

describe("Sprint 6B: Shared Financial Intelligence Layer", () => {
  it("computes consistent accounting metrics, excludes receivables and expected payouts, and avoids double-counting liabilities", () => {
    const snap = composeFinancialIntelligence({
      runwayInput: makeBaseRunwayInput(),
      monthTransactions: BASE_MONTH_TXS,
      wishGoals: BASE_WISH_GOALS,
      todayISO: "2026-11-27",
    });

    assert.equal(snap.status, "ready");
    // Confirmed Cash = 5000 + 10000 - 500 (notMine) = 1450000 paise (₹14,500)
    // Expected payout (₹3,500) and receivable (₹1,000) are NEVER added.
    assert.equal(snap.confirmedCashPaise, 1450000);

    // Total liabilities = ₹1,200 peer + ₹600 group = ₹1,800 (180000 paise)
    assert.equal(snap.obligations.totalLiabilitiesPaise, 180000);
    assert.equal(snap.obligations.peerDebtLiabilityPaise, 120000);
    assert.equal(snap.obligations.groupLiabilityPaise, 60000);

    // Receivables segregated separately = ₹1,000 (100000 paise)
    assert.equal(snap.receivablesPaise, 100000);

    // Sustainable Capital = max(0, 1450000 - 180000 - 200000) = 1070000 paise (₹10,700)
    // Receivables are NOT subtracted a second time.
    assert.equal(snap.sustainableCapitalPaise, 1070000);

    // Safe-to-Spend until 2026-11-30 = Sustainable Capital (1070000) - upcoming bill (60000) = 1010000
    assert.equal(snap.safeToSpendPaise, 1010000);
    assert.ok(snap.dailySpendingAllowancePaise !== null && snap.dailySpendingAllowancePaise > 0);
    assert.ok(snap.remainingMonthlyAllowancePaise !== null);

    // Debt plan & financial health populated consistently
    assert.equal(snap.debtPlan?.totalOwedPaise, 180000);
    assert.equal(snap.debtPlan?.totalReceivablePaise, 100000);
    assert.ok(snap.financialHealth !== null);
    assert.ok(snap.financialHealth.indicators.length > 0);
  });

  it("separates earned income from non-earned inflows in monthSummary", () => {
    const snap = composeFinancialIntelligence({
      runwayInput: makeBaseRunwayInput(),
      monthTransactions: BASE_MONTH_TXS,
      todayISO: "2026-11-27",
    });

    assert.equal(snap.monthSummary?.earnedIncome, 800000);
    assert.equal(snap.monthSummary?.nonEarnedInflow, 200000);
    assert.equal(snap.monthSummary?.income, 1000000);
    assert.equal(snap.monthSummary?.expense, 150000);
  });

  it("does not deduct ordinary WISH targets, and respects explicit WISH reservations only", () => {
    const ordinary = composeFinancialIntelligence({
      runwayInput: makeBaseRunwayInput(),
      wishGoals: BASE_WISH_GOALS,
      todayISO: "2026-11-27",
    });

    const explicit = composeFinancialIntelligence({
      runwayInput: makeBaseRunwayInput(),
      wishGoals: BASE_WISH_GOALS,
      explicitWishReservationsById: { w1: 100000 }, // ₹1,000 explicitly reserved
      todayISO: "2026-11-27",
    });

    assert.equal(ordinary.wishReport.explicitReservedGoalsPaise, 0);
    assert.equal(ordinary.safeToSpendPaise, 1010000);

    assert.equal(explicit.wishReport.explicitReservedGoalsPaise, 100000);
    assert.equal(explicit.safeToSpendPaise, 910000);
  });

  it("distinguishes unavailable vs insufficient_data without showing misleading zeros", () => {
    const unavailable = composeFinancialIntelligence({
      runwayInput: null,
      todayISO: "2026-11-27",
    });
    assert.equal(unavailable.status, "unavailable");
    assert.equal(unavailable.confirmedCashPaise, null);
    assert.equal(unavailable.safeToSpendPaise, null);
    assert.equal(unavailable.sustainableCapitalPaise, null);
    assert.equal(formatFinancialAmount(unavailable.confirmedCashPaise), "—");

    const missingCheckin = composeFinancialIntelligence({
      runwayInput: makeBaseRunwayInput({ latestCheckin: undefined }),
      todayISO: "2026-11-27",
    });
    assert.equal(missingCheckin.status, "insufficient_data");
    assert.equal(missingCheckin.confirmedCashPaise, null);
    assert.equal(missingCheckin.safeToSpendPaise, null);
    assert.ok(missingCheckin.missingInputs.includes("Balance check-in"));
  });

  it("updates derived metrics immediately when source data changes", () => {
    const before = composeFinancialIntelligence({
      runwayInput: makeBaseRunwayInput(),
      todayISO: "2026-11-27",
    });

    const after = composeFinancialIntelligence({
      runwayInput: makeBaseRunwayInput({
        transactionsSinceCheckin: [
          {
            id: "tx-post",
            type: "expense",
            amount: 100000, // ₹1,000 spent after check-in
            ownership: "mine",
            expenseType: "living",
            payoutId: null,
            date: "2026-11-27",
            createdAt: "2026-11-27T11:00:00Z",
          },
        ],
      }),
      todayISO: "2026-11-27",
    });

    assert.equal(before.confirmedCashPaise! - after.confirmedCashPaise!, 100000);
    assert.equal(before.safeToSpendPaise! - after.safeToSpendPaise!, 100000);
  });

  it("provides consistent terminology definitions and INR formatting", () => {
    assert.equal(FINANCIAL_TERMS.confirmedCash.label, "Confirmed Cash");
    assert.equal(FINANCIAL_TERMS.safeToSpend.label, "Safe-to-Spend");
    assert.equal(FINANCIAL_TERMS.sustainableCapital.label, "Sustainable Capital");
    assert.equal(FINANCIAL_TERMS.safetyCushion.label, "Safety Cushion");
    assert.equal(FINANCIAL_TERMS.receivables.label, "Receivables");
    assert.equal(formatFinancialAmount(125000), "₹1,250");
    assert.equal(formatFinancialAmount(null), "—");
  });
});
