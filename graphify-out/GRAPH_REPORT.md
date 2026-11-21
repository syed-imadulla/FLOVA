# Graph Report - FLOVA  (2026-11-21)

## Corpus Check
- 324 files · ~216,789 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 5, (none) 3, .example 3)

## Summary
- 2027 nodes · 4827 edges · 145 communities (115 shown, 30 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 328 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6797f8aa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.py
- RunwayInput
- VERDICT — pick-f1-irregular-income
- contracts.ts
- frontend/package.json
- paiseToRupeeString
- toPaise
- test-db.mjs
- STATEMENTS — The Big Hack 2.0
- Scenario B: Live Date Browser Checks (Interactive / Manual)
- compilerOptions
- BRIEF — The Big Hack 2.0
- BRIEF — The Big Hack 2.0
- STATE — The Big Hack 2.0
- FLOVA backend (M1)
- ASSUMPTIONS — F1 irregular income (idea not chosen yet)
- ai-engine/README.md
- CLAUDE.md
- frontend/README.md
- pick-f1-irregular-income/defense.md
- pick-f1-irregular-income/prosecution.md
- pick-r1-vibe-code/defense.md
- pick-r1-vibe-code/prosecution.md
- pick-r3-token-tax/defense.md
- pick-r3-token-tax/prosecution.md
- udaan-engine
- Tests
- react
- FLOVA Financial Engine (M3)
- dates.test.ts
- Project State
- Tests
- kit.tsx
- 2. Work Breakdown & Execution Waves
- Technology Stack
- Testing Patterns
- Card
- App.tsx
- Tests
- 01-01-PLAN.md
- Plan 02-01: Profile and Onboarding Persistence
- browser-audit.mjs
- Phase 4: Runway Feed Verification Report
- Progress
- Plan 03-01: Data Capture Hooks and Pages
- Icons.tsx
- FLOVA (Udaan 2.0)
- Goal Achievement
- v1 Requirements
- Tasks
- ActivityItem
- generalisedProfiles.test.ts
- Plan 08-01: Secure FLOVA Catch (Receipt Extraction)
- PhonePeLandingPage.tsx
- Locked Architectural Decisions (From Discussion)
- Goal Achievement
- engine/index.ts
- engine/index.ts
- FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)
- icons.tsx
- Key Architectural & Design Decisions
- loadRunwayInput
- smartCaptureReceiptUpi.test.ts
- useWish.ts
- VoiceScreen.tsx
- Key Architectural & Design Decisions
- extractTransaction.ts
- OneRupeeCoin
- data.ts
- addTransaction
- test_engine.py
- PayoutsScreen.tsx
- 1. Locked Decisions & Core Architecture
- 2. Band-by-Band Cadence in Video 2
- v1 Requirements
- Tasks
- kit.tsx
- FLOVA data contract (v1 · owner: M1)
- activityAndOverview.test.ts
- MockQueryBuilder
- FLOVA Hero Section Blueprint: Video 1 Deep Analysis
- candidateAdapter.ts
- listActivityTimeline
- Phase 9.1 User Acceptance Testing (UAT)
- FinancialExtractionDTO
- Phase 7 Verification Report: Financial Data Contracts
- Phase 8 Verification Report: Secure FLOVA Catch
- Phase 10 User Acceptance Testing (UAT)
- useAudioRecorder.ts
- Phase 6 Verification Report: Realistic Demo Data
- Phase 6: Support Realistic Demo Data - Context & Invariants
- Phase 9.1 Verification Report
- useSession.ts
- Architecture & Work Breakdown
- Phase 10.2: Application UI shell and screens — Plan 01
- Phase 10.2 Plan 01: Summary
- sw.js
- useVoiceRecorder.ts
- useSpeechToText.ts
- wish.ts
- 1. Architecture & Design Decisions
- 1. Locked Architecture Decisions
- 1. Requirements & Acceptance Criteria Verification
- FLOVA — M1 Edge Function Integration Contract (Owner: M3 / AI Engine)
- InsightsScreen.tsx
- Phase 5: Payout Synchronization Hardening & Idempotency Verification Report
- invoices.ts
- Phase 8 Plan 01 Summary: Secure FLOVA Catch (Receipt Extraction)
- PhonePeAppstoreHalo.tsx
- Implementation Tasks
- Plan 10-01: Financial Activity, Money Overview & Deterministic Insights
- FLOVA — Handoff & Full Context (2026-11-21)
- categories.ts
- parseRupees.test.ts
- FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)
- Implementation Tasks
- Implementation Decisions
- Goal Achievement
- Phase 17 Verification: AI4Bharat IndicConformer Primary STT Migration
- useMonthSummary.ts
- 2. Work Breakdown
- 1. Requirements & Acceptance Criteria Verification
- FinancialExtractionDTO
- Phase 1: Core Financial Correctness, Navigation and Account Management Verification Report
- Technical Decisions & Architecture
- Phase 9: Secure Voice Transcription and Financial Intent Integration — Context & Decisions
- Phase 7 Plan 01 Summary: Financial Data Contracts & Timeline Helpers
- Decisions
- ISODate
- Phase 9 Verification Report: Secure Voice Transcription & Intent Integration
- Phase 9.1 Context: Multilingual Voice Support & Language-Specific Financial Extraction
- Plan 10-01 Summary: Financial Activity, Money Overview & Deterministic Insights
- Phase 10 Verification Report
- Phase 9 User Acceptance Testing (UAT) Report: Voice Transcription & Intent Integration

## God Nodes (most connected - your core abstractions)
1. `react` - 85 edges
2. `toPaise()` - 68 edges
3. `todayLocalISO()` - 52 edges
4. `Notice()` - 44 edges
5. `Paise` - 41 edges
6. `formatINR()` - 38 edges
7. `Card()` - 38 edges
8. `useSession()` - 36 edges
9. `FinancialExtractionDTO` - 34 edges
10. `Button()` - 34 edges

