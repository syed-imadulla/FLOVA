// Deterministic Transaction Classification & Confidence-Based Duplicate Detection.
// Enforces FLOVA accounting rules:
// - Bank-to-bank / internal transfers & cash withdrawals/deposits NEVER become income or expenses.
// - Borrowed money / loan repayments NEVER become earned income.
// - Refunds, reversed/cancelled, and pending rows NEVER auto-import as earned income or completed expenses.
// - Confidence-based duplicate detection prevents false positives when distinct UTRs exist.

import { toPaise } from "../lib/money";
import { MAX_TRANSACTION_LIMIT_PAISE } from "../lib/limits";
import type { ExpenseType, ISODate, Paise, PaymentMethod, Transaction, TransactionType } from "../types/contracts";
import type { ParsedStatementRow } from "./csvStatementParser";

export type StatementRowKind =
  | "income"
  | "expense"
  | "transfer"
  | "borrowed_or_repayment"
  | "refund"
  | "excluded_status"
  | "invalid";

export type DuplicateConfidence = "none" | "probable" | "definite";

export interface ClassifiedStatementRow {
  rowId: string;
  rowNumber: number;
  date: ISODate | null;
  description: string;
  reference: string | null;
  direction: "credit" | "debit" | null;
  amountPaise: Paise | null;
  kind: StatementRowKind;
  transactionType: TransactionType | null;
  category: string;
  expenseType: ExpenseType | null;
  paymentMethod: PaymentMethod;
  needsReview: boolean;
  reviewReason: string | null;
  isDuplicate: boolean;
  duplicateConfidence: DuplicateConfidence;
  duplicateReason: string | null;
  skip: boolean;
}

export interface StatementSummary {
  totalRows: number;
  incomeCount: number;
  expenseCount: number;
  transferCount: number;
  borrowedCount: number;
  excludedCount: number;
  duplicateCount: number;
  invalidCount: number;
  needsReviewCount: number;
  readyToImportCount: number;
}

const TRANSFER_PATTERNS = [
  /\bself\s*transfer\b/i,
  /\bown\s*account\b/i,
  /\binternal\s*transfer\b/i,
  /\bto\s*self\b/i,
  /\bfrom\s*self\b/i,
  /\bsweep\s*(in|out|transfer)?\b/i,
  /\bcc\s*bill\b/i,
  /\bcredit\s*card\s*(bill|payment|pay)\b/i,
  /\bwallet\s*(load|topup|top-up)\b/i,
  /\bfd\s*(closure|booking|transfer)\b/i,
  /\brd\s*(installment|transfer)\b/i,
  /\btrf\s*to\s*self\b/i,
  /\batm\s*(wdl|withdrawal|cash)\b/i,
  /\bcash\s*(wdl|withdrawal|deposit)\b/i,
  /\bcdm\s*deposit\b/i,
];

const BORROWED_OR_REPAYMENT_PATTERNS = [
  /\bloan\b/i,
  /\bemi\b/i,
  /\bborrow(ed|ing)?\b/i,
  /\blent\b/i,
  /\budhaar\b/i,
  /\brepay(ment)?\b/i,
  /\bkreditbee\b/i,
  /\bnaviloan\b/i,
  /\blazypay\b/i,
  /\bsimpl\b/i,
  /\bfibe\b/i,
  /\bmoneytap\b/i,
];

const EXCLUDED_STATUS_PATTERNS = [
  /\b(reversed|reversal|cancelled|canceled|failed|bounced|chq\s*return|cheque\s*return)\b/i,
  /\b(pending|on\s*hold|lien\s*marked|unsettled)\b/i,
];

const REFUND_PATTERNS = [
  /\b(refund|cashback)\b/i,
];

const INCOME_RULES: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /\b(swiggy|zomato|zepto|blinkit|instamart|dunzo|uber|ola|rapido|porter|shadowfax|bigbasket)\b/i, category: "delivery_earnings" },
  { pattern: /\b(salary|payroll|stipend|wages)\b/i, category: "salary" },
  { pattern: /\b(freelance|upwork|fiverr|client|consult|invoice|retainer)\b/i, category: "freelance" },
  { pattern: /\b(commission|incentive|bonus|tip|tips)\b/i, category: "commission" },
  { pattern: /\b(shop|store|sales|merchant|pos\s*settle|bharatpe|phonepe\s*business|paytm\s*business)\b/i, category: "business_sales" },
];

