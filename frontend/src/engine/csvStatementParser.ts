// Deterministic CSV Bank Statement Parser.
// Parses bank CSV files locally in the browser: handles UTF-8 BOM, quoted fields,
// commas in descriptions, Indian currency formatting, multiple date formats,
// separate debit/credit columns, and single amount + Dr/Cr columns.

import type { ISODate, Paise } from "../types/contracts";

export const MAX_CSV_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_CSV_ROWS = 5000;

export interface CsvColumnMapping {
  date: number;
  description: number;
  debit: number | null;
  credit: number | null;
  amount: number | null;
  type: number | null;
  balance: number | null;
  reference: number | null;
}

export interface ParsedStatementRow {
  rowNumber: number;
  date: ISODate | null;
  rawDate: string;
  description: string;
  direction: "credit" | "debit" | null;
  amountPaise: Paise | null;
  reference: string | null;
  balancePaise: Paise | null;
  invalidReason: string | null;
}

export interface CsvParseResult {
  headers: string[];
  headerRowIndex: number;
  mapping: CsvColumnMapping;
  needsManualMapping: boolean;
  mappingReason: string | null;
  rows: ParsedStatementRow[];
  rawRows: string[][];
}

const HEADER_SYNONYMS = {
  date: ["date", "txn date", "transaction date", "value date", "posting date", "tran date", "txndate", "valuedate"],
  description: [
    "description",
    "narration",
    "particulars",
    "remarks",
    "details",
    "transaction details",
    "transaction remarks",
    "memo",
    "payee",
  ],
  debit: ["debit", "withdrawal", "withdrawal amt", "withdrawal amount", "dr", "debit amount", "debit amt", "paid out"],
  credit: ["credit", "deposit", "deposit amt", "deposit amount", "cr", "credit amount", "credit amt", "paid in"],
  amount: ["amount", "txn amount", "transaction amount", "amt", "value"],
  type: ["type", "dr/cr", "cr/dr", "transaction type", "txn type", "d/c", "indicator"],
  balance: ["balance", "closing balance", "available balance", "running balance", "bal"],
  reference: ["ref", "reference", "utr", "chq/ref no", "ref no", "reference no", "transaction id", "txn id", "refno", "cheque no"],
} as const;

export function validateCsvFileMeta(fileName: string, sizeBytes: number): string | null {
  const lower = fileName.trim().toLowerCase();
  if (!lower.endsWith(".csv") && !lower.endsWith(".txt")) {
    return "Please select a .csv bank statement file.";
  }
  if (sizeBytes <= 0) {
    return "The selected CSV file is empty.";
  }
  if (sizeBytes > MAX_CSV_FILE_BYTES) {
    return "CSV file is too large (maximum 5 MB).";
  }
  return null;
}

/** RFC-4180 compliant CSV tokenizer with UTF-8 BOM stripping. */
export function tokenizeCsv(rawText: string): string[][] {
  const text = rawText.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field.trim());
      field = "";
    } else if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field.trim());
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = "";
      if (rows.length > MAX_CSV_ROWS + 50) {
        throw new Error(`CSV exceeds maximum supported limit of ${MAX_CSV_ROWS} rows.`);
      }
    } else {
      field += ch;
    }
  }

  row.push(field.trim());
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }
  return rows;
}

