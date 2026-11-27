// =====================================================================
// FLOVA Sprint 4E: Group Expenses Completeness Tests
// Covers category & expense_type selection, equal/custom/percentage edits,
// payer changes, self-transaction sync, partial & full settlement protection,
// safe deletion, reversal, duplicate submission idempotency, and balance math.
// =====================================================================

import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { resetMockState, mockState } from "./mockSupabase";
import {
  computeGroupBalances,
  createExpenseGroup,
  deleteGroupExpense,
  recordGroupExpense,
  recordGroupSettlement,
  reverseGroupSettlement,
  updateGroupExpense,
} from "../groupExpenses";
import { createPerson } from "../peerDebts";
import { splitCustom, splitEqual, splitPercentage } from "../../engine/groupSplitEngine";
import { calculateConfirmedBalance } from "../../engine/balance";
import { toPaise } from "../../lib/money";

beforeEach(() => {
  resetMockState();
});

test("Sprint 4E: Category & expense_type persist on group_expenses and self transaction without duplicating peer debts", async () => {
  const ravi = await createPerson({ name: "Ravi" });
  const group = await createExpenseGroup({ name: "Delivery Crew", memberPersonIds: [ravi.id] });

  // Case C: User pays their own share + others' shares (work fuel expense)
  const shares = splitEqual(100000, [
    { isSelf: true, personId: null },
    { isSelf: false, personId: ravi.id },
  ]);

  const { expense, splits } = await recordGroupExpense({
    groupId: group.id,
    description: "Shared fuel tank",
    totalAmountPaise: 100000,
    paidBySelf: true,
    paidByPersonId: null,
    expenseDate: "2026-11-27",
    splitType: "equal",
    shares,
    category: "fuel",
    expenseType: "work",
  });

  assert.equal(expense.category, "fuel");
  assert.equal(expense.expense_type, "work");
  assert.equal(mockState.peerDebts.length, 0, "No duplicate peer_debts should be created");

  // Only user's own share (₹500 = 50000 paise) is in personal transactions
  assert.equal(mockState.transactions.length, 1);
  const selfTx = mockState.transactions[0];
  assert.equal(toPaise(selfTx.amount), 50000);
  assert.equal(selfTx.category, "fuel");
  assert.equal(selfTx.expense_type, "work");

  const raviSplit = splits.find((s) => s.person_id === ravi.id)!;
  assert.equal(raviSplit.direction, "they_owe");
  assert.equal(raviSplit.remaining_amount_paise, 50000);
});

