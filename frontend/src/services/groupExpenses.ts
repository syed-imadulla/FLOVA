// =====================================================================
// FLOVA Group Expenses & Shared Settlements Service (Sprint 2.5)
// Single Source of Truth for group bills, splits, and settlements.
// Never duplicates group obligations into peer_debts.
// Records ONLY the user's own share as a consumption expense in transactions.
// =====================================================================

import { supabase, unwrap } from "../lib/supabase";
import { assertPaise } from "../lib/money";
import {
  computeGroupExpenseAccounting,
  type ComputedSplitShare,
} from "../engine/groupSplitEngine";
import type {
  ExpenseGroup,
  ExpenseGroupMember,
  ExpenseType,
  GroupExpense,
  GroupExpenseSplit,
  GroupSettlement,
  GroupSplitType,
  ISODate,
  ISOTimestamp,
  Paise,
  Person,
  SettlementDirection,
} from "../types/contracts";

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  throw new Error("Client UUID generator is unavailable.");
}

function normalizeExpense(row: any): GroupExpense {
  return {
    ...row,
    total_amount_paise: assertPaise(row.total_amount_paise),
    category: row.category || "food",
    expense_type: row.expense_type || "living",
  };
}

function normalizeSplit(row: any): GroupExpenseSplit {
  return {
    ...row,
    share_amount_paise: assertPaise(row.share_amount_paise),
    remaining_amount_paise: assertPaise(row.remaining_amount_paise),
  };
}

function normalizeSettlement(row: any): GroupSettlement {
  return { ...row, amount_paise: assertPaise(row.amount_paise) };
}

export async function listExpenseGroups(): Promise<ExpenseGroup[]> {
  return unwrap(
    await supabase.from("expense_groups").select("*").order("created_at", { ascending: false }),
    "Load groups"
  ) as ExpenseGroup[];
}

export async function createExpenseGroup(input: {
  name: string;
  description?: string | null;
  memberPersonIds: string[];
}): Promise<ExpenseGroup> {
  const name = input.name.trim();
  if (!name) throw new Error("Enter a group name.");

  const group = unwrap(
    await supabase
      .from("expense_groups")
      .insert({ name, description: input.description?.trim() || null })
      .select()
      .single(),
    "Create group"
  ) as ExpenseGroup;

  const memberRows = [
    { group_id: group.id, is_self: true, person_id: null },
    ...Array.from(new Set(input.memberPersonIds)).map((pid) => ({
      group_id: group.id,
      is_self: false,
      person_id: pid,
    })),
  ];

  const memRes = await supabase.from("expense_group_members").insert(memberRows).select();
  if (memRes.error) throw new Error(`Add group members failed: ${memRes.error.message}`);

  return group;
}

export async function deleteExpenseGroup(groupId: string): Promise<void> {
  const { error } = await supabase.from("expense_groups").delete().eq("id", groupId);
  if (error) {
    if (error.code === "23503" || error.message?.includes("group_expenses_group_fk")) {
      throw new Error("Cannot delete this group because it has shared expenses.");
    }
    throw new Error(`Delete group failed: ${error.message}`);
  }
}

export async function listGroupMembers(groupId?: string): Promise<ExpenseGroupMember[]> {
  let q = supabase.from("expense_group_members").select("*");
  if (groupId) q = q.eq("group_id", groupId);
  return unwrap(await q, "Load group members") as ExpenseGroupMember[];
}

export async function addGroupMember(groupId: string, personId: string): Promise<ExpenseGroupMember[]> {
  const res = await supabase
    .from("expense_group_members")
    .insert({ group_id: groupId, is_self: false, person_id: personId })
    .select();
  if (res.error) throw new Error(`Add group member failed: ${res.error.message}`);
  return res.data as ExpenseGroupMember[];
}

export async function listGroupExpenses(groupId?: string): Promise<GroupExpense[]> {
  let q = supabase.from("group_expenses").select("*").order("expense_date", { ascending: false });
  if (groupId) q = q.eq("group_id", groupId);
  const rows = unwrap(await q, "Load group expenses") as any[];
  return rows.map(normalizeExpense);
}

export async function listGroupSplits(groupExpenseId?: string): Promise<GroupExpenseSplit[]> {
  let q = supabase.from("group_expense_splits").select("*");
  if (groupExpenseId) q = q.eq("group_expense_id", groupExpenseId);
  const rows = unwrap(await q, "Load group splits") as any[];
  return rows.map(normalizeSplit);
}

