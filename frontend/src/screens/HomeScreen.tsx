// Home — "Your money at a glance". All numbers come from the deterministic engine via useRunway.
import { useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { todayLocalISO } from "../data/dates";
import { formatINR } from "../lib/money";
import { useProfile } from "../profile/useProfile";
import { useRunway } from "../runway/useRunway";
import { ActivityRow } from "../app/ActivityRow";
import { useActivity } from "../app/useActivity";
import { useMonthSummary } from "../app/useMonthSummary";
import { Card, Notice, ProgressBar, SectionTitle, Skeleton, cx, daysFromToday, formatDay } from "../ui/kit";
import { IconAlert, IconCamera, IconCheckCircle, IconInfo, IconMic, IconPencil, IconShield, IconWallet, IconChevronRight } from "../ui/icons";

export function HomeScreen() {
  const { user } = useSession();
  const { profile } = useProfile();
  const { runway, loading, error } = useRunway({ horizonDays: 7 });
  const recent = useActivity({ limit: 5, includeExpectedPayouts: false });
  const [showInfo, setShowInfo] = useState(false);
  const today = todayLocalISO();
  const month = useMonthSummary(today.slice(0, 7));

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

  return (
    <div>
      {header}
      <div className="px-4 pb-6 space-y-4">
        {error ? <Notice tone="danger" title="Couldn't load your money">{error}</Notice> : null}

        {/* Available money */}
        {loading && !runway ? (
          <Skeleton className="h-[132px]" />
        ) : (
          <Card tone="brand" className="p-4">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-800">
              <span>Available money</span>
              <button type="button" aria-label="What is available money?" onClick={() => setShowInfo((v) => !v)} className="text-brand-700">
                <IconInfo size={16} />
              </button>
            </div>
            <p className="mt-1 text-[34px] leading-10 font-extrabold text-ink tabular-nums">
              {runway?.confirmedBalancePaise != null ? formatINR(runway.confirmedBalancePaise) : "—"}
            </p>
            {runway?.confirmedBalancePaise == null ? (
              <p className="text-[13px] text-ink-muted mt-1">Do a balance check-in to see this.</p>
            ) : (
              <div className="mt-1 space-y-0.5 text-[12.5px] text-ink-soft">
                {runway.safeRunwayBufferPaise ? (
                  <p>
                    {formatINR(runway.startingSpendableBalancePaise ?? 0)} spendable after your {formatINR(runway.safeRunwayBufferPaise)} safety cushion
                  </p>
                ) : null}
                {runway.custodialOwedPaise ? <p>{formatINR(runway.custodialOwedPaise)} held for others is not counted</p> : null}
              </div>
            )}
            {showInfo ? (
              <p className="mt-3 text-[12.5px] leading-5 text-brand-900 bg-white/70 rounded-xl p-3">
                Your own cash and bank money from your last check-in, plus confirmed income and minus confirmed expenses since then.
                Platform/COD money you're holding and payouts you haven't received yet are not included.
              </p>
            ) : null}
          </Card>
        )}

        {/* Today's budget */}
        {runway?.status === "PROJECTED" && budgetTotal !== null && budgetLeft !== null ? (
          <Card className="p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-semibold text-ink-soft">Today's budget left</span>
              <span className="text-[15px] font-bold tabular-nums">
                <span className={budgetLeft < 0 ? "text-red-600" : "text-ink"}>{formatINR(budgetLeft)}</span>
                <span className="text-ink-faint font-medium"> / {formatINR(budgetTotal)}</span>
              </span>
            </div>
            <div className="mt-2.5">
              <ProgressBar ratio={budgetTotal > 0 ? budgetLeft / budgetTotal : 0} tone={budgetLeft < 0 ? "danger" : budgetLeft < budgetTotal * 0.25 ? "warn" : "brand"} />
            </div>
          </Card>
        ) : null}

        {/* Runway status */}
        {runway ? <RunwayStatus runway={runway} today={today} /> : null}

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
              <p className="text-[18px] font-extrabold tabular-nums text-brand-700">{month.summary ? formatINR(month.summary.income) : "…"}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Spent</p>
              <p className="text-[18px] font-extrabold tabular-nums text-red-600">{month.summary ? formatINR(month.summary.expense) : "…"}</p>
            </div>
          </div>
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

function RunwayStatus({ runway, today }: { runway: NonNullable<ReturnType<typeof useRunway>["runway"]>; today: string }) {
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
