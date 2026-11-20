import { useCallback, useEffect, useState } from "react";
import { useSession } from "../auth/useSession";
import { addCheckin, getLatestCheckin } from "../services/data";
import type { BalanceCheckin, NewBalanceCheckin } from "../types/contracts";
import { useDataVersion } from "./DataVersionProvider";

export function useLatestCheckin() {
  const { user } = useSession();
  const userId = user?.id;
  const { version, bump } = useDataVersion();

  const [checkin, setCheckin] = useState<BalanceCheckin | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCheckin = useCallback(async () => {
    if (!userId) {
      setCheckin(null);
      setLoading(false);
      setError(null);
      return;
    }
    // Keep showing current checkin while reloading; only show loading if empty
    setCheckin((cur) => {
      if (!cur) setLoading(true);
      return cur;
    });
    setError(null);
    try {
      const data = await getLatestCheckin();
      setCheckin(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load balance check-in");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCheckin();
  }, [fetchCheckin, version]);

  const add = useCallback(
    async (c: NewBalanceCheckin): Promise<BalanceCheckin> => {
      try {
        const saved = await addCheckin(c);
        setCheckin(saved);
        bump();
        return saved;
      } catch (err) {
        throw err;
      }
    },
    [bump]
  );

  return { checkin, loading, error, add, reload: fetchCheckin };
}
