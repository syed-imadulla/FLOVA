import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "../auth/useSession";
import { useDataVersion } from "../data/DataVersionProvider";
import { listActivityTimeline } from "../services/data";
import type { ActivityItem } from "../types/contracts";

/**
 * Unified activity feed (transactions, check-ins, expected payouts) that refreshes whenever
 * any screen records a change through the data-version signal. Keeps the previous items
 * visible while refreshing, so lists never blank out and jump.
 */
export function useActivity(opts: { limit?: number; includeExpectedPayouts?: boolean } = {}) {
  const { user } = useSession();
  const { version } = useDataVersion();
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const load = useCallback(async () => {
    if (!user) {
      setItems(null);
      setError(null);
      return;
    }
    const id = ++reqId.current;
    setError(null);
    try {
      const data = await listActivityTimeline({ limit: opts.limit, includeExpectedPayouts: opts.includeExpectedPayouts });
      if (id === reqId.current) setItems(data);
    } catch (err) {
      if (id === reqId.current) setError(err instanceof Error ? err.message : "Could not load activity");
    }
  }, [user, opts.limit, opts.includeExpectedPayouts]);

  useEffect(() => {
    load();
  }, [load, version]);

  return { items, loading: items === null && !error, error, reload: load };
}
