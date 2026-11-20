import { useCallback, useEffect, useState } from "react";
import { useSession } from "../auth/useSession";
import { addTransaction, deleteTransaction, listTransactions, updateTransaction } from "../services/data";
import type { NewTransaction, Transaction } from "../types/contracts";
import { useDataVersion } from "./DataVersionProvider";

export function useTransactions(opts: { limit?: number } = { limit: 100 }) {
  const { user } = useSession();
  const userId = user?.id;
  const { version, bump } = useDataVersion();

  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
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
      const data = await listTransactions({ limit: opts.limit ?? 100 });
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [userId, opts.limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, version]);

  const add = useCallback(
    async (t: NewTransaction): Promise<Transaction> => {
      try {
        const saved = await addTransaction(t);
        bump();
        return saved;
      } catch (err) {
        throw err;
      }
    },
    [bump]
  );

  const update = useCallback(
    async (id: string, patch: Partial<NewTransaction>): Promise<Transaction> => {
      try {
        const updated = await updateTransaction(id, patch);
        bump();
        return updated;
      } catch (err) {
        throw err;
      }
    },
    [bump]
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteTransaction(id);
        bump();
      } catch (err) {
        throw err;
      }
    },
    [bump]
  );

  return { items, loading, error, add, update, remove, reload: fetchTransactions };
}
