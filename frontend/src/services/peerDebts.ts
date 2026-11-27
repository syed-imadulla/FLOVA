// =====================================================================
// FLOVA People & Peer Debt Service (Sprint 2)
// Pure Supabase CRUD + deterministic integer-paise aggregation & voice prep.
// Never mutates peer_debts.remaining_amount_paise from the frontend;
// database triggers (debt_settlements_apply) are the authoritative source.
// =====================================================================

import { supabase, unwrap } from "../lib/supabase";
import { assertPaise, formatINR } from "../lib/money";
import { addTransaction } from "./data";
import { validateAndApplySettlement, validatePeerDebt } from "../engine/peerDebtEngine";
import type {
  DebtSettlement,
  GroupExpenseSplit,
  GroupSettlement,
  ISODate,
  ISOTimestamp,
  Paise,
  PaymentMethod,
  PeerDebt,
  PeerDebtDirection,
  PeerDebtStatus,
  Person,
  SettlementDirection,
  Transaction,
} from "../types/contracts";

export interface NewPersonInput {
  name: string;
  phone?: string | null;
  upiId?: string | null;
  relationship?: string | null;
}

export interface UpdatePersonInput {
  name?: string;
  phone?: string | null;
  upiId?: string | null;
  relationship?: string | null;
}

export interface NewPeerDebtInput {
  id?: string;
  personId: string;
  direction: PeerDebtDirection;
  totalAmountPaise: Paise;
  dueDate?: ISODate | null;
  reason?: string | null;
  createdAt?: ISOTimestamp;
}

export interface NewDebtSettlementInput {
  id?: string;
  debtId: string;
  direction: SettlementDirection;
  amountPaise: Paise;
  paymentMode?: string | null;
  referenceId?: string | null;
  settledAt?: ISOTimestamp;
  notes?: string | null;
}

export interface PersonFinancialSummary {
  person: Person;
  totalLentPaise: Paise;
  totalBorrowedPaise: Paise;
  totalReceivedPaise: Paise;
  totalRepaidPaise: Paise;
  receivableRemainingPaise: Paise;
  payableRemainingPaise: Paise;
  personalReceivablePaise: Paise;
  personalPayablePaise: Paise;
  groupReceivablePaise: Paise;
  groupPayablePaise: Paise;
  /** Positive = they owe you; Negative = you owe them; Zero = settled */
  netBalancePaise: number;
  statusLabel: string;
  debts: PeerDebt[];
  settlements: DebtSettlement[];
}

export interface MoneyOverview {
  personalToReceivePaise: Paise;
  personalToRepayPaise: Paise;
  groupToReceivePaise: Paise;
  groupToRepayPaise: Paise;
  totalToReceivePaise: Paise;
  totalToRepayPaise: Paise;
  totalOriginalLentPaise: Paise;
  totalOriginalBorrowedPaise: Paise;
  totalReceivedPaise: Paise;
  totalRepaidPaise: Paise;
  receivables: Array<PeerDebt & { personName: string; settledPaise: Paise }>;
  payables: Array<PeerDebt & { personName: string; settledPaise: Paise }>;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  throw new Error("Client UUID generator is unavailable.");
}

// ---------- People CRUD ----------

export async function listPeople(): Promise<Person[]> {
  return unwrap(
    await supabase.from("people").select("*").order("name", { ascending: true }),
    "Load people"
  ) as Person[];
}

export async function createPerson(input: NewPersonInput): Promise<Person> {
  const name = input.name.trim();
  if (!name) throw new Error("Enter the person's name.");
  return unwrap(
    await supabase
      .from("people")
      .insert({
        name,
        phone: input.phone?.trim() || null,
        upi_id: input.upiId?.trim() || null,
        relationship: input.relationship?.trim() || null,
      })
      .select()
      .single(),
    "Add person"
  ) as Person;
}

