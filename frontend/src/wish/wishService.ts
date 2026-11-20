// =====================================================================
// FLOVA WISH — Storage Service
// Cleanly isolated persistence layer.
// Designed to be swapped with a Supabase table in the future without
// any modifications to WISH UI components or contracts.
// =====================================================================

import type { CreateWishInput, Wish } from "./types";

const STORAGE_PREFIX = "flova_wish_v1";

function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}_${userId || "default"}`;
}

function getHistoryKey(userId: string): string {
  return `${STORAGE_PREFIX}_history_${userId || "default"}`;
}

export async function getActiveWish(userId: string): Promise<Wish | null> {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Wish;
    if (parsed.status === "active") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveWish(userId: string, input: CreateWishInput): Promise<Wish> {
  const now = new Date().toISOString();
  const wish: Wish = {
    id: `wish_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    name: input.name.trim(),
    targetPaise: Math.max(0, Math.floor(input.targetPaise)),
    savedPaise: Math.max(0, Math.floor(input.initialSavedPaise || 0)),
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
    // Archive into history list
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
    localStorage.removeItem(getStorageKey(userId));
  }
}
