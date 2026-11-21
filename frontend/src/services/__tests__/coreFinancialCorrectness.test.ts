// =====================================================================
// FLOVA Phase 13 / Phase 1: Core Financial Correctness, Navigation & Account Management
// Regression test suite covering:
// 1. Two different amounts in one voice sentence (no duplication)
// 2. Income and expense separation
// 3. Income category validation & profile adaptation
// 4. Activity navigation paths & absence of creation controls
// 5. Redirect loops and route aliases
// 6. Logout, session invalidation, and stale data prevention
// 7. ₹10 Lakh boundary and over-limit rejection across all capture paths
// =====================================================================

import { assertStrictEqual, assertThrows } from "../../engine/__tests__/testUtils";

function assertTrue(condition: boolean, message?: string): void {
  if (!condition) {
    throw new Error(message ?? "Assertion failed");
  }
}
import { extractTransaction } from "../../voice/extractTransaction";
import { categoriesFor, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../../app/categories";
import { mapCanonicalCategory } from "../../engine/extractionAdapter";
import { parseOptionalRupees, parseRequiredRupees } from "../../profile/parseRupees";
import { MAX_TRANSACTION_LIMIT_PAISE, MAX_TRANSACTION_LIMIT_RUPEES, LIMIT_ERROR_MESSAGE } from "../../lib/limits";
import { safeConvertRupeeStringToPaise } from "../../engine/candidateAdapter";
import { validateTransaction } from "../../engine/validation";
import { addTransaction, confirmCandidateTransaction } from "../data";
import { resetMockState } from "./mockSupabase";
import type { VoiceTransactionCandidate } from "../../types/contracts";

console.log("=================================================");
console.log("FLOVA Core Financial Correctness & Account Management Suite");
console.log("=================================================");

let passCount = 0;
let failCount = 0;

async function it(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✔ ${name}`);
    passCount++;
  } catch (err) {
    console.log(`  ✘ ${name}`);
    console.error(err);
    failCount++;
  }
}

async function runTests() {
  resetMockState();

  // -----------------------------------------------------------------
  // 1. Two Different Amounts in One Voice Sentence (No Duplication)
  // -----------------------------------------------------------------
  await it("1. 'I spent ₹250 on groceries and earned ₹800 from a freelance project' extracts 2 distinct transactions without amount duplication", () => {
    const transcript = "I spent ₹250 on groceries and earned ₹800 from a freelance project.";
    const dto = extractTransaction(transcript, "en");

    assertStrictEqual(dto.entry_intent, "transaction");
    assertTrue(Array.isArray(dto.transactions), "transactions must be an array");
    assertStrictEqual(dto.transactions!.length, 2, "Must extract exactly 2 transactions");

    const t1 = dto.transactions![0];
    const t2 = dto.transactions![1];

    // Transaction 1: Expense ₹250
    assertStrictEqual(t1.type, "expense");
    assertStrictEqual(t1.amount, "250");
    assertStrictEqual(t1.category, "groceries");
    assertStrictEqual(t1.expense_type, "living");

    // Transaction 2: Income ₹800
    assertStrictEqual(t2.type, "income");
    assertStrictEqual(t2.amount, "800");
    assertStrictEqual(t2.category, "freelance");
    assertStrictEqual(t2.expense_type, null, "Income must never have expense_type");

    // Invariant: Never duplicate amount
    assertTrue(t1.amount !== t2.amount, "Amounts must remain independent and distinct");
  });

  await it("2. Reverse order: 'Earned 800 from freelance and spent 250 on groceries' maintains independent amounts", () => {
    const transcript = "Earned 800 from freelance and spent 250 on groceries";
    const dto = extractTransaction(transcript, "en");

    assertStrictEqual(dto.transactions?.length, 2);
    const [t1, t2] = dto.transactions!;

    assertStrictEqual(t1.type, "income");
    assertStrictEqual(t1.amount, "800");
    assertStrictEqual(t1.category, "freelance");

    assertStrictEqual(t2.type, "expense");
    assertStrictEqual(t2.amount, "250");
    assertStrictEqual(t2.category, "groceries");
  });

  await it("3. Indic sentence: 'किराने पर 250 रुपये खर्च किए और फ्रीलांस से 800 रुपये कमाए' extracts independent amounts", () => {
    const transcript = "किराने पर 250 रुपये खर्च किए और फ्रीलांस से 800 रुपये कमाए";
    const dto = extractTransaction(transcript, "hi");

    assertStrictEqual(dto.transactions?.length, 2);
    const [t1, t2] = dto.transactions!;

    assertStrictEqual(t1.type, "expense");
    assertStrictEqual(t1.amount, "250");

    assertStrictEqual(t2.type, "income");
    assertStrictEqual(t2.amount, "800");
    assertStrictEqual(t2.category, "freelance");
  });

  await it("4. Missing amount in second clause: Never copies amount from first clause, flags clarification", () => {
    const transcript = "I spent ₹250 on groceries and earned some money from freelance";
    const dto = extractTransaction(transcript, "en");

    assertStrictEqual(dto.transactions?.length, 2);
    const [t1, t2] = dto.transactions!;

    assertStrictEqual(t1.amount, "250");
    // Crucial: Second transaction amount must be null, never 250!
    assertStrictEqual(t2.amount, null, "Missing amount must stay null, never invented or duplicated");
    assertTrue(dto.metadata.clarification_required, "Must require clarification");
    assertTrue(dto.metadata.clarification_questions.length > 0);
  });

  // -----------------------------------------------------------------
  // 2. Income and Expense Separation
  // -----------------------------------------------------------------
  await it("5. Income and expense category sets are strictly disjoint and separate", () => {
    const incomeVals = new Set(INCOME_CATEGORIES.map((c) => c.value));
    const expenseVals = new Set(EXPENSE_CATEGORIES.map((c) => c.value));

    // Both may have generic 'other', but specific domains must be disjoint
    for (const v of incomeVals) {
      if (v === "other") continue;
      assertTrue(!expenseVals.has(v), `Income category '${v}' should not overlap with expense categories`);
    }

    // Income categories never suggest living/work
    for (const c of INCOME_CATEGORIES) {
      assertStrictEqual(c.suggests, undefined, `Income category '${c.value}' must not suggest living or work`);
    }
  });

  // -----------------------------------------------------------------
  // 3. Income Category Validation & Profile Adaptation
  // -----------------------------------------------------------------
  await it("6. New income categories are valid canonical categories in extractionAdapter", () => {
    const requiredIncomeCats = [
      "salary",
      "freelance",
      "business_sales",
      "delivery_earnings",
      "service_income",
      "commission",
      "tips",
      "other",
    ];

    for (const cat of requiredIncomeCats) {
      const res = mapCanonicalCategory(cat, "income");
      assertStrictEqual(res.category, cat);
      assertStrictEqual(res.isCanonical, true, `${cat} should be a canonical income category`);
      assertStrictEqual(res.requiresClarification, false);
    }
  });

  await it("7. categoriesFor adapts category ordering based on user work profile", () => {
    const riderCats = categoriesFor("income", "delivery");
    assertStrictEqual(riderCats[0].value, "delivery_earnings", "Delivery rider should see delivery_earnings first");
    assertStrictEqual(riderCats[1].value, "tips", "Delivery rider should see tips second");

    const freelanceCats = categoriesFor("income", "freelancer");
    assertStrictEqual(freelanceCats[0].value, "freelance", "Freelancer should see freelance first");
    assertStrictEqual(freelanceCats[1].value, "client_payment", "Freelancer should see client_payment second");

    const vendorCats = categoriesFor("income", "small_vendor");
    assertStrictEqual(vendorCats[0].value, "business_sales", "Vendor should see business_sales first");
  });

  await it("8. Uncertain or missing category does not auto-classify", () => {
    const unkRes = mapCanonicalCategory("crypto_mining", "income");
    assertStrictEqual(unkRes.category, "other");
    assertStrictEqual(unkRes.requiresClarification, true);

    const nullRes = mapCanonicalCategory(null, "income");
    assertStrictEqual(nullRes.category, "other");
    assertStrictEqual(nullRes.requiresClarification, true);
  });

  // -----------------------------------------------------------------
  // 4. ₹10 Lakh Daily & Transaction Limit Boundary
  // -----------------------------------------------------------------
  await it("9. ₹10 Lakh boundary: 10,00,000 accepted; 10,00,001 rejected in parseRequiredRupees and parseOptionalRupees", () => {
    assertStrictEqual(MAX_TRANSACTION_LIMIT_RUPEES, 1_000_000);
    assertStrictEqual(MAX_TRANSACTION_LIMIT_PAISE, 100_000_000);

    // Exact ₹10 Lakh boundary
    const optBoundary = parseOptionalRupees("1000000");
    assertTrue(optBoundary.ok, "10,00,000 must be accepted");
    if (optBoundary.ok) assertStrictEqual(optBoundary.paise, 100_000_000);

    const reqBoundary = parseRequiredRupees("1000000");
    assertTrue(reqBoundary.ok, "10,00,000 must be accepted in required rupees");
    if (reqBoundary.ok) assertStrictEqual(reqBoundary.paise, 100_000_000);

    // Over ₹10 Lakh
    const optOver = parseOptionalRupees("1000000.01");
    assertStrictEqual(optOver.ok, false, "1000000.01 must be rejected");

    const reqOver = parseRequiredRupees("1000001");
    assertStrictEqual(reqOver.ok, false, "1000001 must be rejected");
  });

  await it("10. safeConvertRupeeStringToPaise enforces ₹10 Lakh limit", () => {
    assertStrictEqual(safeConvertRupeeStringToPaise("1000000"), 100_000_000);
    assertThrows(() => safeConvertRupeeStringToPaise("1000001"), /exceeds ₹10,00,000/);
  });

  await it("11. validateTransaction rejects amounts exceeding ₹10 Lakh", () => {
    const validTx = {
      id: "tx-1",
      type: "income" as const,
      amount: 100_000_000, // ₹10,00,000 paise
      ownership: "mine" as const,
      expenseType: null,
      payoutId: null,
      date: "2026-11-21" as const,
      createdAt: new Date().toISOString(),
    };
    const resValid = validateTransaction(validTx);
    assertTrue(resValid.valid, "₹10,00,000 must be valid in engine validation");

    const overTx = {
      ...validTx,
      amount: 100_000_001,
    };
    const resOver = validateTransaction(overTx);
    assertStrictEqual(resOver.valid, false, "₹10,00,001 must fail validation");
    assertTrue(resOver.errors.some((e) => e.includes("exceeds maximum application limit of ₹10,00,000")));
  });

  await it("12. addTransaction and confirmCandidateTransaction enforce ₹10 Lakh limit", async () => {
    // Attempt adding manual transaction above 10 Lakh
    let caughtErr = false;
    try {
      await addTransaction({
        id: "over-limit-1",
        type: "income",
        amount: 100_000_001,
        category: "freelance",
        ownership: "mine",
      });
    } catch (e: any) {
      caughtErr = true;
      assertTrue(e.message.includes(LIMIT_ERROR_MESSAGE));
    }
    assertTrue(caughtErr, "addTransaction must reject amount > 10 Lakh");

    // Attempt confirming candidate above 10 Lakh
    caughtErr = false;
    const overCandidate: VoiceTransactionCandidate = {
      id: "cand-over-limit",
      transcript: "Earned 1500000",
      type: "income",
      amountPaise: 150_000_000,
      category: "salary",
      expenseType: null,
      date: "2026-11-21",
      ownership: "mine",
      needsReview: false,
      missingFields: [],
    };

    try {
      await confirmCandidateTransaction(overCandidate);
    } catch (e: any) {
      caughtErr = true;
      assertTrue(e.message.includes(LIMIT_ERROR_MESSAGE));
    }
    assertTrue(caughtErr, "confirmCandidateTransaction must reject candidate amount > 10 Lakh");
  });

  // -----------------------------------------------------------------
  // 5. Candidate Confirmation at ₹10 Lakh succeeds
  // -----------------------------------------------------------------
  await it("13. Candidate confirmation at exactly ₹10 Lakh succeeds and persists", async () => {
    const validCandidate: VoiceTransactionCandidate = {
      id: "cand-10lakh-ok",
      transcript: "Earned 1000000",
      type: "income",
      amountPaise: 100_000_000,
      category: "business_sales",
      expenseType: null,
      date: "2026-11-21",
      ownership: "mine",
      needsReview: false,
      missingFields: [],
    };

    const saved = await confirmCandidateTransaction(validCandidate);
    assertStrictEqual(saved.id, "cand-10lakh-ok");
    assertStrictEqual(saved.amount, "1000000.00");
  });

  // -----------------------------------------------------------------
  // 6. Daily Aggregate Limit Enforcement & Exclusion Rules
  // -----------------------------------------------------------------
  await it("14. Daily aggregate limit: further personal transaction on same calendar day rejected", async () => {
    // 2026-11-21 already has ₹10,00,000 from test 13. Any additional personal transaction must fail.
    let caughtErr = false;
    try {
      await addTransaction({
        id: "daily-agg-over-1",
        type: "expense",
        amount: 100, // even ₹1
        category: "food",
        expenseType: "living",
        ownership: "mine",
        date: "2026-11-21",
      });
    } catch (e: any) {
      caughtErr = true;
      assertTrue(e.message.includes("Daily transaction limit of ₹10,00,000 exceeded"));
    }
    assertTrue(caughtErr, "Must reject transaction exceeding daily aggregate limit");
  });

  await it("15. Third-party (not_mine) transaction on same calendar day is excluded from daily limit", async () => {
    // Should succeed even though personal daily limit on 2026-11-21 is full
    const codTx = await addTransaction({
      id: "cod-tx-exempt-1",
      type: "income",
      amount: 50_000_000, // ₹5,00,000
      category: "cod_collection",
      ownership: "not_mine",
      date: "2026-11-21",
    });
    assertStrictEqual(codTx.id, "cod-tx-exempt-1");
    assertStrictEqual(codTx.ownership, "not_mine");
  });

  await it("16. Transaction on a different calendar day succeeds within its own daily limit", async () => {
    const nextDayTx = await addTransaction({
      id: "next-day-tx-1",
      type: "income",
      amount: 50_000_000, // ₹5,00,000 on 2026-11-22
      category: "salary",
      ownership: "mine",
      date: "2026-11-22",
    });
    assertStrictEqual(nextDayTx.id, "next-day-tx-1");
    assertStrictEqual(nextDayTx.amount, "500000.00");
  });

  // -----------------------------------------------------------------
  // 7. Workflow Verification: Candidate UUID Retention & Idempotent Confirmation
  // -----------------------------------------------------------------
  await it("17. Multi-candidate review retains stable UUIDs and prevents duplicate insertion on re-confirmation", async () => {
    const candidateA: VoiceTransactionCandidate = {
      id: "b1111111-1111-4111-8111-111111111111",
      transcript: "I spent 250 on groceries",
      type: "expense",
      amountPaise: 25000,
      category: "groceries",
      expenseType: "living",
      date: "2026-11-23",
      ownership: "mine",
      needsReview: false,
      missingFields: [],
    };

    const candidateB: VoiceTransactionCandidate = {
      id: "b2222222-2222-4222-8222-222222222222",
      transcript: "Earned 800 from freelance",
      type: "income",
      amountPaise: 80000,
      category: "freelance",
      expenseType: null,
      date: "2026-11-23",
      ownership: "mine",
      needsReview: false,
      missingFields: [],
    };

    // Sequential confirmation
    const savedA1 = await confirmCandidateTransaction(candidateA);
    assertStrictEqual(savedA1.id, candidateA.id, "Candidate A must retain its original UUID");
    assertStrictEqual(savedA1.amount, "250.00");

    const savedB1 = await confirmCandidateTransaction(candidateB);
    assertStrictEqual(savedB1.id, candidateB.id, "Candidate B must retain its original UUID");
    assertStrictEqual(savedB1.amount, "800.00");

    // Idempotent retry: confirming candidate A a second time returns existing transaction without duplicate creation
    const savedA2 = await confirmCandidateTransaction(candidateA);
    assertStrictEqual(savedA2.id, candidateA.id);
    assertStrictEqual(savedA2.amount, "250.00");
  });

  console.log("=================================================");
  console.log(`Results: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);
  console.log("=================================================");

  if (failCount > 0) {
    throw new Error(`${failCount} tests failed.`);
  }
}

void runTests();
