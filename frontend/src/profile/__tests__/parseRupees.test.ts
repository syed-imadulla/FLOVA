import { parseOptionalRupees, parseRequiredRupees } from "../parseRupees";
import { assertStrictEqual } from "../../engine/__tests__/testUtils";

console.log("=================================================");
console.log("FLOVA parseRupees Unit Tests");
console.log("=================================================");

// parseOptionalRupees tests
// 1. "" -> null
const resEmpty = parseOptionalRupees("");
assertStrictEqual(resEmpty.ok, true, "Empty string should be ok");
if (resEmpty.ok) assertStrictEqual(resEmpty.paise, null, "Empty string should yield null");
console.log('  ✔ optional: "" -> null');

// 2. "200" -> 20000
const res200 = parseOptionalRupees("200");
assertStrictEqual(res200.ok, true, "200 should be ok");
if (res200.ok) assertStrictEqual(res200.paise, 20000, "200 should yield 20000 paise");
console.log('  ✔ optional: "200" -> 20000');

// 3. "99.5" -> 9950
const res995 = parseOptionalRupees("99.5");
assertStrictEqual(res995.ok, true, "99.5 should be ok");
if (res995.ok) assertStrictEqual(res995.paise, 9950, "99.5 should yield 9950 paise");
console.log('  ✔ optional: "99.5" -> 9950');

// 4. "-5" rejected
const resNeg = parseOptionalRupees("-5");
assertStrictEqual(resNeg.ok, false, "-5 should be rejected");
console.log('  ✔ optional: "-5" rejected');

// 5. "12.345" rejected
const resDec = parseOptionalRupees("12.345");
assertStrictEqual(resDec.ok, false, "12.345 should be rejected");
console.log('  ✔ optional: "12.345" rejected');

// 6. "abc" rejected
const resAbc = parseOptionalRupees("abc");
assertStrictEqual(resAbc.ok, false, "abc should be rejected");
console.log('  ✔ optional: "abc" rejected');

// 7. "100001" rejected
const resMax = parseOptionalRupees("100001");
assertStrictEqual(resMax.ok, false, "100001 should be rejected");
console.log('  ✔ optional: "100001" rejected');

// parseRequiredRupees tests
// 8. "" rejected -> "Enter an amount"
const reqEmpty = parseRequiredRupees("");
assertStrictEqual(reqEmpty.ok, false, 'Required: "" should be rejected');
if (!reqEmpty.ok) assertStrictEqual(reqEmpty.message, "Enter an amount");
console.log('  ✔ required: "" rejected with "Enter an amount"');

// 9. "0" rejected -> "Amount must be greater than 0"
const reqZero = parseRequiredRupees("0");
assertStrictEqual(reqZero.ok, false, 'Required: "0" should be rejected');
if (!reqZero.ok) assertStrictEqual(reqZero.message, "Amount must be greater than 0");
console.log('  ✔ required: "0" rejected with "Amount must be greater than 0"');

// 10. "650" -> 65000 paise
const req650 = parseRequiredRupees("650");
assertStrictEqual(req650.ok, true, 'Required: "650" should be ok');
if (req650.ok) assertStrictEqual(req650.paise, 65000, 'Required: "650" should yield 65000 paise');
console.log('  ✔ required: "650" -> 65000');

console.log("-------------------------------------------------");
console.log("All parseRupees tests passed successfully!");
console.log("=================================================");
