# FLOVA 2.0 — Feature Traceability & Gap Analysis Matrix

**Document Version:** 2.0.0-PROD-PLAN-REV2  
**Status:** Approved Architectural Baseline  
**Date:** 2026-11-25  
**Author:** Principal System Architect & Lead Engineer  
**Repository:** `https://github.com/syed-imadulla/FLOVA`  
**Current Production Baseline:** `v1.0.1` (Commit `ab4bdef`)  
**Target General Availability:** `v2.0.0`

---

## 1. Traceability Overview & Classification Legend

### Classification Taxonomy
- **Implemented and Verified:** Fully coded, covered by automated tests, validated on physical Android hardware and web, verified in v1.0.1.
- **Partially Working:** Core logic or UI exists, but lacks end-to-end integration, full persistence, or specific sub-capabilities.
- **Needs Improvement:** Implemented in early form but exhibits usability, performance, architectural, or scalability shortcomings.
- **Not Implemented:** No functional code, schema, or native bridge exists in the repository.

---

## 2. Master Feature Traceability Matrix (Epics A through J)

### Epic A: Assistant-Centered Experience

| User Story ID | Capability & Description | Current Status | Existing Artifacts & Evidence | Gaps & Missing Capabilities | Target Sprint & Release | Acceptance Criteria & Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **US-A1** | **Assistant-First Home Screen:** Proactive companion layout with daily spend envelope, active card carousel, and prompt chips. | Partially Working | `HomeScreen.tsx`, `AppLayout.tsx`, `balance.ts` | Reactive v1.0.1 dashboard. Lacks conversational card carousel, debt summary cards, and quick prompt chips. | Sprint 3 (`v2.0.0-beta.0`) | • Displays Available Liquidity & Sustainable Runway in paise.<br>• Shows pending split/debt reminder cards.<br>• Verified by `HomeScreen.test.tsx`. |
| **US-A2** | **Persistent Voice FAB & Modal Assistant:** Center bottom bar microphone button opening an inline conversational bottom sheet. | Implemented and Verified (Button) / Needs Improvement (Modal) | `AppLayout.tsx` (FAB), `VoiceScreen.tsx` | Currently navigates to standalone `/voice` page. Needs inline persistent bottom sheet overlay retaining background screen context. | Sprint 3 (`v2.0.0-beta.0`) | • Center FAB pulses when listening.<br>• Opens bottom sheet without unloading active screen.<br>• Verified by `AppLayout.test.tsx`. |
| **US-A3** | **Candidate Action Drawer & Feeds:** In-place review drawer for unconfirmed receipts, UPI shares, and voice drafts. | Partially Working | `AddScreen.tsx`, `candidateAdapter.ts`, `CatchScreen.tsx` | Review card exists for single transactions, but lacks multi-item persistent drawer for deferred review. | Sprint 1 (`v2.0.0-alpha.0`) | • Enforces explicit human confirmation tap before DB insertion.<br>• Server/DB constraints validate all payloads.<br>• Verified by `candidateAdapter.test.ts`. |
| **US-A4** | **4-Tab Navigation Restructure:** Clean 4-tab bar: `People`, `Money`, `Insights`, `Profile` + center FAB. | Deferred to Sprint 3 | `AppLayout.tsx` (`/app`, `/activity`, `/voice`, `/insights`, `/more`) | Moved from Sprint 1 to Sprint 3 so Sprint 1 focuses purely on financial foundations and DB compatibility. | Sprint 3 (`v2.0.0-beta.0`) | • Tab bar restructured to People, Money, Insights, Profile.<br>• Verified by routing and layout regression tests. |

---

### Epic B: Two-Way Voice Interaction

| User Story ID | Capability & Description | Current Status | Existing Artifacts & Evidence | Gaps & Missing Capabilities | Target Sprint & Release | Acceptance Criteria & Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **US-B1** | **Speech-to-Text (STT):** High-accuracy transcription in English, Hindi, and Kannada. | Implemented and Verified | `useSpeechToText.ts`, `process-voice` Edge Function | Groq Whisper Large v3 Turbo active and verified. IndicConformer strictly dormant. | Existing (Maintained) | • Transcription accuracy >92% on Indian accents.<br>• Latency <1.2s on mobile 4G/5G. |
| **US-B2** | **Multi-Turn Dialogue & Context:** Conversational memory maintaining session context across 3-5 turns. | Not Implemented | `process-voice/index.ts` | Backend is currently stateless. No dialogue turn history preserved. | Sprint 3 (`v2.0.0-beta.0`) | • Client maintains 3–5 turn session context.<br>• Verified by `voiceTurnManager.test.ts`. |
| **US-B3** | **Missing Field Clarification:** Assistant speaks follow-up questions when required data is missing. | Partially Working | `extractionPrompt.ts`, `process-voice` | Prompt detects `missingFields`, but UI fails to speak follow-up questions or loop back to speech input. | Sprint 3 (`v2.0.0-beta.0`) | • Missing fields trigger verbal prompt.<br>• Microphone auto-resumes for response.<br>• Verified by conversational e2e test. |
| **US-B4** | **Indic Text-to-Speech (TTS):** Natural spoken audio responses acknowledging transactions and answering queries. | Needs Improvement | `VoiceScreen.tsx` (`window.speechSynthesis`) | System speech synthesis inconsistent across mobile WebViews. | Sprint 3 (`v2.0.0-beta.0`) | • Clear spoken summary of parsed candidate.<br>• Visual text fallback if TTS muted/unavailable. |