export async function listGroupSettlements(splitId?: string): Promise<GroupSettlement[]> {
  let q = supabase.from("group_settlements").select("*").order("settled_at", { ascending: false });
  if (splitId) q = q.eq("group_expense_split_id", splitId);
  const rows = unwrap(await q, "Load group settlements") as any[];
  return rows.map(normalizeSettlement);
}

export async function recordGroupExpense(input: {
  groupId: string;
  description: string;
  totalAmountPaise: Paise;
  paidBySelf: boolean;
  paidByPersonId: string | null;
  expenseDate: ISODate;
  splitType: GroupSplitType;
  shares: ComputedSplitShare[];
  category?: string;
  expenseType?: ExpenseType;
  note?: string | null;
  idempotencyKey?: string;
  createdAt?: ISOTimestamp;
}): Promise<{ expense: GroupExpense; splits: GroupExpenseSplit[] }> {
  const desc = input.description.trim();
  if (!desc) throw new Error("Enter a description for this shared expense.");

  const category = input.category?.trim() || "food";
  const expenseType: ExpenseType = input.expenseType === "work" ? "work" : "living";

  // Validate accounting & split totals locally before RPC
  computeGroupExpenseAccounting({
    totalAmountPaise: input.totalAmountPaise,
    paidBySelf: input.paidBySelf,
    paidByPersonId: input.paidByPersonId,
    shares: input.shares,
  });

  const idempotencyKey = input.idempotencyKey?.trim() || generateId();
  const payload = {
    p_group_id: input.groupId,
    p_description: desc,
    p_total_amount_paise: input.totalAmountPaise,
    p_paid_by_self: input.paidBySelf,
    p_paid_by_person_id: input.paidBySelf ? null : input.paidByPersonId,
    p_expense_date: input.expenseDate,
    p_split_type: input.splitType,
    p_splits: input.shares.map((s) => ({
      isSelf: s.isSelf,
      personId: s.isSelf ? null : s.personId,
      shareAmountPaise: s.shareAmountPaise,
    })),
    p_note: input.note?.trim() || null,
    p_idempotency_key: idempotencyKey,
    p_self_category: category,
    p_self_expense_type: expenseType,
    p_created_at: input.createdAt ?? null,
  };

  const rpcRes = await supabase.rpc("record_group_expense_atomic", payload);
  const data = unwrap(rpcRes, "Record group expense") as {
    expense: any;
    splits: any[];
  };

  return {
    expense: normalizeExpense(data.expense),
    splits: (Array.isArray(data.splits) ? data.splits : []).map(normalizeSplit),
  };
}

export async function updateGroupExpense(
  expenseId: string,
  input: {
    description: string;
    totalAmountPaise: Paise;
    paidBySelf: boolean;
    paidByPersonId: string | null;
    expenseDate: ISODate;
    splitType: GroupSplitType;
    shares: ComputedSplitShare[];
    category?: string;
    expenseType?: ExpenseType;
    note?: string | null;
  }
): Promise<{ expense: GroupExpense; splits: GroupExpenseSplit[] }> {
  const desc = input.description.trim();
  if (!desc) throw new Error("Enter a description for this shared expense.");

  const category = input.category?.trim() || "food";
  const expenseType: ExpenseType = input.expenseType === "work" ? "work" : "living";

  // Validate accounting & split totals locally before RPC
  computeGroupExpenseAccounting({
    totalAmountPaise: input.totalAmountPaise,
    paidBySelf: input.paidBySelf,
    paidByPersonId: input.paidByPersonId,
    shares: input.shares,
  });

  const payload = {
    p_expense_id: expenseId,
    p_description: desc,
    p_total_amount_paise: input.totalAmountPaise,
    p_paid_by_self: input.paidBySelf,
    p_paid_by_person_id: input.paidBySelf ? null : input.paidByPersonId,
    p_expense_date: input.expenseDate,
    p_split_type: input.splitType,
    p_splits: input.shares.map((s) => ({
      isSelf: s.isSelf,
      personId: s.isSelf ? null : s.personId,
      shareAmountPaise: s.shareAmountPaise,
    })),
    p_note: input.note?.trim() || null,
    p_self_category: category,
    p_self_expense_type: expenseType,
  };

  const rpcRes = await supabase.rpc("update_group_expense_atomic", payload);
  const data = unwrap(rpcRes, "Update group expense") as {
    expense: any;
    splits: any[];
  };

  return {
    expense: normalizeExpense(data.expense),
    splits: (Array.isArray(data.splits) ? data.splits : []).map(normalizeSplit),
  };
}