const EXPENSE_RULES: Array<{ pattern: RegExp; category: string; expenseType: ExpenseType }> = [
  { pattern: /\b(petrol|diesel|fuel|hpcl|bpcl|iocl|indian\s*oil|bharat\s*petroleum|shell)\b/i, category: "fuel", expenseType: "work" },
  { pattern: /\b(jio|airtel|vodafone|vi\b|bsnl|recharge|mobile\s*bill|broadband|wifi)\b/i, category: "phone", expenseType: "work" },
  { pattern: /\b(metro|bus|auto|irctc|railway|cab|uber|ola|rapido|toll|fastag|parking)\b/i, category: "transport", expenseType: "work" },
  { pattern: /\b(service\s*center|tyre|puncture|garage|mechanic|spare|oil\s*change)\b/i, category: "vehicle", expenseType: "work" },
  { pattern: /\b(swiggy|zomato|hotel|restaurant|cafe|tea|coffee|bakery|biryani|mess|tiffin|food|eatclub|dominos|kfc)\b/i, category: "food", expenseType: "living" },
  { pattern: /\b(dmart|reliance\s*fresh|more\s*supermarket|kirana|grocery|groceries|bigbasket|blinkit|zepto|milk|vegetable|supermarket)\b/i, category: "groceries", expenseType: "living" },
  { pattern: /\b(rent|landlord|pg\s*rent|hostel|maintenance|electricity|bescom|water\s*bill|gas\s*cylinder|indane|hp\s*gas)\b/i, category: "rent", expenseType: "living" },
  { pattern: /\b(pharmacy|medical|hospital|clinic|apollo|medplus|1mg|pharmeasy|doctor|lab)\b/i, category: "medical", expenseType: "living" },
  { pattern: /\b(family|mother|father|mom|dad|home\s*send)\b/i, category: "family", expenseType: "living" },
];

const GENERIC_DESCRIPTION_PATTERN = /^(upi|imps|neft|rtgs|atm|cash|wdl|transfer|pos|debit|credit|payment|txn)[/\s\-0-9]*$/i;

export function detectPaymentMethod(description: string): PaymentMethod {
  if (/\bupi\b|@[a-z]{2,}/i.test(description)) return "upi";
  if (/\b(atm|cash\s*wdl|cash\s*deposit)\b/i.test(description)) return "cash";
  return "bank";
}

export function normalizeDescriptionForMatch(description: string): string {
  return description
    .replace(/\[ref:[^\]]+\]/gi, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 80);
}

export function formatImportedDescription(description: string, reference: string | null): string {
  const clean = description.replace(/\s+/g, " ").trim();
  if (!reference) return clean.slice(0, 200);
  const suffix = ` [Ref:${reference}]`;
  const maxBase = Math.max(0, 200 - suffix.length);
  return `${clean.slice(0, maxBase)}${suffix}`;
}

function buildFallbackFingerprint(
  date: ISODate,
  amountPaise: Paise,
  direction: "credit" | "debit",
  description: string
): string {
  return `${date}|${amountPaise}|${direction}|${normalizeDescriptionForMatch(description)}`;
}

function buildWeakFingerprint(
  date: ISODate,
  amountPaise: Paise,
  direction: "credit" | "debit"
): string {
  return `${date}|${amountPaise}|${direction}`;
}
function extractRefFromDescription(description: string | null): string | null {
  if (!description) return null;
  const m = /\[Ref:([^\]]+)\]/i.exec(description);
  return m ? m[1].trim().toUpperCase() : null;
}

