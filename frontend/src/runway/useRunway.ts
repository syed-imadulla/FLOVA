import { useCallback, useEffect, useState } from "react";
import { useSession } from "../auth/useSession";
import { todayLocalISO } from "../data/dates";
import { useDataVersion } from "../data/DataVersionProvider";
import { loadRunwayInput } from "../services/data";
import type { RunwayInput } from "../types/contracts";
import { processRunwayFeed, type ProcessedRunway } from "./adapter";

export function useRunway(opts: { horizonDays?: number } = {}) {
  const { user } = useSession();
  const userId = user?.id;
  const { version } = useDataVersion();

  const [rawInput, setRawInput] = useState<RunwayInput | null>(null);
  const [runway, setRunway] = useState<ProcessedRunway | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRunway = useCallback(async () => {
    if (!userId) {
      setRawInput(null);
      setRunway(null);
      setLoading(false);
      setError(null);
      return;
    }

    setRunway((cur) => {
      if (!cur) setLoading(true);
      return cur;
    });
    setError(null);

    try {
      const input = await loadRunwayInput();
      setRawInput(input);
      const processed = processRunwayFeed(input, {
        horizonDays: opts.horizonDays ?? 7,
        startDate: todayLocalISO(),
      });
      setRunway(processed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load runway feed");
    } finally {
      setLoading(false);
    }
  }, [userId, opts.horizonDays]);

  useEffect(() => {
    fetchRunway();
  }, [fetchRunway, version]);

  return {
    loading,
    error,
    runway,
    rawInput,
    reload: fetchRunway,
  };
}
