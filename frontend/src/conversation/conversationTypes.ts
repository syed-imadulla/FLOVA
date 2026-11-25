// =====================================================================
// FLOVA 2.0 | Sprint 3B — Conversational Intelligence Types
// Strictly READ-ONLY orchestration contracts. Zero DB writes.
// =====================================================================

import type { ISODate } from "../types/contracts";
import type { RelativePeriod, ToolResult } from "../tools/types";

export type SupportedLanguage =
  | "en"
  | "hi"
  | "kn"
  | "te"
  | "ta"
  | "ml"
  | "bn"
  | "mr"
  | "gu"
  | "pa"
  | "or";

export type FinancialTopic =
  | "balance"
  | "liquidity"
  | "sustainable_capital"
  | "safe_to_spend"
  | "runway"
  | "spending"
  | "income"
  | "spending_comparison"
  | "debts_owed_to_me"
  | "debts_i_owe"
  | "person_debt"
  | "group_balances"
  | "payouts"
  | "commitments"
  | "overdue"
  | "savings_goals"
  | "potential_income_draft"
  | "potential_expense_draft"
  | "potential_repayment_draft"
  | "unknown";

export interface PendingClarification {
  kind: "person" | "period" | "income_source" | "expense_type";
  prompt: string;
  candidates?: string[];
  originalTopic?: FinancialTopic;
}

export interface ConversationContextState {
  sessionId: string;
  userId: string;
  language: SupportedLanguage;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  lastTopic: FinancialTopic | null;
  lastPeriod: RelativePeriod | null;
  lastFromDate?: ISODate;
  lastToDate?: ISODate;
  lastCategory: string | null;
  lastPerson: { id?: string; name: string } | null;
  lastGroup: { id?: string; name: string } | null;
  lastToolName: string | null;
  lastToolSummary: { ok: boolean; hasData: boolean } | null;
  pendingClarification: PendingClarification | null;
}

export interface ResolvedIntent {
  topic: FinancialTopic;
  period?: RelativePeriod;
  fromDate?: ISODate;
  toDate?: ISODate;
  category?: string;
  personQuery?: string;
  personAmbiguousCandidates?: string[];
  groupQuery?: string;
  amountPaise?: number;
  isFollowUp: boolean;
  language: SupportedLanguage;
  confidence: number;
}

export interface ToolSelection {
  toolName: string;
  input: Record<string, unknown>;
  access: "read_only";
}

export interface ConversationTurnResult {
  context: ConversationContextState;
  intent: ResolvedIntent;
  toolSelection: ToolSelection | null;
  toolResult: ToolResult<unknown> | null;
  responseText: string;
  language: SupportedLanguage;
  requiresClarification: boolean;
  clarificationPrompt?: string;
  writeOperationBlocked: boolean;
}
