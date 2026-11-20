import { useCallback, useEffect, useState } from "react";
import { useSession } from "../auth/useSession";
import { addCommitment, listCommitments, setCommitmentStatus } from "../services/data";
import type { Commitment, CommitmentStatus, NewCommitment } from "../types/contracts";
import { useDataVersion } from "./DataVersionProvider";

export function useCommitments(filter: CommitmentStatus | "all" = "upcoming") {
  const { user } = useSession();
  const userId = user?.id;
  const { version, bump } = useDataVersion();

  const [items, setItems] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommitments = useCallback(async () => {
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
      const data = await listCommitments(filter);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load commitments");
    } finally {
      setLoading(false);
    }
  }, [userId, filter]);

  useEffect(() => {
    fetchCommitments();
  }, [fetchCommitments, version]);

  const add = useCallback(
    async (c: NewCommitment): Promise<Commitment> => {
      try {
        const saved = await addCommitment(c);
        bump();
        return saved;
      } catch (err) {
        throw err;
      }
    },
    [bump]
  );

  const setStatus = useCallback(
    async (id: string, status: CommitmentStatus): Promise<Commitment> => {
      try {
        const updated = await setCommitmentStatus(id, status);
        bump();
        return updated;
      } catch (err) {
        throw err;
      }
    },
    [bump]
  );

  return { items, loading, error, add, setStatus, reload: fetchCommitments };
}
