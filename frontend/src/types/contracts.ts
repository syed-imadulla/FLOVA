// =====================================================================
// FLOVA shared data contract (owner: M1). Mirrors
// backend/supabase/migrations/20261120000100_init_schema.sql exactly.
// M2 (UI), M3 (engine/AI) and M4 (integration/QA) import from here.
// Change a field or enum only with team agreement + a new migration.
// =====================================================================

// ---------- enums ----------
export const WORK_PROFILES = ["delivery", "driver", "service", "freelancer", "independent_business"] as const;
export const PAYOUT_PATTERNS = ["daily", "weekly", "per_job", "milestone", "variable"] as const;
export const APP_LANGUAGES = ["en", "kn", "hi"] as const; // kn/hi only once translations are reviewed
export const TRANSACTION_TYPES = ["income", "expense"] as const;
export const EXPENSE_TYPES = ["living", "work"] as const;
export const MONEY_OWNERSHIP = ["mine", "not_mine"] as const;
export const PAYOUT_KINDS = ["platform_payout", "incentive", "client_payment", "advance", "other"] as const;
export const PAYOUT_STATUSES = ["scheduled", "estimated", "unearned", "partial", "settled", "cancelled"] as const;
export const COMMITMENT_KINDS = ["bill", "debt"] as const;
export const COMMITMENT_STATUSES = ["upcoming", "paid", "cancelled"] as const;
export const ENTRY_SOURCES = ["manual", "voice", "ai_suggestion", "demo"] as const;

export type WorkProfile = (typeof WORK_PROFILES)[number];
export type PayoutPattern = (typeof PAYOUT_PATTERNS)[number];
export type AppLanguage = (typeof APP_LANGUAGES)[number];
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type ExpenseType = (typeof EXPENSE_TYPES)[number];
export type MoneyOwnership = (typeof MONEY_OWNERSHIP)[number];
export type PayoutKind = (typeof PAYOUT_KINDS)[number];
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];
export type CommitmentKind = (typeof COMMITMENT_KINDS)[number];
export type CommitmentStatus = (typeof COMMITMENT_STATUSES)[number];
export type EntrySource = (typeof ENTRY_SOURCES)[number];

/** Suggested category values (free text in the DB, max 40 chars). UI presets can adapt per work profile. */
export const SUGGESTED_CATEGORIES = {
  income: ["earnings", "tips", "payout", "incentive", "advance", "cod_collection", "other"],
  expense: ["food", "fuel", "phone", "maintenance", "rent", "emi", "cod_handover", "other"],
  commitment: ["rent", "emi", "loan", "utility", "phone", "school", "other"],
} as const;

// ---------- money ----------
/** Rupees from a numeric(12,2) column. PostgREST may return it as a JSON number (4500) or string ("4500.00"):
 *  ALWAYS convert with toPaise() from frontend/src/lib/money.ts before any maths. */
export type RupeeString = string | number;
/** Integer paise. The engine (M3) works ONLY in paise. */
export type Paise = number;
/** ISO date "YYYY-MM-DD". */
export type ISODate = string;
/** ISO timestamp. */
export type ISOTimestamp = string;

// ---------- rows (what SELECT returns) ----------
export interface Profile {
  id: string;
  display_name: string | null;
  work_profile: WorkProfile;
  payout_pattern: PayoutPattern;
  preferred_language: AppLanguage;
  daily_living_estimate: RupeeString | null; // null = not provided -> uncertainty, never 0
  daily_work_estimate: RupeeString | null;
  onboarding_completed: boolean;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface BalanceCheckin {
  id: string;
  user_id: string;
  cash_amount: RupeeString;
  bank_amount: RupeeString;
  not_mine_amount: RupeeString; // part of cash+bank that belongs to someone else (e.g. COD)
  note: string | null;
  checked_at: ISOTimestamp;
  created_at: ISOTimestamp;
}

export interface Payout {
  id: string;
  user_id: string;
  kind: PayoutKind;
  source: string | null;
  expected_amount: RupeeString;
  received_amount: RupeeString; // READ-ONLY: sum of linked income transactions (DB trigger)
  expected_date: ISODate | null; // null = unknown date
  status: PayoutStatus; // partial/settled are set by the DB trigger
  note: string | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: RupeeString;
  category: string;
  description: string | null;
  expense_type: ExpenseType | null; // required when type='expense' AND ownership='mine'
  ownership: MoneyOwnership;
  payout_id: string | null; // own income that settles (part of) a payout
  transaction_date: ISODate;
  source: EntrySource;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface Commitment {
  id: string;
  user_id: string;
  title: string;
  amount: RupeeString;
  due_date: ISODate;
  category: string;
  kind: CommitmentKind;
  status: CommitmentStatus;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

// ---------- inputs (what the app sends; user_id is filled by the DB from the session) ----------
export type ProfileUpdate = Partial<Pick<Profile,
  "display_name" | "work_profile" | "payout_pattern" | "preferred_language" | "onboarding_completed">> & {
  daily_living_estimate?: Paise | null;
  daily_work_estimate?: Paise | null;
};

export interface NewBalanceCheckin {
  cash: Paise;
  bank: Paise;
  notMine?: Paise;
  note?: string;
  checkedAt?: ISOTimestamp;
}

export interface NewPayout {
  expected: Paise;
  kind?: PayoutKind;
  source?: string;
  expectedDate?: ISODate | null;
  status?: Extract<PayoutStatus, "scheduled" | "estimated" | "unearned">;
  note?: string;
}

export interface NewTransaction {
  type: TransactionType;
  amount: Paise;
  category?: string;
  description?: string;
  expenseType?: ExpenseType;
  ownership?: MoneyOwnership;
  payoutId?: string;
  date?: ISODate;
  source?: EntrySource;
}

export interface NewCommitment {
  title: string;
  amount: Paise;
  dueDate: ISODate;
  category?: string;
  kind?: CommitmentKind;
}

/** Everything the runway engine (M3) needs, already converted to paise by M1's loader. */
export interface RunwayInput {
  profile: {
    workProfile: WorkProfile;
    payoutPattern: PayoutPattern;
    dailyLivingEstimate: Paise | null;
    dailyWorkEstimate: Paise | null;
  };
  latestCheckin: { cash: Paise; bank: Paise; notMine: Paise; checkedAt: ISOTimestamp } | null;
  transactionsSinceCheckin: Array<{
    id: string; type: TransactionType; amount: Paise; ownership: MoneyOwnership;
    expenseType: ExpenseType | null; payoutId: string | null; date: ISODate; createdAt: ISOTimestamp;
  }>;
  payouts: Array<{
    id: string; kind: PayoutKind; expected: Paise; received: Paise;
    expectedDate: ISODate | null; status: PayoutStatus;
  }>;
  commitments: Array<{ id: string; title: string; amount: Paise; dueDate: ISODate; kind: CommitmentKind }>;
}
