import {
  assertMatch,
  assertStrictEqual,
  assertThrows,
  describe,
  it,
} from "./testUtils";
import {
  isValidISODate,
  isValidISOTimestamp,
  isValidPaise,
  safeAdd,
  safeSub,
  validateBalanceCheckin,
  validateRunwayInput,
  validateTransaction,
} from "../validation";
import type { RunwayInput } from "../../types/contracts";

describe("Validation Unit Tests", () => {
  it("validates paise integers correctly (rejects negatives, decimals, non-integers)", () => {
    assertStrictEqual(isValidPaise(0), true);
    assertStrictEqual(isValidPaise(450000), true);
    assertStrictEqual(isValidPaise(Number.MAX_SAFE_INTEGER), true);

    // Invalid paise values
    assertStrictEqual(isValidPaise(-1), false);
    assertStrictEqual(isValidPaise(100.5), false);
    assertStrictEqual(isValidPaise(NaN), false);
    assertStrictEqual(isValidPaise(Infinity), false);
    assertStrictEqual(isValidPaise("450000"), false);
    assertStrictEqual(isValidPaise(null), false);
  });

  it("detects unsafe integer overflow on additions and subtractions", () => {
    assertStrictEqual(safeAdd(100, 200), 300);
    assertStrictEqual(safeSub(500, 200), 300);
    assertStrictEqual(safeSub(200, 500), -300);

    // Overflow beyond Number.MAX_SAFE_INTEGER
    assertThrows(() => {
      safeAdd(Number.MAX_SAFE_INTEGER, 1);
    }, /Integer overflow in addition/);

    assertThrows(() => {
      safeSub(-Number.MAX_SAFE_INTEGER, 2);
    }, /Integer overflow in subtraction/);
  });

  it("validates ISO dates correctly and rejects invalid dates", () => {
    assertStrictEqual(isValidISODate("2026-11-20"), true);
    assertStrictEqual(isValidISODate("2024-02-29"), true); // Leap year valid

    // Invalid dates
    assertStrictEqual(isValidISODate("2026-02-29"), false); // 2026 is not a leap year
    assertStrictEqual(isValidISODate("2026-13-01"), false); // Invalid month
    assertStrictEqual(isValidISODate("2026-04-31"), false); // April has 30 days
    assertStrictEqual(isValidISODate("20-11-2026"), false); // Wrong format
    assertStrictEqual(isValidISODate("not-a-date"), false);
  });

  it("validates ISO timestamps correctly", () => {
    assertStrictEqual(isValidISOTimestamp("2026-11-20T12:00:00Z"), true);
    assertStrictEqual(isValidISOTimestamp("2026-11-20T17:30:00+05:30"), true);
    assertStrictEqual(isValidISOTimestamp("invalid-timestamp"), false);
    assertStrictEqual(isValidISOTimestamp(""), false);
  });

  it("validates balance check-ins and catches contradictory custodial cash", () => {
    const valid = validateBalanceCheckin({
      cash: 50000,
      bank: 200000,
      notMine: 30000,
      checkedAt: "2026-11-20T08:00:00Z",
    });
    assertStrictEqual(valid.valid, true);

    // Contradictory: notMine exceeds cash + bank
    const contradictory = validateBalanceCheckin({
      cash: 20000,
      bank: 10000,
      notMine: 50000, // 50,000 > 30,000 total
      checkedAt: "2026-11-20T08:00:00Z",
    });
    assertStrictEqual(contradictory.valid, false);
    assertMatch(contradictory.errors[0], /Contradictory check-in/);
  });

  it("validates individual transaction structure", () => {
    const valid = validateTransaction({
      id: "tx-1",
      type: "expense",
      amount: 15000,
      ownership: "mine",
      expenseType: "work",
      payoutId: null,
      date: "2026-11-20",
      createdAt: "2026-11-20T10:00:00Z",
    });
    assertStrictEqual(valid.valid, true);

    // Missing expenseType on personal expense
    const missingExpenseType = validateTransaction({
      id: "tx-2",
      type: "expense",
      amount: 15000,
      ownership: "mine",
      expenseType: null,
      payoutId: null,
      date: "2026-11-20",
      createdAt: "2026-11-20T10:00:00Z",
    });
    assertStrictEqual(missingExpenseType.valid, false);
    assertMatch(missingExpenseType.errors[0], /Personal expenses must specify expenseType/);
  });

  it("validates complete RunwayInput payload", () => {
    const mockInput: RunwayInput = {
      profile: {
        workProfile: "delivery",
        payoutPattern: "weekly",
        dailyLivingEstimate: 30000,
        dailyWorkEstimate: 20000,
      },
      latestCheckin: {
        cash: 100000,
        bank: 300000,
        notMine: 50000,
        checkedAt: "2026-11-20T09:00:00Z",
      },
      transactionsSinceCheckin: [],
      payouts: [
        {
          id: "p-1",
          kind: "platform_payout",
          expected: 400000,
          received: 0,
          expectedDate: "2026-11-25",
          status: "scheduled",
        },
      ],
      commitments: [],
    };

    const res = validateRunwayInput(mockInput);
    assertStrictEqual(res.valid, true);
    assertStrictEqual(res.errors.length, 0);
  });
});
