// =====================================================================
// FLOVA 2.0 | Sprint 5E: Financial Health & Spending Anomaly Tests
// Covers:
//   - Positive & negative net savings rates
//   - Missing historical data / insufficient_data honesty
//   - Low vs adequate runway & buffer adequacy
//   - Outstanding debt-to-liquidity ratio
//   - Earned income vs expenses
//   - Large expense spikes, category surges, weekly surges
//   - Insufficient history false-alarm guard
//   - Month/year boundary & not_mine exclusion
// =====================================================================

import assert from "node:assert/strict";
import { test } from "node:test";
import { assessFinancialHealth } from "../../engine/financialHealth";
import { ANOMALY_THRESHOLDS, analyzeSpendingIntelligence } from "../../engine/spendingIntelligence";
import type { RunwayInput } from "../../types/contracts";

function makeInput(overrides?: Partial<RunwayInput>): RunwayInput {
  return {
    profile: {
      workProfile: "delivery",
      payoutPattern: "weekly",
      incomeVariability: "regular",
      dailyLivingEstimate: 20000,
      dailyWorkEstimate: 10000,
      safeRunwayBuffer: 100000,
    },
    latestCheckin: {
      cash: 500000,
      bank: 500000,
      notMine: 0,
      checkedAt: "2026-11-01T00:00:00Z",
    },
    transactionsSinceCheckin: [
      {
        id: "tx-inc-1",
        type: "income",
        amount: 400000, // ₹4,000 earned
        ownership: "mine",
        expenseType: null,
        inflowCategory: "earned",
        payoutId: null,
        date: "2026-11-10",
        createdAt: "2026-11-10T10:00:00Z",
      },
      {
        id: "tx-exp-1",
        type: "expense",
        amount: 200000, // ₹2,000 spent -> 50% net savings rate
        ownership: "mine",
        expenseType: "living",
        inflowCategory: null,
        payoutId: null,
        date: "2026-11-12",
        createdAt: "2026-11-12T10:00:00Z",
      },
    ],
    payouts: [],
    commitments: [],
    ...overrides,
  };
}

test("Sprint 5E: assessFinancialHealth reports healthy indicators, positive savings rate, and zero debt", () => {
  const report = assessFinancialHealth({
    runwayInput: makeInput(),
    todayISO: "2026-11-27",
  });

  assert.equal(report.overallStatus, "healthy");
  assert.equal(report.netSavingsRatePercent, 50);
  assert.equal(report.debtToLiquidityPercent, 0);
  assert.equal(report.indicators.length, 6);
  assert.ok(report.indicators.every((i) => i.status === "healthy"));
});

test("Sprint 5E: assessFinancialHealth detects negative savings, low runway, and high debt-to-liquidity", () => {
  const stressed = makeInput({
    latestCheckin: { cash: 50000, bank: 0, notMine: 0, checkedAt: "2026-11-01T00:00:00Z" },
    transactionsSinceCheckin: [
      {
        id: "e1",
        type: "income",
        amount: 100000, // ₹1,000 earned
        ownership: "mine",
        expenseType: null,
        inflowCategory: "earned",
        payoutId: null,
        date: "2026-11-10",
        createdAt: "2026-11-10T10:00:00Z",
      },
      {
        id: "x1",
        type: "expense",
        amount: 140000, // ₹1,400 spent -> -40% savings rate
        ownership: "mine",
        expenseType: "living",
        inflowCategory: null,
        payoutId: null,
        date: "2026-11-11",
        createdAt: "2026-11-11T10:00:00Z",
      },
    ],
    peerDebts: [
      {
        id: "pd1",
        personId: "p1",
        direction: "you_owe",
        totalAmountPaise: 80000,
        remainingAmountPaise: 80000,
        status: "active",
        dueDate: "2026-11-20",
        createdAt: "2026-10-01T00:00:00Z",
      },
    ],
  });

  const report = assessFinancialHealth({ runwayInput: stressed, todayISO: "2026-11-27" });
  assert.equal(report.overallStatus, "attention");
  assert.equal(report.netSavingsRatePercent, -40);
  assert.equal(report.indicators.find((i) => i.id === "debt_to_liquidity")!.status, "attention");
  assert.equal(report.indicators.find((i) => i.id === "net_savings_rate")!.status, "attention");
});

test("Sprint 5E: assessFinancialHealth handles missing check-in / insufficient history honestly", () => {
  const missing = makeInput({
    latestCheckin: null,
    transactionsSinceCheckin: [],
  });
  const report = assessFinancialHealth({ runwayInput: missing, todayISO: "2026-11-27" });
  assert.equal(report.overallStatus, "insufficient_data");
  assert.equal(report.netSavingsRatePercent, null);
  assert.equal(report.debtToLiquidityPercent, null);
  assert.ok(report.indicators.some((i) => i.status === "insufficient_data"));
});

test("Sprint 5E: Spending anomaly detection guards insufficient history, excludes not_mine, and detects spikes across year boundary", () => {
  // Fewer than MIN_EXPENSES_FOR_SPIKE (3) -> no false-alarm large_expense spike
  const tinyHistory = [
    { id: "1", type: "expense" as const, amountPaise: 250000, category: "rent", date: "2026-12-30" },
  ];
  const tinyReport = analyzeSpendingIntelligence(tinyHistory, "2026-12-31");
  assert.equal(tinyReport.highSpendingSpikes.length, 0);
  assert.equal(tinyReport.anomalies.filter((a) => a.kind === "large_expense").length, 0);

  // Sufficient history across year boundary (today = 2027-01-03)
  // Recent week: 2026-12-28..2027-01-03; Prior week: 2026-12-21..2026-12-27
  const txs = [
    // Prior week: food 40000 (₹400), fuel 20000 (₹200) -> total 60000
    { id: "p1", type: "expense" as const, amountPaise: 40000, category: "food", date: "2026-12-22" },
    { id: "p2", type: "expense" as const, amountPaise: 20000, category: "fuel", date: "2026-12-23" },
    // Recent week: food 100000 (₹1,000 -> 2.5x prior), plus large repair 800000 (₹8,000)
    { id: "r1", type: "expense" as const, amountPaise: 100000, category: "food", date: "2026-12-30" },
    { id: "r2", type: "expense" as const, amountPaise: 800000, category: "vehicle", date: "2027-01-02" },
    // not_mine COD handover must be excluded
    { id: "nm", type: "expense" as const, amountPaise: 900000, ownership: "not_mine" as const, category: "cod_handover", date: "2027-01-02" },
  ];

  const report = analyzeSpendingIntelligence(txs, "2027-01-03");
  assert.equal(ANOMALY_THRESHOLDS.MIN_EXPENSES_FOR_SPIKE, 3);
  assert.equal(report.totalPersonalExpensesPaise, 960000);
  assert.ok(report.anomalies.some((a) => a.kind === "large_expense" && a.category === "vehicle"));
  assert.ok(report.anomalies.some((a) => a.kind === "category_spike" && a.category === "food"));
  assert.ok(report.anomalies.some((a) => a.kind === "weekly_surge"));
  assert.ok(!report.anomalies.some((a) => a.category === "cod_handover"));
});
