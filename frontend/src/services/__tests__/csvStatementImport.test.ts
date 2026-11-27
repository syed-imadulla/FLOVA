import test from "node:test";
import assert from "node:assert/strict";
import {
  applyColumnMapping,
  parseBankStatementCsv,
  parseStatementAmount,
  parseStatementDate,
  validateCsvFileMeta,
} from "../../engine/csvStatementParser";
import {
  classifyAndDeduplicateRows,
  summarizeClassifiedRows,
} from "../../engine/csvTransactionClassifier";
import {
  analyzeCsvStatement,
  confirmAndImportCsvRows,
  listCsvImportHistory,
} from "../csvImport";
import { mockState, resetMockState } from "./mockSupabase";

test("parses Indian dates and currency amounts into exact integer paise", () => {
  assert.equal(parseStatementDate("27/11/2026"), "2026-11-27");
  assert.equal(parseStatementDate("27-Nov-26"), "2026-11-27");
  assert.equal(parseStatementDate("2026-11-05 14:22:00"), "2026-11-05");
  assert.equal(parseStatementDate("30/02/2026"), null);

  assert.deepEqual(parseStatementAmount("₹1,23,456.50"), { paise: 12345650, sign: 1, explicitIndicator: null });
  assert.deepEqual(parseStatementAmount("Rs. 450"), { paise: 45000, sign: 1, explicitIndicator: null });
  assert.deepEqual(parseStatementAmount("(1,200.25)"), { paise: 120025, sign: -1, explicitIndicator: null });
  assert.deepEqual(parseStatementAmount("500.00 CR"), { paise: 50000, sign: 1, explicitIndicator: "credit" });
  assert.deepEqual(parseStatementAmount("-890.10"), { paise: 89010, sign: -1, explicitIndicator: null });
});

test("rejects empty, non-csv, and malformed files", () => {
  assert.ok(validateCsvFileMeta("statement.pdf", 1024));
  assert.ok(validateCsvFileMeta("statement.csv", 0));
  assert.throws(() => parseBankStatementCsv("just one header line"), /header row/i);
});

test("parses bank statement with UTF-8 BOM, banner rows, quoted commas, and separate debit/credit columns", () => {
  const csv = [
    "\uFEFFAccount Statement - HDFC Bank",
    "Account No,XXXX1234",
    "Txn Date,Narration,Chq/Ref No,Withdrawal Amt,Deposit Amt,Closing Balance",
    '25/11/2026,"UPI/SWIGGY, ORDER 123",UTR9001,240.00,,5000.00',
    '26/11/2026,"NEFT/ZOMATO PAYOUT",UTR9002,,1250.50,6250.50',
    '26/11/2026,"HPCL PETROL PUMP",UTR9003,300.00,,5950.50',
  ].join("\n");

  const parsed = parseBankStatementCsv(csv);
  assert.equal(parsed.needsManualMapping, false);
  assert.equal(parsed.rows.length, 3);
  assert.equal(parsed.rows[0].direction, "debit");
  assert.equal(parsed.rows[0].amountPaise, 24000);
  assert.equal(parsed.rows[0].reference, "UTR9001");
  assert.equal(parsed.rows[1].direction, "credit");
  assert.equal(parsed.rows[1].amountPaise, 125050);
});

test("parses single amount column with Dr/Cr indicator and negative amounts", () => {
  const csv = [
    "Transaction Date,Particulars,Amount,Dr/Cr",
    "27-11-2026,DMART GROCERIES,850.00,DR",
    "27-11-2026,CLIENT INVOICE PAYMENT,4500.00,CR",
    "27-11-2026,RANDOM TRANSFER,-200.00,",
  ].join("\n");

  const parsed = parseBankStatementCsv(csv);
  assert.equal(parsed.needsManualMapping, false);
  assert.equal(parsed.rows[0].direction, "debit");
  assert.equal(parsed.rows[0].amountPaise, 85000);
  assert.equal(parsed.rows[1].direction, "credit");
  assert.equal(parsed.rows[1].amountPaise, 450000);
  assert.equal(parsed.rows[2].direction, "debit");
  assert.equal(parsed.rows[2].amountPaise, 20000);
});

