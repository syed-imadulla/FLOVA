// Runway & Insights — the deterministic 7-day projection and plain-language guidance.
// Every number here is computed by the engine or summed in integer paise; nothing is AI-estimated.
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { categoryLabel } from "../app/categories";
import { buildStructuredInsights } from "../app/insightsCommitmentsModel";
import {
  FINANCIAL_TERMS,
  formatFinancialAmount,
  useFinancialIntelligence,
  type FinancialIntelligenceSnapshot,
} from "../app/useFinancialIntelligence";
import { MonthView } from "./MonthView";
import { useActivity } from "../app/useActivity";
import { todayLocalISO } from "../data/dates";
import { formatINR } from "../lib/money";
import type { ProcessedRunway } from "../runway/adapter";
import {
  calculateAdaptiveBuffer,
  generateIncomeForecast,
  simulateScenario,
  analyzeSpendingIntelligence,
} from "../engine";
import type { RunwayInput } from "../types/contracts";
import { Card, ListRow, Notice, Screen, Segmented, Skeleton, cx, daysFromToday, formatDay, formatWeekday } from "../ui/kit";
import { IconAlert, IconBulb, IconCalendar, IconClock, IconLayers, IconShield, IconWallet, IconPencil, IconSparkle } from "../ui/icons";

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
  const { data: intel, rawInput, loading, error } = useFinancialIntelligence({ horizonDays: 7 });
  const runway = intel?.runway ?? null;
  const today = intel?.todayISO ?? todayLocalISO();
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
        <InsightsTab runway={runway} rawInput={rawInput} intel={intel} today={today} />
      )}
    </>
  );
}

type Runway = ProcessedRunway;

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

