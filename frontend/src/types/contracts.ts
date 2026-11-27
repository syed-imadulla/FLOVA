// =====================================================================
// FLOVA shared data contract (owner: M1). Mirrors
// backend/supabase/migrations/20261120000100_init_schema.sql exactly.
// M2 (UI), M3 (engine/AI) and M4 (integration/QA) import from here.
// Change a field or enum only with team agreement + a new migration.
// =====================================================================

// ---------- enums ----------
export const WORK_PROFILES = [
  "delivery",
  "driver",
  "service",
  "freelancer",
  "independent_business",
  "small_vendor",
  "daily_wage",
  "seasonal_worker",
  "other",
] as const;
export const PAYOUT_PATTERNS = ["daily", "weekly", "per_job", "milestone", "variable"] as const;
export const INCOME_VARIABILITIES = [
  "regular",
  "variable",
  "unpredictable",
  "seasonal",
  "intermittent",
] as const;
export const APP_LANGUAGES = ["en", "kn", "hi"] as const; // kn/hi only once translations are reviewed
export const TRANSACTION_TYPES = ["income", "expense"] as const;
export const EXPENSE_TYPES = ["living", "work"] as const;
export const MONEY_OWNERSHIP = ["mine", "not_mine"] as const;
export const PAYOUT_KINDS = ["platform_payout", "incentive", "client_payment", "advance", "other"] as const;
export const PAYOUT_STATUSES = ["scheduled", "estimated", "unearned", "partial", "settled", "cancelled"] as const;
export const COMMITMENT_KINDS = ["bill", "debt"] as const;
export const COMMITMENT_STATUSES = ["upcoming", "paid", "cancelled"] as const;
export const ENTRY_SOURCES = ["manual", "voice", "ai_suggestion", "demo"] as const;
export const INFLOW_CATEGORIES = ["earned", "family_support", "pocket_money", "gift", "donation"] as const;
export const PAYMENT_METHODS = ["cash", "bank", "upi"] as const;
export const PEER_DEBT_DIRECTIONS = ["you_owe", "they_owe"] as const;
export const PEER_DEBT_STATUSES = ["active", "partially_settled", "settled", "forgiven"] as const;
export const SETTLEMENT_DIRECTIONS = ["repayment_out", "repayment_in"] as const;

