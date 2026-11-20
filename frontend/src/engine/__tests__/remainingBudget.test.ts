// =====================================================================
// FLOVA Financial Engine — Option A: Remaining Daily Budget Tests (M3)
// =====================================================================

import {
  assertStrictEqual,
  describe,
  it,
} from "./testUtils";
import { calculateConfirmedBalance } from "../balance";
import { calculateDailyRunway } from "../runway";
import type { RunwayProjectionInput } from "../runway";

describe("Option A: Remaining Daily Budget & Current-Day Regression Suite", () => {
  const profileStandard = {
    workProfile: "delivery" as const,
    payoutPattern: "weekly" as const,
    dailyLivingEstimate: 20000, // ₹200 (20,000 paise)
    dailyWorkEstimate: 10000,   // ₹100 (10,000 paise) -> Total ₹300/day
  };

  it("Historical Ravi Fixture: preserves historical Thursday check-in and Friday-start calculation", () => {
    // Thursday 19 Nov 2026 checkin: Cash 1500, Bank 2500, COD 600 -> Starting personal: 3,400
    // Thursday transactions:
    //   - Income 650 (at 12:00)
    //   - Expense 120 fuel (at 14:00, Work)
    // Profile: Living 200, Work 100
    // Commitment: 4500 rent due Saturday 21 Nov
    // Payout: 1800 scheduled Monday 23 Nov
    // Projection starts Friday 20 Nov.
    // The ₹120 expense occurred Thursday. It must not reduce Friday's daily budget!
    const input: RunwayProjectionInput = {
      profile: profileStandard,
      latestCheckin: {
        cash: 150000,
        bank: 250000,
        notMine: 60000,
        checkedAt: "2026-11-19T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-income-thu",
          type: "income",
          amount: 65000,
          ownership: "mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-19",
          createdAt: "2026-11-19T12:00:00Z",
        },
        {
          id: "tx-fuel-thu",
          type: "expense",
          amount: 12000, // ₹120 fuel
          ownership: "mine",
          expenseType: "work",
          payoutId: null,
          date: "2026-11-19",
          createdAt: "2026-11-19T14:00:00Z",
        },
      ],
      commitments: [
        {
          id: "comm-rent",
          title: "Rent",
          amount: 450000, // ₹4,500
          dueDate: "2026-11-21", // Saturday
          kind: "bill",
        },
      ],
      payouts: [
        {
          id: "payout-mon",
          kind: "platform_payout",
          expected: 180000, // ₹1,800
          received: 0,
          expectedDate: "2026-11-23", // Monday
          status: "scheduled",
        },
      ],
      horizonDays: 7,
      startDate: "2026-11-20", // Friday
    };

    const res = calculateDailyRunway(input);
    assertStrictEqual(res.status, "PROJECTED");

    // 1. Confirmed balance: 340,000 + 65,000 - 12,000 = 393,000 paise (₹3,930)
    assertStrictEqual(res.startingConfirmedBalancePaise, 393000);

    // 2. Day 0 (Friday 2026-11-20): Thursday's ₹120 fuel does NOT reduce Friday's budget!
    // Full ₹300 (30,000 paise) essential expense applies.
    assertStrictEqual(res.projections[0].date, "2026-11-20");
    assertStrictEqual(res.projections[0].openingBalancePaise, 393000);
    assertStrictEqual(res.projections[0].essentialExpensePaise, 30000);
    assertStrictEqual(res.projections[0].closingBalancePaise, 363000); // ₹3,630

    // 3. Day 1 (Saturday 2026-11-21):
    // Opening: 363,000 - Daily burn: 30,000 - Rent: 450,000 = -117,000 paise (-₹1,170)
    assertStrictEqual(res.projections[1].date, "2026-11-21");
    assertStrictEqual(res.projections[1].openingBalancePaise, 363000);
    assertStrictEqual(res.projections[1].essentialExpensePaise, 30000);
    assertStrictEqual(res.projections[1].commitmentDeductionPaise, 450000);
    assertStrictEqual(res.projections[1].closingBalancePaise, -117000); // -₹1,170

    // 4. First shortfall date: Saturday 2026-11-21
    assertStrictEqual(res.firstShortfallDate, "2026-11-21");
    assertStrictEqual(res.runwayDays, 1);

    // 5. Monday payout (₹1,800) is strictly excluded from cash flow projection
    const mondayProj = res.projections.find((p) => p.date === "2026-11-23");
    assertStrictEqual(mondayProj?.otherTransactionAdjustmentPaise, 0);
  });

  it("Test A: Work budget already exceeded (fuel ₹120 against ₹100 work estimate)", () => {
    // Living estimate: ₹200 (20,000 paise)
    // Work estimate: ₹100 (10,000 paise)
    // Today's living: ₹0
    // Today's work: ₹120 (12,000 paise)
    // Confirmed balance: ₹3,930 (393,000 paise)
    // Expected today's closing: ₹3,930 - ₹200 = ₹3,730 (373,000 paise)
    const input: RunwayProjectionInput = {
      profile: profileStandard,
      latestCheckin: {
        cash: 200000,
        bank: 205000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-fuel-today",
          type: "expense",
          amount: 12000, // ₹120
          ownership: "mine",
          expenseType: "work",
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T10:00:00Z", // after check-in: 405k - 12k = 393k
        },
      ],
      payouts: [],
      commitments: [],
      horizonDays: 3,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    assertStrictEqual(res.startingConfirmedBalancePaise, 393000);

    // Remaining living: 20,000 - 0 = 20,000
    // Remaining work: Math.max(0, 10,000 - 12,000) = 0
    // Remaining daily budget = 20,000
    assertStrictEqual(res.projections[0].essentialExpensePaise, 20000);
    assertStrictEqual(res.projections[0].remainingLivingBudgetPaise, 20000);
    assertStrictEqual(res.projections[0].remainingWorkBudgetPaise, 0);
    assertStrictEqual(res.projections[0].closingBalancePaise, 373000);
  });

  it("Test B: Partial category consumption", () => {
    // Living estimate: ₹200 (20,000 paise)
    // Work estimate: ₹100 (10,000 paise)
    // Today's living expenses: ₹50 (5,000 paise)
    // Today's work expenses: ₹40 (4,000 paise)
    // Remaining living: ₹150 (15,000 paise)
    // Remaining work: ₹60 (6,000 paise)
    // Total remaining: ₹210 (21,000 paise)
    const input: RunwayProjectionInput = {
      profile: profileStandard,
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-food-today",
          type: "expense",
          amount: 5000, // ₹50
          ownership: "mine",
          expenseType: "living",
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T09:00:00Z",
        },
        {
          id: "tx-petrol-today",
          type: "expense",
          amount: 4000, // ₹40
          ownership: "mine",
          expenseType: "work",
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T11:00:00Z",
        },
      ],
      payouts: [],
      commitments: [],
      horizonDays: 2,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    // Starting balance: 200,000 - 5,000 - 4,000 = 191,000 paise
    assertStrictEqual(res.startingConfirmedBalancePaise, 191000);
    assertStrictEqual(res.projections[0].remainingLivingBudgetPaise, 15000);
    assertStrictEqual(res.projections[0].remainingWorkBudgetPaise, 6000);
    assertStrictEqual(res.projections[0].essentialExpensePaise, 21000);
    assertStrictEqual(res.projections[0].closingBalancePaise, 170000); // 191k - 21k = 170k (200k - 30k)
  });

  it("Test C: Both budgets exhausted", () => {
    // Living estimate: ₹200 (20,000 paise)
    // Work estimate: ₹100 (10,000 paise)
    // Today's living expenses: ₹250 (25,000 paise)
    // Today's work expenses: ₹150 (15,000 paise)
    // Remaining daily budget: ₹0
    const input: RunwayProjectionInput = {
      profile: profileStandard,
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-big-living",
          type: "expense",
          amount: 25000, // ₹250
          ownership: "mine",
          expenseType: "living",
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T10:00:00Z",
        },
        {
          id: "tx-big-work",
          type: "expense",
          amount: 15000, // ₹150
          ownership: "mine",
          expenseType: "work",
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T12:00:00Z",
        },
      ],
      payouts: [],
      commitments: [],
      horizonDays: 2,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    // Starting balance: 200k - 25k - 15k = 160,000 paise
    assertStrictEqual(res.startingConfirmedBalancePaise, 160000);
    assertStrictEqual(res.projections[0].remainingLivingBudgetPaise, 0);
    assertStrictEqual(res.projections[0].remainingWorkBudgetPaise, 0);
    assertStrictEqual(res.projections[0].essentialExpensePaise, 0);
    // Closing balance Day 0 equals opening balance since budget is 0
    assertStrictEqual(res.projections[0].closingBalancePaise, 160000);
  });

  it("Test D: Previous-day expenses must not reduce today's remaining budget", () => {
    // Yesterday: 2026-11-19
    // Today: 2026-11-20
    const input: RunwayProjectionInput = {
      profile: profileStandard,
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 0,
        checkedAt: "2026-11-19T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-yesterday-living",
          type: "expense",
          amount: 20000, // ₹200 yesterday
          ownership: "mine",
          expenseType: "living",
          payoutId: null,
          date: "2026-11-19",
          createdAt: "2026-11-19T10:00:00Z",
        },
        {
          id: "tx-yesterday-work",
          type: "expense",
          amount: 10000, // ₹100 yesterday
          ownership: "mine",
          expenseType: "work",
          payoutId: null,
          date: "2026-11-19",
          createdAt: "2026-11-19T14:00:00Z",
        },
      ],
      payouts: [],
      commitments: [],
      horizonDays: 2,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    // Today (2026-11-20) has no recorded expenses -> full daily budget applies
    assertStrictEqual(res.projections[0].essentialExpensePaise, 30000);
    assertStrictEqual(res.projections[0].remainingLivingBudgetPaise, 20000);
    assertStrictEqual(res.projections[0].remainingWorkBudgetPaise, 10000);
  });

  it("Test E: Expenses before check-in consume today's budget without being deducted from confirmed balance", () => {
    // Checkin at 08:00 today: Cash ₹2,000, Bank ₹2,000 -> Confirmed ₹4,000 (400,000 paise)
    // Expense recorded at 07:00 today: ₹40 work (4,000 paise)
    const input: RunwayProjectionInput = {
      profile: profileStandard,
      latestCheckin: {
        cash: 200000,
        bank: 200000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-morning-pre-checkin",
          type: "expense",
          amount: 4000, // ₹40 work
          ownership: "mine",
          expenseType: "work",
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T07:00:00Z", // BEFORE check-in
        },
      ],
      payouts: [],
      commitments: [],
      horizonDays: 2,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    // Confirmed balance is NOT reduced by pre-checkin transaction (already in physical checkin count)
    assertStrictEqual(res.startingConfirmedBalancePaise, 400000);
    // But today's budget allocation IS consumed:
    // Remaining living = 20,000 (₹200)
    // Remaining work = 10,000 - 4,000 = 6,000 (₹60)
    // Total remaining budget = 26,000 (₹260)
    assertStrictEqual(res.projections[0].remainingLivingBudgetPaise, 20000);
    assertStrictEqual(res.projections[0].remainingWorkBudgetPaise, 6000);
    assertStrictEqual(res.projections[0].essentialExpensePaise, 26000);
    // Day 0 closing: 400,000 - 26,000 = 374,000 paise (₹3,740)
    assertStrictEqual(res.projections[0].closingBalancePaise, 374000);
  });

  it("Test F: Expenses after check-in adjust confirmed balance and consume budget without double-deduction", () => {
    // Checkin at 08:00 today: Cash ₹2,000, Bank ₹2,000 -> 400,000 paise
    // Expense recorded at 09:00 today: ₹40 work (4,000 paise)
    const input: RunwayProjectionInput = {
      profile: profileStandard,
      latestCheckin: {
        cash: 200000,
        bank: 200000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-post-checkin",
          type: "expense",
          amount: 4000, // ₹40 work
          ownership: "mine",
          expenseType: "work",
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T09:00:00Z", // AFTER check-in
        },
      ],
      payouts: [],
      commitments: [],
      horizonDays: 2,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    // 1. Confirmed balance reflects the spent ₹40: 400k - 4k = 396,000 paise (₹3,960)
    assertStrictEqual(res.startingConfirmedBalancePaise, 396000);
    // 2. Budget consumption: remaining living = 20,000, remaining work = 6,000 -> Total = 26,000 (₹260)
    assertStrictEqual(res.projections[0].essentialExpensePaise, 26000);
    // 3. Closing balance: 396,000 - 26,000 = 370,000 paise (₹3,700)
    // The ₹40 was NOT deducted twice (total daily reduction: 4k + 26k = 30k full daily estimate)
    assertStrictEqual(res.projections[0].closingBalancePaise, 370000);
  });

  it("Test G: Non-owned transactions (not_mine) must not consume personal living or work budgets", () => {
    // Checkin: Cash ₹1,000, Bank ₹1,000, notMine ₹500 (COD liability)
    // Starting personal balance: (1,000 + 1,000) - 500 = ₹1,500 (150,000 paise)
    // Starting custodial liability: ₹500 (50,000 paise)
    const baseInput: RunwayProjectionInput = {
      profile: profileStandard,
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 50000, // ₹500 COD liability
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [],
      horizonDays: 2,
      startDate: "2026-11-20",
    };

    // 1. Verify baseline state before remittance or collection
    const balanceBefore = calculateConfirmedBalance(baseInput);
    assertStrictEqual(balanceBefore.confirmedBalancePaise, 150000); // ₹1,500 personal
    assertStrictEqual(balanceBefore.custodialOwedPaise, 50000);      // ₹500 custodial liability

    // 2. Case A: COD Remittance (expense, not_mine)
    // Rider remits ₹500 COD cash to platform
    const remittanceInput: RunwayProjectionInput = {
      ...baseInput,
      transactionsSinceCheckin: [
        {
          id: "tx-cod-remit",
          type: "expense",
          amount: 50000, // ₹500 COD remittance
          ownership: "not_mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T10:00:00Z",
        },
      ],
    };

    // Assertions for COD remittance:
    // a) Confirmed personal balance before and after remittance: strictly unchanged at 150,000 paise
    const balanceAfterRemit = calculateConfirmedBalance(remittanceInput);
    assertStrictEqual(balanceAfterRemit.confirmedBalancePaise, 150000);
    // b) Custodial liability before and after remittance: reduced from 50,000 to 0
    assertStrictEqual(balanceAfterRemit.custodialOwedPaise, 0);

    // c) No impact on personal Living / Work daily budgets
    const runwayRemit = calculateDailyRunway(remittanceInput);
    assertStrictEqual(runwayRemit.startingConfirmedBalancePaise, 150000);
    assertStrictEqual(runwayRemit.projections[0].remainingLivingBudgetPaise, 20000);
    assertStrictEqual(runwayRemit.projections[0].remainingWorkBudgetPaise, 10000);
    assertStrictEqual(runwayRemit.projections[0].essentialExpensePaise, 30000);
    assertStrictEqual(runwayRemit.projections[0].closingBalancePaise, 120000); // 150k - 30k

    // 3. Case B: COD Collection (income, not_mine)
    // Rider collects ₹800 COD cash from delivery customer
    const collectionInput: RunwayProjectionInput = {
      ...baseInput,
      transactionsSinceCheckin: [
        {
          id: "tx-cod-collect",
          type: "income",
          amount: 80000, // ₹800 COD collected
          ownership: "not_mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T11:00:00Z",
        },
      ],
    };

    // Assertions for COD collection:
    // a) Confirmed personal balance before and after collection: strictly unchanged at 150,000 paise
    const balanceAfterCollect = calculateConfirmedBalance(collectionInput);
    assertStrictEqual(balanceAfterCollect.confirmedBalancePaise, 150000);
    // b) Custodial liability before and after collection: increased from 50,000 to 130,000
    assertStrictEqual(balanceAfterCollect.custodialOwedPaise, 130000);

    // c) No impact on personal Living / Work daily budgets (income does not add to expense budget)
    const runwayCollect = calculateDailyRunway(collectionInput);
    assertStrictEqual(runwayCollect.startingConfirmedBalancePaise, 150000);
    assertStrictEqual(runwayCollect.projections[0].remainingLivingBudgetPaise, 20000);
    assertStrictEqual(runwayCollect.projections[0].remainingWorkBudgetPaise, 10000);
    assertStrictEqual(runwayCollect.projections[0].essentialExpensePaise, 30000);
    assertStrictEqual(runwayCollect.projections[0].closingBalancePaise, 120000); // 150k - 30k
  });

  it("Test H: Future days apply full daily estimates even if Day 0 budget was consumed", () => {
    // Today: ₹120 work expense consumes the ₹100 work budget (clamped to 0)
    const input: RunwayProjectionInput = {
      profile: profileStandard, // ₹200 living, ₹100 work -> ₹300/day
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-fuel-today",
          type: "expense",
          amount: 12000, // ₹120 fuel
          ownership: "mine",
          expenseType: "work",
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T10:00:00Z",
        },
      ],
      payouts: [],
      commitments: [],
      horizonDays: 3,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    // Day 0 (Today): Remaining budget is ₹200 (living only, work is 0)
    assertStrictEqual(res.projections[0].essentialExpensePaise, 20000);

    // Day 1 (Tomorrow, 2026-11-21): Full ₹300 daily estimate must apply!
    assertStrictEqual(res.projections[1].date, "2026-11-21");
    assertStrictEqual(res.projections[1].essentialExpensePaise, 30000);

    // Day 2 (Day after tomorrow, 2026-11-22): Full ₹300 daily estimate must apply!
    assertStrictEqual(res.projections[2].date, "2026-11-22");
    assertStrictEqual(res.projections[2].essentialExpensePaise, 30000);
  });

  it("Test I: Missing daily estimates continue to produce INSUFFICIENT_INFORMATION", () => {
    const inputNullLiving: RunwayProjectionInput = {
      profile: {
        ...profileStandard,
        dailyLivingEstimate: null,
      },
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [],
    };

    const res1 = calculateDailyRunway(inputNullLiving);
    assertStrictEqual(res1.status, "INSUFFICIENT_INFORMATION");
    assertStrictEqual(res1.dailyEssentialExpensePaise, null);

    const inputNullWork: RunwayProjectionInput = {
      profile: {
        ...profileStandard,
        dailyWorkEstimate: null,
      },
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [],
    };

    const res2 = calculateDailyRunway(inputNullWork);
    assertStrictEqual(res2.status, "INSUFFICIENT_INFORMATION");
    assertStrictEqual(res2.dailyEssentialExpensePaise, null);
  });
});
