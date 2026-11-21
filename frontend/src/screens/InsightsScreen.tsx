// Runway & Insights — the deterministic 7-day projection and plain-language guidance.
// Every number here is computed by the engine or summed in integer paise; nothing is AI-estimated.
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MonthView } from "./MonthView";
import { useActivity } from "../app/useActivity";
import { todayLocalISO } from "../data/dates";
import { formatINR } from "../lib/money";
import { useRunway } from "../runway/useRunway";
import { Card, ListRow, Notice, Screen, Segmented, Skeleton, cx, daysFromToday, formatDay, formatWeekday } from "../ui/kit";
import { IconAlert, IconBulb, IconCalendar, IconClock, IconLayers, IconShield, IconWallet, IconPencil } from "../ui/icons";

export function InsightsScreen() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab");
  const tab: "runway" | "month" | "insights" = tabParam === "month" || tabParam === "insights" ? tabParam : "runway";
  const setTab = (t: "runway" | "month" | "insights") => setParams(t === "runway" ? {} : { tab: t }, { replace: true });
  return (
    <Screen title={tab === "runway" ? "Your 7-day runway" : tab === "month" ? "Monthly timeline" : "Insights"} subtitle="Based only on money you've confirmed">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "runway", label: "Runway" },
          { value: "month", label: "Month" },
          { value: "insights", label: "Insights" },
        ]}
      />
      {tab === "month" ? <MonthView /> : <RunwayAndInsights tab={tab} />}
    </Screen>
  );
}

function RunwayAndInsights({ tab }: { tab: "runway" | "insights" }) {
  const { runway, rawInput, loading, error } = useRunway({ horizonDays: 7 });
  const today = todayLocalISO();
  return (
    <>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {loading && !runway ? (
        <>
          <Skeleton className="h-[220px]" />
          <Skeleton className="h-[180px]" />
        </>
      ) : !runway ? null : runway.status !== "PROJECTED" ? (
        <Notice
          tone="info"
          title="FLOVA needs a little more to plan ahead"
          action={
            <div className="flex flex-wrap gap-2">
              <Link to="/checkin" className="inline-flex h-8 items-center rounded-full bg-sky-700 px-3 text-xs font-semibold text-white">Check in balance</Link>
              <Link to="/profile" className="inline-flex h-8 items-center rounded-full bg-white border border-sky-200 px-3 text-xs font-semibold text-sky-900">Set daily spending</Link>
            </div>
          }
        >
          Missing: {runway.missingInputs.join(", ") || runway.reason}
        </Notice>
      ) : tab === "runway" ? (
        <RunwayTab runway={runway} dailyLiving={rawInput?.profile.dailyLivingEstimate ?? null} dailyWork={rawInput?.profile.dailyWorkEstimate ?? null} today={today} />
      ) : (
        <InsightsTab runway={runway} today={today} />
      )}
    </>
  );
}

type Runway = NonNullable<ReturnType<typeof useRunway>["runway"]>;

