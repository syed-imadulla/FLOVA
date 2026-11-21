// =====================================================================
// FLOVA Phase 14: Smart Capture, Receipt Intelligence & UPI Share Integration
// Test Suite: Physical Receipts, UPI Screenshots, Share Target & Confirm Flow
// =====================================================================

import { confirmCandidateTransaction, listTransactions, addTransaction } from "../data";
import { checkDuplicateUpiReference, extractReceipt, extractReceiptFallback } from "../receipt";
import { todayLocalISO } from "../../data/dates";
import { toPaise } from "../../lib/money";
import { mockState, resetMockState } from "./mockSupabase";
import type { ExtractedReceiptCandidate } from "../../types/contracts";
// @ts-ignore
import fs from "node:fs";
// @ts-ignore
import path from "node:path";
// @ts-ignore
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function it(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    passCount++;
    console.log(`  ✔ ${name}`);
  } catch (err) {
    failCount++;
    console.error(`  ✘ ${name}`);
    console.error(err);
  }
}

async function runTests() {
  console.log("=====================================================================");
  console.log("FLOVA Phase 14: Smart Capture, Receipt Intelligence & UPI Integration");
  console.log("=====================================================================\n");

  // -----------------------------------------------------------------
  // 1. Mandatory Date Handling: Legible Date vs Missing Date Fallback
  // -----------------------------------------------------------------
  await it("Date Handling: Clear legible receipt date is extracted and dateFallback is false", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (_fn, _opts) => {
      const candidate: ExtractedReceiptCandidate = {
        id: "cand-receipt-1",
        merchant: "More Supermarket",
        amountPaise: 45000,
        category: "groceries",
        expenseType: "living",
        date: "2026-11-15",
        needsReview: false,
        missingFields: [],
      };
      return { data: { candidate }, error: null };
    };

    const res = await extractReceipt({ text: "Receipt from More Supermarket on 2026-11-15 for Rs 450" });

    assertStrictEqual(res.date, "2026-11-15", "Preserves extracted date");
    assertStrictEqual(res.extractedDate, "2026-11-15", "Stores legible date in extractedDate");
    assertStrictEqual(res.dateFallback, false, "dateFallback flag must be false");
    assertTrue(res.scannedAt !== undefined, "Preserves scannedAt timestamp");
  });

  await it("Date Handling: Missing receipt date defaults to today's local date and sets dateFallback=true", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (_fn, _opts) => {
      const candidate: ExtractedReceiptCandidate = {
        id: "cand-receipt-2",
        merchant: "Chai Point",
        amountPaise: 6000,
        category: "food",
        expenseType: "work",
        date: null, // missing date on torn bill
        needsReview: true,
        missingFields: [],
      };
      return { data: { candidate }, error: null };
    };

    const res = await extractReceipt({ text: "Chai Point cutting chai Rs 60" });

    assertStrictEqual(res.date, todayLocalISO(), "Defaults to today's local date");
    assertStrictEqual(res.extractedDate, null, "extractedDate is null when missing");
    assertStrictEqual(res.dateFallback, true, "dateFallback flag must be true");
    assertTrue(res.scannedAt !== undefined, "Preserves scannedAt timestamp");
  });

  // -----------------------------------------------------------------
  // 2. Receipt Line Items, Subtotal, Taxes and Discounts
  // -----------------------------------------------------------------
  await it("Receipt Breakdown: Preserves line items, subtotal, taxes, and discounts with final total", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (_fn, _opts) => {
      const candidate: ExtractedReceiptCandidate = {
        id: "cand-receipt-breakdown",
        merchant: "Reliance Fresh",
        amountPaise: 118000, // Final ₹1,180.00
        subtotalPaise: 100000, // ₹1,000.00
        taxPaise: 18000, // 18% GST ₹180.00
        discountPaise: 0,
        items: [
          { name: "Olive Oil 1L", quantity: 1, price: 80000 },
          { name: "Whole Wheat Bread", quantity: 2, price: 10000 },
        ],
        category: "groceries",
        expenseType: "living",
        date: "2026-11-20",
        needsReview: false,
        missingFields: [],
      };
      return { data: { candidate }, error: null };
    };

    const res = await extractReceipt({ text: "Reliance Fresh Olive Oil Rs 800, Bread Rs 200, GST Rs 180, Total Rs 1180" });

    assertStrictEqual(res.amountPaise, 118000, "Extracts final total, not subtotal");
    assertStrictEqual(res.subtotalPaise, 100000, "Extracts subtotal");
    assertStrictEqual(res.taxPaise, 18000, "Extracts taxes");
    assertTrue(Array.isArray(res.items) && res.items.length === 2, "Preserves itemized purchases");
    assertStrictEqual(res.items![0].name, "Olive Oil 1L");
    assertStrictEqual(res.items![0].price, 80000);
  });

  // -----------------------------------------------------------------
  // 3. Anti-Hallucination & Number Parsing Safety
  // -----------------------------------------------------------------
  await it("Anti-hallucination: Rejects GSTIN, phone numbers, and invoice numbers as transaction amounts", () => {
    // Test offline heuristic parser with noisy text
    const noisyText = `
      TAX INVOICE: INV-2026-987654
      GSTIN: 29AAAAA0000A1Z5
      Helpline: +91 9876543210
      Date: 20-11-2026
      Paid to: Shell Petrol Pump
      Total Amount: ₹850.00
      UPI Ref: 432109876543
    `;

    const candidate = extractReceiptFallback(noisyText);

    assertStrictEqual(candidate.amountPaise, 85000, "Picks genuine ₹850 amount instead of phone/invoice/GST");
    assertStrictEqual(candidate.upiReference, "432109876543", "Extracts 12-digit UTR reference");
    assertStrictEqual(candidate.merchant, "Shell Petrol Pump", "Extracts merchant name");
    assertStrictEqual(candidate.date, "2026-11-20", "Extracts date correctly");
  });

  // -----------------------------------------------------------------
  // 4. UPI Screenshots: Status (Successful, Pending, Failed, Unknown)
  // -----------------------------------------------------------------
  await it("UPI Screenshot: Successful PhonePe payment extracted with UTR and app recognition", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (_fn, _opts) => {
      const candidate: ExtractedReceiptCandidate = {
        id: "cand-upi-phonepe",
        kind: "upi_screenshot",
        merchant: "Aman Auto Spares",
        amountPaise: 125000, // ₹1,250.00
        category: "vehicle",
        expenseType: "work",
        date: "2026-11-21",
        paymentStatus: "successful",
        upiReference: "432112345678",
        upiApp: "phonepe",
        needsReview: false,
        missingFields: [],
      };
      return { data: { candidate }, error: null };
    };

    const res = await extractReceipt({ text: "PhonePe Paid ₹1,250 to Aman Auto Spares UPI Ref No 432112345678 Successful" });

    assertStrictEqual(res.paymentStatus, "successful", "Status is successful");
    assertStrictEqual(res.upiApp, "phonepe", "Recognizes PhonePe");
    assertStrictEqual(res.upiReference, "432112345678", "Preserves 12-digit UPI reference");
  });

  await it("UPI Screenshot: Pending payment flags warning and needsReview", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (_fn, _opts) => {
      const candidate: ExtractedReceiptCandidate = {
        id: "cand-upi-pending",
        kind: "upi_screenshot",
        merchant: "Swiggy",
        amountPaise: 38000,
        category: "food",
        expenseType: "living",
        date: "2026-11-21",
        paymentStatus: "pending",
        upiReference: "554433221100",
        upiApp: "google_pay",
        needsReview: true,
        missingFields: [],
      };
      return { data: { candidate }, error: null };
    };

    const res = await extractReceipt({ text: "Google Pay Payment of ₹380 to Swiggy is Processing / Pending" });

    assertStrictEqual(res.paymentStatus, "pending", "Extracts pending status");
    assertStrictEqual(res.needsReview, true, "Requires user review before recording");
  });

  await it("UPI Screenshot: Failed / declined payment is extracted with failed status", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (_fn, _opts) => {
      const candidate: ExtractedReceiptCandidate = {
        id: "cand-upi-failed",
        kind: "upi_screenshot",
        merchant: "Uber India",
        amountPaise: 24000,
        category: "transport",
        expenseType: "work",
        date: "2026-11-21",
        paymentStatus: "failed",
        upiReference: "998877665544",
        upiApp: "paytm",
        needsReview: true,
        missingFields: [],
      };
      return { data: { candidate }, error: null };
    };

    const res = await extractReceipt({ text: "Paytm Payment ₹240 to Uber India Failed - Bank Server Unavailable" });

    assertStrictEqual(res.paymentStatus, "failed", "Extracts failed status");
  });

  // -----------------------------------------------------------------
  // 5. Duplicate Detection via UTR Reference
  // -----------------------------------------------------------------
  await it("Duplicate Detection: Flags duplicate warning when UPI reference already exists in database", async () => {
    resetMockState();

    // Insert an existing transaction with reference "123456789012"
    await addTransaction({
      id: "tx-existing-1",
      type: "expense",
      amount: 50000,
      category: "food",
      description: "Lunch at Sagar - UPI Ref: 123456789012",
      expenseType: "living",
      ownership: "mine",
      date: "2026-11-20",
      source: "manual",
    });

    const existingMatch = await checkDuplicateUpiReference("123456789012");
    assertStrictEqual(existingMatch, "tx-existing-1", "Detects existing transaction with same UPI reference");

    const nonExistentMatch = await checkDuplicateUpiReference("999999999999");
    assertStrictEqual(nonExistentMatch, null, "Returns null when reference is unique");
  });

  // -----------------------------------------------------------------
  // 6. Review & Single Confirmation Path (/add)
  // -----------------------------------------------------------------
  await it("Confirmation: Saving via confirmCandidateTransaction records transaction and respects financial limits", async () => {
    resetMockState();

    const candidate: ExtractedReceiptCandidate = {
      id: "cand-confirm-uuid-101",
      merchant: "Apollo Pharmacy",
      amountPaise: 75000, // ₹750.00
      type: "expense",
      category: "medical",
      expenseType: "living",
      ownership: "mine",
      date: "2026-11-21",
      description: "Apollo Pharmacy - Medicines",
      needsReview: false,
      missingFields: [],
      kind: "physical_receipt",
      paymentStatus: "successful",
    };

    // User confirms candidate
    const tx = await confirmCandidateTransaction(candidate);

    assertStrictEqual(tx.id, "cand-confirm-uuid-101", "Preserves candidate UUID as transaction ID");
    assertStrictEqual(toPaise(tx.amount), 75000, "Records correct paise amount");
    assertStrictEqual(tx.category, "medical");
    assertStrictEqual(tx.expense_type, "living");

    const list = await listTransactions();
    assertStrictEqual(list.length, 1, "Exactly one transaction inserted");
  });

  await it("Idempotency: Re-confirming same candidate ID does not create duplicate transactions", async () => {
    resetMockState();

    const candidate: ExtractedReceiptCandidate = {
      id: "cand-idempotent-202",
      merchant: "D Mart",
      amountPaise: 150000,
      type: "expense",
      category: "groceries",
      expenseType: "living",
      ownership: "mine",
      date: "2026-11-21",
      needsReview: false,
      missingFields: [],
    };

    // First confirmation
    await confirmCandidateTransaction(candidate);
    let list = await listTransactions();
    assertStrictEqual(list.length, 1);

    // Second confirmation (e.g. user double-clicked or network retried)
    await confirmCandidateTransaction(candidate);
    list = await listTransactions();
    assertStrictEqual(list.length, 1, "Idempotent write: count remains 1");
  });

  await it("Zero DB writes before confirmation: Rejecting draft leaves 0 rows in database", async () => {
    resetMockState();

    mockState.functionsInvokeHandler = async (_fn, _opts) => {
      const candidate: ExtractedReceiptCandidate = {
        id: "cand-discard-303",
        merchant: "Zomato",
        amountPaise: 34000,
        category: "food",
        expenseType: "living",
        date: "2026-11-21",
        needsReview: false,
        missingFields: [],
      };
      return { data: { candidate }, error: null };
    };

    // User extracted receipt
    const res = await extractReceipt({ text: "Zomato dinner ₹340" });
    assertTrue(res.amountPaise === 34000, "Extracted candidate successfully");

    // User chooses to discard without confirming
    const list = await listTransactions();
    assertStrictEqual(list.length, 0, "Zero database rows before confirmation");
  });

  // -----------------------------------------------------------------
  // 7. PWA Share Target & Manifest Invariants
  // -----------------------------------------------------------------
  await it("PWA Share Target: manifest.webmanifest includes share_target POST /share-target", () => {
    const manifestPath = path.resolve(__dirname, "../../../public/manifest.webmanifest");
    assertTrue(fs.existsSync(manifestPath), "manifest.webmanifest exists");

    const content = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    assertTrue(content.share_target !== undefined, "manifest defines share_target");
    assertStrictEqual(content.share_target.action, "/share-target", "Share action is /share-target");
    assertStrictEqual(content.share_target.method, "POST", "Share method is POST");
    assertStrictEqual(content.share_target.enctype, "multipart/form-data", "enctype is multipart/form-data");
    assertTrue(content.share_target.params?.files !== undefined, "Accepts shared files");
    assertStrictEqual(content.share_target.params.files[0]?.name, "media", "File parameter is 'media'");
  });

  await it("PWA Service Worker: sw.js intercepts /share-target and caches to flova-shared-cache", () => {
    const swPath = path.resolve(__dirname, "../../../public/sw.js");
    assertTrue(fs.existsSync(swPath), "sw.js exists");

    const swContent = fs.readFileSync(swPath, "utf-8");
    assertTrue(swContent.includes("/share-target"), "Service worker handles /share-target endpoint");
    assertTrue(swContent.includes("flova-shared-cache"), "Uses dedicated flova-shared-cache");
    assertTrue(swContent.includes("/catch?shared=1"), "Redirects shared payload to /catch?shared=1");
  });

  console.log("\n=====================================================================");
  console.log(`Results: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);
  console.log("=====================================================================\n");

  if (failCount > 0) {
    (globalThis as any).process?.exit(1);
  }
}

runTests();
