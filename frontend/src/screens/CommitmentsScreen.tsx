// Bills & debts — upcoming commitments the runway deducts on their due date.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { paiseToInput } from "../app/moneyText";
import type { ReviewState } from "./AddScreen";
import { useCommitments } from "../data/useCommitments";
import { todayLocalISO } from "../data/dates";
import { formatINR, toPaise } from "../lib/money";
import { parseRequiredRupees } from "../profile/parseRupees";
import type { Commitment, CommitmentKind } from "../types/contracts";
import { Button, Card, EmptyState, Field, ListRow, MoneyInput, Notice, Screen, SectionTitle, Segmented, Sheet, Skeleton, TextInput, daysFromToday, formatDay } from "../ui/kit";
import { IconCalendar, IconPlus } from "../ui/icons";

export function CommitmentsScreen() {
  const navigate = useNavigate();
  const { items, loading, error, add, setStatus } = useCommitments("upcoming");
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Commitment | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const today = todayLocalISO();
  const total = items.reduce((s, c) => s + toPaise(c.amount), 0);

  async function mark(status: "paid" | "cancelled", recordExpense: boolean) {
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
          <p className="text-[13px] text-ink-muted">Upcoming total</p>
          <p className="text-[22px] font-extrabold tabular-nums">{loading ? "…" : formatINR(total)}</p>
        </div>
      </Card>

      {formOpen ? (
        <CommitmentForm
          onCancel={() => setFormOpen(false)}
          onSave={async (c) => {
            await add(c);
            setFormOpen(false);
          }}
        />
      ) : (
        <Button variant="secondary" icon={<IconPlus size={18} />} onClick={() => setFormOpen(true)}>
          Add bill or debt
        </Button>
      )}

      <SectionTitle>Upcoming</SectionTitle>
      <Card className="p-1">
        {loading ? (
          <div className="p-3 space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={<IconCalendar size={22} />} title="No bills coming up">Add rent, EMI, school fees or money you owe.</EmptyState>
        ) : (
          <div className="divide-y divide-line">
            {items.map((c) => {
              const d = daysFromToday(c.due_date, today);
              return (
                <ListRow
                  key={c.id}
                  onClick={() => setSelected(c)}
                  icon={<IconCalendar size={18} />}
                  iconTone={d < 0 ? "expense" : d <= 3 ? "warn" : "neutral"}
                  title={c.title}
                  subtitle={`${c.kind === "debt" ? "Debt" : "Bill"} · ${d < 0 ? `Overdue since ${formatDay(c.due_date)}` : d === 0 ? "Due today" : `Due ${formatDay(c.due_date)}`}`}
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
              {formatINR(toPaise(selected.amount))} · due {formatDay(selected.due_date)}
            </p>
            {actionErr ? <Notice tone="danger">{actionErr}</Notice> : null}
            <Button onClick={() => mark("paid", true)} loading={busy}>
              Paid. Record the expense
            </Button>
            <Button variant="secondary" onClick={() => mark("paid", false)} disabled={busy}>
              Paid, already recorded
            </Button>
            <Button variant="danger" onClick={() => mark("cancelled", false)} disabled={busy}>
              No longer due, remove it
            </Button>
          </div>
        ) : null}
      </Sheet>
    </Screen>
  );
}

function CommitmentForm({ onSave, onCancel }: { onSave: (c: { title: string; amount: number; dueDate: string; kind: CommitmentKind }) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState(todayLocalISO());
  const [kind, setKind] = useState<CommitmentKind>("bill");
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
