// Data services (owner: M1). Every call runs as the signed-in user; RLS on the
// database guarantees users only ever touch their own rows. Inputs are in paise.
import { supabase, unwrap } from "../lib/supabase";
import { paiseToRupeeString, toPaise, toPaiseOrNull } from "../lib/money";
import type {
  BalanceCheckin, Commitment, CommitmentStatus, NewBalanceCheckin, NewCommitment, NewPayout, NewTransaction,
  Payout, PayoutStatus, Profile, ProfileUpdate, RunwayInput, Transaction,
} from "../types/contracts";

const money = (p: number | null | undefined) => (p === null || p === undefined ? p : paiseToRupeeString(p));

// ---------- profile ----------
export async function getMyProfile(): Promise<Profile> {
  return unwrap(await supabase.from("profiles").select("*").single(), "Load profile");
}

export async function updateMyProfile(userId: string, patch: ProfileUpdate): Promise<Profile> {
  const row: Record<string, unknown> = { ...patch };
  if ("daily_living_estimate" in patch) row.daily_living_estimate = money(patch.daily_living_estimate);
  if ("daily_work_estimate" in patch) row.daily_work_estimate = money(patch.daily_work_estimate);
  return unwrap(await supabase.from("profiles").update(row).eq("id", userId).select().single(), "Save profile");
}

// ---------- balance check-ins ----------
export async function addCheckin(c: NewBalanceCheckin): Promise<BalanceCheckin> {
  return unwrap(await supabase.from("balance_checkins").insert({
    cash_amount: money(c.cash), bank_amount: money(c.bank), not_mine_amount: money(c.notMine ?? 0),
    note: c.note ?? null, ...(c.checkedAt ? { checked_at: c.checkedAt } : {}),
  }).select().single(), "Save balance check-in");
}

export async function getLatestCheckin(): Promise<BalanceCheckin | null> {
  const { data, error } = await supabase.from("balance_checkins").select("*")
    .order("checked_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(`Load balance check-in failed: ${error.message}`);
  return data;
}

// ---------- transactions ----------
export async function addTransaction(t: NewTransaction): Promise<Transaction> {
  const ownership = t.ownership ?? "mine";
  if (t.type === "expense" && ownership === "mine" && !t.expenseType) {
    throw new Error("Choose whether this expense is living or work.");
  }
  // Idempotency: Ensure a client-generated UUID is always present and retained on t for retries
  if (!t.id) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      t.id = crypto.randomUUID();
    } else {
      throw new Error("Client UUID generator is unavailable; cannot perform idempotent insert.");
    }
  }

  const expectedExpenseType = t.type === "expense" && ownership === "mine" ? t.expenseType : null;
  const insertRes = await supabase.from("transactions").insert({
    id: t.id,
    type: t.type, amount: money(t.amount), category: t.category ?? "other", description: t.description ?? null,
    expense_type: expectedExpenseType,
    ownership, payout_id: t.payoutId ?? null, source: t.source ?? "manual",
    ...(t.date ? { transaction_date: t.date } : {}),
  }).select().single();

  if (insertRes.error) {
    const err = insertRes.error;
    const isPkeyViolation =
      (err.code === "23505" || err.message?.includes("23505")) &&
      (err.message?.includes("transactions_pkey") || err.details?.includes("transactions_pkey"));

    if (isPkeyViolation) {
      // Query existing transaction via authenticated client (RLS enforced)
      const { data: existing, error: fetchErr } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", t.id)
        .maybeSingle();

      if (!fetchErr && existing) {
        const matchesFinancialFields =
          existing.type === t.type &&
          toPaise(existing.amount) === t.amount &&
          existing.ownership === ownership &&
          existing.expense_type === expectedExpenseType &&
          existing.payout_id === (t.payoutId ?? null);

        if (matchesFinancialFields) {
          return existing as Transaction;
        }
        throw new Error("Transaction ID conflict: an existing transaction with this ID has conflicting details.");
      }
    }
  }

  return unwrap(insertRes, "Save transaction");
}

export async function listTransactions(opts: { from?: string; to?: string; limit?: number } = {}): Promise<Transaction[]> {
  let q = supabase.from("transactions").select("*")
    .order("transaction_date", { ascending: false }).order("created_at", { ascending: false });
  if (opts.from) q = q.gte("transaction_date", opts.from);
  if (opts.to) q = q.lte("transaction_date", opts.to);
  if (opts.limit) q = q.limit(opts.limit);
  return unwrap(await q, "Load transactions");
}

