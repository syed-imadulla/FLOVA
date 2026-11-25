// =====================================================================
// FLOVA Sprint 2.5 — Group Expenses & Shared Settlements Integration Tests
// =====================================================================

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { mockState, resetMockState } from "./mockSupabase";
import { createPerson, computeMoneyOverview, computePeopleSummaries } from "../peerDebts";
import {
  createExpenseGroup,
  deleteExpenseGroup,
  listExpenseGroups,
  listGroupSplits,
  recordGroupExpense,
  recordGroupSettlement,
} from "../groupExpenses";
import { splitEqual } from "../../engine/groupSplitEngine";
import { loadRunwayInput } from "../data";
import { calculateDailyRunway } from "../../engine/runway";

describe("Sprint 2.5: Group Expenses & Shared Settlements", () => {
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

  it("user pays ₹1,200 for 4 friends: records ₹300 own expense, ₹900 receivables, no peer_debts duplication, and blocks group deletion", async () => {
    const ahmed = await createPerson({ name: "Ahmed" });
    const bilal = await createPerson({ name: "Bilal" });
    const sara = await createPerson({ name: "Sara" });

    const grp = await createExpenseGroup({
      name: "Dinner",
      memberPersonIds: [ahmed.id, bilal.id, sara.id],
    });

    const shares = splitEqual(120000, [
      { isSelf: true, personId: null },
      { isSelf: false, personId: ahmed.id },
      { isSelf: false, personId: bilal.id },
      { isSelf: false, personId: sara.id },
    ]);

    const { expense, splits } = await recordGroupExpense({
      groupId: grp.id,
      description: "Restaurant bill",
      totalAmountPaise: 120000,
      paidBySelf: true,
      paidByPersonId: null,
      expenseDate: "2026-11-20",
      splitType: "equal",
      shares,
      createdAt: "2026-11-20T12:00:00Z",
    });

    // Only ₹300 own share recorded in transactions
    assert.equal(mockState.transactions.length, 1);
    assert.equal(mockState.transactions[0].amount, "300.00");
    // Zero peer_debts duplication
    assert.equal(mockState.peerDebts.length, 0);

    // Deleting group with expenses is blocked
    await assert.rejects(() => deleteExpenseGroup(expense.group_id), /Cannot delete this group/);

    // Runway & liquidity: ₹10,000 - ₹1,200 cash paid = ₹8,800; Available Liquidity = ₹7,800 (₹900 receivable NOT in cash!)
    const runwayInput = await loadRunwayInput();
    const res = calculateDailyRunway({ ...runwayInput, horizonDays: 30, startDate: "2026-11-20" });
    assert.equal(res.startingConfirmedBalancePaise, 880000);
    assert.equal(res.availableLiquidityPaise, 780000);
    assert.equal(res.peerReceivablePaise, 90000);

    // People & Money overview distinguish group receivables without double-counting
    const overview = computeMoneyOverview([ahmed, bilal, sara], [], splits);
    assert.equal(overview.personalToReceivePaise, 0);
    assert.equal(overview.groupToReceivePaise, 90000);
    assert.equal(overview.totalToReceivePaise, 90000);

    const summaries = computePeopleSummaries([ahmed, bilal, sara], [], [], splits, []);
    assert.equal(summaries[0].receivableRemainingPaise, 30000);
  });

  it("another participant pays ₹1,200: records ₹300 own expense, ₹300 liability, ₹0 Day-1 cash change, and settles cleanly", async () => {
    const ahmed = await createPerson({ name: "Ahmed" });
    const bilal = await createPerson({ name: "Bilal" });
    const sara = await createPerson({ name: "Sara" });

    const grp = await createExpenseGroup({
      name: "Lunch",
      memberPersonIds: [ahmed.id, bilal.id, sara.id],
    });

    const shares = splitEqual(120000, [
      { isSelf: true, personId: null },
      { isSelf: false, personId: ahmed.id },
      { isSelf: false, personId: bilal.id },
      { isSelf: false, personId: sara.id },
    ]);

    const { splits } = await recordGroupExpense({
      groupId: grp.id,
      description: "Team lunch",
      totalAmountPaise: 120000,
      paidBySelf: false,
      paidByPersonId: ahmed.id,
      expenseDate: "2026-11-20",
      splitType: "equal",
      shares,
      createdAt: "2026-11-20T12:00:00Z",
    });

    // Day-1 cash change is ₹0 (₹10,000 intact); Sustainable Capital drops by ₹300 liability!
    let runwayInput = await loadRunwayInput();
    let res = calculateDailyRunway({ ...runwayInput, horizonDays: 30, startDate: "2026-11-20" });
    assert.equal(res.startingConfirmedBalancePaise, 1000000);
    assert.equal(res.availableLiquidityPaise, 900000);
    assert.equal(res.sustainableCapitalPaise, 870000); // ₹10,000 - ₹300 group liability - ₹1,000 buffer

    const selfSplit = splits.find((s) => s.is_self)!;

    // Overpayment and wrong direction rejected
    await assert.rejects(
      () => recordGroupSettlement(selfSplit, { direction: "repayment_in", amountPaise: 10000 }),
      /Invalid settlement direction/
    );
    await assert.rejects(
      () => recordGroupSettlement(selfSplit, { direction: "repayment_out", amountPaise: 30001 }),
      /Overpayment rejected/
    );

    // Partial settlement ₹100 + duplicate retry with same UUID
    const settleId = "99999999-1111-1111-1111-111111111111";
    await recordGroupSettlement(selfSplit, {
      id: settleId,
      direction: "repayment_out",
      amountPaise: 10000,
      settledAt: "2026-11-20T13:00:00Z",
    });
    await recordGroupSettlement(selfSplit, {
      id: settleId,
      direction: "repayment_out",
      amountPaise: 10000,
    });

    const updatedSplits = await listGroupSplits();
    const updatedSelf = updatedSplits.find((s) => s.id === selfSplit.id)!;
    assert.equal(updatedSelf.remaining_amount_paise, 20000);
    assert.equal(updatedSelf.status, "partially_settled");

    // Full remaining settlement ₹200
    await recordGroupSettlement(updatedSelf, {
      direction: "repayment_out",
      amountPaise: 20000,
      settledAt: "2026-11-20T14:00:00Z",
    });

    runwayInput = await loadRunwayInput();
    res = calculateDailyRunway({ ...runwayInput, horizonDays: 30, startDate: "2026-11-20" });
    // Cash: ₹10,000 - ₹300 repaid = ₹9,700; Liability: ₹0; Sustainable Capital: ₹9,700 - ₹1,000 = ₹8,700
    assert.equal(res.startingConfirmedBalancePaise, 970000);
    assert.equal(res.sustainableCapitalPaise, 870000);
  });

  it("enforces cross-user isolation on groups", async () => {
    mockState.activeUserId = "user-a";
    const pA = await createPerson({ name: "Friend A" });
    await createExpenseGroup({ name: "Group A", memberPersonIds: [pA.id] });

    mockState.activeUserId = "user-b";
    const groupsB = await listExpenseGroups();
    assert.equal(groupsB.length, 0);
  });
});
