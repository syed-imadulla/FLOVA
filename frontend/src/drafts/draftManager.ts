// =====================================================================
// FLOVA 2.0 | Sprint 3C — Draft Preparation, Clarification & Validation
// Never writes to any database table. Reuses FLOVA's splitEqual/splitCustom.
// =====================================================================

import { todayLocalISO } from "../data/dates";
import { splitCustom, splitEqual, validatePeerDebt } from "../engine";
import type { ExpenseGroup, ExpenseGroupMember, ISODate, Paise, PeerDebt, Person } from "../types/contracts";
import type { DraftMissingField, FinancialDraft } from "./draftTypes";

export const DEFAULT_DRAFT_TTL_MS = 15 * 60 * 1000; // 15 minutes

function makeUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function computeDraftContentHash(draft: Omit<FinancialDraft, "contentHash">): string {
  const payload = JSON.stringify({
    draftId: draft.draftId,
    userId: draft.userId,
    operationType: draft.operationType,
    amountPaise: draft.amountPaise,
    category: draft.category,
    expenseType: draft.expenseType,
    inflowCategory: draft.inflowCategory,
    personRef: draft.personRef,
    groupRef: draft.groupRef,
    debtId: draft.debtId,
    debtDirection: draft.debtDirection,
    settlementDirection: draft.settlementDirection,
    paidBySelf: draft.paidBySelf,
    splitType: draft.splitType,
    groupShares: draft.groupShares,
    date: draft.date,
    description: draft.description,
  });
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `h_${(hash >>> 0).toString(16)}`;
}

function finalizeDraft(base: Omit<FinancialDraft, "contentHash">, peerDebts: PeerDebt[] = [], nowMs: number = Date.now()): FinancialDraft {
  const validated = validateDraft({ ...base, contentHash: "" }, peerDebts, nowMs);
  return {
    ...validated,
    contentHash: computeDraftContentHash(validated),
  };
}

export function validateDraft(
  draft: FinancialDraft,
  peerDebts: PeerDebt[] = [],
  nowMs: number = Date.now()
): FinancialDraft {
  if (draft.validationStatus === "confirmed" || draft.validationStatus === "cancelled") {
    return draft;
  }
  if (nowMs >= draft.expiresAt) {
    return {
      ...draft,
      validationStatus: "expired",
      validationErrors: ["This draft has expired. Please start a new entry."],
    };
  }

  const missing: DraftMissingField[] = [];
  const errors: string[] = [];

  if (draft.amountPaise === null || !Number.isSafeInteger(draft.amountPaise) || draft.amountPaise <= 0) {
    missing.push("amount");
    errors.push("Amount must be a positive integer in paise.");
  }

  if (draft.operationType === "expense") {
    if (!draft.category) missing.push("category");
    if (!draft.expenseType) missing.push("expenseType");
  }

  if (draft.operationType === "income") {
    if (!draft.inflowCategory || draft.description === "__missing_source__") {
      missing.push("inflowSource");
    }
  }

  if (draft.operationType === "peer_debt") {
    if (!draft.personRef?.name) missing.push("person");
    if (draft.amountPaise && draft.personRef?.id && draft.debtDirection) {
      const check = validatePeerDebt({
        id: draft.draftId,
        personId: draft.personRef.id,
        direction: draft.debtDirection,
        totalAmountPaise: draft.amountPaise,
        remainingAmountPaise: draft.amountPaise,
        status: "active",
        dueDate: null,
        createdAt: new Date(draft.createdAt).toISOString(),
      });
      if (!check.valid) errors.push(...check.errors);
    }
  }

  if (draft.operationType === "debt_settlement") {
    if (!draft.personRef?.name) missing.push("person");
    if (!draft.debtId) {
      missing.push("debt");
      errors.push("No matching active debt found for this person.");
    } else if (draft.amountPaise !== null) {
      const debt = peerDebts.find((d) => d.id === draft.debtId);
      if (debt && draft.amountPaise > debt.remaining_amount_paise) {
        errors.push(`Settlement amount exceeds remaining debt (${debt.remaining_amount_paise} paise).`);
      }
    }
  }

  if (draft.operationType === "group_expense") {
    if (!draft.groupRef?.id) missing.push("group");
    if (draft.paidBySelf === undefined) missing.push("payer");
    const included = (draft.groupShares ?? []).filter((s) => s.included);
    if (draft.amountPaise && included.length > 0) {
      try {
        splitCustom(
          draft.amountPaise,
          included.map((s) => ({ isSelf: s.isSelf, personId: s.personId, shareAmountPaise: s.shareAmountPaise }))
        );
      } catch (err) {
        missing.push("splitShares");
        errors.push(err instanceof Error ? err.message : "Invalid group split shares.");
      }
    } else {
      missing.push("splitShares");
    }
  }

  const validationStatus = errors.length > 0 && missing.length === 0 ? "invalid" : missing.length > 0 ? "incomplete" : "valid";
  return {
    ...draft,
    missingFields: missing,
    validationErrors: errors,
    validationStatus,
  };
}