export function sanitizeCsvTextCell(raw: string): string {
  const collapsed = raw.replace(/\s+/g, " ").trim();
  // Neutralize spreadsheet formula-injection prefixes (=, @, tab)
  return /^[=@\t]/.test(collapsed) ? `'${collapsed}` : collapsed;
}
function normalizeHeader(cell: string): string {
  return cell
    .toLowerCase()
    .replace(/[._()/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchColumn(headers: string[], synonyms: readonly string[], used: Set<number>): number | null {
  const normalized = headers.map(normalizeHeader);
  const normSynonyms = synonyms.map(normalizeHeader);
  // 1. Exact match
  for (const syn of normSynonyms) {
    const idx = normalized.findIndex((h, i) => !used.has(i) && h === syn);
    if (idx !== -1) return idx;
  }
  // 2. Contains match (header contains synonym, never the reverse)
  for (const syn of normSynonyms) {
    const idx = normalized.findIndex((h, i) => !used.has(i) && h.includes(syn) && syn.length >= 2);
    if (idx !== -1) return idx;
  }
  return null;
}

/** Finds the most likely header row (skips bank banner/metadata rows at top). */
export function detectHeaderRow(rows: string[][]): number {
  let bestIdx = 0;
  let bestScore = -1;
  const limit = Math.min(rows.length, 25);

  for (let i = 0; i < limit; i++) {
    const r = rows[i];
    if (r.length < 2) continue;
    const used = new Set<number>();
    let score = 0;
    const d = matchColumn(r, HEADER_SYNONYMS.date, used);
    if (d !== null) { score += 3; used.add(d); }
    const desc = matchColumn(r, HEADER_SYNONYMS.description, used);
    if (desc !== null) { score += 3; used.add(desc); }
    const dr = matchColumn(r, HEADER_SYNONYMS.debit, used);
    if (dr !== null) { score += 2; used.add(dr); }
    const cr = matchColumn(r, HEADER_SYNONYMS.credit, used);
    if (cr !== null) { score += 2; used.add(cr); }
    const amt = matchColumn(r, HEADER_SYNONYMS.amount, used);
    if (amt !== null) { score += 2; used.add(amt); }
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function inferColumnMapping(headers: string[]): {
  mapping: CsvColumnMapping;
  needsManualMapping: boolean;
  mappingReason: string | null;
} {
  const used = new Set<number>();
  const dateIdx = matchColumn(headers, HEADER_SYNONYMS.date, used);
  if (dateIdx !== null) used.add(dateIdx);

  const descIdx = matchColumn(headers, HEADER_SYNONYMS.description, used);
  if (descIdx !== null) used.add(descIdx);

  const typeIdx = matchColumn(headers, HEADER_SYNONYMS.type, used);
  if (typeIdx !== null) used.add(typeIdx);

  const debitIdx = matchColumn(headers, HEADER_SYNONYMS.debit, used);
  if (debitIdx !== null) used.add(debitIdx);

  const creditIdx = matchColumn(headers, HEADER_SYNONYMS.credit, used);
  if (creditIdx !== null) used.add(creditIdx);

  const amountIdx = matchColumn(headers, HEADER_SYNONYMS.amount, used);
  if (amountIdx !== null) used.add(amountIdx);

  const balanceIdx = matchColumn(headers, HEADER_SYNONYMS.balance, used);
  if (balanceIdx !== null) used.add(balanceIdx);

  const refIdx = matchColumn(headers, HEADER_SYNONYMS.reference, used);
  if (refIdx !== null) used.add(refIdx);

  const hasAmountCols = (debitIdx !== null && creditIdx !== null) || amountIdx !== null || debitIdx !== null || creditIdx !== null;
  let needsManualMapping = false;
  let mappingReason: string | null = null;

  if (dateIdx === null) {
    needsManualMapping = true;
    mappingReason = "Could not automatically detect the Transaction Date column.";
  } else if (descIdx === null) {
    needsManualMapping = true;
    mappingReason = "Could not automatically detect the Description / Narration column.";
  } else if (!hasAmountCols) {
    needsManualMapping = true;
    mappingReason = "Could not automatically detect Debit, Credit, or Amount columns.";
  }

  return {
    mapping: {
      date: dateIdx ?? 0,
      description: descIdx ?? Math.min(1, Math.max(0, headers.length - 1)),
      debit: debitIdx,
      credit: creditIdx,
      amount: amountIdx,
      type: typeIdx,
      balance: balanceIdx,
      reference: refIdx,
    },
    needsManualMapping,
    mappingReason,
  };
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function isValidYMD(year: number, month: number, day: number): boolean {
  if (year < 1990 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

function formatYMD(year: number, month: number, day: number): ISODate {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Parses common Indian and ISO bank statement date strings into YYYY-MM-DD. */
export function parseStatementDate(raw: string): ISODate | null {
  const s = raw.trim().replace(/\s+/g, " ");
  if (!s) return null;

  // Strip trailing time component if present (e.g., "27/11/2026 14:30:00" or "2026-11-27T10:00:00Z")
  const datePart = s.split(/[T ]/)[0].trim();

  // 1. YYYY-MM-DD or YYYY/MM/DD
  let m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(datePart);
  if (m) {
    const [, y, mo, d] = m.map(Number);
    return isValidYMD(y, mo, d) ? formatYMD(y, mo, d) : null;
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (or MM/DD/YYYY if month > 12 impossible)
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/.exec(datePart);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    let y = Number(m[3]);
    if (y < 100) y += y >= 70 ? 1900 : 2000;
    // Prefer DD/MM/YYYY (Indian banks); fallback to MM/DD/YYYY only if b > 12 and a <= 12
    if (isValidYMD(y, b, a)) return formatYMD(y, b, a);
    if (b > 12 && a <= 12 && isValidYMD(y, a, b)) return formatYMD(y, a, b);
    return null;
  }

  // 3. DD MMM YYYY / DD-MMM-YYYY / DD-MMM-YY (using full string s)
  m = /^(\d{1,2})[-\s]([A-Za-z]{3,9})[-,\s]+(\d{2,4})(?:\s.*)?$/.exec(s);
  if (m) {
    const d = Number(m[1]);
    const mo = MONTHS[m[2].toLowerCase()];
    let y = Number(m[3]);
    if (y < 100) y += y >= 70 ? 1900 : 2000;
    if (mo && isValidYMD(y, mo, d)) return formatYMD(y, mo, d);
  }

  return null;
}

export interface ParsedAmount {
  paise: Paise;
  sign: -1 | 1;
  explicitIndicator: "credit" | "debit" | null;
}

/**
 * Parses Indian/Western currency strings into integer paise without float math.
 * Examples: "₹1,23,456.50", "Rs. 450", "(1,200.00)", "-500.25", "1,000.00 CR", "450 DR".
 */
export function parseStatementAmount(raw: string): ParsedAmount | null {
  let s = raw.trim();
  if (!s || s === "-" || s === "--" || s.toLowerCase() === "nil" || s.toLowerCase() === "na") return null;

  let explicitIndicator: "credit" | "debit" | null = null;
  const upper = s.toUpperCase();
  if (/\bCR\b/.test(upper) || upper.endsWith("CR")) {
    explicitIndicator = "credit";
    s = s.replace(/\bCR\b/gi, "").trim();
  } else if (/\bDR\b/.test(upper) || upper.endsWith("DR")) {
    explicitIndicator = "debit";
    s = s.replace(/\bDR\b/gi, "").trim();
  }

  let sign: -1 | 1 = 1;
  if (s.startsWith("(") && s.endsWith(")")) {
    sign = -1;
    s = s.slice(1, -1).trim();
  }
  if (s.startsWith("-")) {
    sign = -1;
    s = s.slice(1).trim();
  } else if (s.startsWith("+")) {
    s = s.slice(1).trim();
  }

  // Strip currency symbols and commas/spaces
  s = s.replace(/[₹,\s]/g, "").replace(/^(?:Rs\.?|INR)/i, "").trim();
  if (s.endsWith("-")) {
    sign = -1;
    s = s.slice(0, -1).trim();
  }

  const m = /^(\d+)(?:\.(\d{1,4}))?$/.exec(s);
  if (!m) return null;

  const rupees = Number(m[1]);
  const frac = (m[2] ?? "").slice(0, 2).padEnd(2, "0");
  const paise = rupees * 100 + Number(frac);
  if (!Number.isSafeInteger(paise)) return null;

  return { paise, sign, explicitIndicator };
}

function parseDirectionIndicator(raw: string): "credit" | "debit" | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s === "cr" || s === "c" || s.includes("credit") || s.includes("deposit")) return "credit";
  if (s === "dr" || s === "d" || s.includes("debit") || s.includes("withdraw")) return "debit";
  return null;
}

/** Applies a column mapping to tokenized CSV rows to produce structured statement rows. */
export function applyColumnMapping(
  rawRows: string[][],
  headerRowIndex: number,
  mapping: CsvColumnMapping
): ParsedStatementRow[] {
  const dataRows = rawRows.slice(headerRowIndex + 1);
  if (dataRows.length > MAX_CSV_ROWS) {
    throw new Error(`CSV exceeds maximum supported limit of ${MAX_CSV_ROWS} rows.`);
  }

  const parsed: ParsedStatementRow[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];
    const rowNumber = headerRowIndex + 2 + i;
    const rawDate = r[mapping.date] ?? "";
    const rawDesc = r[mapping.description] ?? "";
    const description = sanitizeCsvTextCell(rawDesc);
    const date = parseStatementDate(rawDate);
    const reference = mapping.reference !== null ? (r[mapping.reference] ?? "").trim() || null : null;
    const balanceParsed = mapping.balance !== null ? parseStatementAmount(r[mapping.balance] ?? "") : null;

    let direction: "credit" | "debit" | null = null;
    let amountPaise: Paise | null = null;
    let invalidReason: string | null = null;

    if (mapping.debit !== null || mapping.credit !== null) {
      const debitVal = mapping.debit !== null ? parseStatementAmount(r[mapping.debit] ?? "") : null;
      const creditVal = mapping.credit !== null ? parseStatementAmount(r[mapping.credit] ?? "") : null;
      const debitAmt = debitVal && debitVal.paise > 0 ? debitVal.paise : 0;
      const creditAmt = creditVal && creditVal.paise > 0 ? creditVal.paise : 0;

      if (debitAmt > 0 && creditAmt > 0) {
        invalidReason = "Both debit and credit amounts are non-zero.";
      } else if (debitAmt > 0) {
        direction = "debit";
        amountPaise = debitAmt;
      } else if (creditAmt > 0) {
        direction = "credit";
        amountPaise = creditAmt;
      }
    }

    if (amountPaise === null && mapping.amount !== null && !invalidReason) {
      const amtVal = parseStatementAmount(r[mapping.amount] ?? "");
      if (amtVal && amtVal.paise > 0) {
        amountPaise = amtVal.paise;
        const typeInd = mapping.type !== null ? parseDirectionIndicator(r[mapping.type] ?? "") : null;
        if (typeInd) {
          direction = typeInd;
        } else if (amtVal.explicitIndicator) {
          direction = amtVal.explicitIndicator;
        } else if (amtVal.sign < 0) {
          direction = "debit";
        } else {
          direction = "credit";
        }
      }
    }

    if (!date) {
      invalidReason = invalidReason ?? "Invalid or missing date.";
    } else if (!description) {
      invalidReason = invalidReason ?? "Missing transaction description.";
    } else if (amountPaise === null || amountPaise <= 0) {
      invalidReason = invalidReason ?? "Missing or zero transaction amount.";
    } else if (!direction) {
      invalidReason = invalidReason ?? "Could not determine debit or credit direction.";
    }

    parsed.push({
      rowNumber,
      date,
      rawDate,
      description,
      direction,
      amountPaise,
      reference,
      balancePaise: balanceParsed ? balanceParsed.paise * balanceParsed.sign : null,
      invalidReason,
    });
  }

  return parsed;
}

/** Parses raw CSV text end-to-end with automatic header and column detection. */
export function parseBankStatementCsv(rawText: string): CsvParseResult {
  const rawRows = tokenizeCsv(rawText);
  if (rawRows.length < 2) {
    throw new Error("CSV file must contain a header row and at least one transaction row.");
  }

  const headerRowIndex = detectHeaderRow(rawRows);
  const headers = rawRows[headerRowIndex];
  const { mapping, needsManualMapping, mappingReason } = inferColumnMapping(headers);
  const rows = needsManualMapping ? [] : applyColumnMapping(rawRows, headerRowIndex, mapping);

  return {
    headers,
    headerRowIndex,
    mapping,
    needsManualMapping,
    mappingReason,
    rows,
    rawRows,
  };
}
