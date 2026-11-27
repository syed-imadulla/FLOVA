// Month-at-a-glance: confirmed income and expenses per day for one calendar month.
// Sums are integer paise. Money that isn't the user's (COD, platform funds) is excluded,
// and balance check-ins / expected payouts are never counted as income or spending.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "../auth/useSession";
import { useDataVersion } from "../data/DataVersionProvider";
import { monthRange, shiftMonth, summarise, type DayTotals, type MonthSummary } from "../engine/monthSummary";
import { listTransactions } from "../services/data";
import type { Transaction } from "../types/contracts";

export { monthRange, shiftMonth, summarise, type DayTotals, type MonthSummary };

export function useMonthSummary(month: string) {
  const { user } = useSession();
  const { version } = useDataVersion();
  const [txs, setTxs] = useState<{ month: string; items: Transaction[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const req = useRef(0);

  const load = useCallback(async () => {
    if (!user) {
      setTxs(null);
      setError(null);
      return;
    }
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
