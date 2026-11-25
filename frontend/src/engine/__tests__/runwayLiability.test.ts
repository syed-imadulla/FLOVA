// =====================================================================
// FLOVA Financial Engine — Available Liquidity vs Sustainable Capital
// & Zero Double-Counting Integration Tests (Sprint 1)
// =====================================================================

import { assertStrictEqual, describe, it } from "./testUtils";
import { calculateConfirmedBalance } from "../balance";
import { calculateDailyRunway } from "../runway";
import type { RunwayProjectionInput } from "../runway";

describe("Available Liquidity vs Sustainable Capital & Single Source of Truth", () => {
  const baseInput: RunwayProjectionInput = {
    profile: {
      workProfile: "delivery",
      payoutPattern: "weekly",
      dailyLivingEstimate: 20000, // ₹200/day
      dailyWorkEstimate: 0,
      safeRunwayBuffer: 100000, // ₹1,000
    },
    latestCheckin: {
      cash: 500000, // ₹5,000
      bank: 500000, // ₹5,000
      notMine: 0,
      checkedAt: "2026-11-20T08:00:00Z",
    },
    transactionsSinceCheckin: [],
    payouts: [],
    commitments: [
      {
        id: "bill-1",
        title: "Phone bill",
        amount: 200000, // ₹2,000
        dueDate: "2026-11-25",
        kind: "bill",
      },
    ],
    horizonDays: 30,
    startDate: "2026-11-20",
  };

  it("borrowing due > horizon increases Available Liquidity without inflating Sustainable Capital or Earned Income", () => {
    const res = calculateDailyRunway({
      ...baseInput,
      peerDebts: [
        {
          id: "debt-borrow",
          personId: "p1",
          personName: "Amit",
          direction: "you_owe",
          totalAmountPaise: 500000, // ₹5,000
          remainingAmountPaise: 500000,
          status: "active",
          dueDate: "2027-01-20", // > 30 days
          createdAt: "2026-11-20T10:00:00Z",
        },
      ],
    });

    assertStrictEqual(res.status, "PROJECTED");
    // Confirmed cash: ₹10,000 + ₹5,000 = ₹15,000
    assertStrictEqual(res.startingConfirmedBalancePaise, 1500000);
    // Available Liquidity: ₹15,000 - ₹1,000 buffer = ₹14,000
    assertStrictEqual(res.availableLiquidityPaise, 1400000);
    // Sustainable Capital: ₹15,000 - ₹5,000 debt - ₹1,000 buffer = ₹9,000 (unchanged from baseline ₹10k - ₹1k!)
    assertStrictEqual(res.sustainableCapitalPaise, 900000);
    assertStrictEqual(res.peerLiabilityPaise, 500000);

    const bal = calculateConfirmedBalance({
      ...baseInput,
      peerDebts: [
        {
          id: "debt-borrow",
          personId: "p1",
          direction: "you_owe",
          totalAmountPaise: 500000,
          remainingAmountPaise: 500000,
          status: "active",
          dueDate: "2027-01-20",
          createdAt: "2026-11-20T10:00:00Z",
        },
      ],
    });
    assertStrictEqual(bal.breakdown?.earnedIncomePaise, 0);
  });

  it("borrowing due <= horizon deducts once in Available Liquidity projection and never double-counts in Sustainable Runway", () => {
    const res = calculateDailyRunway({
      ...baseInput,
      horizonDays: 15,
      peerDebts: [
        {
          id: "debt-short",
          personId: "p1",
          personName: "Amit",
          direction: "you_owe",
          totalAmountPaise: 500000, // ₹5,000
          remainingAmountPaise: 500000,
          status: "active",
          dueDate: "2026-11-22", // inside 15-day horizon
          createdAt: "2026-11-20T10:00:00Z",
        },
      ],
    });

    assertStrictEqual(res.status, "PROJECTED");
    // On Day 2 (2026-11-22), ₹5,000 debt commitment is deducted ONCE
    const dueDay = res.projections.find((p) => p.date === "2026-11-22");
    assertStrictEqual(dueDay?.commitmentDeductionPaise, 500000);
    // End of horizon (15 days): ₹15,000 - (15 * ₹200 = ₹3,000) - ₹2,000 bill - ₹5,000 debt = ₹5,000
    assertStrictEqual(res.projections[14].closingBalancePaise, 500000);
    // Sustainable runway starts from ₹15,000 - ₹5,000 = ₹10,000 and deducts ₹2,000 bill + ₹3,000 burn = ₹5,000 (>= 0 all 15 days)
    assertStrictEqual(res.sustainableRunwayDays, 15);
  });

  it("lending reduces cash and creates receivable without becoming consumption expense or available cash", () => {
    const bal = calculateConfirmedBalance({
      ...baseInput,
      peerDebts: [
        {
          id: "debt-lend",
          personId: "p2",
          direction: "they_owe",
          totalAmountPaise: 300000, // ₹3,000
          remainingAmountPaise: 300000,
          status: "active",
          dueDate: null,
          createdAt: "2026-11-20T11:00:00Z",
        },
      ],
    });

    assertStrictEqual(bal.status, "CONFIRMED");
    assertStrictEqual(bal.confirmedBalancePaise, 700000); // ₹10,000 - ₹3,000
    assertStrictEqual(bal.peerReceivablePaise, 300000); // ₹3,000 receivable
    assertStrictEqual(bal.breakdown?.confirmedExpensePaise, 0); // NOT a consumption expense
  });

  it("partial repayments update cash and outstanding balances exactly once", () => {
    const bal = calculateConfirmedBalance({
      ...baseInput,
      peerDebts: [
        {
          id: "d-borrow",
          personId: "p1",
          direction: "you_owe",
          totalAmountPaise: 500000,
          remainingAmountPaise: 300000, // ₹2,000 repaid
          status: "partially_settled",
          dueDate: null,
          createdAt: "2026-11-20T09:00:00Z",
        },
        {
          id: "d-lend",
          personId: "p2",
          direction: "they_owe",
          totalAmountPaise: 300000,
          remainingAmountPaise: 150000, // ₹1,500 repaid back
          status: "partially_settled",
          dueDate: null,
          createdAt: "2026-11-20T09:30:00Z",
        },
      ],
      debtSettlements: [
        {
          id: "s-out",
          debtId: "d-borrow",
          direction: "repayment_out",
          amountPaise: 200000,
          settledAt: "2026-11-20T12:00:00Z",
          createdAt: "2026-11-20T12:00:00Z",
        },
        {
          id: "s-in",
          debtId: "d-lend",
          direction: "repayment_in",
          amountPaise: 150000,
          settledAt: "2026-11-20T13:00:00Z",
          createdAt: "2026-11-20T13:00:00Z",
        },
      ],
    });

    // Cash: ₹10,000 + ₹5,000 - ₹3,000 - ₹2,000 + ₹1,500 = ₹11,500 (1,150,000 paise)
    assertStrictEqual(bal.confirmedBalancePaise, 1150000);
    assertStrictEqual(bal.peerLiabilityPaise, 300000);
    assertStrictEqual(bal.peerReceivablePaise, 150000);
    assertStrictEqual(bal.breakdown?.earnedIncomePaise, 0);
    assertStrictEqual(bal.breakdown?.confirmedExpensePaise, 0);
  });

  it("segregates family_support and pocket_money from earnedIncomePaise while preserving v1.0.1 defaults", () => {
    const bal = calculateConfirmedBalance({
      ...baseInput,
      transactionsSinceCheckin: [
        {
          id: "tx-v1",
          type: "income",
          amount: 100000, // ₹1,000 legacy v1.0.1 income (no inflowCategory -> defaults to earned)
          ownership: "mine",
          expenseType: null,
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T10:00:00Z",
        },
        {
          id: "tx-pocket",
          type: "income",
          amount: 200000, // ₹2,000 pocket money
          ownership: "mine",
          expenseType: null,
          inflowCategory: "pocket_money",
          payoutId: null,
          date: "2026-11-20",
          createdAt: "2026-11-20T11:00:00Z",
        },
      ],
    });

    assertStrictEqual(bal.confirmedBalancePaise, 1300000);
    assertStrictEqual(bal.breakdown?.confirmedIncomePaise, 300000);
    assertStrictEqual(bal.breakdown?.earnedIncomePaise, 100000);
    assertStrictEqual(bal.breakdown?.nonEarnedInflowPaise, 200000);
  });
});
