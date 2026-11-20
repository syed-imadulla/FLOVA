// =====================================================================
// FLOVA Phase 4 — Ravi Fixture Integration Test (M1)
// Verifies integration between loadRunwayInput() data contract shape
// and M3's deterministic TypeScript runway calculation engine.
// =====================================================================

import { assertStrictEqual } from "../../engine/__tests__/testUtils";
import type { RunwayInput } from "../../types/contracts";
import { processRunwayFeed } from "../adapter";

console.log("=================================================");
console.log("FLOVA Phase 4: Ravi Fixture Integration Test");
console.log("=================================================");

/**
 * Ravi's Timeline & Parameters:
 * - Thursday 2026-11-19 08:00Z: Check-in cash ₹1,500, bank ₹2,500, COD ₹600.
 *   Baseline personal starting cash = ₹1,500 + ₹2,500 − ₹600 = ₹3,400.
 * - Thursday 2026-11-19 10:00Z: Own income received ₹650 (created_at > checked_at).
 * - Thursday 2026-11-19 14:00Z: Petrol expense ₹120 Work (created_at > checked_at).
 *   -> Available confirmed balance = ₹3,400 + ₹650 − ₹120 = ₹3,930.
 * - Profile daily estimates: living ₹200 + work ₹100 = ₹300 / day essential baseline.
 * - Saturday 2026-11-21: Rent commitment ₹4,500.
 * - Monday 2026-11-23: Expected payout ₹1,800 scheduled (not received, must NOT be counted).
 */

const raviInput: RunwayInput = {
  profile: {
    workProfile: "delivery",
    payoutPattern: "weekly",
    dailyLivingEstimate: 20000, // ₹200
    dailyWorkEstimate: 10000,   // ₹100
  },
  latestCheckin: {
    cash: 150000,  // ₹1,500
    bank: 250000,  // ₹2,500
    notMine: 60000, // ₹600 (COD)
    checkedAt: "2026-11-19T08:00:00Z",
  },
  transactionsSinceCheckin: [
    {
      id: "tx-ravi-income-1",
      type: "income",
      amount: 65000, // ₹650
      ownership: "mine",
      expenseType: null,
      payoutId: null,
      date: "2026-11-19",
      createdAt: "2026-11-19T10:00:00Z", // > checkedAt: applies!
    },
    {
      id: "tx-ravi-petrol-1",
      type: "expense",
      amount: 12000, // ₹120
      ownership: "mine",
      expenseType: "work",
      payoutId: null,
      date: "2026-11-19",
      createdAt: "2026-11-19T14:00:00Z", // > checkedAt: applies!
    },
    // Same-day pre-checkin transaction that must be skipped by timestamp rule:
    {
      id: "tx-ravi-earlier-cash",
      type: "income",
      amount: 50000, // ₹500
      ownership: "mine",
      expenseType: null,
      payoutId: null,
      date: "2026-11-19",
      createdAt: "2026-11-19T06:00:00Z", // <= checkedAt: already in cash count, MUST NOT double count!
    },
  ],
  payouts: [
    {
      id: "payout-monday",
      kind: "platform_payout",
      expected: 180000, // ₹1,800
      received: 0,
      expectedDate: "2026-11-23", // Monday
      status: "scheduled",
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
};

// Execute projection for 7 days starting from Friday 2026-11-20
const result = processRunwayFeed(raviInput, { horizonDays: 7, startDate: "2026-11-20" });

// Assertions
assertStrictEqual(result.status, "PROJECTED", "Ravi feed status should be PROJECTED");

// 1. Available after check-in adjustments and recorded transactions: ₹3,930 (393,000 paise)
assertStrictEqual(
  result.confirmedBalancePaise,
  393000,
  "Confirmed personal balance should be exactly ₹3,930 (393,000 paise)"
);
console.log("  ✔ Available after check-in and recorded transactions: ₹3,930 (393,000 paise)");

// 2. Day 0 (Friday 2026-11-20) closing balance: ₹3,630 (363,000 paise)
const fridayEntry = result.projections.find((p) => p.date === "2026-11-20");
if (!fridayEntry) throw new Error("Friday 2026-11-20 projection entry missing");
assertStrictEqual(
  fridayEntry.closingBalancePaise,
  363000,
  "Friday 2026-11-20 closing balance should be ₹3,630 (363,000 paise)"
);
console.log("  ✔ Friday 2026-11-20 closing balance: ₹3,630 (363,000 paise)");

// 3. Day 1 (Saturday 2026-11-21) projected balance: −₹1,170 (-117,000 paise)
const saturdayEntry = result.projections.find((p) => p.date === "2026-11-21");
if (!saturdayEntry) throw new Error("Saturday 2026-11-21 projection entry missing");
assertStrictEqual(
  saturdayEntry.closingBalancePaise,
  -117000,
  "Saturday 2026-11-21 projected closing balance should be −₹1,170 (-117,000 paise)"
);
console.log("  ✔ Saturday 2026-11-21 projected balance: −₹1,170 (-117,000 paise)");

// 4. First shortfall date: Saturday 2026-11-21
assertStrictEqual(
  result.firstShortfallDate,
  "2026-11-21",
  "First shortfall date must be Saturday 2026-11-21"
);
console.log("  ✔ First shortfall date: Saturday 2026-11-21");

// 5. Monday expected payout of ₹1,800 is NOT counted in confirmed balance or closing balance
const mondayEntry = result.projections.find((p) => p.date === "2026-11-23");
if (!mondayEntry) throw new Error("Monday 2026-11-23 projection entry missing");
// Saturday closing was -117,000. Sunday has essential expense ₹300 -> -147,000. Monday has essential expense ₹300 -> -177,000.
// If Monday's ₹1,800 were counted, closing would be positive (+3,000). It must stay negative (-177,000)!
assertStrictEqual(
  mondayEntry.closingBalancePaise,
  -177000,
  "Monday projected balance must not count expected payout of ₹1,800 (must be −₹1,770)"
);
console.log("  ✔ Monday expected payout of ₹1,800 is strictly excluded from cash flow projection");

// 6. Expected payouts are reported in metadata labeled as expected
assertStrictEqual(result.expectedPayouts.length, 1, "Expected payout preserved in separate list");
assertStrictEqual(result.expectedPayouts[0].expected, 180000, "Payout amount preserved");
console.log("  ✔ Expected payout preserved in metadata with scheduled status");

console.log("-------------------------------------------------");
console.log("All Ravi fixture tests passed successfully!");
console.log("=================================================");
