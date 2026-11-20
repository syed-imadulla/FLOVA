// =====================================================================
// FLOVA WISH — Deterministic Financial Calculation Tests
// Verifies remaining amount, progress percentage, weekly/monthly timelines,
// zero-contribution honesty, and completion states.
// =====================================================================

import { calculateWish } from "../types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("Running WISH calculation unit tests...");

// Test 1: Standard weekly wish with remaining amount
{
  const wish = {
    targetPaise: 1500000, // ₹15,000
    savedPaise: 300000,   // ₹3,000
    contributionPaise: 100000, // ₹1,000 / week
    cadence: "weekly" as const,
  };
  const fixedDate = new Date("2026-11-21T00:00:00Z");
  const result = calculateWish(wish, fixedDate);

  assert(result.remainingPaise === 1200000, "Remaining must be exactly ₹12,000 (1,200,000 paise)");
  assert(result.progressRatio === 0.2, "Progress ratio must be 0.2");
  assert(result.progressPercent === 20, "Progress percent must be 20%");
  assert(result.isCompleted === false, "Wish should not be completed");
  assert(result.periodsRemaining === 12, "Should take 12 weeks");
  assert(result.estimatedDays === 84, "12 weeks = 84 days");
  assert(result.timelineSummary.includes("12 weeks"), "Summary should mention 12 weeks");
}

// Test 2: Monthly cadence with fractional period rounding
{
  const wish = {
    targetPaise: 5000000, // ₹50,000
    savedPaise: 1000000,  // ₹10,000
    contributionPaise: 600000, // ₹6,000 / month
    cadence: "monthly" as const,
  };
  const fixedDate = new Date("2026-11-21T00:00:00Z");
  const result = calculateWish(wish, fixedDate);

  // Remaining: 40,000. 40,000 / 6,000 = 6.666 -> Math.ceil gives 7 months
  assert(result.remainingPaise === 4000000, "Remaining must be ₹40,000");
  assert(result.progressPercent === 20, "Progress percent must be 20%");
  assert(result.periodsRemaining === 7, "Should take 7 months (rounded up)");
  assert(result.timelineSummary.includes("7 months"), "Summary should mention 7 months");
}

// Test 3: Zero contribution does not invent fake ETA
{
  const wish = {
    targetPaise: 1000000,
    savedPaise: 200000,
    contributionPaise: 0,
    cadence: "weekly" as const,
  };
  const result = calculateWish(wish);

  assert(result.periodsRemaining === null, "Periods remaining must be null for zero contribution");
  assert(result.estimatedDate === null, "Estimated date must be null");
  assert(result.timelineSummary.includes("Set a regular contribution"), "Honest prompt when contribution is missing");
}

// Test 4: Fully funded wish
{
  const wish = {
    targetPaise: 1000000,
    savedPaise: 1000000,
    contributionPaise: 50000,
    cadence: "weekly" as const,
  };
  const result = calculateWish(wish);

  assert(result.remainingPaise === 0, "Remaining must be 0");
  assert(result.progressPercent === 100, "Progress must be 100%");
  assert(result.isCompleted === true, "Must be completed");
  assert(result.timelineSummary.includes("Target reached"), "Completion message must show");
}

// Test 5: Over-funded wish (clamped)
{
  const wish = {
    targetPaise: 1000000,
    savedPaise: 1500000,
    contributionPaise: 50000,
    cadence: "weekly" as const,
  };
  const result = calculateWish(wish);

  assert(result.remainingPaise === 0, "Remaining must be 0 (never negative)");
  assert(result.progressPercent === 100, "Progress percent must be clamped to 100%");
  assert(result.isCompleted === true, "Must be completed");
}

console.log("All WISH calculation unit tests passed successfully!");
