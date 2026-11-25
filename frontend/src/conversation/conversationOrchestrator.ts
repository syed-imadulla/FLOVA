// =====================================================================
// FLOVA 2.0 | Sprint 3B — Central Conversational Orchestrator
// Strictly READ-ONLY: coordinates context, intent, clarification,
// read-only Sprint 3A tool execution, and natural-language response.
// =====================================================================

import { todayLocalISO } from "../data/dates";
import { executeFinancialTool } from "../tools/registry";
import type { FinancialToolDataSource } from "../tools/types";
import type { ISODate } from "../types/contracts";
import { evaluateClarification } from "./clarificationManager";
import {
  DEFAULT_CONTEXT_TTL_MS,
  loadKnownEntities,
  loadUserContext,
  saveUserContext,
  updateContextFromTurn,
} from "./contextManager";
import type { ConversationTurnResult, SupportedLanguage } from "./conversationTypes";
import { resolveIntent } from "./intentResolver";
import { buildToolResponse } from "./responseBuilder";
import { selectReadOnlyTool } from "./toolSelector";

export interface ProcessConversationMessageInput {
  userId: string;
  text: string;
  language?: SupportedLanguage;
  dataSource: FinancialToolDataSource;
  todayISO?: ISODate;
  nowMs?: number;
  ttlMs?: number;
}

export async function processConversationMessage(
  input: ProcessConversationMessageInput
): Promise<ConversationTurnResult> {
  const nowMs = input.nowMs ?? Date.now();
  const ttlMs = input.ttlMs ?? DEFAULT_CONTEXT_TTL_MS;
  const todayISO = input.todayISO ?? todayLocalISO();

  const ctx = loadUserContext(input.userId, input.language ?? "en", nowMs, ttlMs);
  const { peopleNames, groupNames } = await loadKnownEntities(input.dataSource);
  const intent = resolveIntent(input.text, ctx, peopleNames, groupNames, input.language);

  const clarification = evaluateClarification(intent, ctx);
  const isWriteRecognition =
    intent.topic === "potential_income_draft" ||
    intent.topic === "potential_expense_draft" ||
    intent.topic === "potential_repayment_draft";

  if (clarification) {
    const updated = updateContextFromTurn(ctx, intent, null, null, clarification, nowMs, ttlMs);
    saveUserContext(updated);
    return {
      context: updated,
      intent,
      toolSelection: null,
      toolResult: null,
      responseText: clarification.prompt,
      language: intent.language,
      requiresClarification: true,
      clarificationPrompt: clarification.prompt,
      writeOperationBlocked: isWriteRecognition,
    };
  }

  const selection = selectReadOnlyTool(intent, todayISO);
  if (!selection) {
    const fallback =
      "Ask me about your balance, monthly spending, category spending, debts, upcoming payouts, bills, or savings goals.";
    const updated = updateContextFromTurn(ctx, intent, null, null, null, nowMs, ttlMs);
    saveUserContext(updated);
    return {
      context: updated,
      intent,
      toolSelection: null,
      toolResult: null,
      responseText: fallback,
      language: intent.language,
      requiresClarification: false,
      writeOperationBlocked: false,
    };
  }

  const toolResult = await executeFinancialTool(selection.toolName, selection.input, input.dataSource);
  const responseText = buildToolResponse(toolResult, intent);
  const updated = updateContextFromTurn(
    ctx,
    intent,
    selection.toolName,
    { ok: toolResult.ok, hasData: toolResult.hasData },
    null,
    nowMs,
    ttlMs
  );
  saveUserContext(updated);

  return {
    context: updated,
    intent,
    toolSelection: selection,
    toolResult,
    responseText,
    language: intent.language,
    requiresClarification: false,
    writeOperationBlocked: false,
  };
}
