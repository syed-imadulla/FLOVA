// =====================================================================
// FLOVA WISH — React Hook
// Connects WISH service to user session with optimistic state updates.
// =====================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "../auth/useSession";
import {
  addSavingsToWish,
  archiveWish,
  deleteWish,
  getActiveWish,
  markWishPurchased,
  saveWish,
  updateWish,
} from "./wishService";
import { calculateWish, type CreateWishInput, type Wish, type WishCalculation } from "./types";

export function useWish() {
  const { user } = useSession();
  const userId = user?.id || "local_user";

  const [wish, setWish] = useState<Wish | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWish = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const active = await getActiveWish(userId);
      setWish(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wish");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWish();
  }, [fetchWish]);

  const calc: WishCalculation | null = useMemo(() => {
    if (!wish) return null;
    return calculateWish(wish);
  }, [wish]);

  const create = useCallback(
    async (input: CreateWishInput): Promise<Wish> => {
      setError(null);
      try {
        const created = await saveWish(userId, input);
        setWish(created);
        return created;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save wish";
        setError(msg);
        throw err;
      }
    },
    [userId]
  );

  const update = useCallback(
    async (patch: Partial<Omit<Wish, "id" | "userId" | "createdAt">>): Promise<Wish> => {
      if (!wish) throw new Error("No active wish");
      setError(null);
      try {
        const updated = await updateWish(userId, wish.id, patch);
        setWish(updated);
        return updated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to update wish";
        setError(msg);
        throw err;
      }
    },
    [userId, wish]
  );

  const addSavings = useCallback(
    async (amountPaise: number): Promise<Wish> => {
      if (!wish) throw new Error("No active wish");
      setError(null);
      try {
        const updated = await addSavingsToWish(userId, wish.id, amountPaise);
        setWish(updated);
        return updated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to add savings";
        setError(msg);
        throw err;
      }
    },
    [userId, wish]
  );

  const markPurchased = useCallback(async (): Promise<Wish> => {
    if (!wish) throw new Error("No active wish");
    setError(null);
    try {
      const updated = await markWishPurchased(userId, wish.id);
      setWish(updated);
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to mark as purchased";
      setError(msg);
      throw err;
    }
  }, [userId, wish]);

  const archive = useCallback(async (): Promise<void> => {
    if (!wish) return;
    setError(null);
    try {
      await archiveWish(userId, wish.id);
      setWish(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to archive wish";
      setError(msg);
      throw err;
    }
  }, [userId, wish]);

  const remove = useCallback(async (): Promise<void> => {
    if (!wish) return;
    setError(null);
    try {
      await deleteWish(userId, wish.id);
      setWish(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete wish";
      setError(msg);
      throw err;
    }
  }, [userId, wish]);

  return {
    wish,
    calc,
    loading,
    error,
    create,
    update,
    addSavings,
    markPurchased,
    archive,
    remove,
    refresh: fetchWish,
  };
}
