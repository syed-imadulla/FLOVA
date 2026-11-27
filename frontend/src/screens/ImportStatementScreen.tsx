// Smart CSV Bank Statement Import screen.
// Flow: Select CSV -> Auto-analyse (or map columns if ambiguous) -> Review uncertain rows -> Confirm -> Result.
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { categoriesFor } from "../app/categories";
import { useSession } from "../auth/useSession";
import { useDataVersion } from "../data/DataVersionProvider";
import type { CsvColumnMapping } from "../engine/csvStatementParser";
import {
  summarizeClassifiedRows,
  type ClassifiedStatementRow,
} from "../engine/csvTransactionClassifier";
import { formatINR } from "../lib/money";
import { useProfile } from "../profile/useProfile";
import {
  analyzeCsvStatement,
  confirmAndImportCsvRows,
  listCsvImportHistory,
  type CsvImportHistoryEntry,
  type CsvImportPreview,
  type CsvImportResult,
} from "../services/csvImport";
import type { ExpenseType, TransactionType } from "../types/contracts";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Notice,
  Screen,
  SectionTitle,
  TextInput,
  cx,
  formatDay,
} from "../ui/kit";
import { IconCheckCircle, IconReceipt, IconShield } from "../ui/icons";

const SELECT_CLS =
  "h-11 w-full rounded-xl border border-line bg-white px-3 text-[14px] text-ink outline-none focus:border-brand-600";

type Step = "select" | "mapping" | "review" | "confirm" | "done";

