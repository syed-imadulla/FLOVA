// =====================================================================
// FLOVA Regression Test: Category Label Mapping & Activity Display
// Resolves: KSRTC receipt / "other" expense erroneously labeled as "Other income"
// =====================================================================

import { categoryLabel } from "../../app/categories";
import type { ActivityItem, TransactionType } from "../../types/contracts";

let passCount = 0;
let failCount = 0;

function assertTrue(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertStrictEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(message ?? `Assertion failed: expected ${String(expected)}, but got ${String(actual)}`);
  }
}

async function it(name: string, fn: () => void): Promise<void> {
  try {
    fn();
    passCount++;
    console.log(`  ✔ ${name}`);
  } catch (err) {
    failCount++;
    console.error(`  ✘ ${name}`);
    console.error(err);
  }
}

console.log("=====================================================================");
console.log("FLOVA Category Label Mapping & Activity Subtitle Regression Tests");
console.log("=====================================================================");

await it("1. categoryLabel('other', 'expense') returns 'Other expense', NOT 'Other income'", () => {
  assertStrictEqual(categoryLabel("other", "expense"), "Other expense");
});

await it("2. categoryLabel('other', 'income') returns 'Other income'", () => {
  assertStrictEqual(categoryLabel("other", "income"), "Other income");
});

await it("3. categoryLabel('other') without type returns 'Other'", () => {
  assertStrictEqual(categoryLabel("other"), "Other");
});

await it("4. categoryLabel handles null/undefined correctly with type awareness", () => {
  assertStrictEqual(categoryLabel(null, "expense"), "Other expense");
  assertStrictEqual(categoryLabel(undefined, "expense"), "Other expense");
  assertStrictEqual(categoryLabel(null, "income"), "Other income");
  assertStrictEqual(categoryLabel(undefined, "income"), "Other income");
  assertStrictEqual(categoryLabel(null), "Other");
});

await it("5. Known expense categories resolve identically with or without type", () => {
  assertStrictEqual(categoryLabel("fuel", "expense"), "Fuel");
  assertStrictEqual(categoryLabel("food", "expense"), "Food");
  assertStrictEqual(categoryLabel("transport", "expense"), "Transport");
});

await it("6. Known income categories resolve identically with or without type", () => {
  assertStrictEqual(categoryLabel("delivery_earnings", "income"), "Delivery earnings");
  assertStrictEqual(categoryLabel("salary", "income"), "Salary");
  assertStrictEqual(categoryLabel("freelance", "income"), "Freelance");
});

await it("7. Simulates KSRTC ₹123 receipt activity display: subtitle is 'Other expense · Work', never 'Other income'", () => {
  const item: ActivityItem = {
    id: "tx-ksrtc-123",
    timestamp: "2026-11-24T10:00:00.000Z",
    kind: "transaction",
    type: "expense",
    amountPaise: 12300,
    category: "other",
    expenseType: "work",
    ownership: "mine",
    date: "2026-11-24",
    title: "KSRTC receipt",
  };

  const notMine = item.ownership === "not_mine";
  const txType: TransactionType | undefined = item.type === "income" || item.type === "expense" ? item.type : undefined;
  const sub = [
    categoryLabel(item.category, txType),
    notMine ? "Not your money" : item.expenseType ? (item.expenseType === "work" ? "Work" : "Living") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  assertStrictEqual(sub, "Other expense · Work");
  assertTrue(!sub.includes("Other income"), "Subtitle must not contain 'Other income' for an expense");
});

console.log("=====================================================================");
console.log(`Results: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);
console.log("=====================================================================");

if (failCount > 0) {
  process.exit(1);
}
