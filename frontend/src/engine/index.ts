// =====================================================================
// FLOVA Financial Engine — Public Entry Point (M3)
// =====================================================================

export {
  calculateConfirmedBalance,
  type ConfirmedBalanceBreakdown,
  type ConfirmedBalanceResult,
  type ConfirmedBalanceStatus,
} from "./balance";

export {
  addDays,
  calculateDailyRunway,
  type DailyProjectionEntry,
  type RunwayProjectionInput,
  type RunwayProjectionResult,
  type RunwayProjectionStatus,
} from "./runway";

export {
  isValidISODate,
  isValidISOTimestamp,
  isValidPaise,
  safeAdd,
  safeSub,
  validateBalanceCheckin,
  validatePayout,
  validateRunwayInput,
  validateTransaction,
  type ValidationResult,
} from "./validation";

export type {
  ExtractedCheckinData,
  ExtractedPayoutData,
  ExtractedQueryData,
  ExtractedTransactionData,
  ExtractionActionIntent,
  ExtractionEntryIntent,
  ExtractionMetadata,
  FinancialExtractionDTO,
} from "./extractionTypes";