export function ImportStatementScreen() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { profile } = useProfile();
  const { bump } = useDataVersion();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<Step>("select");
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rawFile, setRawFile] = useState<{ name: string; size: number; text: string } | null>(null);
  const [preview, setPreview] = useState<CsvImportPreview | null>(null);
  const [rows, setRows] = useState<ClassifiedStatementRow[]>([]);
  const [manualMapping, setManualMapping] = useState<CsvColumnMapping | null>(null);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [history, setHistory] = useState<CsvImportHistoryEntry[]>(() => listCsvImportHistory(user?.id));

  const summary = useMemo(() => summarizeClassifiedRows(rows), [rows]);
  const reviewRows = useMemo(
    () => rows.filter((r) => r.needsReview && r.duplicateConfidence !== "definite" && r.kind !== "invalid"),
    [rows]
  );

  async function handleFileSelect(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const text = await file.text();
      setRawFile({ name: file.name, size: file.size, text });
      const analyzed = await analyzeCsvStatement({
        fileName: file.name,
        sizeBytes: file.size,
        rawText: text,
      });
      setPreview(analyzed);
      if (analyzed.parseResult.needsManualMapping) {
        setManualMapping(analyzed.parseResult.mapping);
        setStep("mapping");
      } else {
        setRows(analyzed.rows);
        setStep("review");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not read this CSV file.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleApplyManualMapping() {
    if (!rawFile || !manualMapping) return;
    setError(null);
    setBusy(true);
    try {
      const analyzed = await analyzeCsvStatement({
        fileName: rawFile.name,
        sizeBytes: rawFile.size,
        rawText: rawFile.text,
        manualMapping,
      });
      setPreview(analyzed);
      setRows(analyzed.rows);
      setStep("review");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not parse rows with this column mapping.");
    } finally {
      setBusy(false);
    }
  }

  function updateRow(rowId: string, patch: Partial<ClassifiedStatementRow>) {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)));
  }

  function setRowClassification(rowId: string, choice: "income" | "expense" | "skip") {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r;
        if (choice === "skip") {
          return { ...r, skip: true };
        }
        const txType: TransactionType = choice;
        const cats = categoriesFor(txType, profile?.work_profile);
        const keepCat = cats.some((c) => c.value === r.category) ? r.category : "other";
        return {
          ...r,
          skip: false,
          kind: txType,
          transactionType: txType,
          category: keepCat,
          expenseType: txType === "expense" ? (r.expenseType ?? "living") : null,
        };
      })
    );
  }

  async function handleConfirmImport() {
    if (importing || !preview) return;
    setImporting(true);
    setError(null);
    try {
      const res = await confirmAndImportCsvRows({
        userId: user?.id,
        fileName: preview.fileName,
        rows,
        confirmed: true,
      });
      setResult(res);
      setHistory(listCsvImportHistory(user?.id));
      bump();
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  async function handleRetryFailedRows() {
    if (importing || !preview || !result || result.failedRows.length === 0) return;
    const failedIds = new Set(result.failedRows.map((f) => f.rowId));
    const retryRows = rows.filter((r) => failedIds.has(r.rowId));
    if (retryRows.length === 0) return;
    setImporting(true);
    setError(null);
    try {
      const retryRes = await confirmAndImportCsvRows({
        userId: user?.id,
        fileName: preview.fileName,
        rows: retryRows,
        confirmed: true,
      });
      setResult({
        ...retryRes,
        importedCount: result.importedCount + retryRes.importedCount,
        skippedDuplicates: result.skippedDuplicates,
        skippedExcluded: result.skippedExcluded,
        skippedInvalid: result.skippedInvalid,
        importedTransactions: [...result.importedTransactions, ...retryRes.importedTransactions],
      });
      setHistory(listCsvImportHistory(user?.id));
      bump();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Retry failed. Please check your connection and try again.");
    } finally {
      setImporting(false);
    }
  }

  function resetFlow() {
    setStep("select");
    setRawFile(null);
    setPreview(null);
    setRows([]);
    setManualMapping(null);
    setResult(null);
    setError(null);
  }

  return (
    <Screen title="Import bank statement" subtitle="Upload a CSV statement to review and add transactions" back="/activity">
      {error ? <Notice tone="danger">{error}</Notice> : null}

      {step === "select" ? (
        <>
          <Card className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-11 h-11 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                <IconReceipt size={22} />
              </span>
              <div className="space-y-1">
                <h2 className="text-[16px] font-bold text-ink">Select your bank CSV file</h2>
                <p className="text-[13px] text-ink-muted">
                  FLOVA automatically finds dates, amounts, duplicates, transfers, and categories. You only review what looks uncertain.
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => void handleFileSelect(e.target.files?.[0])}
            />

            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              {busy ? "Analysing statement…" : "Choose CSV file"}
            </Button>

            <div className="flex items-center gap-2 text-[12px] text-ink-muted">
              <IconShield size={15} className="text-brand-700 shrink-0" />
              <span>Processed privately on your device. Raw statements are never sent to AI or third-party services.</span>
            </div>
          </Card>

          <section className="space-y-2">
            <SectionTitle>Recent imports</SectionTitle>
            {history.length === 0 ? (
              <Card>
                <EmptyState icon={<IconReceipt size={20} />} title="No imports yet">
                  Your past statement imports will appear here without storing raw bank files.
                </EmptyState>
              </Card>
            ) : (
              <Card className="p-1 divide-y divide-line">
                {history.map((h) => (
                  <div key={h.id} className="px-3 py-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[14px] font-semibold text-ink truncate">{h.fileName}</p>
                      <span className="text-[12px] text-ink-muted shrink-0">{formatDay(h.importedAt.slice(0, 10))}</span>
                    </div>
                    <p className="text-[12px] text-ink-muted">
                      {h.importedCount} imported · {h.skippedDuplicates} duplicates skipped · {h.skippedInvalid} skipped/invalid
                    </p>
                  </div>
                ))}
              </Card>
            )}
          </section>
        </>
      ) : null}

      {step === "mapping" && preview && manualMapping ? (
        <Card className="p-4 space-y-4">
          <div className="space-y-1">
            <h2 className="text-[16px] font-bold text-ink">Match your statement columns</h2>
            <p className="text-[13px] text-ink-muted">
              {preview.parseResult.mappingReason || "Select which columns hold the date, description, and amounts."}
            </p>
          </div>

          <Field label="Transaction date">
            {(id) => (
              <select
                id={id}
                className={SELECT_CLS}
                value={String(manualMapping.date)}
                onChange={(e) => setManualMapping({ ...manualMapping, date: Number(e.target.value) })}
              >
                {preview.parseResult.headers.map((h, i) => (
                  <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Description / Narration">
            {(id) => (
              <select
                id={id}
                className={SELECT_CLS}
                value={String(manualMapping.description)}
                onChange={(e) => setManualMapping({ ...manualMapping, description: Number(e.target.value) })}
              >
                {preview.parseResult.headers.map((h, i) => (
                  <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                ))}
              </select>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Debit / Withdrawal">
              {(id) => (
                <select
                  id={id}
                  className={SELECT_CLS}
                  value={manualMapping.debit === null ? "" : String(manualMapping.debit)}
                  onChange={(e) =>
                    setManualMapping({ ...manualMapping, debit: e.target.value === "" ? null : Number(e.target.value) })
                  }
                >
                  <option value="">None</option>
                  {preview.parseResult.headers.map((h, i) => (
                    <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Credit / Deposit">
              {(id) => (
                <select
                  id={id}
                  className={SELECT_CLS}
                  value={manualMapping.credit === null ? "" : String(manualMapping.credit)}
                  onChange={(e) =>
                    setManualMapping({ ...manualMapping, credit: e.target.value === "" ? null : Number(e.target.value) })
                  }
                >
                  <option value="">None</option>
                  {preview.parseResult.headers.map((h, i) => (
                    <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Single amount column">
              {(id) => (
                <select
                  id={id}
                  className={SELECT_CLS}
                  value={manualMapping.amount === null ? "" : String(manualMapping.amount)}
                  onChange={(e) =>
                    setManualMapping({ ...manualMapping, amount: e.target.value === "" ? null : Number(e.target.value) })
                  }
                >
                  <option value="">None</option>
                  {preview.parseResult.headers.map((h, i) => (
                    <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Dr / Cr column">
              {(id) => (
                <select
                  id={id}
                  className={SELECT_CLS}
                  value={manualMapping.type === null ? "" : String(manualMapping.type)}
                  onChange={(e) =>
                    setManualMapping({ ...manualMapping, type: e.target.value === "" ? null : Number(e.target.value) })
                  }
                >
                  <option value="">None</option>
                  {preview.parseResult.headers.map((h, i) => (
                    <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={resetFlow}>Cancel</Button>
            <Button type="button" onClick={() => void handleApplyManualMapping()} disabled={busy}>
              {busy ? "Analysing…" : "Analyse statement"}
            </Button>
          </div>
        </Card>
      ) : null}

      {step === "review" && preview ? (
        <>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[16px] font-bold text-ink truncate">{preview.fileName}</h2>
              <button type="button" onClick={resetFlow} className="text-[13px] font-semibold text-brand-700 shrink-0">
                Change file
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-[13px]">
              <div className="rounded-xl bg-[#F4F6F2] p-3">
                <p className="text-ink-muted text-[12px]">Transactions found</p>
                <p className="text-[18px] font-extrabold tabular-nums text-ink">{summary.totalRows}</p>
              </div>
              <div className="rounded-xl bg-brand-50 p-3">
                <p className="text-brand-800 text-[12px]">Ready to import</p>
                <p className="text-[18px] font-extrabold tabular-nums text-brand-800">{summary.readyToImportCount}</p>
              </div>
              <div className="rounded-xl bg-white border border-line p-3">
                <p className="text-ink-muted text-[12px]">Income / Expenses</p>
                <p className="text-[15px] font-bold tabular-nums text-ink">
                  {summary.incomeCount} in · {summary.expenseCount} out
                </p>
              </div>
              <div className="rounded-xl bg-white border border-line p-3">
                <p className="text-ink-muted text-[12px]">Excluded & duplicates</p>
                <p className="text-[15px] font-bold tabular-nums text-ink">
                  {summary.transferCount + summary.borrowedCount + summary.excludedCount} excluded · {summary.duplicateCount} duplicates
                </p>
              </div>
            </div>

            {summary.invalidCount > 0 ? (
              <p className="text-[12px] text-ink-muted">
                {summary.invalidCount} row{summary.invalidCount === 1 ? "" : "s"} skipped due to missing date or amount.
              </p>
            ) : null}
          </Card>

          <section className="space-y-2.5">
            <SectionTitle>
              Needs your review ({reviewRows.length})
            </SectionTitle>

            {reviewRows.length === 0 ? (
              <Notice tone="success" title="Everything looks clear">
                All valid transactions were matched automatically, and duplicates or transfers are already handled.
              </Notice>
            ) : (
              reviewRows.map((r) => {
                const effectiveType: "income" | "expense" | "skip" = r.skip
                  ? "skip"
                  : r.transactionType === "income"
                    ? "income"
                    : "expense";
                const catOptions =
                  effectiveType === "skip"
                    ? []
                    : categoriesFor(effectiveType, profile?.work_profile);

                return (
                  <Card key={r.rowId} className={cx("p-4 space-y-3", r.skip && "opacity-75")}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[12px] text-ink-muted">{r.date ? formatDay(r.date) : "Unknown date"}</p>
                        <p className="text-[14px] font-semibold text-ink break-words">{r.description}</p>
                      </div>
                      <p className="text-[16px] font-extrabold tabular-nums text-ink shrink-0">
                        {r.amountPaise ? formatINR(r.amountPaise) : "—"}
                      </p>
                    </div>

                    {r.reviewReason ? (
                      <p className="text-[12px] text-amber-800 bg-amber-50 rounded-lg px-2.5 py-1.5">
                        {r.reviewReason}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <Chip active={effectiveType === "income"} onClick={() => setRowClassification(r.rowId, "income")}>
                        Income
                      </Chip>
                      <Chip active={effectiveType === "expense"} onClick={() => setRowClassification(r.rowId, "expense")}>
                        Expense
                      </Chip>
                      <Chip active={effectiveType === "skip"} onClick={() => setRowClassification(r.rowId, "skip")}>
                        Skip
                      </Chip>
                    </div>

                    {effectiveType !== "skip" ? (
                      <div className="space-y-2.5 pt-1">
                        <div className="grid grid-cols-1 gap-2.5">
                          <Field label="Category">
                            {(id) => (
                              <select
                                id={id}
                                className={SELECT_CLS}
                                value={r.category}
                                onChange={(e) => updateRow(r.rowId, { category: e.target.value })}
                              >
                                {catOptions.map((c) => (
                                  <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                              </select>
                            )}
                          </Field>

                          {effectiveType === "expense" ? (
                            <div className="flex gap-2">
                              {(["living", "work"] as ExpenseType[]).map((et) => (
                                <Chip
                                  key={et}
                                  active={(r.expenseType ?? "living") === et}
                                  onClick={() => updateRow(r.rowId, { expenseType: et })}
                                >
                                  {et === "living" ? "Personal / Living" : "Work"}
                                </Chip>
                              ))}
                            </div>
                          ) : null}

                          <Field label="Description">
                            {(id) => (
                              <TextInput
                                id={id}
                                value={r.description}
                                maxLength={160}
                                onChange={(e) => updateRow(r.rowId, { description: e.target.value })}
                              />
                            )}
                          </Field>
                        </div>
                      </div>
                    ) : null}
                  </Card>
                );
              })
            )}
          </section>

          <div className="pt-2 space-y-2">
            <Button
              type="button"
              disabled={summary.readyToImportCount === 0}
              onClick={() => setStep("confirm")}
            >
              Continue ({summary.readyToImportCount} transaction{summary.readyToImportCount === 1 ? "" : "s"})
            </Button>
            {summary.readyToImportCount === 0 ? (
              <p className="text-center text-[12px] text-ink-muted">
                No new transactions selected to import. Duplicates and skipped rows are excluded.
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      {step === "confirm" && preview ? (
        <Card className="p-5 space-y-4">
          <h2 className="text-[18px] font-bold text-ink">
            You are about to import {summary.readyToImportCount} transaction{summary.readyToImportCount === 1 ? "" : "s"}.
          </h2>
          <p className="text-[13px] text-ink-muted">
            Existing FLOVA records will be preserved. {summary.duplicateCount} duplicate{summary.duplicateCount === 1 ? "" : "s"} and{" "}
            {summary.transferCount + summary.borrowedCount + summary.excludedCount} excluded row{summary.transferCount + summary.borrowedCount + summary.excludedCount === 1 ? "" : "s"} will not be imported.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" disabled={importing} onClick={() => setStep("review")}>
              Back to review
            </Button>
            <Button type="button" disabled={importing} onClick={() => void handleConfirmImport()}>
              {importing ? "Importing…" : "Confirm & import"}
            </Button>
          </div>
        </Card>
      ) : null}

      {step === "done" && result ? (
        <Card className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <span className="w-11 h-11 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
              <IconCheckCircle size={24} />
            </span>
            <div className="space-y-1">
              <h2 className="text-[18px] font-bold text-ink">
                Imported {result.importedCount} transaction{result.importedCount === 1 ? "" : "s"}
              </h2>
              <p className="text-[13px] text-ink-muted">
                {result.skippedDuplicates} duplicate{result.skippedDuplicates === 1 ? "" : "s"} skipped ·{" "}
                {result.skippedExcluded + result.skippedInvalid} skipped or invalid
              </p>
            </div>
          </div>

          {result.failedRows.length > 0 ? (
            <Notice
              tone="warn"
              title={`${result.failedRows.length} row(s) could not be saved`}
              action={
                <Button type="button" variant="secondary" disabled={importing} onClick={() => void handleRetryFailedRows()}>
                  {importing ? "Retrying…" : "Retry failed rows"}
                </Button>
              }
            >
              {result.failedRows.slice(0, 3).map((f) => `Row ${f.rowNumber}: ${f.reason}`).join(" | ")}
            </Notice>
          ) : null}

          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={resetFlow}>
              Import another
            </Button>
            <Button type="button" onClick={() => navigate("/activity")}>
              View activity
            </Button>
          </div>
        </Card>
      ) : null}
    </Screen>
  );
}
