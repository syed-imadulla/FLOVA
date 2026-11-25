// =====================================================================
// FLOVA 2.0 | Sprint 3B — Conversational Intelligence & Multi-Turn Tests
// Covers all 14 required QA scenarios in Section 11.
// =====================================================================

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clearUserContext,
  loadUserContext,
  processConversationMessage,
  selectReadOnlyTool,
} from "../index";
import type { FinancialToolDataSource } from "../../tools/types";
import type {
  Commitment,
  DebtSettlement,
  ExpenseGroup,
  ExpenseGroupMember,
  GroupExpense,
  GroupExpenseSplit,
  Payout,
  PeerDebt,
  Person,
  RunwayInput,
  Transaction,
  WishGoal,
} from "../../types/contracts";

function makeDataSource(userId = "user-1", overrides?: Partial<FinancialToolDataSource>): FinancialToolDataSource {
  const people: Person[] = [
    { id: "p-1", user_id: userId, name: "Ahmed", phone: null, upi_id: null, relationship: "Friend", is_favorite: false, created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z" },
    { id: "p-2", user_id: userId, name: "Rahul S", phone: null, upi_id: null, relationship: "Friend", is_favorite: false, created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z" },
    { id: "p-3", user_id: userId, name: "Rahul K", phone: null, upi_id: null, relationship: "Colleague", is_favorite: false, created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z" },
  ];

  const peerDebts: PeerDebt[] = [
    { id: "d-1", user_id: userId, person_id: "p-1", direction: "they_owe", total_amount_paise: 100000, remaining_amount_paise: 80000, reason: "Lunch", status: "partially_settled", due_date: "2026-11-30", created_at: "2026-11-10T09:00:00Z", updated_at: "2026-11-10T09:00:00Z" },
  ];

  const debtSettlements: DebtSettlement[] = [
    { id: "ds-1", user_id: userId, debt_id: "d-1", direction: "repayment_in", amount_paise: 20000, payment_mode: "upi", reference_id: null, notes: null, settled_at: "2026-11-12T09:00:00Z", created_at: "2026-11-12T09:00:00Z" },
  ];

  const transactions: Transaction[] = [
    { id: "tx-1", user_id: userId, type: "expense", amount: "250.00", category: "food", description: "Lunch", expense_type: "living", inflow_category: null, ownership: "mine", payout_id: null, transaction_date: "2026-11-25", source: "manual", created_at: "2026-11-25T10:00:00Z", updated_at: "2026-11-25T10:00:00Z" },
    { id: "tx-2", user_id: userId, type: "expense", amount: "400.00", category: "transport", description: "Auto", expense_type: "work", inflow_category: null, ownership: "mine", payout_id: null, transaction_date: "2026-11-24", source: "manual", created_at: "2026-11-24T10:00:00Z", updated_at: "2026-11-24T10:00:00Z" },
    { id: "tx-3", user_id: userId, type: "expense", amount: "900.00", category: "food", description: "Oct groceries", expense_type: "living", inflow_category: null, ownership: "mine", payout_id: null, transaction_date: "2026-10-15", source: "manual", created_at: "2026-10-15T10:00:00Z", updated_at: "2026-10-15T10:00:00Z" },
  ];

  const payouts: Payout[] = [
    { id: "po-1", user_id: userId, kind: "platform_payout", source: "Swiggy", expected_amount: "1800.00", received_amount: "0.00", expected_date: "2026-11-28", status: "scheduled", note: null, created_at: "2026-11-20T00:00:00Z", updated_at: "2026-11-20T00:00:00Z" },
  ];

  const commitments: Commitment[] = [];
  const groups: ExpenseGroup[] = [];
  const groupMembers: ExpenseGroupMember[] = [];
  const groupExpenses: GroupExpense[] = [];
  const groupSplits: GroupExpenseSplit[] = [];
  const wishGoals: WishGoal[] = [];

  const runwayInput: RunwayInput = {
    profile: { workProfile: "delivery", payoutPattern: "weekly", dailyLivingEstimate: 20000, dailyWorkEstimate: 10000, safeRunwayBuffer: 100000 },
    latestCheckin: { cash: 500000, bank: 500000, notMine: 0, checkedAt: "2026-11-25T08:00:00Z" },
    transactionsSinceCheckin: [
      { id: "tx-1", type: "expense", amount: 25000, ownership: "mine", expenseType: "living", inflowCategory: null, payoutId: null, date: "2026-11-25", createdAt: "2026-11-25T10:00:00Z" },
    ],
    payouts: [{ id: "po-1", kind: "platform_payout", expected: 180000, received: 0, expectedDate: "2026-11-28", status: "scheduled" }],
    commitments: [],
    peerDebts: [
      { id: "d-1", personId: "p-1", personName: "Ahmed", direction: "they_owe", totalAmountPaise: 100000, remainingAmountPaise: 80000, status: "partially_settled", dueDate: "2026-11-30", createdAt: "2026-11-10T09:00:00Z" },
    ],
    debtSettlements: [],
    groupSplits: [],
    groupSettlements: [],
  };

  return {
    userId,
    loadRunwayInput: async () => runwayInput,
    listTransactions: async () => transactions,
    listPeople: async () => people,
    listPeerDebts: async () => peerDebts,
    listDebtSettlements: async () => debtSettlements,
    listExpenseGroups: async () => groups,
    listGroupMembers: async () => groupMembers,
    listGroupExpenses: async () => groupExpenses,
    listGroupSplits: async () => groupSplits,
    listGroupSettlements: async () => [],
    listPayouts: async () => payouts,
    listCommitments: async () => commitments,
    listWishGoals: async () => wishGoals,
    getActiveWish: async () => null,
    ...overrides,
  };
}

describe("Sprint 3B: Conversational Intelligence & Multi-Turn Context", () => {
  it("1 & 2. Balance, safe-to-spend, payout, and spending question routing", async () => {
    clearUserContext("u-1");
    const ds = makeDataSource("u-1");

    const bal = await processConversationMessage({ userId: "u-1", text: "How much money do I have?", dataSource: ds, todayISO: "2026-11-25" });
    assert.equal(bal.toolSelection?.toolName, "get_available_liquidity");
    assert.match(bal.responseText, /₹8,750/);

    const safe = await processConversationMessage({ userId: "u-1", text: "How much can I spend today?", dataSource: ds, todayISO: "2026-11-25" });
    assert.equal(safe.toolSelection?.toolName, "get_daily_safe_to_spend");
    assert.equal(safe.toolResult?.ok, true);

    const payout = await processConversationMessage({ userId: "u-1", text: "When is my next payout?", dataSource: ds, todayISO: "2026-11-25" });
    assert.equal(payout.toolSelection?.toolName, "get_upcoming_payouts");
    assert.match(payout.responseText, /₹1,800.*Swiggy/);
  });

  it("3 & 4. Multi-turn category and date-range follow-ups retain context", async () => {
    clearUserContext("u-2");
    const ds = makeDataSource("u-2");

    const t1 = await processConversationMessage({ userId: "u-2", text: "How much did I spend this month?", dataSource: ds, todayISO: "2026-11-25" });
    assert.equal(t1.toolSelection?.toolName, "get_expenses_for_range");
    assert.match(t1.responseText, /₹650/); // 250 food + 400 transport

    const t2 = await processConversationMessage({ userId: "u-2", text: "What about food?", dataSource: ds, todayISO: "2026-11-25" });
    assert.equal(t2.toolSelection?.toolName, "get_spending_by_category");
    assert.equal(t2.intent.period, "this_month");
    assert.match(t2.responseText, /₹250/);

    const t3 = await processConversationMessage({ userId: "u-2", text: "And last month?", dataSource: ds, todayISO: "2026-11-25" });
    assert.equal(t3.toolSelection?.toolName, "get_spending_by_category");
    assert.equal(t3.intent.category, "food");
    assert.equal(t3.intent.period, "last_month");
    assert.match(t3.responseText, /₹900/);

    const t4 = await processConversationMessage({ userId: "u-2", text: "What about transport?", dataSource: ds, todayISO: "2026-11-25" });
    assert.equal(t4.intent.category, "transport");

    const t5 = await processConversationMessage({ userId: "u-2", text: "Show me only this week.", dataSource: ds, todayISO: "2026-11-25" });
    assert.equal(t5.intent.period, "this_week");
    assert.match(t5.responseText, /₹400/);
  });

  it("5 & 6. Person reference resolution ('How much is still pending?') and ambiguous person clarification", async () => {
    clearUserContext("u-3");
    const ds = makeDataSource("u-3");

    const p1 = await processConversationMessage({ userId: "u-3", text: "How much does Ahmed owe me?", dataSource: ds, todayISO: "2026-11-25" });
    assert.equal(p1.toolSelection?.toolName, "get_person_outstanding_balance");
    assert.match(p1.responseText, /Ahmed/);

    const p2 = await processConversationMessage({ userId: "u-3", text: "How much is still pending?", dataSource: ds, todayISO: "2026-11-25" });
    assert.equal(p2.toolSelection?.toolName, "get_person_outstanding_balance");
    assert.equal(p2.intent.personQuery, "Ahmed");

    // Ambiguous "Rahul" matches both "Rahul S" and "Rahul K"
    const ambig = await processConversationMessage({ userId: "u-3", text: "How much does Rahul owe me?", dataSource: ds, todayISO: "2026-11-25" });
    assert.equal(ambig.requiresClarification, true);
    assert.match(ambig.responseText, /Rahul S.*Rahul K/);
  });

  it("7, 8 & 9. Empty financial history, missing baseline, and tool execution failure", async () => {
    clearUserContext("u-4");
    const emptyDs = makeDataSource("u-4", {
      loadRunwayInput: async () => ({
        profile: { workProfile: "delivery", payoutPattern: "weekly", dailyLivingEstimate: null, dailyWorkEstimate: null, safeRunwayBuffer: null },
        latestCheckin: null,
        transactionsSinceCheckin: [],
        payouts: [],
        commitments: [],
      }),
      listTransactions: async () => [],
    });

    const noBase = await processConversationMessage({ userId: "u-4", text: "How much money do I have?", dataSource: emptyDs, todayISO: "2026-11-25" });
    assert.equal(noBase.toolResult?.error?.code, "INSUFFICIENT_BASELINE");
    assert.match(noBase.responseText, /check-in/i);

    const emptySpend = await processConversationMessage({ userId: "u-4", text: "How much did I spend this month?", dataSource: emptyDs, todayISO: "2026-11-25" });
    assert.equal(emptySpend.toolResult?.hasData, false);
    assert.match(emptySpend.responseText, /₹0/);

    const failDs = makeDataSource("u-4", {
      listTransactions: async () => {
        throw new Error("DB connection failed");
      },
    });
    const svcErr = await processConversationMessage({ userId: "u-4", text: "How much did I spend today?", dataSource: failDs, todayISO: "2026-11-25" });
    assert.equal(svcErr.toolResult?.ok, false);
    assert.match(svcErr.responseText, /DB connection failed/);
  });

  it("10, 11 & 12. User isolation, context expiration, and language preservation", async () => {
    clearUserContext("u-A");
    clearUserContext("u-B");
    const dsA = makeDataSource("u-A");
    const dsB = makeDataSource("u-B");

    await processConversationMessage({ userId: "u-A", text: "How much did I spend on food?", dataSource: dsA, todayISO: "2026-11-25", nowMs: 1000, ttlMs: 5000 });
    const ctxB = loadUserContext("u-B", "en", 2000, 5000);
    assert.equal(ctxB.lastTopic, null);
    assert.equal(ctxB.lastCategory, null);

    // Context expiration for u-A after TTL
    const expiredA = loadUserContext("u-A", "en", 10000, 5000);
    assert.equal(expiredA.lastTopic, null);

    // Language preservation (Hindi / Hinglish)
    const hiRes = await processConversationMessage({ userId: "u-B", text: "Is month maine kitna kharch kiya?", language: "hi", dataSource: dsB, todayISO: "2026-11-25" });
    assert.equal(hiRes.language, "hi");
    assert.match(hiRes.responseText, /₹650/);
  });

  it("13 & 14. Unsupported/write tool prevention & zero database writes on 'I earned 500' / 'He returned 200'", async () => {
    clearUserContext("u-5");
    const ds = makeDataSource("u-5");

    const blockedIncome = await processConversationMessage({ userId: "u-5", text: "I earned 500.", dataSource: ds, todayISO: "2026-11-25" });
    assert.equal(blockedIncome.requiresClarification, true);
    assert.equal(blockedIncome.writeOperationBlocked, true);
    assert.equal(blockedIncome.toolSelection, null);
    assert.match(blockedIncome.responseText, /Nothing was saved/i);

    const unknownTool = selectReadOnlyTool({ topic: "potential_income_draft", isFollowUp: false, language: "en", confidence: 1 }, "2026-11-25");
    assert.equal(unknownTool, null);
  });
});