test("detects ambiguous headers for manual mapping and applies manual mapping", () => {
  const csv = [
    "ColA,ColB,ColC",
    "27/11/2026,UBER TRIP,180.00",
  ].join("\n");

  const parsed = parseBankStatementCsv(csv);
  assert.equal(parsed.needsManualMapping, true);

  const mapped = applyColumnMapping(parsed.rawRows, parsed.headerRowIndex, {
    date: 0,
    description: 1,
    debit: 2,
    credit: null,
    amount: null,
    type: null,
    balance: null,
    reference: null,
  });
  assert.equal(mapped.length, 1);
  assert.equal(mapped[0].amountPaise, 18000);
  assert.equal(mapped[0].direction, "debit");
});

test("enforces accounting rules for internal transfers, borrowed money, and invalid rows", () => {
  const csv = [
    "Date,Description,Debit,Credit,Ref",
    "27/11/2026,SELF TRANSFER TO OWN ACCOUNT,2000.00,,REF1",
    "27/11/2026,KREDITBEE LOAN DISBURSAL,,5000.00,REF2",
    "27/11/2026,SWIGGY PAYOUT,,1800.00,REF3",
    "27/11/2026,HPCL FUEL,450.00,,REF4",
    "bad-date,INVALID ROW,100.00,,REF5",
    "27/11/2026,HUGE ROW,1500000.00,,REF6",
  ].join("\n");

  const parsed = parseBankStatementCsv(csv);
  const classified = classifyAndDeduplicateRows(parsed.rows, []);
  const summary = summarizeClassifiedRows(classified);

  assert.equal(summary.transferCount, 1);
  assert.equal(summary.borrowedCount, 1);
  assert.equal(summary.incomeCount, 1);
  assert.equal(summary.expenseCount, 1);
  assert.equal(summary.invalidCount, 2);
  assert.equal(summary.readyToImportCount, 2); // Only Swiggy payout + HPCL fuel
});

test("requires explicit confirmation, deduplicates repeated imports, handles partial failure, and isolates users", async () => {
  // Ensure localStorage exists in Node test environment
  if (typeof globalThis.localStorage === "undefined") {
    const store = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    };
  }

  resetMockState();
  mockState.activeUserId = "user-csv-1";

  const csv = [
    "Date,Narration,Debit,Credit,UTR",
    "27/11/2026,ZOMATO EARNINGS,,1200.00,UTR101",
    "27/11/2026,SHELL PETROL,350.00,,UTR102",
    "27/11/2026,SHELL PETROL,350.00,,UTR102", // duplicate inside same CSV
  ].join("\n");

  const preview1 = await analyzeCsvStatement({
    fileName: "nov-statement.csv",
    sizeBytes: csv.length,
    rawText: csv,
  });
  assert.equal(preview1.summary.duplicateCount, 1);
  assert.equal(preview1.summary.readyToImportCount, 2);

  // Must reject unconfirmed import
  await assert.rejects(
    () =>
      confirmAndImportCsvRows({
        userId: "user-csv-1",
        fileName: "nov-statement.csv",
        rows: preview1.rows,
        confirmed: false,
      }),
    /confirmation is required/i
  );

  // Confirm import
  const res1 = await confirmAndImportCsvRows({
    userId: "user-csv-1",
    fileName: "nov-statement.csv",
    rows: preview1.rows,
    confirmed: true,
  });
  assert.equal(res1.importedCount, 2);
  assert.equal(res1.skippedDuplicates, 1);
  assert.equal(listCsvImportHistory("user-csv-1").length, 1);

  // Repeated import attempt detects all as duplicates
  const preview2 = await analyzeCsvStatement({
    fileName: "nov-statement.csv",
    sizeBytes: csv.length,
    rawText: csv,
  });
  assert.equal(preview2.summary.duplicateCount, 3);
  assert.equal(preview2.summary.readyToImportCount, 0);

  // Partial failure test: fail 1st row, succeed 2nd row
  const csv3 = [
    "Date,Narration,Debit,Credit,UTR",
    "28/11/2026,AIRTEL RECHARGE,299.00,,UTR103",
    "28/11/2026,SWIGGY EARNINGS,,900.00,UTR104",
  ].join("\n");
  const preview3 = await analyzeCsvStatement({
    fileName: "nov-part2.csv",
    sizeBytes: csv3.length,
    rawText: csv3,
  });
  let callCount = 0;
  mockState.insertHandler = async (payload: any) => {
    callCount++;
    if (callCount === 1) {
      return { data: null, error: { message: "Simulated network error" } };
    }
    return {
      data: {
        id: payload.id,
        user_id: mockState.activeUserId,
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    };
  };
  const resFail = await confirmAndImportCsvRows({
    userId: "user-csv-1",
    fileName: "nov-part2.csv",
    rows: preview3.rows,
    confirmed: true,
  });
  mockState.insertHandler = undefined;
  assert.equal(resFail.importedCount, 1);
  assert.equal(resFail.failedRows.length, 1);

  // Cross-user isolation: user-csv-2 has isolated import history and fresh RLS session
  resetMockState();
  mockState.activeUserId = "user-csv-2";
  const previewUser2 = await analyzeCsvStatement({
    fileName: "nov-statement.csv",
    sizeBytes: csv.length,
    rawText: csv,
  });
  assert.equal(previewUser2.summary.readyToImportCount, 2);
  assert.equal(listCsvImportHistory("user-csv-2").length, 0);
  assert.equal(listCsvImportHistory("user-csv-1").length, 2);
});

