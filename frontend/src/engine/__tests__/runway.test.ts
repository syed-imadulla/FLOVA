import {
  assertMatch,
  assertStrictEqual,
  assertThrows,
  describe,
  it,
} from "./testUtils";
import { calculateDailyRunway } from "../runway";
import type { RunwayProjectionInput } from "../runway";

describe("Daily Runway Projection Engine Tests", () => {
  const baseProfile: RunwayProjectionInput["profile"] = {
    workProfile: "delivery",
    payoutPattern: "weekly",
    dailyLivingEstimate: 25000, // ₹250/day
    dailyWorkEstimate: 15000,   // ₹150/day -> Total ₹400/day (40,000 paise)
  };

  it("1. projects cash flow correctly across multiple days", () => {
    // Starting balance: ₹2,000 (200,000 paise)
    // Daily burn: ₹400 (40,000 paise)
    // 5-day horizon
    const input: RunwayProjectionInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [],
      horizonDays: 5,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    assertStrictEqual(res.status, "PROJECTED");
    assertStrictEqual(res.startingConfirmedBalancePaise, 200000);
    assertStrictEqual(res.dailyEssentialExpensePaise, 40000);
    assertStrictEqual(res.projections.length, 5);

    // Day 0: 200,000 - 40,000 = 160,000
    assertStrictEqual(res.projections[0].openingBalancePaise, 200000);
    assertStrictEqual(res.projections[0].closingBalancePaise, 160000);
    assertStrictEqual(res.projections[0].date, "2026-11-20");

    // Day 1: 160,000 - 40,000 = 120,000
    assertStrictEqual(res.projections[1].openingBalancePaise, 160000);
    assertStrictEqual(res.projections[1].closingBalancePaise, 120000);
    assertStrictEqual(res.projections[1].date, "2026-11-21");

    // Day 4: 80,000 - 40,000 = 40,000
    assertStrictEqual(res.projections[4].closingBalancePaise, 0);
  });

  it("2. deducts essential daily expenses (living + work) each day", () => {
    const input: RunwayProjectionInput = {
      profile: {
        ...baseProfile,
        dailyLivingEstimate: 30000, // ₹300
        dailyWorkEstimate: 20000,   // ₹200 -> ₹500/day (50,000 paise)
      },
      latestCheckin: {
        cash: 50000,
        bank: 100000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [],
      horizonDays: 2,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    assertStrictEqual(res.dailyEssentialExpensePaise, 50000);
    assertStrictEqual(res.projections[0].closingBalancePaise, 100000); // 150k - 50k
    assertStrictEqual(res.projections[1].closingBalancePaise, 50000);  // 100k - 50k
  });

  it("3. deducts commitments on their due date exactly once", () => {
    // Starting balance: ₹3,000 (300,000 paise)
    // Daily burn: ₹200 (20,000 paise)
    // Bike EMI: ₹1,500 (150,000 paise) due on 2026-11-22 (Day 2)
    const input: RunwayProjectionInput = {
      profile: {
        ...baseProfile,
        dailyLivingEstimate: 10000,
        dailyWorkEstimate: 10000, // 20,000 paise/day
      },
      latestCheckin: {
        cash: 100000,
        bank: 200000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [
        {
          id: "comm-1",
          title: "Bike EMI",
          amount: 150000,
          dueDate: "2026-11-22",
          kind: "debt",
        },
      ],
      horizonDays: 4,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    // Day 0: 300k - 20k = 280,000
    assertStrictEqual(res.projections[0].closingBalancePaise, 280000);
    assertStrictEqual(res.projections[0].commitmentDeductionPaise, 0);

    // Day 1: 280k - 20k = 260,000
    assertStrictEqual(res.projections[1].closingBalancePaise, 260000);
    assertStrictEqual(res.projections[1].commitmentDeductionPaise, 0);

    // Day 2 (Due Date): 260k - 20k (daily) - 150k (EMI) = 90,000
    assertStrictEqual(res.projections[2].closingBalancePaise, 90000);
    assertStrictEqual(res.projections[2].commitmentDeductionPaise, 150000);
    assertStrictEqual(res.projections[2].commitmentsApplied.length, 1);
    assertStrictEqual(res.projections[2].commitmentsApplied[0].title, "Bike EMI");

    // Day 3: 90k - 20k = 70,000 (Commitment is NOT deducted again!)
    assertStrictEqual(res.projections[3].closingBalancePaise, 70000);
    assertStrictEqual(res.projections[3].commitmentDeductionPaise, 0);
  });

  it("4. preserves negative closing balance without clamping to zero", () => {
    // Starting balance: ₹1,000 (100,000 paise)
    // Daily burn: ₹400 (40,000 paise)
    // Day 0: 100k - 40k = 60,000
    // Day 1: 60k - 40k = 20,000
    // Day 2: 20k - 40k = -20,000 (Negative balance must be preserved!)
    const input: RunwayProjectionInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 50000,
        bank: 50000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [],
      horizonDays: 4,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    assertStrictEqual(res.projections[2].closingBalancePaise, -20000);
    assertStrictEqual(res.projections[3].openingBalancePaise, -20000);
    assertStrictEqual(res.projections[3].closingBalancePaise, -60000);
    assertStrictEqual(res.minClosingBalancePaise, -60000);
  });

  it("5. identifies the correct first shortfall date", () => {
    const input: RunwayProjectionInput = {
      profile: baseProfile, // ₹400/day
      latestCheckin: {
        cash: 50000,
        bank: 50000, // ₹1,000 total
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [],
      horizonDays: 5,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    // Day 0: 60k
    // Day 1: 20k
    // Day 2: -20k (2026-11-22) -> First shortfall date!
    assertStrictEqual(res.firstShortfallDate, "2026-11-22");
    // Covered days before shortfall: Day 0 and Day 1 = 2 days
    assertStrictEqual(res.runwayDays, 2);
  });

  it("6. identifies the correct zero-balance date (reaches <= 0)", () => {
    // Starting balance: ₹800 (80,000 paise)
    // Daily burn: ₹400 (40,000 paise)
    // Day 0: 80k - 40k = 40,000
    // Day 1: 40k - 40k = 0 (Reaches exactly zero on 2026-11-21)
    // Day 2: 0 - 40k = -40,000 (Shortfall on 2026-11-22)
    const input: RunwayProjectionInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 40000,
        bank: 40000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [],
      horizonDays: 4,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    assertStrictEqual(res.projectedZeroBalanceDate, "2026-11-21");
    assertStrictEqual(res.firstShortfallDate, "2026-11-22");
    assertStrictEqual(res.runwayDays, 2);
  });

  it("7. returns null shortfall date and full horizon when no shortfall occurs", () => {
    // Starting balance: ₹50,000 (5,000,000 paise)
    // Daily burn: ₹400 (40,000 paise) -> 10 days = 400,000 paise
    const input: RunwayProjectionInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 2500000,
        bank: 2500000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [],
      horizonDays: 10,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    assertStrictEqual(res.firstShortfallDate, null);
    assertStrictEqual(res.projectedZeroBalanceDate, null);
    assertStrictEqual(res.runwayDays, 10);
    assertStrictEqual(res.projections[9].closingBalancePaise, 4600000);
  });

  it("8. returns INSUFFICIENT_INFORMATION when balance check-in is missing", () => {
    const input: RunwayProjectionInput = {
      profile: baseProfile,
      latestCheckin: null,
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [],
      horizonDays: 10,
    };

    const res = calculateDailyRunway(input);
    assertStrictEqual(res.status, "INSUFFICIENT_INFORMATION");
    assertStrictEqual(res.runwayDays, null);
    assertStrictEqual(res.firstShortfallDate, null);
    assertStrictEqual(res.projections.length, 0);
    assertMatch(res.reason!, /No balance check-in found/);
  });

  it("9. returns INSUFFICIENT_INFORMATION when daily expense baseline is missing (null)", () => {
    const input: RunwayProjectionInput = {
      profile: {
        ...baseProfile,
        dailyLivingEstimate: null, // missing estimate!
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
      horizonDays: 10,
    };

    const res = calculateDailyRunway(input);
    assertStrictEqual(res.status, "INSUFFICIENT_INFORMATION");
    assertStrictEqual(res.dailyEssentialExpensePaise, null);
    assertStrictEqual(res.runwayDays, null);
    assertMatch(res.reason!, /Missing daily expense baseline/);
  });

  it("10. excludes pending income transactions from starting balance and projections", () => {
    // In FLOVA architecture, transactions created <= checkedAt were already reflected in the check-in count
    const input: RunwayProjectionInput = {
      profile: baseProfile, // ₹400/day
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-pending",
          type: "income",
          amount: 500000, // ₹5,000 pending
          ownership: "mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T07:00:00Z", // created before checkedAt
        },
      ],
      payouts: [],
      commitments: [],
      horizonDays: 2,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    // Starting balance remains 200,000 (not 700,000)
    assertStrictEqual(res.startingConfirmedBalancePaise, 200000);
    assertStrictEqual(res.projections[0].closingBalancePaise, 160000);
  });

  it("11. excludes expected / scheduled payouts from confirmed runway", () => {
    // Expected ₹4,000 payout scheduled on Day 1
    const input: RunwayProjectionInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 50000,
        bank: 50000, // ₹1,000
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [
        {
          id: "p-sched",
          kind: "platform_payout",
          expected: 400000, // ₹4,000
          received: 0,
          expectedDate: "2026-11-21",
          status: "scheduled",
        },
      ],
      commitments: [],
      horizonDays: 4,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    // The expected payout is NOT credited on Day 1!
    // Day 0: 60k
    // Day 1: 20k
    // Day 2: -20k
    assertStrictEqual(res.firstShortfallDate, "2026-11-22");
    assertStrictEqual(res.runwayDays, 2);
  });

  it("12. excludes custodial/COD money from confirmed runway", () => {
    // Rider holds ₹1,000 cash, ₹1,000 bank, but ₹800 is custodial COD cash
    const input: RunwayProjectionInput = {
      profile: baseProfile, // ₹400/day
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 80000, // ₹800 COD liability
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [],
      horizonDays: 4,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    // Starting personal liquid balance: 200k - 80k = 120,000 paise (₹1,200)
    assertStrictEqual(res.startingConfirmedBalancePaise, 120000);
    // Day 0: 120k - 40k = 80k
    // Day 1: 80k - 40k = 40k
    // Day 2: 40k - 40k = 0 (Zero balance date)
    // Day 3: 0 - 40k = -40k (Shortfall on 2026-11-23)
    assertStrictEqual(res.projectedZeroBalanceDate, "2026-11-22");
    assertStrictEqual(res.firstShortfallDate, "2026-11-23");
    assertStrictEqual(res.runwayDays, 3);
  });

  it("13. prevents double counting of transactions already included in starting check-in", () => {
    const input: RunwayProjectionInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-morning",
          type: "expense",
          amount: 50000,
          ownership: "mine",
          expenseType: "living",
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T06:00:00Z", // before checkedAt
        },
      ],
      payouts: [],
      commitments: [],
      horizonDays: 2,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    // Starting balance is 200,000. tx-morning was already counted in the physical checkin count.
    assertStrictEqual(res.startingConfirmedBalancePaise, 200000);
  });

  it("14. rejects unsafe integer arithmetic", () => {
    const input: RunwayProjectionInput = {
      profile: {
        ...baseProfile,
        dailyLivingEstimate: Number.MAX_SAFE_INTEGER,
        dailyWorkEstimate: 10000,
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

    assertThrows(() => {
      calculateDailyRunway(input);
    }, /Integer overflow/);
  });

  it("15. prevents double-counting between daily baseline expenses and individual expense transactions", () => {
    // Verified transaction created after checkedAt
    const input: RunwayProjectionInput = {
      profile: baseProfile, // ₹400/day baseline
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-afternoon",
          type: "expense",
          amount: 20000, // ₹200 petrol expense today
          ownership: "mine",
          expenseType: "work",
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T14:00:00Z",
        },
      ],
      payouts: [],
      commitments: [],
      horizonDays: 3,
      startDate: "2026-11-20",
    };

    const res = calculateDailyRunway(input);
    // Starting personal balance correctly reflects: 200k - 20k = 180,000 paise.
    assertStrictEqual(res.startingConfirmedBalancePaise, 180000);
    // Under Option A (Remaining Daily Budget):
    // Petrol expense (20,000 paise) consumed the 15,000 work budget (clamped to 0).
    // Remaining living budget is 25,000 paise. Day 0 essential expense = 25,000.
    // Day 0 closing: 180,000 - 25,000 = 155,000 paise.
    assertStrictEqual(res.projections[0].openingBalancePaise, 180000);
    assertStrictEqual(res.projections[0].essentialExpensePaise, 25000);
    assertStrictEqual(res.projections[0].otherTransactionAdjustmentPaise, 0);
    assertStrictEqual(res.projections[0].closingBalancePaise, 155000);
    // Day 1 (tomorrow) applies the full forward baseline (40k): 155,000 - 40,000 = 115,000.
    assertStrictEqual(res.projections[1].essentialExpensePaise, 40000);
    assertStrictEqual(res.projections[1].closingBalancePaise, 115000);
  });
});
