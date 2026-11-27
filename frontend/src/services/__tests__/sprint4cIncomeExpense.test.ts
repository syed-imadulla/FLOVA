// =====================================================================
// FLOVA 2.0 | Sprint 4C — Income & Expense Completeness Tests
// Covers inflow_category, payment_method, historical null preservation,
// edit preservation, earned vs non-earned segregation, and timeline mapping.
// =====================================================================

import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { mockState, resetMockState } from "./mockSupabase";
import { addTransaction, listActivityTimeline, updateTransaction } from "../data";
import { calculateConfirmedBalance } from "../../engine/balance";

describe("Sprint 4C: Income & Expense Completeness", () => {
  beforeEach(() => {
    resetMockState();
  });

  it("1. Creates income with inflow_category & payment_method and segregates earned vs non-earned income", async () => {
    const earnedTx = await addTransaction({
      type: "income",
      amount: 120000,
      category: "delivery_earnings",
      inflowCategory: "earned",
      paymentMethod: "upi",
      date: "2026-11-27",
    });
    const giftTx = await addTransaction({
      type: "income",
      amount: 50000,
      category: "other",
      inflowCategory: "gift",
      paymentMethod: "cash",
      date: "2026-11-27",
    });
    const donationTx = await addTransaction({
      type: "income",
      amount: 30000,
      category: "other",
      inflowCategory: "donation",
      paymentMethod: "bank",
      date: "2026-11-27",
    });

    assert.equal(earnedTx.inflow_category, "earned");
    assert.equal(earnedTx.payment_method, "upi");
    assert.equal(giftTx.inflow_category, "gift");
    assert.equal(giftTx.payment_method, "cash");
    assert.equal(donationTx.inflow_category, "donation");
    assert.equal(donationTx.payment_method, "bank");

    const bal = calculateConfirmedBalance({
      profile: {
        workProfile: "delivery",
        payoutPattern: "weekly",
        dailyLivingEstimate: 20000,
        dailyWorkEstimate: 10000,
      },
      latestCheckin: {
        cash: 100000,
        bank: 100000,
        notMine: 0,
        checkedAt: "2020-01-01T00:00:00Z",
      },
      transactionsSinceCheckin: [
        {
          id: earnedTx.id,
          type: "income",
          amount: 120000,
          ownership: "mine",
          expenseType: null,
          inflowCategory: earnedTx.inflow_category,
          payoutId: null,
          date: earnedTx.transaction_date,
          createdAt: earnedTx.created_at,
        },
        {
          id: giftTx.id,
          type: "income",
          amount: 50000,
          ownership: "mine",
          expenseType: null,
          inflowCategory: giftTx.inflow_category,
          payoutId: null,
          date: giftTx.transaction_date,
          createdAt: giftTx.created_at,
        },
        {
          id: donationTx.id,
          type: "income",
          amount: 30000,
          ownership: "mine",
          expenseType: null,
          inflowCategory: donationTx.inflow_category,
          payoutId: null,
          date: donationTx.transaction_date,
          createdAt: donationTx.created_at,
        },
      ],
      payouts: [],
      commitments: [],
    });

    assert.equal(bal.status, "CONFIRMED");
    assert.equal(bal.confirmedBalancePaise, 400000);
    assert.equal(bal.breakdown?.confirmedIncomePaise, 200000);
    assert.equal(bal.breakdown?.earnedIncomePaise, 120000);
    assert.equal(bal.breakdown?.nonEarnedInflowPaise, 80000);
  });

  it("2. Editing preserves inflow_category, payment_method, and receipt_path when omitted and updates when changed", async () => {
    const created = await addTransaction({
      type: "income",
      amount: 80000,
      category: "other",
      inflowCategory: "family_support",
      paymentMethod: "bank",
      receiptPath: "user-1/slip.png",
      date: "2026-11-27",
    });

    // Update note only — must preserve inflow_category, payment_method, and receipt_path
    const afterNote = await updateTransaction(created.id, {
      type: "income",
      description: "From parents",
    });
    assert.equal(afterNote.inflow_category, "family_support");
    assert.equal(afterNote.payment_method, "bank");
    assert.equal(afterNote.receipt_path, "user-1/slip.png");

    // Update inflowCategory & paymentMethod explicitly
    const afterChange = await updateTransaction(created.id, {
      type: "income",
      inflowCategory: "pocket_money",
      paymentMethod: "upi",
    });
    assert.equal(afterChange.inflow_category, "pocket_money");
    assert.equal(afterChange.payment_method, "upi");

    // Switching to expense clears inflow_category while preserving payment_method
    const afterSwitch = await updateTransaction(created.id, {
      type: "expense",
      expenseType: "living",
      ownership: "mine",
      paymentMethod: "upi",
    });
    assert.equal(afterSwitch.inflow_category, null);
    assert.equal(afterSwitch.payment_method, "upi");
  });

  it("3. Historical transactions without payment_method remain null and surface cleanly in Activity timeline", async () => {
    mockState.transactions.push({
      id: "hist-tx-1",
      user_id: "test-user-id",
      type: "expense",
      amount: "150.00",
      category: "food",
      description: "Legacy lunch",
      expense_type: "living",
      inflow_category: null,
      payment_method: null,
      receipt_path: null,
      ownership: "mine",
      payout_id: null,
      transaction_date: "2026-11-20",
      source: "manual",
      created_at: "2026-11-20T12:00:00Z",
      updated_at: "2026-11-20T12:00:00Z",
    });

    const newTx = await addTransaction({
      type: "expense",
      amount: 25000,
      category: "fuel",
      expenseType: "work",
      paymentMethod: "cash",
      date: "2026-11-27",
    });

    assert.equal(newTx.payment_method, "cash");

    const timeline = await listActivityTimeline({ limit: 10 });
    const histItem = timeline.find((i) => i.id === "hist-tx-1");
    const newItem = timeline.find((i) => i.id === newTx.id);

    assert.equal(histItem?.paymentMethod, null);
    assert.equal(newItem?.paymentMethod, "cash");
  });
});