test("handles escaped quotes, CRLF, formula injection, and large CSVs safely", () => {
  const crlfCsv =
    'Date,Description,Amount,Type\r\n27/11/2026,"=CMD|calc ""quoted"" item",150.00,DR\r\n';
  const parsed = parseBankStatementCsv(crlfCsv);
  assert.equal(parsed.rows.length, 1);
  assert.ok(parsed.rows[0].description.startsWith("'=CMD"));
  assert.ok(parsed.rows[0].description.includes('"quoted"'));

  // 2,500-row synthetic statement parses cleanly
  const lines = ["Date,Description,Debit,Credit,Ref"];
  for (let i = 0; i < 2500; i++) {
    lines.push(`27/11/2026,SWIGGY ORDER ${i},120.00,,UTR${i}`);
  }
  const large = parseBankStatementCsv(lines.join("\n"));
  assert.equal(large.rows.length, 2500);
});

test("enforces accounting safety for refunds, cash movements, reversed/pending, and ambiguous rows", () => {
  const csv = [
    "Date,Narration,Debit,Credit,UTR",
    "27/11/2026,AMAZON REFUND,,499.00,U1",
    "27/11/2026,ATM WDL CASH,2000.00,,U2",
    "27/11/2026,CC BILL PAYMENT,5000.00,,U3",
    "27/11/2026,UPI REVERSAL,,300.00,U4",
    "27/11/2026,NEFT PENDING TRANSFER,1000.00,,U5",
    "27/11/2026,UPI/99887766,250.00,,U6",
  ].join("\n");

  const parsed = parseBankStatementCsv(csv);
  const classified = classifyAndDeduplicateRows(parsed.rows, []);

  assert.equal(classified[0].kind, "refund");
  assert.equal(classified[0].skip, true);
  assert.equal(classified[0].needsReview, true);

  assert.equal(classified[1].kind, "transfer"); // ATM WDL
  assert.equal(classified[1].skip, true);

  assert.equal(classified[2].kind, "transfer"); // CC bill
  assert.equal(classified[2].skip, true);

  assert.equal(classified[3].kind, "excluded_status"); // Reversal
  assert.equal(classified[3].skip, true);

  assert.equal(classified[4].kind, "excluded_status"); // Pending
  assert.equal(classified[4].skip, true);

  assert.equal(classified[5].kind, "expense"); // Ambiguous UPI
  assert.equal(classified[5].needsReview, true);
});

