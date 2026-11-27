// =====================================================================
// FLOVA 2.0 | Sprint 5G: Cross-Engine Financial Intelligence Integration Tests
// Verifies that the SAME underlying financial records produce identical,
// consistent answers across:
//   - calculateConfirmedBalance (balance.ts)
//   - calculateDailyRunway (runway.ts)
//   - calculateSafeToSpend (safeToSpend.ts)
//   - buildDebtRepaymentPlan (debtRepaymentPlanner.ts)
//   - assessFinancialHealth (financialHealth.ts)
//   - analyzeWishGoals & simulateWishContribution (wishIntelligence.ts)
//   - summarise (monthSummary.ts)
//   - analyzeSpendingIntelligence (spendingIntelligence.ts)
//   - generateIncomeForecast (incomeForecast.ts)
//   - simulateScenario (scenarioSimulator.ts)
// =====================================================================

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  analyzeSpendingIntelligence,
  analyzeWishGoals,
  assessFinancialHealth,
  buildDebtRepaymentPlan,
  calculateConfirmedBalance,
  calculateDailyRunway,
  calculateSafeToSpend,
  generateIncomeForecast,
  simulateScenario,
} from "../../engine";
import { summarise } from "../../engine/monthSummary";
import type { RunwayInput, Transaction } from "../../types/contracts";