export type WorkProfile = (typeof WORK_PROFILES)[number];
export type PayoutPattern = (typeof PAYOUT_PATTERNS)[number];
export type IncomeVariability = (typeof INCOME_VARIABILITIES)[number];
export type AppLanguage = (typeof APP_LANGUAGES)[number];
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type ExpenseType = (typeof EXPENSE_TYPES)[number];
export type MoneyOwnership = (typeof MONEY_OWNERSHIP)[number];
export type PayoutKind = (typeof PAYOUT_KINDS)[number];
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];
export type CommitmentKind = (typeof COMMITMENT_KINDS)[number];
export type CommitmentStatus = (typeof COMMITMENT_STATUSES)[number];
export type EntrySource = (typeof ENTRY_SOURCES)[number];
export type InflowCategory = (typeof INFLOW_CATEGORIES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PeerDebtDirection = (typeof PEER_DEBT_DIRECTIONS)[number];
export type PeerDebtStatus = (typeof PEER_DEBT_STATUSES)[number];
export const GROUP_SPLIT_TYPES = ["equal", "custom", "percentage"] as const;
export const GROUP_SPLIT_DIRECTIONS = ["they_owe", "you_owe", "self_share", "third_party"] as const;
export type GroupSplitType = (typeof GROUP_SPLIT_TYPES)[number];
export type GroupSplitDirection = (typeof GROUP_SPLIT_DIRECTIONS)[number];
export type SettlementDirection = (typeof SETTLEMENT_DIRECTIONS)[number];

/** Universal personal living expense categories applicable across all worker types */
export const UNIVERSAL_LIVING_CATEGORIES = [
  "food",
  "rent",
  "groceries",
  "healthcare",
  "utility",
  "education",
  "personal",
  "other",
] as const;

/** Occupation-specific work/business expense suggestions tailored to worker persona */
export const OCCUPATION_WORK_CATEGORIES: Record<WorkProfile, readonly string[]> = {
  delivery: ["fuel", "vehicle_maintenance", "phone_internet", "platform_fee", "equipment", "other"],
  driver: ["fuel", "vehicle_maintenance", "toll_parking", "phone_internet", "insurance", "other"],
  freelancer: ["phone_internet", "software_tools", "equipment", "coworking", "books_courses", "other"],
  service: ["tools", "materials", "supplies", "commute", "equipment", "phone_internet", "other"],
  independent_business: ["inventory", "materials", "supplies", "rent", "utility", "transport", "other"],
  small_vendor: ["inventory", "supplies", "cart_maintenance", "packaging", "commute", "other"],
  daily_wage: ["tools", "materials", "safety_gear", "commute", "food", "other"],
  seasonal_worker: ["equipment", "seeds_fertilizer", "tools", "transport", "supplies", "other"],
  other: ["tools", "materials", "supplies", "equipment", "phone_internet", "other"],
};

/** Suggested category values (free text in the DB, max 40 chars). UI presets adapt per work profile. */
export const SUGGESTED_CATEGORIES = {
  income: [
    "salary",
    "freelance",
    "business_sales",
    "delivery_earnings",
    "service_income",
    "commission",
    "tips",
    "earnings",
    "client_payment",
    "platform_payout",
    "sales",
    "daily_wage",
    "payout",
    "incentive",
    "advance",
    "cod_collection",
    "other",
  ],
  expense: [
    "food",
    "groceries",
    "fuel",
    "phone",
    "maintenance",
    "rent",
    "family",
    "medical",
    "transport",
    "vehicle",
    "stock",
    "emi",
    "tools",
    "inventory",
    "supplies",
    "cod_handover",
    "other",
  ],
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
  income_variability: IncomeVariability;
  handles_cod: boolean;
  safe_runway_buffer: RupeeString | null;
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
  inflow_category?: InflowCategory | null; // optional FLOVA 2.0 segregation for own income
  payment_method?: PaymentMethod | null; // optional Sprint 4B payment method ('cash' | 'bank' | 'upi')
  receipt_path?: string | null; // optional Sprint 4B private storage path
  ownership: MoneyOwnership;
  payout_id: string | null; // own income that settles (part of) a payout
  transaction_date: ISODate;
  source: EntrySource;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface Person {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  upi_id: string | null;
  relationship: string | null;
  is_favorite: boolean;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface PeerDebt {
  id: string;
  user_id: string;
  person_id: string;
  direction: PeerDebtDirection;
  total_amount_paise: Paise;
  remaining_amount_paise: Paise;
  reason: string | null;
  status: PeerDebtStatus;
  due_date: ISODate | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface DebtSettlement {
  id: string;
  user_id: string;
  debt_id: string;
  direction: SettlementDirection;
  amount_paise: Paise;
  payment_mode: string | null;
  reference_id: string | null;
  settled_at: ISOTimestamp;
  notes: string | null;
  created_at: ISOTimestamp;
}

export interface FinancialAuditLogEntry {
  id: string;
  user_id: string;
  acting_user_id: string | null;
  entity_type: "transaction" | "peer_debt" | "debt_settlement" | "commitment" | "person";
  entity_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  state_before: Record<string, unknown> | null;
  state_after: Record<string, unknown> | null;
  actor: string;
  reason: string | null;
  created_at: ISOTimestamp;
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
  "display_name" | "work_profile" | "payout_pattern" | "income_variability" | "handles_cod" | "preferred_language" | "onboarding_completed">> & {
  daily_living_estimate?: Paise | null;
  daily_work_estimate?: Paise | null;
  safe_runway_buffer?: Paise | null;
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
  id?: string;
  type: TransactionType;
  amount: Paise;
  category?: string;
  description?: string | null;
  expenseType?: ExpenseType | null;
  inflowCategory?: InflowCategory | null;
  paymentMethod?: PaymentMethod | null;
  receiptPath?: string | null;
  ownership?: MoneyOwnership;
  payoutId?: string | null;
  date?: ISODate;
  source?: EntrySource;
}

export interface PeerDebtEngineItem {
  id: string;
  personId: string;
  personName?: string;
  direction: PeerDebtDirection;
  totalAmountPaise: Paise;
  remainingAmountPaise: Paise;
  status: PeerDebtStatus;
  dueDate: ISODate | null;
  createdAt: ISOTimestamp;
}

export interface DebtSettlementEngineItem {
  id: string;
  debtId: string;
  direction: SettlementDirection;
  amountPaise: Paise;
  settledAt: ISOTimestamp;
  createdAt: ISOTimestamp;
}

export interface ExpenseGroup {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface ExpenseGroupMember {
  id: string;
  user_id: string;
  group_id: string;
  is_self: boolean;
  person_id: string | null;
  joined_at: ISOTimestamp;
}

export interface GroupExpense {
  id: string;
  user_id: string;
  group_id: string;
  description: string;
  total_amount_paise: Paise;
  paid_by_self: boolean;
  paid_by_person_id: string | null;
  expense_date: ISODate;
  split_type: GroupSplitType;
  self_transaction_id: string | null;
  category?: string;
  expense_type?: ExpenseType;
  note: string | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface GroupExpenseSplit {
  id: string;
  user_id: string;
  group_expense_id: string;
  is_self: boolean;
  person_id: string | null;
  direction: GroupSplitDirection;
  share_amount_paise: Paise;
  remaining_amount_paise: Paise;
  status: Extract<PeerDebtStatus, "active" | "partially_settled" | "settled">;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface GroupSettlement {
  id: string;
  user_id: string;
  group_expense_split_id: string;
  direction: SettlementDirection;
  amount_paise: Paise;
  settled_at: ISOTimestamp;
  notes: string | null;
  created_at: ISOTimestamp;
}

export interface GroupSplitEngineItem {
  id: string;
  groupExpenseId: string;
  isSelf: boolean;
  personId: string | null;
  direction: GroupSplitDirection;
  shareAmountPaise: Paise;
  remainingAmountPaise: Paise;
  status: Extract<PeerDebtStatus, "active" | "partially_settled" | "settled">;
  createdAt: ISOTimestamp;
}

export interface GroupSettlementEngineItem {
  id: string;
  groupExpenseSplitId: string;
  direction: SettlementDirection;
  amountPaise: Paise;
  settledAt: ISOTimestamp;
  createdAt: ISOTimestamp;
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
    safeRunwayBuffer?: Paise | null;
    incomeVariability?: IncomeVariability;
    handlesCod?: boolean;
  };
  latestCheckin: { cash: Paise; bank: Paise; notMine: Paise; checkedAt: ISOTimestamp } | null;
  transactionsSinceCheckin: Array<{
    id: string; type: TransactionType; amount: Paise; ownership: MoneyOwnership;
    expenseType: ExpenseType | null; inflowCategory?: InflowCategory | null;
    payoutId: string | null; date: ISODate; createdAt: ISOTimestamp;
  }>;
  payouts: Array<{
    id: string; kind: PayoutKind; expected: Paise; received: Paise;
    expectedDate: ISODate | null; status: PayoutStatus;
  }>;
  commitments: Array<{ id: string; title: string; amount: Paise; dueDate: ISODate; kind: CommitmentKind }>;
  peerDebts?: PeerDebtEngineItem[];
  debtSettlements?: DebtSettlementEngineItem[];
  groupSplits?: GroupSplitEngineItem[];
  groupSettlements?: GroupSettlementEngineItem[];
}

// ---------- Candidate DTOs (Receipt & Voice Extraction) ----------
export type {
  FinancialExtractionDTO,
  ExtractionEntryIntent,
  ExtractionActionIntent,
  ExtractedTransactionData,
  ExtractedPayoutData,
  ExtractedCheckinData,
  ExtractedQueryData,
  ExtractionMetadata,
} from "../engine/extractionTypes";

/**
 * Extracted receipt candidate before user confirmation.
 * Missing/uncertain data is represented as null (never invented).
 * Supports both camelCase and snake_case candidate property representations
 * to ensure strict candidate identity stability across extraction, review, and confirmation.
 */
export interface ExtractedReceiptCandidate {
  id?: string;
  candidate_id?: string;
  draft_id?: string | null;
  type?: TransactionType;
  kind?: "physical_receipt" | "upi_screenshot" | "payment_sms" | "unknown";
  merchant: string | null;
  amountPaise: Paise | null;
  amount_paise?: Paise | null;
  amount_rupees?: string | null;
  category: string | null;
  expenseType: ExpenseType | null;
  expense_type?: ExpenseType | null;
  ownership?: MoneyOwnership;
  paymentMethod?: PaymentMethod | null;
  receiptPath?: string | null;
  date: ISODate | null;
  extractedDate?: ISODate | null;
  extracted_date?: ISODate | null;
  contextual_date?: ISODate | null;
  scannedAt?: string;
  dateFallback?: boolean;
  time?: string | null;
  paymentStatus?: "successful" | "pending" | "failed" | "unknown";
  payment_status?: "successful" | "pending" | "failed" | "unknown";
  upiReference?: string | null;
  upi_reference?: string | null;
  upiApp?: string | null;
  upi_app?: string | null;
  items?: Array<{ name: string; quantity?: number; price?: number }>;
  subtotalPaise?: Paise | null;
  taxPaise?: Paise | null;
  discountPaise?: Paise | null;
  receiptNumber?: string | null;
  arithmeticDiscrepancy?: string | null;
  currency?: string;
  possibleTotals?: number[];
  duplicateWarning?: { existingTransactionId: string; reference: string } | null;
  description?: string | null;
  notes?: string | null; // Optional alias for backward compatibility
  confidence?: number;
  needsReview: boolean;
  clarification_required?: boolean;
  missingFields: string[];
  clarification_questions?: string[];
  rawExtractedData?: Record<string, unknown>;
  raw_utterance?: string;
}

/**
 * Extracted voice transaction candidate before user confirmation.
 * Missing/uncertain data is represented as null (never invented).
 * Supports both camelCase and snake_case candidate property representations
 * to ensure strict candidate identity stability across extraction, review, and confirmation.
 */
export interface VoiceTransactionCandidate {
  id?: string;
  candidate_id?: string;
  draft_id?: string | null;
  transcript: string;
  raw_utterance?: string;
  type: TransactionType | null;
  amountPaise: Paise | null;
  amount_paise?: Paise | null;
  amount_rupees?: string | null;
  category: string | null;
  expenseType: ExpenseType | null;
  expense_type?: ExpenseType | null;
  date: ISODate | null;
  extracted_date?: ISODate | null;
  contextual_date?: ISODate | null;
  description?: string | null;
  ownership: MoneyOwnership;
  confidence?: number;
  stt_provider?: "indicconformer" | "whisper" | "manual_text";
  needsReview: boolean;
  clarification_required?: boolean;
  missingFields: string[];
  clarification_questions?: string[];
}

// ---------- Activity Timeline (Phase 7 & 10) ----------
export type ActivityItemKind = "transaction" | "checkin" | "payout_receipt" | "expected_payout";

/**
 * Unified item for the Activity and Money Overview timelines.
 * Strictly distinguishes balance check-ins and expected payouts from income/expenses.
 */
export interface ActivityItem {
  id: string;
  kind: ActivityItemKind;
  type: TransactionType | "checkin" | "expected_payout";
  timestamp: ISOTimestamp;
  date: ISODate;
  title: string;
  category?: string;
  ownership?: MoneyOwnership;
  expenseType?: ExpenseType | null;
  inflowCategory?: InflowCategory | null;
  paymentMethod?: PaymentMethod | null;
  receiptPath?: string | null;
  amountPaise?: Paise;
  rupeeAmount?: RupeeString;
  snapshot?: {
    cashPaise: Paise;
    bankPaise: Paise;
    notMinePaise: Paise;
    totalPersonalPaise: Paise;
  };
  payoutId?: string | null;
  payoutStatus?: PayoutStatus;
  expectedDate?: ISODate | null;
  source?: EntrySource | "system";
  note?: string | null;
}

// ---------- Invoices & Settlements (Phase 15) ----------
export type InvoiceDirection = "receivable" | "payable";
export type InvoiceStatus = "uploaded" | "unpaid" | "partially_paid" | "paid" | "overdue" | "cancelled";

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  name: string;
  quantity?: number | null;
  unit_price?: RupeeString | null;
  amount: RupeeString;
}

export interface InvoiceSettlement {
  id: string;
  invoice_id: string;
  user_id: string;
  amount: RupeeString;
  settled_at: ISODate;
  transaction_id?: string | null;
  payout_id?: string | null;
  notes?: string | null;
  created_at: ISOTimestamp;
}

export interface Invoice {
  id: string;
  user_id: string;
  direction: InvoiceDirection;
  supplier_name?: string | null;
  customer_name?: string | null;
  invoice_number?: string | null;
  invoice_date: ISODate;
  due_date?: ISODate | null;
  total_amount: RupeeString;
  paid_amount: RupeeString;
  status: InvoiceStatus;
  file_path?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  items?: InvoiceItem[];
  settlements?: InvoiceSettlement[];
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

// ---------- WISH 2.0 Persistent Savings Goals (Phase 15) ----------
export type WishGoalStatus = "active" | "completed" | "paused" | "cancelled";

export interface WishContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount: RupeeString;
  contributed_at: ISODate;
  notes?: string | null;
  created_at: ISOTimestamp;
}

export interface WishGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: RupeeString;
  saved_amount: RupeeString;
  target_date?: ISODate | null;
  category?: string | null;
  icon?: string | null;
  status: WishGoalStatus;
  contributions?: WishContribution[];
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

// ---------- Multi-Transaction Conversational Intelligence (Phase 15) ----------
export interface BatchTransactionSummary {
  totalIncomePaise: Paise;
  totalExpensesPaise: Paise;
  netMovementPaise: Paise;
  candidateCount: number;
  validCount: number;
  clarificationCount: number;
  categoryTotals: Record<string, Paise>;
}