---

### Epic C: Multi-Agent Intelligence

| User Story ID | Capability & Description | Current Status | Existing Artifacts & Evidence | Gaps & Missing Capabilities | Target Sprint & Release | Acceptance Criteria & Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **US-C1** | **Central Agent Router:** Orchestrator classifying user intent and dispatching to specialized domain agents. | Needs Improvement | Monolithic extraction prompt in `process-voice` | Single prompt attempts to parse everything. Needs modular router with fast-path bypass. | Sprint 3 (`v2.0.0-beta.0`) | • Router dispatches in <250ms.<br>• Zero direct DB write keys in Edge Functions.<br>• Verified by `agentRouter.test.ts`. |
| **US-C2** | **Financial Domain Sub-Agent:** Specialized agent handling expense/income parsing, runway simulations, and envelope math. | Implemented and Verified | `balance.ts`, `runway.ts`, `adaptiveBuffer.ts` | Financial calculation core is complete. Needs encapsulation into domain agent interface. | Sprint 3 (`v2.0.0-beta.0`) | • Deterministic integer-paise output.<br>• Verified by existing + new unit tests. |
| **US-C3** | **People & Repayment Sub-Agent:** Specialized agent parsing peer debt intents ("Lent ₹500 to Ramesh", "Rahul paid back ₹200"). | Not Implemented | None | No peer debt extraction logic exists. | Sprint 3 (`v2.0.0-beta.0`) | • Extracts person name, direction, amount, reason.<br>• Verified by `peopleAgent.test.ts`. |
| **US-C4** | **Receipt Vision Sub-Agent:** Vision model parsing photographed receipts and itemizing expenses. | Implemented and Verified (Client OCR) / Needs Improvement (Line items) | `CatchScreen.tsx`, Tesseract/Groq vision | Extracts merchant and total amount, but lacks line-item extraction and GST math validation. | Sprint 5 (`v2.0.0-rc.0`) | • Itemizes receipt items.<br>• Validates line-item sum against grand total.<br>• Verified by `receiptVision.test.ts`. |

---

### Epic D: Complete Financial Engine

| User Story ID | Capability & Description | Current Status | Existing Artifacts & Evidence | Gaps & Missing Capabilities | Target Sprint & Release | Acceptance Criteria & Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **US-D1** | **Pure Integer-Paise Math:** Zero floating-point arithmetic across all calculations. | Implemented and Verified | `validation.ts`, `balance.ts`, `runway.ts` | Fully operational and enforced across existing engine. | Existing (Maintained) | • 100% test coverage on arithmetic invariants. |
| **US-D2** | **Single Source of Truth & Multi-Stream Segregation:** Separate `income` (`earned`), `family_support`, `pocket_money`, `gift`, `donation` in `transactions`, and `borrowed`, `lent`, `repayment_in`, `repayment_out` in `peer_debts`/`debt_settlements`. | Not Implemented | `contracts.ts` (only `'income' \| 'expense'`) | Borrowing/lending/allowances not yet modeled; must prevent duplicate cash movements between `transactions` and `peer_debts`. | Sprint 1 (`v2.0.0-alpha.0`) | • Zero duplicate rows across `transactions` and `peer_debts`.<br>• Non-earned inflows excluded from `earnedIncomePaise`.<br>• Verified by `singleSourceOfTruth.test.ts` & `financialTaxonomy.test.ts`. |
| **US-D3** | **Available Liquidity vs Sustainable Runway:** Separate liquid cash-flow runway from unencumbered sustainable runway; prevent liability double-counting. | Not Implemented | `runway.ts` | Runway does not model peer debt commitments or separate borrowed liquidity from sustainable capital. | Sprint 1 (`v2.0.0-alpha.0`) | • Borrowed funds never inflate Sustainable Runway.<br>• Due debt commitments deducted once in Available Liquidity.<br>• Verified by `runwayLiability.test.ts`. |
| **US-D4** | **Custodial Cash (`not_mine` / COD) Segregation:** Cash held for employer/client excluded from owned cash and runway. | Implemented and Verified | `money_ownership` enum, `balance.ts`, `runway.ts` | Fully working and verified in v1.0.1. | Existing (Maintained) | • `not_mine` cash strictly excluded.<br>• Verified by `balance.test.ts`. |
| **US-D5** | **Append-Only Financial Audit Ledger:** Immutable audit trail recording every state mutation with actor and before/after diffs. | Needs Improvement | PostgreSQL trigger `log_balance_checkin_delta` | Only exists for balance check-ins. | Sprint 1 (`v2.0.0-alpha.0`) | • `financial_audit_log` records all mutations.<br>• `REVOKE UPDATE, DELETE` + trigger exception.<br>• Verified by `auditLogImmutability.test.sql`. |