function InsightsTab({ runway, rawInput, intel, today }: { runway: Runway; rawInput: RunwayInput | null; intel: FinancialIntelligenceSnapshot | null; today: string }) {
  const { items } = useActivity({ limit: 200, includeExpectedPayouts: false });

  const transactions = useMemo(() => {
    return (items ?? [])
      .filter((it) => (it.kind === "transaction" || it.kind === "payout_receipt") && typeof it.amountPaise === "number" && !!it.date)
      .map((it) => ({
        id: it.id,
        type: it.type === "income" ? ("income" as const) : ("expense" as const),
        amountPaise: it.amountPaise!,
        category: it.category || "other",
        description: it.title || "",
        expenseType: it.expenseType,
        inflowCategory: it.inflowCategory ?? null,
        ownership: it.ownership || "mine",
        date: it.date!,
      }));
  }, [items]);

  // 1. Spending Intelligence Engine
  const spendingReport = useMemo(() => {
    return analyzeSpendingIntelligence(transactions, today);
  }, [transactions, today]);

  // 2. Adaptive Buffer Engine
  const bufferRec = useMemo(() => {
    return calculateAdaptiveBuffer({
      profile: rawInput?.profile,
      dailyLivingEstimatePaise: rawInput?.profile?.dailyLivingEstimate ?? 0,
      dailyWorkEstimatePaise: rawInput?.profile?.dailyWorkEstimate ?? 0,
      commitments: rawInput?.commitments ?? [],
    });
  }, [rawInput]);

  // 3. Statistical Income Forecasting Engine
  const incomeForecast = useMemo(() => {
    return generateIncomeForecast({
      transactions,
      forecastHorizonDays: 7,
    });
  }, [transactions]);

  // Reuse shared Financial Health from useFinancialIntelligence() so HomeScreen and InsightsScreen always match
  const healthReport = intel?.financialHealth ?? null;

  // 4. Hypothetical What-If Simulator State
  const [simIncomeChange, setSimIncomeChange] = useState<number>(0);
  const [simDelayDays, setSimDelayDays] = useState<number>(0);
  const [simEmergencyRupees, setSimEmergencyRupees] = useState<number>(0);

  const scenarioResult = useMemo(() => {
    if (!rawInput) return null;
    return simulateScenario(rawInput, {
      incomeChangePercent: simIncomeChange,
      expectedIncomeBasisPaise: incomeForecast.hasSufficientData ? incomeForecast.expectedPaise : undefined,
      payoutDelayDays: simDelayDays,
      oneTimeExpensePaise: simEmergencyRupees * 100,
    });
  }, [rawInput, simIncomeChange, simDelayDays, simEmergencyRupees, incomeForecast]);

  const week = useMemo(() => {
    let earned = 0, nonEarned = 0, living = 0, work = 0;
    for (const it of items ?? []) {
      if ((it.kind !== "transaction" && it.kind !== "payout_receipt") || it.ownership === "not_mine" || it.amountPaise === undefined) continue;
      const d = daysFromToday(it.date, today);
      if (d > 0 || d < -6) continue;
      if (it.type === "income") {
        if ((it.inflowCategory ?? "earned") === "earned") earned += it.amountPaise;
        else nonEarned += it.amountPaise;
      } else if (it.expenseType === "work") work += it.amountPaise;
      else living += it.amountPaise;
    }
    return { earned, nonEarned, living, work, spent: living + work };
  }, [items, today]);

  const structuredInsights = useMemo(
    () => buildStructuredInsights({ intel, spendingReport }),
    [intel, spendingReport]
  );

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
    <div className="space-y-4">
      {/* 0. Safe-to-Spend & Allowance Snapshot */}
      {intel && intel.confirmedCashPaise !== null ? (
        <Card tone="brand" className="p-4 space-y-2.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-brand-800">{FINANCIAL_TERMS.safeToSpend.label}</p>
              <p className="text-[20px] font-extrabold tabular-nums text-ink">
                {formatFinancialAmount(intel.safeToSpendPaise)}
              </p>
              <p className="text-[11px] text-ink-muted">
                {formatFinancialAmount(intel.dailySpendingAllowancePaise)}/day allowance
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-brand-800">{FINANCIAL_TERMS.confirmedCash.label}</p>
              <p className="text-[20px] font-extrabold tabular-nums text-ink">
                {formatFinancialAmount(intel.confirmedCashPaise)}
              </p>
              <p className="text-[11px] text-ink-muted">
                {formatFinancialAmount(intel.remainingMonthlyAllowancePaise)} left this month
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {/* 0b. Structured Actionable Insights (What happened / Why it matters / Next step) */}
      {structuredInsights.length > 0 ? (
        <div className="space-y-2.5">
          {structuredInsights.map((ins) => (
            <Notice
              key={ins.id}
              tone={ins.tone === "brand" ? "success" : ins.tone}
              title={ins.title}
              action={
                <Link
                  to={ins.nextActionTo}
                  className="inline-flex h-8 items-center rounded-full bg-white/90 border border-line px-3 text-xs font-semibold text-ink"
                >
                  {ins.nextActionLabel} →
                </Link>
              }
            >
              <span className="block">{ins.whatHappened}</span>
              <span className="block mt-0.5 opacity-80">{ins.whyItMatters}</span>
            </Notice>
          ))}
        </div>
      ) : null}

      {/* 1. Activity Overview */}
      <Card className="p-4">
        <p className="text-[13px] font-semibold text-ink-soft">Last 7 days confirmed</p>
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
        {items && (week.spent > 0 || week.nonEarned > 0) ? (
          <p className="mt-2 text-xs text-ink-muted">
            {week.spent > 0 ? `Living ${formatINR(week.living)} · Work ${formatINR(week.work)}` : ""}
            {week.nonEarned > 0 ? `${week.spent > 0 ? " · " : ""}+${formatINR(week.nonEarned)} non-earned inflows` : ""}
          </p>
        ) : null}
      </Card>

      {/* 2. Spending Intelligence & Categorisation */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-bold text-ink">Spending Behavior</p>
          {spendingReport.weekOverWeekChangePercent !== null ? (
            <span className={cx(
              "text-[11px] font-bold px-2 py-0.5 rounded-full",
              spendingReport.weekOverWeekChangePercent > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
            )}>
              {spendingReport.weekOverWeekChangePercent > 0 ? "+" : ""}{spendingReport.weekOverWeekChangePercent}% vs prior week
            </span>
          ) : null}
        </div>

        {spendingReport.totalPersonalExpensesPaise > 0 ? (
          <>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-ink-muted">
                <span>Personal Living ({spendingReport.livingPercent}%)</span>
                <span>Work Tools/Fuel ({spendingReport.workPercent}%)</span>
              </div>
              <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden flex" role="progressbar" aria-label="Living vs Work spending proportion">
                <div className="bg-brand-600 h-full transition-all" style={{ width: `${spendingReport.livingPercent}%` }} />
                <div className="bg-amber-500 h-full transition-all" style={{ width: `${spendingReport.workPercent}%` }} />
              </div>
            </div>

            {spendingReport.topCategories.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                <p className="text-[12px] font-semibold text-ink-muted">Top spending categories:</p>
                <div className="flex flex-wrap gap-1.5">
                  {spendingReport.topCategories.map((c) => (
                    <span key={c.category} className="text-xs px-2.5 py-1 rounded-lg bg-neutral-100 text-ink-soft border border-line">
                      <strong>{categoryLabel(c.category, "expense")}</strong>: {formatINR(c.totalPaise)} ({c.percentage}%)
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {spendingReport.anomalies.length > 0 ? (
              <div className="space-y-1.5 pt-2 border-t border-line">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-amber-800">Unusual spending detected:</p>
                  <Link to="/activity" className="text-[11.5px] font-semibold text-brand-700">
                    Review activity →
                  </Link>
                </div>
                <div className="space-y-1.5">
                  {spendingReport.anomalies.slice(0, 3).map((a, idx) => (
                    <div key={`${a.kind}-${idx}`} className="text-xs rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-amber-900">
                      {a.category ? <strong>{categoryLabel(a.category, "expense")}: </strong> : null}
                      {a.message}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-xs text-ink-muted">No confirmed expenses yet to analyze spending categories.</p>
        )}
      </Card>

      {/* 2b. Financial Health Indicators */}
      {healthReport ? (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[14px] font-bold text-ink">Financial Health</p>
              <p className="text-xs text-ink-muted">{healthReport.summary}</p>
            </div>
            <span
              className={cx(
                "shrink-0 text-[10.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                healthReport.overallStatus === "healthy"
                  ? "bg-emerald-100 text-emerald-800"
                  : healthReport.overallStatus === "watch"
                    ? "bg-amber-100 text-amber-800"
                    : healthReport.overallStatus === "attention"
                      ? "bg-red-100 text-red-700"
                      : "bg-neutral-100 text-neutral-600"
              )}
            >
              {healthReport.overallStatus === "insufficient_data" ? "Needs data" : healthReport.overallStatus}
            </span>
          </div>
          <div className="divide-y divide-line">
            {healthReport.indicators.map((ind) => (
              <div key={ind.id} className="py-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink">{ind.label}</p>
                  <p className="text-[11.5px] text-ink-muted">{ind.explanation}</p>
                </div>
                <span
                  className={cx(
                    "shrink-0 text-xs font-bold tabular-nums",
                    ind.status === "healthy"
                      ? "text-emerald-700"
                      : ind.status === "watch"
                        ? "text-amber-700"
                        : ind.status === "attention"
                          ? "text-red-600"
                          : "text-ink-muted"
                  )}
                >
                  {ind.valueText}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* 3. Adaptive Buffer Recommendation */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-bold text-ink">Adaptive Safety Cushion</p>
            <p className="text-xs text-ink-muted">{bufferRec.protectionDays} days recommended protection horizon</p>
          </div>
          <span className="text-[18px] font-black text-brand-800 tabular-nums">
            {formatINR(bufferRec.recommendedBufferPaise)}
          </span>
        </div>

        <div className="rounded-xl bg-neutral-50 p-3 text-xs space-y-1 text-ink-soft border border-line">
          <p className="font-semibold text-ink">Based on your essential needs:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {bufferRec.explanation.map((e, idx) => (
              <li key={idx}>{e}</li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-ink-faint">
            Planning cushion only · Never deducted from balance
          </span>
          <Link to="/profile" className="text-xs font-semibold text-brand-700 hover:underline">
            Adjust in profile →
          </Link>
        </div>
      </Card>

      {/* 4. Statistical Income Forecast */}
      <Card className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-bold text-ink">7-Day Income Forecast</p>
            <p className="text-xs text-ink-muted">Statistical projection from your confirmed history</p>
          </div>
          <span className={cx(
            "text-[10.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
            incomeForecast.confidence === "high" ? "bg-emerald-100 text-emerald-800" :
            incomeForecast.confidence === "moderate" ? "bg-sky-100 text-sky-800" :
            "bg-neutral-100 text-neutral-600"
          )}>
            {incomeForecast.confidence}
          </span>
        </div>

        {incomeForecast.hasSufficientData ? (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-[20px] font-extrabold text-ink tabular-nums">
                {formatINR(incomeForecast.expectedPaise)}
              </span>
              <span className="text-xs text-ink-muted">
                (Range: {formatINR(incomeForecast.lowerBoundPaise)} – {formatINR(incomeForecast.upperBoundPaise)})
              </span>
            </div>
            <p className="text-xs text-ink-muted">{incomeForecast.dataSummary}</p>
          </div>
        ) : (
          <p className="text-xs text-ink-muted pt-1">
            Need at least 3 confirmed personal income records to build a statistical forecast.
          </p>
        )}
      </Card>

      {/* 5. What-If Scenario Simulator */}
      <Card tone="soft" className="p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-brand-800">
          <IconSparkle size={16} />
          <p className="text-[14px] font-bold">“What-If” Scenario Simulator</p>
        </div>
        <p className="text-xs text-ink-muted">
          Test hypothetical changes without affecting your actual balance or transactions.
        </p>

        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1">
              Income shift: {simIncomeChange > 0 ? `+${simIncomeChange}%` : `${simIncomeChange}%`}
            </label>
            <div className="flex gap-2">
              {[-30, -15, 0, 15, 30].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setSimIncomeChange(pct)}
                  className={cx(
                    "flex-1 py-1 text-xs font-semibold rounded-lg border",
                    simIncomeChange === pct
                      ? "bg-brand-700 text-white border-brand-700"
                      : "bg-white text-ink-soft border-line hover:border-brand-200"
                  )}
                >
                  {pct > 0 ? `+${pct}%` : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1">
              Payout delay: {simDelayDays} days
            </label>
            <div className="flex gap-2">
              {[0, 3, 7, 14].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSimDelayDays(d)}
                  className={cx(
                    "flex-1 py-1 text-xs font-semibold rounded-lg border",
                    simDelayDays === d
                      ? "bg-brand-700 text-white border-brand-700"
                      : "bg-white text-ink-soft border-line hover:border-brand-200"
                  )}
                >
                  {d === 0 ? "None" : `+${d}d`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1">
              One-time expense shock: ₹{simEmergencyRupees}
            </label>
            <div className="flex gap-2">
              {[0, 1000, 2500, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setSimEmergencyRupees(amt)}
                  className={cx(
                    "flex-1 py-1 text-xs font-semibold rounded-lg border",
                    simEmergencyRupees === amt
                      ? "bg-brand-700 text-white border-brand-700"
                      : "bg-white text-ink-soft border-line hover:border-brand-200"
                  )}
                >
                  {amt === 0 ? "₹0" : `₹${amt}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {scenarioResult ? (
          <div className="mt-2 rounded-xl bg-white p-3 border border-line space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-muted">Runway projection:</span>
              <span className="font-bold text-ink">
                {scenarioResult.simulated.runwayDays} days (Baseline: {scenarioResult.baseline.runwayDays} days)
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-muted">Ending balance impact:</span>
              <span className={cx(
                "font-bold tabular-nums",
                scenarioResult.deltaClosingBalancePaise >= 0 ? "text-brand-700" : "text-red-600"
              )}>
                {scenarioResult.deltaClosingBalancePaise >= 0 ? "+" : ""}{formatINR(scenarioResult.deltaClosingBalancePaise)}
              </span>
            </div>
            <p className="text-[11.5px] text-ink-soft pt-1">{scenarioResult.explanation}</p>
          </div>
        ) : null}

        <p className="text-[11px] text-amber-800 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
          ⚠️ Strictly hypothetical simulation. Does not alter your transactions or bank balance.
        </p>
      </Card>

      {/* 6. Actionable Alerts & Rule-based Tips */}
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
    </div>
  );
}
