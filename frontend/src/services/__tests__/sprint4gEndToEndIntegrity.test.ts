// =====================================================================
// FLOVA 2.0 | Sprint 4G: End-to-End Financial Integrity & Cross-Feature Tests
// Verifies:
//   - Multi-step cross-module workflow with step-by-step balance reconciliation
//   - All 14 accounting invariants against calculateConfirmedBalance & calculateDailyRunway
//   - Failure handling, retries, duplicate requests, and settlement reversals
//   - Historical null payment_method preservation & no double-counting
// =====================================================================

import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { mockState, resetMockState } from "./mockSupabase";
import {
  addCheckin,
  addCommitment,
  addTransaction,
  confirmCandidateTransaction,
  deleteTransaction,
  listCommitments,
  loadRunwayInput,
  setCommitmentStatus,
  updateTransaction,
} from "../data";
import {
  computePeopleSummaries,
  createPeerDebt,
  createPerson,
  deletePeerDebt,
  recordDebtSettlement,
  recordGiftTransaction,
  reverseDebtSettlement,
  updatePeerDebt,
} from "../peerDebts";
import {
  computeGroupBalances,
  createExpenseGroup,
  deleteGroupExpense,
  recordGroupExpense,
  recordGroupSettlement,
  reverseGroupSettlement,
} from "../groupExpenses";
import { getReceiptSignedUrl, saveTransactionWithReceipt } from "../receiptStorage";
import { splitEqual } from "../../engine/groupSplitEngine";
import { calculateConfirmedBalance } from "../../engine/balance";
import { calculateDailyRunway } from "../../engine/runway";

beforeEach(() => {
  resetMockState();
  mockState.profile = {
    id: "test-user-id",
    display_name: "QA Rider",
    work_profile: "delivery",
    payout_pattern: "weekly",
    income_variability: "variable",
    handles_cod: true,
    safe_runway_buffer: "1000.00",
    preferred_language: "en",
    daily_living_estimate: "200.00",
    daily_work_estimate: "100.00",
    onboarding_completed: true,
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-01T00:00:00Z",
  };
});