## Surprising Connections (you probably didn't know these)
- `Tasks` --references--> `AppLayout()`  [INFERRED]
  .planning/phases/10.2-app-ui-shell/10.2-01-PLAN.md → frontend/src/app/AppLayout.tsx
- `Task 1: Improved Receipt Scanning and Extraction` --references--> `todayLocalISO()`  [INFERRED]
  .planning/phases/14-smart-capture-receipt-intelligence-upi-share-integration/14-VERIFICATION.md → frontend/src/data/dates.ts
- `3. Receipt & Line Item Extraction Invariants` --references--> `todayLocalISO()`  [INFERRED]
  .planning/phases/16-complete-receipt-upi-extraction-repair/16-CONTEXT.md → frontend/src/data/dates.ts
- `6. M1 Backend & Edge Function Integration` --references--> `validateExtractionOutput()`  [INFERRED]
  ai-engine/EXTRACTION_CONTRACT.md → frontend/src/engine/extractionPrompt.ts
- `Endpoint` --references--> `FinancialExtractionDTO`  [INFERRED]
  ai-engine/M1_GROQ_INTEGRATION.md → frontend/src/engine/extractionTypes.ts

## Import Cycles
- None detected.

## Communities (145 total, 30 thin omitted)

### Community 0 - "main.py"
Cohesion: 0.06
Nodes (18): generate_test_audio(), run_benchmarks(), convert_audio_to_16k_mono_wav(), load_wav_as_numpy(), Settings, IndicConformerEngine, health_check(), HealthResponse (+10 more)

### Community 1 - "RunwayInput"
Cohesion: 0.18
Nodes (28): calculateConfirmedBalance(), validateExtractionOutput(), addDays(), calculateDailyRunway(), RunwayProjectionInput, simulateScenario(), baseProfile, baseProfile (+20 more)

### Community 2 - "VERDICT — pick-f1-irregular-income"
Cohesion: 0.05
Nodes (40): An alternative approach (same problem, same user), Contradictions between jurors, If I were your team…, Next experiment (30 min), Ranked improvements, Ratings /10, VERDICT — pick-f1-irregular-income, Votes (+32 more)

