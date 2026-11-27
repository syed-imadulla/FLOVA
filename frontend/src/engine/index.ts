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
  calculatePeerDebtSummary,
  validateAndApplySettlement,
  validatePeerDebt,
  type PeerDebtSummary,
  type SettlementApplicationResult,
} from "./peerDebtEngine";

export {
  calculateGroupCashAndBalances,
  computeGroupExpenseAccounting,
  splitCustom,
  splitEqual,
  splitPercentage,
  type ComputedSplitShare,
  type GroupAccountingSplit,
  type GroupCashAndBalanceSummary,
  type SplitParticipant,
} from "./groupSplitEngine";

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
  RFC_4122_UUID_REGEX,
  candidateToNewTransaction,
  confirmCandidateTransaction,
  deriveDeterministicUUID,
  generateUUID,
  isValidUUID,
  mapDtoToReceiptCandidates,
  mapDtoToVoiceCandidates,
  resolveCandidateId,
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

export {
  calculateBatchSummary,
  validateBatchCandidate,
  type BatchCandidateValidationResult,
} from "./batchArithmetic";

export {
  calculateAdaptiveBuffer,
  deriveProtectionHorizon,
  type AdaptiveBufferInput,
  type AdaptiveBufferRecommendation,
} from "./adaptiveBuffer";

export {
  generateIncomeForecast,
  type IncomeForecastInput,
  type IncomeForecastResult,
} from "./incomeForecast";

export {
  simulateScenario,
  type ScenarioParameters,
  type ScenarioSimulationResult,
} from "./scenarioSimulator";

export {
  analyzeSpendingIntelligence,
  ANOMALY_THRESHOLDS,
  type CategorySpending,
  type SpendingAnomaly,
  type SpendingIntelligenceReport,
} from "./spendingIntelligence";

export {
  assessFinancialHealth,
  type FinancialHealthIndicator,
  type FinancialHealthInput,
  type FinancialHealthReport,
  type HealthIndicatorStatus,
} from "./financialHealth";

export {
  analyzeWishGoals,
  normalizeWishGoalForEngine,
  simulateWishContribution,
  type WishContributionCadence,
  type WishGoalAnalysis,
  type WishGoalEngineStatus,
  type WishGoalInput,
  type WishIntelligenceInput,
  type WishIntelligenceReport,
} from "./wishIntelligence";

export {
  calculateSafeToSpend,
  type SafeToSpendInput,
  type SafeToSpendResult,
} from "./safeToSpend";

export {
  buildDebtRepaymentPlan,
  compareRepaymentBudgets,
  type CreditorDebtSummary,
  type DebtObligationItem,
  type DebtRepaymentPlan,
  type DebtRepaymentPlannerInput,
  type DebtUrgency,
  type RepaymentBudgetComparison,
} from "./debtRepaymentPlanner";
