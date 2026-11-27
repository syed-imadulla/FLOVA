// =====================================================================
// FLOVA 2.0 | Sprint 4B — Schema, Storage & Atomic Group RPC Tests
// =====================================================================

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, it } from "node:test";
import { mockState, resetMockState } from "./mockSupabase";
import { createPerson } from "../peerDebts";
import { createExpenseGroup, recordGroupExpense } from "../groupExpenses";
import { splitEqual } from "../../engine/groupSplitEngine";

const here = path.dirname(fileURLToPath(import.meta.url));
const sprint4bMigrationPath = path.resolve(
  here,
  "../../../../backend/supabase/migrations/20261127000100_sprint_4b_schema_and_atomic_group_rpc.sql"
);

describe("Sprint 4B: Schema, Private Receipt Storage & Atomic Group Expense RPC", () => {
  beforeEach(() => {
    resetMockState();
  });

  it("1. Migration defines private receipts bucket, user-scoped storage RLS, and nullable transaction columns", () => {
    const sql = fs.readFileSync(sprint4bMigrationPath, "utf-8");
    assert.match(sql, /add column if not exists payment_method text/i);
    assert.match(sql, /payment_method is null or payment_method in \('cash', 'bank', 'upi'\)/i);
    assert.match(sql, /add column if not exists receipt_path text/i);
    assert.match(sql, /insert into storage\.buckets[\s\S]*'receipts'[\s\S]*false/i);
    assert.match(sql, /storage\.foldername\(name\)\)\[1\] = \(select auth\.uid\(\)\)::text/i);
    assert.match(sql, /security definer\s+set search_path = ''/i);
    assert.match(sql, /grant execute on function public\.record_group_expense_atomic[\s\S]*to authenticated/i);
  });

  it("2. Atomic group expense rolls back completely on invalid participant (zero orphan transactions or expenses)", async () => {
    const ahmed = await createPerson({ name: "Ahmed" });
    const outsider = await createPerson({ name: "Outsider" });
    const grp = await createExpenseGroup({ name: "Trip", memberPersonIds: [ahmed.id] });

    await assert.rejects(
      () =>
        recordGroupExpense({
          groupId: grp.id,
          description: "Taxi",
          totalAmountPaise: 10000,
          paidBySelf: true,
          paidByPersonId: null,
          expenseDate: "2026-11-27",
          splitType: "equal",
          shares: [
            { isSelf: true, personId: null, shareAmountPaise: 5000 },
            { isSelf: false, personId: outsider.id, shareAmountPaise: 5000 },
          ],
        }),
      /not a member/
    );

    // Zero orphan rows left behind
    assert.equal(mockState.transactions.length, 0);
    assert.equal(mockState.groupExpenses.length, 0);
    assert.equal(mockState.groupExpenseSplits.length, 0);
  });

  it("3. Duplicate submission with same idempotencyKey returns existing records without creating duplicates", async () => {
    const ahmed = await createPerson({ name: "Ahmed" });
    const grp = await createExpenseGroup({ name: "Lunch", memberPersonIds: [ahmed.id] });
    const shares = splitEqual(60000, [
      { isSelf: true, personId: null },
      { isSelf: false, personId: ahmed.id },
    ]);

    const first = await recordGroupExpense({
      groupId: grp.id,
      description: "Biryani",
      totalAmountPaise: 60000,
      paidBySelf: true,
      paidByPersonId: null,
      expenseDate: "2026-11-27",
      splitType: "equal",
      shares,
      idempotencyKey: "idem-sprint4b-1",
    });

    const second = await recordGroupExpense({
      groupId: grp.id,
      description: "Biryani",
      totalAmountPaise: 60000,
      paidBySelf: true,
      paidByPersonId: null,
      expenseDate: "2026-11-27",
      splitType: "equal",
      shares,
      idempotencyKey: "idem-sprint4b-1",
    });

    assert.equal(second.expense.id, first.expense.id);
    assert.equal(mockState.transactions.length, 1);
    assert.equal(mockState.groupExpenses.length, 1);
    assert.equal(mockState.groupExpenseSplits.length, 2);

    // Conflicting details with same idempotencyKey must fail
    await assert.rejects(
      () =>
        recordGroupExpense({
          groupId: grp.id,
          description: "Biryani",
          totalAmountPaise: 80000,
          paidBySelf: true,
          paidByPersonId: null,
          expenseDate: "2026-11-27",
          splitType: "equal",
          shares: splitEqual(80000, [
            { isSelf: true, personId: null },
            { isSelf: false, personId: ahmed.id },
          ]),
          idempotencyKey: "idem-sprint4b-1",
        }),
      /Idempotency key conflict/
    );
  });
});
