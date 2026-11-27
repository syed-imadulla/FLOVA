// One review/edit form for every way a transaction enters FLOVA: voice, receipt scan, or manual.
// Nothing is saved until the user presses Confirm. Missing values stay empty and block saving:
// an amount is never assumed, and own expenses must be classified as living or work by the user.
import { useState } from "react";
import { categoriesFor, EXPENSE_CATEGORIES } from "./categories";
import { parseRequiredRupees } from "../profile/parseRupees";
import { todayLocalISO } from "../data/dates";
import type { ExpenseType, InflowCategory, MoneyOwnership, PaymentMethod, TransactionType, WorkProfile } from "../types/contracts";
import { Button, Card, Field, MoneyInput, Notice, Segmented, SelectInput, TextInput, cx } from "../ui/kit";
import { IconCheck } from "../ui/icons";

export interface TxDraft {
  type: TransactionType;
  amount: string;
  category: string;
  expenseType: ExpenseType | "";
  inflowCategory?: InflowCategory | "";
  paymentMethod?: PaymentMethod | "";
  ownership: MoneyOwnership;
  date: string;
  note: string;
}

export interface TxSubmit {
  type: TransactionType;
  amountPaise: number;
  category: string;
  expenseType: ExpenseType | null;
  inflowCategory: InflowCategory | null;
  paymentMethod: PaymentMethod | null;
  ownership: MoneyOwnership;
  date: string;
  note: string;
}

const INFLOW_OPTIONS: Array<{ value: InflowCategory; label: string }> = [
  { value: "earned", label: "Earned income (work, salary, sales)" },
  { value: "family_support", label: "Family support" },
  { value: "pocket_money", label: "Pocket money" },
  { value: "gift", label: "Gift" },
  { value: "donation", label: "Donation" },
];

const PAYMENT_METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "upi", label: "UPI" },
];

export function emptyDraft(type: TransactionType = "expense"): TxDraft {
  return {
    type,
    amount: "",
    category: type === "income" ? "earnings" : "",
    expenseType: "",
    inflowCategory: type === "income" ? "earned" : "",
    paymentMethod: "",
    ownership: "mine",
    date: todayLocalISO(),
    note: "",
  };
}