test("Sprint 5G Cross-Engine Consistency: Full 12-scenario unified reconciliation", () => {
  const todayISO = "2026-11-27";
  const checkedAt = "2026-11-20T00:00:00Z";

  // Transactions:
  // 1. Salary ₹5,000 (earned)
  // 2. Family support ₹1,000 (non-earned)
  // 3. Irregular gig income ₹1,500 + ₹2,500 (earned) -> 3 earned entries total
  // 4. Living expense ₹600 + Work expense ₹400 + Group self share ₹300 = ₹1,300 spent
  // 5. COD custodial ₹500 (not_mine -> excluded from personal totals)
  const rawTxs: Transaction[] = [
    {
      id: "t1", user_id: "u1", type: "income", amount: "5000.00", category: "salary",
      description: "Salary", expense_type: null, inflow_category: "earned", payment_method: "bank",
      receipt_path: null, ownership: "mine", payout_id: null, transaction_date: "2026-11-21",
      source: "manual", created_at: "2026-11-21T10:00:00Z", updated_at: "2026-11-21T10:00:00Z",
    },
    {
      id: "t2", user_id: "u1", type: "income", amount: "1000.00", category: "other",
      description: "Family support", expense_type: null, inflow_category: "family_support", payment_method: "upi",
      receipt_path: null, ownership: "mine", payout_id: null, transaction_date: "2026-11-22",
      source: "manual", created_at: "2026-11-22T10:00:00Z", updated_at: "2026-11-22T10:00:00Z",
    },
    {
      id: "t3", user_id: "u1", type: "income", amount: "1500.00", category: "delivery_earnings",
      description: "Gig 1", expense_type: null, inflow_category: "earned", payment_method: "upi",
      receipt_path: null, ownership: "mine", payout_id: null, transaction_date: "2026-11-23",
      source: "manual", created_at: "2026-11-23T10:00:00Z", updated_at: "2026-11-23T10:00:00Z",
    },
    {
      id: "t4", user_id: "u1", type: "income", amount: "2500.00", category: "delivery_earnings",
      description: "Gig 2", expense_type: null, inflow_category: "earned", payment_method: "bank",
      receipt_path: null, ownership: "mine", payout_id: null, transaction_date: "2026-11-24",
      source: "manual", created_at: "2026-11-24T10:00:00Z", updated_at: "2026-11-24T10:00:00Z",
    },
    {
      id: "t5", user_id: "u1", type: "expense", amount: "600.00", category: "food",
      description: "Food", expense_type: "living", inflow_category: null, payment_method: "cash",
      receipt_path: null, ownership: "mine", payout_id: null, transaction_date: "2026-11-25",
      source: "manual", created_at: "2026-11-25T10:00:00Z", updated_at: "2026-11-25T10:00:00Z",
    },
    {
      id: "t6", user_id: "u1", type: "expense", amount: "400.00", category: "fuel",
      description: "Fuel", expense_type: "work", inflow_category: null, payment_method: "upi",
      receipt_path: null, ownership: "mine", payout_id: null, transaction_date: "2026-11-26",
      source: "manual", created_at: "2026-11-26T10:00:00Z", updated_at: "2026-11-26T10:00:00Z",
    },
    {
      id: "t7", user_id: "u1", type: "expense", amount: "300.00", category: "food",
      description: "Dinner (your share)", expense_type: "living", inflow_category: null, payment_method: null,
      receipt_path: null, ownership: "mine", payout_id: null, transaction_date: "2026-11-26",
      source: "manual", created_at: "2026-11-26T12:00:00Z", updated_at: "2026-11-26T12:00:00Z",
    },
    {
      id: "t8", user_id: "u1", type: "income", amount: "500.00", category: "cod_collection",
      description: "COD", expense_type: null, inflow_category: null, payment_method: null,
      receipt_path: null, ownership: "not_mine", payout_id: null, transaction_date: "2026-11-26",
      source: "manual", created_at: "2026-11-26T14:00:00Z", updated_at: "2026-11-26T14:00:00Z",
    },
  ];

  // Peer + Group obligations:
  // - Borrowed ₹2,000 (created post-checkin -> +200000 cash, +200000 liability)
  // - Partial repayment ₹500 (created post-checkin -> -50000 cash, remaining liability = 150000)
  // - Lent ₹1,000 (created post-checkin -> -100000 cash, +100000 receivable)
  // - Group expense paid by other (your share ₹300 in t7, group split you_owe ₹300 -> offsets Day-1 cash, +30000 group liability)
  const runwayInput: RunwayInput = {
    profile: {
      workProfile: "delivery",
      payoutPattern: "weekly",
      incomeVariability: "variable",
      dailyLivingEstimate: 20000,
      dailyWorkEstimate: 10000,
      safeRunwayBuffer: 100000, // ₹1,000
    },
    latestCheckin: {
      cash: 200000, // ₹2,000
      bank: 300000, // ₹3,000
      notMine: 0,
      checkedAt,
    },
    transactionsSinceCheckin: rawTxs.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Math.round(Number(t.amount) * 100),
      ownership: t.ownership,
      expenseType: t.expense_type,
      inflowCategory: t.inflow_category,
      payoutId: t.payout_id,
      date: t.transaction_date,
      createdAt: t.created_at,
    })),
    payouts: [
      {
        id: "p-next",
        kind: "platform_payout",
        expected: 200000, // ₹2,000 projected
        received: 0,
        expectedDate: "2026-11-30",
        status: "scheduled",
      },
    ],
    commitments: [
      { id: "c-over", title: "Overdue Water", amount: 20000, dueDate: "2026-11-25", kind: "bill" },
      { id: "c-due", title: "Phone Bill", amount: 30000, dueDate: "2026-11-29", kind: "bill" },
    ],
    peerDebts: [
      {
        id: "pd-borrow",
        personId: "pA",
        personName: "Amit",
        direction: "you_owe",
        totalAmountPaise: 200000,
        remainingAmountPaise: 150000,
        status: "partially_settled",
        dueDate: "2026-11-29",
        createdAt: "2026-11-21T15:00:00Z",
      },
      {
        id: "pd-lend",
        personId: "pB",
        personName: "Neha",
        direction: "they_owe",
        totalAmountPaise: 100000,
        remainingAmountPaise: 100000,
        status: "active",
        dueDate: null,
        createdAt: "2026-11-22T15:00:00Z",
      },
    ],
    debtSettlements: [
      {
        id: "ds-1",
        debtId: "pd-borrow",
        direction: "repayment_out",
        amountPaise: 50000,
        settledAt: "2026-11-24T15:00:00Z",
        createdAt: "2026-11-24T15:00:00Z",
      },
    ],
    groupSplits: [
      {
        id: "gs-1",
        groupExpenseId: "ge-1",
        isSelf: true,
        personId: null,
        direction: "you_owe",
        shareAmountPaise: 30000,
        remainingAmountPaise: 30000,
        status: "active",
        createdAt: "2026-11-26T12:00:00Z",
      },
    ],
  };

  // 1. Month summary vs SpendingIntelligence vs Balance breakdown
  const month = summarise("2026-11", rawTxs);
  const spendReport = analyzeSpendingIntelligence(
    rawTxs.map((t) => ({
      id: t.id,
      type: t.type,
      amountPaise: Math.round(Number(t.amount) * 100),
      date: t.transaction_date,
      expenseType: t.expense_type,
      inflowCategory: t.inflow_category,
      category: t.category,
      ownership: t.ownership,
    })),
    todayISO
  );
  const bal = calculateConfirmedBalance(runwayInput);

  // Earned income = 5000 + 1500 + 2500 = 900000 across ALL 3 engines (borrowing & family_support excluded)
  assert.equal(month.earnedIncome, 900000);
  assert.equal(spendReport.earnedIncomePaise, 900000);
  assert.equal(bal.breakdown?.earnedIncomePaise, 900000);

  // Total personal cash inflows = 900000 + 100000 = 1000000 across ALL 3 engines
  assert.equal(month.income, 1000000);
  assert.equal(spendReport.totalPersonalIncomePaise, 1000000);
  assert.equal(bal.breakdown?.confirmedIncomePaise, 1000000);

  // Total personal expenses = 60000 + 40000 + 30000 = 130000 across ALL 3 engines
  assert.equal(month.expense, 130000);
  assert.equal(spendReport.totalPersonalExpensesPaise, 130000);
  assert.equal(bal.breakdown?.confirmedExpensePaise, 130000);

  // Income forecast excludes ₹1,000 family_support and samples only 3 earned entries
  const forecast = generateIncomeForecast({
    transactions: rawTxs.map((t) => ({
      id: t.id,
      type: t.type,
      amountPaise: Math.round(Number(t.amount) * 100),
      date: t.transaction_date,
      inflowCategory: t.inflow_category,
      ownership: t.ownership,
    })),
  });
  assert.equal(forecast.historicalSampleCount, 3);
  assert.equal(forecast.averageDailyIncomePaise, 300000);

  // Confirmed balance math:
  // Starting: 500,000 + NetTx (1,000,000 - 130,000 = 870,000) + PeerDelta (+200,000 - 50,000 - 100,000 = +50,000) + GroupDelta (+30,000)
  // = 1,450,000 paise (₹14,500); projected payout (₹2,000) and receivable (₹1,000) are NOT counted
  assert.equal(bal.confirmedBalancePaise, 1450000);

  // Liabilities & Receivables consistency across Balance, Runway, SafeToSpend, and DebtPlanner
  const runway = calculateDailyRunway({ ...runwayInput, startDate: todayISO, horizonDays: 7 });
  const debtPlan = buildDebtRepaymentPlan({
    peerDebts: runwayInput.peerDebts,
    groupSplits: runwayInput.groupSplits,
    todayISO,
    dailyRepaymentBudgetPaise: 30000,
    availableCashForDebtPaise: bal.confirmedBalancePaise!,
  });

  assert.equal(bal.peerLiabilityPaise, 180000); // 150,000 peer + 30,000 group
  assert.equal(debtPlan.totalOwedPaise, 180000);
  assert.equal(bal.peerReceivablePaise, 100000);
  assert.equal(debtPlan.totalReceivablePaise, 100000);

  // Sustainable capital: 1,450,000 - 180,000 - 100,000 (buffer) = 1,170,000 across Runway & SafeToSpend
  assert.equal(runway.sustainableCapitalPaise, 1170000);

  // WISH goals: ordinary goal target NOT auto-reserved; explicit reservation deducted once
  const wishOrdinary = analyzeWishGoals({
    todayISO,
    goals: [{ id: "w1", title: "Laptop", targetPaise: 3000000, savedPaise: 500000, status: "active" }],
  });
  assert.equal(wishOrdinary.explicitReservedGoalsPaise, 0);

  const wishExplicit = analyzeWishGoals({
    todayISO,
    goals: [
      {
        id: "w1",
        title: "Laptop",
        targetPaise: 3000000,
        savedPaise: 500000,
        status: "active",
        explicitlyReservedPaise: 100000,
      },
    ],
  });
  assert.equal(wishExplicit.explicitReservedGoalsPaise, 100000);

  const stsOrdinary = calculateSafeToSpend({
    runwayInput,
    todayISO,
    explicitReservedGoalsPaise: wishOrdinary.explicitReservedGoalsPaise,
  });
  const stsExplicit = calculateSafeToSpend({
    runwayInput,
    todayISO,
    explicitReservedGoalsPaise: wishExplicit.explicitReservedGoalsPaise,
  });

  assert.equal(stsOrdinary.sustainableCapitalPaise, 1170000);
  // Safe to spend before 2026-11-30 = 1,170,000 - (20,000 overdue + 30,000 phone) = 1,120,000
  assert.equal(stsOrdinary.safeToSpendUntilNextIncomePaise, 1120000);
  // Explicit ₹1,000 goal reservation reduces safe-to-spend exactly once
  assert.equal(stsExplicit.safeToSpendUntilNextIncomePaise, 1020000);

  // Financial health agrees on confirmed balance, liabilities, and positive savings rate
  const health = assessFinancialHealth({
    runwayInput,
    todayISO,
    periodEarnedIncomePaise: spendReport.earnedIncomePaise,
    periodExpensesPaise: spendReport.totalPersonalExpensesPaise,
  });
  // Net savings rate: (900,000 - 130,000) / 900,000 = 86%
  assert.equal(health.netSavingsRatePercent, 86);
  assert.equal(health.debtToLiquidityPercent, Math.round((180000 * 100) / 1450000));

  // Scenario simulator: +20% on ₹2,000 expected payout shifts projected closing balance by +₹400 (+40,000 paise)
  // while leaving simulated.confirmedBalancePaise untouched
  const sim = simulateScenario(runwayInput, { incomeChangePercent: 20 });
  assert.equal(sim.simulated.confirmedBalancePaise, sim.baseline.confirmedBalancePaise);
  assert.equal(sim.deltaClosingBalancePaise, 40000);
});