function RunwayTab({ runway, dailyLiving, dailyWork, today }: { runway: Runway; dailyLiving: number | null; dailyWork: number | null; today: string }) {
  const [active, setActive] = useState<number | null>(null);
  const days = runway.projections;
  const buffer = runway.safeRunwayBufferPaise ?? 0;
  const max = Math.max(1, ...days.map((d) => Math.abs(d.closingBalancePaise)));
  const hasNeg = days.some((d) => d.closingBalancePaise < 0);
  const hasCushion = buffer > 0 && days.some((d) => d.closingBalancePaise >= 0 && d.closingBalancePaise < buffer);
  const commitments7 = runway.upcomingCommitments.filter((c) => daysFromToday(c.dueDate, today) >= 0 && daysFromToday(c.dueDate, today) < 7).reduce((s, c) => s + c.amount, 0);
  const expected7 = runway.expectedPayouts
    .filter((p) => !p.expectedDate || (daysFromToday(p.expectedDate, today) >= 0 && daysFromToday(p.expectedDate, today) < 7))
    .reduce((s, p) => s + p.expected, 0);
  const sel = active !== null ? days[active] : null;
  const shortfallIn = runway.firstShortfallDate ? Math.max(0, daysFromToday(runway.firstShortfallDate, today)) : null;

  return (
    <>
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] text-ink-muted">{sel ? `${formatWeekday(sel.date)}, ${formatDay(sel.date)}` : "End of day balance"}</p>
            <p className="text-[24px] font-extrabold tabular-nums">{formatINR(sel ? sel.closingBalancePaise : days[days.length - 1]?.closingBalancePaise ?? 0)}</p>
            {sel ? <p className="text-xs text-ink-muted">{formatINR(sel.essentialExpensePaise + sel.commitmentDeductionPaise)} going out that day</p> : <p className="text-xs text-ink-muted">after 7 days · tap a bar for that day</p>}
          </div>
          <span className={cx("shrink-0 rounded-xl px-3 py-1.5 text-center text-[13px] font-bold", shortfallIn !== null ? "bg-red-50 text-red-700" : "bg-brand-50 text-brand-800")}>
            {shortfallIn !== null ? (
              <>
                {shortfallIn} day{shortfallIn === 1 ? "" : "s"}
                <span className="block text-[11px] font-semibold">left</span>
              </>
            ) : (
              <>
                7+ days
                <span className="block text-[11px] font-semibold">covered</span>
              </>
            )}
          </span>
        </div>

        {/* Single-series bar chart: closing balance per day. Status (below zero / inside cushion) is shown with colour + legend text. */}
        <div className="mt-4 h-[140px] flex items-end gap-[2px]" role="img" aria-label="Projected end-of-day balance for the next 7 days">
          {days.map((d, i) => {
            const neg = d.closingBalancePaise < 0;
            const cushion = !neg && d.closingBalancePaise < buffer;
            const h = Math.max(6, Math.round((Math.abs(d.closingBalancePaise) / max) * 112));
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setActive(active === i ? null : i)}
                onMouseEnter={() => setActive(i)}
                aria-label={`${formatWeekday(d.date)} ${formatINR(d.closingBalancePaise)}`}
                className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 group"
              >
                <span
                  className={cx(
                    "w-full max-w-[34px] rounded-t-[4px] transition-opacity",
                    neg ? "bg-red-500" : cushion ? "bg-amber-400" : "bg-brand-600",
                    active !== null && active !== i ? "opacity-40" : "opacity-100"
                  )}
                  style={{ height: h }}
                />
                <span className={cx("text-[11px] font-semibold", active === i ? "text-ink" : "text-ink-muted")}>{i === 0 ? "Today" : formatWeekday(d.date)}</span>
              </button>
            );
          })}
        </div>
        {hasNeg || hasCushion ? (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand-600" /> Covered</span>
            {hasCushion ? <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Inside safety cushion</span> : null}
            {hasNeg ? <span className="inline-flex items-center gap-1.5"><IconAlert size={12} className="text-red-600" /><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Below zero</span> : null}
          </div>
        ) : null}
      </Card>

      <Card className="p-1 divide-y divide-line">
        <ListRow icon={<IconWallet size={18} />} iconTone="brand" title="Daily living" subtitle="Food, home, personal" value={dailyLiving !== null ? formatINR(dailyLiving) : "Not set"} valueTone={dailyLiving === null ? "muted" : "neutral"} />
        <ListRow icon={<IconLayers size={18} />} iconTone="brand" title="Daily work costs" subtitle="Fuel, phone, tools" value={dailyWork !== null ? formatINR(dailyWork) : "Not set"} valueTone={dailyWork === null ? "muted" : "neutral"} />
        <Link to="/commitments" className="block">
          <ListRow icon={<IconCalendar size={18} />} iconTone="warn" title="Bills & debts" subtitle="Due in the next 7 days" value={formatINR(commitments7)} />
        </Link>
        <Link to="/payouts" className="block">
          <ListRow icon={<IconClock size={18} />} iconTone="info" title="Expected payments" subtitle="Not counted until received" value={formatINR(expected7)} valueTone="muted" />
        </Link>
      </Card>
      <Link to="/profile" className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-brand-700">
        <IconPencil size={15} /> Change daily spending or safety cushion
      </Link>
    </>
  );
}

