// =====================================================================
// FLOVA Phase 15: Financial Intelligence & Simulator Tests
// Tests adaptive buffers, statistical forecasting, What-If scenario simulations,
// and smart spending intelligence.
// =====================================================================

import {
  calculateAdaptiveBuffer,
  deriveProtectionHorizon,
  generateIncomeForecast,
  simulateScenario,
  analyzeSpendingIntelligence,
} from "../../engine";
import type { RunwayInput } from "../../types/contracts";

declare const process: any;

let passed = 0;
let failed = 0;

function assertTrue(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(`${message ? message + ": " : ""}Expected ${expected}, got ${actual}`);
  }
}

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✔ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✖ ${name}:`, err);
  }
}

console.log("=====================================================================");
console.log("FLOVA Phase 15: Financial Intelligence & Simulator Tests");
console.log("=====================================================================");

// 1. Adaptive Buffer: Protection Horizon by Work Profile
test("deriveProtectionHorizon: tailors horizon to worker archetype", () => {
  assertEqual(deriveProtectionHorizon({ work_profile: "daily_wage" }), 3);
  assertEqual(deriveProtectionHorizon({ work_profile: "delivery" }), 7);
  assertEqual(deriveProtectionHorizon({ work_profile: "driver" }), 7);
  assertEqual(deriveProtectionHorizon({ work_profile: "small_vendor" }), 10);
  assertEqual(deriveProtectionHorizon({ work_profile: "freelancer" }), 14);

  // High variability adds precautionary buffer days (capped at 18)
  assertEqual(deriveProtectionHorizon({ work_profile: "delivery", income_variability: "unpredictable" }), 12); // 7 + 5
  assertEqual(deriveProtectionHorizon({ work_profile: "freelancer", income_variability: "unpredictable" }), 18); // capped at 18
});

// 2. Adaptive Buffer: Calculation
test("calculateAdaptiveBuffer: computes explainable cushion in integer paise", () => {
  const rec = calculateAdaptiveBuffer({
    profile: {
      work_profile: "delivery",
      income_variability: "regular",
    },
    dailyLivingEstimatePaise: 40000, // ₹400/day
    dailyWorkEstimatePaise: 20000, // ₹200/day (fuel)
    commitments: [
      { amount: 150000 }, // ₹1,500 bill
    ],
  });

  assertEqual(rec.protectionDays, 7);
  assertEqual(rec.essentialDailyCostPaise, 60000); // 400 + 200 = 600
  assertEqual(rec.baseLivingBufferPaise, 280000); // 400 * 7 = 2,800
  assertEqual(rec.baseWorkBufferPaise, 140000); // 200 * 7 = 1,400
  assertEqual(rec.upcomingCommitmentPaise, 150000); // 1,500
  // Total: 2800 + 1400 + 1500 = 5,700
  assertEqual(rec.recommendedBufferPaise, 570000);
  assertTrue(rec.explanation.length >= 2, "Explanation must contain at least 2 points");
  assertEqual(rec.hasSufficientData, true);
});

// 3. Statistical Income Forecasting
test("generateIncomeForecast: produces statistical range with confidence tier", () => {
  const transactions = [
    { id: "t-1", type: "income" as const, amountPaise: 80000, date: "2026-11-15" },
    { id: "t-2", type: "income" as const, amountPaise: 120000, date: "2026-11-16" },
    { id: "t-3", type: "income" as const, amountPaise: 100000, date: "2026-11-17" },
    { id: "t-4", type: "income" as const, amountPaise: 90000, date: "2026-11-18" },
  ];

  const forecast = generateIncomeForecast({
    transactions,
    forecastHorizonDays: 7,
  });

  assertEqual(forecast.hasSufficientData, true);
  assertTrue(forecast.expectedPaise > 0, "Expected income should be positive");
  assertTrue(forecast.lowerBoundPaise <= forecast.expectedPaise, "Lower bound must be <= expected");
  assertTrue(forecast.upperBoundPaise >= forecast.expectedPaise, "Upper bound must be >= expected");
  assertEqual(forecast.historicalSampleCount, 4);
});

test("generateIncomeForecast: returns insufficient data when fewer than 3 income records", () => {
  const transactions = [
    { id: "t-1", type: "income" as const, amountPaise: 80000, date: "2026-11-15" },
  ];

  const forecast = generateIncomeForecast({
    transactions,
    forecastHorizonDays: 7,
  });

  assertEqual(forecast.hasSufficientData, false);
  assertEqual(forecast.confidence, "insufficient");
  assertEqual(forecast.expectedPaise, 0);
});

// 4. What-If Scenario Simulator
test("simulateScenario: executes hypothetical simulation without database mutations", () => {
  const baselineInput: RunwayInput = {
    profile: {
      workProfile: "delivery",
      payoutPattern: "weekly",
      dailyLivingEstimate: 50000, // ₹500/day
      dailyWorkEstimate: 20000, // ₹200/day
      safeRunwayBuffer: 100000,
    },
    latestCheckin: {
      cash: 500000, // ₹5,000
      bank: 500000, // ₹5,000
      notMine: 0,
      checkedAt: "2026-11-20T08:00:00Z",
    },
    transactionsSinceCheckin: [],
    payouts: [
      {
        id: "p-1",
        kind: "platform_payout",
        expected: 300000, // ₹3,000
        received: 0,
        expectedDate: "2026-11-25",
        status: "scheduled",
      },
    ],
    commitments: [],
  };

  // Simulate spending ₹100 less per day and ₹2,000 emergency expense
  const sim = simulateScenario(baselineInput, {
    dailySpendingChangePaise: -10000, // spend ₹100 less/day
    oneTimeExpensePaise: 200000, // ₹2,000 surprise expense
  });

  assertEqual(sim.isHypothetical, true);
  assertTrue(sim.explanation.includes("spending ₹100 less/day"), "Must explain spending reduction");
  assertTrue(sim.explanation.includes("unexpected expense of ₹2000"), "Must explain surprise expense");
  assertTrue(sim.deltaClosingBalancePaise !== 0, "Closing balance must reflect scenario delta");

  // Invariant: baseline input remains completely untouched
  assertEqual(baselineInput.profile.dailyLivingEstimate, 50000);
  assertEqual(baselineInput.transactionsSinceCheckin.length, 0);
});

// 5. Smart Spending Intelligence
test("analyzeSpendingIntelligence: calculates living vs work proportions and category distributions", () => {
  const transactions = [
    { id: "tx-1", type: "expense" as const, amountPaise: 30000, expenseType: "living" as const, category: "food", date: "2026-11-20" },
    { id: "tx-2", type: "expense" as const, amountPaise: 20000, expenseType: "work" as const, category: "fuel", date: "2026-11-20" },
    { id: "tx-3", type: "expense" as const, amountPaise: 50000, expenseType: "living" as const, category: "groceries", date: "2026-11-19" },
    { id: "tx-4", type: "income" as const, amountPaise: 150000, category: "earnings", date: "2026-11-18" },
    { id: "tx-5", type: "expense" as const, amountPaise: 100000, ownership: "not_mine" as const, category: "cod_collection", date: "2026-11-20" },
  ];

  const report = analyzeSpendingIntelligence(transactions, "2026-11-21");

  // Total personal expenses = 300 + 200 + 500 = ₹1,000 (excludes COD ₹1,000)
  assertEqual(report.totalPersonalExpensesPaise, 100000);
  assertEqual(report.livingPaise, 80000); // 300 + 500 = 800
  assertEqual(report.workPaise, 20000); // 200
  assertEqual(report.livingPercent, 80);
  assertEqual(report.workPercent, 20);

  // Top categories
  assertTrue(report.topCategories.length >= 3, "Should report at least 3 categories");
  assertEqual(report.topCategories[0].category, "groceries");
  assertEqual(report.topCategories[0].totalPaise, 50000);
});

console.log("=====================================================================");
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log("=====================================================================");

if (typeof process !== "undefined" && failed > 0) {
  process.exit(1);
}
