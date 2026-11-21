// WISH — save for what matters, at a pace the runway can afford.
import { useState } from "react";
import { formatINR } from "../lib/money";
import { parseOptionalRupees, parseRequiredRupees } from "../profile/parseRupees";
import { useRunway } from "../runway/useRunway";
import { useWish } from "../wish/useWish";
import type { ContributionCadence } from "../wish/types";
import { Button, Card, Field, MoneyInput, Notice, ProgressBar, Screen, Segmented, Sheet, Skeleton, TextInput, formatDay } from "../ui/kit";
import { IconInfo, IconPiggy, IconTarget } from "../ui/icons";

export function WishScreen() {
  const { wish, calc, loading, error, create, addSavings, markPurchased, archive } = useWish();
  const { runway } = useRunway({ horizonDays: 7 });
  const [adding, setAdding] = useState(false);
  const [changing, setChanging] = useState(false);

  const tight = !!runway?.firstShortfallDate;

  return (
    <Screen title="WISH" subtitle="Build a safety net, one step at a time" back="/more">
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {loading ? (
        <Skeleton className="h-[260px]" />
      ) : !wish || changing ? (
        <WishForm
          onCancel={wish ? () => setChanging(false) : undefined}
          onSave={async (input) => {
            if (wish) await archive();
            await create(input);
            setChanging(false);
          }}
        />
      ) : (
        <>
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <span className="w-16 h-16 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                <IconTarget size={30} />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-ink truncate">{wish.name}</p>
                <p className="text-[26px] font-extrabold tabular-nums">{formatINR(wish.targetPaise)}</p>
              </div>
            </div>
            {calc ? (
              <div className="mt-4 space-y-1.5">
                <ProgressBar ratio={calc.progressRatio} />
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>
                    <b className="text-ink">{formatINR(calc.savedPaise)}</b> saved ({calc.progressPercent}%)
                  </span>
                  <span>{formatINR(calc.remainingPaise)} to go</span>
                </div>
              </div>
            ) : null}
          </Card>

          {calc ? (
            <Card tone="brand" className="p-4 flex gap-3">
              <IconPiggy className="text-brand-700 shrink-0" />
              <div className="text-[13px] text-brand-900">
                {wish.contributionPaise > 0 ? (
                  <p>
                    <b>
                      Saving {formatINR(wish.contributionPaise)} {wish.cadence === "weekly" ? "a week" : "a month"}
                    </b>
                    {calc.estimatedDate ? `: you'll get there around ${formatDay(calc.estimatedDate)}.` : "."}
                  </p>
                ) : (
                  <p>{calc.timelineSummary}</p>
                )}
              </div>
            </Card>
          ) : null}

          {tight ? (
            <Notice tone="warn" title="Money is tight this week">
              Your runway shows a shortfall soon. It's okay to pause savings until things ease.
            </Notice>
          ) : null}

          {calc?.isCompleted ? (
            <Button onClick={() => markPurchased()}>I bought it!</Button>
          ) : (
            <Button onClick={() => setAdding(true)}>Add to savings</Button>
          )}
          <Button variant="ghost" onClick={() => setChanging(true)}>
            Change goal
          </Button>
        </>
      )}

      <div className="flex gap-2 text-xs text-ink-muted px-1">
        <IconInfo size={16} className="shrink-0" />
        <p>Savings set aside here are a plan, not a separate account. Your WISH is stored on this device only for now.</p>
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add to savings">
        {adding ? <AddSavings onSave={async (p) => { await addSavings(p); setAdding(false); }} /> : null}
      </Sheet>
    </Screen>
  );
}

function AddSavings({ onSave }: { onSave: (paise: number) => Promise<void> }) {
  const [amt, setAmt] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-4">
      <Field label="Amount set aside" error={err}>
        {(id) => <MoneyInput id={id} value={amt} onChange={setAmt} invalid={!!err} autoFocus />}
      </Field>
      <Button
        loading={busy}
        onClick={async () => {
          const r = parseRequiredRupees(amt);
          if (!r.ok) return setErr(r.message);
          setBusy(true);
          try {
            await onSave(r.paise);
          } catch (e) {
            setErr(e instanceof Error ? e.message : "Could not save");
          } finally {
            setBusy(false);
          }
        }}
      >
        Save
      </Button>
    </div>
  );
}

function WishForm({ onSave, onCancel }: { onSave: (i: { name: string; targetPaise: number; initialSavedPaise: number; contributionPaise: number; cadence: ContributionCadence }) => Promise<void>; onCancel?: () => void }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [contrib, setContrib] = useState("");
  const [cadence, setCadence] = useState<ContributionCadence>("weekly");
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function save() {
    const e: Record<string, string> = {};
    const t = parseRequiredRupees(target);
    const s = parseOptionalRupees(saved);
    const c = parseOptionalRupees(contrib);
    if (!name.trim()) e.name = "What are you saving for?";
    if (!t.ok) e.target = t.message;
    if (!s.ok) e.saved = s.message;
    if (!c.ok) e.contrib = c.message;
    setErrs(e);
    if (Object.keys(e).length || !t.ok || !s.ok || !c.ok) return;
    setBusy(true);
    try {
      await onSave({ name: name.trim(), targetPaise: t.paise, initialSavedPaise: s.paise ?? 0, contributionPaise: c.paise ?? 0, cadence });
    } catch (er) {
      setErrs({ form: er instanceof Error ? er.message : "Could not save" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <Field label="Saving for" error={errs.name}>
        {(id) => <TextInput id={id} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="e.g. New phone, emergency fund" invalid={!!errs.name} />}
      </Field>
      <Field label="Goal amount" error={errs.target}>
        {(id) => <MoneyInput id={id} value={target} onChange={setTarget} invalid={!!errs.target} />}
      </Field>
      <Field label="Already saved" hint="Optional" error={errs.saved}>
        {(id) => <MoneyInput id={id} value={saved} onChange={setSaved} invalid={!!errs.saved} />}
      </Field>
      <div className="space-y-2">
        <Segmented size="sm" value={cadence} onChange={setCadence} options={[{ value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }]} />
        <Field label={`I can save every ${cadence === "weekly" ? "week" : "month"}`} hint="Optional. Leave empty to just track progress." error={errs.contrib}>
          {(id) => <MoneyInput id={id} value={contrib} onChange={setContrib} invalid={!!errs.contrib} />}
        </Field>
      </div>
      {errs.form ? <Notice tone="danger">{errs.form}</Notice> : null}
      <div className={onCancel ? "grid grid-cols-2 gap-2" : ""}>
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        ) : null}
        <Button onClick={save} loading={busy}>
          Save goal
        </Button>
      </div>
    </Card>
  );
}