export async function updatePerson(id: string, patch: UpdatePersonInput): Promise<Person> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    const trimmed = patch.name.trim();
    if (!trimmed) throw new Error("Name cannot be empty.");
    row.name = trimmed;
  }
  if (patch.phone !== undefined) row.phone = patch.phone?.trim() || null;
  if (patch.upiId !== undefined) row.upi_id = patch.upiId?.trim() || null;
  if (patch.relationship !== undefined) row.relationship = patch.relationship?.trim() || null;

  return unwrap(
    await supabase.from("people").update(row).eq("id", id).select().single(),
    "Update person"
  ) as Person;
}

export async function deletePerson(id: string): Promise<void> {
  const { error } = await supabase.from("people").delete().eq("id", id);
  if (error) {
    if (error.code === "23503" || error.message?.includes("peer_debts_person_fk")) {
      throw new Error("Cannot delete this person because borrowing or lending records depend on them.");
    }
    throw new Error(`Delete person failed: ${error.message}`);
  }
}

// ---------- Peer Debts & Settlements ----------

function normalizePeerDebt(row: any): PeerDebt {
  return {
    ...row,
    total_amount_paise: assertPaise(row.total_amount_paise),
    remaining_amount_paise: assertPaise(row.remaining_amount_paise),
  };
}

function normalizeSettlement(row: any): DebtSettlement {
  return {
    ...row,
    amount_paise: assertPaise(row.amount_paise),
  };
}

export async function listPeerDebts(): Promise<PeerDebt[]> {
  const rows = unwrap(
    await supabase
      .from("peer_debts")
      .select("*")
      .order("created_at", { ascending: false }),
    "Load peer debts"
  ) as any[];
  return rows.map(normalizePeerDebt);
}

export async function listDebtSettlements(debtId?: string): Promise<DebtSettlement[]> {
  let q = supabase.from("debt_settlements").select("*").order("settled_at", { ascending: false });
  if (debtId) q = q.eq("debt_id", debtId);
  const rows = unwrap(await q, "Load debt settlements") as any[];
  return rows.map(normalizeSettlement);
}

export async function createPeerDebt(input: NewPeerDebtInput): Promise<PeerDebt> {
  const id = input.id || generateId();
  const check = validatePeerDebt({
    id,
    personId: input.personId,
    direction: input.direction,
    totalAmountPaise: input.totalAmountPaise,
    remainingAmountPaise: input.totalAmountPaise,
    status: "active",
    dueDate: input.dueDate ?? null,
    createdAt: input.createdAt ?? new Date().toISOString(),
  });
  if (!check.valid) {
    throw new Error(check.errors.join("; "));
  }

  const res = await supabase
    .from("peer_debts")
    .insert({
      id,
      person_id: input.personId,
      direction: input.direction,
      total_amount_paise: input.totalAmountPaise,
      remaining_amount_paise: input.totalAmountPaise,
      status: "active",
      due_date: input.dueDate ?? null,
      reason: input.reason?.trim() || null,
      ...(input.createdAt ? { created_at: input.createdAt } : {}),
    })
    .select()
    .single();

  if (res.error && (res.error.code === "23505" || res.error.message?.includes("23505"))) {
    const { data: existing } = await supabase.from("peer_debts").select("*").eq("id", id).maybeSingle();
    if (existing) return normalizePeerDebt(existing);
  }

  return normalizePeerDebt(unwrap(res, "Save peer debt"));
}

export async function recordDebtSettlement(
  debt: PeerDebt,
  input: Omit<NewDebtSettlementInput, "debtId">
): Promise<DebtSettlement> {
  const id = input.id || generateId();

  // Client-side preflight validation using pure peerDebtEngine (DB trigger enforces authoritatively)
  const check = validateAndApplySettlement(
    {
      id: debt.id,
      personId: debt.person_id,
      direction: debt.direction,
      totalAmountPaise: debt.total_amount_paise,
      remainingAmountPaise: debt.remaining_amount_paise,
      status: debt.status,
      dueDate: debt.due_date,
      createdAt: debt.created_at,
    },
    {
      id,
      direction: input.direction,
      amountPaise: input.amountPaise,
    },
    { expectedRemainingPaise: debt.remaining_amount_paise }
  );
  if (!check.valid) {
    throw new Error(check.error || "Invalid settlement.");
  }

  const res = await supabase
    .from("debt_settlements")
    .insert({
      id,
      debt_id: debt.id,
      direction: input.direction,
      amount_paise: input.amountPaise,
      payment_mode: input.paymentMode?.trim() || null,
      reference_id: input.referenceId?.trim() || null,
      notes: input.notes?.trim() || null,
      ...(input.settledAt ? { settled_at: input.settledAt } : {}),
    })
    .select()
    .single();

  if (res.error && (res.error.code === "23505" || res.error.message?.includes("23505"))) {
    const { data: existing } = await supabase.from("debt_settlements").select("*").eq("id", id).maybeSingle();
    if (existing) return normalizeSettlement(existing);
  }

  return normalizeSettlement(unwrap(res, "Record settlement"));
}

