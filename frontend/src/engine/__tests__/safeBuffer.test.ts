import {
  assertStrictEqual,
  describe,
  it,
} from "./testUtils";
import { calculateDailyRunway } from "../runway";
import type { RunwayProjectionInput } from "../runway";

describe("Safe Runway Buffer Engine Integration Tests", () => {
  const baseProfile: RunwayProjectionInput["profile"] = {
    workProfile: "delivery",
    payoutPattern: "weekly",
    dailyLivingEstimate: 20000, // ₹200/day
    dailyWorkEstimate: 10000,   // ₹100/day -> Total ₹300/day (30,000 paise)
  };

  const createInput = (
    safeRunwayBuffer?: number | null,
    confirmedCash = 200000, // ₹2,000
    confirmedBank = 193000  // ₹1,930 -> Total ₹3,930 (393,000 paise)
  ): RunwayProjectionInput => ({
    profile: {
      ...baseProfile,
      safeRunwayBuffer,
    },
    latestCheckin: {
      cash: confirmedCash,
      bank: confirmedBank,
      notMine: 0,
      checkedAt: "2026-11-20T08:00:00Z",
    },
    transactionsSinceCheckin: [],
    payouts: [],
    commitments: [],
    horizonDays: 5,
    startDate: "2026-11-20",
  });

  it("1. zero buffer: spendable equals confirmed balance (₹3,930)", () => {
    const input = createInput(0);
    const res = calculateDailyRunway(input);

    assertStrictEqual(res.status, "PROJECTED");
    assertStrictEqual(res.startingConfirmedBalancePaise, 393000);
    assertStrictEqual(res.safeRunwayBufferPaise, 0);
    assertStrictEqual(res.startingSpendableBalancePaise, 393000);
  });

  it("2. null/undefined buffer: defaults cushion to 0 and spendable equals confirmed balance", () => {
    const inputNull = createInput(null);
    const resNull = calculateDailyRunway(inputNull);

    assertStrictEqual(resNull.status, "PROJECTED");
    assertStrictEqual(resNull.startingConfirmedBalancePaise, 393000);
    assertStrictEqual(resNull.safeRunwayBufferPaise, 0);
    assertStrictEqual(resNull.startingSpendableBalancePaise, 393000);

    const inputUndefined = createInput(undefined);
    const resUndef = calculateDailyRunway(inputUndefined);

    assertStrictEqual(resUndef.status, "PROJECTED");
    assertStrictEqual(resUndef.startingConfirmedBalancePaise, 393000);
    assertStrictEqual(resUndef.safeRunwayBufferPaise, 0);
    assertStrictEqual(resUndef.startingSpendableBalancePaise, 393000);
  });

  it("3. positive buffer within balance: reserves cushion without distorting confirmed balance", () => {
    // ₹1,000 buffer (100,000 paise) on ₹3,930 confirmed balance (393,000 paise)
    // Spendable should be ₹2,930 (293,000 paise)
    // Confirmed balance must remain strictly ₹3,930 (393,000 paise)
    const input = createInput(100000);
    const res = calculateDailyRunway(input);

    assertStrictEqual(res.status, "PROJECTED");
    assertStrictEqual(res.startingConfirmedBalancePaise, 393000);
    assertStrictEqual(res.safeRunwayBufferPaise, 100000);
    assertStrictEqual(res.startingSpendableBalancePaise, 293000);
  });

  it("4. buffer larger than balance: spendable clamped at 0, never negative, confirmed balance untouched", () => {
    // ₹5,000 buffer (500,000 paise) on ₹3,930 confirmed balance (393,000 paise)
    // Spendable must be 0 (never negative)
    // Confirmed balance must remain strictly ₹3,930 (393,000 paise)
    const input = createInput(500000);
    const res = calculateDailyRunway(input);

    assertStrictEqual(res.status, "PROJECTED");
    assertStrictEqual(res.startingConfirmedBalancePaise, 393000);
    assertStrictEqual(res.safeRunwayBufferPaise, 500000);
    assertStrictEqual(res.startingSpendableBalancePaise, 0);
  });

  it("5. exact boundary: buffer exactly equals balance, spendable is 0, confirmed balance untouched", () => {
    // ₹3,930 buffer (393,000 paise) on ₹3,930 confirmed balance
    const input = createInput(393000);
    const res = calculateDailyRunway(input);

    assertStrictEqual(res.status, "PROJECTED");
    assertStrictEqual(res.startingConfirmedBalancePaise, 393000);
    assertStrictEqual(res.safeRunwayBufferPaise, 393000);
    assertStrictEqual(res.startingSpendableBalancePaise, 0);
  });

  it("6. tracks buffer shortfall date when closing balance breaches cushion before cash runs out", () => {
    // Starting balance: ₹1,000 (100,000 paise)
    // Daily burn: ₹300 (30,000 paise)
    // Safe buffer: ₹500 (50,000 paise)
    // Day 0 (2026-11-20): 100,000 - 30,000 = 70,000 (above 50,000 cushion)
    // Day 1 (2026-11-21): 70,000 - 30,000 = 40,000 (BREACHES 50,000 cushion! Buffer shortfall!)
    // Day 2 (2026-11-22): 40,000 - 30,000 = 10,000 (still > 0 cash)
    // Day 3 (2026-11-23): 10,000 - 30,000 = -20,000 (Cash shortfall date!)
    const input: RunwayProjectionInput = {
      profile: {
        ...baseProfile,
        safeRunwayBuffer: 50000,
      },
      latestCheckin: {
        cash: 50000,
        bank: 50000,
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
    assertStrictEqual(res.startingConfirmedBalancePaise, 100000);
    assertStrictEqual(res.safeRunwayBufferPaise, 50000);
    assertStrictEqual(res.startingSpendableBalancePaise, 50000);
    assertStrictEqual(res.firstBufferShortfallDate, "2026-11-21");
    assertStrictEqual(res.firstShortfallDate, "2026-11-23");
  });

  it("7. projection entries correctly compute closingSpendableBalancePaise clamped to 0", () => {
    // Starting balance: ₹1,000 (100,000 paise), Buffer: ₹500 (50,000 paise), Burn: ₹300/day
    // Day 0: closing balance = 70,000 -> spendable = 20,000
    // Day 1: closing balance = 40,000 -> spendable = 0 (40,000 - 50,000 < 0 -> clamped to 0)
    // Day 2: closing balance = 10,000 -> spendable = 0
    // Day 3: closing balance = -20,000 -> spendable = 0
    const input: RunwayProjectionInput = {
      profile: {
        ...baseProfile,
        safeRunwayBuffer: 50000,
      },
      latestCheckin: {
        cash: 100000,
        bank: 0,
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
    assertStrictEqual(res.projections.length, 4);
    assertStrictEqual(res.projections[0].closingSpendableBalancePaise, 20000);
    assertStrictEqual(res.projections[1].closingSpendableBalancePaise, 0);
    assertStrictEqual(res.projections[2].closingSpendableBalancePaise, 0);
    assertStrictEqual(res.projections[3].closingSpendableBalancePaise, 0);
  });
});
