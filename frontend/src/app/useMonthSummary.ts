// Month-at-a-glance: confirmed income and expenses per day for one calendar month.
// Sums are integer paise. Money that isn't the user's (COD, platform funds) is excluded,
// and balance check-ins / expected payouts are never counted as income or spending.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "../auth/useSession";
import { useDataVersion } from "../data/DataVersionProvider";
import { toPaise } from "../lib/money";
import { listTransactions } from "../services/data";
import type { Transaction } from "../types/contracts";

export interface DayTotals {
  date: string; // YYYY-MM-DD
  income: number;
  expense: number;
}

export interface MonthSummary {
  days: DayTotals[];
  income: number;
  expense: number;
  living: number;
  work: number;
  notMine: number;
  byCategory: Array<{ category: string; amount: number }>;
  count: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** month = "YYYY-MM" */
export function monthRange(month: string): { from: string; to: string; daysInMonth: number } {
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${pad(daysInMonth)}`, daysInMonth };
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function summarise(month: string, txs: Transaction[]): MonthSummary {
  const { daysInMonth } = monthRange(month);
  const days: DayTotals[] = Array.from({ length: daysInMonth }, (_, i) => ({ date: `${month}-${pad(i + 1)}`, income: 0, expense: 0 }));
  const cats = new Map<string, number>();
  let income = 0, expense = 0, living = 0, work = 0, notMine = 0, count = 0;
  for (const t of txs) {
    const day = Number(t.transaction_date.slice(8, 10)) - 1;
    if (!t.transaction_date.startsWith(month) || day < 0 || day >= daysInMonth) continue;
    const amt = toPaise(t.amount);
    count++;
    if (t.ownership === "not_mine") {
      notMine += amt;
      continue;
    }
    if (t.type === "income") {
      income += amt;
      days[day].income += amt;
    } else {
      expense += amt;
      days[day].expense += amt;
      if (t.expense_type === "work") work += amt;
      else living += amt;
      cats.set(t.category || "other", (cats.get(t.category || "other") ?? 0) + amt);
    }
  }
  const byCategory = [...cats.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  return { days, income, expense, living, work, notMine, byCategory, count };
}

export function useMonthSummary(month: string) {
  const { user } = useSession();
  const { version } = useDataVersion();
  const [txs, setTxs] = useState<{ month: string; items: Transaction[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const req = useRef(0);

  const load = useCallback(async () => {
    if (!user) return;
    const id = ++req.current;
    setError(null);
    const { from, to } = monthRange(month);
    try {
      const items = await listTransactions({ from, to });
      if (id === req.current) setTxs({ month, items });
    } catch (e) {
      if (id === req.current) setError(e instanceof Error ? e.message : "Could not load this month");
    }
  }, [user, month]);

  useEffect(() => {
    load();
  }, [load, version]);

  const summary = useMemo(() => (txs && txs.month === month ? summarise(month, txs.items) : null), [txs, month]);
  return { summary, loading: !summary && !error, error };
}