/** Classifies a single parsed CSV row using deterministic rules. */
export function classifyParsedRow(row: ParsedStatementRow, index: number): ClassifiedStatementRow {
  const rowId = `csv-row-${row.rowNumber}-${index}`;

  if (row.invalidReason || !row.date || !row.amountPaise || !row.direction) {
    return {
      rowId,
      rowNumber: row.rowNumber,
      date: row.date,
      description: row.description,
      reference: row.reference,
      direction: row.direction,
      amountPaise: row.amountPaise,
      kind: "invalid",
      transactionType: null,
      category: "other",
      expenseType: null,
      paymentMethod: "bank",
      needsReview: false,
      reviewReason: row.invalidReason ?? "Invalid row.",
      isDuplicate: false,
      duplicateConfidence: "none",
      duplicateReason: null,
      skip: true,
    };
  }

  if (row.amountPaise > MAX_TRANSACTION_LIMIT_PAISE) {
    return {
      rowId,
      rowNumber: row.rowNumber,
      date: row.date,
      description: row.description,
      reference: row.reference,
      direction: row.direction,
      amountPaise: row.amountPaise,
      kind: "invalid",
      transactionType: null,
      category: "other",
      expenseType: null,
      paymentMethod: detectPaymentMethod(row.description),
      needsReview: false,
      reviewReason: "Exceeds ₹10,00,000 single-transaction limit.",
      isDuplicate: false,
      duplicateConfidence: "none",
      duplicateReason: null,
      skip: true,
    };
  }

  const paymentMethod = detectPaymentMethod(row.description);

  // 1. Reversed, cancelled, failed, or pending transactions must not import automatically
  if (EXCLUDED_STATUS_PATTERNS.some((p) => p.test(row.description))) {
    return {
      rowId,
      rowNumber: row.rowNumber,
      date: row.date,
      description: row.description,
      reference: row.reference,
      direction: row.direction,
      amountPaise: row.amountPaise,
      kind: "excluded_status",
      transactionType: null,
      category: "other",
      expenseType: null,
      paymentMethod,
      needsReview: true,
      reviewReason: "Looks reversed, cancelled, or pending (excluded by default).",
      isDuplicate: false,
      duplicateConfidence: "none",
      duplicateReason: null,
      skip: true,
    };
  }

  // 2. Internal / bank-to-bank transfers & cash withdrawals/deposits
  if (TRANSFER_PATTERNS.some((p) => p.test(row.description))) {
    return {
      rowId,
      rowNumber: row.rowNumber,
      date: row.date,
      description: row.description,
      reference: row.reference,
      direction: row.direction,
      amountPaise: row.amountPaise,
      kind: "transfer",
      transactionType: null,
      category: "other",
      expenseType: null,
      paymentMethod,
      needsReview: true,
      reviewReason: "Looks like an internal transfer or cash movement (excluded from income/expense by default).",
      isDuplicate: false,
      duplicateConfidence: "none",
      duplicateReason: null,
      skip: true,
    };
  }

  // 3. Borrowed money / loan repayments must not become earned income
  if (BORROWED_OR_REPAYMENT_PATTERNS.some((p) => p.test(row.description))) {
    return {
      rowId,
      rowNumber: row.rowNumber,
      date: row.date,
      description: row.description,
      reference: row.reference,
      direction: row.direction,
      amountPaise: row.amountPaise,
      kind: "borrowed_or_repayment",
      transactionType: null,
      category: "other",
      expenseType: null,
      paymentMethod,
      needsReview: true,
      reviewReason: "Looks like borrowed money or a loan repayment (excluded from earned income by default).",
      isDuplicate: false,
      duplicateConfidence: "none",
      duplicateReason: null,
      skip: true,
    };
  }

  // 4. Refunds / Cashbacks must not automatically become earned income
  if (row.direction === "credit" && REFUND_PATTERNS.some((p) => p.test(row.description))) {
    return {
      rowId,
      rowNumber: row.rowNumber,
      date: row.date,
      description: row.description,
      reference: row.reference,
      direction: "credit",
      amountPaise: row.amountPaise,
      kind: "refund",
      transactionType: null,
      category: "other",
      expenseType: null,
      paymentMethod,
      needsReview: true,
      reviewReason: "Looks like a refund or cashback (excluded from earned income unless you include it).",
      isDuplicate: false,
      duplicateConfidence: "none",
      duplicateReason: null,
      skip: true,
    };
  }

  // 5. Credits -> Income
  if (row.direction === "credit") {
    const match = INCOME_RULES.find((r) => r.pattern.test(row.description));
    const isGeneric = !match || GENERIC_DESCRIPTION_PATTERN.test(row.description);
    return {
      rowId,
      rowNumber: row.rowNumber,
      date: row.date,
      description: row.description,
      reference: row.reference,
      direction: "credit",
      amountPaise: row.amountPaise,
      kind: "income",
      transactionType: "income",
      category: match ? match.category : "other",
      expenseType: null,
      paymentMethod,
      needsReview: !match || isGeneric,
      reviewReason: !match ? "Confirm whether this credit is earned income or a transfer/loan." : null,
      isDuplicate: false,
      duplicateConfidence: "none",
      duplicateReason: null,
      skip: false,
    };
  }

  // 6. Debits -> Expense
  const expMatch = EXPENSE_RULES.find((r) => r.pattern.test(row.description));
  const isGeneric = !expMatch || GENERIC_DESCRIPTION_PATTERN.test(row.description);
  return {
    rowId,
    rowNumber: row.rowNumber,
    date: row.date,
    description: row.description,
    reference: row.reference,
    direction: "debit",
    amountPaise: row.amountPaise,
    kind: "expense",
    transactionType: "expense",
    category: expMatch ? expMatch.category : "other",
    expenseType: expMatch ? expMatch.expenseType : "living",
    paymentMethod,
    needsReview: !expMatch || isGeneric,
    reviewReason: !expMatch ? "Confirm category and whether this is living or work spending." : null,
    isDuplicate: false,
    duplicateConfidence: "none",
    duplicateReason: null,
    skip: false,
  };
}