function parseAmountPaise(text: string): Paise | null {
  const m = text.match(/(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d{1,2})?)/i);
  if (!m) return null;
  const num = Number(m[1].replace(/,/g, ""));
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num * 100);
}

function inferExpenseCategory(lower: string): { category: string | null; expenseType: "living" | "work" | null } {
  if (/\b(fuel|petrol|diesel|cng|maintenance|repair)\b/i.test(lower)) return { category: "fuel", expenseType: "work" };
  if (/\b(recharge|phone\s+bill)\b/i.test(lower)) return { category: "phone", expenseType: "work" };
  if (/\b(food|lunch|dinner|breakfast|chai|tea|coffee|snacks)\b/i.test(lower)) return { category: "food", expenseType: "living" };
  if (/\b(groceries|ration|vegetables|milk)\b/i.test(lower)) return { category: "groceries", expenseType: "living" };
  if (/\b(rent|electricity|water|bill)\b/i.test(lower)) return { category: "bills", expenseType: "living" };
  return { category: null, expenseType: null };
}

export interface PrepareDraftInput {
  userId: string;
  conversationSessionId: string;
  utterance: string;
  activeDraft?: FinancialDraft | null;
  people: Person[];
  peerDebts: PeerDebt[];
  groups: ExpenseGroup[];
  groupMembers: ExpenseGroupMember[];
  todayISO?: ISODate;
  nowMs?: number;
  ttlMs?: number;
}

export interface PrepareDraftOutcome {
  draft: FinancialDraft | null;
  clarificationQuestion: string | null;
}