test("prevents duplicate false positives when distinct UTRs exist and flags probable duplicates", () => {
  const csv = [
    "Date,Narration,Debit,Credit,UTR",
    "27/11/2026,METRO RIDE,50.00,,UTR-A1",
    "27/11/2026,METRO RIDE,50.00,,UTR-A2",
    "27/11/2026,TEA STALL,20.00,,",
    "27/11/2026,TEA STALL,20.00,,",
  ].join("\n");

  const parsed = parseBankStatementCsv(csv);
  const classified = classifyAndDeduplicateRows(parsed.rows, []);

  // Distinct UTRs with identical date/amount/narration must NOT be marked duplicate
  assert.equal(classified[0].isDuplicate, false);
  assert.equal(classified[1].isDuplicate, false);
  assert.equal(classified[1].duplicateConfidence, "none");

  // Identical rows with no UTR are flagged as probable duplicate for review
  assert.equal(classified[2].isDuplicate, false);
  assert.equal(classified[3].isDuplicate, true);
  assert.equal(classified[3].duplicateConfidence, "probable");
  assert.equal(classified[3].needsReview, true);
});

test("idempotent retry with deterministic UUIDs prevents duplicate inserts after partial success", async () => {
  resetMockState();
  mockState.activeUserId = "user-retry-1";

  const csv = [
    "Date,Narration,Debit,Credit,UTR",
    "27/11/2026,HPCL FUEL,400.00,,UTR-R1",
    "27/11/2026,ZOMATO PAYOUT,,1100.00,UTR-R2",
  ].join("\n");

  const preview = await analyzeCsvStatement({
    fileName: "retry.csv",
    sizeBytes: csv.length,
    rawText: csv,
  });

  // First attempt: row 1 succeeds, row 2 fails
  let n = 0;
  mockState.insertHandler = async (payload: any) => {
    n++;
    if (n === 2) return { data: null, error: { message: "Timeout" } };
    const rec = { id: payload.id, user_id: "user-retry-1", ...payload, created_at: "2026-11-27T00:00:00Z", updated_at: "2026-11-27T00:00:00Z" };
    mockState.transactions.push(rec);
    return { data: rec, error: null };
  };
  const first = await confirmAndImportCsvRows({
    userId: "user-retry-1",
    fileName: "retry.csv",
    rows: preview.rows,
    confirmed: true,
  });
  mockState.insertHandler = undefined;
  assert.equal(first.importedCount, 1);
  assert.equal(first.failedRows.length, 1);

  // Retry same rows: row 1 hits 23505 idempotently (no duplicate), row 2 succeeds
  const retry = await confirmAndImportCsvRows({
    userId: "user-retry-1",
    fileName: "retry.csv",
    rows: preview.rows,
    confirmed: true,
  });
  assert.equal(retry.importedCount, 2);
  assert.equal(mockState.transactions.length, 2);
});

test("flags weak similarity (same date+amount, different narration) for review without discarding", () => {
  const csv = [
    "Date,Narration,Debit,Credit,UTR",
    "27/11/2026,SWIGGY LUNCH,250.00,,",
    "27/11/2026,ZOMATO DINNER,250.00,,",
  ].join("\n");

  const parsed = parseBankStatementCsv(csv);
  const classified = classifyAndDeduplicateRows(parsed.rows, []);

  assert.equal(classified[1].isDuplicate, false);
  assert.equal(classified[1].skip, false);
  assert.equal(classified[1].needsReview, true);
  assert.match(classified[1].reviewReason ?? "", /Same date and amount/i);
});

test("handles daily aggregate limit errors safely without losing earlier rows", async () => {
  resetMockState();
  mockState.activeUserId = "user-limit-1";

  const csv = [
    "Date,Narration,Debit,Credit,UTR",
    "27/11/2026,CLIENT PAYMENT 1,,600000.00,LIM1",
    "27/11/2026,CLIENT PAYMENT 2,,500000.00,LIM2",
  ].join("\n");

  const preview = await analyzeCsvStatement({
    fileName: "limit.csv",
    sizeBytes: csv.length,
    rawText: csv,
  });
  const res = await confirmAndImportCsvRows({
    userId: "user-limit-1",
    fileName: "limit.csv",
    rows: preview.rows,
    confirmed: true,
  });

  assert.equal(res.importedCount, 1);
  assert.equal(res.failedRows.length, 1);
  assert.match(res.failedRows[0].reason, /10,00,000/);
});
