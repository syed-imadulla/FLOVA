// =====================================================================
// FLOVA 2.0 | Sprint 3B — Structured Intent & Follow-Up Resolver
// Resolves financial intents, categories, periods, and pronoun/context
// references without performing arithmetic or database writes.
// =====================================================================

import type { RelativePeriod } from "../tools/types";
import type { ConversationContextState, ResolvedIntent, SupportedLanguage } from "./conversationTypes";
import { detectLanguage } from "./languageSupport";

const KNOWN_CATEGORIES = [
  "food",
  "transport",
  "fuel",
  "petrol",
  "groceries",
  "rent",
  "bills",
  "utilities",
  "medical",
  "health",
  "shopping",
  "recharge",
  "phone",
  "maintenance",
  "chai",
  "tea",
  "coffee",
  "dinner",
  "lunch",
  "breakfast",
  "snacks",
];

function extractPeriod(lower: string): RelativePeriod | undefined {
  if (/\byesterday\b|\bkal\b|\bninne\b/i.test(lower)) return "yesterday";
  if (/\btoday\b|\baaj\b|\bivattu\b/i.test(lower)) return "today";
  if (/\bthis\s+week\b|\bonly\s+this\s+week\b|\bweekly\b|\bis\s+hafte\b/i.test(lower)) return "this_week";
  if (/\blast\s+month\b|\bpichle\s+mahine\b|\bkaleda\s+tingalu\b/i.test(lower)) return "last_month";
  if (/\bthis\s+month\b|\bmonthly\b|\bis\s+month\b|\bis\s+mahine\b|\bee\s+tingalu\b/i.test(lower)) return "this_month";
  return undefined;
}

function extractCategory(lower: string): string | undefined {
  for (const c of KNOWN_CATEGORIES) {
    if (new RegExp(`\\b${c}\\b`, "i").test(lower)) {
      if (c === "petrol") return "fuel";
      return c;
    }
  }
  return undefined;
}

function extractAmountPaise(text: string): number | undefined {
  const m = text.match(/(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d{1,2})?)/i);
  if (!m) return undefined;
  const num = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(num) && num > 0 ? Math.round(num * 100) : undefined;
}

function resolvePersonMatches(text: string, knownPeople: string[]): string[] {
  const lower = text.toLowerCase();
  const exact = knownPeople.filter((name) => new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text));
  if (exact.length > 0) return exact;

  // Partial first-name / token match (e.g. "Rahul" matching "Rahul S" and "Rahul K")
  const tokens = lower.split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
  const partialMatches = knownPeople.filter((name) => {
    const nameTokens = name.toLowerCase().split(/\s+/);
    return tokens.some((t) => nameTokens.some((nt) => nt === t));
  });
  return Array.from(new Set(partialMatches));
}

