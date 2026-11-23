// Onboarding — how you earn. Occupation, income behaviour and payout timing are separate
// questions, and empty spending estimates stay unknown (never assumed to be 0).
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { paiseToInput } from "../app/moneyText";
import { PAYOUT_LABELS, VARIABILITY_LABELS, WORK_LABELS } from "../app/profileLabels";
import { useDataVersion } from "../data/DataVersionProvider";
import { toPaiseOrNull } from "../lib/money";
import { parseOptionalRupees } from "../profile/parseRupees";
import { useProfile } from "../profile/useProfile";
import { INCOME_VARIABILITIES, PAYOUT_PATTERNS, WORK_PROFILES, type IncomeVariability, type PayoutPattern, type WorkProfile } from "../types/contracts";
import { Button, Card, Field, MoneyInput, Notice, SelectInput, Splash, TextInput, cx } from "../ui/kit";
import { IconCheck, IconShield } from "../ui/icons";

export function OnboardingScreen() {
  const navigate = useNavigate();
  const { bump } = useDataVersion();
  const { profile, save, loading } = useProfile();
  const [name, setName] = useState("");
  const [work, setWork] = useState<WorkProfile>("other");
  const [variability, setVariability] = useState<IncomeVariability>("variable");
  const [payout, setPayout] = useState<PayoutPattern>("weekly");
  const [cod, setCod] = useState(false);
  const [living, setLiving] = useState("");
  const [workCost, setWorkCost] = useState("");
  const [cushion, setCushion] = useState("");
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setName(profile.display_name ?? "");
    setWork(profile.work_profile);
    setVariability(profile.income_variability ?? "variable");
    setPayout(profile.payout_pattern);
    setCod(!!profile.handles_cod);
    setLiving(paiseToInput(toPaiseOrNull(profile.daily_living_estimate)));
    setWorkCost(paiseToInput(toPaiseOrNull(profile.daily_work_estimate)));
    setCushion(paiseToInput(toPaiseOrNull(profile.safe_runway_buffer)));
  }, [profile]);

  async function submit() {
    const l = parseOptionalRupees(living);
    const w = parseOptionalRupees(workCost);
    const c = parseOptionalRupees(cushion);
    const e: Record<string, string> = {};
    if (!l.ok) e.living = l.message;
    if (!w.ok) e.work = w.message;
    if (!c.ok) e.cushion = c.message;
    setErrs(e);
    if (!l.ok || !w.ok || !c.ok) return;
    setSaving(true);
    setSaveErr(null);
    try {
      await save({
        display_name: name.trim() || null,
        work_profile: work,
        income_variability: variability,
        payout_pattern: payout,
        handles_cod: cod,
        daily_living_estimate: l.paise,
        daily_work_estimate: w.paise,
        safe_runway_buffer: c.paise,
        onboarding_completed: true,
      });
      bump();
      navigate("/app", { replace: true });
    } catch (er) {
      setSaveErr(er instanceof Error ? er.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !profile) return <Splash />;

  return (
    <div className="flova-app min-h-dvh bg-[#E9ECE6] text-ink antialiased">
      <div className="mx-auto min-h-dvh w-full max-w-[480px] bg-canvas px-4 pt-8 pb-10 space-y-5">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="FLOVA" className="w-11 h-11 rounded-2xl object-contain shadow-xs" />
          <span className="text-xl font-black text-brand-800">FLOVA</span>
        </div>
        <div>
          <h1 className="text-[24px] leading-8 font-bold text-ink">{profile?.onboarding_completed ? "Update how you earn" : "Tell FLOVA how you earn"}</h1>
          <p className="mt-1 text-[14px] text-ink-muted">Built for irregular income. You can change all of this later in Profile.</p>
        </div>

        <Card className="p-4">
          <Field label="Your name (optional)">{(id) => <TextInput id={id} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Name" />}</Field>
        </Card>

        <section className="space-y-2">
          <h2 className="px-1 text-[15px] font-bold text-ink">What kind of work do you do?</h2>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Main work">
            {WORK_PROFILES.map((w) => {
              const on = work === w;
              return (
                <button
                  key={w}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setWork(w)}
                  className={cx(
                    "relative h-[92px] rounded-2xl border px-1.5 flex flex-col items-center justify-center gap-1 text-center transition-colors",
                    on ? "border-brand-700 bg-brand-50" : "border-line bg-white hover:border-brand-200"
                  )}
                >
                  {on ? (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-700 text-white flex items-center justify-center">
                      <IconCheck size={12} strokeWidth={3} />
                    </span>
                  ) : null}
                  <span className="text-2xl" aria-hidden="true">{WORK_LABELS[w].icon}</span>
                  <span className={cx("text-[12px] leading-4 font-semibold", on ? "text-brand-900" : "text-ink-soft")}>{WORK_LABELS[w].label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <Card className="p-4 space-y-4">
          <Field label="How does your income behave?">
            {(id) => (
              <SelectInput id={id} value={variability} onChange={(e) => setVariability(e.target.value as IncomeVariability)}>
                {INCOME_VARIABILITIES.map((v) => (
                  <option key={v} value={v}>
                    {VARIABILITY_LABELS[v]}
                  </option>
                ))}
              </SelectInput>
            )}
          </Field>
          <Field label="When do you usually get paid?">
            {(id) => (
              <SelectInput id={id} value={payout} onChange={(e) => setPayout(e.target.value as PayoutPattern)}>
                {PAYOUT_PATTERNS.map((p) => (
                  <option key={p} value={p}>
                    {PAYOUT_LABELS[p]}
                  </option>
                ))}
              </SelectInput>
            )}
          </Field>
          <label className="flex items-start gap-3 rounded-xl bg-[#F4F5F2] p-3 cursor-pointer">
            <input type="checkbox" className="mt-0.5 h-5 w-5 accent-brand-700" checked={cod} onChange={(e) => setCod(e.target.checked)} />
            <span className="text-[13px] text-ink-soft">
              <b className="text-ink">I collect cash for others (COD)</b>
              <br />
              Off unless you turn it on. That money is never counted as yours.
            </span>
          </label>
        </Card>

        <section className="space-y-2">
          <h2 className="px-1 text-[15px] font-bold text-ink">Your usual daily spending</h2>
          <Card className="p-4 space-y-4">
            <Field label="Living costs per day" hint="Food, home, personal. Leave empty if unsure." error={errs.living}>
              {(id) => <MoneyInput id={id} value={living} onChange={setLiving} invalid={!!errs.living} />}
            </Field>
            <Field label="Work costs per day" hint="Fuel, phone, tools, supplies" error={errs.work}>
              {(id) => <MoneyInput id={id} value={workCost} onChange={setWorkCost} invalid={!!errs.work} />}
            </Field>
            <Field label="Safety cushion (optional)" hint="Money to keep aside for emergencies" error={errs.cushion}>
              {(id) => <MoneyInput id={id} value={cushion} onChange={setCushion} invalid={!!errs.cushion} />}
            </Field>
          </Card>
        </section>

        {saveErr ? <Notice tone="danger">{saveErr}</Notice> : null}
        <Button onClick={submit} loading={saving}>
          {profile?.onboarding_completed ? "Save" : "Start using FLOVA"}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-ink-faint">
          <IconShield size={14} /> No bank passwords or UPI PINs. Ever.
        </p>
      </div>
    </div>
  );
}
