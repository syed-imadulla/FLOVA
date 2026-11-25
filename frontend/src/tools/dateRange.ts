// =====================================================================
// FLOVA 2.0 | Sprint 3A — Deterministic Date Range & Period Resolution
// Uses FLOVA's local-IST YYYY-MM-DD conventions.
// =====================================================================

import { todayLocalISO } from "../data/dates";
import { addDays, isValidISODate } from "../engine";
import type { ISODate } from "../types/contracts";
import type { DateRangeInput, RelativePeriod } from "./types";

export interface ResolvedDateRange {
  ok: true;
  period: RelativePeriod;
  fromDate: ISODate;
  toDate: ISODate;
  todayISO: ISODate;
}

export interface InvalidDateRange {
  ok: false;
  error: string;
  todayISO: ISODate;
}

export function resolveDateRange(input: DateRangeInput = {}): ResolvedDateRange | InvalidDateRange {
  const todayISO = input.todayISO ?? todayLocalISO();
  if (!isValidISODate(todayISO)) {
    return { ok: false, error: `Invalid todayISO date: "${todayISO}". Expected YYYY-MM-DD.`, todayISO: todayLocalISO() };
  }

  if (input.fromDate !== undefined || input.toDate !== undefined) {
    const fromDate = input.fromDate ?? input.toDate!;
    const toDate = input.toDate ?? input.fromDate!;
    if (!isValidISODate(fromDate) || !isValidISODate(toDate)) {
      return { ok: false, error: "fromDate and toDate must be valid YYYY-MM-DD dates.", todayISO };
    }
    if (fromDate > toDate) {
      return { ok: false, error: `fromDate (${fromDate}) cannot be after toDate (${toDate}).`, todayISO };
    }
    return { ok: true, period: "custom", fromDate, toDate, todayISO };
  }

  const period: RelativePeriod = input.period ?? "this_month";
  switch (period) {
    case "today":
      return { ok: true, period, fromDate: todayISO, toDate: todayISO, todayISO };
    case "yesterday": {
      const y = addDays(todayISO, -1);
      return { ok: true, period, fromDate: y, toDate: y, todayISO };
    }
    case "this_week":
      return { ok: true, period, fromDate: addDays(todayISO, -6), toDate: todayISO, todayISO };
    case "this_month":
      return { ok: true, period, fromDate: `${todayISO.slice(0, 7)}-01`, toDate: todayISO, todayISO };
    case "last_month": {
      const [yStr, mStr] = todayISO.split("-");
      const y = Number(yStr);
      const m = Number(mStr);
      const prevYear = m === 1 ? y - 1 : y;
      const prevMonth = m === 1 ? 12 : m - 1;
      const lastDay = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
      const ym = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
      return { ok: true, period, fromDate: `${ym}-01`, toDate: `${ym}-${String(lastDay).padStart(2, "0")}`, todayISO };
    }
    case "custom":
      return { ok: false, error: "Custom period requires fromDate and/or toDate.", todayISO };
    default:
      return { ok: false, error: `Unsupported period: "${String(period)}".`, todayISO };
  }
}
