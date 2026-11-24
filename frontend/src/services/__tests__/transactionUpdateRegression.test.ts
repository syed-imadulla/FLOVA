import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { addTransaction, updateTransaction, listTransactions } from "../data";
import { toPaise } from "../../lib/money";
import { resetMockState } from "./mockSupabase";
import { calculateConfirmedBalance } from "../../engine/balance";
import type { RunwayInput } from "../../types/contracts";

describe("Transaction Update & Check Constraint (expense_type_rule) Regression Tests", () => {
  beforeEach(() => {
    resetMockState();
  });

  it("1. Edits and saves personal income transaction with Work earnings, note, and null expenseType", async () => {
    // Initial income transaction
    const initial = await addTransaction({
      type: "income",
      amount: 5000, // ₹50.00
      category: "other",
      description: "initial notes",
      ownership: "mine",
      date: "2026-11-20",
    });

    assert.equal(initial.type, "income");
    assert.equal(initial.expense_type, null);

    // Update transaction to details matching user bug report:
    // Amount: ₹100 (10000 paise), Category: Work earnings ("earnings"), Date: 2026-11-24, Note: "for my pocket"
    const updated = await updateTransaction(initial.id, {
      type: "income",
      amount: 10000,
      category: "earnings",
      description: "for my pocket",
      ownership: "mine",
      date: "2026-11-24",
    });

    assert.equal(updated.amount, "100.00");
    assert.equal(updated.category, "earnings");
    assert.equal(updated.description, "for my pocket");
    assert.equal(updated.transaction_date, "2026-11-24");
    assert.equal(updated.expense_type, null, "expense_type must remain null for personal income");
    assert.equal(updated.ownership, "mine");
  });

  it("2. Converts existing expense to income: automatically clears expense_type to null and avoids check constraint violation", async () => {
    // Create an existing expense (which has expense_type = 'work')
    const expense = await addTransaction({
      type: "expense",
      amount: 12000, // ₹120
      category: "fuel",
      expenseType: "work",
      ownership: "mine",
      description: "petrol for bike",
      date: "2026-11-23",
    });

    assert.equal(expense.type, "expense");
    assert.equal(expense.expense_type, "work");

    // Edit transaction in Activity screen to convert to Income
    const converted = await updateTransaction(expense.id, {
      type: "income",
      amount: 10000,
      category: "earnings",
      description: "for my pocket",
      ownership: "mine",
      date: "2026-11-24",
    });

    assert.equal(converted.type, "income");
    assert.equal(converted.amount, "100.00");
    assert.equal(converted.category, "earnings");
    assert.equal(converted.expense_type, null, "expense_type must be cleared to null when converting expense to income");
  });

  it("3. Converts existing income to expense: validates and updates expense_type correctly", async () => {
    const income = await addTransaction({
      type: "income",
      amount: 8000,
      category: "earnings",
      ownership: "mine",
      date: "2026-11-24",
    });

    // Update to expense with valid expenseType
    const convertedExpense = await updateTransaction(income.id, {
      type: "expense",
      amount: 8000,
      category: "food",
      expenseType: "living",
      ownership: "mine",
      date: "2026-11-24",
    });

    assert.equal(convertedExpense.type, "expense");
    assert.equal(convertedExpense.expense_type, "living");
  });

  it("4. Edits notes (clearing a note to empty string / null)", async () => {
    const tx = await addTransaction({
      type: "income",
      amount: 4000,
      category: "tips",
      description: "customer tip from Swiggy",
      ownership: "mine",
      date: "2026-11-24",
    });

    assert.equal(tx.description, "customer tip from Swiggy");

    // Clear note
    const clearedNoteTx = await updateTransaction(tx.id, {
      description: null,
    });

    assert.equal(clearedNoteTx.description, null, "Note must be clearable to null");
  });

  it("5. Edits not_mine transaction: preserves not_mine ownership and enforces null expense_type and null payout_id", async () => {
    const codTx = await addTransaction({
      type: "income",
      amount: 50000, // ₹500
      category: "business_sales",
      ownership: "not_mine",
      date: "2026-11-24",
    });

    assert.equal(codTx.ownership, "not_mine");
    assert.equal(codTx.expense_type, null);

    const updatedCod = await updateTransaction(codTx.id, {
      amount: 60000, // ₹600
      category: "other",
      ownership: "not_mine",
      description: "collected COD from customer",
    });

    assert.equal(updatedCod.amount, "600.00");
    assert.equal(updatedCod.ownership, "not_mine");
    assert.equal(updatedCod.expense_type, null, "Third-party transactions must strictly keep expense_type null");
  });

  it("6. Rejects invalid expense-specific fields when updated as income or not_mine", async () => {
    const tx = await addTransaction({
      type: "income",
      amount: 2000,
      category: "earnings",
      ownership: "mine",
      date: "2026-11-24",
    });

    // If an update incorrectly provides expenseType for an income row, updateTransaction must sanitize or reject
    const updated = await updateTransaction(tx.id, {
      type: "income",
      expenseType: "living" as any, // Incompatible field
    });

    assert.equal(updated.expense_type, null, "Income transactions must always enforce null expense_type regardless of payload");
  });

  it("7. Financial balances remain deterministic and correct in integer paise before and after updates", async () => {
    // 1. Initial income of ₹1,000 (100000 paise)
    const tx1 = await addTransaction({
      type: "income",
      amount: 100000,
      category: "salary",
      ownership: "mine",
      date: "2026-11-20",
    });

    // 2. Initial expense of ₹200 (20000 paise)
    const tx2 = await addTransaction({
      type: "expense",
      amount: 20000,
      category: "fuel",
      expenseType: "work",
      ownership: "mine",
      date: "2026-11-21",
    });

    // 3. COD collection of ₹500 (not mine, must not count towards personal balance)
    const tx3 = await addTransaction({
      type: "income",
      amount: 50000,
      category: "business_sales",
      ownership: "not_mine",
      date: "2026-11-22",
    });

    const checkin = {
      cash: 0,
      bank: 0,
      notMine: 0,
      checkedAt: "2026-11-19T00:00:00.000Z",
    };

    function evaluateBalance(transactions: any[]) {
      const input: RunwayInput = {
        profile: {
          workProfile: "delivery",
          incomeVariability: "variable",
          payoutPattern: "daily",
          handlesCod: true,
          dailyLivingEstimate: null,
          dailyWorkEstimate: null,
          safeRunwayBuffer: 0,
        },
        latestCheckin: checkin,
        transactionsSinceCheckin: transactions.map((t) => ({
          ...t,
          amount: toPaise(t.amount),
          ownership: t.ownership ?? "mine",
          createdAt: "2026-11-25T00:00:00.000Z",
        })),
        payouts: [],
        commitments: [],
      };
      const res = calculateConfirmedBalance(input);
      return res.confirmedBalancePaise;
    }

    let allTxs = await listTransactions();
    let balance = evaluateBalance(allTxs);
    // Expected: ₹1,000 - ₹200 = ₹800 (80000 paise)
    assert.equal(balance, 80000, "Initial balance must be ₹800 (80000 paise)");

    // Edit tx1: Change income from ₹1,000 to ₹1,500 (150000 paise)
    await updateTransaction(tx1.id, {
      type: "income",
      amount: 150000,
    });

    // Edit tx2: Change expense from ₹200 to ₹300 (30000 paise)
    await updateTransaction(tx2.id, {
      type: "expense",
      amount: 30000,
      expenseType: "work",
    });

    // Edit tx3: Change COD collection from ₹500 to ₹700 (still not mine)
    await updateTransaction(tx3.id, {
      amount: 70000,
      ownership: "not_mine",
    });

    allTxs = await listTransactions();
    balance = evaluateBalance(allTxs);
    // Expected: ₹1,500 - ₹300 = ₹1,200 (120000 paise). Third-party money continues to be excluded.
    assert.equal(balance, 120000, "Updated balance must strictly reflect ₹1,200 (120000 paise)");
  });
});
