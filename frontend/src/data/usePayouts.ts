import { useCallback, useEffect, useState } from "react";
import { useSession } from "../auth/useSession";
import { addPayout, listPayouts, receivePayout, setPayoutStatus } from "../services/data";
import type { NewPayout, Payout, PayoutStatus, Transaction } from "../types/contracts";
import { useDataVersion } from "./DataVersionProvider";

export function usePayouts() {
  const { user } = useSession();
  const userId = user?.id;
  const { version, bump } = useDataVersion();

  const [items, setItems] = useState<Payout[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayouts = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    setItems((cur) => {
      if (cur.length === 0) setLoading(true);
      return cur;
    });
    setError(null);
    try {
      const data = await listPayouts();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts, version]);

  const add = useCallback(
    async (p: NewPayout): Promise<Payout> => {
      try {
        const saved = await addPayout(p);
        bump();
        return saved;
      } catch (err) {
        throw err;
      }
    },
    [bump]
  );

  const receive = useCallback(
    async (id: string, amountPaise: number, date?: string): Promise<Transaction> => {
      try {
        const tx = await receivePayout(id, amountPaise, date);
        bump();
        return tx;
      } catch (err) {
        throw err;
      }
    },
    [bump]
  );

  const setStatus = useCallback(
    async (
      id: string,
      status: Extract<PayoutStatus, "scheduled" | "estimated" | "unearned" | "cancelled">
    ): Promise<Payout> => {
      try {
        const updated = await setPayoutStatus(id, status);
        bump();
        return updated;
      } catch (err) {
        throw err;
      }
    },
    [bump]
  );

  return { items, loading, error, add, receive, setStatus, reload: fetchPayouts };
}
