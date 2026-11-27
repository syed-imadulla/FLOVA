// =====================================================================
// FLOVA 2.0 | Sprint 4D — Peer Money Management Completeness Tests
// Covers: gift vs loan, unsettled & partially settled debt edits,
// rejecting edits below settled principal, safe deletion, settlement
// reversal, duplicate reversal prevention, and person balance reconciliation.
// =====================================================================

import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { mockState, resetMockState } from "./mockSupabase";
import {
  computeMoneyOverview,
  computePeopleSummaries,
  createPeerDebt,
  createPerson,
  deletePeerDebt,
  recordDebtSettlement,
  recordGiftTransaction,
  reverseDebtSettlement,
  updatePeerDebt,
} from "../peerDebts";
import { calculateConfirmedBalance } from "../../engine/balance";

describe("Sprint 4D: Peer Money Management Completeness", () => {
  beforeEach(() => {
    resetMockState();
  });

  it("1. Gift received vs loan received & gift given vs money lent never mix or inflate earned income", async () => {
    const ahmed = await createPerson({ name: "Ahmed" });

    // Gift received -> non-repayable inflow_category='gift', ZERO peer_debts
    const giftIn = await recordGiftTransaction({
      direction: "received",
      amountPaise: 50000,
      personName: "Ahmed",
      date: "2026-11-27",
      note: "Eid gift",
    });
    assert.equal(giftIn.type, "income");
    assert.equal(giftIn.inflow_category, "gift");
    assert.equal(mockState.peerDebts.length, 0);

    // Gift given -> expense, ZERO peer_debts
    const giftOut = await recordGiftTransaction({
      direction: "given",
      amountPaise: 20000,
      personName: "Ahmed",
      date: "2026-11-27",
    });
    assert.equal(giftOut.type, "expense");
    assert.equal(mockState.peerDebts.length, 0);

    // Loan received & lent -> peer_debts ONLY
    await createPeerDebt({ personId: ahmed.id, direction: "you_owe", totalAmountPaise: 100000 });
    await createPeerDebt({ personId: ahmed.id, direction: "they_owe", totalAmountPaise: 40000 });
    assert.equal(mockState.peerDebts.length, 2);

    const bal = calculateConfirmedBalance({
      profile: { workProfile: "delivery", payoutPattern: "weekly", dailyLivingEstimate: 20000, dailyWorkEstimate: 0 },
      latestCheckin: { cash: 100000, bank: 0, notMine: 0, checkedAt: "2020-01-01T00:00:00Z" },
      transactionsSinceCheckin: [
        {
          id: giftIn.id, type: "income", amount: 50000, ownership: "mine",
          expenseType: null, inflowCategory: giftIn.inflow_category, payoutId: null,
          date: giftIn.transaction_date, createdAt: giftIn.created_at,
        },
        {
          id: giftOut.id, type: "expense", amount: 20000, ownership: "mine",
          expenseType: "living", inflowCategory: null, payoutId: null,
          date: giftOut.transaction_date, createdAt: giftOut.created_at,
        },
      ],
      payouts: [],
      commitments: [],
    });
    assert.equal(bal.breakdown?.earnedIncomePaise, 0);
    assert.equal(bal.breakdown?.nonEarnedInflowPaise, 50000);
  });

  it("2. Editing unsettled & partially settled debts recalculates remaining and rejects below settled principal", async () => {
    const ahmed = await createPerson({ name: "Ahmed" });
    const bilal = await createPerson({ name: "Bilal" });

    // Edit unsettled debt
    const debt = await createPeerDebt({
      personId: ahmed.id,
      direction: "they_owe",
      totalAmountPaise: 100000,
      dueDate: "2026-12-01",
      reason: "Initial",
    });
    const editedUnsettled = await updatePeerDebt({
      debtId: debt.id,
      personId: bilal.id,
      totalAmountPaise: 120000,
      dueDate: "2026-12-10",
      reason: "Updated to Bilal",
    });
    assert.equal(editedUnsettled.person_id, bilal.id);
    assert.equal(editedUnsettled.total_amount_paise, 120000);
    assert.equal(editedUnsettled.remaining_amount_paise, 120000);

    // Partial repayment of ₹500
    await recordDebtSettlement(editedUnsettled, { direction: "repayment_in", amountPaise: 50000 });

    // Reject edit below ₹500 settled principal
    await assert.rejects(
      () =>
        updatePeerDebt({
          debtId: debt.id,
          personId: bilal.id,
          totalAmountPaise: 40000,
        }),
      /cannot be less than already settled/
    );

    // Valid edit to ₹800 -> remaining becomes ₹300
    const editedPartial = await updatePeerDebt({
      debtId: debt.id,
      personId: bilal.id,
      totalAmountPaise: 80000,
    });
    assert.equal(editedPartial.total_amount_paise, 80000);
    assert.equal(editedPartial.remaining_amount_paise, 30000);
    assert.equal(editedPartial.status, "partially_settled");
  });

  it("3. Safe deletion blocks debts with repayments, allows unsettled deletion, and reverses repayments cleanly without duplicate reversal", async () => {
    const ahmed = await createPerson({ name: "Ahmed" });
    const d1 = await createPeerDebt({ personId: ahmed.id, direction: "they_owe", totalAmountPaise: 60000 });
    const d2 = await createPeerDebt({ personId: ahmed.id, direction: "you_owe", totalAmountPaise: 30000 });

    // Unsettled debt d2 deletes cleanly
    await deletePeerDebt(d2.id);
    assert.equal(mockState.peerDebts.length, 1);

    // Record repayment on d1 -> deletion must be blocked
    const settlement = await recordDebtSettlement(d1, { direction: "repayment_in", amountPaise: 60000 });
    assert.equal(mockState.peerDebts[0].remaining_amount_paise, 0);
    assert.equal(mockState.peerDebts[0].status, "settled");

    await assert.rejects(() => deletePeerDebt(d1.id), /Reverse repayments first/);

    // Reverse repayment -> restores ₹600 remaining & active status
    const reversed = await reverseDebtSettlement(settlement.id);
    assert.equal(reversed.id, settlement.id);
    assert.equal(mockState.peerDebts[0].remaining_amount_paise, 60000);
    assert.equal(mockState.peerDebts[0].status, "active");

    // Duplicate reversal must fail
    await assert.rejects(() => reverseDebtSettlement(settlement.id), /already reversed/);

    // Reconciled summaries & overview reflect restored ₹600 receivable
    const summaries = computePeopleSummaries([ahmed], mockState.peerDebts, mockState.debtSettlements);
    assert.equal(summaries[0].netBalancePaise, 60000);
    const overview = computeMoneyOverview([ahmed], mockState.peerDebts);
    assert.equal(overview.totalToReceivePaise, 60000);
    assert.equal(overview.totalToRepayPaise, 0);
  });
});
