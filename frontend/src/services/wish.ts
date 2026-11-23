// =====================================================================
// FLOVA WISH 2.0 Persistent Savings Goal Service (Owner: M1 / Phase 15)
// Manages database-backed savings goals and contribution history.
// Supports safe hydration and migration from legacy localStorage goals.
// Invariant: Saving is non-coercive and NEVER locks funds or mutates bank/cash balances.
// =====================================================================

import { supabase } from "../lib/supabase";
import { todayLocalISO } from "../data/dates";
import { toPaise } from "../lib/money";
import type { WishGoal, WishContribution, RupeeString, Paise } from "../types/contracts";

export interface CreateWishGoalInput {
  title: string;
  targetAmountRupees?: RupeeString;
  targetAmountPaise?: Paise;
  targetDate?: string | null;
  category?: string | null;
  icon?: string | null;
}

export interface AddWishContributionInput {
  goalId?: string;
  amountRupees?: RupeeString;
  amountPaise?: Paise;
  notes?: string | null;
  note?: string | null;
  contributedAt?: string;
}

/**
 * Lists all persistent savings goals for the authenticated user with contributions.
 */
export async function listWishGoals(): Promise<WishGoal[]> {
  const { data, error } = await supabase
    .from("wish_goals")
    .select("*, contributions:wish_contributions(*)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list savings goals: ${error.message}`);
  }

  return (data || []) as WishGoal[];
}

/**
 * Creates a new persistent savings goal.
 */
export async function createWishGoal(input: CreateWishGoalInput): Promise<WishGoal> {
  const targetPaise = input.targetAmountPaise ?? (input.targetAmountRupees ? toPaise(input.targetAmountRupees) : 0);
  if (targetPaise <= 0) {
    throw new Error("Goal target amount must be greater than zero.");
  }
  if (targetPaise > 1000000000) {
    throw new Error("Goal target amount exceeds maximum limit of ₹1 Crore.");
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error("Authenticated user required to create a savings goal.");
  }
  const userId = userData.user.id;

  const targetAmountStr = (targetPaise / 100).toFixed(2);

  const { data, error } = await supabase
    .from("wish_goals")
    .insert({
      user_id: userId,
      title: input.title.trim(),
      target_amount: targetAmountStr,
      saved_amount: "0.00",
      status: "active",
      target_date: input.targetDate || null,
      category: input.category || null,
      icon: input.icon || null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create savings goal: ${error?.message}`);
  }

  return data as WishGoal;
}

/**
 * Records a contribution toward a savings goal.
 * The database trigger automatically updates `wish_goals.saved_amount` and marks status `completed` if target is reached.
 */
export async function addWishContribution(
  goalIdOrInput: string | AddWishContributionInput,
  maybeInput?: Partial<AddWishContributionInput>
): Promise<WishContribution> {
  const input: AddWishContributionInput =
    typeof goalIdOrInput === "string"
      ? { goalId: goalIdOrInput, ...maybeInput }
      : goalIdOrInput;

  const goalId = input.goalId;
  if (!goalId) throw new Error("Goal ID is required");

  const amountPaise = input.amountPaise ?? (input.amountRupees ? toPaise(input.amountRupees) : 0);
  if (amountPaise <= 0) {
    throw new Error("Contribution amount must be greater than zero.");
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error("Authenticated user required to contribute.");
  }
  const userId = userData.user.id;

  const amountStr = (amountPaise / 100).toFixed(2);

  const { data, error } = await supabase
    .from("wish_contributions")
    .insert({
      goal_id: goalId,
      user_id: userId,
      amount: amountStr,
      contributed_at: input.contributedAt || todayLocalISO(),
      notes: input.notes || input.note || null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to record goal contribution: ${error?.message}`);
  }

  return data as WishContribution;
}

/**
 * Migrates unmigrated goals from localStorage to Supabase wish_goals.
 * Idempotent: checks for existing goal title to avoid duplicate insertions.
 */
export async function migrateLocalStorageGoals(
  localGoals: Array<{ title?: string; name?: string; targetPaise?: number; savedPaise?: number }>
): Promise<number> {
  if (!localGoals || localGoals.length === 0) return 0;

  const existingGoals = await listWishGoals().catch(() => []);
  const existingTitles = new Set(existingGoals.map((g) => g.title.toLowerCase().trim()));

  let migratedCount = 0;
  for (const lg of localGoals) {
    const title = (lg.title || lg.name || "").trim();
    if (!title || existingTitles.has(title.toLowerCase())) {
      continue;
    }

    try {
      const targetPaise = lg.targetPaise || 0;
      const newGoal = await createWishGoal({
        title,
        targetAmountPaise: targetPaise,
      });

      if (lg.savedPaise && lg.savedPaise > 0) {
        await addWishContribution(newGoal.id, {
          amountPaise: lg.savedPaise,
          notes: "Migrated from local storage",
        });
      }
      existingTitles.add(title.toLowerCase());
      migratedCount++;
    } catch (e) {
      console.warn("Failed to migrate local goal:", title, e);
    }
  }

  return migratedCount;
}
