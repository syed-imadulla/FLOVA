// =====================================================================
// FLOVA Sprint 2 — People & Money Management Service Tests
// Covers all 14 required test scenarios in Phase 9.
// =====================================================================

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { mockState, resetMockState } from "./mockSupabase";
import {
  computeMoneyOverview,
  computePeopleSummaries,
  createPeerDebt,
  createPerson,
  deletePerson,
  listDebtSettlements,
  listPeerDebts,
  listPeople,
  queryPeopleAndMoney,
  recordDebtSettlement,
  updatePerson,
} from "../peerDebts";
import { addTransaction, loadRunwayInput } from "../data";
import { calculateDailyRunway } from "../../engine/runway";

describe("Sprint 2: People & Money Management Service Tests", () => {
  beforeEach(() => {
    resetMockState();
    mockState.profile = {
      id: "test-user-id",
      work_profile: "delivery",
      payout_pattern: "weekly",
      income_variability: "variable",
      handles_cod: false,
      daily_living_estimate: "200.00",
      daily_work_estimate: "0.00",
      safe_runway_buffer: "1000.00",
    };
    mockState.balanceCheckins.push({
      id: "chk-1",
      user_id: "test-user-id",
      cash_amount: "5000.00",
      bank_amount: "5000.00",
      not_mine_amount: "0.00",
      note: null,
      checked_at: "2026-11-20T08:00:00Z",
      created_at: "2026-11-20T08:00:00Z",
    });
  });

  it("1 & 12: creates and edits a person (without phone) and supports people with zero outstanding debts", async () => {
    const ahmed = await createPerson({ name: "Ahmed" });
    assert.equal(ahmed.name, "Ahmed");
    assert.equal(ahmed.phone, null);

    const updated = await updatePerson(ahmed.id, { phone: "9876543210", relationship: "Friend" });
    assert.equal(updated.phone, "9876543210");

    const summaries = computePeopleSummaries([updated], [], []);
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0].netBalancePaise, 0);
    assert.equal(summaries[0].statusLabel, "No pending balance");
  });

  it("2 & 3: creates borrowing and lending records without duplicating transactions", async () => {
    const ahmed = await createPerson({ name: "Ahmed" });
    const borrow = await createPeerDebt({
      personId: ahmed.id,
      direction: "you_owe",
      totalAmountPaise: 200000, // ₹2,000
      dueDate: "2026-12-20",
      createdAt: "2026-11-20T10:00:00Z",
    });
    const lend = await createPeerDebt({
      personId: ahmed.id,
      direction: "they_owe",
      totalAmountPaise: 100000, // ₹1,000
      createdAt: "2026-11-20T11:00:00Z",
    });

    assert.equal(borrow.remaining_amount_paise, 200000);
    assert.equal(lend.remaining_amount_paise, 100000);
    assert.equal(mockState.transactions.length, 0);
    assert.equal(mockState.commitments.length, 0);

    // Deleting person with dependent debts is blocked
    await assert.rejects(() => deletePerson(ahmed.id), /Cannot delete this person/);
  });

  it("4, 5, 6 & 7: supports partial, multiple, and full repayments with accurate remaining balances", async () => {
    const ahmed = await createPerson({ name: "Ahmed" });
    const lend = await createPeerDebt({
      personId: ahmed.id,
      direction: "they_owe",
      totalAmountPaise: 100000, // ₹1,000
      createdAt: "2026-11-20T09:00:00Z",
    });

    // Partial repayment ₹400
    await recordDebtSettlement(lend, {
      direction: "repayment_in",
      amountPaise: 40000,
      settledAt: "2026-11-20T10:00:00Z",
    });
    let [current] = await listPeerDebts();
    assert.equal(current.remaining_amount_paise, 60000);
    assert.equal(current.status, "partially_settled");

    // Second partial repayment ₹600 -> full settlement
    await recordDebtSettlement(current, {
      direction: "repayment_in",
      amountPaise: 60000,
      settledAt: "2026-11-20T11:00:00Z",
    });
    [current] = await listPeerDebts();
    assert.equal(current.remaining_amount_paise, 0);
    assert.equal(current.status, "settled");

    const settlements = await listDebtSettlements(lend.id);
    assert.equal(settlements.length, 2);

    const overview = computeMoneyOverview([ahmed], [current]);
    assert.equal(overview.totalToReceivePaise, 0);
    assert.equal(overview.totalReceivedPaise, 100000);
  });

  it("8 & 9: rejects wrong repayment direction and overpayment", async () => {
    const safiya = await createPerson({ name: "Safiya" });
    const debt = await createPeerDebt({
      personId: safiya.id,
      direction: "you_owe",
      totalAmountPaise: 50000,
    });

    await assert.rejects(
      () => recordDebtSettlement(debt, { direction: "repayment_in", amountPaise: 10000 }),
      /Invalid settlement direction/
    );
    await assert.rejects(
      () => recordDebtSettlement(debt, { direction: "repayment_out", amountPaise: 50001 }),
      /Over-settlement rejected/
    );
  });

  it("10: prevents duplicate settlement submissions with the same client UUID", async () => {
    const ahmed = await createPerson({ name: "Ahmed" });
    const debt = await createPeerDebt({
      personId: ahmed.id,
      direction: "they_owe",
      totalAmountPaise: 100000,
    });

    const settleId = "11111111-2222-3333-4444-555555555555";
    await recordDebtSettlement(debt, {
      id: settleId,
      direction: "repayment_in",
      amountPaise: 40000,
    });
    // Retry with same id and stale debt snapshot -> returns existing row, remaining stays 60000
    await recordDebtSettlement(debt, {
      id: settleId,
      direction: "repayment_in",
      amountPaise: 40000,
    });

    const [updated] = await listPeerDebts();
    assert.equal(updated.remaining_amount_paise, 60000);
    assert.equal(mockState.debtSettlements.length, 1);
  });

  it("11: enforces user data isolation between users", async () => {
    mockState.activeUserId = "user-a";
    const pA = await createPerson({ name: "User A Friend" });
    await createPeerDebt({ personId: pA.id, direction: "they_owe", totalAmountPaise: 50000 });

    mockState.activeUserId = "user-b";
    const peopleB = await listPeople();
    const debtsB = await listPeerDebts();
    assert.equal(peopleB.length, 0);
    assert.equal(debtsB.length, 0);
  });

  it("13 & 14: preserves v1.0.1 transactions and updates Available Liquidity & Sustainable Capital after settlements", async () => {
    // Legacy v1.0.1 earned income ₹1,000
    await addTransaction({
      type: "income",
      amount: 100000,
      category: "earnings",
      date: "2026-11-20",
    });

    const ahmed = await createPerson({ name: "Ahmed" });
    const debt = await createPeerDebt({
      personId: ahmed.id,
      direction: "you_owe",
      totalAmountPaise: 500000, // borrow ₹5,000 due in 60 days
      dueDate: "2027-01-20",
      createdAt: "2026-11-20T10:00:00Z",
    });

    // Partial repayment of ₹2,000
    await recordDebtSettlement(debt, {
      direction: "repayment_out",
      amountPaise: 200000,
      settledAt: "2026-11-20T12:00:00Z",
    });

    const runwayInput = await loadRunwayInput();
    const res = calculateDailyRunway({ ...runwayInput, horizonDays: 30, startDate: "2026-11-20" });
    // Cash: ₹10,000 + ₹1,000 (v1 income) + ₹5,000 (borrow) - ₹2,000 (repay) = ₹14,000
    assert.equal(res.startingConfirmedBalancePaise, 1400000);
    // Available Liquidity: ₹14,000 - ₹1,000 buffer = ₹13,000
    assert.equal(res.availableLiquidityPaise, 1300000);
    // Remaining liability: ₹3,000 -> Sustainable Capital: ₹14,000 - ₹3,000 - ₹1,000 buffer = ₹10,000
    assert.equal(res.sustainableCapitalPaise, 1000000);

    // Phase 7 Voice query prep check
    const people = await listPeople();
    const debts = await listPeerDebts();
    const settlements = await listDebtSettlements();
    const vq = queryPeopleAndMoney("How much do I owe Ahmed?", people, debts, settlements);
    assert.equal(vq.intent, "person_balance");
    assert.equal(vq.payablePaise, 300000);
  });
});
