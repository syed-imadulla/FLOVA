// =====================================================================
// FLOVA 2.0 | Sprint 3C — Typed Draft & Confirmation Gate Contracts
// Strictly separates draft preparation from confirmed DB writes.
// =====================================================================

import type {
  ExpenseType,
  GroupSplitType,
  ISODate,
  InflowCategory,
  Paise,
  PeerDebt,
  PeerDebtDirection,
  Person,
  SettlementDirection,
} from "../types/contracts";
import { addTransaction } from "../services/data";
import { createPeerDebt, createPerson, recordDebtSettlement } from "../services/peerDebts";
import { recordGroupExpense } from "../services/groupExpenses";

export type DraftOperationType =
  | "income"
  | "expense"
  | "peer_debt"
  | "debt_settlement"
  | "group_expense";

export type DraftValidationStatus =
  | "incomplete"
  | "valid"
  | "invalid"
  | "expired"
  | "confirmed"
  | "cancelled";

export type DraftMissingField =
  | "amount"
  | "category"
  | "expenseType"
  | "inflowSource"
  | "person"
  | "debt"
  | "group"
  | "payer"
  | "splitShares";

export interface GroupDraftShareItem {
  isSelf: boolean;
  personId: string | null;
  name: string;
  shareAmountPaise: Paise;
  included: boolean;
}

export interface FinancialDraft {
  draftId: string;
  userId: string;
  conversationSessionId: string;
  operationType: DraftOperationType;
  amountPaise: Paise | null;
  category: string | null;
  expenseType: ExpenseType | null;
  inflowCategory: InflowCategory | null;
  personRef: { id?: string; name: string } | null;
  groupRef: { id?: string; name: string } | null;
  debtId?: string;
  debtDirection?: PeerDebtDirection;
  settlementDirection?: SettlementDirection;
  settlementKind?: "partial" | "full";
  paidBySelf?: boolean;
  paidByPersonId?: string | null;
  splitType?: GroupSplitType;
  groupShares?: GroupDraftShareItem[];
  date: ISODate;
  description: string;
  validationStatus: DraftValidationStatus;
  missingFields: DraftMissingField[];
  validationErrors: string[];
  createdAt: number;
  expiresAt: number;
  idempotencyKey: string;
  contentHash: string;
}

export interface DraftWriteDeps {
  userId: string;
  people: Person[];
  peerDebts: PeerDebt[];
  addTransaction: typeof addTransaction;
  createPerson: typeof createPerson;
  createPeerDebt: typeof createPeerDebt;
  recordDebtSettlement: typeof recordDebtSettlement;
  recordGroupExpense: typeof recordGroupExpense;
}

export function createSupabaseDraftWriteDeps(
  userId: string,
  people: Person[],
  peerDebts: PeerDebt[]
): DraftWriteDeps {
  return {
    userId,
    people,
    peerDebts,
    addTransaction,
    createPerson,
    createPeerDebt,
    recordDebtSettlement,
    recordGroupExpense,
  };
}

export type ConfirmationErrorCode =
  | "UNAUTHENTICATED"
  | "USER_MISMATCH"
  | "EXPIRED_DRAFT"
  | "INVALID_DRAFT"
  | "MODIFIED_AFTER_APPROVAL"
  | "DUPLICATE_CONFIRMATION"
  | "CONCURRENT_CONFIRMATION"
  | "SERVICE_ERROR";

export interface DraftConfirmationResult {
  ok: boolean;
  draft: FinancialDraft;
  errorCode?: ConfirmationErrorCode;
  message: string;
  recordId?: string;
}