/**
 * Confidence-based duplicate detection against existing user transactions and within the same CSV.
 * - Definite: matching UTR/Reference -> auto-skipped.
 * - Conflicting UTRs (both have non-empty UTRs and they differ) -> NOT a duplicate, even with same date/amount/description.
 * - Probable: same date + amount + direction + normalized description when at least one side lacks UTR -> flagged for review.
 */
export function classifyAndDeduplicateRows(
  parsedRows: ParsedStatementRow[],
  existingTransactions: Transaction[]
): ClassifiedStatementRow[] {
  const existingRefs = new Set<string>();
  const existingFingerprintsWithoutRef = new Set<string>();
  const existingFingerprintsWithRef = new Set<string>();
  const existingWeakWithoutRef = new Set<string>();
  const existingWeakWithRef = new Set<string>();

  for (const tx of existingTransactions) {
    const ref = extractRefFromDescription(tx.description);
    const dir = tx.type === "income" ? "credit" : "debit";
    const paise = toPaise(tx.amount);
    const fp = buildFallbackFingerprint(tx.transaction_date, paise, dir, tx.description ?? "");
    const weak = buildWeakFingerprint(tx.transaction_date, paise, dir);
    if (ref) {
      existingRefs.add(ref);
      existingFingerprintsWithRef.add(fp);
      existingWeakWithRef.add(weak);
    } else {
      existingFingerprintsWithoutRef.add(fp);
      existingWeakWithoutRef.add(weak);
    }
  }

  const seenCsvRefs = new Set<string>();
  const seenCsvFingerprintsWithoutRef = new Set<string>();
  const seenCsvFingerprintsWithRef = new Set<string>();
  const seenCsvWeakWithoutRef = new Set<string>();
  const seenCsvWeakWithRef = new Set<string>();

  return parsedRows.map((parsed, idx) => {
    const item = classifyParsedRow(parsed, idx);
    if (item.kind === "invalid" || !item.date || !item.amountPaise || !item.direction) {
      return item;
    }

    const normRef = item.reference ? item.reference.trim().toUpperCase() : null;
    const fp = buildFallbackFingerprint(item.date, item.amountPaise, item.direction, item.description);
    const weak = buildWeakFingerprint(item.date, item.amountPaise, item.direction);

    // 1. Definite duplicate by Reference / UTR
    if (normRef && existingRefs.has(normRef)) {
      return {
        ...item,
        isDuplicate: true,
        duplicateConfidence: "definite",
        duplicateReason: `Reference ${item.reference} already exists in FLOVA.`,
        skip: true,
      };
    }
    if (normRef && seenCsvRefs.has(normRef)) {
      return {
        ...item,
        isDuplicate: true,
        duplicateConfidence: "definite",
        duplicateReason: `Duplicate reference ${item.reference} in this CSV.`,
        skip: true,
      };
    }

    // 2. Probable duplicate by composite fingerprint (only when at least one side lacks a UTR)
    const matchesExistingProbable = normRef
      ? existingFingerprintsWithoutRef.has(fp)
      : existingFingerprintsWithoutRef.has(fp) || existingFingerprintsWithRef.has(fp);

    if (matchesExistingProbable) {
      return {
        ...item,
        isDuplicate: true,
        duplicateConfidence: "probable",
        needsReview: true,
        duplicateReason: "Probable duplicate of an existing FLOVA transaction (same date, amount & description).",
        reviewReason: "Probable duplicate of an existing transaction. Un-skip if this is a separate payment.",
        skip: true,
      };
    }

    const matchesCsvProbable = normRef
      ? seenCsvFingerprintsWithoutRef.has(fp)
      : seenCsvFingerprintsWithoutRef.has(fp) || seenCsvFingerprintsWithRef.has(fp);

    if (matchesCsvProbable) {
      return {
        ...item,
        isDuplicate: true,
        duplicateConfidence: "probable",
        needsReview: true,
        duplicateReason: "Probable duplicate row in this CSV (same date, amount & description).",
        reviewReason: "Probable duplicate row in this CSV. Un-skip if this is a separate payment.",
        skip: true,
      };
    }

    // 3. Weak similarity (same date + amount + direction, different description, no conflicting UTRs):
    // Flag for review without silently discarding.
    const weakMatch = normRef
      ? existingWeakWithoutRef.has(weak) || seenCsvWeakWithoutRef.has(weak)
      : existingWeakWithoutRef.has(weak) ||
        existingWeakWithRef.has(weak) ||
        seenCsvWeakWithoutRef.has(weak) ||
        seenCsvWeakWithRef.has(weak);

    if (normRef) {
      seenCsvRefs.add(normRef);
      seenCsvFingerprintsWithRef.add(fp);
      seenCsvWeakWithRef.add(weak);
    } else {
      seenCsvFingerprintsWithoutRef.add(fp);
      seenCsvWeakWithoutRef.add(weak);
    }

    if (weakMatch) {
      return {
        ...item,
        needsReview: true,
        reviewReason: item.reviewReason ?? "Same date and amount as another transaction — confirm this is not a duplicate.",
      };
    }

    return item;
  });
}

