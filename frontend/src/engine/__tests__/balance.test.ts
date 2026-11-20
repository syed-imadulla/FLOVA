import {
  assertMatch,
  assertStrictEqual,
  assertThrows,
  describe,
  it,
} from "./testUtils";
import { calculateConfirmedBalance } from "../balance";
import type { RunwayInput } from "../../types/contracts";

const baseProfile: RunwayInput["profile"] = {
  workProfile: "delivery",
  payoutPattern: "weekly",
  dailyLivingEstimate: 35000, // ₹350
  dailyWorkEstimate: 15000,   // ₹150
};

describe("Confirmed Balance Engine Tests", () => {
  it("1. calculates starting personal liquid balance from cash plus bank minus notMine", () => {
    // ₹1,000 cash (100,000 paise), ₹4,000 bank (400,000 paise), ₹500 COD custodial (50,000 paise)
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 100000,
        bank: 400000,
        notMine: 50000,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    assertStrictEqual(res.status, "CONFIRMED");
    // (100,000 + 400,000) - 50,000 = 450,000 paise (₹4,500)
    assertStrictEqual(res.confirmedBalancePaise, 450000);
    assertStrictEqual(res.custodialOwedPaise, 50000);
    assertStrictEqual(res.breakdown?.startingPersonalPaise, 450000);
    assertStrictEqual(res.breakdown?.confirmedIncomePaise, 0);
    assertStrictEqual(res.breakdown?.confirmedExpensePaise, 0);
  });

  it("2. adds confirmed personal income received after check-in", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 50000,
        bank: 150000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-1",
          type: "income",
          amount: 80000, // ₹800 direct earnings
          ownership: "mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T12:00:00Z", // after checkedAt
        },
      ],
      payouts: [],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    assertStrictEqual(res.status, "CONFIRMED");
    // 200,000 starting + 80,000 income = 280,000 paise (₹2,800)
    assertStrictEqual(res.confirmedBalancePaise, 280000);
    assertStrictEqual(res.breakdown?.confirmedIncomePaise, 80000);
    assertStrictEqual(res.appliedTransactionCount, 1);
  });

  it("3. excludes pending income transactions (transactions recorded before or at checkin)", () => {
    // In FLOVA architecture, transactions created <= checkedAt are already reflected in the check-in count
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 50000,
        bank: 150000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-old",
          type: "income",
          amount: 50000,
          ownership: "mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T07:59:59Z", // prior to check-in
        },
      ],
      payouts: [],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    assertStrictEqual(res.status, "CONFIRMED");
    assertStrictEqual(res.confirmedBalancePaise, 200000); // 50,000 was already counted
    assertStrictEqual(res.appliedTransactionCount, 0);
  });

  it("4. excludes cancelled income / payout records", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 100000,
        bank: 200000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [
        {
          id: "p-cancelled",
          kind: "platform_payout",
          expected: 500000,
          received: 0,
          expectedDate: "2026-11-21",
          status: "cancelled",
        },
      ],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    assertStrictEqual(res.confirmedBalancePaise, 300000);
  });

  it("5. excludes scheduled, estimated and unearned expected payouts from confirmed balance", () => {
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
          expected: 450000, // ₹4,500 scheduled for next Wednesday
          received: 0,
          expectedDate: "2026-11-26",
          status: "scheduled",
        },
        {
          id: "p-est",
          kind: "platform_payout",
          expected: 150000, // ₹1,500 estimated
          received: 0,
          expectedDate: "2026-11-28",
          status: "estimated",
        },
        {
          id: "p-unearned",
          kind: "incentive",
          expected: 100000, // ₹1,000 unearned incentive
          received: 0,
          expectedDate: "2026-11-30",
          status: "unearned",
        },
      ],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    // None of the ₹7,000 expected/unearned money is added to confirmed balance
    assertStrictEqual(res.confirmedBalancePaise, 100000);
  });

  it("6. correctly handles partial received payouts through linked income transactions", () => {
    // When ₹2,000 of a ₹5,000 payout is received, a transaction is booked for ₹2,000
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
          id: "tx-payout-part",
          type: "income",
          amount: 200000, // ₹2,000 received
          ownership: "mine",
          expenseType: null,
          payoutId: "p-101",
          date: "2026-11-20",
          createdAt: "2026-11-20T14:00:00Z",
        },
      ],
      payouts: [
        {
          id: "p-101",
          kind: "platform_payout",
          expected: 500000,
          received: 200000,
          expectedDate: "2026-11-20",
          status: "partial",
        },
      ],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    // 100,000 starting + 200,000 received = 300,000 paise (₹3,000)
    assertStrictEqual(res.confirmedBalancePaise, 300000);
  });

  it("7. excludes COD collected cash from personal balance and adds it to custodial liability", () => {
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
          id: "tx-cod-1",
          type: "income",
          amount: 180000, // ₹1,800 collected in cash from customer
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
    // Confirmed personal balance is NOT inflated by COD cash!
    assertStrictEqual(res.confirmedBalancePaise, 200000);
    // Custodial liability increases to ₹1,800 (180,000 paise)
    assertStrictEqual(res.custodialOwedPaise, 180000);
  });

  it("8. excludes third-party money (ownership === 'not_mine')", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 50000,
        bank: 50000,
        notMine: 20000,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: "tx-peer-loan",
          type: "income",
          amount: 500000, // ₹5,000 held for a friend
          ownership: "not_mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T18:00:00Z",
        },
      ],
      payouts: [],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    // Starting personal: (50,000 + 50,000) - 20,000 = 80,000
    // Third party transfer does not increase personal balance
    assertStrictEqual(res.confirmedBalancePaise, 80000);
    // Custodial liability increases from 20,000 to 520,000
    assertStrictEqual(res.custodialOwedPaise, 520000);
  });

  it("9. prevents payout and transaction deduplication (does not double-count payouts.received)", () => {
    // When payout is settled, both a transaction and payouts.received exist
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
          id: "tx-settled",
          type: "income",
          amount: 300000, // ₹3,000 payout
          ownership: "mine",
          expenseType: null,
          payoutId: "p-full",
          date: "2026-11-20",
          createdAt: "2026-11-20T11:00:00Z",
        },
      ],
      payouts: [
        {
          id: "p-full",
          kind: "platform_payout",
          expected: 300000,
          received: 300000, // mirrors the transaction
          expectedDate: "2026-11-20",
          status: "settled",
        },
      ],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    // Starting 200,000 + 300,000 (from transaction) = 500,000 paise (₹5,000). NOT 800,000!
    assertStrictEqual(res.confirmedBalancePaise, 500000);
  });

  it("10. returns INSUFFICIENT_INFORMATION when balance check-in is missing (never assumes 0)", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: null, // missing check-in
      transactionsSinceCheckin: [
        {
          id: "tx-1",
          type: "income",
          amount: 100000,
          ownership: "mine",
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
    assertStrictEqual(res.status, "INSUFFICIENT_INFORMATION");
    assertStrictEqual(res.confirmedBalancePaise, null);
    assertStrictEqual(res.custodialOwedPaise, null);
    assertMatch(res.reason!, /No balance check-in found/);
  });

  it("11. rejects invalid paise values in balance check-in", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: -1000 as unknown as number, // invalid negative paise
        bank: 200000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    assertStrictEqual(res.status, "INVALID_INPUT");
    assertStrictEqual(res.confirmedBalancePaise, null);
    assertMatch(res.reason!, /Invalid cash amount/);
  });

  it("12. throws RangeError on unsafe integer overflow", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: Number.MAX_SAFE_INTEGER,
        bank: 100000,
        notMine: 0,
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [],
    };

    assertThrows(() => {
      calculateConfirmedBalance(input);
    }, /Integer overflow/);
  });

  it("13. rejects invalid dates and contradictory check-in", () => {
    const input: RunwayInput = {
      profile: baseProfile,
      latestCheckin: {
        cash: 10000,
        bank: 10000,
        notMine: 50000, // contradictory: notMine > cash + bank
        checkedAt: "2026-11-20T08:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [],
      commitments: [],
    };

    const res = calculateConfirmedBalance(input);
    assertStrictEqual(res.status, "INVALID_INPUT");
    assertMatch(res.reason!, /Contradictory check-in/);
  });
});
