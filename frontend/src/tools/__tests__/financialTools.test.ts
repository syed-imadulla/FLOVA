// =====================================================================
// FLOVA 2.0 | Sprint 3A — Deterministic Financial Tool Layer Tests
// Covers all 6 tool groups and all 12 QA requirements in Section 9.
// =====================================================================

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALL_FINANCIAL_TOOLS,
  executeFinancialTool,
  type FinancialToolDataSource,
} from "../index";
import type {
  Commitment,
  DebtSettlement,
  ExpenseGroup,
  ExpenseGroupMember,
  GroupExpense,
  GroupExpenseSplit,
  GroupSettlement,
  Payout,
  PeerDebt,
  Person,
  RunwayInput,
  Transaction,
  WishGoal,
} from "../../types/contracts";

function makeMockDataSource(overrides?: Partial<FinancialToolDataSource>): FinancialToolDataSource {
  const people: Person[] = [
    { id: "p-1", user_id: "user-1", name: "Ahmed", phone: null, upi_id: null, relationship: "Friend", is_favorite: false, created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z" },
    { id: "p-2", user_id: "user-1", name: "Priya", phone: null, upi_id: null, relationship: "Colleague", is_favorite: false, created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z" },
    { id: "p-other", user_id: "user-2", name: "Intruder", phone: null, upi_id: null, relationship: "Other", is_favorite: false, created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z" },
  ];

  const peerDebts: PeerDebt[] = [
    { id: "d-1", user_id: "user-1", person_id: "p-1", direction: "they_owe", total_amount_paise: 100000, remaining_amount_paise: 60000, reason: "Lunch", status: "partially_settled", due_date: "2026-11-30", created_at: "2026-11-10T09:00:00Z", updated_at: "2026-11-10T09:00:00Z" },
    { id: "d-2", user_id: "user-1", person_id: "p-2", direction: "you_owe", total_amount_paise: 50000, remaining_amount_paise: 50000, reason: "Bike repair", status: "active", due_date: "2026-11-15", created_at: "2026-11-05T09:00:00Z", updated_at: "2026-11-05T09:00:00Z" },
  ];

  const debtSettlements: DebtSettlement[] = [
    { id: "ds-1", user_id: "user-1", debt_id: "d-1", direction: "repayment_in", amount_paise: 40000, payment_mode: "upi", reference_id: null, notes: "UPI", settled_at: "2026-11-12T10:00:00Z", created_at: "2026-11-12T10:00:00Z" },
  ];

  const groups: ExpenseGroup[] = [
    { id: "g-1", user_id: "user-1", name: "College friends", description: null, created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z" },
  ];

  const groupMembers: ExpenseGroupMember[] = [
    { id: "gm-1", group_id: "g-1", user_id: "user-1", is_self: true, person_id: null, joined_at: "2026-11-01T00:00:00Z" },
    { id: "gm-2", group_id: "g-1", user_id: "user-1", is_self: false, person_id: "p-1", joined_at: "2026-11-01T00:00:00Z" },
  ];

  const groupExpenses: GroupExpense[] = [
    { id: "ge-1", user_id: "user-1", group_id: "g-1", description: "Dinner", total_amount_paise: 120000, paid_by_self: true, paid_by_person_id: null, expense_date: "2026-11-20", split_type: "equal", self_transaction_id: null, note: null, created_at: "2026-11-20T20:00:00Z", updated_at: "2026-11-20T20:00:00Z" },
  ];

  const groupSplits: GroupExpenseSplit[] = [
    { id: "gs-1", group_expense_id: "ge-1", user_id: "user-1", is_self: true, person_id: null, direction: "self_share", share_amount_paise: 60000, remaining_amount_paise: 0, status: "settled", created_at: "2026-11-20T20:00:00Z", updated_at: "2026-11-20T20:00:00Z" },
    { id: "gs-2", group_expense_id: "ge-1", user_id: "user-1", is_self: false, person_id: "p-1", direction: "they_owe", share_amount_paise: 60000, remaining_amount_paise: 60000, status: "active", created_at: "2026-11-20T20:00:00Z", updated_at: "2026-11-20T20:00:00Z" },
  ];

  const groupSettlements: GroupSettlement[] = [];

  const transactions: Transaction[] = [
    { id: "tx-1", user_id: "user-1", type: "expense", amount: "150.75", category: "food", description: "Lunch", expense_type: "living", inflow_category: null, ownership: "mine", payout_id: null, transaction_date: "2026-11-25", source: "manual", created_at: "2026-11-25T10:00:00Z", updated_at: "2026-11-25T10:00:00Z" },
    { id: "tx-2", user_id: "user-1", type: "expense", amount: "300.00", category: "fuel", description: "Petrol", expense_type: "work", inflow_category: null, ownership: "mine", payout_id: null, transaction_date: "2026-11-22", source: "manual", created_at: "2026-11-22T10:00:00Z", updated_at: "2026-11-22T10:00:00Z" },
    { id: "tx-3", user_id: "user-1", type: "expense", amount: "450.00", category: "food", description: "Oct dinner", expense_type: "living", inflow_category: null, ownership: "mine", payout_id: null, transaction_date: "2026-10-15", source: "manual", created_at: "2026-10-15T10:00:00Z", updated_at: "2026-10-15T10:00:00Z" },
    { id: "tx-4", user_id: "user-1", type: "income", amount: "1200.00", category: "earnings", description: "Delivery", expense_type: null, inflow_category: "earned", ownership: "mine", payout_id: null, transaction_date: "2026-11-24", source: "manual", created_at: "2026-11-24T18:00:00Z", updated_at: "2026-11-24T18:00:00Z" },
    { id: "tx-5", user_id: "user-1", type: "income", amount: "500.00", category: "gift", description: "Birthday gift", expense_type: null, inflow_category: "gift", ownership: "mine", payout_id: null, transaction_date: "2026-11-24", source: "manual", created_at: "2026-11-24T19:00:00Z", updated_at: "2026-11-24T19:00:00Z" },
    { id: "tx-cod", user_id: "user-1", type: "income", amount: "2000.00", category: "cod", description: "COD", expense_type: null, inflow_category: null, ownership: "not_mine", payout_id: null, transaction_date: "2026-11-25", source: "manual", created_at: "2026-11-25T11:00:00Z", updated_at: "2026-11-25T11:00:00Z" },
    { id: "tx-other-user", user_id: "user-2", type: "expense", amount: "9999.00", category: "food", description: "Leaked", expense_type: "living", inflow_category: null, ownership: "mine", payout_id: null, transaction_date: "2026-11-25", source: "manual", created_at: "2026-11-25T11:00:00Z", updated_at: "2026-11-25T11:00:00Z" },
  ];

  const payouts: Payout[] = [
    { id: "po-1", user_id: "user-1", kind: "platform_payout", source: "Swiggy", expected_amount: "1800.00", received_amount: "0.00", expected_date: "2026-11-28", status: "scheduled", note: null, created_at: "2026-11-20T00:00:00Z", updated_at: "2026-11-20T00:00:00Z" },
  ];

  const commitments: Commitment[] = [
    { id: "cm-1", user_id: "user-1", title: "Rent", amount: "3000.00", due_date: "2026-11-29", category: "rent", kind: "bill", status: "upcoming", created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z" },
    { id: "cm-2", user_id: "user-1", title: "Phone Bill", amount: "299.00", due_date: "2026-11-20", category: "phone", kind: "bill", status: "upcoming", created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z" },
  ];

  const wishGoals: WishGoal[] = [
    {
      id: "wg-1",
      user_id: "user-1",
      title: "New Helmet",
      target_amount: "2500.00",
      saved_amount: "0.00",
      status: "active",
      target_date: "2026-12-31",
      category: "gear",
      icon: null,
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
      contributions: [],
    },
  ];

  const runwayInput: RunwayInput = {
    profile: {
      workProfile: "delivery",
      payoutPattern: "weekly",
      dailyLivingEstimate: 20000,
      dailyWorkEstimate: 10000,
      safeRunwayBuffer: 100000, // ₹1,000
    },
    latestCheckin: {
      cash: 500000, // ₹5,000
      bank: 500000, // ₹5,000
      notMine: 0,
      checkedAt: "2026-11-25T08:00:00Z",
    },
    transactionsSinceCheckin: [
      { id: "tx-1", type: "expense", amount: 15075, ownership: "mine", expenseType: "living", inflowCategory: null, payoutId: null, date: "2026-11-25", createdAt: "2026-11-25T10:00:00Z" },
      { id: "tx-cod", type: "income", amount: 200000, ownership: "not_mine", expenseType: null, inflowCategory: null, payoutId: null, date: "2026-11-25", createdAt: "2026-11-25T11:00:00Z" },
    ],
    payouts: [{ id: "po-1", kind: "platform_payout", expected: 180000, received: 0, expectedDate: "2026-11-28", status: "scheduled" }],
    commitments: [
      { id: "cm-1", title: "Rent", amount: 300000, dueDate: "2026-11-29", kind: "bill" },
      { id: "cm-2", title: "Phone Bill", amount: 29900, dueDate: "2026-11-20", kind: "bill" },
    ],
    peerDebts: [
      { id: "d-1", personId: "p-1", personName: "Ahmed", direction: "they_owe", totalAmountPaise: 100000, remainingAmountPaise: 60000, status: "partially_settled", dueDate: "2026-11-30", createdAt: "2026-11-10T09:00:00Z" },
      { id: "d-2", personId: "p-2", personName: "Priya", direction: "you_owe", totalAmountPaise: 50000, remainingAmountPaise: 50000, status: "active", dueDate: "2026-11-15", createdAt: "2026-11-05T09:00:00Z" },
    ],
    debtSettlements: [],
    groupSplits: [],
    groupSettlements: [],
  };

  return {
    userId: "user-1",
    loadRunwayInput: async () => runwayInput,
    listTransactions: async () => transactions,
    listPeople: async () => people,
    listPeerDebts: async () => peerDebts,
    listDebtSettlements: async () => debtSettlements,
    listExpenseGroups: async () => groups,
    listGroupMembers: async () => groupMembers,
    listGroupExpenses: async () => groupExpenses,
    listGroupSplits: async () => groupSplits,
    listGroupSettlements: async () => groupSettlements,
    listPayouts: async () => payouts,
    listCommitments: async () => commitments,
    listWishGoals: async () => wishGoals,
    getActiveWish: async () => null,
    ...overrides,
  };
}

describe("Sprint 3A: Deterministic Financial Tool Layer", () => {
  it("1. All registered tools are strictly read-only", () => {
    assert.ok(ALL_FINANCIAL_TOOLS.length >= 25);
    for (const t of ALL_FINANCIAL_TOOLS) {
      assert.equal(t.access, "read_only");
    }
  });

  it("2. Group A (Balance & Runway): integer paise precision, excludes custodial COD, distinguishes liquidity vs sustainable capital", async () => {
    const ds = makeMockDataSource();
    const bal = await executeFinancialTool<any>("get_confirmed_balance", { todayISO: "2026-11-25" }, ds);
    assert.equal(bal.ok, true);
    assert.equal(bal.data.confirmedBalancePaise, 984925); // ₹10,000 - ₹150.75 = ₹9,849.25 (984,925 paise)
    assert.equal(bal.data.custodialOwedPaise, 200000); // ₹2,000 COD excluded

    const liq = await executeFinancialTool<any>("get_available_liquidity", { todayISO: "2026-11-25" }, ds);
    assert.equal(liq.data.availableLiquidityPaise, 884925); // 984,925 - 100,000 buffer
    assert.equal(liq.data.peerReceivableExcludedPaise, 60000); // receivables never added to liquidity

    const sus = await executeFinancialTool<any>("get_sustainable_capital", { todayISO: "2026-11-25" }, ds);
    assert.equal(sus.data.sustainableCapitalPaise, 834925); // 884,925 - 50,000 Priya payable

    const safe = await executeFinancialTool<any>("get_daily_safe_to_spend", { todayISO: "2026-11-25" }, ds);
    assert.equal(safe.ok, true);
    assert.equal(safe.data.dailyEssentialExpensePaise, 30000);
  });

  it("3. Group B (Income & Expenses): date-range filtering, multiple categories, user isolation, and earned vs non-earned segregation", async () => {
    const ds = makeMockDataSource();
    const exp = await executeFinancialTool<any>("get_expenses_for_range", { period: "this_month", todayISO: "2026-11-25" }, ds);
    assert.equal(exp.ok, true);
    assert.equal(exp.data.totalExpensePaise, 45075); // ₹150.75 + ₹300 (user-2 ₹9,999 leaked row excluded!)
    assert.equal(exp.data.livingPaise, 15075);
    assert.equal(exp.data.workPaise, 30000);

    const inc = await executeFinancialTool<any>("get_income_for_range", { period: "this_month", todayISO: "2026-11-25" }, ds);
    assert.equal(inc.data.earnedPaise, 120000);
    assert.equal(inc.data.nonEarnedPaise, 50000);

    const cat = await executeFinancialTool<any>("get_spending_by_category", { category: "food", period: "last_month", todayISO: "2026-11-25" }, ds);
    assert.equal(cat.data.totalPaise, 45000);

    const cmp = await executeFinancialTool<any>("compare_spending_periods", { currentPeriod: "this_month", todayISO: "2026-11-25" }, ds);
    assert.equal(cmp.data.currentRange.totalPaise, 45075);
    assert.equal(cmp.data.previousRange.totalPaise, 45000);
    assert.equal(cmp.data.deltaPaise, 75);
  });

  it("4. Group C (People & Debts): partial settlements, receivables excluded from cash, person with no debt", async () => {
    const ds = makeMockDataSource();
    const owed = await executeFinancialTool<any>("get_money_owed_to_user", { todayISO: "2026-11-25" }, ds);
    assert.equal(owed.data.isAvailableCash, false);
    assert.equal(owed.data.personalReceivablePaise, 60000);
    assert.equal(owed.data.groupReceivablePaise, 60000);

    const ahmed = await executeFinancialTool<any>("get_person_outstanding_balance", { personName: "Ahmed", todayISO: "2026-11-25" }, ds);
    assert.equal(ahmed.data.totalLentPaise, 160000); // ₹1,000 personal + ₹600 group share
    assert.equal(ahmed.data.totalReceivedPaise, 40000);

    const settle = await executeFinancialTool<any>("get_debt_settlement_history", { personName: "Ahmed", todayISO: "2026-11-25" }, ds);
    assert.equal(settle.data.totalCount, 1);

    // Person with no debt
    const zeroDs = makeMockDataSource({ listPeerDebts: async () => [], listGroupSplits: async () => [] });
    const noDebt = await executeFinancialTool<any>("get_person_outstanding_balance", { personName: "Priya", todayISO: "2026-11-25" }, zeroDs);
    assert.equal(noDebt.data.netBalancePaise, 0);
    assert.equal(noDebt.data.activeDebts.length, 0);
  });

  it("5. Group D (Group Expenses): group members, balances, unsettled splits", async () => {
    const ds = makeMockDataSource();
    const bal = await executeFinancialTool<any>("get_group_balances", { groupName: "College", todayISO: "2026-11-25" }, ds);
    assert.equal(bal.ok, true);
    assert.equal(bal.data.groups[0].totalSpendPaise, 120000);

    const unsettled = await executeFinancialTool<any>("get_unsettled_group_expenses", { todayISO: "2026-11-25" }, ds);
    assert.equal(unsettled.data.totalUnsettledReceivablePaise, 60000);
  });

  it("6. Group E & F (Payouts, Commitments, Overdue & WISH): upcoming/overdue commitments and goal with 0 contributions", async () => {
    const ds = makeMockDataSource();
    const payouts = await executeFinancialTool<any>("get_upcoming_payouts", { todayISO: "2026-11-25" }, ds);
    assert.equal(payouts.data.totalExpectedPaise, 180000);

    const overdue = await executeFinancialTool<any>("get_overdue_obligations", { todayISO: "2026-11-25" }, ds);
    assert.equal(overdue.data.overdueCommitmentsCount, 1); // Phone Bill due 2026-11-20
    assert.equal(overdue.data.overduePeerDebtsCount, 1); // Priya due 2026-11-15

    const wish = await executeFinancialTool<any>("get_goal_progress", { todayISO: "2026-11-25" }, ds);
    assert.equal(wish.data.savedPaise, 0);
    assert.equal(wish.data.remainingPaise, 250000);
    assert.equal(wish.data.contributionCount, 0);
  });

  it("7. Empty financial history, invalid inputs, unauthenticated access, and service errors", async () => {
    const emptyDs = makeMockDataSource({
      loadRunwayInput: async () => ({
        profile: { workProfile: "delivery", payoutPattern: "weekly", dailyLivingEstimate: null, dailyWorkEstimate: null, safeRunwayBuffer: null },
        latestCheckin: null,
        transactionsSinceCheckin: [],
        payouts: [],
        commitments: [],
      }),
      listTransactions: async () => [],
    });
    const noBaseline = await executeFinancialTool("get_confirmed_balance", { todayISO: "2026-11-25" }, emptyDs);
    assert.equal(noBaseline.ok, false);
    assert.equal(noBaseline.error?.code, "INSUFFICIENT_BASELINE");

    const emptyExp = await executeFinancialTool<any>("get_expenses_for_range", { period: "today", todayISO: "2026-11-25" }, emptyDs);
    assert.equal(emptyExp.ok, true);
    assert.equal(emptyExp.hasData, false);
    assert.equal(emptyExp.data.totalExpensePaise, 0);

    const badDate = await executeFinancialTool("get_income_for_range", { fromDate: "2026-11-25", toDate: "2026-11-01" }, emptyDs);
    assert.equal(badDate.ok, false);
    assert.equal(badDate.error?.code, "INVALID_INPUT");

    const unauth = await executeFinancialTool("get_people_summaries", {}, makeMockDataSource({ userId: "" }));
    assert.equal(unauth.ok, false);
    assert.equal(unauth.error?.code, "UNAUTHENTICATED");

    const failingDs = makeMockDataSource({
      listTransactions: async () => {
        throw new Error("Supabase network timeout");
      },
    });
    const svcErr = await executeFinancialTool("get_expenses_for_range", { period: "today", todayISO: "2026-11-25" }, failingDs);
    assert.equal(svcErr.ok, false);
    assert.equal(svcErr.error?.code, "SERVICE_ERROR");
  });
});
