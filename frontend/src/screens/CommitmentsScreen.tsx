// Bills & debts — upcoming commitments the runway deducts on their due date.
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buildCommitmentsIntelligenceModel } from "../app/insightsCommitmentsModel";
import { paiseToInput } from "../app/moneyText";
import {
  FINANCIAL_TERMS,
  formatFinancialAmount,
  useFinancialIntelligence,
} from "../app/useFinancialIntelligence";
import type { ReviewState } from "./AddScreen";
import { useCommitments } from "../data/useCommitments";
import { todayLocalISO } from "../data/dates";
import { formatINR, toPaise } from "../lib/money";
import { parseRequiredRupees } from "../profile/parseRupees";
import type { Commitment, CommitmentKind, CommitmentStatus } from "../types/contracts";
import { Button, Card, EmptyState, Field, ListRow, MoneyInput, Notice, Screen, SectionTitle, Segmented, Sheet, Skeleton, TextInput, daysFromToday, formatDay } from "../ui/kit";
import { IconCalendar, IconPlus } from "../ui/icons";

export function CommitmentsScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<CommitmentStatus | "all">("upcoming");
  const { items, loading, error, add, update, setStatus } = useCommitments(filter);
  const { data: intel } = useFinancialIntelligence({ horizonDays: 30 });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Commitment | null>(null);
  const [selected, setSelected] = useState<Commitment | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const today = todayLocalISO();
  const model = useMemo(
    () => buildCommitmentsIntelligenceModel({ items, filter, intel, todayISO: today }),
    [items, filter, intel, today]
  );
  const total = model.displayedTotalPaise;

  async function mark(status: CommitmentStatus, recordExpense: boolean) {
    if (!selected) return;
    setBusy(true);
    setActionErr(null);
    try {
      await setStatus(selected.id, status);
      const c = selected;
      setSelected(null);
      if (recordExpense) {
        const state: ReviewState = {
          draft: { type: "expense", amount: paiseToInput(toPaise(c.amount)), category: c.category || "other", expenseType: "", ownership: "mine", date: today, note: c.title },
        };
        navigate("/add", { state });
      }
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="Bills & debts" subtitle="Planned payments FLOVA keeps aside for" back="/more">
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <Card className="p-4 flex items-center gap-3">
        <IconCalendar className="text-brand-700 shrink-0" />
        <div className="flex-1">
          <p className="text-[13px] text-ink-muted">
            {filter === "upcoming"
              ? "Upcoming total"
              : filter === "paid"
                ? "Paid total"
                : filter === "cancelled"
                  ? "Cancelled total"
                  : "All commitments total"}
          </p>
          <p className="text-[22px] font-extrabold tabular-nums">{loading ? "…" : formatINR(total)}</p>
        </div>
      </Card>

      {/* Safe-to-Spend & Overdue Impact */}
      {!loading && (model.confirmedCashPaise !== null || model.overdueCount > 0) ? (
        <Card tone={model.hasPressure ? "warn" : "soft"} className="p-3.5 space-y-2 text-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-ink-muted">Remaining monthly allowance (after this month&apos;s bills)</p>
              <p className="text-[16px] font-extrabold tabular-nums text-ink">
                {formatFinancialAmount(model.remainingMonthlyAllowancePaise)}
              </p>
            </div>
            <Link to="/insights" className="font-semibold text-brand-700 shrink-0">
              View insights →
            </Link>
          </div>
          {model.overdueCount > 0 ? (
            <p className="text-red-700 font-semibold">
              {model.overdueCount} overdue commitment{model.overdueCount === 1 ? "" : "s"} ({formatINR(model.overdueTotalPaise)}) — deducted from Safe-to-Spend.
            </p>
          ) : model.shortfallPaise > 0 ? (
            <p className="text-red-700 font-semibold">
              Shortfall of {formatINR(model.shortfallPaise)} after cushion, debts, and due bills.
            </p>
          ) : model.laterMonthCommitmentsPaise > 0 ? (
            <p className="text-ink-muted">
              {formatINR(model.laterMonthCommitmentsPaise)} due after{" "}
              {model.nextExpectedIncomeDate ? formatDay(model.nextExpectedIncomeDate) : "your current horizon"} is deducted from your monthly allowance ({formatFinancialAmount(model.remainingMonthlyAllowancePaise)}), not from short-horizon {FINANCIAL_TERMS.safeToSpend.label} ({formatFinancialAmount(model.safeToSpendPaise)}).
            </p>
          ) : (
            <p className="text-ink-muted">
              Upcoming bills within your {FINANCIAL_TERMS.safeToSpend.label} ({formatFinancialAmount(model.safeToSpendPaise)}) are already deducted once; paid and cancelled bills are excluded.
            </p>
          )}
        </Card>
      ) : null}

      {formOpen || editing ? (
        <CommitmentForm
          initial={editing ?? undefined}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSave={async (c) => {
            if (editing) {
              await update(editing.id, c);
              setEditing(null);
            } else {
              await add(c);
              setFormOpen(false);
            }
          }}
        />
      ) : (
        <Button variant="secondary" icon={<IconPlus size={18} />} onClick={() => setFormOpen(true)}>
          Add bill or debt
        </Button>
      )}

      <Segmented
        value={filter}
        onChange={setFilter}
        size="sm"
        options={[
          { value: "upcoming", label: "Upcoming" },
          { value: "paid", label: "Paid" },
          { value: "cancelled", label: "Cancelled" },
          { value: "all", label: "All" },
        ]}
      />

      <SectionTitle>
        {filter === "upcoming"
          ? "Upcoming"
          : filter === "paid"
            ? "Paid history"
            : filter === "cancelled"
              ? "Cancelled history"
              : "All history"}
      </SectionTitle>
      <Card className="p-1">
        {loading ? (
          <div className="p-3 space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={<IconCalendar size={22} />} title={filter === "upcoming" ? "No bills coming up" : "No records here"}>
            {filter === "upcoming" ? "Add rent, EMI, school fees or money you owe." : "Paid or cancelled bills and debts will appear here."}
          </EmptyState>
        ) : (
          <div className="divide-y divide-line">
            {items.map((c) => {
              const d = daysFromToday(c.due_date, today);
              const statusText =
                c.status === "paid"
                  ? `Paid · Due ${formatDay(c.due_date)}`
                  : c.status === "cancelled"
                    ? `Cancelled · Due ${formatDay(c.due_date)}`
                    : d < 0
                      ? `Overdue since ${formatDay(c.due_date)}`
                      : d === 0
                        ? "Due today"
                        : `Due ${formatDay(c.due_date)}`;
              return (
                <ListRow
                  key={c.id}
                  onClick={() => {
                    setSelected(c);
                    setActionErr(null);
                  }}
                  icon={<IconCalendar size={18} />}
                  iconTone={c.status === "paid" ? "income" : c.status === "cancelled" ? "neutral" : d < 0 ? "expense" : d <= 3 ? "warn" : "neutral"}
                  title={c.title}
                  subtitle={`${c.kind === "debt" ? "Debt" : "Bill"} · ${statusText}`}
                  value={formatINR(toPaise(c.amount))}
                />
              );
            })}
          </div>
        )}
      </Card>

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.title ?? ""}>
        {selected ? (
          <div className="space-y-3">
            <p className="text-[13px] text-ink-muted">
              {formatINR(toPaise(selected.amount))} · due {formatDay(selected.due_date)} · {selected.status}
            </p>
            {actionErr ? <Notice tone="danger">{actionErr}</Notice> : null}
            <Button
              variant="secondary"
              onClick={() => {
                setEditing(selected);
                setFormOpen(false);
                setSelected(null);
              }}
              disabled={busy}
            >
              Edit details
            </Button>
            {selected.status === "upcoming" ? (
              <>
                <Button onClick={() => mark("paid", true)} loading={busy}>
                  Paid. Record the expense
                </Button>
                <Button variant="secondary" onClick={() => mark("paid", false)} disabled={busy}>
                  Paid, already recorded
                </Button>
                <Button variant="danger" onClick={() => mark("cancelled", false)} disabled={busy}>
                  No longer due, remove it
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => mark("upcoming", false)} loading={busy}>
                Move back to upcoming
              </Button>
            )}
          </div>
        ) : null}
      </Sheet>
    </Screen>
  );
}

function CommitmentForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Commitment;
  onSave: (c: { title: string; amount: number; dueDate: string; kind: CommitmentKind }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [amount, setAmount] = useState(initial ? paiseToInput(toPaise(initial.amount)) : "");
  const [due, setDue] = useState(initial?.due_date ?? todayLocalISO());
  const [kind, setKind] = useState<CommitmentKind>(initial?.kind ?? "bill");
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  async function save() {
    const e: Record<string, string> = {};
    const a = parseRequiredRupees(amount);
    if (!title.trim()) e.title = "Give it a name, e.g. Rent";
    if (!a.ok) e.amount = a.message;
    if (!due) e.due = "Choose the due date";
    setErrs(e);
    if (Object.keys(e).length || !a.ok) return;
    setSaving(true);
    setSaveErr(null);
    try {
      await onSave({ title: title.trim(), amount: a.paise, dueDate: due, kind });
    } catch (er) {
      setSaveErr(er instanceof Error ? er.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <Segmented value={kind} onChange={setKind} size="sm" options={[{ value: "bill", label: "Bill" }, { value: "debt", label: "Debt / EMI" }]} />
      <Field label="Name" error={errs.title}>
        {(id) => <TextInput id={id} value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Room rent" invalid={!!errs.title} />}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount" error={errs.amount}>
          {(id) => <MoneyInput id={id} value={amount} onChange={setAmount} invalid={!!errs.amount} />}
        </Field>
        <Field label="Due on" error={errs.due}>
          {(id) => <TextInput id={id} type="date" value={due} onChange={(e) => setDue(e.target.value)} invalid={!!errs.due} />}
        </Field>
      </div>
      {saveErr ? <Notice tone="danger">{saveErr}</Notice> : null}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={save} loading={saving}>
          Save
        </Button>
      </div>
    </Card>
  );
}