### Community 3 - "contracts.ts"
Cohesion: 0.09
Nodes (19): BatchCandidateValidationResult, validateBatchCandidate(), RFC-4122, APP_LANGUAGES, AppLanguage, BatchTransactionSummary, COMMITMENT_KINDS, COMMITMENT_STATUSES (+11 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.06
Nodes (33): dependencies, react, react-dom, react-router-dom, @supabase/supabase-js, devDependencies, autoprefixer, postcss (+25 more)

### Community 5 - "paiseToRupeeString"
Cohesion: 0.11
Nodes (18): paiseToRupeeString(), Payout, Architectural Constraints, Architecture, Component Responsibilities, Data Flow, Entry Points, Error Handling (+10 more)

### Community 6 - "toPaise"
Cohesion: 0.33
Nodes (15): toPaise(), InvoicesScreen(), handleCreateInvoice(), handleLinkToRunway(), handleRecordSettlement(), loadData(), resetNewForm(), addInvoiceSettlement() (+7 more)

### Community 7 - "test-db.mjs"
Cohesion: 0.06
Nodes (33): description, devDependencies, @electric-sql/pglite, @supabase/supabase-js, @supabase/supabase-js, name, private, scripts (+25 more)

### Community 8 - "STATEMENTS — The Big Hack 2.0"
Cohesion: 0.12
Nodes (15): Dropped, First read: fit with our team and the booklet rubric [AI], ⚠ Rubric conflict (resolved 14:15 IST: team uses the booklet rubric), Statement B1: Know what you're signing, Statement B2: Fair tickets, Statement B3: Logs the attacker can't erase, Statement F1: The irregular income problem, Statement F2: Credit for the credit-invisible (+7 more)

### Community 9 - "Scenario B: Live Date Browser Checks (Interactive / Manual)"
Cohesion: 0.08
Nodes (25): 1. Baseline Balance Calculation, 1. Frontend Build, 2. M3 Engine Core Test Suite, 2. Transaction Deductions, 3. Currency Parser Unit Tests, 3. Daily Essential Living & Work Outflows, 4. Local Date Formatting Unit Tests, 4. Upcoming Commitment Deductions (+17 more)

### Community 10 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noUnusedLocals (+5 more)

### Community 11 - "BRIEF — The Big Hack 2.0"
Cohesion: 0.20
Nodes (9): BRIEF — The Big Hack 2.0, Deliverables and limits, Event, Judging rubric, Rules (pre-built code, data, APIs, team size), Sponsor tech / required tools, Team, Time (+1 more)

### Community 12 - "BRIEF — The Big Hack 2.0"
Cohesion: 0.20
Nodes (9): BRIEF — The Big Hack 2.0, Deliverables and limits, Event, Judging rubric, Rules (pre-built code, data, APIs, team size), Sponsor tech / required tools, Team, Time (+1 more)

### Community 13 - "STATE — The Big Hack 2.0"
Cohesion: 0.22
Nodes (8): Decisions log, Locked, Next command, Pending, Phases, Rules, STATE — The Big Hack 2.0, Time guard

### Community 14 - "FLOVA backend (M1)"
Cohesion: 0.40
Nodes (4): FLOVA backend (M1), Set up Supabase (once), Tables, Test

### Community 15 - "ASSUMPTIONS — F1 irregular income (idea not chosen yet)"
Cohesion: 0.40
Nodes (4): All assumptions, ASSUMPTIONS — F1 irregular income (idea not chosen yet), Status history, Test-first list

### Community 33 - "Tests"
Cohesion: 0.10
Nodes (20): 10. Form state preservation on tab switch, 1. Balance check-in and COD bounds, 1. Currency parser unit tests, 2. Add income and expense transactions, 2. Local date formatting unit tests, 3. Expense Living/Work validation, 3. M3 Engine tests regression suite, 4. COD not-mine transaction (+12 more)

### Community 34 - "react"
Cohesion: 0.21
Nodes (12): FlovaBottomCTA(), FlovaClarityShowcase(), FlovaFooter(), FlovaHero(), FlovaHowItWorks(), FlovaIndiaContext(), FlovaLandingPage(), FlovaNavbar() (+4 more)

### Community 35 - "FLOVA Financial Engine (M3)"
Cohesion: 0.20
Nodes (9): Architectural Principles, Calculation Semantics (Option A), FLOVA Financial Engine (M3), Historical Ravi Fixture Preservation, Key Rules:, Option A: Remaining Daily Budget Logic, Problem Addressed, Results: (+1 more)

### Community 36 - "dates.test.ts"
Cohesion: 0.40
Nodes (4): d1, d2, iso1, iso2

### Community 37 - "Project State"
Cohesion: 0.29
Nodes (6): Current Position, Integration Milestone (2026-11-21), Performance Metrics, Phase 10.2: Application UI Shell & Live AI (2026-11-21), Project Reference, Project State

### Community 38 - "Tests"
Cohesion: 0.13
Nodes (14): 1. Logged out redirect to /login (B1), 2. Sign up with new email and display name (B2), 3. Session persistence on refresh (B3), 4. Logout and route protection (B4), 5. Login error handling (B5), 6. Redirect authenticated user away from /login (B6), 7. Client-side password length validation (B7), A. Live RLS Test (+6 more)

### Community 39 - "kit.tsx"
Cohesion: 0.15
Nodes (27): Frontend data hooks (`frontend/src/data/`), useActivity(), useMonthSummary(), useSession(), DataVersionContext, DataVersionContextType, DataVersionProvider(), useDataVersion() (+19 more)

### Community 40 - "2. Work Breakdown & Execution Waves"
Cohesion: 0.12
Nodes (15): Invoice, InvoiceItem, InvoiceSettlement, WishContribution, WishGoal, 1. Overview & Objectives, 2. Work Breakdown & Execution Waves, Owner: M1 Backend & Integration (+7 more)

### Community 41 - "Technology Stack"
Cohesion: 0.25
Nodes (7): Configuration, Frameworks, Key Dependencies, Languages, Platform Requirements, Runtime, Technology Stack

### Community 42 - "Testing Patterns"
Cohesion: 0.29
Nodes (6): Mocking & Isolation, Required Pre-Shipping Checks, Test File Organization, Test Framework, Test Structure, Testing Patterns

### Community 43 - "Card"
Cohesion: 0.15
Nodes (43): PAYOUT_LABELS, VARIABILITY_LABELS, WORK_LABELS, TransactionForm(), submit(), parseOptionalRupees(), parseRequiredRupees(), ParseRequiredRupeesResult (+35 more)

### Community 44 - "App.tsx"
Cohesion: 0.16
Nodes (19): App(), RedirectIfAuthed(), RequireAuth(), ProfileProvider(), RequireOnboarded(), useProfile(), GROUPS, MoreScreen() (+11 more)

### Community 45 - "Tests"
Cohesion: 0.12
Nodes (15): 1. Currency parser unit tests, 1. New user signup routing, 2. Blank ₹ fields submission, 2. M3 Engine tests regression suite, 3. Database test suite, 3. Session refresh persistence, 4. Edit profile updates immediately, 5. Client-side validation (+7 more)

### Community 48 - "browser-audit.mjs"
Cohesion: 0.05
Nodes (32): __dirname, __filename, mockSupabasePath, 1. File Size & Client-Side Image Optimization, 1. Root Cause Analysis of Previous Failure, 2. Edge Function Model Management (`extract-receipt`), 2. Locked Implementation Decisions, 3. Receipt & Line Item Extraction Invariants (+24 more)

### Community 49 - "Phase 4: Runway Feed Verification Report"
Cohesion: 0.33
Nodes (5): Goal Achievement, Investigation Findings: Previous Aggregate Test Command Failures, M1 Data Layer & M3 Engine Integration Audit, Observable Truths, Phase 4: Runway Feed Verification Report

### Community 50 - "Progress"
Cohesion: 0.22
Nodes (8): Overview, Phase 13: Core Financial Correctness, Navigation and Account Management, Phase 14: Smart Capture, Receipt Intelligence & UPI Share Integration, Phase 15: Conversational & Adaptive Financial Intelligence, Phase 16: Complete Receipt & UPI Extraction Pipeline Repair, Phases, Progress, Roadmap: FLOVA (12-Phase Hackathon Roadmap)

### Community 52 - "Icons.tsx"
Cohesion: 0.06
Nodes (70): api, BacktestRow, FALLBACK_PROFILES, OutlookWeek, Plan, Profile, Rider, rs() (+62 more)

### Community 54 - "FLOVA (Udaan 2.0)"
Cohesion: 0.25
Nodes (7): 1. Database Regression Suite (PGlite), 2. Multi-Connection PostgreSQL Concurrency & Deadlock Suite, 3. Frontend Compilation & Idempotent Retry UX Suite, Current Test, Gaps, Summary, Tests

### Community 55 - "Goal Achievement"
Cohesion: 0.50
Nodes (3): Goal Achievement, Observable Truths, Phase 3: Data Capture Hooks Verification Report

### Community 56 - "v1 Requirements"
Cohesion: 0.29
Nodes (6): PGDATABASE, PGHOST, PGPASSWORD, PGPORT, PGUSER, test-concurrency-postgres.sh script

### Community 57 - "Tasks"
Cohesion: 0.18
Nodes (10): Goal, Plan 16-01: Complete Receipt & UPI Extraction Pipeline Repair, Task 1: Client-Side Image Optimizer & 20MB Validation, Task 2: Supabase Edge Function Upgrade (`extract-receipt`), Task 3: Frontend Receipt Extraction Service Upgrade, Task 4: Catch Screen Progress UI & Error Resilience, Task 5: Review & Add Screen Enhancement, Task 6: Comprehensive Automated Test Suite (+2 more)

### Community 58 - "ActivityItem"
Cohesion: 0.20
Nodes (9): ActivityItem, Objectives, Plan 07-01: Financial Data Contracts & Timeline Helpers, Tasks, Context, Phase 6: Demo data, Phase 7: Financial data contracts, Phase 8: Secure FLOVA Catch receipt extraction integration (+1 more)

### Community 59 - "generalisedProfiles.test.ts"
Cohesion: 0.31
Nodes (8): assertStrictEqual(), assertTrue(), it(), runTests(), INCOME_VARIABILITIES, OCCUPATION_WORK_CATEGORIES, UNIVERSAL_LIVING_CATEGORIES, WORK_PROFILES

### Community 60 - "Plan 08-01: Secure FLOVA Catch (Receipt Extraction)"
Cohesion: 0.20
Nodes (9): Edge Function Contract (`extract-receipt`), Implementation Tasks, Objectives, Plan 08-01: Secure FLOVA Catch (Receipt Extraction), Security Boundaries & Rules, Task 0: Supabase Edge Function (`backend/supabase/functions/extract-receipt/index.ts`), Task 1: Frontend Receipt Service (`frontend/src/services/receipt.ts`), Task 3: Automated Test Suite (`frontend/src/services/__tests__/receiptExtraction.test.ts`) (+1 more)

### Community 61 - "PhonePeLandingPage.tsx"
Cohesion: 0.11
Nodes (19): PhonePeConcentricSection(), PhonePeConvenienceBills(), PhonePeDotWaveDevices(), PhonePeHeroPillars(), PhonePeHeroPillarsProps, PhonePeHeroSlider(), PhonePeHeroSliderProps, SlideData (+11 more)

### Community 62 - "Locked Architectural Decisions (From Discussion)"
Cohesion: 0.25
Nodes (7): 1. Routing & Screen Anchoring, 2. Timeline Item Distinction & Expected Payouts, 3. Four Deterministic Financial Insights, 4. Financial Safety & Truthful Uncertainty, Locked Architectural Decisions (From Discussion), Phase 10 Context: Financial Activity, Money Overview & Insights, Phase Goal

### Community 64 - "engine/index.ts"
Cohesion: 0.12
Nodes (25): ConfirmedBalanceResult, ConfirmedBalanceStatus, adaptExtractedCheckin(), adaptExtractedPayout(), adaptExtractedTransactions(), CategoryMappingResult, CorrectionResolutionResult, resolveCorrectionIntent() (+17 more)

### Community 65 - "engine/index.ts"
Cohesion: 0.08
Nodes (24): 1. Overview & Architectural Boundaries, Architectural Rules, AdaptiveBufferInput, AdaptiveBufferRecommendation, calculateAdaptiveBuffer(), deriveProtectionHorizon(), ProfileLike, ConfirmedBalanceBreakdown (+16 more)

### Community 66 - "FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)"
Cohesion: 0.18
Nodes (10): 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (Draft 2020-12 Compatible), 5. Concrete Extraction Examples, 6. M1 Backend & Edge Function Integration, Example 1: Multi-Transaction Sentence (Income + Expense), Example 2: Today's Spending Voice Query, Example 3: Pending Payments Voice Query (+2 more)

### Community 67 - "icons.tsx"
Cohesion: 0.20
Nodes (14): AppLayout(), MORE_PATHS, Tab(), IconActivity, IconChart, IconHome, IconInsights, IconLogout (+6 more)

### Community 68 - "Key Architectural & Design Decisions"
Cohesion: 0.29
Nodes (7): 1. Security Boundary & Server-Side Credentials, 2. Dual-Stage Groq AI Pipeline (Whisper + Llama 3.3), 3. Canonical Data Contracts: FinancialExtractionDTO & VoiceTransactionCandidate, 4. Truthful Uncertainty & Anti-Hallucination, 5. Mandatory User Confirmation & Read-Only Inference, 6. Fallback Input, Key Architectural & Design Decisions

### Community 69 - "loadRunwayInput"
Cohesion: 0.18
Nodes (15): Service functions (`frontend/src/services/`), toPaiseOrNull(), getLatestCheckin(), getMyProfile(), listPayouts(), loadRunwayInput(), Primary Runway Feed Path, Objectives (+7 more)

### Community 70 - "smartCaptureReceiptUpi.test.ts"
Cohesion: 0.05
Nodes (72): confirmCandidateTransaction(), listTransactions(), fallbackFileRead(), MAX_IMAGE_DIMENSION_PX, MAX_IMAGE_FILE_SIZE_BYTES, OPTIMIZATION_QUALITY, OptimizedImageResult, SUPPORTED_IMAGE_MIME_TYPES (+64 more)

### Community 71 - "useWish.ts"
Cohesion: 0.15
Nodes (24): calculateWish(), ContributionCadence, CreateWishInput, formatDateISO(), formatMonthYear(), Wish, WishCalculation, WishStatus (+16 more)

### Community 72 - "VoiceScreen.tsx"
Cohesion: 0.11
Nodes (29): paiseToInput(), rupeeStringToInput(), emptyDraft(), todayLocalISO(), calculateBatchSummary(), AddScreen(), confirmAllBatch(), newId() (+21 more)

### Community 73 - "Key Architectural & Design Decisions"
Cohesion: 0.20
Nodes (9): 1. Security Boundary & API Key Protection, 2. AI Provider: Groq (Verified Model Identifiers), 3. Truthful Uncertainty & Contract Alignment, 4. Mandatory User Confirmation, 5. Input Modes: Dual Image & Pasted-Text, 6. Idempotency & Retries, Key Architectural & Design Decisions, Phase 8: Secure FLOVA Catch (Receipt Extraction) — Context & Decisions (+1 more)

### Community 74 - "extractTransaction.ts"
Cohesion: 0.06
Nodes (38): corsHeaders, ExtractReceiptRequest, GROQ_PIN, GROQ_PREFS, groqCandidates(), groqListModels(), groqModelUnavailable(), groqWithModelFallback() (+30 more)

### Community 75 - "OneRupeeCoin"
Cohesion: 0.26
Nodes (8): HeroSection(), HeroSectionProps, LandingSections(), LandingSectionsProps, OneRupeeCoin(), OneRupeeCoinProps, MorphBridgeProps, OneRupeeMorphBridge()

### Community 76 - "data.ts"
Cohesion: 0.16
Nodes (23): unwrap(), ProfileContext, ProfileContextType, save(), addCheckin(), addCommitment(), addPayout(), listCommitments() (+15 more)

### Community 77 - "addTransaction"
Cohesion: 0.12
Nodes (21): addTransaction(), receivePayout(), assertStrictEqual(), assertTrue(), it(), runTests(), NewTransaction, Task 1: Client-Side Idempotency (+13 more)

### Community 78 - "test_engine.py"
Cohesion: 0.07
Nodes (35): test_backtest_shape(), test_buffer_never_negative_and_money_is_conserved(), test_estimate_ignores_one_big_week(), test_estimate_with_little_history_is_cautious(), test_generate_year_is_reproducible(), test_lean_week_is_covered_by_buffer(), test_low_income_is_not_called_a_timing_problem(), test_negative_income_week_handled() (+27 more)

### Community 79 - "PayoutsScreen.tsx"
Cohesion: 0.33
Nodes (8): KIND_LABEL, newId(), OPEN, PayoutPrefillState, ReceiveBody(), ReceiveSheet(), PayoutKind, Sheet()

### Community 80 - "1. Locked Decisions & Core Architecture"
Cohesion: 0.22
Nodes (8): 1. Locked Decisions & Core Architecture, 2. Boundaries & Out-of-Scope, Decision 1: Database Trigger Derived Totals & Row-Level Locking, Decision 2: Status State Machine Transitions, Decision 3: Deadlock-Free Payout Reassignment, Decision 4: Client-Side Submission Idempotency, Decision 5: Security & RLS Invariants, Phase 5: Payout Synchronization Hardening - Context & Decisions

### Community 81 - "2. Band-by-Band Cadence in Video 2"
Cohesion: 0.13
Nodes (14): 1. Hero-to-Followup 1-Rupee Indian Coin Morph Transition, 2. Band-by-Band Cadence in Video 2, 3. Currency & Data Rules Mapping (FLOVA Contract Compliance), 4. Master Build Roadmap (Step 3 Preview), Band 1: Dark Feature Showcase Card (`#111214` / `#141517`), Band 2: 4-Column Feature & Value Strip (Light Paper Surface), Band 3: Fine-Grid Testimonial & Real Worker Stories Band, Band 4: Vibrant Cyan/Aqua Callout Banner (`#25DCF5` / `#00D2F0`) (+6 more)

### Community 82 - "v1 Requirements"
Cohesion: 0.17
Nodes (11): Out of Scope, Phase 1: Authentication Flow, Phase 2: Profile & Onboarding Data, Phase 3: Data Capture Hooks & Mutation Services, Phase 4: Runway Feed & Engine Integration, Phase 5: Secure AI Function (Stretch), Phase 6: Demo Data Seed & Test Fixtures, Phase 7: Deployment & Production Smoke Test (+3 more)

### Community 83 - "Tasks"
Cohesion: 0.29
Nodes (6): Objectives, Plan 05-01: Payout Synchronization Hardening & Idempotency, Task 0: Database Migration (`20261121000100_harden_payout_sync.sql`), Task 2: PGlite Comprehensive Regression Suite, Task 3: Real Multi-Connection PostgreSQL Concurrency Test, Tasks

### Community 84 - "kit.tsx"
Cohesion: 0.16
Nodes (19): ActivityScreen(), EditBody(), remove(), Filter, CheckinScreen(), deleteTransaction(), IconBank, IconClose (+11 more)

### Community 85 - "FLOVA data contract (v1 · owner: M1)"
Cohesion: 0.20
Nodes (10): `balance_checkins` (actual cash + bank at a moment), `commitments` (bills and debts), FLOVA data contract (v1 · owner: M1), How to record each money situation, `payouts` (money expected, **not cash until received**), `profiles` (one per user, created automatically at sign-up), Rules everyone follows, Rules for M3's runway engine (from the master plan) (+2 more)

### Community 86 - "activityAndOverview.test.ts"
Cohesion: 0.60
Nodes (5): generateFinancialInsights(), assertStrictEqual(), assertTrue(), it(), runTests()

### Community 87 - "MockQueryBuilder"
Cohesion: 0.13
Nodes (3): MockQueryBuilder, Phase 7 UAT: Financial Data Contracts & Timeline Helpers, User Acceptance Criteria & Results

### Community 88 - "FLOVA Hero Section Blueprint: Video 1 Deep Analysis"
Cohesion: 0.20
Nodes (9): 1. Canvas, Background Surface & Spatial Framing, 2. Top Navigation Bar (Fixed / Sticky Editorial Header), 3. Centered Typography Lockup & Easing Choreography, 4. Central Focal Visual (Centerpiece), 5. Hand-Drawn Sketch Annotations, Medallion & Secondary Visuals, 6. Reveal on Scroll (Sub-Hero Section at `t = 12s–17.8s`), 7. Motion Choreography & Parallax Execution Plan, 8. Readiness Checklist for Video 2 & Master Build (+1 more)

### Community 89 - "candidateAdapter.ts"
Cohesion: 0.13
Nodes (29): 1. Overview & Ownership Boundaries, categoriesFor(), candidateToNewTransaction(), confirmCandidateTransaction(), deriveDeterministicUUID(), fnv1a32(), generateUUID(), getTransactionsFromDto() (+21 more)

### Community 90 - "listActivityTimeline"
Cohesion: 0.31
Nodes (9): listActivityTimeline(), ActivityItemKind, 1. Extend Contracts & Timeline Service, 2. Implement Deterministic Financial Insights Engine, 3. Build Financial Activity Screen (`/activity`), 4. Build Money Overview Screen (`/overview`), 6. Automated Verification & Regression Testing, Tasks (+1 more)

### Community 91 - "Phase 9.1 User Acceptance Testing (UAT)"
Cohesion: 0.25
Nodes (7): Phase 9.1 User Acceptance Testing (UAT), Scenario 1: Language Pinned Transcription (Kannada), Scenario 2: Hindi Living Expense Extraction, Scenario 3: Truthful Uncertainty / Missing Amount (Kannada), Scenario 4: Platform Expected Payout Isolation (Telugu), Scenario 5: Balance Check-in Segregation (Urdu), Scenario 6: Multilingual Deterministic Financial Queries

### Community 92 - "FinancialExtractionDTO"
Cohesion: 0.29
Nodes (6): Edge Function Contract (`process-voice`), Objectives, Plan 09-01: Secure Voice Transcription and Financial Intent Integration, Security Boundaries & Guardrails, Team Coordination Roles, Time Estimate

### Community 93 - "Phase 7 Verification Report: Financial Data Contracts"
Cohesion: 0.33
Nodes (5): Automated Test Log, Execution Context, Phase 7 Verification Report: Financial Data Contracts, Production Build Log, Verification Verdict

### Community 94 - "Phase 8 Verification Report: Secure FLOVA Catch"
Cohesion: 0.33
Nodes (5): Automated Test Log (`receiptExtraction.test.ts`), Execution Context, Phase 8 Verification Report: Secure FLOVA Catch, Security & Bundle Audit, Verification Verdict

### Community 95 - "Phase 10 User Acceptance Testing (UAT)"
Cohesion: 0.33
Nodes (5): Phase 10 User Acceptance Testing (UAT), Scenario 1: Money Overview 10-Pillar Inspection, Scenario 2: Deterministic Insights Evaluation, Scenario 3: Financial Activity Filtering & Badging, Scenario 4: Truthful Uncertainty Handling

### Community 96 - "useAudioRecorder.ts"
Cohesion: 0.40
Nodes (5): AudioRecorderResult, detectSupportedMimeType(), RecorderStatus, SUPPORTED_MIME_CANDIDATES, useAudioRecorder()

### Community 97 - "Phase 6 Verification Report: Realistic Demo Data"
Cohesion: 0.40
Nodes (4): Automated Test Log, Execution Context, Phase 6 Verification Report: Realistic Demo Data, Security & Architecture Audit

### Community 98 - "Phase 6: Support Realistic Demo Data - Context & Invariants"
Cohesion: 0.50
Nodes (3): 1. Safety & Isolation Invariants, 2. Canonical Scenario (Ravi - Delivery Partner), Phase 6: Support Realistic Demo Data - Context & Invariants

### Community 99 - "Phase 9.1 Verification Report"
Cohesion: 0.50
Nodes (3): Phase 9.1 Verification Report, Test Summary, Verification Checklist

### Community 100 - "useSession.ts"
Cohesion: 0.05
Nodes (46): client(), login(), AuthContext, AuthContextValue, AuthProvider(), LoginPage(), handleSubmit(), SignupPage() (+38 more)

### Community 101 - "Architecture & Work Breakdown"
Cohesion: 0.22
Nodes (8): Architecture & Work Breakdown, Invariants & Guardrails, Objective, Phase 17 Plan: AI4Bharat IndicConformer Primary STT Migration, Task 1: Build FastAPI IndicConformer STT Service (`ai-engine/stt_service/`), Task 2: Update Edge Function `process-voice` with Primary/Fallback Routing, Task 3: STT Benchmarking Suite, Task 4: Automated Testing & Invariant Verification

### Community 102 - "Phase 10.2: Application UI shell and screens — Plan 01"
Cohesion: 0.33
Nodes (5): Decisions, Goal, Out of scope, Phase 10.2: Application UI shell and screens — Plan 01, Tasks

### Community 103 - "Phase 10.2 Plan 01: Summary"
Cohesion: 0.40
Nodes (4): Delivered, Known gaps, Phase 10.2 Plan 01: Summary, Verification

### Community 107 - "useVoiceRecorder.ts"
Cohesion: 0.50
Nodes (3): RecorderState, useVoiceRecorder(), VoiceRecorderResult

### Community 108 - "useSpeechToText.ts"
Cohesion: 0.40
Nodes (5): getCtor(), Recognition, SPEECH_LOCALES, SpeechStatus, useSpeechToText()

### Community 109 - "wish.ts"
Cohesion: 0.51
Nodes (8): assertEqual(), assertTrue(), run(), test(), addWishContribution(), createWishGoal(), listWishGoals(), migrateLocalStorageGoals()

### Community 110 - "1. Architecture & Design Decisions"
Cohesion: 0.25
Nodes (7): 1. Architecture & Design Decisions, IndicConformer Checkpoints & Languages, Invariants & Non-Negotiables, Objective, Phase 17 Context: AI4Bharat IndicConformer Primary STT Migration, Primary vs Fallback Provider Workflow, Security & Secret Hygiene

### Community 111 - "1. Locked Architecture Decisions"
Cohesion: 0.20
Nodes (9): 1. Locked Architecture Decisions, 2. Invariants & Guardrails, Phase 15 Context: Conversational & Adaptive Financial Intelligence, Phase Scope & Objectives, Workstream A: Conversational Multi-Transaction Agent, Workstream B: Invoice Intelligence Agent (Upload & Management Only), Workstream C: Financial Intelligence & Adaptive Safety Buffer, Workstream D: WISH 2.0 (Persistent Savings Goals) (+1 more)

### Community 112 - "1. Requirements & Acceptance Criteria Verification"
Cohesion: 0.20
Nodes (9): 1. Requirements & Acceptance Criteria Verification, 2. Test Verification Matrix, Phase 15 Verification: Conversational & Adaptive Financial Intelligence, Phase Overview, Safeguards and Anti-Hallucination Invariants, Workstream A: Conversational Transaction Intelligence, Workstream B: Invoice Intelligence Agent (Upload & Management Only), Workstream C: Financial Intelligence (+1 more)

### Community 113 - "FLOVA — M1 Edge Function Integration Contract (Owner: M3 / AI Engine)"
Cohesion: 0.33
Nodes (5): 3. Dedicated Receipt Extraction Endpoint: `extract-receipt`, 4. Groq API Implementation Details for M1, 5. End-to-End Sequence Flow, Endpoint, FLOVA — M1 Edge Function Integration Contract (Owner: M3 / AI Engine)

### Community 114 - "InsightsScreen.tsx"
Cohesion: 0.16
Nodes (30): ActivityRow(), categoryLabel(), formatINR(), save(), CommitmentsScreen(), InsightsScreen(), InsightsTab(), Runway (+22 more)

### Community 115 - "Phase 5: Payout Synchronization Hardening & Idempotency Verification Report"
Cohesion: 0.40
Nodes (4): Goal Achievement, Observable Truths, Phase 5: Payout Synchronization Hardening & Idempotency Verification Report, Technical Audit & Safety Bounds

### Community 116 - "invoices.ts"
Cohesion: 0.22
Nodes (11): publishableKey, supabase, url, AddInvoiceSettlementInput, createInvoice(), CreateInvoiceInput, getInvoice(), AddWishContributionInput (+3 more)

### Community 119 - "Implementation Tasks"
Cohesion: 0.33
Nodes (6): FinancialQueryType, Implementation Tasks, Task 0: Contracts Extension (`frontend/src/types/contracts.ts`), Task 1: Supabase Edge Function (`backend/supabase/functions/process-voice/index.ts`), Task 2: Frontend Voice Service & Audio Capture Hook, Task 4: Automated Test Suite (`frontend/src/services/__tests__/voiceIntent.test.ts`)

### Community 120 - "Plan 10-01: Financial Activity, Money Overview & Deterministic Insights"
Cohesion: 0.33
Nodes (5): Objective, Owner: M1 (Backend/Contracts) & M2/M3 (Frontend & Insights Engine), Phase: 10, Plan: 01, Plan 10-01: Financial Activity, Money Overview & Deterministic Insights

### Community 121 - "FLOVA — Handoff & Full Context (2026-11-21)"
Cohesion: 0.04
Nodes (42): main(), Branches, Definition of done for any pull request, Every working session, Graphify: required for everyone, One-time setup (each member, each laptop), Who owns what, Working on FLOVA (team rules for the 24-hour build) (+34 more)

### Community 122 - "categories.ts"
Cohesion: 0.27
Nodes (14): CategoryOption, EXPENSE_CATEGORIES, INCOME_CATEGORIES, PROFILE_INCOME_PRIORITY, TxDraft, TxSubmit, ExtractedReceiptCandidate, VoiceTransactionCandidate (+6 more)

### Community 123 - "parseRupees.test.ts"
Cohesion: 0.17
Nodes (11): req650, reqEmpty, reqZero, res10L, res200, res995, resAbc, resDec (+3 more)

### Community 124 - "FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)"
Cohesion: 0.18
Nodes (10): 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (Draft 2020-12 Compatible), 5. Concrete Extraction Examples, 6. M1 Backend & Edge Function Integration, Example 1: Multi-Transaction Sentence (Income + Expense), Example 2: Today's Spending Voice Query, Example 3: Pending Payments Voice Query (+2 more)

### Community 125 - "Implementation Tasks"
Cohesion: 0.25
Nodes (7): Implementation Tasks, Objective, Plan 13-01: Core Financial Correctness, Navigation and Account Management, Task 1: Fix Voice Transaction Amount Duplication, Task 2: Add Income Categories & Profile Adaptation, Task 3: Fix Navigation and Redirects, Verification Plan

### Community 126 - "Implementation Decisions"
Cohesion: 0.25
Nodes (7): 1. Voice Transaction Amount Duplication, 2. Income Categories, 3. Navigation and Redirects, 5. Application Daily Limit (₹10 Lakh), Implementation Decisions, Phase 13 Context: Core Financial Correctness, Navigation and Account Management, Purpose & Scope

### Community 128 - "Phase 17 Verification: AI4Bharat IndicConformer Primary STT Migration"
Cohesion: 0.33
Nodes (5): 1. Migration & Implementation Summary, 2. Invariants & Financial Guardrails, 3. Test Results, Completed Milestones, Phase 17 Verification: AI4Bharat IndicConformer Primary STT Migration

### Community 129 - "useMonthSummary.ts"
Cohesion: 0.48
Nodes (6): DayTotals, monthRange(), MonthSummary, pad(), shiftMonth(), summarise()

### Community 130 - "2. Work Breakdown"
Cohesion: 0.20
Nodes (9): 1. Plan Overview, 2. Work Breakdown, Owner: M1 Backend & Integration, Phase: 14-smart-capture-receipt-intelligence-upi-share-integration, Plan 14-01: Smart Capture, Receipt Intelligence & UPI Share Integration, Wave 1: Schema, Contracts, Edge Function & Service Contracts, Wave 2: PWA Share Target & Service Worker, Wave 3: UI Enhancement in `CatchScreen.tsx` & `AddScreen.tsx` (+1 more)

### Community 131 - "1. Requirements & Acceptance Criteria Verification"
Cohesion: 0.18
Nodes (10): 1. Requirements & Acceptance Criteria Verification, 2. Test Execution Results, 3. Edge Function Deployment, Phase 14 Verification: Smart Capture, Receipt Intelligence & UPI Share Integration, Phase Overview, Task 1: Improved Receipt Scanning and Extraction, Task 2: Support for UPI Payment Screenshots, Task 3: Camera, Gallery & File Uploads (+2 more)

### Community 132 - "FinancialExtractionDTO"
Cohesion: 0.28
Nodes (8): 2. Canonical Edge Function Endpoint Specification: `process-voice`, Endpoint, Mode 1: Audio Input (Microphone Recording), Mode 2: Typed Text / Transcript Input (Direct Extraction), Response Body, FinancialExtractionDTO, Outcome, Phase 9 Plan 01 Summary: Secure Voice Transcription and Financial Intent Integration

### Community 133 - "Phase 1: Core Financial Correctness, Navigation and Account Management Verification Report"
Cohesion: 0.50
Nodes (3): Financial Integrity Audit, Phase 1: Core Financial Correctness, Navigation and Account Management Verification Report, Test Execution Summary

### Community 134 - "Technical Decisions & Architecture"
Cohesion: 0.22
Nodes (8): 1. Edge Function `extract-receipt` Enhancement, 2. Date Fallback Invariant, 3. Payment Status & Duplicate Guardrails, 4. PWA Web Share Target, 5. Camera vs Gallery Separation, Phase 14 Context: Smart Capture, Receipt Intelligence & UPI Share Integration, Phase Overview & Goals, Technical Decisions & Architecture

### Community 135 - "Phase 9: Secure Voice Transcription and Financial Intent Integration — Context & Decisions"
Cohesion: 0.40
Nodes (4): Context, Phase 9: Secure Voice Transcription and Financial Intent Integration — Context & Decisions, Team Coordination Roles, User Flow

### Community 136 - "Phase 7 Plan 01 Summary: Financial Data Contracts & Timeline Helpers"
Cohesion: 0.50
Nodes (3): Key Implementation Details, Outcome, Phase 7 Plan 01 Summary: Financial Data Contracts & Timeline Helpers

### Community 138 - "ISODate"
Cohesion: 0.11
Nodes (19): FinancialInsight, GenerateInsightsOptions, InsightSeverity, DailyProjectionEntry, RunwayProjectionResult, ProcessedRunway, processRunwayFeed(), fridayEntry (+11 more)

### Community 139 - "Phase 9 Verification Report: Secure Voice Transcription & Intent Integration"
Cohesion: 0.40
Nodes (4): Automated Test Log (`voiceIntent.test.ts`), Execution Context, Phase 9 Verification Report: Secure Voice Transcription & Intent Integration, Verification Verdict

### Community 140 - "Phase 9.1 Context: Multilingual Voice Support & Language-Specific Financial Extraction"
Cohesion: 0.50
Nodes (3): Core Requirements & Boundaries, Goal, Phase 9.1 Context: Multilingual Voice Support & Language-Specific Financial Extraction

### Community 143 - "Plan 10-01 Summary: Financial Activity, Money Overview & Deterministic Insights"
Cohesion: 0.50
Nodes (3): Key Metrics, Overview, Plan 10-01 Summary: Financial Activity, Money Overview & Deterministic Insights

### Community 144 - "Phase 10 Verification Report"
Cohesion: 0.50
Nodes (3): Phase 10 Verification Report, Test Summary Across Codebase, Verification Checklist

### Community 146 - "Phase 9 User Acceptance Testing (UAT) Report: Voice Transcription & Intent Integration"
Cohesion: 0.40
Nodes (4): Phase 9 User Acceptance Testing (UAT) Report: Voice Transcription & Intent Integration, Scope of Verification, Test Results Summary, Verdict

## Knowledge Gaps
- **17 isolated node(s):** `udaan-engine`, `@supabase/supabase-js`, `PGPASSWORD`, `PGHOST`, `PGPORT` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 884 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `useMonthSummary.ts`, `frontend/package.json`, `kit.tsx`, `Card`, `App.tsx`, `Icons.tsx`, `PhonePeLandingPage.tsx`, `icons.tsx`, `useWish.ts`, `VoiceScreen.tsx`, `OneRupeeCoin`, `data.ts`, `addTransaction`, `PayoutsScreen.tsx`, `kit.tsx`, `useAudioRecorder.ts`, `useSession.ts`, `useVoiceRecorder.ts`, `useSpeechToText.ts`, `InsightsScreen.tsx`, `PhonePeAppstoreHalo.tsx`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `toPaise()` (e.g. with `Architectural Rules` and `Rules everyone follows`) actually correct?**
  _`toPaise()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `udaan-engine`, `@supabase/supabase-js`, `PGPASSWORD` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.056692242114237 - nodes in this community are weakly interconnected._
- **Why does `main()` connect `FLOVA — Handoff & Full Context (2026-11-21)` to `loadRunwayInput`, `test_engine.py`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `todayLocalISO()` (e.g. with `Key Accomplishments` and `Decisions`) actually correct?**
  _`todayLocalISO()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `VERDICT — pick-f1-irregular-income` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._