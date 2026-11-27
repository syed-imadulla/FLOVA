// CSV Bank Statement Import Service.
// Reuses authenticated FLOVA transaction services (listTransactions, addTransaction)
// so Supabase RLS, integer-paise validation, and idempotency are preserved.

import {
  applyColumnMapping,
  parseBankStatementCsv,
  validateCsvFileMeta,
  type CsvColumnMapping,
  type CsvParseResult,
} from "../engine/csvStatementParser";
import {
  classifyAndDeduplicateRows,
  formatImportedDescription,
  summarizeClassifiedRows,
  type ClassifiedStatementRow,
  type StatementSummary,
} from "../engine/csvTransactionClassifier";
import type { NewTransaction, Transaction } from "../types/contracts";
import { addTransaction, listTransactions } from "./data";

export interface CsvImportHistoryEntry {
  id: string;
  importedAt: string;
  fileName: string;
  totalRows: number;
  importedCount: number;
  skippedDuplicates: number;
  skippedInvalid: number;
  failedCount: number;
}

export interface CsvImportPreview {
  fileName: string;
  parseResult: CsvParseResult;
  rows: ClassifiedStatementRow[];
  summary: StatementSummary;
}

export interface CsvImportFailure {
  rowId: string;
  rowNumber: number;
  description: string;
  reason: string;
}

export interface CsvImportResult {
  importedCount: number;
  skippedDuplicates: number;
  skippedExcluded: number;
  skippedInvalid: number;
  failedRows: CsvImportFailure[];
  importedTransactions: Transaction[];
  historyEntry: CsvImportHistoryEntry;
}

const HISTORY_KEY_PREFIX = "flova_csv_import_history_v1_";
const MAX_HISTORY_ENTRIES = 20;

function historyStorageKey(userId: string): string {
  return `${HISTORY_KEY_PREFIX}${userId}`;
}

/** Deterministic RFC-4122 v4-shaped UUID from string input for idempotent per-row retries. */
export function deterministicRowUuid(seed: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  let h3 = 0x85ebca6b;
  let h4 = 0xc2b2ae35;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (ch + i), 0x85ebca6b) >>> 0;
    h3 = Math.imul(h3 ^ (ch << 1), 0xc2b2ae35) >>> 0;
    h4 = Math.imul(h4 ^ (ch + 17), 0x27d4eb2f) >>> 0;
  }
  const hex = (n: number) => n.toString(16).padStart(8, "0");
  const raw = `${hex(h1)}${hex(h2)}${hex(h3)}${hex(h4)}`;
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-4${raw.slice(13, 16)}-a${raw.slice(17, 20)}-${raw.slice(20, 32)}`;
}

export function listCsvImportHistory(userId: string | null | undefined): CsvImportHistoryEntry[] {
  if (!userId || typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(historyStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CsvImportHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function recordCsvImportHistory(userId: string | null | undefined, entry: CsvImportHistoryEntry): void {
  if (!userId || typeof localStorage === "undefined") return;
  try {
    const existing = listCsvImportHistory(userId);
    const updated = [entry, ...existing.filter((e) => e.id !== entry.id)].slice(0, MAX_HISTORY_ENTRIES);
    localStorage.setItem(historyStorageKey(userId), JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

/** Parses CSV locally and compares against existing user transactions in the statement date range. */
export async function analyzeCsvStatement(opts: {
  fileName: string;
  sizeBytes: number;
  rawText: string;
  manualMapping?: CsvColumnMapping;
}): Promise<CsvImportPreview> {
  const metaErr = validateCsvFileMeta(opts.fileName, opts.sizeBytes);
  if (metaErr) throw new Error(metaErr);

  const initial = parseBankStatementCsv(opts.rawText);
  const parseResult: CsvParseResult = opts.manualMapping
    ? {
        ...initial,
        mapping: opts.manualMapping,
        needsManualMapping: false,
        mappingReason: null,
        rows: applyColumnMapping(initial.rawRows, initial.headerRowIndex, opts.manualMapping),
      }
    : initial;

  if (parseResult.needsManualMapping) {
    return {
      fileName: opts.fileName,
      parseResult,
      rows: [],
      summary: summarizeClassifiedRows([]),
    };
  }

  const validDates = parseResult.rows.map((r) => r.date).filter((d): d is string => Boolean(d)).sort();
  const existing =
    validDates.length > 0
      ? await listTransactions({
          from: validDates[0],
          to: validDates[validDates.length - 1],
          limit: 2000,
        })
      : [];

  const rows = classifyAndDeduplicateRows(parseResult.rows, existing);
  const summary = summarizeClassifiedRows(rows);

  return {
    fileName: opts.fileName,
    parseResult,
    rows,
    summary,
  };
}

/**
 * Persists reviewed CSV transactions only after explicit user confirmation.
 * Reuses addTransaction() for validation, limits, idempotent UUIDs, and RLS.
 */
export async function confirmAndImportCsvRows(opts: {
  userId: string | null | undefined;
  fileName: string;
  rows: ClassifiedStatementRow[];
  confirmed: boolean;
}): Promise<CsvImportResult> {
  if (!opts.confirmed) {
    throw new Error("Explicit user confirmation is required before importing transactions.");
  }

  let skippedDuplicates = 0;
  let skippedInvalid = 0;
  let skippedExcluded = 0;
  const toImport: ClassifiedStatementRow[] = [];

  for (const r of opts.rows) {
    if (r.kind === "invalid" || !r.date || !r.amountPaise || r.amountPaise <= 0) {
      skippedInvalid++;
    } else if (r.duplicateConfidence === "definite" || (r.isDuplicate && r.skip)) {
      skippedDuplicates++;
    } else if (r.skip || !r.transactionType) {
      skippedExcluded++;
    } else {
      toImport.push(r);
    }
  }

  const importedTransactions: Transaction[] = [];
  const failedRows: CsvImportFailure[] = [];

  for (const r of toImport) {
    const idSeed = `${opts.userId ?? "anon"}|${r.date}|${r.amountPaise}|${r.direction}|${r.reference ?? r.rowId}`;
    const payload: NewTransaction = {
      id: deterministicRowUuid(idSeed),
      type: r.transactionType!,
      amount: r.amountPaise!,
      category: r.category || "other",
      description: formatImportedDescription(r.description, r.reference),
      expenseType: r.transactionType === "expense" ? (r.expenseType ?? "living") : null,
      ownership: "mine",
      paymentMethod: r.paymentMethod,
      date: r.date!,
      source: "manual",
    };

    try {
      const saved = await addTransaction(payload);
      importedTransactions.push(saved);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save transaction.";
      failedRows.push({
        rowId: r.rowId,
        rowNumber: r.rowNumber,
        description: r.description,
        reason: msg,
      });
    }
  }

  const historyEntry: CsvImportHistoryEntry = {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `imp-${Date.now()}`,
    importedAt: new Date().toISOString(),
    fileName: opts.fileName,
    totalRows: opts.rows.length,
    importedCount: importedTransactions.length,
    skippedDuplicates,
    skippedInvalid: skippedInvalid + skippedExcluded,
    failedCount: failedRows.length,
  };

  recordCsvImportHistory(opts.userId, historyEntry);

  return {
    importedCount: importedTransactions.length,
    skippedDuplicates,
    skippedExcluded,
    skippedInvalid,
    failedRows,
    importedTransactions,
    historyEntry,
  };
}