export function resolveIntent(
  rawText: string,
  context: ConversationContextState,
  knownPeople: string[],
  knownGroups: string[],
  preferredLang?: SupportedLanguage
): ResolvedIntent {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  const language = detectLanguage(text, preferredLang ?? context.language);
  const period = extractPeriod(lower);
  const category = extractCategory(lower);
  const personMatches = resolvePersonMatches(text, knownPeople);
  const groupMatch = knownGroups.find((g) => lower.includes(g.toLowerCase()));
  const hasPronoun = /\b(he|she|him|her|that\s+person|unki|uska|unhone|avanu|avaru)\b/i.test(lower);

  // 0. Answering a pending person clarification directly
  if (context.pendingClarification?.kind === "person" && personMatches.length === 1) {
    return {
      topic: context.pendingClarification.originalTopic ?? "person_debt",
      personQuery: personMatches[0],
      period,
      isFollowUp: true,
      language,
      confidence: 0.95,
    };
  }

  // 1. Read-only recognition of potential write utterances (NEVER executed in Sprint 3B)
  if (/\b(i\s+earned|earned|got\s+paid|salary\s+credited)\b/i.test(lower) && !/\bhow\s+much\b/i.test(lower)) {
    return {
      topic: "potential_income_draft",
      amountPaise: extractAmountPaise(text),
      isFollowUp: false,
      language,
      confidence: 0.9,
    };
  }
  if (/\b(returned|paid\s+back|gave\s+back)\b/i.test(lower)) {
    const resolvedPerson =
      personMatches.length === 1
        ? personMatches[0]
        : hasPronoun && context.lastPerson
          ? context.lastPerson.name
          : undefined;
    return {
      topic: "potential_repayment_draft",
      personQuery: resolvedPerson,
      personAmbiguousCandidates: personMatches.length > 1 ? personMatches : undefined,
      amountPaise: extractAmountPaise(text),
      isFollowUp: hasPronoun,
      language,
      confidence: 0.9,
    };
  }
  if (/\b(i\s+spent|spent|paid\s+for)\b/i.test(lower) && !/\bhow\s+much\b/i.test(lower) && extractAmountPaise(text) !== undefined) {
    return {
      topic: "potential_expense_draft",
      amountPaise: extractAmountPaise(text),
      category,
      isFollowUp: false,
      language,
      confidence: 0.9,
    };
  }

  // 2. Follow-ups using multi-turn conversation context
  const isExplicitFollowUp =
    /^(what\s+about|how\s+about|and|show\s+me\s+only|only)\b/i.test(lower) ||
    /\bhow\s+much\s+is\s+(?:still\s+)?pending\b/i.test(lower);

  if (isExplicitFollowUp && context.lastTopic) {
    if (/\bpending\b/i.test(lower) && (context.lastPerson || context.lastTopic === "person_debt" || context.lastTopic === "potential_repayment_draft")) {
      return {
        topic: "person_debt",
        personQuery: personMatches.length === 1 ? personMatches[0] : context.lastPerson?.name,
        isFollowUp: true,
        language,
        confidence: 0.92,
      };
    }
    return {
      topic: context.lastTopic,
      period: period ?? context.lastPeriod ?? "this_month",
      category: category ?? context.lastCategory ?? undefined,
      personQuery: personMatches.length === 1 ? personMatches[0] : context.lastPerson?.name,
      groupQuery: groupMatch ?? context.lastGroup?.name,
      isFollowUp: true,
      language,
      confidence: 0.92,
    };
  }

  // 3. People & Debts
  if (/\bwho\s+owes\s+me\b/i.test(lower)) {
    return { topic: "debts_owed_to_me", isFollowUp: false, language, confidence: 0.95 };
  }
  if (/\bwho(?:m)?\s+do\s+i\s+owe\b/i.test(lower)) {
    return { topic: "debts_i_owe", isFollowUp: false, language, confidence: 0.95 };
  }
  if (/\bowe\b|\bpending\b|\bdebt\b/i.test(lower)) {
    if (personMatches.length > 1) {
      return { topic: "person_debt", personAmbiguousCandidates: personMatches, isFollowUp: false, language, confidence: 0.85 };
    }
    if (personMatches.length === 1) {
      return { topic: "person_debt", personQuery: personMatches[0], isFollowUp: false, language, confidence: 0.95 };
    }
    if (hasPronoun) {
      if (context.lastPerson) {
        return { topic: "person_debt", personQuery: context.lastPerson.name, isFollowUp: true, language, confidence: 0.9 };
      }
      return {
        topic: "person_debt",
        personAmbiguousCandidates: knownPeople.slice(0, 5),
        isFollowUp: false,
        language,
        confidence: 0.75,
      };
    }
    return { topic: "debts_owed_to_me", isFollowUp: false, language, confidence: 0.8 };
  }

  // 4. Group Expenses
  if (/\bgroup\b.*\b(balance|expense|split|owe)|shared\s+expense/i.test(lower) || groupMatch) {
    return { topic: "group_balances", groupQuery: groupMatch, isFollowUp: false, language, confidence: 0.9 };
  }

  // 5. Payouts, Commitments & Overdue
  if (/\bpayout\b/i.test(lower)) {
    return { topic: "payouts", isFollowUp: false, language, confidence: 0.95 };
  }
  if (/\boverdue\b/i.test(lower)) {
    return { topic: "overdue", isFollowUp: false, language, confidence: 0.95 };
  }
  if (/\bbills?\b|\bcommitments?\b|\bupcoming\b|\brent\b/i.test(lower)) {
    return { topic: "commitments", isFollowUp: false, language, confidence: 0.9 };
  }

  // 6. Savings & WISH
  if (/\bsav(?:e|ed|ings)\b|\bwish\b|\bgoal\b/i.test(lower)) {
    return { topic: "savings_goals", isFollowUp: false, language, confidence: 0.9 };
  }

  // 7. Balance, Liquidity, Safe-to-Spend & Runway
  if (/\bsafe(?:ly)?\s+(?:to\s+)?spend\b|\bhow\s+much\s+can\s+i\s+spend\s+today\b/i.test(lower)) {
    return { topic: "safe_to_spend", period: "today", isFollowUp: false, language, confidence: 0.95 };
  }
  if (/\bsustainable\s+capital\b/i.test(lower)) {
    return { topic: "sustainable_capital", isFollowUp: false, language, confidence: 0.95 };
  }
  if (/\bliquidity\b|\bavailable\s+cash\b|\bhow\s+much\s+(?:money\s+)?(?:do\s+)?i\s+(?:currently\s+)?have\b|\bbalance\b/i.test(lower)) {
    return { topic: "liquidity", isFollowUp: false, language, confidence: 0.95 };
  }
  if (/\brunway\b/i.test(lower)) {
    return { topic: "runway", isFollowUp: false, language, confidence: 0.95 };
  }

  // 8. Spending & Income
  if (/\bcompare\b/i.test(lower)) {
    return { topic: "spending_comparison", period: period ?? "this_month", isFollowUp: false, language, confidence: 0.9 };
  }
  if (/\bhow\s+much\b.*\bearn|\bincome\b|\bearnings\b/i.test(lower)) {
    return { topic: "income", period: period ?? "this_month", isFollowUp: false, language, confidence: 0.92 };
  }
  if (/\bspen[dt]\b|\bexpense\b|\bkharch\b|\bkharchu\b/i.test(lower) || category) {
    return {
      topic: "spending",
      period: period ?? (context.lastTopic === "spending" && context.lastPeriod ? context.lastPeriod : "this_month"),
      category,
      isFollowUp: Boolean(category && !/\bspen[dt]\b/i.test(lower)),
      language,
      confidence: 0.92,
    };
  }

  return { topic: "unknown", isFollowUp: false, language, confidence: 0.2 };
}
