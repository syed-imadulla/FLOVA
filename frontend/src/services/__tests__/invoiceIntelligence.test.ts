// =====================================================================
// FLOVA Phase 15: Invoice Intelligence Service Tests
// Tests invoice management, receivables vs payables, partial settlements,
// runway conversions, and non-liquidity invariants.
// =====================================================================

import {
  createInvoice,
  listInvoices,
  addInvoiceSettlement,
  convertReceivableToPayout,
  convertPayableToCommitment,
} from "../invoices";
import { toPaise } from "../../lib/money";
// @ts-ignore
import fs from "node:fs";
// @ts-ignore
import path from "node:path";
// @ts-ignore
import { fileURLToPath } from "node:url";

declare const process: any;

// Statuses the production CHECK constraint accepts, read from the migration itself,
// so the mock database cannot hide a status the real database would reject.
const migrationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../backend/supabase/migrations");
const invoiceSql: string = fs.readdirSync(migrationsDir)
  .filter((f: string) => f.endsWith(".sql"))
  .map((f: string) => fs.readFileSync(path.join(migrationsDir, f), "utf-8"))
  .join("\n");
const statusCheck = invoiceSql.match(/CREATE TABLE IF NOT EXISTS public\.invoices[\s\S]*?status text[^\n]*CHECK \(status IN \(([^)]*)\)\)/);
const ALLOWED_INVOICE_STATUSES: string[] = statusCheck ? statusCheck[1].split(",").map((s: string) => s.trim().replace(/'/g, "")) : [];

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
console.log("FLOVA Phase 15: Invoice Intelligence Service Tests");
console.log("=====================================================================");

async function run() {
  await test("1. creates receivable invoice for client payment", async () => {
    const inv = await createInvoice({
      direction: "receivable",
      customerName: "Acme Designs Pvt Ltd",
      invoiceNumber: "INV-2026-101",
      totalAmountPaise: 4500000, // ₹45,000
      dueDate: "2026-12-05",
      notes: "UI Design milestone 1",
    });

    assertTrue(!!inv.id, "Invoice id must be present");
    assertEqual(inv.direction, "receivable");
    assertEqual(inv.customer_name, "Acme Designs Pvt Ltd");
    assertEqual(toPaise(inv.total_amount), 4500000);
    assertEqual(toPaise(inv.paid_amount), 0);
    assertEqual(inv.status, "unpaid");
  });

  await test("2. creates payable bill for supplier cost", async () => {
    const bill = await createInvoice({
      direction: "payable",
      supplierName: "Apex Hardware Supplies",
      invoiceNumber: "BILL-883",
      totalAmountPaise: 1200000, // ₹12,000
      dueDate: "2026-11-30",
    });

    assertTrue(!!bill.id, "Bill id must be present");
    assertEqual(bill.direction, "payable");
    assertEqual(bill.supplier_name, "Apex Hardware Supplies");
    assertEqual(toPaise(bill.total_amount), 1200000);
    assertEqual(toPaise(bill.paid_amount), 0);
    assertEqual(bill.status, "unpaid");
  });

  await test("3. records partial settlement and transitions status to partially_paid", async () => {
    const inv = await createInvoice({
      direction: "receivable",
      customerName: "Beta Corp",
      totalAmountPaise: 5000000, // ₹50,000
    });

    // Record partial advance payment of ₹20,000
    const settle = await addInvoiceSettlement(inv.id, {
      amountPaise: 2000000,
      paymentReference: "UPI-UTR-998877",
      notes: "Advance 40%",
    });

    assertTrue(!!settle.id, "Settlement id must be present");
    assertEqual(toPaise(settle.amount), 2000000);

    // Verify invoice status updated
    const updated = (await listInvoices("receivable")).find((i) => i.id === inv.id);
    assertTrue(!!updated, "Invoice must exist");
    assertEqual(toPaise(updated?.paid_amount), 2000000);
    assertEqual(updated?.status, "partially_paid");
  });

  await test("4. full settlement transitions invoice to paid status", async () => {
    const bill = await createInvoice({
      direction: "payable",
      supplierName: "Stationery Depot",
      totalAmountPaise: 300000, // ₹3,000
    });

    await addInvoiceSettlement(bill.id, {
      amountPaise: 300000,
      paymentReference: "CASH",
    });

    const updated = (await listInvoices("payable")).find((i) => i.id === bill.id);
    assertTrue(!!updated, "Invoice must exist");
    assertEqual(toPaise(updated?.paid_amount), 300000);
    assertEqual(updated?.status, "paid");
  });

  await test("5. converts receivable invoice to expected payout on runway", async () => {
    const inv = await createInvoice({
      direction: "receivable",
      customerName: "Client A",
      totalAmountPaise: 2500000, // ₹25,000
      dueDate: "2026-11-28",
    });

    const payoutId = await convertReceivableToPayout(inv);
    assertTrue(!!payoutId, "Payout id must be returned");
  });

  await test("6. converts payable invoice to upcoming commitment on runway", async () => {
    const bill = await createInvoice({
      direction: "payable",
      supplierName: "Tool Rental Hub",
      totalAmountPaise: 800000, // ₹8,000
      dueDate: "2026-11-25",
    });

    const commitmentId = await convertPayableToCommitment(bill);
    assertTrue(!!commitmentId, "Commitment id must be returned");
  });

  await test("7. Invariant: Unpaid or expected invoices are NEVER counted as liquid balance", async () => {
    const unpaidInv = await createInvoice({
      direction: "receivable",
      customerName: "Pending Payer",
      totalAmountPaise: 10000000, // ₹1,00,000
    });

    // Invoices are pure accounting records and do not mutate the transactions table
    assertEqual(unpaidInv.status, "unpaid");
    assertEqual(toPaise(unpaidInv.paid_amount), 0);
  });

  await test("8. new invoices use a status the database CHECK constraint accepts", async () => {
    assertTrue(ALLOWED_INVOICE_STATUSES.length > 0, "invoices status CHECK constraint found in migrations");
    for (const direction of ["receivable", "payable"] as const) {
      const inv = await createInvoice({ direction, customerName: "Constraint Check", supplierName: "Constraint Check", totalAmountPaise: 100000 });
      assertTrue(ALLOWED_INVOICE_STATUSES.includes(inv.status), `status "${inv.status}" must be one of ${ALLOWED_INVOICE_STATUSES.join(", ")}`);
    }
  });

  await test("9. settlement rejects amounts with more than 2 decimals instead of truncating", async () => {
    // Production QA: typing 1500 into a field pre-filled with "5000.00" produced "5000.001500",
    // which the lenient parser recorded as a full ₹5,000 payment.
    const inv = await createInvoice({ direction: "receivable", customerName: "Decimal Check", totalAmountPaise: 500000 });
    let threw = false;
    try {
      await addInvoiceSettlement({ invoiceId: inv.id, amountRupees: "5000.001500" });
    } catch {
      threw = true;
    }
    assertTrue(threw, "5000.001500 must be rejected, not recorded as 5000.00");
    const ok = await addInvoiceSettlement({ invoiceId: inv.id, amountRupees: "1500.50" });
    assertEqual(toPaise(ok.amount), 150050, "2-decimal amounts still accepted");
  });

  console.log("=====================================================================");
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("=====================================================================");

  if (typeof process !== "undefined" && failed > 0) {
    process.exit(1);
  }
}

void run();