test("Sprint 4E: Accounting cases A, B, D + duplicate idempotency + balance reconciliation", async () => {
  const ravi = await createPerson({ name: "Ravi" });
  const neha = await createPerson({ name: "Neha" });
  const group = await createExpenseGroup({ name: "Goa Trip", memberPersonIds: [ravi.id, neha.id] });

  // Case A: User pays entire bill (₹900), self share = 0
  const caseAShares = splitCustom(90000, [
    { isSelf: true, personId: null, shareAmountPaise: 0 },
    { isSelf: false, personId: ravi.id, shareAmountPaise: 45000 },
    { isSelf: false, personId: neha.id, shareAmountPaise: 45000 },
  ]);
  const resA = await recordGroupExpense({
    groupId: group.id,
    description: "Taxi for Ravi & Neha",
    totalAmountPaise: 90000,
    paidBySelf: true,
    paidByPersonId: null,
    expenseDate: "2026-11-27",
    splitType: "custom",
    shares: caseAShares,
    category: "transport",
    expenseType: "living",
    idempotencyKey: "idem-case-a",
  });
  assert.equal(resA.expense.self_transaction_id, null, "No self tx when self share is 0");
  assert.equal(mockState.transactions.length, 0);

  // Duplicate submission with same idempotencyKey returns existing without duplicating
  const resADup = await recordGroupExpense({
    groupId: group.id,
    description: "Taxi for Ravi & Neha",
    totalAmountPaise: 90000,
    paidBySelf: true,
    paidByPersonId: null,
    expenseDate: "2026-11-27",
    splitType: "custom",
    shares: caseAShares,
    category: "transport",
    expenseType: "living",
    idempotencyKey: "idem-case-a",
  });
  assert.equal(resADup.expense.id, resA.expense.id);
  assert.equal(mockState.groupExpenses.length, 1);

  // Case B: Another participant (Ravi) pays entire ₹600 bill, split equally (₹200 each)
  const caseBShares = splitEqual(60000, [
    { isSelf: true, personId: null },
    { isSelf: false, personId: ravi.id },
    { isSelf: false, personId: neha.id },
  ]);
  const resB = await recordGroupExpense({
    groupId: group.id,
    description: "Dinner by Ravi",
    totalAmountPaise: 60000,
    paidBySelf: false,
    paidByPersonId: ravi.id,
    expenseDate: "2026-11-27",
    splitType: "equal",
    shares: caseBShares,
    category: "food",
    expenseType: "living",
  });
  assert.equal(mockState.transactions.length, 1);
  assert.equal(toPaise(mockState.transactions[0].amount), 20000);
  const selfSplitB = resB.splits.find((s) => s.is_self)!;
  assert.equal(selfSplitB.direction, "you_owe");
  assert.equal(selfSplitB.remaining_amount_paise, 20000);

  // Case D: User pays only their own share (₹300 total, self=300, others=0)
  const caseDShares = splitCustom(30000, [
    { isSelf: true, personId: null, shareAmountPaise: 30000 },
    { isSelf: false, personId: ravi.id, shareAmountPaise: 0 },
    { isSelf: false, personId: neha.id, shareAmountPaise: 0 },
  ]);
  await recordGroupExpense({
    groupId: group.id,
    description: "Coffee solo",
    totalAmountPaise: 30000,
    paidBySelf: true,
    paidByPersonId: null,
    expenseDate: "2026-11-27",
    splitType: "custom",
    shares: caseDShares,
    category: "food",
    expenseType: "living",
  });

  // Balance engine reconciliation: total expenses = 20000 + 30000 = 50000 paise (no double counting)
  // Starting 100000 - 50000 (own shares) - 90000 (Case A lent to Ravi/Neha) + 0 = -40000?
  // Wait: let's check calculateConfirmedBalance with groupExpenses & groupSplits!
  const bal = calculateConfirmedBalance({
    profile: { workProfile: "delivery", payoutPattern: "weekly", dailyLivingEstimate: 20000, dailyWorkEstimate: 0 },
    latestCheckin: { cash: 200000, bank: 0, notMine: 0, checkedAt: "2020-01-01T00:00:00Z" },
    transactionsSinceCheckin: mockState.transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: toPaise(t.amount),
      ownership: t.ownership,
      expenseType: t.expense_type ?? null,
      inflowCategory: t.inflow_category ?? null,
      payoutId: t.payout_id ?? null,
      date: t.transaction_date,
      createdAt: t.created_at,
    })),
    payouts: [],
    commitments: [],
    groupSplits: mockState.groupExpenseSplits.map((s) => ({
      id: s.id,
      groupExpenseId: s.group_expense_id,
      isSelf: s.is_self,
      personId: s.person_id,
      direction: s.direction,
      shareAmountPaise: s.share_amount_paise,
      remainingAmountPaise: s.remaining_amount_paise,
      status: s.status,
      createdAt: s.created_at,
    })),
    groupSettlements: [],
  });
  assert.equal(bal.status, "CONFIRMED");
  assert.equal(bal.breakdown?.confirmedExpensePaise, 50000);
  assert.equal(bal.groupReceivablePaise, 90000);
  assert.equal(bal.groupLiabilityPaise, 20000);

  const grpBal = computeGroupBalances(
    mockState.expenseGroupMembers,
    mockState.groupExpenses,
    mockState.groupExpenseSplits,
    [ravi, neha]
  );
  const raviBal = grpBal.find((b) => b.personId === ravi.id)!;
  const nehaBal = grpBal.find((b) => b.personId === neha.id)!;
  // Ravi owes you 45000 - you owe Ravi 20000 = +25000
  assert.equal(raviBal.netBalanceWithYouPaise, 25000);
  // Neha owes you 45000
  assert.equal(nehaBal.netBalanceWithYouPaise, 45000);
});

test("Sprint 4E: Editing unsettled expense (percentage/custom, payer change, self tx sync) & safe deletion", async () => {
  const ravi = await createPerson({ name: "Ravi" });
  const group = await createExpenseGroup({ name: "Office", memberPersonIds: [ravi.id] });

  const initialShares = splitEqual(80000, [
    { isSelf: true, personId: null },
    { isSelf: false, personId: ravi.id },
  ]);
  const { expense } = await recordGroupExpense({
    groupId: group.id,
    description: "Lunch",
    totalAmountPaise: 80000,
    paidBySelf: true,
    paidByPersonId: null,
    expenseDate: "2026-11-27",
    splitType: "equal",
    shares: initialShares,
    category: "food",
    expenseType: "living",
  });

  // Edit: percentage split (75% self, 25% Ravi), payer changed to Ravi, category -> phone (work)
  const pctShares = splitPercentage(100000, [
    { isSelf: true, personId: null, percent: 75 },
    { isSelf: false, personId: ravi.id, percent: 25 },
  ]);
  const updated = await updateGroupExpense(expense.id, {
    description: "Team hotspot & lunch",
    totalAmountPaise: 100000,
    paidBySelf: false,
    paidByPersonId: ravi.id,
    expenseDate: "2026-11-27",
    splitType: "percentage",
    shares: pctShares,
    category: "phone",
    expenseType: "work",
  });

  assert.equal(updated.expense.category, "phone");
  assert.equal(updated.expense.expense_type, "work");
  assert.equal(updated.expense.paid_by_self, false);
  assert.equal(updated.expense.paid_by_person_id, ravi.id);

  // Linked self transaction updated to ₹750 (75000 paise)
  assert.equal(mockState.transactions.length, 1);
  assert.equal(toPaise(mockState.transactions[0].amount), 75000);
  assert.equal(mockState.transactions[0].category, "phone");
  assert.equal(mockState.transactions[0].expense_type, "work");

  const selfSplit = updated.splits.find((s) => s.is_self)!;
  assert.equal(selfSplit.direction, "you_owe");
  assert.equal(selfSplit.remaining_amount_paise, 75000);

  // Safe delete removes expense, splits, and linked self transaction
  await deleteGroupExpense(expense.id);
  assert.equal(mockState.groupExpenses.length, 0);
  assert.equal(mockState.groupExpenseSplits.length, 0);
  assert.equal(mockState.transactions.length, 0);
});