test("Sprint 5G Accounting Review: Lending reduces cash once and receivables are NEVER deducted from Sustainable Capital", () => {
  const todayISO = "2026-11-27";
  const checkedAt = "2026-11-20T00:00:00Z";
  // Use distinct safety buffer (₹750 = 75,000) vs receivable (₹1,000 = 100,000)
  const baseInput: RunwayInput = {
    profile: {
      workProfile: "delivery",
      payoutPattern: "weekly",
      incomeVariability: "regular",
      dailyLivingEstimate: 20000,
      dailyWorkEstimate: 10000,
      safeRunwayBuffer: 75000, // ₹750
    },
    latestCheckin: { cash: 1000000, bank: 0, notMine: 0, checkedAt }, // ₹10,000
    transactionsSinceCheckin: [],
    payouts: [],
    commitments: [],
    peerDebts: [],
  };

  // 1. Before lending: Confirmed = ₹10,000, Sustainable Capital = 10,000 - 0 - 750 = ₹9,250
  const beforeBal = calculateConfirmedBalance(baseInput);
  const beforeRunway = calculateDailyRunway({ ...baseInput, startDate: todayISO });
  const beforeSts = calculateSafeToSpend({ runwayInput: baseInput, todayISO });
  assert.equal(beforeBal.confirmedBalancePaise, 1000000);
  assert.equal(beforeRunway.sustainableCapitalPaise, 925000);
  assert.equal(beforeSts.sustainableCapitalPaise, 925000);

  // 2. After lending ₹1,000 post-checkin: Cash drops by ₹1,000 -> ₹9,000; Receivable = ₹1,000
  // Sustainable Capital = max(0, 9,000 - 0 - 750) = ₹8,250 (receivable NOT deducted again)
  const afterPostCheckinLend: RunwayInput = {
    ...baseInput,
    peerDebts: [
      {
        id: "lend-post",
        personId: "p1",
        personName: "Neha",
        direction: "they_owe",
        totalAmountPaise: 100000,
        remainingAmountPaise: 100000,
        status: "active",
        dueDate: null,
        createdAt: "2026-11-22T10:00:00Z",
      },
    ],
  };
  const afterBal = calculateConfirmedBalance(afterPostCheckinLend);
  const afterRunway = calculateDailyRunway({ ...afterPostCheckinLend, startDate: todayISO });
  const afterSts = calculateSafeToSpend({ runwayInput: afterPostCheckinLend, todayISO });
  assert.equal(afterBal.confirmedBalancePaise, 900000);
  assert.equal(afterBal.peerReceivablePaise, 100000);
  assert.equal(afterRunway.sustainableCapitalPaise, 825000);
  assert.equal(afterSts.sustainableCapitalPaise, 825000);

  // 3. Pre-checkin loan (check-in already reflects ₹9,000 cash on hand):
  // Confirmed stays ₹9,000, Receivable = ₹1,000, Sustainable Capital = 9,000 - 0 - 750 = ₹8,250
  const preCheckinLend: RunwayInput = {
    ...baseInput,
    latestCheckin: { cash: 900000, bank: 0, notMine: 0, checkedAt },
    peerDebts: [
      {
        id: "lend-pre",
        personId: "p1",
        personName: "Neha",
        direction: "they_owe",
        totalAmountPaise: 100000,
        remainingAmountPaise: 100000,
        status: "active",
        dueDate: null,
        createdAt: "2026-11-10T10:00:00Z",
      },
    ],
  };
  const preBal = calculateConfirmedBalance(preCheckinLend);
  const preSts = calculateSafeToSpend({ runwayInput: preCheckinLend, todayISO });
  assert.equal(preBal.confirmedBalancePaise, 900000);
  assert.equal(preBal.peerReceivablePaise, 100000);
  assert.equal(preSts.sustainableCapitalPaise, 825000);
});