function InsightsTab({ runway, today }: { runway: Runway; today: string }) {
  const { items } = useActivity({ limit: 200, includeExpectedPayouts: false });

  const week = useMemo(() => {
    let earned = 0, living = 0, work = 0;
    for (const it of items ?? []) {
      if ((it.kind !== "transaction" && it.kind !== "payout_receipt") || it.ownership === "not_mine" || it.amountPaise === undefined) continue;
      const d = daysFromToday(it.date, today);
      if (d > 0 || d < -6) continue;
      if (it.type === "income") earned += it.amountPaise;
      else if (it.expenseType === "work") work += it.amountPaise;
      else living += it.amountPaise;
    }
    return { earned, living, work, spent: living + work };
  }, [items, today]);

  const tips: Array<{ tone: "danger" | "warn" | "info" | "brand"; title: string; body: string; to?: string; cta?: string }> = [];
  const minClose = Math.min(...runway.projections.map((p) => p.closingBalancePaise));
  if (runway.firstShortfallDate && minClose < 0) {
    tips.push({
      tone: "danger",
      title: `About ${formatINR(-minClose)} short by ${formatDay(runway.firstShortfallDate)}`,
      body: "Consider delaying a non-urgent expense, or record any income you've already received so the plan is up to date.",
      to: "/add",
      cta: "Record income",
    });
  } else if (runway.firstBufferShortfallDate) {
    tips.push({ tone: "warn", title: `Your cushion gets used from ${formatDay(runway.firstBufferShortfallDate)}`, body: "You won't run out, but you'll dip into the money you set aside for emergencies." });
  } else {
    tips.push({ tone: "brand", title: "You're covered this week", body: "Your confirmed money covers daily spending and bills for the next 7 days." });
  }
  const expected = runway.expectedPayouts.reduce((s, p) => s + p.expected, 0);
  if (expected > 0) tips.push({ tone: "info", title: `${formatINR(expected)} expected but not counted`, body: "Mark payments as received when the money arrives, and your runway updates.", to: "/payouts", cta: "View payments" });
  if (runway.custodialOwedPaise && runway.custodialOwedPaise > 0) tips.push({ tone: "warn", title: `${formatINR(runway.custodialOwedPaise)} belongs to others`, body: "COD or platform money is kept out of your available money. Remember to hand it over." });
  if (!runway.safeRunwayBufferPaise) tips.push({ tone: "info", title: "Set a safety cushion", body: "Keep a small amount aside for emergencies. FLOVA will warn you before you touch it.", to: "/profile", cta: "Set cushion" });

  return (
    <>
      <Card className="p-4">
        <p className="text-[13px] font-semibold text-ink-soft">Last 7 days</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-brand-50 p-3">
            <p className="text-xs text-brand-800">Earned</p>
            <p className="text-[19px] font-extrabold tabular-nums">{items ? formatINR(week.earned) : "…"}</p>
          </div>
          <div className="rounded-xl bg-red-50 p-3">
            <p className="text-xs text-red-800">Spent</p>
            <p className="text-[19px] font-extrabold tabular-nums">{items ? formatINR(week.spent) : "…"}</p>
          </div>
        </div>
        {items && week.spent > 0 ? (
          <p className="mt-2 text-xs text-ink-muted">
            Living {formatINR(week.living)} · Work {formatINR(week.work)}
          </p>
        ) : null}
      </Card>

      {tips.map((t, i) => (
        <Card key={i} tone={t.tone === "danger" ? "danger" : t.tone === "warn" ? "warn" : t.tone === "brand" ? "brand" : "white"} className="p-4 flex gap-3">
          <span className={cx("shrink-0 pt-0.5", t.tone === "danger" ? "text-red-600" : t.tone === "warn" ? "text-amber-600" : "text-brand-700")}>
            {t.tone === "danger" || t.tone === "warn" ? <IconAlert size={20} /> : <IconBulb size={20} />}
          </span>
          <div className="min-w-0">
            <p className="text-[14.5px] font-bold text-ink">{t.title}</p>
            <p className="text-[13px] text-ink-soft">{t.body}</p>
            {t.to ? (
              <Link to={t.to} className="mt-2 inline-block text-[13px] font-semibold text-brand-700">
                {t.cta} →
              </Link>
            ) : null}
          </div>
        </Card>
      ))}

      <div className="flex items-center justify-center gap-1.5 text-[11.5px] text-ink-faint">
        <IconShield size={14} /> Guidance is rule-based from your own numbers, never guessed.
      </div>
    </>
  );
}
