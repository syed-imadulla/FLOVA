import { todayLocalISO } from "../dates";
import { assertStrictEqual } from "../../engine/__tests__/testUtils";

console.log("=================================================");
console.log("FLOVA dates Unit Tests");
console.log("=================================================");

// Test specific date (Month is 0-indexed in JS Date: 10 = November)
const d1 = new Date(2026, 10, 20, 2, 30, 0); // 2026-11-20 at 2:30 AM local
const iso1 = todayLocalISO(d1);
assertStrictEqual(iso1, "2026-11-20", "Should format local date YYYY-MM-DD correctly");
console.log('  ✔ formats local morning timestamp as "2026-11-20"');

const d2 = new Date(2026, 0, 5, 23, 45, 0); // 2026-01-05
const iso2 = todayLocalISO(d2);
assertStrictEqual(iso2, "2026-01-05", "Should format single digit month and day with padding");
console.log('  ✔ formats single-digit month and day with padding as "2026-01-05"');

console.log("-------------------------------------------------");
console.log("All dates tests passed successfully!");
console.log("=================================================");
