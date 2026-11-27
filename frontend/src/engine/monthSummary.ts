// Pure month-at-a-glance summary calculation in integer paise.
// Separates earned income from non-earned inflows (family_support, pocket_money,
// gift, donation) while keeping total personal cash inflows available.
import { toPaise } from "../lib/money";
import type { Transaction } from "../types/contracts";

export interface DayTotals {
  date: string; // YYYY-MM-DD
  income: number;
  expense: number;
}

export interface MonthSummary {
  days: DayTotals[];
  /** Total confirmed personal cash inflows (earned + non-earned). */
  income: number;
  /** Confirmed earned income only (excludes gifts, donations, family support, pocket money). */
  earnedIncome: number;
  /** Confirmed non-earned inflows (family_support, pocket_money, gift, donation). */
  nonEarnedInflow: number;
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
  const days: DayTotals[] = Array.from({ length: daysInMonth }, (_, i) => ({
    date: `${month}-${pad(i + 1)}`,
    income: 0,
    expense: 0,
  }));
  const cats = new Map<string, number>();
  let income = 0,
    earnedIncome = 0,
    nonEarnedInflow = 0,
    expense = 0,
    living = 0,
    work = 0,
    notMine = 0,
    count = 0;
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
      // Legacy transactions with null/undefined inflow_category fall back to 'earned' for backward compatibility.
      const inflowCat = t.inflow_category ?? "earned";
      if (inflowCat === "earned") {
        earnedIncome += amt;
      } else {
        nonEarnedInflow += amt;
      }
    } else {
      expense += amt;
      days[day].expense += amt;
      if (t.expense_type === "work") work += amt;
      else living += amt;
      cats.set(t.category || "other", (cats.get(t.category || "other") ?? 0) + amt);
    }
  }
  const byCategory = [...cats.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
  return { days, income, earnedIncome, nonEarnedInflow, expense, living, work, notMine, byCategory, count };
}
