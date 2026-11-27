// =====================================================================
// FLOVA 2.0 | Sprint 5B: Core Financial Metric Accuracy Tests
// Verifies:
//   - Earned vs non-earned inflows across all inflow_category values
//   - Legacy null inflow_category backward compatibility
//   - Income forecast exclusion of non-earned inflows
//   - Scenario simulator incomeChangePercent (positive, negative, zero, missing payouts)
//   - Pure UTC ISO date-window arithmetic across month & year boundaries
// =====================================================================

import assert from "node:assert/strict";
import { test } from "node:test";
import { summarise } from "../../engine/monthSummary";
import { analyzeSpendingIntelligence } from "../../engine/spendingIntelligence";
import { generateIncomeForecast } from "../../engine/incomeForecast";
import { simulateScenario } from "../../engine/scenarioSimulator";
import type { RunwayInput, Transaction } from "../../types/contracts";

function makeTx(overrides: Partial<Transaction>): Transaction {
  return {
    id: overrides.id ?? "tx-" + Math.random().toString(36).slice(2, 8),
    user_id: "u1",
    type: overrides.type ?? "income",
    amount: overrides.amount ?? "100.00",
    category: overrides.category ?? "salary",
    description: overrides.description ?? null,
    expense_type: overrides.expense_type ?? null,
    inflow_category: overrides.inflow_category !== undefined ? overrides.inflow_category : "earned",
    payment_method: overrides.payment_method ?? null,
    receipt_path: null,
    ownership: overrides.ownership ?? "mine",
    payout_id: null,
    transaction_date: overrides.transaction_date ?? "2026-11-15",
    source: "manual",
    created_at: "2026-11-15T10:00:00Z",
    updated_at: "2026-11-15T10:00:00Z",
  };
}

test("Sprint 5B: useMonthSummary separates earned vs non-earned inflows and preserves legacy null fallback", () => {
  const txs: Transaction[] = [
    makeTx({ id: "1", amount: "5000.00", inflow_category: "earned", category: "salary" }),
    makeTx({ id: "2", amount: "1200.00", inflow_category: null, category: "earnings" }), // legacy null -> earned
    makeTx({ id: "3", amount: "1000.00", inflow_category: "family_support", category: "other" }),
    makeTx({ id: "4", amount: "500.00", inflow_category: "pocket_money", category: "other" }),
    makeTx({ id: "5", amount: "300.00", inflow_category: "gift", category: "other" }),
    makeTx({ id: "6", amount: "200.00", inflow_category: "donation", category: "other" }),
    makeTx({ id: "7", type: "expense", amount: "400.00", inflow_category: null, expense_type: "living", category: "food" }),
    makeTx({ id: "8", type: "income", amount: "900.00", ownership: "not_mine", category: "cod_collection" }),
  ];

  const s = summarise("2026-11", txs);
  // Earned = 5000 + 1200 = 6200 (620000 paise)
  assert.equal(s.earnedIncome, 620000);
  // Non-earned = 1000 + 500 + 300 + 200 = 2000 (200000 paise)
  assert.equal(s.nonEarnedInflow, 200000);
  // Total personal cash inflow = 8200 (820000 paise); COD excluded
  assert.equal(s.income, 820000);
  assert.equal(s.expense, 40000);
  assert.equal(s.notMine, 90000);
});

test("Sprint 5B: generateIncomeForecast excludes non-earned inflows and keeps legacy null fallback", () => {
  const txs = [
    { id: "e1", type: "income" as const, amountPaise: 50000, date: "2026-11-10", inflow_category: "earned" as const },
    { id: "e2", type: "income" as const, amountPaise: 60000, date: "2026-11-11", inflow_category: null }, // legacy
    { id: "e3", type: "income" as const, amountPaise: 70000, date: "2026-11-12", inflow_category: "earned" as const },
    // Large one-off non-earned inflows must NOT inflate earning forecast
    { id: "g1", type: "income" as const, amountPaise: 1000000, date: "2026-11-13", inflow_category: "gift" as const },
    { id: "f1", type: "income" as const, amountPaise: 500000, date: "2026-11-14", inflow_category: "family_support" as const },
    { id: "p1", type: "income" as const, amountPaise: 200000, date: "2026-11-15", inflow_category: "pocket_money" as const },
    { id: "d1", type: "income" as const, amountPaise: 300000, date: "2026-11-16", inflow_category: "donation" as const },
  ];

  const forecast = generateIncomeForecast({ transactions: txs, forecastHorizonDays: 7 });
  assert.equal(forecast.hasSufficientData, true);
  assert.equal(forecast.historicalSampleCount, 3, "Only the 3 earned records should be sampled");
  // Mean of [50000, 60000, 70000] = 60000 paise/day
  assert.equal(forecast.averageDailyIncomePaise, 60000);
});

