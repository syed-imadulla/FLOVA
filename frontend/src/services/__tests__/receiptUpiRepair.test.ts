// =====================================================================
// FLOVA Phase 16: Complete Receipt & UPI Extraction Repair Unit Tests
// Verifies 20MB image validation, format restrictions, line-item parsing,
// arithmetic reconciliation, anti-hallucination guardrails, and UPI status.
// =====================================================================

declare const process: any;

import {
  validateImageFile,
  MAX_IMAGE_FILE_SIZE_BYTES,
} from "../imageOptimizer";
import {
  extractReceiptFallback,
  checkDuplicateUpiReference,
} from "../receipt";
import { mockState, resetMockState } from "./mockSupabase";

function assertEqual<T>(actual: T, expected: T, msg?: string): void {
  if (actual !== expected) {
    throw new Error(`${msg ? msg + ": " : ""}Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertTrue(condition: boolean, msg?: string): void {
  if (!condition) {
    throw new Error(msg || "Assertion failed: expected true, got false");
  }
}

function assertThrows(fn: () => void, expectedPattern?: RegExp): void {
  let threw = false;
  try {
    fn();
  } catch (err: any) {
    threw = true;
    if (expectedPattern && !expectedPattern.test(err?.message || "")) {
      throw new Error(`Expected error matching ${expectedPattern}, but got: ${err?.message}`);
    }
  }
  if (!threw) {
    throw new Error("Expected function to throw, but it did not throw.");
  }
}

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res.then(
        () => {
          console.log(`  ✔ ${name}`);
          passed++;
        },
        (err) => {
          console.error(`  ✖ ${name}:`, err);
          failed++;
        }
      );
    }
    console.log(`  ✔ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ ${name}:`, err);
    failed++;
  }
}

console.log("=====================================================================");
console.log("FLOVA Phase 16: Complete Receipt & UPI Extraction Repair Tests");
console.log("=====================================================================");

// 1. Image Validation: 20 MB file size limit and format enforcement
test("1. validateImageFile accepts files up to 20 MB in supported formats", () => {
  const file19Mb = {
    name: "receipt.jpg",
    size: 19 * 1024 * 1024,
    type: "image/jpeg",
  } as File;
  validateImageFile(file19Mb);

  const filePng = {
    name: "screenshot.png",
    size: 5 * 1024 * 1024,
    type: "image/png",
  } as File;
  validateImageFile(filePng);

  const fileWebp = {
    name: "receipt.webp",
    size: 2 * 1024 * 1024,
    type: "image/webp",
  } as File;
  validateImageFile(fileWebp);
});

test("2. validateImageFile rejects files > 20 MB with descriptive error", () => {
  const file21Mb = {
    name: "huge_receipt.jpg",
    size: MAX_IMAGE_FILE_SIZE_BYTES + 1024,
    type: "image/jpeg",
  } as File;

  assertThrows(
    () => validateImageFile(file21Mb),
    /exceeds the 20 MB limit/i
  );
});

test("3. validateImageFile rejects unsupported file formats", () => {
  const filePdf = {
    name: "document.pdf",
    size: 1024 * 1024,
    type: "application/pdf",
  } as File;

  assertThrows(
    () => validateImageFile(filePdf),
    /Unsupported file format/i
  );
});

// 4. Accurate Receipt Extraction with Subtotal, Taxes & Discounts
test("4. extractReceiptFallback parses amounts and subtotal/tax/discount", () => {
  const receiptText = `
    Sharma Supermarket
    Date: 2026-11-20
    Subtotal: Rs. 400.00
    GST: Rs. 20.00
    Discount: Rs. 10.00
    Total Payable: Rs. 410.00
  `;

  const cand = extractReceiptFallback(receiptText);
  assertEqual(cand.amountPaise, 41000);
  assertEqual(cand.subtotalPaise, 40000);
  assertEqual(cand.taxPaise, 2000);
  assertEqual(cand.discountPaise, 1000);
  assertEqual(cand.arithmeticDiscrepancy, null);
  assertEqual(cand.date, "2026-11-20");
  assertEqual(cand.extractedDate, "2026-11-20");
  assertEqual(cand.dateFallback, false);
});

// 5. Arithmetic Reconciliation: Flags discrepancies when math doesn't match
test("5. Arithmetic Reconciliation detects mismatch between subtotal/tax/discount and total", () => {
  const mismatchText = `
    Cafe Coffee Break
    Subtotal: Rs. 500.00
    Tax: Rs. 50.00
    Discount: Rs. 0.00
    Total Amount: Rs. 600.00
  `;

  const cand = extractReceiptFallback(mismatchText);
  assertEqual(cand.amountPaise, 60000);
  assertEqual(cand.subtotalPaise, 50000);
  assertEqual(cand.taxPaise, 5000);
  assertTrue(cand.arithmeticDiscrepancy !== null, "Should flag arithmetic discrepancy");
  assertTrue(cand.arithmeticDiscrepancy!.includes("does not match final total"), "Discrepancy message should be informative");
});

// 6. Anti-Hallucination: Does not mistake phone numbers or GSTIN for amount
test("6. Anti-Hallucination rejects GST numbers and 10-digit phone numbers as amounts", () => {
  const invoiceWithGst = `
    Indian Oil Petrol Bunk
    GSTIN: 29ABCDE1234F1Z5
    Helpline: 9876543210
    Bill No: 887654
    Total Amount: Rs. 650.00
  `;

  const cand = extractReceiptFallback(invoiceWithGst);
  assertEqual(cand.amountPaise, 65000, "Must extract 650.00 and not GSTIN or phone number");
  assertEqual(cand.category, "fuel");
  assertEqual(cand.expenseType, "work");
});

// 7. Accurate UPI Screenshot Extraction: Google Pay, PhonePe, Paytm, CRED
test("7. UPI extraction correctly classifies UPI apps and transaction reference", () => {
  const gpayText = `
    Paid to Ramesh Kumar
    ₹1,450.00
    Google Pay
    UPI transaction ID: 432109876543
    Paid on 21 Nov 2026
    Completed
  `;
  const gpayCand = extractReceiptFallback(gpayText);
  assertEqual(gpayCand.amountPaise, 145000);
  assertEqual(gpayCand.upiApp, "google_pay");
  assertEqual(gpayCand.upiReference, "432109876543");
  assertEqual(gpayCand.paymentStatus, "successful");
  assertEqual(gpayCand.merchant, "Ramesh Kumar");

  const phonePeText = `
    Sent to Green Groceries
    Rs. 320.00
    PhonePe
    UTR: 654321098765
    Payment Successful
  `;
  const phonePeCand = extractReceiptFallback(phonePeText);
  assertEqual(phonePeCand.amountPaise, 32000);
  assertEqual(phonePeCand.upiApp, "phonepe");
  assertEqual(phonePeCand.upiReference, "654321098765");
  assertEqual(phonePeCand.paymentStatus, "successful");
});

// 8. UPI Status Detection: Correctly distinguishes pending and failed payments
test("8. UPI status detection identifies pending and failed payments", () => {
  const pendingText = `
    Paid to Bike Repairs
    ₹800.00
    Paytm
    UPI Ref: 112233445566
    Payment Pending - Awaiting bank confirmation
  `;
  const pendingCand = extractReceiptFallback(pendingText);
  assertEqual(pendingCand.paymentStatus, "pending");
  assertTrue(pendingCand.needsReview, "Pending payments must require review");

  const failedText = `
    Sent to Electrician
    ₹400.00
    CRED
    Txn ID: 998877665544
    Payment Failed - Bank server down
  `;
  const failedCand = extractReceiptFallback(failedText);
  assertEqual(failedCand.paymentStatus, "failed");
  assertTrue(failedCand.needsReview, "Failed payments must require review");
});

// 9. Mandatory Date Fallback Rule
test("9. Mandatory Date Fallback defaults missing date to today", () => {
  const receiptNoDate = `
    Vegetable Stall
    Amount: Rs. 180.00
    Paid cash
  `;
  const cand = extractReceiptFallback(receiptNoDate);
  assertEqual(cand.amountPaise, 18000);
  assertEqual(cand.extractedDate, null);
  assertEqual(cand.dateFallback, true);
  assertTrue(cand.date !== null, "Must populate date with today");
});

// 10. Duplicate UPI Reference Alert
test("10. checkDuplicateUpiReference flags duplicate UTR from database", async () => {
  resetMockState();
  mockState.transactions = [
    {
      id: "tx-existing-123",
      user_id: "user-1",
      type: "expense",
      amount: "500.00",
      description: "Grocery payment UPI Ref: 987654321098",
      created_at: new Date().toISOString(),
    } as any,
  ];

  const duplicateId = await checkDuplicateUpiReference("987654321098");
  assertEqual(duplicateId, "tx-existing-123", "Must identify existing transaction with same reference");

  const newRefId = await checkDuplicateUpiReference("111222333444");
  assertEqual(newRefId, null, "Unused reference returns null");
});

// Print results summary
setTimeout(() => {
  console.log("=====================================================================");
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("=====================================================================");
  if (failed > 0) {
    if (typeof process !== "undefined" && process.exit) process.exit(1);
  }
}, 50);