export async function updateTransaction(id: string, t: Partial<NewTransaction>): Promise<Transaction> {
  const row: Record<string, unknown> = {};
  if (t.type) row.type = t.type;
  if (t.amount !== undefined) row.amount = money(t.amount);
  if (t.category !== undefined) row.category = t.category;
  if (t.description !== undefined) row.description = t.description;
  if (t.expenseType !== undefined) row.expense_type = t.expenseType;
  if (t.ownership) row.ownership = t.ownership;
  if (t.payoutId !== undefined) row.payout_id = t.payoutId;
  if (t.date) row.transaction_date = t.date;
  return unwrap(await supabase.from("transactions").update(row).eq("id", id).select().single(), "Update transaction");
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(`Delete transaction failed: ${error.message}`);
}

// ---------- payouts ----------
export async function addPayout(p: NewPayout): Promise<Payout> {
  return unwrap(await supabase.from("payouts").insert({
    expected_amount: money(p.expected), kind: p.kind ?? "platform_payout", source: p.source ?? null,
    expected_date: p.expectedDate ?? null, status: p.status ?? "scheduled", note: p.note ?? null,
  }).select().single(), "Save payout");
}

export async function listPayouts(): Promise<Payout[]> {
  return unwrap(await supabase.from("payouts").select("*").order("expected_date", { ascending: true, nullsFirst: false }), "Load payouts");
}

/** Record money actually received against a payout. The DB trigger updates received_amount and partial/settled. */
export async function receivePayout(payoutId: string, amount: number, date?: string, idempotencyId?: string): Promise<Transaction> {
  return addTransaction({ id: idempotencyId, type: "income", amount, category: "payout", payoutId, date });
}

export async function setPayoutStatus(id: string, status: Extract<PayoutStatus, "scheduled" | "estimated" | "unearned" | "cancelled">): Promise<Payout> {
  return unwrap(await supabase.from("payouts").update({ status }).eq("id", id).select().single(), "Update payout");
}

// ---------- commitments ----------
export async function addCommitment(c: NewCommitment): Promise<Commitment> {
  return unwrap(await supabase.from("commitments").insert({
    title: c.title, amount: money(c.amount), due_date: c.dueDate, category: c.category ?? "other", kind: c.kind ?? "bill",
  }).select().single(), "Save commitment");
}

export async function listCommitments(status: CommitmentStatus | "all" = "upcoming"): Promise<Commitment[]> {
  let q = supabase.from("commitments").select("*").order("due_date", { ascending: true });
  if (status !== "all") q = q.eq("status", status);
  return unwrap(await q, "Load commitments");
}

export async function setCommitmentStatus(id: string, status: CommitmentStatus): Promise<Commitment> {
  return unwrap(await supabase.from("commitments").update({ status }).eq("id", id).select().single(), "Update commitment");
}

// ---------- one call that feeds M3's runway engine ----------
/** Loads everything the engine needs, converted to paise. Missing data stays null (never silently 0). */
export async function loadRunwayInput(): Promise<RunwayInput> {
  const [profile, checkin] = await Promise.all([getMyProfile(), getLatestCheckin()]);
  const since = checkin ? checkin.checked_at.slice(0, 10) : undefined;
  const [txs, payouts, commitments] = await Promise.all([
    since ? unwrap(await supabase.from("transactions").select("*").gte("transaction_date", since), "Load transactions")
          : Promise.resolve([] as Transaction[]),
    listPayouts(),
    listCommitments("upcoming"),
  ]);
  return {
    profile: {
      workProfile: profile.work_profile, payoutPattern: profile.payout_pattern,
      dailyLivingEstimate: toPaiseOrNull(profile.daily_living_estimate),
      dailyWorkEstimate: toPaiseOrNull(profile.daily_work_estimate),
    },
    latestCheckin: checkin && {
      cash: toPaise(checkin.cash_amount), bank: toPaise(checkin.bank_amount),
      notMine: toPaise(checkin.not_mine_amount), checkedAt: checkin.checked_at,
    },
    // includes same-day rows; M3 compares createdAt with checkedAt to skip anything already in the check-in
    transactionsSinceCheckin: (txs as Transaction[]).map((t) => ({
      id: t.id, type: t.type, amount: toPaise(t.amount), ownership: t.ownership, expenseType: t.expense_type,
      payoutId: t.payout_id, date: t.transaction_date, createdAt: t.created_at,
    })),
    payouts: payouts.filter((p) => p.status !== "cancelled").map((p) => ({
      id: p.id, kind: p.kind, expected: toPaise(p.expected_amount), received: toPaise(p.received_amount),
      expectedDate: p.expected_date, status: p.status,
    })),
    commitments: commitments.map((c) => ({ id: c.id, title: c.title, amount: toPaise(c.amount), dueDate: c.due_date, kind: c.kind })),
  };
}
