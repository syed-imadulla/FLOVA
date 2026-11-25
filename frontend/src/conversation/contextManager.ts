// =====================================================================
// FLOVA 2.0 | Sprint 3B — User-Scoped Conversation Context Manager
// Enforces user isolation, session expiration, and minimal state storage.
// =====================================================================

import type { FinancialToolDataSource } from "../tools/types";
import type {
  ConversationContextState,
  FinancialTopic,
  PendingClarification,
  ResolvedIntent,
  SupportedLanguage,
} from "./conversationTypes";

export const DEFAULT_CONTEXT_TTL_MS = 30 * 60 * 1000; // 30 minutes

const memoryStore = new Map<string, ConversationContextState>();

function makeSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function storageKey(userId: string): string {
  return `flova.conv.v1.${userId}`;
}

export function createConversationContext(
  userId: string,
  language: SupportedLanguage = "en",
  nowMs: number = Date.now(),
  ttlMs: number = DEFAULT_CONTEXT_TTL_MS
): ConversationContextState {
  return {
    sessionId: makeSessionId(),
    userId,
    language,
    createdAt: nowMs,
    updatedAt: nowMs,
    expiresAt: nowMs + ttlMs,
    lastTopic: null,
    lastPeriod: null,
    lastCategory: null,
    lastPerson: null,
    lastGroup: null,
    lastToolName: null,
    lastToolSummary: null,
    pendingClarification: null,
  };
}

export function isContextExpired(ctx: ConversationContextState, nowMs: number = Date.now()): boolean {
  return nowMs >= ctx.expiresAt;
}

export function loadUserContext(
  userId: string,
  defaultLang: SupportedLanguage = "en",
  nowMs: number = Date.now(),
  ttlMs: number = DEFAULT_CONTEXT_TTL_MS
): ConversationContextState {
  if (!userId || !userId.trim()) {
    throw new Error("Authenticated userId is required for conversation context.");
  }

  const mem = memoryStore.get(userId);
  if (mem && mem.userId === userId && !isContextExpired(mem, nowMs)) {
    return mem;
  }

  if (typeof sessionStorage !== "undefined") {
    try {
      const raw = sessionStorage.getItem(storageKey(userId));
      if (raw) {
        const parsed = JSON.parse(raw) as ConversationContextState;
        if (parsed && parsed.userId === userId && !isContextExpired(parsed, nowMs)) {
          memoryStore.set(userId, parsed);
          return parsed;
        }
      }
    } catch {
      // ignore corrupted storage
    }
  }

  const fresh = createConversationContext(userId, defaultLang, nowMs, ttlMs);
  saveUserContext(fresh);
  return fresh;
}

export function saveUserContext(ctx: ConversationContextState): void {
  if (!ctx.userId) return;
  memoryStore.set(ctx.userId, ctx);
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.setItem(storageKey(ctx.userId), JSON.stringify(ctx));
    } catch {
      // ignore quota errors
    }
  }
}

export function clearUserContext(userId: string): void {
  memoryStore.delete(userId);
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(storageKey(userId));
    } catch {
      // ignore
    }
  }
}

export function updateContextFromTurn(
  prev: ConversationContextState,
  intent: ResolvedIntent,
  toolName: string | null,
  toolSummary: { ok: boolean; hasData: boolean } | null,
  pendingClarification: PendingClarification | null,
  nowMs: number = Date.now(),
  ttlMs: number = DEFAULT_CONTEXT_TTL_MS
): ConversationContextState {
  const isSubjectChange =
    intent.topic !== "unknown" &&
    prev.lastTopic !== null &&
    intent.topic !== prev.lastTopic &&
    !intent.isFollowUp;

  const nextTopic: FinancialTopic | null =
    intent.topic !== "unknown" ? intent.topic : prev.lastTopic;

  return {
    ...prev,
    language: intent.language,
    updatedAt: nowMs,
    expiresAt: nowMs + ttlMs,
    lastTopic: nextTopic,
    lastPeriod: intent.period ?? (isSubjectChange ? null : prev.lastPeriod),
    lastFromDate: intent.fromDate ?? (intent.period ? undefined : isSubjectChange ? undefined : prev.lastFromDate),
    lastToDate: intent.toDate ?? (intent.period ? undefined : isSubjectChange ? undefined : prev.lastToDate),
    lastCategory: intent.category ?? (isSubjectChange ? null : prev.lastCategory),
    lastPerson: intent.personQuery ? { name: intent.personQuery } : isSubjectChange ? null : prev.lastPerson,
    lastGroup: intent.groupQuery ? { name: intent.groupQuery } : isSubjectChange ? null : prev.lastGroup,
    lastToolName: toolName ?? prev.lastToolName,
    lastToolSummary: toolSummary ?? prev.lastToolSummary,
    pendingClarification,
  };
}

export async function loadKnownEntities(
  ds: FinancialToolDataSource
): Promise<{ peopleNames: string[]; groupNames: string[] }> {
  try {
    const [people, groups] = await Promise.all([
      ds.listPeople().catch(() => []),
      ds.listExpenseGroups().catch(() => []),
    ]);
    return {
      peopleNames: people.filter((p) => !p.user_id || p.user_id === ds.userId).map((p) => p.name),
      groupNames: groups.filter((g) => !g.user_id || g.user_id === ds.userId).map((g) => g.name),
    };
  } catch {
    return { peopleNames: [], groupNames: [] };
  }
}
