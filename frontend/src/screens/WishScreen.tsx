// WISH — save for what matters, at a pace your Safe-to-Spend can afford.
import { useEffect, useMemo, useState } from "react";
import { todayLocalISO } from "../data/dates";
import {
  formatFinancialAmount,
  useFinancialIntelligence,
} from "../app/useFinancialIntelligence";
import { buildWishIntelligenceModel } from "../app/wishIntelligenceModel";
import type { WishContributionCadence } from "../engine";
import { formatINR } from "../lib/money";
import { parseOptionalRupees, parseRequiredRupees } from "../profile/parseRupees";
import { listWishGoals } from "../services/wish";
import type { WishGoal } from "../types/contracts";
import { useWish } from "../wish/useWish";
import type { ContributionCadence } from "../wish/types";
import { Button, Card, Field, MoneyInput, Notice, ProgressBar, Screen, Segmented, Sheet, Skeleton, TextInput, cx, formatDay } from "../ui/kit";
import { IconInfo, IconPiggy, IconTarget } from "../ui/icons";

export function WishScreen() {
  const { wish, calc, loading, error, create, addSavings, markPurchased, archive } = useWish();
  const { data: intel, loading: intelLoading, reload: reloadIntel } = useFinancialIntelligence({ horizonDays: 7 });
  const [wishGoals, setWishGoals] = useState<WishGoal[]>([]);
  const [adding, setAdding] = useState(false);
  const [changing, setChanging] = useState(false);

  // Read-only contribution simulator state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simCadence, setSimCadence] = useState<WishContributionCadence>("weekly");
  const [simAmountInput, setSimAmountInput] = useState("");

  useEffect(() => {
    listWishGoals()
      .then(setWishGoals)
      .catch(() => setWishGoals([]));
  }, [wish?.id, wish?.savedPaise, wish?.status]);

  const simulatedContributionPaise = useMemo(() => {
    const parsed = parseOptionalRupees(simAmountInput);
    return parsed.ok && parsed.paise && parsed.paise > 0 ? parsed.paise : null;
  }, [simAmountInput]);

  const model = useMemo(() => {
    return buildWishIntelligenceModel({
      wishGoals,
      localWish: wish,
      safeToSpend: intel?.safeToSpend ?? null,
      todayISO: intel?.todayISO ?? todayLocalISO(),
      simulatedContributionPaise,
      simulatedCadence: simCadence,
    });
  }, [wishGoals, wish, intel, simulatedContributionPaise, simCadence]);

  const tight = Boolean(intel?.runway.firstShortfallDate) || model.report.hasInsufficientSafeToSpend;
  const primary = model.primaryGoal;

  const statusBadge = primary
    ? primary.isCompleted
      ? { label: "Completed", tone: "bg-brand-50 text-brand-700" }
      : primary.isOverdue
        ? { label: "Overdue", tone: "bg-red-50 text-red-700" }
        : primary.status === "paused"
          ? { label: "Paused", tone: "bg-[#F1F3EE] text-ink-soft" }
          : { label: "Active", tone: "bg-brand-50 text-brand-700" }
    : null;

  return (
    <Screen title="WISH" subtitle="Build a safety net, one step at a time" back="/more">
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {loading || (intelLoading && !intel) ? (
        <Skeleton className="h-[260px]" />
      ) : !wish || changing ? (
        <WishForm
          onCancel={wish ? () => setChanging(false) : undefined}
          onSave={async (input) => {
            if (wish) await archive();
            await create(input);
            setChanging(false);
            void reloadIntel();
          }}
        />
      ) : (
        <>
          <Card className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <span className="w-14 h-14 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                  <IconTarget size={28} />
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-ink truncate">{primary?.title ?? wish.name}</p>
                  <p className="text-[26px] font-extrabold tabular-nums">
                    {formatINR(primary?.targetPaise ?? wish.targetPaise)}
                  </p>
                </div>
              </div>
              {statusBadge ? (
                <span className={cx("px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0", statusBadge.tone)}>
                  {statusBadge.label}
                </span>
              ) : null}
            </div>

            {primary ? (
              <div className="space-y-1.5">
                <ProgressBar ratio={primary.targetPaise > 0 ? Math.min(1, primary.savedPaise / primary.targetPaise) : 0} />
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>
                    <b className="text-ink">{formatINR(primary.savedPaise)}</b> saved ({primary.percentCompleted}%)
                  </span>
                  <span>{formatINR(primary.remainingPaise)} remaining</span>
                </div>
              </div>
            ) : calc ? (
              <div className="space-y-1.5">
                <ProgressBar ratio={calc.progressRatio} />
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>
                    <b className="text-ink">{formatINR(calc.savedPaise)}</b> saved ({calc.progressPercent}%)
                  </span>
                  <span>{formatINR(calc.remainingPaise)} remaining</span>
                </div>
              </div>
            ) : null}

            {primary?.targetDate ? (
              <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
                <span className="text-ink-muted">Target date: <strong className="text-ink">{formatDay(primary.targetDate)}</strong></span>
                <span className={cx("font-semibold", primary.isOverdue ? "text-red-700" : "text-ink-soft")}>
                  {primary.daysRemaining !== null
                    ? primary.daysRemaining < 0
                      ? `${Math.abs(primary.daysRemaining)} day${Math.abs(primary.daysRemaining) === 1 ? "" : "s"} overdue`
                      : `${primary.daysRemaining} day${primary.daysRemaining === 1 ? "" : "s"} left`
                    : ""}
                </span>
              </div>
            ) : null}
          </Card>

          {/* Required Contribution & Achievability Intelligence */}
          {primary && !primary.isCompleted ? (
            <Card tone="brand" className="p-4 space-y-2.5">
              <div className="flex items-start gap-3">
                <IconPiggy className="text-brand-700 shrink-0 mt-0.5" />
                <div className="text-[13px] text-brand-900 space-y-1 min-w-0 flex-1">
                  <p className="font-semibold">{primary.explanation}</p>
                  {primary.achievableByTargetDate !== null ? (
                    <p className={cx("text-xs font-semibold", primary.achievableByTargetDate ? "text-brand-800" : "text-amber-900")}>
                      {primary.achievableByTargetDate
                        ? "Achievable at your current Safe-to-Spend pace."
                        : primary.attentionReason ?? "May stretch your current Safe-to-Spend pace."}
                    </p>
                  ) : null}
                </div>
              </div>

              {primary.requiredDailyPaise !== null ? (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-brand-100 text-xs">
                  <div className="rounded-xl bg-white/80 p-2 text-center">
                    <p className="text-[10.5px] text-ink-muted">Daily needed</p>
                    <p className="font-bold tabular-nums text-ink">{formatINR(primary.requiredDailyPaise)}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-2 text-center">
                    <p className="text-[10.5px] text-ink-muted">Weekly needed</p>
                    <p className="font-bold tabular-nums text-ink">{formatINR(primary.requiredWeeklyPaise ?? 0)}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-2 text-center">
                    <p className="text-[10.5px] text-ink-muted">Monthly needed</p>
                    <p className="font-bold tabular-nums text-ink">{formatINR(primary.requiredMonthlyPaise ?? 0)}</p>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between text-[11.5px] text-brand-900/80 pt-1">
                <span>
                  Current Safe-to-Spend:{" "}
                  <strong>
                    {model.dailySafeToSpendPaise !== null
                      ? `${formatFinancialAmount(model.dailySafeToSpendPaise)}/day`
                      : "Do a check-in to measure"}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setShowSimulator((v) => !v)}
                  className="font-bold text-brand-800 underline"
                >
                  {showSimulator ? "Hide simulator" : "Test savings pace"}
                </button>
              </div>
            </Card>
          ) : calc ? (
            <Card tone="brand" className="p-4 flex gap-3">
              <IconPiggy className="text-brand-700 shrink-0" />
              <div className="text-[13px] text-brand-900">
                <p>{primary?.explanation ?? calc.timelineSummary}</p>
              </div>
            </Card>
          ) : null}

          {/* Read-Only Contribution Simulator */}
          {showSimulator && primary && !primary.isCompleted ? (
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-bold text-ink">Test contribution pace</p>
                <Segmented
                  size="sm"
                  value={simCadence}
                  onChange={setSimCadence}
                  options={[
                    { value: "daily", label: "Daily" },
                    { value: "weekly", label: "Weekly" },
                    { value: "monthly", label: "Monthly" },
                  ]}
                />
              </div>
              <Field label={`If I save every ${simCadence === "daily" ? "day" : simCadence === "weekly" ? "week" : "month"}`}>
                {(id) => <MoneyInput id={id} value={simAmountInput} onChange={setSimAmountInput} placeholder="e.g. 500" />}
              </Field>
              {model.simulation ? (
                <div className="rounded-xl bg-[#F1F3EE] p-3 space-y-1 text-xs">
                  <p className="text-[11px] font-semibold text-ink-muted">Simulation only — does not reserve or move money</p>
                  <p className="text-ink">
                    Estimated completion:{" "}
                    <strong>
                      {model.simulation.estimatedCompletionDate
                        ? formatDay(model.simulation.estimatedCompletionDate)
                        : "Unavailable"}
                    </strong>
                    {model.simulation.estimatedDays !== null
                      ? ` (${model.simulation.estimatedDays} day${model.simulation.estimatedDays === 1 ? "" : "s"} remaining)`
                      : ""}
                  </p>
                  {model.simulation.meetsTargetDate !== null ? (
                    <p className={model.simulation.meetsTargetDate ? "text-brand-700 font-semibold" : "text-amber-800 font-semibold"}>
                      {model.simulation.meetsTargetDate
                        ? "Reaches your goal on or before your target date."
                        : `Finishes ${model.simulation.daysVsTargetDate} day${model.simulation.daysVsTargetDate === 1 ? "" : "s"} after your target date.`}
                    </p>
                  ) : null}
                  {model.simulation.compatibleWithSafeToSpend !== null ? (
                    <p className={model.simulation.compatibleWithSafeToSpend ? "text-brand-800" : "text-red-700 font-semibold"}>
                      {model.simulation.compatibleWithSafeToSpend
                        ? `Fits within your Safe-to-Spend (${formatFinancialAmount(model.simulation.dailySafeToSpendPaise)}/day).`
                        : `Exceeds your Safe-to-Spend (${formatFinancialAmount(model.simulation.dailySafeToSpendPaise)}/day) — may compromise essential bills or cushion.`}
                    </p>
                  ) : (
                    <p className="text-ink-muted">Complete a balance check-in to check Safe-to-Spend compatibility.</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-ink-muted">Enter an amount above to preview your completion date.</p>
              )}
            </Card>
          ) : null}

          {tight ? (
            <Notice tone="warn" title="Money is tight right now">
              Your runway or Safe-to-Spend shows limited headroom. Pause optional savings so essential bills and your safety cushion stay protected.
            </Notice>
          ) : null}

          {model.otherGoals.length > 0 ? (
            <Card className="p-4 space-y-2">
              <p className="text-[13px] font-bold text-ink">Other goals ({model.otherGoals.length})</p>
              <div className="divide-y divide-line">
                {model.otherGoals.map((g) => (
                  <div key={g.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink truncate">{g.title}</p>
                      <p className="text-[11px] text-ink-muted">
                        {formatINR(g.savedPaise)} / {formatINR(g.targetPaise)} ({g.percentCompleted}%) · {g.status}
                      </p>
                    </div>
                    <span className="font-bold tabular-nums text-ink shrink-0">{formatINR(g.remainingPaise)} left</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {primary?.isCompleted || calc?.isCompleted ? (
            <Button
              onClick={async () => {
                await markPurchased();
                void reloadIntel();
              }}
            >
              I bought it!
            </Button>
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
        <p>Ordinary WISH goals are a savings plan and never reduce your Confirmed Cash or Safe-to-Spend unless explicitly reserved.</p>
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add to savings">
        {adding ? (
          <AddSavings
            onSave={async (p) => {
              await addSavings(p);
              setAdding(false);
              void reloadIntel();
            }}
          />
        ) : null}
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
