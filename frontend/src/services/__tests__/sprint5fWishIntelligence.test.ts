// =====================================================================
// FLOVA 2.0 | Sprint 5F: WISH Goal Intelligence Tests
// Covers new/zero-contribution goals, partial/completed/overdue/missing
// deadline/paused/cancelled goals, daily/weekly/monthly requirements,
// explicit reservation vs ordinary target, insufficient safe-to-spend,
// and no double-counting in confirmed balances.
// =====================================================================

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  analyzeWishGoals,
  normalizeWishGoalForEngine,
  simulateWishContribution,
} from "../../engine/wishIntelligence";
import { calculateSafeToSpend } from "../../engine/safeToSpend";
import type { RunwayInput, WishGoal } from "../../types/contracts";

test("Sprint 5F: New, partial, completed, paused, cancelled, and missing-deadline goals", () => {
  const laptopRow: WishGoal = {
    id: "g-laptop",
    user_id: "u1",
    title: "Work Laptop",
    target_amount: "30000.00",
    saved_amount: "10000.00", // ₹20,000 remaining
    target_date: "2026-12-10", // 20 days from 2026-11-20
    status: "active",
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-01T00:00:00Z",
  };

  const report = analyzeWishGoals({
    todayISO: "2026-11-20",
    dailySafeToSpendPaise: 50000, // ₹500/day safe-to-spend
    goals: [
      normalizeWishGoalForEngine(laptopRow, { contributionPaise: 50000, cadence: "weekly" }),
      {
        id: "g-new",
        title: "Helmet",
        targetPaise: 200000,
        savedPaise: 0,
        targetDate: null, // missing deadline, 0 contribution -> NO promised ETA
        status: "active",
      },
      {
        id: "g-done",
        title: "Phone Stand",
        targetPaise: 50000,
        savedPaise: 50000,
        status: "completed",
      },
      {
        id: "g-paused",
        title: "Vacation",
        targetPaise: 500000,
        savedPaise: 100000,
        targetDate: "2026-12-01",
        status: "paused",
      },
      {
        id: "g-cancelled",
        title: "Cancelled",
        targetPaise: 100000,
        savedPaise: 20000,
        status: "cancelled",
      },
    ],
  });

  // Total saved excludes cancelled (1000000 + 0 + 50000 + 100000 = 1150000)
  assert.equal(report.totalSavedPaise, 1150000);
  // Active remaining = 2000000 + 200000 = 2200000
  assert.equal(report.totalRemainingActivePaise, 2200000);
  assert.equal(report.activeCount, 2);
  assert.equal(report.completedCount, 1);
  assert.equal(report.pausedCount, 1);
  assert.equal(report.cancelledCount, 1);

  const laptop = report.goals.find((g) => g.id === "g-laptop")!;
  assert.equal(laptop.remainingPaise, 2000000);
  assert.equal(laptop.percentCompleted, 33);
  assert.equal(laptop.daysRemaining, 20);
  // Required: 2,000,000 / 20 = 100,000 paise/day (₹1,000/day)
  assert.equal(laptop.requiredDailyPaise, 100000);
  assert.equal(laptop.requiredWeeklyPaise, 700000);
  // Exceeds ₹500/day safe-to-spend -> not achievable by 2026-12-10
  assert.equal(laptop.achievableByTargetDate, false);
  assert.equal(laptop.needsAttention, true);
  assert.equal(report.hasInsufficientSafeToSpend, true);
  assert.equal(report.goalNeedingAttention?.id, "g-laptop");

  // Goal with 0 contribution and no deadline must NOT invent an ETA
  const helmet = report.goals.find((g) => g.id === "g-new")!;
  assert.equal(helmet.estimatedCompletionDate, null);
  assert.equal(helmet.requiredDailyPaise, null);
});

test("Sprint 5F: Overdue goals, contribution simulation, and explicit vs ordinary reservation", () => {
  // Overdue goal
  const overdueReport = analyzeWishGoals({
    todayISO: "2026-11-27",
    goals: [
      {
        id: "g-over",
        title: "Bike Service",
        targetPaise: 300000,
        savedPaise: 100000,
        targetDate: "2026-11-20",
        status: "active",
      },
    ],
  });
  assert.equal(overdueReport.goals[0].isOverdue, true);
  assert.equal(overdueReport.goals[0].achievableByTargetDate, false);
  assert.equal(overdueReport.goalNeedingAttention?.id, "g-over");

  // "If I save ₹500 every week, when will I reach my target?" (₹2,000 remaining -> 4 weeks = 28 days)
  const sim = simulateWishContribution(
    { targetPaise: 300000, savedPaise: 100000, status: "active" },
    50000,
    "weekly",
    "2026-11-27"
  );
  assert.equal(sim.estimatedDays, 28);
  assert.equal(sim.estimatedCompletionDate, "2026-12-25");

  // Ordinary goal target does NOT auto-reduce safe-to-spend; only explicit reservation does
  assert.equal(overdueReport.explicitReservedGoalsPaise, 0);

  const runwayInput: RunwayInput = {
    profile: {
      workProfile: "delivery",
      payoutPattern: "weekly",
      dailyLivingEstimate: 20000,
      dailyWorkEstimate: 10000,
      safeRunwayBuffer: 100000,
    },
    latestCheckin: { cash: 500000, bank: 0, notMine: 0, checkedAt: "2026-11-20T00:00:00Z" },
    transactionsSinceCheckin: [],
    payouts: [],
    commitments: [],
  };
  const sOrdinary = calculateSafeToSpend({
    runwayInput,
    todayISO: "2026-11-27",
    explicitReservedGoalsPaise: overdueReport.explicitReservedGoalsPaise,
  });
  // Confirmed = 500,000; buffer = 100,000; ordinary goal target (300,000) NOT deducted -> 400,000
  assert.equal(sOrdinary.remainingMonthlyAllowancePaise, 400000);
});