---

### Epic E: People and Shared Finance

| User Story ID | Capability & Description | Current Status | Existing Artifacts & Evidence | Gaps & Missing Capabilities | Target Sprint & Release | Acceptance Criteria & Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **US-E1** | **People Directory:** Unified contact directory tracking friends, family, roommates, and clients. | Not Implemented | None | Schema created in Sprint 1; UI built in Sprint 2. | Sprint 1 (DB) / Sprint 2 (UI) | • Table `people` with RLS (`auth.uid() = user_id`).<br>• Search and recent contacts UI. |
| **US-E2** | **Peer Debt & Loan Ledger:** Track who owes whom, remaining balance, due dates, and settlement history. | Not Implemented | None | Schema & engine created in Sprint 1; UI built in Sprint 2. | Sprint 1 (DB/Engine) / Sprint 2 (UI) | • Table `peer_debts` as single source of truth.<br>• Visual color-coded balance cards. |
| **US-E3** | **Partial Settlements:** Record partial repayments and auto-calculate remaining balance atomically. | Not Implemented | `invoice_settlements` (invoices only) | Missing for peer-to-peer debts. | Sprint 1 (DB/Trigger) / Sprint 2 (UI) | • `debt_settlements` trigger validates `amount <= remaining` and updates `peer_debts`.<br>• Verified by `settlement.test.ts`. |
| **US-E4** | **Group Bill Splitting:** Split shared expenses with equal/custom split logic and remainder paise allocation. | Not Implemented | None | Completely missing. | Sprint 2 (`v2.0.0-alpha.1`) | • Sum of split shares equals total in integer paise.<br>• Verified by `splitEngine.test.ts`. |

---

### Epic F: Student, Family and Gig Finance

| User Story ID | Capability & Description | Current Status | Existing Artifacts & Evidence | Gaps & Missing Capabilities | Target Sprint & Release | Acceptance Criteria & Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **US-F1** | **Student Pocket Money & Semester Mode:** Track parental allowance, daily burn rate, and days until next allowance. | Not Implemented | `profiles.work_profile` enum | Inflow category in Sprint 1; student runway UI in Sprint 4. | Sprint 4 (`v2.0.0-beta.1`) | • `pocket_money` segregated from earned revenue.<br>• Verified by `studentBudget.test.ts`. |
| **US-F2** | **Family Household Shared Expenses:** Pooled household budget tracking shared groceries, rent, and utilities. | Not Implemented | None | Completely missing. | Sprint 4 (`v2.0.0-beta.1`) | • Dual-view: Individual vs Household pool.<br>• Verified by `familyFinance.test.ts`. |
| **US-F3** | **Gig Platform Payout Reconciliation:** Automatic reconciliation of weekly/daily platform earnings and COD settlement. | Implemented and Verified | `payouts` table, `payout-sync` Edge Function | Fully functional. | Existing (Maintained) | • Unearned payouts segregated from available cash. |

---

### Epic G: Receipt and UPI Intelligence

