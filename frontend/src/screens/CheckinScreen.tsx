// Balance check-in — the confirmed baseline the whole runway is built on.
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDataVersion } from "../data/DataVersionProvider";
import { useLatestCheckin } from "../data/useLatestCheckin";
import { formatINR, toPaise } from "../lib/money";
import { parseOptionalRupees } from "../profile/parseRupees";
import { useProfile } from "../profile/useProfile";
import { Button, Card, Field, MoneyInput, Notice, Screen, Skeleton, relativeDayLabel } from "../ui/kit";
import { IconBank, IconInfo, IconLayers, IconWallet } from "../ui/icons";
import { todayLocalISO } from "../data/dates";

export interface CheckinPrefillState {
  prefill: { cash?: string; bank?: string; held?: string };
  aiNote?: string;
}

export function CheckinScreen() {
  const navigate = useNavigate();
  const { bump } = useDataVersion();
  const { profile } = useProfile();
  const { checkin, loading, add } = useLatestCheckin();
  // Voice can open this screen pre-filled; empty values stay empty (never assumed to be 0).
  const prefill = (useLocation().state as CheckinPrefillState | null) ?? null;
  const [cash, setCash] = useState(prefill?.prefill.cash ?? "");
  const [bank, setBank] = useState(prefill?.prefill.bank ?? "");
  const [held, setHeld] = useState(prefill?.prefill.held ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const p = (t: string) => {
    const r = parseOptionalRupees(t);
    return r.ok ? r.paise : null;
  };
  const cashP = p(cash) ?? 0;
  const bankP = p(bank) ?? 0;
  const heldP = p(held) ?? 0;
  const available = cashP + bankP - heldP;
  const anyEntered = cash.trim() !== "" || bank.trim() !== "";

  async function save() {
    const next: Record<string, string> = {};
    const c = parseOptionalRupees(cash);
    const b = parseOptionalRupees(bank);
    const h = parseOptionalRupees(held);
    if (!c.ok) next.cash = c.message;
    if (!b.ok) next.bank = b.message;
    if (!h.ok) next.held = h.message;
    if (c.ok && b.ok && c.paise === null && b.paise === null) next.cash = "Enter your cash, bank balance, or both (0 is fine).";
    if (c.ok && b.ok && h.ok && (h.paise ?? 0) > (c.paise ?? 0) + (b.paise ?? 0)) next.held = "Can't be more than your cash and bank together.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setSaveError(null);
    try {
      await add({ cash: (c.ok && c.paise) || 0, bank: (b.ok && b.paise) || 0, notMine: (h.ok && h.paise) || 0 });
      bump();
      navigate("/app", { replace: true });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save check-in");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title="Update your balance" subtitle="How much do you have right now?" back>
      {prefill?.aiNote ? <Notice tone="success">{prefill.aiNote}</Notice> : null}
      {loading ? (
        <Skeleton className="h-[52px]" />
      ) : checkin ? (
        <Card tone="soft" className="px-4 py-3 text-[13px] text-ink-soft">
          Last check-in {relativeDayLabel(checkin.checked_at.slice(0, 10), todayLocalISO()).toLowerCase()}:{" "}
          <b className="text-ink">{formatINR(toPaise(checkin.cash_amount) + toPaise(checkin.bank_amount) - toPaise(checkin.not_mine_amount))}</b> yours
        </Card>
      ) : null}

      <Card className="p-4 space-y-4">
        <Field label={<span className="inline-flex items-center gap-2"><IconWallet size={16} /> Cash in hand</span>} error={errors.cash}>
          {(id) => <MoneyInput id={id} value={cash} onChange={setCash} invalid={!!errors.cash} autoFocus />}
        </Field>
        <Field label={<span className="inline-flex items-center gap-2"><IconBank size={16} /> Bank / UPI balance</span>} error={errors.bank}>
          {(id) => <MoneyInput id={id} value={bank} onChange={setBank} invalid={!!errors.bank} />}
        </Field>
        <Field
          label={<span className="inline-flex items-center gap-2"><IconLayers size={16} /> {profile?.handles_cod ? "Platform / COD money (not yours)" : "Money held for others (not yours)"}</span>}
          hint="Part of the cash or bank above that belongs to someone else."
          error={errors.held}
        >
          {(id) => <MoneyInput id={id} value={held} onChange={setHeld} invalid={!!errors.held} />}
        </Field>
      </Card>

      <Card tone="brand" className="p-4 text-center">
        <p className="text-[13px] font-semibold text-brand-800">Your available money</p>
        <p className="text-[32px] font-extrabold tabular-nums text-ink">{anyEntered ? formatINR(Math.max(0, available)) : "—"}</p>
        <p className="text-xs text-ink-muted">(cash + bank, minus money that isn't yours)</p>
      </Card>

      {saveError ? <Notice tone="danger">{saveError}</Notice> : null}
      <Button onClick={save} loading={saving}>Save check-in</Button>

      <div className="flex gap-2 text-xs text-ink-muted px-1">
        <IconInfo size={16} className="shrink-0" />
        <p>Platform money, customer cash (COD) and other people's funds are kept separate and never counted as yours.</p>
      </div>
    </Screen>
  );
}
