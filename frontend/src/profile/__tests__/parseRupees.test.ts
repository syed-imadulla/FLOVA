import { parseOptionalRupees } from "../parseRupees";
import { assertStrictEqual } from "../../engine/__tests__/testUtils";

console.log("=================================================");
console.log("FLOVA parseRupees Unit Tests");
console.log("=================================================");

// 1. "" -> null
const resEmpty = parseOptionalRupees("");
assertStrictEqual(resEmpty.ok, true, "Empty string should be ok");
if (resEmpty.ok) assertStrictEqual(resEmpty.paise, null, "Empty string should yield null");
console.log('  ✔ "" -> null');

// 2. "200" -> 20000
const res200 = parseOptionalRupees("200");
assertStrictEqual(res200.ok, true, "200 should be ok");
if (res200.ok) assertStrictEqual(res200.paise, 20000, "200 should yield 20000 paise");
console.log('  ✔ "200" -> 20000');

// 3. "99.5" -> 9950
const res995 = parseOptionalRupees("99.5");
assertStrictEqual(res995.ok, true, "99.5 should be ok");
if (res995.ok) assertStrictEqual(res995.paise, 9950, "99.5 should yield 9950 paise");
console.log('  ✔ "99.5" -> 9950');

// 4. "-5" rejected
const resNeg = parseOptionalRupees("-5");
assertStrictEqual(resNeg.ok, false, "-5 should be rejected");
console.log('  ✔ "-5" rejected');

// 5. "12.345" rejected
const resDec = parseOptionalRupees("12.345");
assertStrictEqual(resDec.ok, false, "12.345 should be rejected");
console.log('  ✔ "12.345" rejected');

// 6. "abc" rejected
const resAbc = parseOptionalRupees("abc");
assertStrictEqual(resAbc.ok, false, "abc should be rejected");
console.log('  ✔ "abc" rejected');

// 7. "100001" rejected
const resMax = parseOptionalRupees("100001");
assertStrictEqual(resMax.ok, false, "100001 should be rejected");
console.log('  ✔ "100001" rejected');

console.log("-------------------------------------------------");
console.log("All parseRupees tests passed successfully!");
console.log("=================================================");