| User Story ID | Capability & Description | Current Status | Existing Artifacts & Evidence | Gaps & Missing Capabilities | Target Sprint & Release | Acceptance Criteria & Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **US-G1** | **Android UPI Share Target (`ACTION_SEND`):** Intercept shared payment confirmation screenshots and text from UPI apps. | Implemented and Verified | `MainActivity.java`, `ShareReceiverPlugin.java`, `CatchScreen.tsx` | Shipped and verified in v1.0.1. | Existing (Maintained) | • Handles GPay, PhonePe, Paytm, BHIM.<br>• 100% duplicate delivery protection. |
| **US-G2** | **Receipt Image Cloud Persistence:** Upload receipt images to private cloud storage with user-scoped access. | Not Implemented | Local in-memory processing only | Missing `receipts/` bucket. | Sprint 5 (`v2.0.0-rc.0`) | • Supabase Storage `receipts/` bucket with signed URLs. |
| **US-G3** | **Itemized OCR & Line Item Extraction:** Parse individual line items, GST breakdown, and vendor categorization. | Partially Working | `CatchScreen.tsx` OCR | Only parses merchant name and total amount. | Sprint 5 (`v2.0.0-rc.0`) | • Line-item sum equals grand total. |

---

### Epic H: Goals and Financial Intelligence

| User Story ID | Capability & Description | Current Status | Existing Artifacts & Evidence | Gaps & Missing Capabilities | Target Sprint & Release | Acceptance Criteria & Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **US-H1** | **WISH 2.0 Goal Simulator:** Goal tracking with automatic contribution allocation and shortfall simulation. | Implemented and Verified | `wish_goals`, `wish_contributions`, `wish.ts` | Fully operational in v1.0.1. | Existing (Maintained) | • Deterministic goal projection. |
| **US-H2** | **Proactive Daily Spend Envelope:** Adaptive daily spending limit based on income variability and upcoming commitments. | Partially Working | `adaptiveBuffer.ts`, `runway.ts` | Backend calculation exists, not surfaced prominently on Home screen. | Sprint 4 (`v2.0.0-beta.1`) | • Real-time spend envelope displayed with 80%/100% alerts. |

---

### Epic I: Android Widget and Proactive Assistance

| User Story ID | Capability & Description | Current Status | Existing Artifacts & Evidence | Gaps & Missing Capabilities | Target Sprint & Release | Acceptance Criteria & Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **US-I1** | **Compact Mic Widget (2×2):** Home-screen widget with large mic button for instant voice capture. **No balance/financial data displayed.** | Implemented and Verified | `CompactMicWidgetProvider.java`, `widget_compact_mic.xml` | Shipped, verified on Xiaomi Redmi 12 5G in v1.0.1. | Existing (Maintained) | • Deep links to `/voice?record=true`.<br>• Zero financial numbers exposed. |
| **US-I2** | **Quick Actions Widget (2×2 & 4×2):** Home-screen widget with 4 actions (Voice, Add, Receipt, History). **No balance displayed.** | Implemented and Verified | `QuickActionsWidgetProvider.java`, `widget_quick_actions.xml` | Shipped, verified on Xiaomi Redmi 12 5G in v1.0.1. | Existing (Maintained) | • 2×2 default, 4×2 expanded.<br>• Zero financial numbers exposed. |
| **US-I3** | **Local Push Notifications & Alarms:** Evening daily spend check-in reminder and upcoming debt payment alerts. | Not Implemented | None | No background notification scheduling currently wired. | Sprint 5 (`v2.0.0-rc.0`) | • Scheduled evening reminder & 48h/24h debt alerts. |

---

### Epic J: Reliability and Release

| User Story ID | Capability & Description | Current Status | Existing Artifacts & Evidence | Gaps & Missing Capabilities | Target Sprint & Release | Acceptance Criteria & Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **US-J1** | **Offline Write-Ahead Log (WAL):** Offline transaction queue persisting actions to IndexedDB and syncing on reconnect. | Not Implemented | Online-only API calls | App fails if offline when saving. | Sprint 6 (`v2.0.0`) | • IndexedDB outbox + idempotent replay. |
| **US-J2** | **Permanent Release Signing & GitHub APK Distribution:** Cryptographic continuity via signed GitHub Release APK. | Implemented and Verified | `~/.android/flova-release.keystore`, `build.gradle` | Alias `flova-release`, RSA 4096, Min 24, Compile/Target 36, SHA-256 `3E:2E:D1:...`. | Existing (Maintained) | • Signed APK published to GitHub Releases.<br>• Zero Google Play / AAB dependencies. |
| **US-J3** | **Migration Safety & Forward-Only Production Evolution:** Seeded v1.0.1 compatibility tests, disposable local rollbacks, and forward-only prod fixes. | Needs Improvement | 11 migrations in `backend/supabase/migrations/` | Lacks automated v1.0.1 seeded compatibility tests and formal forward-only prod policy. | Sprint 1 (`v2.0.0-alpha.0`) | • Local up/down migration tests on seeded v1.0.1 DB.<br>• All 78 existing tests pass unmodified.<br>• Zero production data loss. |
