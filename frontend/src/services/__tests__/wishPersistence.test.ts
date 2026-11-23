// =====================================================================
// FLOVA Phase 15: WISH 2.0 Database Persistence & Migration Tests
// Tests database-backed WISH goals, contributions, localStorage migration,
// streak tracking, and integer paise milestones.
// =====================================================================

import {
  listWishGoals,
  createWishGoal,
  addWishContribution,
  migrateLocalStorageGoals,
} from "../wish";
import { toPaise } from "../../lib/money";

declare const process: any;

let passed = 0;
let failed = 0;

function assertTrue(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(`${message ? message + ": " : ""}Expected ${expected}, got ${actual}`);
  }
}

function test(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed++;
      console.log(`  ✔ ${name}`);
    })
    .catch((err) => {
      failed++;
      console.error(`  ✖ ${name}:`, err);
    });
}

console.log("=====================================================================");
console.log("FLOVA Phase 15: WISH 2.0 Database Persistence & Migration Tests");
console.log("=====================================================================");

async function run() {
  await test("1. creates persistent wish goal in database", async () => {
    const goal = await createWishGoal({
      title: "New Delivery Smartphone",
      targetAmountPaise: 1500000, // ₹15,000
      targetDate: "2026-12-31",
      category: "tools",
    });

    assertTrue(!!goal.id, "Goal id must exist");
    assertEqual(goal.title, "New Delivery Smartphone");
    assertEqual(toPaise(goal.target_amount), 1500000);
    assertEqual(toPaise(goal.saved_amount), 0);
    assertEqual(goal.status, "active");
  });

  await test("2. records contribution and updates goal saved amount", async () => {
    const goal = await createWishGoal({
      title: "Tyre Replacement",
      targetAmountPaise: 400000, // ₹4,000
    });

    const contrib = await addWishContribution(goal.id, {
      amountPaise: 100000, // ₹1,000
      note: "Saved from evening freelance job",
    });

    assertTrue(!!contrib.id, "Contribution id must exist");
    assertEqual(toPaise(contrib.amount), 100000);

    // Verify updated goal
    const goals = await listWishGoals();
    const updated = goals.find((g) => g.id === goal.id);
    assertTrue(!!updated, "Updated goal must exist");
    assertEqual(toPaise(updated?.saved_amount), 100000);
    assertEqual(updated?.status, "active");
  });

  await test("3. completing goal reaches completed status", async () => {
    const goal = await createWishGoal({
      title: "Helmet Upgrade",
      targetAmountPaise: 200000, // ₹2,000
    });

    await addWishContribution(goal.id, {
      amountPaise: 200000, // ₹2,000
    });

    const goals = await listWishGoals();
    const completed = goals.find((g) => g.id === goal.id);
    assertTrue(!!completed, "Completed goal must exist");
    assertEqual(toPaise(completed?.saved_amount), 200000);
    assertEqual(completed?.status, "completed");
  });

  await test("4. migrates legacy localStorage goals into database", async () => {
    const legacy = [
      {
        id: "legacy-1",
        name: "Raincoat for monsoon",
        targetPaise: 80000,
        savedPaise: 20000,
        createdAt: "2026-11-01T10:00:00Z",
      },
      {
        id: "legacy-2",
        name: "Festive clothes for family",
        targetPaise: 500000,
        savedPaise: 500000,
        createdAt: "2026-11-05T10:00:00Z",
      },
    ];

    const migratedCount = await migrateLocalStorageGoals(legacy);
    assertEqual(migratedCount, 2);

    const goals = await listWishGoals();
    const g1 = goals.find((g) => g.title === "Raincoat for monsoon");
    assertTrue(!!g1, "Goal 1 must exist");
    assertEqual(toPaise(g1?.target_amount), 80000);
    assertEqual(toPaise(g1?.saved_amount), 20000);
    assertEqual(g1?.status, "active");

    const g2 = goals.find((g) => g.title === "Festive clothes for family");
    assertTrue(!!g2, "Goal 2 must exist");
    assertEqual(toPaise(g2?.target_amount), 500000);
    assertEqual(toPaise(g2?.saved_amount), 500000);
    assertEqual(g2?.status, "completed");
  });

  console.log("=====================================================================");
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("=====================================================================");

  if (typeof process !== "undefined" && failed > 0) {
    process.exit(1);
  }
}

void run();