test("Sprint 5B: scenarioSimulator incomeChangePercent shifts projections cleanly without altering confirmed cash", () => {
  const base: RunwayInput = {
    profile: {
      workProfile: "delivery",
      payoutPattern: "weekly",
      dailyLivingEstimate: 20000, // ₹200/day
      dailyWorkEstimate: 10000,   // ₹100/day
      safeRunwayBuffer: 50000,    // ₹500
    },
    latestCheckin: {
      cash: 150000, // ₹1,500
      bank: 0,
      notMine: 0,
      checkedAt: "2026-11-20T00:00:00Z",
    },
    transactionsSinceCheckin: [],
    payouts: [
      {
        id: "p1",
        kind: "platform_payout",
        expected: 200000, // ₹2,000 pending
        received: 0,
        expectedDate: "2026-11-22",
        status: "scheduled",
      },
    ],
    commitments: [],
  };

  // Positive +25% on ₹2,000 = +₹500 (+50000 paise)
  const pos = simulateScenario(base, { incomeChangePercent: 25 });
  assert.equal(pos.simulated.confirmedBalancePaise, pos.baseline.confirmedBalancePaise, "Confirmed balance must not be inflated");
  assert.equal(pos.deltaClosingBalancePaise, 50000);
  assert.ok(pos.runwayDaysDelta >= 0);

  // Negative -50% on ₹2,000 = -₹1,000 (-100000 paise) -> shortens runway
  const neg = simulateScenario(base, { incomeChangePercent: -50 });
  assert.equal(neg.simulated.confirmedBalancePaise, neg.baseline.confirmedBalancePaise);
  assert.equal(neg.deltaClosingBalancePaise, -100000);
  assert.ok(neg.runwayDaysDelta < 0, "Negative income shift should shorten runway");

  // Zero change -> delta 0
  const zero = simulateScenario(base, { incomeChangePercent: 0 });
  assert.equal(zero.deltaClosingBalancePaise, 0);
  assert.equal(zero.runwayDaysDelta, 0);

  // Missing payouts -> safe 0 delta with clear explanation
  const noPayouts: RunwayInput = { ...base, payouts: [] };
  const missing = simulateScenario(noPayouts, { incomeChangePercent: 20 });
  assert.equal(missing.deltaClosingBalancePaise, 0);
  assert.ok(missing.explanation.includes("no expected payouts"));
});

test("Sprint 5B: spendingIntelligence separates earned vs non-earned and handles month & year ISO boundaries", () => {
  // Year boundary: today = 2027-01-03
  // Recent 7-day window: [2026-12-28 .. 2027-01-03]
  // Prior 7-day window:  [2026-12-21 .. 2026-12-27]
  const txs = [
    { id: "e1", type: "income" as const, amountPaise: 100000, date: "2027-01-02", inflow_category: "earned" as const },
    { id: "g1", type: "income" as const, amountPaise: 50000, date: "2027-01-02", inflow_category: "gift" as const },
    // Recent week: 30000 + 20000 = 50000
    { id: "r1", type: "expense" as const, amountPaise: 30000, expenseType: "living" as const, category: "food", date: "2026-12-28" },
    { id: "r2", type: "expense" as const, amountPaise: 20000, expenseType: "work" as const, category: "fuel", date: "2027-01-03" },
    // Prior week: 40000
    { id: "p1", type: "expense" as const, amountPaise: 40000, expenseType: "living" as const, category: "groceries", date: "2026-12-21" },
    // Outside 14-day window (2026-12-20): excluded from both windows
    { id: "o1", type: "expense" as const, amountPaise: 90000, expenseType: "living" as const, category: "rent", date: "2026-12-20" },
  ];

  const report = analyzeSpendingIntelligence(txs, "2027-01-03");
  assert.equal(report.earnedIncomePaise, 100000);
  assert.equal(report.nonEarnedInflowPaise, 50000);
  assert.equal(report.totalPersonalIncomePaise, 150000);
  assert.equal(report.recentWeekExpensesPaise, 50000);
  assert.equal(report.previousWeekExpensesPaise, 40000);
  // (50000 - 40000) / 40000 = +25%
  assert.equal(report.weekOverWeekChangePercent, 25);
});
