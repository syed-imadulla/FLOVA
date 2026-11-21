// Monthly timeline — every day of the month, income above the line and spending below it.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { categoryLabel } from "../app/categories";
import { shiftMonth, useMonthSummary } from "../app/useMonthSummary";
import { todayLocalISO } from "../data/dates";
import { formatINR } from "../lib/money";
import { Card, EmptyState, Notice, Skeleton, cx, formatDay } from "../ui/kit";
import { IconActivity, IconBack, IconChevronRight } from "../ui/icons";

const MONTH_FMT = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });

export function MonthView() {
  const today = todayLocalISO();
  const thisMonth = today.slice(0, 7);
  const [month, setMonth] = useState(thisMonth);
  const [active, setActive] = useState<number | null>(null);
  const { summary, loading, error } = useMonthSummary(month);
  const [y, m] = month.split("-").map(Number);
  const label = MONTH_FMT.format(new Date(y, m - 1, 1));

  const max = useMemo(() => (summary ? Math.max(1, ...summary.days.map((d) => Math.max(d.income, d.expense))) : 1), [summary]);
  const net = summary ? summary.income - summary.expense : 0;
  const sel = summary && active !== null ? summary.days[active] : null;
  const todayIdx = month === thisMonth ? Number(today.slice(8, 10)) - 1 : null;

  return (
    <>
      {/* Month switcher */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => { setActive(null); setMonth((cur) => shiftMonth(cur, -1)); }}
          aria-label="Previous month"
          className="w-10 h-10 rounded-full bg-white border border-line flex items-center justify-center text-ink"
        >
          <IconBack size={18} />
        </button>
        <p className="text-[16px] font-bold text-ink">{label}</p>
        <button
          type="button"
          onClick={() => { setActive(null); setMonth((cur) => shiftMonth(cur, 1)); }}
          disabled={month >= thisMonth}
          aria-label="Next month"
          className="w-10 h-10 rounded-full bg-white border border-line flex items-center justify-center text-ink disabled:opacity-30"
        >
          <IconChevronRight size={18} />
        </button>
      </div>

      {error ? <Notice tone="danger">{error}</Notice> : null}

      {loading || !summary ? (
        <>
          <Skeleton className="h-[84px]" />
          <Skeleton className="h-[230px]" />
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Card className="p-3">
              <p className="text-[11.5px] font-semibold text-ink-muted">Income</p>
              <p className="text-[16px] font-extrabold tabular-nums text-ink">{formatINR(summary.income)}</p>
            </Card>
            <Card className="p-3">
              <p className="text-[11.5px] font-semibold text-ink-muted">Spent</p>
              <p className="text-[16px] font-extrabold tabular-nums text-ink">{formatINR(summary.expense)}</p>
            </Card>
            <Card className="p-3">
              <p className="text-[11.5px] font-semibold text-ink-muted">Net</p>
              <p className={cx("text-[16px] font-extrabold tabular-nums", net < 0 ? "text-red-600" : "text-brand-700")}>{net < 0 ? formatINR(net) : `+${formatINR(net)}`}</p>
            </Card>
          </div>

          {summary.count === 0 ? (
            <Card>
              <EmptyState icon={<IconActivity size={22} />} title="Nothing recorded this month">
                Income and expenses you confirm will build this timeline.
              </EmptyState>
            </Card>
          ) : (
            <Card className="p-4">
              <div className="flex items-start justify-between gap-2 min-h-[40px]">
                {sel ? (
                  <div>
                    <p className="text-[13px] font-semibold text-ink">{formatDay(sel.date)}</p>
                    <p className="text-xs text-ink-muted tabular-nums">
                      In {formatINR(sel.income)} · Out {formatINR(sel.expense)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[13px] font-semibold text-ink">Daily money in and out</p>
                    <p className="text-xs text-ink-muted">Tap a day to see its totals</p>
                  </div>
                )}
                <div className="flex flex-col items-end gap-0.5 text-[11px] text-ink-muted">
                  <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand-600" />Income</span>
                  <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400" />Expenses</span>
                </div>
              </div>

              {/* Diverging daily bars: income up, expenses down, from one shared zero line. */}
              <div className="mt-3 flex h-[176px] items-stretch gap-[2px]" role="img" aria-label={`Daily income and expenses for ${label}`}>
                {summary.days.map((d, i) => {
                  const up = Math.round((d.income / max) * 76);
                  const down = Math.round((d.expense / max) * 76);
                  const future = todayIdx !== null && i > todayIdx;
                  const dim = active !== null && active !== i;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      disabled={future}
                      onClick={() => setActive(active === i ? null : i)}
                      onMouseEnter={() => setActive(i)}
                      aria-label={`${formatDay(d.date)}: income ${formatINR(d.income)}, expenses ${formatINR(d.expense)}`}
                      className={cx("relative flex-1 min-w-0 flex flex-col", future && "opacity-30")}
                    >
                      <span className="flex h-[78px] items-end justify-center">
                        {d.income > 0 ? <span className={cx("w-full max-w-[10px] rounded-t-[3px] bg-brand-600", dim && "opacity-35")} style={{ height: Math.max(3, up) }} /> : null}
                      </span>
                      <span className={cx("h-px w-full", i === todayIdx ? "bg-ink" : "bg-line")} />
                      <span className="flex h-[78px] items-start justify-center">
                        {d.expense > 0 ? <span className={cx("w-full max-w-[10px] rounded-b-[3px] bg-red-400", dim && "opacity-35")} style={{ height: Math.max(3, down) }} /> : null}
                      </span>
                      <span className={cx("absolute -bottom-0 left-0 right-0 text-center text-[9px] leading-none", i === todayIdx ? "font-bold text-ink" : "text-ink-faint")}>
                        {(i + 1) % 5 === 1 || i === todayIdx ? i + 1 : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {summary.expense > 0 ? (
            <Card className="p-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <p className="text-[13px] font-semibold text-ink">Where the money went</p>
                <p className="text-xs text-ink-muted">Living {formatINR(summary.living)} · Work {formatINR(summary.work)}</p>
              </div>
              {summary.byCategory.slice(0, 6).map((c) => (
                <div key={c.category} className="space-y-1">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-ink-soft">{categoryLabel(c.category)}</span>
                    <span className="font-semibold tabular-nums text-ink">{formatINR(c.amount)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/[0.06]">
                    <div className="h-full rounded-full bg-red-400" style={{ width: `${Math.max(2, (c.amount / summary.expense) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </Card>
          ) : null}

          {summary.notMine > 0 ? (
            <p className="px-1 text-xs text-ink-muted">{formatINR(summary.notMine)} of money that isn't yours (COD, platform funds) is left out of these totals.</p>
          ) : null}

          <Link to="/activity" className="flex items-center justify-center gap-1 text-[13px] font-semibold text-brand-700">
            See every entry in Activity <IconChevronRight size={15} />
          </Link>
        </>
      )}
    </>
  );
}
