// Home — "Your money at a glance". Powered by the shared Sprint 6B financial intelligence layer.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { todayLocalISO } from "../data/dates";
import { formatINR } from "../lib/money";
import { useProfile } from "../profile/useProfile";
import type { ProcessedRunway } from "../runway/adapter";
import { ActivityRow } from "../app/ActivityRow";
import { buildHomeDashboardModel } from "../app/homeDashboardModel";
import { useActivity } from "../app/useActivity";
import {
  FINANCIAL_TERMS,
  formatFinancialAmount,
  useFinancialIntelligence,
} from "../app/useFinancialIntelligence";
import { Card, Notice, ProgressBar, SectionTitle, Skeleton, cx, daysFromToday, formatDay } from "../ui/kit";
import { IconAlert, IconCamera, IconCheckCircle, IconInfo, IconMic, IconPencil, IconShield, IconWallet, IconChevronRight } from "../ui/icons";

export function HomeScreen() {
  const { user } = useSession();
  const { profile } = useProfile();
  const { data: intel, loading, error } = useFinancialIntelligence({ horizonDays: 7 });
  const recent = useActivity({ limit: 5, includeExpectedPayouts: false });
  const [showInfo, setShowInfo] = useState(false);
  const today = todayLocalISO();

  const model = useMemo(() => buildHomeDashboardModel(intel), [intel]);
  const runway = intel?.runway ?? null;
  const name = profile?.display_name?.trim() || user?.email?.split("@")[0] || "there";

  const header = (
    <header className="px-4 pt-5 pb-2 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[13px] text-ink-muted">Today, {formatDay(today)}</p>
        <h1 className="text-[22px] font-bold text-ink truncate">Hi, {name} 👋</h1>
      </div>
      <Link
        to="/profile"
        aria-label="Profile"
        className="w-10 h-10 shrink-0 rounded-full bg-brand-700 text-white font-bold flex items-center justify-center"
      >
        {name.charAt(0).toUpperCase()}
      </Link>
    </header>
  );

  const today0 = runway?.projections[0];
  const budgetTotal = runway?.dailyEssentialExpensePaise ?? null;
  const budgetLeft =
    today0 && (today0.remainingLivingBudgetPaise !== undefined || today0.remainingWorkBudgetPaise !== undefined)
      ? (today0.remainingLivingBudgetPaise ?? 0) + (today0.remainingWorkBudgetPaise ?? 0)
      : null;

  const pressureBadge = {
    none: { label: "None", tone: "bg-brand-50 text-brand-700" },
    low: { label: "Low", tone: "bg-brand-50 text-brand-700" },
    moderate: { label: "Moderate", tone: "bg-amber-50 text-amber-800" },
    high: { label: "High", tone: "bg-red-50 text-red-700" },
  }[model.safetySummary.debtPressureLevel];

  const healthTone = {
    healthy: "bg-brand-50 text-brand-700",
    watch: "bg-amber-50 text-amber-800",
    attention: "bg-red-50 text-red-700",
    insufficient_data: "bg-[#F1F3EE] text-ink-soft",
  }[model.healthSummary.status];

  return (
    <div>
      {header}
      <div className="px-4 pb-6 space-y-4">
        {error ? <Notice tone="danger" title="Couldn't load your money">{error}</Notice> : null}

        {/* Main financial overview: Confirmed Cash, Safe-to-Spend & Sustainable Capital */}
        {loading && !intel ? (
          <Skeleton className="h-[196px]" />
        ) : !error ? (
          <Card tone="brand" className="p-4 space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-800">
                <span>{FINANCIAL_TERMS.confirmedCash.label}</span>
                <button type="button" aria-label="What is confirmed cash and safe-to-spend?" onClick={() => setShowInfo((v) => !v)} className="text-brand-700">
                  <IconInfo size={16} />
                </button>
              </div>
              <p className="mt-1 text-[34px] leading-10 font-extrabold text-ink tabular-nums">
                {formatFinancialAmount(model.confirmedCashPaise)}
              </p>
              {!model.hasConfirmedBalance ? (
                <p className="text-[13px] text-ink-muted mt-1">Do a balance check-in to see this.</p>
              ) : (
                <div className="mt-1 space-y-0.5 text-[12px] text-ink-soft">
                  <p>Cash &amp; bank money available now (excludes pending payouts)</p>
                  {model.custodialOwedPaise > 0 ? (
                    <p>{formatINR(model.custodialOwedPaise)} held for others is not counted</p>
                  ) : null}
                  {model.receivablesPaise > 0 ? (
                    <p>{formatINR(model.receivablesPaise)} owed to you is separate (not cash)</p>
                  ) : null}
                </div>
              )}
            </div>

            {model.hasConfirmedBalance ? (
              <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-brand-100">
                <div className="rounded-xl bg-white/80 p-2.5">
                  <p className="text-[11.5px] font-semibold text-brand-800">{FINANCIAL_TERMS.safeToSpend.label}</p>
                  <p className="mt-0.5 text-[17px] font-extrabold tabular-nums text-ink">
                    {formatFinancialAmount(model.safeToSpendPaise)}
                  </p>
                  <p className="text-[11px] text-ink-muted leading-tight mt-0.5">
                    {model.nextExpectedIncomeDate
                      ? model.laterMonthCommitmentsPaise > 0
                        ? `Until ${formatDay(model.nextExpectedIncomeDate)} (${formatINR(model.laterMonthCommitmentsPaise)} due later)`
                        : `Until ${formatDay(model.nextExpectedIncomeDate)}`
                      : "After cushion & bills"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/80 p-2.5">
                  <p className="text-[11.5px] font-semibold text-brand-800">{FINANCIAL_TERMS.sustainableCapital.label}</p>
                  <p className="mt-0.5 text-[17px] font-extrabold tabular-nums text-ink">
                    {formatFinancialAmount(model.sustainableCapitalPaise)}
                  </p>
                  <p className="text-[11px] text-ink-muted leading-tight mt-0.5">
                    After debts &amp; cushion
                  </p>
                </div>
              </div>
            ) : null}

            {showInfo ? (
              <div className="text-[12px] leading-5 text-brand-900 bg-white/80 rounded-xl p-3 space-y-1.5">
                <p><strong>{FINANCIAL_TERMS.confirmedCash.label}:</strong> {FINANCIAL_TERMS.confirmedCash.shortDescription}</p>
                <p><strong>{FINANCIAL_TERMS.safeToSpend.label}:</strong> {FINANCIAL_TERMS.safeToSpend.shortDescription}</p>
                <p><strong>{FINANCIAL_TERMS.sustainableCapital.label}:</strong> {FINANCIAL_TERMS.sustainableCapital.shortDescription}</p>
              </div>
            ) : null}
          </Card>
        ) : null}

        {/* Daily spending allowance */}
        {model.hasConfirmedBalance && model.dailyAllowancePaise !== null ? (
          <Card className="p-4 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] font-semibold text-ink-soft">Daily spending allowance</span>
              <span className="text-[16px] font-extrabold tabular-nums text-ink">
                {formatFinancialAmount(model.dailyAllowancePaise)}
                <span className="text-[12px] font-medium text-ink-muted"> / day</span>
              </span>
            </div>
            {runway?.status === "PROJECTED" && budgetTotal !== null && budgetLeft !== null ? (
              <>
                <ProgressBar ratio={budgetTotal > 0 ? budgetLeft / budgetTotal : 0} tone={budgetLeft < 0 ? "danger" : budgetLeft < budgetTotal * 0.25 ? "warn" : "brand"} />
                <div className="flex items-center justify-between text-[11.5px] text-ink-muted">
                  <span>Today&apos;s budget left: {formatINR(budgetLeft)} / {formatINR(budgetTotal)}</span>
                  {model.remainingMonthlyAllowancePaise !== null ? (
                    <span>{formatFinancialAmount(model.remainingMonthlyAllowancePaise)} this month</span>
                  ) : null}
                </div>
              </>
            ) : model.remainingMonthlyAllowancePaise !== null ? (
              <p className="text-[12px] text-ink-muted">
                Remaining monthly allowance: {formatFinancialAmount(model.remainingMonthlyAllowancePaise)}
              </p>
            ) : null}
          </Card>
        ) : null}

        {/* Runway status */}
        {runway ? <RunwayStatus runway={runway} today={today} /> : null}

        {/* Financial safety: cushion, upcoming bills, overdue, debt pressure */}
        {model.safetySummary.show ? (
          <Card className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-ink-soft">Financial safety</span>
              <span className={cx("px-2 py-0.5 rounded-full text-[11px] font-semibold", pressureBadge.tone)}>
                Debt pressure: {pressureBadge.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-ink-muted">{FINANCIAL_TERMS.safetyCushion.label}</p>
                <p className="mt-0.5 text-[14px] font-bold tabular-nums text-ink">
                  {formatFinancialAmount(model.safetySummary.safetyCushionPaise)}
                </p>
              </div>
              <div>
                <p className="text-ink-muted">Upcoming bills</p>
                <p className="mt-0.5 text-[14px] font-bold tabular-nums text-ink">
                  {model.safetySummary.upcomingBillsCount > 0
                    ? `${formatINR(model.safetySummary.upcomingBillsPaise)} (${model.safetySummary.upcomingBillsCount})`
                    : "None due"}
                </p>
              </div>
            </div>
            {model.safetySummary.overdueObligationsPaise > 0 ? (
              <Link
                to="/commitments"
                className="flex items-center justify-between rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs font-semibold text-red-800"
              >
                <span>
                  Overdue obligations: {formatINR(model.safetySummary.overdueObligationsPaise)} ({model.safetySummary.overdueCount})
                </span>
                <IconChevronRight size={15} />
              </Link>
            ) : model.safetySummary.totalLiabilitiesPaise > 0 ? (
              <Link
                to="/money"
                className="flex items-center justify-between rounded-xl bg-[#F1F3EE] px-3 py-2 text-xs text-ink-soft"
              >
                <span>Outstanding debt &amp; splits: <strong className="text-ink">{formatINR(model.safetySummary.totalLiabilitiesPaise)}</strong></span>
                <IconChevronRight size={15} className="text-ink-faint" />
              </Link>
            ) : null}
          </Card>
        ) : null}

        {/* Financial health summary */}
        {model.healthSummary.show ? (
          <Link to="/insights" className="block rounded-2xl bg-white border border-line shadow-card p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[13px] font-semibold text-ink-soft">Financial health</span>
                <span className={cx("px-2 py-0.5 rounded-full text-[11px] font-semibold", healthTone)}>
                  {model.healthSummary.badgeLabel}
                </span>
              </div>
              <span className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-brand-700 shrink-0">
                Insights <IconChevronRight size={15} />
              </span>
            </div>
            <p className="mt-1.5 text-[12.5px] text-ink-muted leading-snug">{model.healthSummary.summary}</p>
          </Link>
        ) : null}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <QuickAction to="/voice" icon={<IconMic size={22} />} label="Add by voice" />
          <QuickAction to="/catch" icon={<IconCamera size={22} />} label="Scan receipt" />
          <QuickAction to="/add" icon={<IconPencil size={22} />} label="Add income / expense" />
          <QuickAction to="/checkin" icon={<IconWallet size={22} />} label="Check in your balance" />
        </div>

        {/* This month */}
        <Link to="/insights?tab=month" className="block rounded-2xl bg-white border border-line shadow-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink-soft">This month</span>
            <span className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-brand-700">Timeline <IconChevronRight size={15} /></span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-ink-muted">Earned</p>
              <p className="text-[18px] font-extrabold tabular-nums text-brand-700">
                {loading && !intel ? "…" : formatFinancialAmount(model.monthlyOverview.earnedIncomePaise)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Spent</p>
              <p className="text-[18px] font-extrabold tabular-nums text-red-600">
                {loading && !intel ? "…" : formatFinancialAmount(model.monthlyOverview.expensePaise)}
              </p>
            </div>
          </div>
          {model.monthlyOverview.nonEarnedInflowPaise && model.monthlyOverview.nonEarnedInflowPaise > 0 ? (
            <p className="mt-2 text-[11.5px] text-ink-muted">
              +{formatINR(model.monthlyOverview.nonEarnedInflowPaise)} non-earned inflows (support/gifts) kept separate
            </p>
          ) : null}
        </Link>

        {/* Recent */}
        <SectionTitle action={<Link to="/activity" className="text-[13px] font-semibold text-brand-700">See all</Link>}>Recent activity</SectionTitle>
        <Card className="p-1">
          {recent.loading ? (
            <div className="p-3 space-y-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : recent.items && recent.items.length > 0 ? (
            <div className="divide-y divide-line">
              {recent.items.slice(0, 4).map((it) => (
                <ActivityRow key={`${it.kind}-${it.id}`} item={it} />
              ))}
            </div>
          ) : (
            <p className="p-4 text-sm text-ink-muted text-center">Nothing recorded yet. Tap the mic and say "Spent 150 on food".</p>
          )}
        </Card>

        <div className="flex items-center justify-center gap-1.5 pt-1 text-[11.5px] text-ink-faint">
          <IconShield size={14} />
          <span>Private by design. AI suggests, you confirm.</span>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="h-[88px] rounded-2xl bg-white border border-line shadow-card flex flex-col items-center justify-center gap-1.5 text-center px-2 active:scale-[0.98] transition-transform"
    >
      <span className="w-10 h-10 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center">{icon}</span>
      <span className="text-[13px] font-semibold text-ink leading-4">{label}</span>
    </Link>
  );
}

function RunwayStatus({ runway, today }: { runway: ProcessedRunway; today: string }) {
  if (runway.status !== "PROJECTED") {
    return (
      <Notice
        tone="info"
        title="A few details and FLOVA can plan ahead"
        action={
          <div className="flex flex-wrap gap-2">
            {runway.missingInputs.some((m) => m.startsWith("Balance")) ? (
              <Link to="/checkin" className="inline-flex h-8 items-center rounded-full bg-sky-700 px-3 text-xs font-semibold text-white">Check in balance</Link>
            ) : null}
            {runway.missingInputs.some((m) => m.startsWith("Daily")) ? (
              <Link to="/profile" className="inline-flex h-8 items-center rounded-full bg-white border border-sky-200 px-3 text-xs font-semibold text-sky-900">Set daily spending</Link>
            ) : null}
          </div>
        }
      >
        Missing: {runway.missingInputs.join(", ") || runway.reason}
      </Notice>
    );
  }
  if (runway.firstShortfallDate) {
    const n = Math.max(0, daysFromToday(runway.firstShortfallDate, today));
    return (
      <StatusLink to="/insights" tone="danger" icon={<IconAlert size={20} />} title={`Possible shortfall ${n === 0 ? "today" : `in ${n} day${n === 1 ? "" : "s"}`}`}>
        Your money may run low on {formatDay(runway.firstShortfallDate)}.
      </StatusLink>
    );
  }
  if (runway.firstBufferShortfallDate) {
    return (
      <StatusLink to="/insights" tone="warn" icon={<IconAlert size={20} />} title="Your safety cushion gets used">
        Spending dips into your cushion on {formatDay(runway.firstBufferShortfallDate)}.
      </StatusLink>
    );
  }
  return (
    <StatusLink to="/insights" tone="brand" icon={<IconCheckCircle size={20} />} title="Covered for the next 7 days">
      Based on your confirmed money, daily spending and bills.
    </StatusLink>
  );
}

function StatusLink({ to, tone, icon, title, children }: { to: string; tone: "danger" | "warn" | "brand"; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const tones = {
    danger: "bg-red-50 border-red-100 text-red-900 [&_.ic]:text-red-600",
    warn: "bg-amber-50 border-amber-100 text-amber-950 [&_.ic]:text-amber-600",
    brand: "bg-white border-line text-ink [&_.ic]:text-brand-700",
  }[tone];
  return (
    <Link to={to} className={cx("flex items-center gap-3 rounded-2xl border p-3.5 shadow-card", tones)}>
      <span className="ic shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-bold">{title}</span>
        <span className="block text-[12.5px] opacity-80">{children}</span>
      </span>
      <IconChevronRight size={18} className="opacity-50 shrink-0" />
    </Link>
  );
}
