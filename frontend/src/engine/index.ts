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
  ExtractionInputSource,
  ExtractionMetadata,
  FinancialExtractionDTO,
  FinancialQueryType,
  ProposedEvidenceType,
  ProposedPaymentMethod,
  ProposedVerificationStatus,
} from "./extractionTypes";

export {
  adaptExtractedCheckin,
  adaptExtractedPayout,
  adaptExtractedTransactions,
  mapCanonicalCategory,
  resolveCorrectionIntent,
  sanitizeExtractedTransaction,
  type CategoryMappingResult,
  type CheckinAdaptationResult,
  type CorrectionResolutionResult,
} from "./extractionAdapter";

export type {
  ExtractedReceiptCandidate,
  PendingDraftContext,
  VoiceTransactionCandidate,
} from "./candidateTypes";

export {
  candidateToNewTransaction,
  confirmCandidateTransaction,
  mapDtoToReceiptCandidates,
  mapDtoToVoiceCandidates,
  safeConvertRupeeStringToPaise,
} from "./candidateAdapter";

export {
  EXTRACTION_RESPONSE_JSON_SCHEMA,
  EXTRACTION_SYSTEM_PROMPT,
  MOCK_EXTRACTION_RESPONSES,
  validateExtractionOutput,
  type ExtractionValidationResult,
  type ValidatedFinancialExtractionDTO,
  type ValidationContext,
} from "./extractionPrompt";