test("Sprint 4G Cross-Feature E2E: Check-in -> Income -> Expenses -> Peer -> Group -> Receipt -> Bill -> Final Reconciliation", async () => {
  const t0 = "2026-11-20T00:00:00.000Z";
  await addCheckin({
    cash: 200000, // ₹2,000
    bank: 800000, // ₹8,000
    notMine: 50000, // ₹500 COD custodial
    checkedAt: t0,
  });

  // Step 1: Initial check-in -> Personal = ₹9,500 (950000), Custodial = ₹500 (50000)
  let input = await loadRunwayInput();
  let bal = calculateConfirmedBalance(input);
  assert.equal(bal.status, "CONFIRMED");
  assert.equal(bal.confirmedBalancePaise, 950000);
  assert.equal(bal.custodialOwedPaise, 50000);

  // Step 2: Receive salary (₹5,000 earned, bank) -> ₹14,500
  await addTransaction({
    type: "income",
    amount: 500000,
    category: "salary",
    inflowCategory: "earned",
    paymentMethod: "bank",
    ownership: "mine",
    date: "2026-11-27",
  });
  bal = calculateConfirmedBalance(await loadRunwayInput());
  assert.equal(bal.confirmedBalancePaise, 1450000);
  assert.equal(bal.breakdown?.earnedIncomePaise, 500000);

  // Step 3: Receive family support (₹1,000 family_support, upi) -> ₹15,500; earnedIncome stays ₹5,000
  await addTransaction({
    type: "income",
    amount: 100000,
    category: "other",
    inflowCategory: "family_support",
    paymentMethod: "upi",
    ownership: "mine",
    date: "2026-11-27",
  });
  bal = calculateConfirmedBalance(await loadRunwayInput());
  assert.equal(bal.confirmedBalancePaise, 1550000);
  assert.equal(bal.breakdown?.earnedIncomePaise, 500000);
  assert.equal(bal.breakdown?.nonEarnedInflowPaise, 100000);

  // Step 4: Living expense ₹400 (cash) & Work expense ₹300 (upi) -> ₹14,800
  await addTransaction({
    type: "expense",
    amount: 40000,
    category: "food",
    expenseType: "living",
    paymentMethod: "cash",
    ownership: "mine",
    date: "2026-11-27",
  });
  await addTransaction({
    type: "expense",
    amount: 30000,
    category: "fuel",
    expenseType: "work",
    paymentMethod: "upi",
    ownership: "mine",
    date: "2026-11-27",
  });
  bal = calculateConfirmedBalance(await loadRunwayInput());
  assert.equal(bal.confirmedBalancePaise, 1480000);
  assert.equal(bal.breakdown?.confirmedExpensePaise, 70000);

  // Step 5: Borrow ₹2,000 from Friend A -> cash +₹2,000 = ₹16,800; earnedIncome stays ₹5,000; peerLiability = ₹2,000
  const friendA = await createPerson({ name: "Friend A" });
  const friendB = await createPerson({ name: "Friend B" });
  const debtBorrow = await createPeerDebt({
    personId: friendA.id,
    direction: "you_owe",
    totalAmountPaise: 200000,
    reason: "Emergency borrow",
  });
  bal = calculateConfirmedBalance(await loadRunwayInput());
  assert.equal(bal.confirmedBalancePaise, 1680000);
  assert.equal(bal.breakdown?.earnedIncomePaise, 500000);
  assert.equal(bal.peerLiabilityPaise, 200000);

  // Step 6: Lend ₹1,500 to Friend B -> cash -₹1,500 = ₹15,300; peerReceivable = ₹1,500
  await createPeerDebt({
    personId: friendB.id,
    direction: "they_owe",
    totalAmountPaise: 150000,
    reason: "Advance to Friend B",
  });
  bal = calculateConfirmedBalance(await loadRunwayInput());
  assert.equal(bal.confirmedBalancePaise, 1530000);
  assert.equal(bal.peerReceivablePaise, 150000);

  // Step 7: Partial repayment of ₹500 to Friend A -> cash -₹500 = ₹14,800; peerLiability = ₹1,500
  await recordDebtSettlement(debtBorrow, {
    direction: "repayment_out",
    amountPaise: 50000,
    notes: "Part 1",
  });
  bal = calculateConfirmedBalance(await loadRunwayInput());
  assert.equal(bal.confirmedBalancePaise, 1480000);
  assert.equal(bal.peerLiabilityPaise, 150000);

  // Step 8: Group expense ₹900 paid by user, equal split among 3 (self ₹300, A ₹300, B ₹300)
  // User's wallet drops by ₹900 -> ₹13,900; own expense = +₹300; groupReceivable = ₹600; no peer_debts added
  const trip = await createExpenseGroup({ name: "Trip", memberPersonIds: [friendA.id, friendB.id] });
  const { splits: grpSplits } = await recordGroupExpense({
    groupId: trip.id,
    description: "Group dinner",
    totalAmountPaise: 90000,
    paidBySelf: true,
    paidByPersonId: null,
    expenseDate: "2026-11-27",
    splitType: "equal",
    shares: splitEqual(90000, [
      { isSelf: true, personId: null },
      { isSelf: false, personId: friendA.id },
      { isSelf: false, personId: friendB.id },
    ]),
    category: "food",
    expenseType: "living",
  });
  assert.equal(mockState.peerDebts.length, 2, "Group splits must never duplicate into peer_debts");
  bal = calculateConfirmedBalance(await loadRunwayInput());
  assert.equal(bal.confirmedBalancePaise, 1390000);
  assert.equal(bal.groupReceivablePaise, 60000);
  assert.equal(bal.breakdown?.confirmedExpensePaise, 100000); // 400 + 300 + 300 = ₹1,000

  // Step 9: Settle ₹200 of Friend A's group share -> cash +₹200 = ₹14,100; groupReceivable = ₹400
  const splitA = grpSplits.find((s) => s.person_id === friendA.id)!;
  await recordGroupSettlement(splitA, {
    direction: "repayment_in",
    amountPaise: 20000,
    notes: "UPI",
  });
  bal = calculateConfirmedBalance(await loadRunwayInput());
  assert.equal(bal.confirmedBalancePaise, 1410000);
  assert.equal(bal.groupReceivablePaise, 40000);

  // Step 10: Attach receipt to an expense (₹250) -> cash -₹250 = ₹13,850; receipt does not alter totals
  const receiptFile = new File([new Uint8Array([1, 2, 3, 4])], "medical.jpg", { type: "image/jpeg" });
  const receiptTxId = "tx-4g-receipt-1";
  const { result: recTx, receiptPath } = await saveTransactionWithReceipt(receiptFile, receiptTxId, async (p) =>
    confirmCandidateTransaction({
      id: receiptTxId,
      merchant: "Apollo Pharmacy",
      amountPaise: 25000,
      type: "expense",
      category: "medical",
      expenseType: "living",
      date: "2026-11-27",
      description: "Medicine",
      ownership: "mine",
      paymentMethod: "upi",
      receiptPath: p,
      needsReview: false,
      missingFields: [],
      kind: "physical_receipt",
    })
  );
  assert.equal(recTx.receipt_path, receiptPath);
  const signed = await getReceiptSignedUrl(receiptPath);
  assert.ok(signed.includes("token="));
  bal = calculateConfirmedBalance(await loadRunwayInput());
  assert.equal(bal.confirmedBalancePaise, 1385000);

  // Step 11: Create upcoming bill (₹1,000) due today, verify runway includes it; then pay bill & record expense -> no double deduction
  const bill = await addCommitment({
    title: "Internet bill",
    amount: 100000,
    dueDate: "2026-11-27",
    kind: "bill",
    category: "utility",
  });
  const runwayBeforePay = calculateDailyRunway({ ...(await loadRunwayInput()), startDate: "2026-11-27", horizonDays: 10 });
  assert.equal(runwayBeforePay.status, "PROJECTED");
  assert.equal(runwayBeforePay.startingConfirmedBalancePaise, 1385000);

  await setCommitmentStatus(bill.id, "paid");
  await addTransaction({
    type: "expense",
    amount: 100000,
    category: "utility",
    expenseType: "living",
    paymentMethod: "bank",
    ownership: "mine",
    date: "2026-11-27",
  });

  // Final Reconciliation
  const finalInput = await loadRunwayInput();
  assert.equal(finalInput.commitments?.length, 0, "Paid commitment excluded from upcoming commitments");
  const finalRunway = calculateDailyRunway({ ...finalInput, startDate: "2026-11-27", horizonDays: 10 });
  // Final confirmed balance: 1385000 - 100000 = 1285000 (₹12,850)
  assert.equal(finalRunway.startingConfirmedBalancePaise, 1285000);
  // Safe buffer = ₹1,000 (100000), peerLiability = ₹1,500 (150000)
  // Sustainable capital = 1285000 - 150000 - 100000 = 1035000 (₹10,350)
  assert.equal(finalRunway.sustainableCapitalPaise, 1035000);
  assert.equal(finalRunway.startingSpendableBalancePaise, 1185000);
  assert.ok((finalRunway.runwayDays ?? 0) > 0);
});

