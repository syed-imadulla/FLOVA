// =====================================================================
// FLOVA Phase 10: Activity, Money Overview & Insights Test Suite (Owner: M1, M2, M3)
// Verifies:
// 1. listActivityTimeline() unified chronological ordering (transactions, check-ins, expected payouts)
// 2. Balance check-in segregation (zero income/expense pollution)
// 3. Scheduled payout isolation (advisory only, zero balance/income impact)
// 4. Living vs work expense classification preservation
// 5. Custodial COD third-party money preservation (ownership='not_mine')
// 6. Timeline date range and limit filtering
// 7. Deterministic Insight 1: Daily budget burn alert
// 8. Deterministic Insight 2: Runway shortfall countdown warning (−₹1,170 on Saturday)
// 9. Deterministic Insight 3: Expected payout to commitment coverage match
// 10. Deterministic Insight 4: Custodial COD cash reminder
// 11. Missing baseline truthful uncertainty (INSUFFICIENT_INFORMATION)
// =====================================================================

import { listActivityTimeline } from "../data";
import { generateFinancialInsights } from "../../engine/insights";
import { mockState, resetMockState } from "./mockSupabase";
import type {
  ActivityItem,
  RunwayInput,
} from "../../types/contracts";
import type { ProcessedRunway } from "../../runway/adapter";

let passCount = 0;
let failCount = 0;

function assertTrue(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertStrictEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(message ?? `Assertion failed: expected ${String(expected)}, but got ${String(actual)}`);
  }
}

async function it(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    passCount++;
    console.log(`  ✔ ${name}`);
  } catch (err) {
    failCount++;
    console.error(`  ✘ ${name}`);
    console.error(err);
  }
}