export async function updatePeerDebt(input: {
  debtId: string;
  personId: string;
  totalAmountPaise: Paise;
  dueDate?: ISODate | null;
  reason?: string | null;
}): Promise<PeerDebt> {
  if (!Number.isSafeInteger(input.totalAmountPaise) || input.totalAmountPaise <= 0) {
    throw new Error("Original amount must be greater than ₹0.");
  }
  const rpcRes = await supabase.rpc("update_peer_debt_atomic", {
    p_debt_id: input.debtId,
    p_person_id: input.personId,
    p_total_amount_paise: input.totalAmountPaise,
    p_due_date: input.dueDate ?? null,
    p_reason: input.reason?.trim() || null,
  });
  return normalizePeerDebt(unwrap(rpcRes, "Update peer debt"));
}

export async function deletePeerDebt(debtId: string): Promise<void> {
  const { error } = await supabase.rpc("delete_peer_debt_safe", { p_debt_id: debtId });
  if (error) {
    throw new Error(error.message || "Could not delete peer debt.");
  }
}

export async function reverseDebtSettlement(settlementId: string): Promise<DebtSettlement> {
  const { data, error } = await supabase
    .from("debt_settlements")
    .delete()
    .eq("id", settlementId)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Reverse settlement failed: ${error.message}`);
  }
  if (!data) {
    throw new Error("Settlement was already reversed or not found.");
  }
  return normalizeSettlement(data);
}

export async function recordGiftTransaction(input: {
  direction: "received" | "given";
  amountPaise: Paise;
  personName?: string | null;
  date: ISODate;
  note?: string | null;
  paymentMethod?: PaymentMethod | null;
}): Promise<Transaction> {
  if (!Number.isSafeInteger(input.amountPaise) || input.amountPaise <= 0) {
    throw new Error("Gift amount must be greater than ₹0.");
  }
  const cleanPerson = input.personName?.trim() || "";
  const cleanNote = input.note?.trim() || "";
  const descParts = [
    input.direction === "received" ? "Gift received" : "Gift given",
    cleanPerson ? (input.direction === "received" ? `from ${cleanPerson}` : `to ${cleanPerson}`) : "",
    cleanNote ? `(${cleanNote})` : "",
  ].filter(Boolean);

  if (input.direction === "received") {
    return addTransaction({
      type: "income",
      amount: input.amountPaise,
      category: "other",
      inflowCategory: "gift",
      paymentMethod: input.paymentMethod ?? null,
      description: descParts.join(" "),
      ownership: "mine",
      date: input.date,
      source: "manual",
    });
  }

  return addTransaction({
    type: "expense",
    amount: input.amountPaise,
    category: "other",
    expenseType: "living",
    paymentMethod: input.paymentMethod ?? null,
    description: descParts.join(" "),
    ownership: "mine",
    date: input.date,
    source: "manual",
  });
}

// ---------- Deterministic Aggregation (Pure Integer Paise) ----------

export function computePeopleSummaries(
  people: Person[],
  debts: PeerDebt[],
  settlements: DebtSettlement[],
  groupSplits: GroupExpenseSplit[] = [],
  groupSettlements: GroupSettlement[] = [],
  groupPayerByExpenseId: Map<string, string | null> = new Map()
): PersonFinancialSummary[] {
  return people.map((person) => {
    const pDebts = debts.filter((d) => d.person_id === person.id);
    const debtIds = new Set(pDebts.map((d) => d.id));
    const pSettlements = settlements.filter((s) => debtIds.has(s.debt_id));

    let totalLentPaise = 0;
    let totalBorrowedPaise = 0;
    let personalReceivablePaise = 0;
    let personalPayablePaise = 0;
    let groupReceivablePaise = 0;
    let groupPayablePaise = 0;

    for (const d of pDebts) {
      if (d.direction === "they_owe") {
        totalLentPaise += d.total_amount_paise;
        if (d.status === "active" || d.status === "partially_settled") {
          personalReceivablePaise += d.remaining_amount_paise;
        }
      } else {
        totalBorrowedPaise += d.total_amount_paise;
        if (d.status === "active" || d.status === "partially_settled") {
          personalPayablePaise += d.remaining_amount_paise;
        }
      }
    }

    let totalReceivedPaise = 0;
    let totalRepaidPaise = 0;
    for (const s of pSettlements) {
      if (s.direction === "repayment_in") totalReceivedPaise += s.amount_paise;
      else totalRepaidPaise += s.amount_paise;
    }

    // Integrate group expense obligations without duplicating into peer_debts
    for (const gs of groupSplits) {
      if (gs.direction === "they_owe" && gs.person_id === person.id) {
        totalLentPaise += gs.share_amount_paise;
        if (gs.status === "active" || gs.status === "partially_settled") {
          groupReceivablePaise += gs.remaining_amount_paise;
        }
        const paidBack = groupSettlements
          .filter((st) => st.group_expense_split_id === gs.id && st.direction === "repayment_in")
          .reduce((acc, st) => acc + st.amount_paise, 0);
        totalReceivedPaise += paidBack;
      } else if (gs.direction === "you_owe" && groupPayerByExpenseId.get(gs.group_expense_id) === person.id) {
        totalBorrowedPaise += gs.share_amount_paise;
        if (gs.status === "active" || gs.status === "partially_settled") {
          groupPayablePaise += gs.remaining_amount_paise;
        }
        const paidOut = groupSettlements
          .filter((st) => st.group_expense_split_id === gs.id && st.direction === "repayment_out")
          .reduce((acc, st) => acc + st.amount_paise, 0);
        totalRepaidPaise += paidOut;
      }
    }

    const receivableRemainingPaise = personalReceivablePaise + groupReceivablePaise;
    const payableRemainingPaise = personalPayablePaise + groupPayablePaise;
    const netBalancePaise = receivableRemainingPaise - payableRemainingPaise;
    let statusLabel = "No pending balance";
    if (netBalancePaise > 0) statusLabel = `Owes you ${formatINR(netBalancePaise)}`;
    else if (netBalancePaise < 0) statusLabel = `You owe ${formatINR(Math.abs(netBalancePaise))}`;
    else if (pDebts.length > 0 || totalLentPaise > 0 || totalBorrowedPaise > 0) statusLabel = "All settled";

    return {
      person,
      totalLentPaise,
      totalBorrowedPaise,
      totalReceivedPaise,
      totalRepaidPaise,
      receivableRemainingPaise,
      payableRemainingPaise,
      personalReceivablePaise,
      personalPayablePaise,
      groupReceivablePaise,
      groupPayablePaise,
      netBalancePaise,
      statusLabel,
      debts: pDebts,
      settlements: pSettlements,
    };
  });
}

export function computeMoneyOverview(
  people: Person[],
  debts: PeerDebt[],
  groupSplits: GroupExpenseSplit[] = []
): MoneyOverview {
  const nameById = new Map(people.map((p) => [p.id, p.name]));

  let personalToReceivePaise = 0;
  let personalToRepayPaise = 0;
  let groupToReceivePaise = 0;
  let groupToRepayPaise = 0;
  let totalOriginalLentPaise = 0;
  let totalOriginalBorrowedPaise = 0;
  let totalReceivedPaise = 0;
  let totalRepaidPaise = 0;

  const receivables: MoneyOverview["receivables"] = [];
  const payables: MoneyOverview["payables"] = [];

  for (const d of debts) {
    const settledPaise = Math.max(0, d.total_amount_paise - d.remaining_amount_paise);
    const enriched = {
      ...d,
      personName: nameById.get(d.person_id) ?? "Unknown",
      settledPaise,
    };

    if (d.direction === "they_owe") {
      totalOriginalLentPaise += d.total_amount_paise;
      totalReceivedPaise += settledPaise;
      if (d.status === "active" || d.status === "partially_settled") {
        personalToReceivePaise += d.remaining_amount_paise;
      }
      receivables.push(enriched);
    } else {
      totalOriginalBorrowedPaise += d.total_amount_paise;
      totalRepaidPaise += settledPaise;
      if (d.status === "active" || d.status === "partially_settled") {
        personalToRepayPaise += d.remaining_amount_paise;
      }
      payables.push(enriched);
    }
  }

  for (const gs of groupSplits) {
    if (gs.status !== "active" && gs.status !== "partially_settled") continue;
    if (gs.direction === "they_owe") {
      groupToReceivePaise += gs.remaining_amount_paise;
    } else if (gs.direction === "you_owe") {
      groupToRepayPaise += gs.remaining_amount_paise;
    }
  }

  return {
    personalToReceivePaise,
    personalToRepayPaise,
    groupToReceivePaise,
    groupToRepayPaise,
    totalToReceivePaise: personalToReceivePaise + groupToReceivePaise,
    totalToRepayPaise: personalToRepayPaise + groupToRepayPaise,
    totalOriginalLentPaise,
    totalOriginalBorrowedPaise,
    totalReceivedPaise,
    totalRepaidPaise,
    receivables,
    payables,
  };
}

// ---------- Phase 7: Voice Integration Preparation ----------

export interface VoicePeopleQueryResult {
  intent: "person_balance" | "pending_repayments" | "unmatched";
  personName?: string;
  receivablePaise?: Paise;
  payablePaise?: Paise;
  netBalancePaise?: number;
  answer: string;
  pendingItems?: Array<{ personName: string; direction: PeerDebtDirection; remainingPaise: Paise; status: PeerDebtStatus }>;
}

/**
 * Reusable structured query helper for Sprint 3 voice assistant integration.
 * Answers questions like "How much does Ahmed owe me?", "How much do I owe Safiya?",
 * and "Show all pending repayments" deterministically in integer paise.
 */
export function queryPeopleAndMoney(
  queryText: string,
  people: Person[],
  debts: PeerDebt[],
  settlements: DebtSettlement[]
): VoicePeopleQueryResult {
  const q = queryText.trim().toLowerCase();
  const summaries = computePeopleSummaries(people, debts, settlements);

  if (/pending|all\s+repayment|who\s+owes|whom\s+do\s+i\s+owe/.test(q)) {
    const pending = debts
      .filter((d) => d.status === "active" || d.status === "partially_settled")
      .map((d) => ({
        personName: people.find((p) => p.id === d.person_id)?.name ?? "Unknown",
        direction: d.direction,
        remainingPaise: d.remaining_amount_paise,
        status: d.status,
      }));
    const overview = computeMoneyOverview(people, debts);
    return {
      intent: "pending_repayments",
      pendingItems: pending,
      answer:
        pending.length === 0
          ? "You have no pending repayments."
          : `You have ${formatINR(overview.totalToReceivePaise)} to receive and ${formatINR(overview.totalToRepayPaise)} to repay across ${pending.length} pending record${pending.length === 1 ? "" : "s"}.`,
    };
  }

  const matched = summaries.find((s) => q.includes(s.person.name.toLowerCase()));
  if (matched) {
    return {
      intent: "person_balance",
      personName: matched.person.name,
      receivablePaise: matched.receivableRemainingPaise,
      payablePaise: matched.payableRemainingPaise,
      netBalancePaise: matched.netBalancePaise,
      answer: `${matched.person.name}: ${matched.statusLabel}.`,
    };
  }

  return {
    intent: "unmatched",
    answer: "I couldn't match a person or repayment query. Open People or Money to view details.",
  };
}
