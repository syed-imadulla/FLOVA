import {
  assertMatch,
  assertStrictEqual,
  assertThrows,
  describe,
  it,
} from "./testUtils";
import { calculateConfirmedBalance } from "../balance";
import { calculateDailyRunway } from "../runway";
import { validatePayout } from "../validation";
import type { RunwayInput } from "../../types/contracts";

const baseProfile: RunwayInput["profile"] = {
  workProfile: "delivery",
  payoutPattern: "weekly",
  dailyLivingEstimate: 20000, // ₹200
  dailyWorkEstimate: 10000,   // ₹100 -> ₹300/day
};

describe("Payout and COD Lifecycle Unit Tests (Phase 3)", () => {
  // --------------------------------------------------------------------------
  // PAYOUT LIFECYCLE TESTS (1 - 8)
  // --------------------------------------------------------------------------

  it("1. expected payout is excluded from confirmed balance", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [
        {
          id: "p-exp",
          kind: "platform_payout",
          expected: 500000, // ₹5,000 expected
          received: 0,
          expectedDate: "2026-11-25",
          status: "estimated",
        },
      ],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    assertStrictEqual(res.status, "CONFIRMED");
    // Expected payout of 500k is NOT added
    assertStrictEqual(res.confirmedBalancePaise, 200000);
  });

  it("2. scheduled payout is excluded from confirmed balance", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 50000,
        bank: 50000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [
        {
          id: "p-sched",
          kind: "platform_payout",
          expected: 350000, // ₹3,500 scheduled for Wednesday
          received: 0,
          expectedDate: "2026-11-26",
          status: "scheduled",
        },
      ],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    assertStrictEqual(res.status, "CONFIRMED");
    assertStrictEqual(res.confirmedBalancePaise, 100000);
  });

  it("3. partially received payout counts only actual received amount", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-part",
          type: "income",
          amount: 150000, // ₹1,500 received so far
          ownership: "mine",
          expenseType: null,
          payoutId: "p-part",
          date: "2026-11-20",
          createdAt: "2026-11-20T11:00:00Z",
        },
      ],
      payouts: [
        {
          id: "p-part",
          kind: "platform_payout",
          expected: 400000, // ₹4,000 expected
          received: 150000, // ₹1,500 received
          expectedDate: "2026-11-20",
          status: "partial",
        },
      ],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    assertStrictEqual(res.status, "CONFIRMED");
    // 200,000 starting + 150,000 received = 350,000 paise (₹3,500). Unreceived 250k is NOT added!
    assertStrictEqual(res.confirmedBalancePaise, 350000);
  });

  it("4. fully received payout counts exactly once", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-full",
          type: "income",
          amount: 300000,
          ownership: "mine",
          expenseType: null,
          payoutId: "p-full",
          date: "2026-11-20",
          createdAt: "2026-11-20T12:00:00Z",
        },
      ],
      payouts: [
        {
          id: "p-full",
          kind: "platform_payout",
          expected: 300000,
          received: 300000,
          expectedDate: "2026-11-20",
          status: "settled",
        },
      ],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    assertStrictEqual(res.status, "CONFIRMED");
    // 200,000 starting + 300,000 payout = 500,000 paise
    assertStrictEqual(res.confirmedBalancePaise, 500000);
  });

  it("5. linked payout transaction is not double-counted with payout record", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 50000,
        bank: 50000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-linked",
          type: "income",
          amount: 250000,
          ownership: "mine",
          expenseType: null,
          payoutId: "p-linked",
          date: "2026-11-20",
          createdAt: "2026-11-20T10:00:00Z",
        },
      ],
      payouts: [
        {
          id: "p-linked",
          kind: "platform_payout",
          expected: 250000,
          received: 250000,
          expectedDate: "2026-11-20",
          status: "settled",
        },
      ],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    // Must be 100k + 250k = 350,000. NOT 100k + 250k + 250k = 600,000!
    assertStrictEqual(res.confirmedBalancePaise, 350000);
  });

  it("6. cancelled payout is excluded from confirmed balance and runway", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [
        {
          id: "p-cancelled",
          kind: "platform_payout",
          expected: 600000,
          received: 0,
          expectedDate: "2026-11-21",
          status: "cancelled",
        },
      ],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    assertStrictEqual(res.status, "CONFIRMED");
    assertStrictEqual(res.confirmedBalancePaise, 200000);
  });

  it("7. invalid received amount is rejected", () => {
    const pValidation = validatePayout({
      id: "p-bad-received",
      kind: "platform_payout",
      expected: 500000,
      received: -5000 as unknown as number, // negative paise
      expectedDate: "2026-11-20",
      status: "partial",
    });
    assertStrictEqual(pValidation.valid, false);
    assertMatch(pValidation.errors[0], /invalid received amount/);
  });

  it("8. received amount exceeding expected amount is rejected", () => {
    const pValidation = validatePayout({
      id: "p-excess",
      kind: "platform_payout",
      expected: 300000,
      received: 450000, // 450k > 300k
      expectedDate: "2026-11-20",
      status: "settled",
    });
    assertStrictEqual(pValidation.valid, false);
    assertMatch(pValidation.errors[0], /received amount \(450000\) exceeds expected amount/);
  });

  // --------------------------------------------------------------------------
  // COD & CUSTODIAL LIABILITY TESTS (9 - 17)
  // --------------------------------------------------------------------------

  it("9. COD collection does not increase personal balance", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-cod-collect",
          type: "income",
          amount: 250000, // ₹2,500 COD collected
          ownership: "not_mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T14:00:00Z",
        },
      ],
      payouts: [],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    // Personal balance remains 200,000 (not 450,000)
    assertStrictEqual(res.confirmedBalancePaise, 200000);
  });

  it("10. COD collection increases custodial liability", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 50000, // Initial ₹500 COD
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-cod-2",
          type: "income",
          amount: 150000, // ₹1,500 additional COD collected
          ownership: "not_mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T15:00:00Z",
        },
      ],
      payouts: [],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    // Liability increases from 50k to 200k (50k + 150k)
    assertStrictEqual(res.custodialOwedPaise, 200000);
    // Personal balance is unaffected: (100k + 100k) - 50k = 150,000
    assertStrictEqual(res.confirmedBalancePaise, 150000);
  });

  it("11. partial remittance reduces custodial liability correctly", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 200000,
        bank: 100000,
        notMine: 150000, // ₹1,500 COD liability
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-remit-part",
          type: "expense",
          amount: 60000, // ₹600 remitted via UPI to platform
          ownership: "not_mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T16:00:00Z",
        },
      ],
      payouts: [],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    // Liability reduced from 150k to 90k (150k - 60k)
    assertStrictEqual(res.custodialOwedPaise, 90000);
    // Personal starting balance remains 150k ((200k + 100k) - 150k)
    assertStrictEqual(res.confirmedBalancePaise, 150000);
  });

  it("12. full remittance clears the corresponding custodial liability", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 200000,
        bank: 100000,
        notMine: 150000, // ₹1,500 COD liability
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-remit-full",
          type: "expense",
          amount: 150000, // Exactly ₹1,500 remitted
          ownership: "not_mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T17:00:00Z",
        },
      ],
      payouts: [],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    // Custodial liability completely cleared to 0
    assertStrictEqual(res.custodialOwedPaise, 0);
    assertStrictEqual(res.confirmedBalancePaise, 150000);
  });

  it("13. remittance is not treated as personal income or expense", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 50000,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-remit",
          type: "expense",
          amount: 50000,
          ownership: "not_mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T12:00:00Z",
        },
      ],
      payouts: [],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    // Confirmed personal income & personal expense must remain 0
    assertStrictEqual(res.breakdown?.confirmedIncomePaise, 0);
    assertStrictEqual(res.breakdown?.confirmedExpensePaise, 0);
    assertStrictEqual(res.confirmedBalancePaise, 150000);
  });

  it("14. duplicate remittance transaction is not counted twice", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 80000,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-remit-dup",
          type: "expense",
          amount: 40000,
          ownership: "not_mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T12:00:00Z",
        },
        {
          id: "tx-remit-dup", // Same ID duplicated
          type: "expense",
          amount: 40000,
          ownership: "not_mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T12:00:00Z",
        },
      ],
      payouts: [],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    // Deduplication ensures 40k is deducted only once: 80k - 40k = 40k (not 0)
    assertStrictEqual(res.custodialOwedPaise, 40000);
  });

  it("15. worker settlement counts only confirmed personal money", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 50000,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        // Custodial COD collection
        {
          id: "tx-cod-in",
          type: "income",
          amount: 100000,
          ownership: "not_mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T10:00:00Z",
        },
        // Personal gig settlement
        {
          id: "tx-worker-earn",
          type: "income",
          amount: 75000, // ₹750 personal earnings
          ownership: "mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T11:00:00Z",
        },
      ],
      payouts: [],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    // Personal balance: 150k + 75k = 225,000 paise
    assertStrictEqual(res.confirmedBalancePaise, 225000);
    // Custodial liability: 50k + 100k = 150,000 paise
    assertStrictEqual(res.custodialOwedPaise, 150000);
  });

  it("16. invalid lifecycle transitions (remittance exceeding liability) are rejected", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 30000, // ₹300 liability
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-remit-excess",
          type: "expense",
          amount: 50000, // ₹500 remitted (exceeds 30k liability)
          ownership: "not_mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T14:00:00Z",
        },
      ],
      payouts: [],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    assertStrictEqual(res.status, "INVALID_INPUT");
    assertMatch(res.reason!, /exceeds outstanding custodial liability/);
  });

  it("17. unsafe integer arithmetic in custodial calculation is rejected", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: Number.MAX_SAFE_INTEGER,
        bank: 0,
        notMine: Number.MAX_SAFE_INTEGER,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-cod-overflow",
          type: "income",
          amount: 100000,
          ownership: "not_mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T12:00:00Z",
        },
      ],
      payouts: [],
      commitments: [],
    };

    assertThrows(() => {
      calculateConfirmedBalance(input);
    }, /Integer overflow/);
  });

  // --------------------------------------------------------------------------
  // REGRESSION TESTS (18 - 21)
  // --------------------------------------------------------------------------

  it("18. regression: calculateConfirmedBalance preserves basic personal cash flow", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 50000,
        bank: 150000,
        notMine: 20000,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-inc",
          type: "income",
          amount: 50000,
          ownership: "mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T10:00:00Z",
        },
        {
          id: "tx-exp",
          type: "expense",
          amount: 30000,
          ownership: "mine",
          expenseType: "living",
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T11:00:00Z",
        },
      ],
      payouts: [],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    // (50k + 150k) - 20k = 180k starting + 50k - 30k = 200,000 paise
    assertStrictEqual(res.confirmedBalancePaise, 200000);
  });

  it("19. regression: calculateDailyRunway calculates correct runway days and shortfall", () => {
    const input: RunwayInput = {
      profile: {
        workProfile: "delivery",
        payoutPattern: "weekly",
        dailyLivingEstimate: 20000,
        dailyWorkEstimate: 10000, // ₹300/day
      },
      latestCheckin: {
        cash: 45000,
        bank: 45000, // ₹900 -> exactly 3 days
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [],
    };

    const res = calculateDailyRunway({ ...input, horizonDays: 5, startDate: "2026-11-20" });
    assertStrictEqual(res.status, "PROJECTED");
    assertStrictEqual(res.runwayDays, 3);
    assertStrictEqual(res.projectedZeroBalanceDate, "2026-11-22");
    assertStrictEqual(res.firstShortfallDate, "2026-11-23");
  });

  it("20. regression: expected payouts do not increase confirmed runway", () => {
    // 3 days of cash (90k paise), burn 30k/day
    // Large expected payout of ₹10,000 on Day 2
    const input: RunwayInput = {
      profile: {
        workProfile: "delivery",
        payoutPattern: "weekly",
        dailyLivingEstimate: 20000,
        dailyWorkEstimate: 10000,
      },
      latestCheckin: {
        cash: 45000,
        bank: 45000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [
        {
          id: "p-huge-expected",
          kind: "platform_payout",
          expected: 1000000, // ₹10,000 expected
          received: 0,
          expectedDate: "2026-11-21",
          status: "scheduled",
        },
      ],
      commitments: [],
    };

    const res = calculateDailyRunway({ ...input, horizonDays: 5, startDate: "2026-11-20" });
    // Runway must NOT be extended by the unreceived payout!
    assertStrictEqual(res.runwayDays, 3);
    assertStrictEqual(res.firstShortfallDate, "2026-11-23");
  });

  it("21. regression: COD liabilities do not become personal available cash in runway", () => {
    // ₹1,000 cash, ₹1,000 bank, but ₹1,500 is COD liability
    // Personal starting balance = ₹500 (50,000 paise).
    // Burn ₹250/day (25,000 paise) -> 2 days runway.
    const input: RunwayInput = {
      profile: {
        workProfile: "delivery",
        payoutPattern: "weekly",
        dailyLivingEstimate: 15000,
        dailyWorkEstimate: 10000, // 25,000 paise/day
      },
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 150000, // ₹1,500 COD liability
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [],
    };

    const res = calculateDailyRunway({ ...input, horizonDays: 4, startDate: "2026-11-20" });
    assertStrictEqual(res.startingConfirmedBalancePaise, 50000);
    // Day 0: 50k - 25k = 25k
    // Day 1: 25k - 25k = 0 (Zero balance date)
    // Day 2: 0 - 25k = -25k (Shortfall date)
    assertStrictEqual(res.projectedZeroBalanceDate, "2026-11-21");
    assertStrictEqual(res.firstShortfallDate, "2026-11-22");
    assertStrictEqual(res.runwayDays, 2);
  });
});
