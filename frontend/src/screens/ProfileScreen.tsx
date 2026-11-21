// Profile & settings — the inputs the runway engine uses. Empty estimates stay unknown (never 0).
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { paiseToInput } from "../app/moneyText";
import { PAYOUT_LABELS, VARIABILITY_LABELS, WORK_LABELS } from "../app/profileLabels";
import { useDataVersion } from "../data/DataVersionProvider";
import { toPaiseOrNull } from "../lib/money";
import { parseOptionalRupees } from "../profile/parseRupees";
import { useProfile } from "../profile/useProfile";
import { signOut } from "../services/auth";
import { INCOME_VARIABILITIES, PAYOUT_PATTERNS, WORK_PROFILES, type IncomeVariability, type PayoutPattern, type WorkProfile } from "../types/contracts";
import { Button, Card, Field, MoneyInput, Notice, Screen, SectionTitle, SelectInput, Skeleton, TextInput } from "../ui/kit";
import { IconLogout } from "../ui/icons";

export function ProfileScreen() {
  const navigate = useNavigate();
  const { profile, loading, save } = useProfile();
  const { bump } = useDataVersion();
  const [signingOut, setSigningOut] = useState(false);
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
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

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
    setMsg(null);
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
      });
      bump();
      setMsg({ tone: "success", text: "Saved. Your runway has been updated." });
    } catch (er) {
      setMsg({ tone: "danger", text: er instanceof Error ? er.message : "Could not save" });
    } finally {
      setSaving(false);
    }
  }

  if (loading && !profile) {
    return (
      <Screen title="Profile & settings" back="/more">
        <Skeleton className="h-[220px]" />
        <Skeleton className="h-[260px]" />
      </Screen>
    );
  }

  return (
    <Screen title="Profile & settings" subtitle="What FLOVA uses to plan your money" back="/more">
      <SectionTitle>About your work</SectionTitle>
      <Card className="p-4 space-y-4">
        <Field label="Your name">{(id) => <TextInput id={id} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Name" />}</Field>
        <Field label="Main work">
          {(id) => (
            <SelectInput id={id} value={work} onChange={(e) => setWork(e.target.value as WorkProfile)}>
              {WORK_PROFILES.map((w) => (
                <option key={w} value={w}>
                  {WORK_LABELS[w].icon} {WORK_LABELS[w].label}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>
        <Field label="How your income behaves">
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
        <Field label="When you usually get paid">
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
            Turn on if you hold customer or platform cash that you hand over later.
          </span>
        </label>
      </Card>

      <SectionTitle>Daily spending</SectionTitle>
      <Card className="p-4 space-y-4">
        <Field label="Living costs per day" hint="Food, home, personal. Leave empty if unsure." error={errs.living}>
          {(id) => <MoneyInput id={id} value={living} onChange={setLiving} invalid={!!errs.living} />}
        </Field>
        <Field label="Work costs per day" hint="Fuel, phone, tools, supplies" error={errs.work}>
          {(id) => <MoneyInput id={id} value={workCost} onChange={setWorkCost} invalid={!!errs.work} />}
        </Field>
        <Field label="Safety cushion" hint="Money to keep aside for emergencies. FLOVA warns you before it's used." error={errs.cushion}>
          {(id) => <MoneyInput id={id} value={cushion} onChange={setCushion} invalid={!!errs.cushion} />}
        </Field>
      </Card>

      {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}
      <Button onClick={submit} loading={saving}>
        Save changes
      </Button>

      <button
        type="button"
        disabled={signingOut}
        onClick={async () => {
          setSigningOut(true);
          try {
            await signOut();
            navigate("/login", { replace: true });
          } catch (e) {
            setMsg({ tone: "danger", text: e instanceof Error ? e.message : "Could not sign out" });
            setSigningOut(false);
          }
        }}
        className="w-full h-12 rounded-xl bg-white border border-line flex items-center justify-center gap-2 text-[15px] font-semibold text-red-700 mt-2"
      >
        <IconLogout size={18} /> {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </Screen>
  );
}