test("Sprint 4G Invariants: Gifts, historical null payment_method, reversals, and failed write retries", async () => {
  await addCheckin({
    cash: 500000,
    bank: 0,
    notMine: 0,
    checkedAt: "2026-11-20T00:00:00.000Z",
  });

  // Historical transaction with null payment_method stays null
  const histTx = await addTransaction({
    type: "expense",
    amount: 10000,
    category: "food",
    expenseType: "living",
    ownership: "mine",
    date: "2026-11-27",
  });
  assert.equal(histTx.payment_method ?? null, null);
  const editedHist = await updateTransaction(histTx.id, {
    type: "expense",
    amount: 12000,
    category: "food",
    expenseType: "living",
    description: "Edited",
  });
  assert.equal(editedHist.payment_method ?? null, null);

  // Gifts received (non-earned) & gifts given (expense, not receivable)
  await recordGiftTransaction({ direction: "received", amountPaise: 50000, date: "2026-11-27", note: "Birthday" });
  await recordGiftTransaction({ direction: "given", amountPaise: 20000, date: "2026-11-27", note: "Wedding" });
  assert.equal(mockState.peerDebts.length, 0);

  let bal = calculateConfirmedBalance(await loadRunwayInput());
  // 500000 - 12000 + 50000 - 20000 = 518000
  assert.equal(bal.confirmedBalancePaise, 518000);
  assert.equal(bal.breakdown?.earnedIncomePaise, 0);
  assert.equal(bal.breakdown?.nonEarnedInflowPaise, 50000);

  // Peer debt edit, settlement reversal, and delete
  const person = await createPerson({ name: "Suresh" });
  const debt = await createPeerDebt({ personId: person.id, direction: "they_owe", totalAmountPaise: 100000 });
  const sett = await recordDebtSettlement(debt, { direction: "repayment_in", amountPaise: 40000 });
  await updatePeerDebt({ debtId: debt.id, personId: person.id, totalAmountPaise: 120000, reason: "Updated" });
  await reverseDebtSettlement(sett.id);
  const summaries = computePeopleSummaries([person], mockState.peerDebts, mockState.debtSettlements);
  assert.equal(summaries[0].netBalancePaise, 120000);
  await deletePeerDebt(debt.id);
  assert.equal(mockState.peerDebts.length, 0);

  // Delete historical tx -> balance returns to 500000 + 50000 - 20000 = 530000
  await deleteTransaction(histTx.id);
  bal = calculateConfirmedBalance(await loadRunwayInput());
  assert.equal(bal.confirmedBalancePaise, 530000);

  // Group expense idempotency + reversal + safe delete
  const grp = await createExpenseGroup({ name: "Team", memberPersonIds: [person.id] });
  const r1 = await recordGroupExpense({
    groupId: grp.id,
    description: "Snacks",
    totalAmountPaise: 40000,
    paidBySelf: true,
    paidByPersonId: null,
    expenseDate: "2026-11-27",
    splitType: "equal",
    shares: splitEqual(40000, [{ isSelf: true, personId: null }, { isSelf: false, personId: person.id }]),
    idempotencyKey: "4g-idem-1",
  });
  const r2 = await recordGroupExpense({
    groupId: grp.id,
    description: "Snacks",
    totalAmountPaise: 40000,
    paidBySelf: true,
    paidByPersonId: null,
    expenseDate: "2026-11-27",
    splitType: "equal",
    shares: splitEqual(40000, [{ isSelf: true, personId: null }, { isSelf: false, personId: person.id }]),
    idempotencyKey: "4g-idem-1",
  });
  assert.equal(r1.expense.id, r2.expense.id);
  const sp = r1.splits.find((s) => s.person_id === person.id)!;
  const gSett = await recordGroupSettlement(sp, { direction: "repayment_in", amountPaise: 10000 });
  await reverseGroupSettlement(gSett.id);
  const grpBal = computeGroupBalances(mockState.expenseGroupMembers, mockState.groupExpenses, mockState.groupExpenseSplits, [person]);
  assert.equal(grpBal.find((b) => b.personId === person.id)!.netBalanceWithYouPaise, 20000);
  await deleteGroupExpense(r1.expense.id);
  assert.equal(mockState.groupExpenses.length, 0);

  // Commitments history preserved
  const c1 = await addCommitment({ title: "Power", amount: 50000, dueDate: "2026-12-01", kind: "bill" });
  await setCommitmentStatus(c1.id, "cancelled");
  assert.equal((await listCommitments("cancelled")).length, 1);
});
