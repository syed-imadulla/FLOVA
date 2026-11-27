// =====================================================================
// FLOVA 2.0 | Sprint 5D: Debt Repayment Planner Tests
// Covers multiple debts & due dates, overdue prioritization, partial
// repayments, settled debts exclusion, group expense liabilities, undated
// debts, zero capacity, budget comparisons, insufficient funds, and paise math.
// =====================================================================

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildDebtRepaymentPlan,
  compareRepaymentBudgets,
} from "../../engine/debtRepaymentPlanner";
import type { GroupSplitEngineItem, PeerDebtEngineItem } from "../../types/contracts";

test("Sprint 5D: Consolidates peer + group debts, prioritizes overdue & earliest due, excludes receivables & settled", () => {
  const peerDebts: PeerDebtEngineItem[] = [
    {
      id: "pd-settled",
      personId: "p0",
      personName: "Old Settled",
      direction: "you_owe",
      totalAmountPaise: 50000,
      remainingAmountPaise: 0,
      status: "settled",
      dueDate: "2026-11-10",
      createdAt: "2026-11-01T00:00:00Z",
    },
    {
      id: "pd-rec",
      personId: "p1",
      personName: "Neha",
      direction: "they_owe",
      totalAmountPaise: 300000,
      remainingAmountPaise: 300000,
      status: "active",
      dueDate: "2026-11-22",
      createdAt: "2026-11-02T00:00:00Z",
    },
    {
      id: "pd-upcoming",
      personId: "p2",
      personName: "Ravi",
      direction: "you_owe",
      totalAmountPaise: 100000,
      remainingAmountPaise: 60000, // partial repayment already applied
      status: "partially_settled",
      dueDate: "2026-11-26", // 5 days from 2026-11-21
      createdAt: "2026-11-03T00:00:00Z",
    },
    {
      id: "pd-overdue",
      personId: "p3",
      personName: "Amit",
      direction: "you_owe",
      totalAmountPaise: 40000,
      remainingAmountPaise: 40000,
      status: "active",
      dueDate: "2026-11-19", // overdue
      createdAt: "2026-11-04T00:00:00Z",
    },
    {
      id: "pd-nodate",
      personId: "p2",
      personName: "Ravi",
      direction: "you_owe",
      totalAmountPaise: 50000,
      remainingAmountPaise: 50000,
      status: "active",
      dueDate: null,
      createdAt: "2026-11-05T00:00:00Z",
    },
  ];

  const groupSplits: GroupSplitEngineItem[] = [
    {
      id: "gs-1",
      groupExpenseId: "ge-1",
      isSelf: true,
      personId: null,
      direction: "you_owe",
      shareAmountPaise: 30000,
      remainingAmountPaise: 30000,
      status: "active",
      createdAt: "2026-11-06T00:00:00Z",
    },
    {
      id: "gs-rec",
      groupExpenseId: "ge-2",
      isSelf: false,
      personId: "p1",
      direction: "they_owe",
      shareAmountPaise: 25000,
      remainingAmountPaise: 25000,
      status: "active",
      createdAt: "2026-11-06T00:00:00Z",
    },
  ];

  const plan = buildDebtRepaymentPlan({
    peerDebts,
    groupSplits,
    creditorNamesById: { "ge-1": "Suresh" },
    todayISO: "2026-11-21",
    dailyRepaymentBudgetPaise: 20000, // ₹200/day
    availableCashForDebtPaise: 100000, // ₹1,000 available
  });

  // Total owed: 60000 + 40000 + 50000 (peer = 150000) + 30000 (group) = 180000 paise
  assert.equal(plan.peerOwedPaise, 150000);
  assert.equal(plan.groupOwedPaise, 30000);
  assert.equal(plan.totalOwedPaise, 180000);
  // Receivables segregated: 300000 + 25000 = 325000
  assert.equal(plan.totalReceivablePaise, 325000);
  assert.equal(plan.overdueTotalPaise, 40000);

  // Priority order: overdue (pd-overdue) -> upcoming (pd-upcoming) -> undated smallest first (gs-1 30k -> pd-nodate 50k)
  assert.deepEqual(
    plan.obligations.map((o) => o.id),
    ["pd-overdue", "pd-upcoming", "gs-1", "pd-nodate"]
  );
  assert.equal(plan.obligations[0].urgency, "overdue");
  assert.equal(plan.obligations[1].urgency, "due_soon");
  assert.equal(plan.obligations[2].urgency, "no_due_date");

  // Payoff timeline at ₹200/day for ₹1,800 = 9 days (2026-11-30)
  assert.equal(plan.totalPayoffDays, 9);
  assert.equal(plan.estimatedPayoffDate, "2026-11-30");

  // Insufficient immediate funds: 180000 owed vs 100000 available -> 80000 shortfall
  assert.equal(plan.hasInsufficientFunds, true);
  assert.equal(plan.immediateShortfallPaise, 80000);

  // Grouped by creditor: Ravi owes 60k + 50k = 110k
  const ravi = plan.owedByCreditor.find((c) => c.creditorName === "Ravi")!;
  assert.equal(ravi.totalRemainingPaise, 110000);
});

test("Sprint 5D: Zero repayment capacity & what-if budget comparisons", () => {
  const peerDebts: PeerDebtEngineItem[] = [
    {
      id: "pd-1",
      personId: "p1",
      personName: "Kiran",
      direction: "you_owe",
      totalAmountPaise: 100000,
      remainingAmountPaise: 100000,
      status: "active",
      dueDate: "2026-11-25", // 4 days from 11-21
      createdAt: "2026-11-10T00:00:00Z",
    },
  ];

  const zeroPlan = buildDebtRepaymentPlan({
    peerDebts,
    todayISO: "2026-11-21",
    dailyRepaymentBudgetPaise: 0,
  });
  assert.equal(zeroPlan.hasRepaymentCapacity, false);
  assert.equal(zeroPlan.totalPayoffDays, null);
  assert.equal(zeroPlan.estimatedPayoffDate, null);
  assert.equal(zeroPlan.obligations[0].willMissDueDate, true);
  assert.ok(zeroPlan.explanation.some((e) => e.includes("₹0/day")));

  const comparisons = compareRepaymentBudgets(
    { peerDebts, todayISO: "2026-11-21" },
    [10000, 25000, 50000] // ₹100/day, ₹250/day, ₹500/day
  );
  // ₹100/day -> 10 days (misses 11-25 due date); ₹250/day -> 4 days (hits 11-25); ₹500/day -> 2 days
  assert.equal(comparisons[0].totalPayoffDays, 10);
  assert.equal(comparisons[0].missedDueDatesCount, 1);
  assert.equal(comparisons[1].totalPayoffDays, 4);
  assert.equal(comparisons[1].missedDueDatesCount, 0);
  assert.equal(comparisons[2].totalPayoffDays, 2);
  assert.equal(comparisons[2].missedDueDatesCount, 0);
});