export async function deleteGroupExpense(expenseId: string): Promise<void> {
  const rpcRes = await supabase.rpc("delete_group_expense_safe", {
    p_expense_id: expenseId,
  });
  if (rpcRes.error) {
    throw new Error(rpcRes.error.message || "Delete group expense failed");
  }
}

export async function reverseGroupSettlement(settlementId: string): Promise<void> {
  const res = await supabase
    .from("group_settlements")
    .delete()
    .eq("id", settlementId)
    .select();

  if (res.error) {
    throw new Error(`Reverse group settlement failed: ${res.error.message}`);
  }
  if (!res.data || res.data.length === 0) {
    throw new Error("This settlement has already been reversed or does not exist.");
  }
}

export async function recordGroupSettlement(
  split: GroupExpenseSplit,
  input: {
    id?: string;
    direction: SettlementDirection;
    amountPaise: Paise;
    settledAt?: ISOTimestamp;
    notes?: string | null;
  }
): Promise<GroupSettlement> {
  if (split.direction !== "they_owe" && split.direction !== "you_owe") {
    throw new Error("This split does not require settlement.");
  }
  const expectedDir: SettlementDirection = split.direction === "you_owe" ? "repayment_out" : "repayment_in";
  if (input.direction !== expectedDir) {
    throw new Error(`Invalid settlement direction '${input.direction}'. Expected '${expectedDir}'.`);
  }
  if (!Number.isSafeInteger(input.amountPaise) || input.amountPaise <= 0) {
    throw new Error("Settlement amount must be greater than ₹0.");
  }
  if (input.amountPaise > split.remaining_amount_paise) {
    throw new Error(`Overpayment rejected: exceeds remaining ${split.remaining_amount_paise} paise.`);
  }

  const id = input.id || generateId();
  const res = await supabase
    .from("group_settlements")
    .insert({
      id,
      group_expense_split_id: split.id,
      direction: input.direction,
      amount_paise: input.amountPaise,
      notes: input.notes?.trim() || null,
      ...(input.settledAt ? { settled_at: input.settledAt } : {}),
    })
    .select()
    .single();

  if (res.error && (res.error.code === "23505" || res.error.message?.includes("23505"))) {
    const { data: existing } = await supabase.from("group_settlements").select("*").eq("id", id).maybeSingle();
    if (existing) return normalizeSettlement(existing);
  }

  return normalizeSettlement(unwrap(res, "Record group settlement"));
}

export interface GroupMemberBalance {
  isSelf: boolean;
  personId: string | null;
  name: string;
  totalPaidPaise: Paise;
  totalSharePaise: Paise;
  /** Positive = they owe you; Negative = you owe them */
  netBalanceWithYouPaise: number;
}

export function computeGroupBalances(
  members: ExpenseGroupMember[],
  expenses: GroupExpense[],
  splits: GroupExpenseSplit[],
  people: Person[]
): GroupMemberBalance[] {
  const nameById = new Map(people.map((p) => [p.id, p.name]));
  const expIds = new Set(expenses.map((e) => e.id));
  const grpSplits = splits.filter((s) => expIds.has(s.group_expense_id));

  return members.map((m) => {
    const name = m.is_self ? "You" : nameById.get(m.person_id ?? "") ?? "Member";
    const totalPaidPaise = expenses
      .filter((e) => (m.is_self ? e.paid_by_self : !e.paid_by_self && e.paid_by_person_id === m.person_id))
      .reduce((acc, e) => acc + e.total_amount_paise, 0);

    const totalSharePaise = grpSplits
      .filter((s) => (m.is_self ? s.is_self : !s.is_self && s.person_id === m.person_id))
      .reduce((acc, s) => acc + s.share_amount_paise, 0);

    let netBalanceWithYouPaise = 0;
    if (!m.is_self && m.person_id) {
      const theyOweYou = grpSplits
        .filter((s) => s.person_id === m.person_id && s.direction === "they_owe" && s.status !== "settled")
        .reduce((acc, s) => acc + s.remaining_amount_paise, 0);

      const youOweThem = grpSplits
        .filter((s) => {
          if (s.direction !== "you_owe" || s.status === "settled") return false;
          const exp = expenses.find((e) => e.id === s.group_expense_id);
          return exp && !exp.paid_by_self && exp.paid_by_person_id === m.person_id;
        })
        .reduce((acc, s) => acc + s.remaining_amount_paise, 0);

      netBalanceWithYouPaise = theyOweYou - youOweThem;
    }

    return {
      isSelf: m.is_self,
      personId: m.person_id,
      name,
      totalPaidPaise,
      totalSharePaise,
      netBalanceWithYouPaise,
    };
  });
}