test("Sprint 4E: Partial & full settlement protection on edit/delete, plus reversal workflow", async () => {
  const ravi = await createPerson({ name: "Ravi" });
  const group = await createExpenseGroup({ name: "Flat", memberPersonIds: [ravi.id] });

  const shares = splitEqual(100000, [
    { isSelf: true, personId: null },
    { isSelf: false, personId: ravi.id },
  ]);
  const { expense, splits } = await recordGroupExpense({
    groupId: group.id,
    description: "Internet bill",
    totalAmountPaise: 100000,
    paidBySelf: true,
    paidByPersonId: null,
    expenseDate: "2026-11-27",
    splitType: "equal",
    shares,
    category: "utility",
    expenseType: "living",
  });

  const raviSplit = splits.find((s) => s.person_id === ravi.id)!;
  // Partial settlement of ₹300 (30000 paise)
  const sett = await recordGroupSettlement(raviSplit, {
    direction: "repayment_in",
    amountPaise: 30000,
    notes: "UPI",
  });

  // Reject unsafe deletion while settlement exists
  await assert.rejects(
    () => deleteGroupExpense(expense.id),
    /existing settlements/i
  );

  // Reject payer change while settlement exists
  await assert.rejects(
    () =>
      updateGroupExpense(expense.id, {
        description: "Internet bill",
        totalAmountPaise: 100000,
        paidBySelf: false,
        paidByPersonId: ravi.id,
        expenseDate: "2026-11-27",
        splitType: "equal",
        shares,
        category: "utility",
        expenseType: "living",
      }),
    /Cannot change who paid/i
  );

  // Reject reducing Ravi's share below ₹300 already settled
  await assert.rejects(
    () =>
      updateGroupExpense(expense.id, {
        description: "Internet bill",
        totalAmountPaise: 80000,
        paidBySelf: true,
        paidByPersonId: null,
        expenseDate: "2026-11-27",
        splitType: "custom",
        shares: splitCustom(80000, [
          { isSelf: true, personId: null, shareAmountPaise: 60000 },
          { isSelf: false, personId: ravi.id, shareAmountPaise: 20000 },
        ]),
        category: "utility",
        expenseType: "living",
      }),
    /cannot be less than already settled/i
  );

  // Valid edit with settlement preserved: increase Ravi's share to ₹600 -> remaining becomes ₹300
  const edited = await updateGroupExpense(expense.id, {
    description: "Internet + Router",
    totalAmountPaise: 120000,
    paidBySelf: true,
    paidByPersonId: null,
    expenseDate: "2026-11-27",
    splitType: "custom",
    shares: splitCustom(120000, [
      { isSelf: true, personId: null, shareAmountPaise: 60000 },
      { isSelf: false, personId: ravi.id, shareAmountPaise: 60000 },
    ]),
    category: "utility",
    expenseType: "living",
  });
  const editedRaviSplit = edited.splits.find((s) => s.person_id === ravi.id)!;
  assert.equal(editedRaviSplit.remaining_amount_paise, 30000);
  assert.equal(editedRaviSplit.status, "partially_settled");
  assert.equal(toPaise(mockState.transactions[0].amount), 60000);

  // Reverse settlement -> remaining restored to 60000, then safe delete succeeds
  await reverseGroupSettlement(sett.id);
  assert.equal(mockState.groupExpenseSplits.find((s) => s.id === editedRaviSplit.id)!.remaining_amount_paise, 60000);
  await deleteGroupExpense(expense.id);
  assert.equal(mockState.groupExpenses.length, 0);
  assert.equal(mockState.transactions.length, 0);
});