async function runTests() {
  console.log("=================================================");
  console.log("FLOVA Phase 10: Activity, Money Overview & Insights Test Suite");
  console.log("=================================================\n");

  // -----------------------------------------------------------------
  // 1. Unified Activity Timeline Ordering
  // -----------------------------------------------------------------
  await it("Test 1: listActivityTimeline() unifies transactions, check-ins, and expected payouts in descending order", async () => {
    resetMockState();

    mockState.transactions = [
      {
        id: "tx-1",
        user_id: "user-1",
        type: "income",
        amount: "650.00",
        category: "earnings",
        description: "Delivery earnings",
        expense_type: null,
        ownership: "mine",
        payout_id: null,
        transaction_date: "2026-11-20",
        source: "manual",
        created_at: "2026-11-20T14:00:00Z",
        updated_at: "2026-11-20T14:00:00Z",
      },
      {
        id: "tx-2",
        user_id: "user-1",
        type: "expense",
        amount: "120.00",
        category: "fuel",
        description: "Petrol",
        expense_type: "work",
        ownership: "mine",
        payout_id: null,
        transaction_date: "2026-11-20",
        source: "voice",
        created_at: "2026-11-20T16:00:00Z",
        updated_at: "2026-11-20T16:00:00Z",
      },
    ];

    mockState.balanceCheckins = [
      {
        id: "checkin-1",
        user_id: "user-1",
        cash_amount: "500.00",
        bank_amount: "2500.00",
        not_mine_amount: "0.00",
        note: "Morning check-in",
        checked_at: "2026-11-20T08:00:00Z",
        created_at: "2026-11-20T08:00:00Z",
      },
    ];

    mockState.payouts = [
      {
        id: "payout-1",
        user_id: "user-1",
        kind: "platform_payout",
        source: "Swiggy",
        expected_amount: "1800.00",
        received_amount: "0.00",
        expected_date: "2026-11-23",
        status: "scheduled",
        note: "Weekly platform payout",
        created_at: "2026-11-20T07:00:00Z",
        updated_at: "2026-11-20T07:00:00Z",
      },
    ];

    const timeline = await listActivityTimeline();
    assertStrictEqual(timeline.length, 4, "Must contain all 4 activity items");

    // Verify ordering: newest timestamp first
    // Payout (2026-11-23) -> tx-2 (2026-11-20T16:00) -> tx-1 (2026-11-20T14:00) -> checkin (2026-11-20T08:00)
    assertStrictEqual(timeline[0].kind, "expected_payout");
    assertStrictEqual(timeline[0].date, "2026-11-23");

    assertStrictEqual(timeline[1].id, "tx-2");
    assertStrictEqual(timeline[1].expenseType, "work");

    assertStrictEqual(timeline[2].id, "tx-1");
    assertStrictEqual(timeline[2].type, "income");

    assertStrictEqual(timeline[3].kind, "checkin");
  });

  // -----------------------------------------------------------------
  // 2. Check-in Segregation
  // -----------------------------------------------------------------
  await it("Test 2: Check-ins are strictly segregated with kind='checkin' and zero income/expense pollution", async () => {
    resetMockState();

    mockState.balanceCheckins = [
      {
        id: "checkin-seg-1",
        user_id: "user-1",
        cash_amount: "800.00",
        bank_amount: "3200.00",
        not_mine_amount: "500.00",
        note: "Daily baseline",
        checked_at: "2026-11-21T06:00:00Z",
        created_at: "2026-11-21T06:00:00Z",
      },
    ];

    const timeline = await listActivityTimeline();
    assertStrictEqual(timeline.length, 1);
    const item = timeline[0];

    assertStrictEqual(item.kind, "checkin");
    assertStrictEqual(item.type, "checkin");
    assertTrue(item.snapshot !== undefined, "Snapshot must be populated");
    assertStrictEqual(item.snapshot?.cashPaise, 80000); // ₹800
    assertStrictEqual(item.snapshot?.bankPaise, 320000); // ₹3,200
    assertStrictEqual(item.snapshot?.notMinePaise, 50000); // ₹500
    assertStrictEqual(item.snapshot?.totalPersonalPaise, 350000); // ₹3,500
  });

  // -----------------------------------------------------------------
  // 3. Scheduled Payout Isolation
  // -----------------------------------------------------------------
  await it("Test 3: Scheduled payouts have kind='expected_payout' with zero personal income balance impact", async () => {
    resetMockState();

    mockState.payouts = [
      {
        id: "payout-sched-1",
        user_id: "user-1",
        kind: "platform_payout",
        source: "Zomato",
        expected_amount: "2400.00",
        received_amount: "0.00",
        expected_date: "2026-11-25",
        status: "scheduled",
        note: null,
        created_at: "2026-11-21T05:00:00Z",
        updated_at: "2026-11-21T05:00:00Z",
      },
    ];

    const timeline = await listActivityTimeline();
    assertStrictEqual(timeline.length, 1);
    const item = timeline[0];

    assertStrictEqual(item.kind, "expected_payout");
    assertStrictEqual(item.payoutStatus, "scheduled");
    assertStrictEqual(item.amountPaise, 240000); // ₹2,400
    assertStrictEqual(item.category, "payout");
  });

  // -----------------------------------------------------------------
  // 4. Living vs Work Expense Distinction
  // -----------------------------------------------------------------
  await it("Test 4: Living expenses and work expenses are explicitly distinguished", async () => {
    resetMockState();

    mockState.transactions = [
      {
        id: "tx-living",
        user_id: "user-1",
        type: "expense",
        amount: "50.00",
        category: "food",
        description: "Chai and nashta",
        expense_type: "living",
        ownership: "mine",
        payout_id: null,
        transaction_date: "2026-11-21",
        source: "voice",
        created_at: "2026-11-21T10:00:00Z",
        updated_at: "2026-11-21T10:00:00Z",
      },
      {
        id: "tx-work",
        user_id: "user-1",
        type: "expense",
        amount: "150.00",
        category: "fuel",
        description: "Petrol refill",
        expense_type: "work",
        ownership: "mine",
        payout_id: null,
        transaction_date: "2026-11-21",
        source: "ai_suggestion",
        created_at: "2026-11-21T11:00:00Z",
        updated_at: "2026-11-21T11:00:00Z",
      },
    ];

    const timeline = await listActivityTimeline();
    const living = timeline.find((t) => t.id === "tx-living");
    const work = timeline.find((t) => t.id === "tx-work");

    assertStrictEqual(living?.expenseType, "living");
    assertStrictEqual(living?.category, "food");

    assertStrictEqual(work?.expenseType, "work");
    assertStrictEqual(work?.category, "fuel");
  });

  // -----------------------------------------------------------------
  // 5. Custodial COD Third-Party Money
  // -----------------------------------------------------------------
  await it("Test 5: Third-party COD collections have ownership='not_mine' and are isolated", async () => {
    resetMockState();

    mockState.transactions = [
      {
        id: "tx-cod",
        user_id: "user-1",
        type: "income",
        amount: "750.00",
        category: "cod_collection",
        description: "Cash collected for order #4928",
        expense_type: null,
        ownership: "not_mine",
        payout_id: null,
        transaction_date: "2026-11-21",
        source: "manual",
        created_at: "2026-11-21T13:00:00Z",
        updated_at: "2026-11-21T13:00:00Z",
      },
    ];

    const timeline = await listActivityTimeline();
    assertStrictEqual(timeline[0].ownership, "not_mine");
    assertStrictEqual(timeline[0].amountPaise, 75000);
  });

  // -----------------------------------------------------------------
  // 6. Timeline Filtering (Limit & Options)
  // -----------------------------------------------------------------
  await it("Test 6: listActivityTimeline({ limit: 2 }) limits the returned stream correctly", async () => {
    resetMockState();

    mockState.transactions = [
      {
        id: "tx-a",
        user_id: "user-1",
        type: "expense",
        amount: "10.00",
        category: "other",
        description: "Item 1",
        expense_type: "living",
        ownership: "mine",
        payout_id: null,
        transaction_date: "2026-11-21",
        source: "manual",
        created_at: "2026-11-21T01:00:00Z",
        updated_at: "2026-11-21T01:00:00Z",
      },
      {
        id: "tx-b",
        user_id: "user-1",
        type: "expense",
        amount: "20.00",
        category: "other",
        description: "Item 2",
        expense_type: "living",
        ownership: "mine",
        payout_id: null,
        transaction_date: "2026-11-21",
        source: "manual",
        created_at: "2026-11-21T02:00:00Z",
        updated_at: "2026-11-21T02:00:00Z",
      },
      {
        id: "tx-c",
        user_id: "user-1",
        type: "expense",
        amount: "30.00",
        category: "other",
        description: "Item 3",
        expense_type: "living",
        ownership: "mine",
        payout_id: null,
        transaction_date: "2026-11-21",
        source: "manual",
        created_at: "2026-11-21T03:00:00Z",
        updated_at: "2026-11-21T03:00:00Z",
      },
    ];

    const timeline = await listActivityTimeline({ limit: 2 });
    assertStrictEqual(timeline.length, 2, "Must return exactly 2 items");
    assertStrictEqual(timeline[0].id, "tx-c", "Most recent item first");
  });

  // -----------------------------------------------------------------
  // 7. Deterministic Insight 1: Daily Budget Burn Alert
  // -----------------------------------------------------------------
  await it("Test 7: generateFinancialInsights detects budget burn when spend > daily estimate", () => {
    const mockInput: RunwayInput = {
      latestCheckin: {
        cash: 50000,
        bank: 200000,
        notMine: 0,
        checkedAt: "2026-11-21T06:00:00Z",
      },
      payouts: [],
      transactionsSinceCheckin: [],
      commitments: [],
      profile: {
        workProfile: "delivery",
        payoutPattern: "weekly",
        dailyLivingEstimate: 20000, // ₹200
        dailyWorkEstimate: 10000,   // ₹100
      },
    };

    const mockRunway: ProcessedRunway = {
      status: "PROJECTED",
      confirmedBalancePaise: 250000,
      custodialOwedPaise: null,
      dailyEssentialExpensePaise: 30000,
      firstShortfallDate: null,
      projectedZeroBalanceDate: null,
      runwayDays: 8,
      projections: [],
      missingInputs: [],
      upcomingCommitments: [],
      expectedPayouts: [],
    };

    // User spent ₹150 on work expenses (estimate is ₹100)
    const activityItems: ActivityItem[] = [
      {
        id: "item-fuel",
        kind: "transaction",
        type: "expense",
        expenseType: "work",
        category: "fuel",
        amountPaise: 15000, // ₹150
        date: "2026-11-21",
        timestamp: "2026-11-21T09:00:00Z",
        title: "Petrol",
        ownership: "mine",
      },
    ];

    const insights = generateFinancialInsights(mockInput, mockRunway, activityItems, { today: "2026-11-21" });
    const burnInsight = insights.find((i) => i.type === "budget_burn");

    assertTrue(burnInsight !== undefined, "Must trigger budget burn alert");
    assertStrictEqual(burnInsight?.severity, "warning");
    assertTrue(burnInsight!.message.includes("₹150"), "States ₹150 spent");
    assertTrue(burnInsight!.message.includes("₹100"), "States ₹100 daily estimate");
  });

  // -----------------------------------------------------------------
  // 8. Deterministic Insight 2: Runway Shortfall Countdown Warning
  // -----------------------------------------------------------------
  await it("Test 8: generateFinancialInsights flags shortfall date and exact deficit matching Saturday Ravi shortfall", () => {
    const mockInput: RunwayInput = {
      latestCheckin: {
        cash: 143000,
        bank: 250000,
        notMine: 0,
        checkedAt: "2026-11-20T06:00:00Z",
      },
      payouts: [],
      transactionsSinceCheckin: [],
      commitments: [],
      profile: {
        workProfile: "delivery",
        payoutPattern: "weekly",
        dailyLivingEstimate: 20000,
        dailyWorkEstimate: 10000,
      },
    };

    const mockRunway: ProcessedRunway = {
      status: "PROJECTED",
      confirmedBalancePaise: 393000,
      custodialOwedPaise: null,
      dailyEssentialExpensePaise: 30000,
      firstShortfallDate: "2026-11-21",
      projectedZeroBalanceDate: "2026-11-21",
      runwayDays: 1,
      projections: [
        {
          date: "2026-11-20",
          dayIndex: 0,
          openingBalancePaise: 393000,
          essentialExpensePaise: 30000,
          commitmentDeductionPaise: 0,
          otherTransactionAdjustmentPaise: 0,
          netChangePaise: -30000,
          closingBalancePaise: 363000,
          commitmentsApplied: [],
        },
        {
          date: "2026-11-21",
          dayIndex: 1,
          openingBalancePaise: 363000,
          essentialExpensePaise: 30000,
          commitmentDeductionPaise: 450000,
          otherTransactionAdjustmentPaise: 0,
          netChangePaise: -480000,
          closingBalancePaise: -117000, // -₹1,170 shortfall!
          commitmentsApplied: [{ id: "rent", title: "Rent", amount: 450000 }],
        },
      ],
      missingInputs: [],
      upcomingCommitments: [],
      expectedPayouts: [],
    };

    const insights = generateFinancialInsights(mockInput, mockRunway, [], { today: "2026-11-20" });
    const shortfallInsight = insights.find((i) => i.type === "shortfall_warning");

    assertTrue(shortfallInsight !== undefined, "Must trigger shortfall warning");
    assertStrictEqual(shortfallInsight?.date, "2026-11-21");
    assertTrue(shortfallInsight!.message.includes("₹1,170"), "Must state exact shortfall amount ₹1,170");
  });

  // -----------------------------------------------------------------
  // 9. Deterministic Insight 3: Expected Payout Coverage
  // -----------------------------------------------------------------
  await it("Test 9: generateFinancialInsights matches scheduled payout to upcoming commitment", () => {
    const mockInput: RunwayInput = {
      latestCheckin: {
        cash: 10000,
        bank: 50000,
        notMine: 0,
        checkedAt: "2026-11-21T06:00:00Z",
      },
      payouts: [
        {
          id: "payout-swiggy",
          kind: "platform_payout",
          expected: 180000, // ₹1,800
          received: 0,
          expectedDate: "2026-11-23",
          status: "scheduled",
        },
      ],
      transactionsSinceCheckin: [],
      commitments: [
        {
          id: "comm-rent",
          title: "House Rent",
          amount: 150000, // ₹1,500
          dueDate: "2026-11-24",
          kind: "bill",
        },
      ],
      profile: {
        workProfile: "delivery",
        payoutPattern: "weekly",
        dailyLivingEstimate: 20000,
        dailyWorkEstimate: 10000,
      },
    };

    const mockRunway: ProcessedRunway = {
      status: "PROJECTED",
      confirmedBalancePaise: 60000,
      custodialOwedPaise: null,
      dailyEssentialExpensePaise: 30000,
      firstShortfallDate: null,
      projectedZeroBalanceDate: null,
      runwayDays: 2,
      projections: [],
      missingInputs: [],
      upcomingCommitments: [],
      expectedPayouts: [],
    };

    const insights = generateFinancialInsights(mockInput, mockRunway, [], { today: "2026-11-21" });
    const coverage = insights.find((i) => i.type === "payout_coverage");

    assertTrue(coverage !== undefined, "Must trigger payout coverage insight");
    assertTrue(coverage!.message.includes("₹1,800"), "Mentions ₹1,800 payout");
    assertTrue(coverage!.message.includes("House Rent"), "Mentions House Rent commitment");
  });

  // -----------------------------------------------------------------
  // 10. Deterministic Insight 4: Custodial COD Liability
  // -----------------------------------------------------------------
  await it("Test 10: generateFinancialInsights alerts when custodial COD cash is held", () => {
    const mockInput: RunwayInput = {
      latestCheckin: {
        cash: 150000,
        bank: 200000,
        notMine: 80000, // ₹800 COD
        checkedAt: "2026-11-21T06:00:00Z",
      },
      payouts: [],
      transactionsSinceCheckin: [],
      commitments: [],
      profile: {
        workProfile: "delivery",
        payoutPattern: "weekly",
        dailyLivingEstimate: 20000,
        dailyWorkEstimate: 10000,
      },
    };

    const mockRunway: ProcessedRunway = {
      status: "PROJECTED",
      confirmedBalancePaise: 270000,
      custodialOwedPaise: 80000, // ₹800
      dailyEssentialExpensePaise: 30000,
      firstShortfallDate: null,
      projectedZeroBalanceDate: null,
      runwayDays: 9,
      projections: [],
      missingInputs: [],
      upcomingCommitments: [],
      expectedPayouts: [],
    };

    const insights = generateFinancialInsights(mockInput, mockRunway, [], { today: "2026-11-21" });
    const cod = insights.find((i) => i.type === "cod_liability");

    assertTrue(cod !== undefined, "Must trigger COD liability insight");
    assertTrue(cod!.message.includes("₹800"), "Mentions ₹800 COD cash");
  });

  // -----------------------------------------------------------------
  // 11. Missing Baseline Truthful Uncertainty
  // -----------------------------------------------------------------
  await it("Test 11: Missing baseline produces empty insights gracefully without inventing values", () => {
    const insights = generateFinancialInsights(null, null, []);
    assertStrictEqual(insights.length, 0, "Zero fabricated insights when input is null");
  });

  console.log("\n=================================================");
  console.log(`Results: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);
  console.log("=================================================\n");

  if (failCount > 0) {
    throw new Error(`${failCount} test(s) failed in activity and overview test suite.`);
  }
}

runTests();