export function summarizeClassifiedRows(rows: ClassifiedStatementRow[]): StatementSummary {
  let incomeCount = 0;
  let expenseCount = 0;
  let transferCount = 0;
  let borrowedCount = 0;
  let excludedCount = 0;
  let duplicateCount = 0;
  let invalidCount = 0;
  let needsReviewCount = 0;
  let readyToImportCount = 0;

  for (const r of rows) {
    if (r.kind === "invalid") invalidCount++;
    else if (r.kind === "income") incomeCount++;
    else if (r.kind === "expense") expenseCount++;
    else if (r.kind === "transfer") transferCount++;
    else if (r.kind === "borrowed_or_repayment") borrowedCount++;
    else if (r.kind === "refund" || r.kind === "excluded_status") excludedCount++;

    if (r.isDuplicate) duplicateCount++;
    if (r.needsReview && r.duplicateConfidence !== "definite" && r.kind !== "invalid") needsReviewCount++;
    if (!r.skip && r.duplicateConfidence !== "definite" && r.kind !== "invalid" && r.transactionType !== null) {
      readyToImportCount++;
    }
  }

  return {
    totalRows: rows.length,
    incomeCount,
    expenseCount,
    transferCount,
    borrowedCount,
    excludedCount,
    duplicateCount,
    invalidCount,
    needsReviewCount,
    readyToImportCount,
  };
}