export function TransactionForm({
  initial,
  lockType,
  allowNotMine = true,
  aiNote,
  workProfile,
  submitLabel = "Confirm & save",
  onSubmit,
  onCancel,
  cancelLabel = "Discard",
}: {
  initial: TxDraft;
  lockType?: boolean;
  /** Receipts are always the user's own expense, so the "not mine" option is hidden there. */
  allowNotMine?: boolean;
  /** Shown above the form when the values came from AI. */
  aiNote?: React.ReactNode;
  workProfile?: WorkProfile | null;
  submitLabel?: string;
  onSubmit: (v: TxSubmit) => Promise<void>;
  onCancel?: () => void;
  cancelLabel?: string;
}) {
  const [d, setD] = useState<TxDraft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const set = <K extends keyof TxDraft>(k: K, v: TxDraft[K]) => {
    setD((cur) => ({ ...cur, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const needsExpenseType = d.type === "expense" && d.ownership === "mine";
  const needsInflowCategory = d.type === "income" && d.ownership === "mine";
  const suggestion = EXPENSE_CATEGORIES.find((c) => c.value === d.category)?.suggests;

  async function submit() {
    const next: Record<string, string> = {};
    const amt = parseRequiredRupees(d.amount);
    if (!amt.ok) next.amount = d.amount.trim() ? amt.message : "Enter the amount. FLOVA never guesses it.";
    if (!d.category) next.category = "Choose a category";
    if (needsExpenseType && !d.expenseType) next.expenseType = "Is this a living cost or a work cost?";
    if (!d.date) next.date = "Choose a date";
    setErrors(next);
    if (Object.keys(next).length || !amt.ok) return;

    setSaving(true);
    setSaveError(null);
    try {
      await onSubmit({
        type: d.type,
        amountPaise: amt.paise,
        category: d.category,
        expenseType: needsExpenseType ? (d.expenseType as ExpenseType) : null,
        inflowCategory: needsInflowCategory ? ((d.inflowCategory || null) as InflowCategory | null) : null,
        paymentMethod: (d.paymentMethod || null) as PaymentMethod | null,
        ownership: d.ownership,
        date: d.date,
        note: d.note.trim(),
      });
    } catch (err) {
      // Keep the form (and the candidate id held by the caller) so a retry stays idempotent.
      setSaveError(err instanceof Error ? err.message : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {aiNote ? <Notice tone="success">{aiNote}</Notice> : null}

      <Card className="p-4 space-y-4">
        {!lockType ? (
          <Segmented
            value={d.type}
            onChange={(t) =>
              setD((cur) => ({
                ...cur,
                type: t,
                category: t === "income" ? (cur.type === "income" ? cur.category : "earnings") : cur.type === "expense" ? cur.category : "",
                inflowCategory: t === "income" ? (cur.inflowCategory || "earned") : "",
              }))
            }
            options={[
              { value: "income", label: "Income" },
              { value: "expense", label: "Expense" },
            ]}
          />
        ) : null}

        <Field label="Amount" error={errors.amount}>
          {(id) => <MoneyInput id={id} large value={d.amount} onChange={(v) => set("amount", v)} invalid={!!errors.amount} />}
        </Field>

        <Field label="Category" error={errors.category}>
          {(id) => (
            <SelectInput id={id} value={d.category} onChange={(e) => set("category", e.target.value)} invalid={!!errors.category}>
              <option value="" disabled>
                Choose…
              </option>
              {categoriesFor(d.type, workProfile).map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
              {d.category && !categoriesFor(d.type, workProfile).some((c) => c.value === d.category) ? <option value={d.category}>{d.category}</option> : null}
            </SelectInput>
          )}
        </Field>

        {needsExpenseType ? (
          <div className="space-y-1.5">
            <p className="text-[13px] font-semibold text-ink-soft">Living or work cost?</p>
            <div className="grid grid-cols-2 gap-2">
              {(["living", "work"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("expenseType", t)}
                  aria-pressed={d.expenseType === t}
                  className={cx(
                    "h-12 rounded-xl border text-sm font-semibold flex items-center justify-center gap-1.5",
                    d.expenseType === t ? "border-brand-700 bg-brand-50 text-brand-800" : errors.expenseType ? "border-red-300 bg-white text-ink-soft" : "border-line bg-white text-ink-soft"
                  )}
                >
                  {d.expenseType === t ? <IconCheck size={16} /> : null}
                  {t === "living" ? "Living (food, home)" : "Work (fuel, tools)"}
                </button>
              ))}
            </div>
            {errors.expenseType ? (
              <p className="text-xs font-medium text-red-700">{errors.expenseType}</p>
            ) : suggestion && !d.expenseType ? (
              <p className="text-xs text-ink-muted">Usually a {suggestion} cost. Tap to confirm.</p>
            ) : null}
          </div>
        ) : null}

        {needsInflowCategory ? (
          <Field label="Income source" hint="Gifts and family support are kept separate from earned income. For loans, use Money.">
            {(id) => (
              <SelectInput
                id={id}
                value={d.inflowCategory ?? ""}
                onChange={(e) => set("inflowCategory", e.target.value as InflowCategory | "")}
              >
                <option value="">Not specified (counts as earned)</option>
                {INFLOW_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </SelectInput>
            )}
          </Field>
        ) : null}

        <div className="space-y-1.5">
          <p className="text-[13px] font-semibold text-ink-soft">Payment method (optional)</p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHOD_OPTIONS.map((m) => {
              const active = d.paymentMethod === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => set("paymentMethod", active ? "" : m.value)}
                  aria-pressed={active}
                  className={cx(
                    "h-11 rounded-xl border text-sm font-semibold flex items-center justify-center gap-1.5",
                    active ? "border-brand-700 bg-brand-50 text-brand-800" : "border-line bg-white text-ink-soft"
                  )}
                >
                  {active ? <IconCheck size={15} /> : null}
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Date" error={errors.date}>
          {(id) => <TextInput id={id} type="date" max={todayLocalISO()} value={d.date} onChange={(e) => set("date", e.target.value)} invalid={!!errors.date} />}
        </Field>

        <Field label="Notes" hint="Optional, e.g. who paid or what it was for">
          {(id) => <TextInput id={id} value={d.note} maxLength={140} onChange={(e) => set("note", e.target.value)} placeholder="Add a note" />}
        </Field>

        {allowNotMine ? (
        <label className="flex items-start gap-3 rounded-xl bg-[#F4F5F2] p-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 accent-brand-700"
            checked={d.ownership === "not_mine"}
            onChange={(e) => set("ownership", e.target.checked ? "not_mine" : "mine")}
          />
          <span className="text-[13px] text-ink-soft">
            <b className="text-ink">This money isn't mine</b>
            <br />
            COD cash, platform money or funds held for someone else. Kept separate from your available money.
          </span>
        </label>
        ) : null}
      </Card>

      {saveError ? <Notice tone="danger" title="Not saved">{saveError}</Notice> : null}

      <div className="space-y-2">
        <Button onClick={submit} loading={saving} icon={<IconCheck size={18} />}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            {cancelLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
