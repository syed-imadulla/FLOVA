// Expected payments — money you're owed. Never counted as available until marked received;
// the received amount is derived by the database from linked income transactions.
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { paiseToInput } from "../app/moneyText";
import { usePayouts } from "../data/usePayouts";
import { todayLocalISO } from "../data/dates";
import { formatINR, toPaise } from "../lib/money";
import { parseRequiredRupees } from "../profile/parseRupees";
import type { Payout, PayoutKind } from "../types/contracts";
import { Button, Card, EmptyState, Field, ListRow, MoneyInput, Notice, Screen, SectionTitle, SelectInput, Sheet, Skeleton, TextInput, formatDay } from "../ui/kit";
import { IconCheckCircle, IconClock, IconPlus } from "../ui/icons";

export interface PayoutPrefillState {
  prefill: { amount?: string; source?: string; date?: string; kind?: PayoutKind };
  aiNote?: string;
}

const KIND_LABEL: Record<PayoutKind, string> = {
  platform_payout: "Platform payout",
  incentive: "Incentive / bonus",
  client_payment: "Client payment",
  advance: "Advance",
  other: "Other",
};
const OPEN = new Set(["scheduled", "estimated", "unearned", "partial"]);

function newId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : undefined;
}

export function PayoutsScreen() {
  const nav = (useLocation().state as PayoutPrefillState | null) ?? null;
  const { items, loading, error, add, receive, setStatus } = usePayouts();
  const [formOpen, setFormOpen] = useState<boolean>(!!nav);
  const [receiving, setReceiving] = useState<Payout | null>(null);

  const open = items.filter((p) => OPEN.has(p.status));
  const done = items.filter((p) => !OPEN.has(p.status)).slice(0, 10);
  const totalOpen = open.reduce((s, p) => s + Math.max(0, toPaise(p.expected_amount) - toPaise(p.received_amount)), 0);

  return (
    <Screen title="Expected payments" subtitle="Money you're owed, not counted until received" back="/more">
      {nav?.aiNote ? <Notice tone="success">{nav.aiNote}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <Card tone="warn" className="p-4 flex items-center gap-3">
        <IconClock className="text-amber-700 shrink-0" />
        <div className="flex-1">
          <p className="text-[13px] text-amber-900">Still to receive</p>
          <p className="text-[22px] font-extrabold tabular-nums text-ink">{loading ? "…" : formatINR(totalOpen)}</p>
        </div>
      </Card>

      {formOpen ? (
        <PayoutForm
          prefill={nav?.prefill}
          onCancel={() => setFormOpen(false)}
          onSave={async (p) => {
            await add(p);
            setFormOpen(false);
          }}
        />
      ) : (
        <Button variant="secondary" icon={<IconPlus size={18} />} onClick={() => setFormOpen(true)}>
          Add expected payment
        </Button>
      )}

      <SectionTitle>Waiting for</SectionTitle>
      <Card className="p-1">
        {loading ? (
          <div className="p-3 space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : open.length === 0 ? (
          <EmptyState icon={<IconClock size={22} />} title="Nothing pending">Add a payout or client payment you're expecting.</EmptyState>
        ) : (
          <div className="divide-y divide-line">
            {open.map((p) => {
              const exp = toPaise(p.expected_amount);
              const rec = toPaise(p.received_amount);
              return (
                <div key={p.id} className="flex items-center gap-2 pr-2">
                  <div className="flex-1 min-w-0">
                    <ListRow
                      icon={<IconClock size={18} />}
                      iconTone="warn"
                      title={p.source || KIND_LABEL[p.kind]}
                      subtitle={`${p.expected_date ? formatDay(p.expected_date) : "Date unknown"} · ${p.status === "partial" ? `${formatINR(rec)} received` : p.status === "estimated" ? "Estimate" : "Expected"}`}
                      value={formatINR(exp - rec)}
                    />
                  </div>
                  <button type="button" onClick={() => setReceiving(p)} className="h-9 px-3 rounded-full bg-brand-700 text-white text-xs font-semibold shrink-0">
                    Received
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {done.length ? (
        <>
          <SectionTitle>Recent</SectionTitle>
          <Card className="p-1 divide-y divide-line">
            {done.map((p) => (
              <ListRow
                key={p.id}
                icon={<IconCheckCircle size={18} />}
                iconTone={p.status === "settled" ? "income" : "neutral"}
                title={p.source || KIND_LABEL[p.kind]}
                subtitle={p.status === "settled" ? "Received in full" : "Cancelled"}
                value={formatINR(toPaise(p.received_amount) || toPaise(p.expected_amount))}
                valueTone="muted"
              />
            ))}
          </Card>
        </>
      ) : null}

      <ReceiveSheet
        payout={receiving}
        onClose={() => setReceiving(null)}
        onReceive={async (amount, date, idem) => {
          await receive(receiving!.id, amount, date, idem);
          setReceiving(null);
        }}
        onCancelPayout={async () => {
          await setStatus(receiving!.id, "cancelled");
          setReceiving(null);
        }}
      />
    </Screen>
  );
}

function PayoutForm({
  prefill,
  onSave,
  onCancel,
}: {
  prefill?: PayoutPrefillState["prefill"];
  onSave: (p: { expected: number; kind: PayoutKind; source?: string; expectedDate: string | null; status: "scheduled" | "estimated" }) => Promise<void>;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState(prefill?.amount ?? "");
  const [source, setSource] = useState(prefill?.source ?? "");
  const [date, setDate] = useState(prefill?.date ?? "");
  const [kind, setKind] = useState<PayoutKind>(prefill?.kind ?? "platform_payout");
  const [estimate, setEstimate] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const a = parseRequiredRupees(amount);
    if (!a.ok) return setErr(amount.trim() ? a.message : "Enter the amount you expect");
    setErr(null);
    setSaving(true);
    setSaveErr(null);
    try {
      await onSave({ expected: a.paise, kind, source: source.trim() || undefined, expectedDate: date || null, status: estimate ? "estimated" : "scheduled" });
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <Field label="Amount expected" error={err}>
        {(id) => <MoneyInput id={id} value={amount} onChange={setAmount} invalid={!!err} />}
      </Field>
      <Field label="From" hint="e.g. Swiggy, Uber, a client's name">
        {(id) => <TextInput id={id} value={source} maxLength={60} onChange={(e) => setSource(e.target.value)} placeholder="Who will pay" />}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          {(id) => (
            <SelectInput id={id} value={kind} onChange={(e) => setKind(e.target.value as PayoutKind)}>
              {Object.entries(KIND_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>
        <Field label="Expected on" hint="Leave empty if unsure">
          {(id) => <TextInput id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
        </Field>
      </div>
      <label className="flex items-center gap-3 text-[13px] text-ink-soft">
        <input type="checkbox" className="h-5 w-5 accent-brand-700" checked={estimate} onChange={(e) => setEstimate(e.target.checked)} />
        This amount is only an estimate
      </label>
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

function ReceiveSheet({
  payout,
  onClose,
  onReceive,
  onCancelPayout,
}: {
  payout: Payout | null;
  onClose: () => void;
  onReceive: (amountPaise: number, date: string, idempotencyId?: string) => Promise<void>;
  onCancelPayout: () => Promise<void>;
}) {
  return (
    <Sheet open={!!payout} onClose={onClose} title="Mark as received">
      {payout ? <ReceiveBody key={payout.id} payout={payout} onReceive={onReceive} onCancelPayout={onCancelPayout} /> : null}
    </Sheet>
  );
}

function ReceiveBody({ payout, onReceive, onCancelPayout }: { payout: Payout; onReceive: (a: number, d: string, i?: string) => Promise<void>; onCancelPayout: () => Promise<void> }) {
  const remaining = Math.max(0, toPaise(payout.expected_amount) - toPaise(payout.received_amount));
  const [amount, setAmount] = useState(paiseToInput(remaining));
  const [date, setDate] = useState(todayLocalISO());
  // One idempotency id per sheet: retries after a network error can't double-count the income.
  const [idem] = useState(newId);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "cancel" | null>(null);

  async function save() {
    const a = parseRequiredRupees(amount);
    if (!a.ok) return setErr(a.message);
    setBusy("save");
    setErr(null);
    try {
      await onReceive(a.paise, date, idem);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-ink-muted">
        {payout.source || KIND_LABEL[payout.kind]} · {formatINR(remaining)} still expected. This is recorded as income you've actually received.
      </p>
      <Field label="Amount received" error={err}>
        {(id) => <MoneyInput id={id} value={amount} onChange={setAmount} invalid={!!err} autoFocus />}
      </Field>
      <Field label="Received on">{(id) => <TextInput id={id} type="date" max={todayLocalISO()} value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
      <Button onClick={save} loading={busy === "save"} disabled={busy !== null}>
        Save as received
      </Button>
      <Button
        variant="danger"
        loading={busy === "cancel"}
        disabled={busy !== null}
        onClick={async () => {
          setBusy("cancel");
          try {
            await onCancelPayout();
          } catch (e) {
            setErr(e instanceof Error ? e.message : "Could not cancel");
          } finally {
            setBusy(null);
          }
        }}
      >
        It won't come, cancel it
      </Button>
    </div>
  );
}