export function prepareDraftFromUtterance(input: PrepareDraftInput): PrepareDraftOutcome {
  const nowMs = input.nowMs ?? Date.now();
  const ttlMs = input.ttlMs ?? DEFAULT_DRAFT_TTL_MS;
  const todayISO = input.todayISO ?? todayLocalISO();
  const text = input.utterance.trim();
  const lower = text.toLowerCase();

  // 1. Continue clarifying an active incomplete draft
  if (input.activeDraft && input.activeDraft.validationStatus === "incomplete" && nowMs < input.activeDraft.expiresAt) {
    const prev = input.activeDraft;
    if (prev.operationType === "income" && prev.missingFields.includes("inflowSource")) {
      const inflowCategory = /pocket\s*money|allowance/i.test(lower)
        ? "pocket_money"
        : /family|mom|dad/i.test(lower)
          ? "family_support"
          : /gift/i.test(lower)
            ? "gift"
            : "earned";
      const updated = finalizeDraft({ ...prev, inflowCategory, description: text }, input.peerDebts, nowMs);
      return { draft: updated, clarificationQuestion: updated.missingFields.length > 0 ? "Please provide the missing details." : null };
    }
    if (prev.operationType === "expense" && prev.missingFields.includes("category")) {
      const inferred = inferExpenseCategory(lower);
      const updated = finalizeDraft(
        {
          ...prev,
          category: inferred.category ?? text.toLowerCase().slice(0, 24),
          expenseType: inferred.expenseType ?? prev.expenseType ?? "living",
          description: `${prev.description} (${text})`,
        },
        input.peerDebts,
        nowMs
      );
      return { draft: updated, clarificationQuestion: null };
    }
    if (prev.operationType === "group_expense") {
      let next = { ...prev };
      if (/\bi\s+paid|paid\s+the\s+full\s+amount/i.test(lower)) {
        next.paidBySelf = true;
        next.paidByPersonId = null;
      }
      if (/\bsplit.*equally|equal/i.test(lower)) {
        next.splitType = "equal";
        const countMatch = lower.match(/\b(two|three|four|five|2|3|4|5)\s+people/i);
        const wordToNum: Record<string, number> = { two: 2, three: 3, four: 4, five: 5 };
        const count = countMatch ? (wordToNum[countMatch[1]] ?? Number(countMatch[1])) : (next.groupShares?.length || 2);
        if ((!next.groupShares || next.groupShares.length === 0) && count > 0) {
          next.groupShares = Array.from({ length: count }, (_, idx) => ({
            isSelf: idx === 0,
            personId: idx === 0 ? null : `guest-${idx}`,
            name: idx === 0 ? "You" : `Member ${idx + 1}`,
            shareAmountPaise: 0,
            included: true,
          }));
        }
        if (next.amountPaise && next.groupShares && next.groupShares.length > 0) {
          const eq = splitEqual(
            next.amountPaise,
            next.groupShares.map((s) => ({ isSelf: s.isSelf, personId: s.personId }))
          );
          next.groupShares = next.groupShares.map((s, idx) => ({ ...s, shareAmountPaise: eq[idx].shareAmountPaise }));
        }
      }
      const grp = input.groups.find((g) => lower.includes(g.name.toLowerCase()));
      if (grp) {
        next.groupRef = { id: grp.id, name: grp.name };
      }
      const updated = finalizeDraft(next, input.peerDebts, nowMs);
      const q =
        updated.missingFields.includes("group")
          ? "Which group was this for?"
          : updated.missingFields.includes("payer")
            ? "Who paid the bill?"
            : updated.missingFields.includes("splitShares")
              ? "How should we split it?"
              : null;
      return { draft: updated, clarificationQuestion: q };
    }
  }

  const amountPaise = parseAmountPaise(text);
  const draftId = makeUuid();
  const baseCommon = {
    draftId,
    userId: input.userId,
    conversationSessionId: input.conversationSessionId,
    date: todayISO,
    description: text,
    missingFields: [] as DraftMissingField[],
    validationErrors: [] as string[],
    validationStatus: "incomplete" as const,
    createdAt: nowMs,
    expiresAt: nowMs + ttlMs,
    idempotencyKey: makeUuid(),
  };

  // 2. Group expense ("We spent ₹1,200 on dinner")
  if (/\bwe\s+spent\b|\bsplit\b|\bgroup\s+expense\b/i.test(lower)) {
    const grp = input.groups[0];
    const members = grp ? input.groupMembers.filter((m) => m.group_id === grp.id) : [];
    const personMap = new Map(input.people.map((p) => [p.id, p.name]));
    const shares = members.map((m) => ({
      isSelf: m.is_self,
      personId: m.person_id,
      name: m.is_self ? "You" : (m.person_id ? personMap.get(m.person_id) ?? "Member" : "Member"),
      shareAmountPaise: 0,
      included: true,
    }));
    const draft = finalizeDraft(
      {
        ...baseCommon,
        operationType: "group_expense",
        amountPaise,
        category: "food",
        expenseType: null,
        inflowCategory: null,
        personRef: null,
        groupRef: grp ? { id: grp.id, name: grp.name } : null,
        paidBySelf: /\bi\s+paid\b/i.test(lower) ? true : undefined,
        paidByPersonId: null,
        splitType: /\bequal/i.test(lower) ? "equal" : undefined,
        groupShares: shares,
      },
      input.peerDebts,
      nowMs
    );
    const q = draft.missingFields.includes("group")
      ? "Which group was this for?"
      : draft.missingFields.includes("payer")
        ? "Who paid the full amount?"
        : draft.missingFields.includes("splitShares")
          ? "Should we split it equally?"
          : null;
    return { draft, clarificationQuestion: q };
  }

  // 3. Peer debt settlement ("Ahmed returned ₹200", "I repaid ₹300 to Safiya")
  if (/\b(returned|repaid|paid\s+back)\b/i.test(lower)) {
    const person = input.people.find((p) => lower.includes(p.name.toLowerCase()));
    const isOut = /\bi\s+repaid\b|\brepaid\b.*\bto\b/i.test(lower);
    const expectedDir = isOut ? "you_owe" : "they_owe";
    const matchingDebt = person
      ? input.peerDebts.find((d) => d.person_id === person.id && d.direction === expectedDir && d.status !== "settled")
      : undefined;
    const settlementKind =
      matchingDebt && amountPaise !== null && amountPaise === matchingDebt.remaining_amount_paise
        ? "full"
        : "partial";

    const draft = finalizeDraft(
      {
        ...baseCommon,
        operationType: "debt_settlement",
        amountPaise,
        category: null,
        expenseType: null,
        inflowCategory: null,
        personRef: person ? { id: person.id, name: person.name } : null,
        groupRef: null,
        debtId: matchingDebt?.id,
        settlementDirection: isOut ? "repayment_out" : "repayment_in",
        settlementKind,
      },
      input.peerDebts,
      nowMs
    );
    const q = !person
      ? "Which person is this repayment for?"
      : !matchingDebt
        ? `No active ${expectedDir === "they_owe" ? "receivable" : "payable"} debt found for ${person.name}.`
        : draft.validationErrors[0] ?? null;
    return { draft, clarificationQuestion: q };
  }

  // 4. Peer debt creation ("I lent Ahmed ₹1,000", "I borrowed ₹500 from Rahul")
  if (/\b(lent|lend|borrowed|borrow)\b/i.test(lower)) {
    const isBorrow = /\b(borrowed|borrow)\b/i.test(lower);
    const person = input.people.find((p) => lower.includes(p.name.toLowerCase()));
    const draft = finalizeDraft(
      {
        ...baseCommon,
        operationType: "peer_debt",
        amountPaise,
        category: null,
        expenseType: null,
        inflowCategory: null,
        personRef: person ? { id: person.id, name: person.name } : null,
        groupRef: null,
        debtDirection: isBorrow ? "you_owe" : "they_owe",
      },
      input.peerDebts,
      nowMs
    );
    return {
      draft,
      clarificationQuestion: !person ? "Who is the other person for this loan?" : draft.missingFields.includes("amount") ? "What was the amount?" : null,
    };
  }

  // 5. Income ("I earned ₹500", "Salary received ₹15,000", "I got ₹300 from delivery work")
  if (/\b(earned|salary|got\s+₹?\d+|received\s+₹?\d+)\b/i.test(lower)) {
    const hasSource = /\b(salary|delivery|freelanc|bonus|tip|gift|pocket\s*money|family)\b/i.test(lower);
    const draft = finalizeDraft(
      {
        ...baseCommon,
        operationType: "income",
        amountPaise,
        category: "earnings",
        expenseType: null,
        inflowCategory: /gift/.test(lower) ? "gift" : /pocket\s*money/.test(lower) ? "pocket_money" : "earned",
        personRef: null,
        groupRef: null,
        description: hasSource ? text : "__missing_source__",
      },
      input.peerDebts,
      nowMs
    );
    return {
      draft,
      clarificationQuestion: draft.missingFields.includes("inflowSource")
        ? "Yeh income kis source se aayi? (e.g. delivery work, salary, freelancing)"
        : draft.missingFields.includes("amount")
          ? "How much did you receive?"
          : null,
    };
  }

  // 6. Expense ("Spent ₹150 on food", "I paid ₹500 for fuel", "Spent ₹150")
  if (/\b(spent|paid|bought)\b/i.test(lower)) {
    const inferred = inferExpenseCategory(lower);
    const draft = finalizeDraft(
      {
        ...baseCommon,
        operationType: "expense",
        amountPaise,
        category: inferred.category,
        expenseType: inferred.expenseType,
        inflowCategory: null,
        personRef: null,
        groupRef: null,
      },
      input.peerDebts,
      nowMs
    );
    return {
      draft,
      clarificationQuestion: draft.missingFields.includes("category")
        ? "What was this expense for? (e.g. food, fuel, groceries)"
        : draft.missingFields.includes("amount")
          ? "How much did you spend?"
          : null,
    };
  }

  return { draft: null, clarificationQuestion: null };
}

export function updateDraft(
  draft: FinancialDraft,
  patch: Partial<Pick<FinancialDraft, "amountPaise" | "category" | "expenseType" | "inflowCategory" | "description" | "date">>,
  peerDebts: PeerDebt[] = [],
  nowMs: number = Date.now()
): FinancialDraft {
  return finalizeDraft({ ...draft, ...patch }, peerDebts, nowMs);
}

export function cancelDraft(draft: FinancialDraft): FinancialDraft {
  return {
    ...draft,
    validationStatus: "cancelled",
  };
}
