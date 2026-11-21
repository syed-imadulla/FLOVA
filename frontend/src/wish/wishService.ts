// =====================================================================
// FLOVA WISH — Storage Service
// Cleanly isolated persistence layer.
// Designed to be swapped with a Supabase table in the future without
// any modifications to WISH UI components or contracts.
// =====================================================================

import { supabase } from "../lib/supabase";
import { toPaise } from "../lib/money";
import type { CreateWishInput, Wish } from "./types";

const STORAGE_PREFIX = "flova_wish_v1";

function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}_${userId || "default"}`;
}

function getHistoryKey(userId: string): string {
  return `${STORAGE_PREFIX}_history_${userId || "default"}`;
}

export async function getActiveWish(userId: string): Promise<Wish | null> {
  // 1. Attempt reading from Supabase wish_goals table
  try {
    const { data: dbGoals, error } = await supabase
      .from("wish_goals")
      .select("*, contributions:wish_contributions(*)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!error && dbGoals && dbGoals.length > 0) {
      const g = dbGoals[0];
      const wish: Wish = {
        id: g.id,
        userId: g.user_id,
        name: g.title,
        targetPaise: toPaise(g.target_amount),
        savedPaise: toPaise(g.saved_amount),
        contributionPaise: 0,
        cadence: "weekly",
        notes: null,
        status: g.status === "completed" ? "completed" : "active",
        createdAt: g.created_at,
        updatedAt: g.updated_at,
      };
      // Cache locally
      localStorage.setItem(getStorageKey(userId), JSON.stringify(wish));
      return wish;
    }
  } catch {
    // If network or auth fails, proceed to localStorage check
  }

  // 2. Fall back to localStorage and attempt automatic migration if authenticated
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Wish;
    if (parsed.status === "active") {
      // Attempt background migration to Supabase if authenticated
      if (userId && userId !== "local_user") {
        try {
          const { data: createdGoal } = await supabase
            .from("wish_goals")
            .insert({
              user_id: userId,
              title: parsed.name,
              target_amount: (parsed.targetPaise / 100).toFixed(2),
              saved_amount: (parsed.savedPaise / 100).toFixed(2),
              status: "active",
            })
            .select()
            .single();

          if (createdGoal) {
            parsed.id = createdGoal.id;
            localStorage.setItem(getStorageKey(userId), JSON.stringify(parsed));
          }
        } catch {
          // migration failed quietly, keep local
        }
      }
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveWish(userId: string, input: CreateWishInput): Promise<Wish> {
  const now = new Date().toISOString();
  const targetPaise = Math.max(0, Math.floor(input.targetPaise));
  const savedPaise = Math.max(0, Math.floor(input.initialSavedPaise || 0));

  let wishId = `wish_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Attempt database persistence in Supabase
  if (userId && userId !== "local_user") {
    try {
      const { data: dbGoal, error } = await supabase
        .from("wish_goals")
        .insert({
          user_id: userId,
          title: input.name.trim(),
          target_amount: (targetPaise / 100).toFixed(2),
          saved_amount: (savedPaise / 100).toFixed(2),
          status: "active",
        })
        .select()
        .single();

      if (!error && dbGoal) {
        wishId = dbGoal.id;
      }
    } catch (e) {
      console.warn("Failed to save wish to Supabase, saved to local cache:", e);
    }
  }

  const wish: Wish = {
    id: wishId,
    userId,
    name: input.name.trim(),
    targetPaise,
    savedPaise,
    contributionPaise: Math.max(0, Math.floor(input.contributionPaise || 0)),
    cadence: input.cadence || "weekly",
    imageUrl: input.imageUrl?.trim() || null,
    productUrl: input.productUrl?.trim() || null,
    notes: input.notes?.trim() || null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  localStorage.setItem(getStorageKey(userId), JSON.stringify(wish));
  return wish;
}

export async function updateWish(
  userId: string,
  wishId: string,
  patch: Partial<Omit<Wish, "id" | "userId" | "createdAt">>
): Promise<Wish> {
  const current = await getActiveWish(userId);
  if (!current || current.id !== wishId) {
    throw new Error("Active wish not found");
  }

  const updated: Wish = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  if (userId && userId !== "local_user" && wishId.length > 20) {
    try {
      await supabase
        .from("wish_goals")
        .update({
          title: updated.name,
          target_amount: (updated.targetPaise / 100).toFixed(2),
          status: updated.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wishId);
    } catch {
      // ignore
    }
  }

  localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
  return updated;
}

export async function addSavingsToWish(
  userId: string,
  wishId: string,
  amountPaise: number
): Promise<Wish> {
  const current = await getActiveWish(userId);
  if (!current || current.id !== wishId) {
    throw new Error("Active wish not found");
  }

  const addAmount = Math.max(0, Math.floor(amountPaise));
  const newSaved = current.savedPaise + addAmount;
  const isNowCompleted = newSaved >= current.targetPaise;

  if (userId && userId !== "local_user" && wishId.length > 20) {
    try {
      await supabase.from("wish_contributions").insert({
        goal_id: wishId,
        user_id: userId,
        amount: (addAmount / 100).toFixed(2),
        notes: "Savings contribution",
      });
    } catch (e) {
      console.warn("Failed to record contribution in Supabase:", e);
    }
  }

  const updated: Wish = {
    ...current,
    savedPaise: newSaved,
    status: isNowCompleted ? "completed" : "active",
    completedAt: isNowCompleted ? (current.completedAt || new Date().toISOString()) : null,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
  return updated;
}

export async function markWishPurchased(userId: string, wishId: string): Promise<Wish> {
  const current = await getActiveWish(userId);
  if (!current || current.id !== wishId) {
    throw new Error("Active wish not found");
  }

  if (userId && userId !== "local_user" && wishId.length > 20) {
    try {
      await supabase
        .from("wish_goals")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", wishId);
    } catch {
      // ignore
    }
  }

  const updated: Wish = {
    ...current,
    status: "completed",
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
  return updated;
}

export async function archiveWish(userId: string, wishId: string): Promise<void> {
  const current = await getActiveWish(userId);
  if (current && current.id === wishId) {
    if (userId && userId !== "local_user" && wishId.length > 20) {
      try {
        await supabase
          .from("wish_goals")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", wishId);
      } catch {
        // ignore
      }
    }

    try {
      const historyRaw = localStorage.getItem(getHistoryKey(userId));
      const history: Wish[] = historyRaw ? JSON.parse(historyRaw) : [];
      history.unshift({ ...current, status: "archived", updatedAt: new Date().toISOString() });
      localStorage.setItem(getHistoryKey(userId), JSON.stringify(history.slice(0, 20)));
    } catch {
      // ignore history parse errors
    }
    localStorage.removeItem(getStorageKey(userId));
  }
}

export async function deleteWish(userId: string, wishId: string): Promise<void> {
  const current = await getActiveWish(userId);
  if (current && current.id === wishId) {
    if (userId && userId !== "local_user" && wishId.length > 20) {
      try {
        await supabase.from("wish_goals").delete().eq("id", wishId);
      } catch {
        // ignore
      }
    }
    localStorage.removeItem(getStorageKey(userId));
  }
}
