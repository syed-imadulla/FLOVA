# Graph Report - FLOVA  (2026-11-21)

## Corpus Check
- 265 files · ~181,599 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .css 5, .example 3, (none) 2)

## Summary
- 1523 nodes · 3271 edges · 107 communities (78 shown, 29 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 280 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cdf786ee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- test_engine.py
- contracts.ts
- VERDICT — pick-f1-irregular-income
- api.ts
- frontend/package.json
- Architecture
- FLOVA data contract (v1 · owner: M1)
- backend/package.json
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
- useSession
- FLOVA Financial Engine (M3)
- testUtils.ts
- Project State
- Tests
- RunwayInput
- App.tsx
- Technology Stack
- Testing Patterns
- Decisions
- External Integrations
- Tests
- 01-01-PLAN.md
- Plan 02-01: Profile and Onboarding Persistence
- mockSupabase.ts
- Phase 4: Runway Feed Verification Report
- data.ts
- Plan 03-01: Data Capture Hooks and Pages
- Icons.tsx
- FLOVA (Udaan 2.0)
- Goal Achievement
- v1 Requirements
- toPaise
- FLOVA (Udaan 2.0)
- v1 Requirements
- RequireAuth
- PhonePeLandingPage.tsx
- 1. Locked Decisions & Core Architecture
- FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)
- FinancialExtractionDTO
- engine/index.ts
- parseRequiredRupees
- FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)
- ActivityItem
- react
- integrationVoiceCatchWish.test.ts
- WishPage.tsx
- External Integrations
- useTransactions.ts
- extractTransaction.ts
- Naming Patterns
- OneRupeeCoin
- addTransaction
- Locked Architectural Decisions (From Discussion)
- useAudioRecorder.ts
- voice.ts
- 2. Band-by-Band Cadence in Video 2
- rls-live-check.mjs
- PhonePeHeroSlider.tsx
- useVoiceRecorder.ts
- Phase 10 Verification Report
- parseRupees.test.ts
- MockQueryBuilder
- FLOVA Hero Section Blueprint: Video 1 Deep Analysis
- candidateAdapter.ts
- validation.ts
- Phase 9.1 User Acceptance Testing (UAT)
- PhonePeAppstoreHalo.tsx
- Phase 7 Verification Report: Financial Data Contracts
- Phase 8 Verification Report: Secure FLOVA Catch
- Phase 10 User Acceptance Testing (UAT)
- 1. Core Invariants
- Phase 6 Verification Report: Realistic Demo Data
- Phase 6: Support Realistic Demo Data - Context & Invariants
- Phase 9.1 Verification Report
- Goal Achievement
- Tasks
- ProfileProvider
- sw.js
- Phase 5: Payout Synchronization Hardening & Idempotency Verification Report

## God Nodes (most connected - your core abstractions)
1. `react` - 77 edges
2. `toPaise()` - 52 edges
3. `useSession()` - 34 edges
4. `FinancialExtractionDTO` - 32 edges
5. `react-router-dom` - 31 edges
6. `todayLocalISO()` - 31 edges
7. `formatINR()` - 31 edges
8. `parseRequiredRupees()` - 26 edges
9. `RunwayInput` - 25 edges
10. `App()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Branches` --references--> `main()`  [INFERRED]
  CONTRIBUTING.md → ai-engine/udaan_engine/__main__.py
- `6. M1 Backend & Edge Function Integration` --references--> `validateExtractionOutput()`  [INFERRED]
  ai-engine/EXTRACTION_CONTRACT.md → frontend/src/engine/extractionPrompt.ts
- `Endpoint` --references--> `FinancialExtractionDTO`  [INFERRED]
  ai-engine/M1_GROQ_INTEGRATION.md → frontend/src/engine/extractionTypes.ts
- `Outcome` --references--> `FinancialExtractionDTO`  [INFERRED]
  .planning/phases/09-voice-transcription/09-01-SUMMARY.md → frontend/src/engine/extractionTypes.ts
- `3. Canonical Data Contracts: FinancialExtractionDTO & VoiceTransactionCandidate` --references--> `FinancialExtractionDTO`  [INFERRED]
  .planning/phases/09-voice-transcription/09-CONTEXT.md → frontend/src/engine/extractionTypes.ts

## Import Cycles
- None detected.

## Communities (107 total, 29 thin omitted)

### Community 0 - "test_engine.py"
Cohesion: 0.06
Nodes (44): test_backtest_shape(), test_buffer_never_negative_and_money_is_conserved(), test_estimate_ignores_one_big_week(), test_estimate_with_little_history_is_cautious(), test_generate_year_is_reproducible(), test_lean_week_is_covered_by_buffer(), test_low_income_is_not_called_a_timing_problem(), test_negative_income_week_handled() (+36 more)

### Community 1 - "contracts.ts"
Cohesion: 0.09
Nodes (27): ProfileContext, ProfileContextType, assertStrictEqual(), assertTrue(), it(), runTests(), APP_LANGUAGES, AppLanguage (+19 more)

### Community 2 - "VERDICT — pick-f1-irregular-income"
Cohesion: 0.05
Nodes (40): An alternative approach (same problem, same user), Contradictions between jurors, If I were your team…, Next experiment (30 min), Ranked improvements, Ratings /10, VERDICT — pick-f1-irregular-income, Votes (+32 more)

### Community 3 - "api.ts"
Cohesion: 0.08
Nodes (38): api, BacktestRow, FALLBACK_PROFILES, OutlookWeek, Plan, Profile, Rider, rs() (+30 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.06
Nodes (33): dependencies, react, react-dom, react-router-dom, @supabase/supabase-js, devDependencies, autoprefixer, postcss (+25 more)

### Community 5 - "Architecture"
Cohesion: 0.20
Nodes (9): Architectural Constraints, Architecture, Component Responsibilities, Data Flow, Entry Points, Error Handling, Key Abstractions, Pattern Overview (+1 more)

### Community 6 - "FLOVA data contract (v1 · owner: M1)"
Cohesion: 0.08
Nodes (23): Branches, Definition of done for any pull request, Every working session, Graphify: required for everyone, One-time setup (each member, each laptop), Who owns what, Working on FLOVA (team rules for the 24-hour build), `balance_checkins` (actual cash + bank at a moment) (+15 more)

### Community 7 - "backend/package.json"
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

### Community 34 - "useSession"
Cohesion: 0.16
Nodes (22): AuthProvider(), useSession(), AppShell(), handleSignOut(), AppShellProps, handleLogout(), HomeRunwayView(), ProfileSettingsView() (+14 more)

### Community 35 - "FLOVA Financial Engine (M3)"
Cohesion: 0.20
Nodes (9): Architectural Principles, Calculation Semantics (Option A), FLOVA Financial Engine (M3), Historical Ravi Fixture Preservation, Key Rules:, Option A: Remaining Daily Budget Logic, Problem Addressed, Results: (+1 more)

### Community 36 - "testUtils.ts"
Cohesion: 0.18
Nodes (17): d1, d2, iso1, iso2, adaptExtractedTransactions(), sanitizeExtractedTransaction(), baseProfile, baseProfile (+9 more)

### Community 37 - "Project State"
Cohesion: 0.40
Nodes (4): Current Position, Performance Metrics, Project Reference, Project State

### Community 38 - "Tests"
Cohesion: 0.13
Nodes (14): 1. Logged out redirect to /login (B1), 2. Sign up with new email and display name (B2), 3. Session persistence on refresh (B3), 4. Logout and route protection (B4), 5. Login error handling (B5), 6. Redirect authenticated user away from /login (B6), 7. Client-side password length validation (B7), A. Live RLS Test (+6 more)

### Community 39 - "RunwayInput"
Cohesion: 0.10
Nodes (28): calculateConfirmedBalance(), FinancialInsight, GenerateInsightsOptions, InsightSeverity, addDays(), calculateDailyRunway(), DailyProjectionEntry, RunwayProjectionInput (+20 more)

### Community 40 - "App.tsx"
Cohesion: 0.11
Nodes (24): App(), AuthContext, AuthContextValue, RedirectIfAuthed(), DataVersionProvider(), LoginPage(), handleSubmit(), SignupPage() (+16 more)

### Community 41 - "Technology Stack"
Cohesion: 0.25
Nodes (7): Configuration, Frameworks, Key Dependencies, Languages, Platform Requirements, Runtime, Technology Stack

### Community 42 - "Testing Patterns"
Cohesion: 0.29
Nodes (6): Mocking & Isolation, Required Pre-Shipping Checks, Test File Organization, Test Framework, Test Structure, Testing Patterns

### Community 44 - "External Integrations"
Cohesion: 0.29
Nodes (3): __dirname, __filename, mockSupabasePath

### Community 45 - "Tests"
Cohesion: 0.12
Nodes (15): 1. Currency parser unit tests, 1. New user signup routing, 2. Blank ₹ fields submission, 2. M3 Engine tests regression suite, 3. Database test suite, 3. Session refresh persistence, 4. Edit profile updates immediately, 5. Client-side validation (+7 more)

### Community 48 - "mockSupabase.ts"
Cohesion: 0.22
Nodes (13): assertStrictEqual(), assertTrue(), it(), runTests(), assertStrictEqual(), assertTrue(), it(), runTests() (+5 more)

### Community 49 - "Phase 4: Runway Feed Verification Report"
Cohesion: 0.33
Nodes (5): Goal Achievement, Investigation Findings: Previous Aggregate Test Command Failures, M1 Data Layer & M3 Engine Integration Audit, Observable Truths, Phase 4: Runway Feed Verification Report

### Community 50 - "data.ts"
Cohesion: 0.14
Nodes (25): Service functions (`frontend/src/services/`), publishableKey, supabase, unwrap(), url, addCommitment(), getLatestCheckin(), getMyProfile() (+17 more)

### Community 52 - "Icons.tsx"
Cohesion: 0.10
Nodes (44): AbyssAuditSection(), AbyssCapabilitiesSection(), AbyssFinalCTA(), FinalCTAProps, AbyssFooter(), FooterProps, AbyssHero(), HeroProps (+36 more)

### Community 54 - "FLOVA (Udaan 2.0)"
Cohesion: 0.25
Nodes (7): 1. Database Regression Suite (PGlite), 2. Multi-Connection PostgreSQL Concurrency & Deadlock Suite, 3. Frontend Compilation & Idempotent Retry UX Suite, Current Test, Gaps, Summary, Tests

### Community 55 - "Goal Achievement"
Cohesion: 0.50
Nodes (3): Goal Achievement, Observable Truths, Phase 3: Data Capture Hooks Verification Report

### Community 56 - "v1 Requirements"
Cohesion: 0.29
Nodes (6): PGDATABASE, PGHOST, PGPASSWORD, PGPORT, PGUSER, test-concurrency-postgres.sh script

### Community 57 - "toPaise"
Cohesion: 0.17
Nodes (23): todayLocalISO(), generateFinancialInsights(), formatINR(), toPaise(), toPaiseOrNull(), ActivityPage(), loadData(), HomePlaceholder() (+15 more)

### Community 58 - "FLOVA (Udaan 2.0)"
Cohesion: 0.20
Nodes (9): Business & Problem Context, Core Value, FLOVA (Udaan 2.0), Key Decisions Log, Out of Scope, Requirements, Team Ownership & Boundaries, Technical Environment & Architecture (+1 more)

### Community 59 - "v1 Requirements"
Cohesion: 0.22
Nodes (8): Out of Scope, Phase 4: Runway Feed & Engine Integration, Phase 5: Secure AI Function (Stretch), Phase 6: Demo Data Seed & Test Fixtures, Phase 7: Deployment & Production Smoke Test, Requirements: FLOVA (M1 Backend & Database), Traceability Matrix, v1 Requirements

### Community 60 - "RequireAuth"
Cohesion: 0.06
Nodes (36): RequireAuth(), RequireOnboarded(), ActivityItemKind, Edge Function Contract (`extract-receipt`), Implementation Tasks, Objectives, Plan 08-01: Secure FLOVA Catch (Receipt Extraction), Security Boundaries & Rules (+28 more)

### Community 61 - "PhonePeLandingPage.tsx"
Cohesion: 0.13
Nodes (16): PhonePeConcentricSection(), PhonePeConvenienceBills(), PhonePeDotWaveDevices(), PhonePeHeroPillars(), PhonePeHeroPillarsProps, PhonePeLandingPage(), PhonePeLandingPageProps, Tab (+8 more)

### Community 62 - "1. Locked Decisions & Core Architecture"
Cohesion: 0.22
Nodes (8): 1. Locked Decisions & Core Architecture, 2. Boundaries & Out-of-Scope, Decision 1: Database Trigger Derived Totals & Row-Level Locking, Decision 2: Status State Machine Transitions, Decision 3: Deadlock-Free Payout Reassignment, Decision 4: Client-Side Submission Idempotency, Decision 5: Security & RLS Invariants, Phase 5: Payout Synchronization Hardening - Context & Decisions

### Community 63 - "FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)"
Cohesion: 0.18
Nodes (10): 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (Draft 2020-12 Compatible), 5. Concrete Extraction Examples, 6. M1 Backend & Edge Function Integration, Example 1: Multi-Transaction Sentence (Income + Expense), Example 2: Today's Spending Voice Query, Example 3: Pending Payments Voice Query (+2 more)

### Community 64 - "FinancialExtractionDTO"
Cohesion: 0.07
Nodes (28): 2. Canonical Edge Function Endpoint Specification: `process-voice`, Endpoint, Mode 1: Audio Input (Microphone Recording), Mode 2: Typed Text / Transcript Input (Direct Extraction), Response Body, FinancialExtractionDTO, Core Requirements & Boundaries, Goal (+20 more)

### Community 65 - "engine/index.ts"
Cohesion: 0.10
Nodes (30): 1. Overview & Architectural Boundaries, Architectural Rules, ConfirmedBalanceBreakdown, ConfirmedBalanceResult, ConfirmedBalanceStatus, 1. Overview & Architectural Boundaries, Architectural Rules, adaptExtractedCheckin() (+22 more)

### Community 66 - "parseRequiredRupees"
Cohesion: 0.10
Nodes (26): Frontend data hooks (`frontend/src/data/`), useLatestCheckin(), usePayouts(), AddTransactionPage(), handleSubmit(), CheckinPage(), handleSubmit(), HistoryPage() (+18 more)

### Community 67 - "FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)"
Cohesion: 0.18
Nodes (10): 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (Draft 2020-12 Compatible), 5. Concrete Extraction Examples, 6. M1 Backend & Edge Function Integration, Example 1: Multi-Transaction Sentence (Income + Expense), Example 2: Today's Spending Voice Query, Example 3: Pending Payments Voice Query (+2 more)

### Community 68 - "ActivityItem"
Cohesion: 0.05
Nodes (36): ActivityItem, Objectives, Plan 07-01: Financial Data Contracts & Timeline Helpers, Tasks, Key Implementation Details, Outcome, Phase 7 Plan 01 Summary: Financial Data Contracts & Timeline Helpers, 1. Security Boundary & API Key Protection (+28 more)

### Community 69 - "react"
Cohesion: 0.22
Nodes (11): FlovaBottomCTA(), FlovaClarityShowcase(), FlovaFooter(), FlovaHero(), FlovaHowItWorks(), FlovaIndiaContext(), FlovaLandingPage(), FlovaNavbar() (+3 more)

### Community 70 - "integrationVoiceCatchWish.test.ts"
Cohesion: 0.19
Nodes (16): listTransactions(), extractReceipt(), ExtractReceiptInput, ExtractReceiptResult, fileToBase64(), assertStrictEqual(), assertTrue(), it() (+8 more)

### Community 71 - "WishPage.tsx"
Cohesion: 0.09
Nodes (32): calculateWish(), ContributionCadence, CreateWishInput, formatDateISO(), formatMonthYear(), Wish, WishCalculation, WishStatus (+24 more)

### Community 72 - "External Integrations"
Cohesion: 0.25
Nodes (7): Authentication & Identity, CI/CD & Deployment, Data Storage, Environment Configuration, External Integrations, Monitoring & Observability, Webhooks & Callbacks

### Community 73 - "useTransactions.ts"
Cohesion: 0.26
Nodes (9): DataVersionContext, DataVersionContextType, useDataVersion(), useCommitments(), useTransactions(), InsightsView(), deleteTransaction(), Deferred Ideas (+1 more)

### Community 74 - "extractTransaction.ts"
Cohesion: 0.09
Nodes (24): corsHeaders, ExtractReceiptRequest, corsHeaders, ProcessVoiceRequest, VoiceProcessInput, CATEGORY_MAP, EXPENSE_KEYWORDS, extractAmount() (+16 more)

### Community 75 - "Naming Patterns"
Cohesion: 0.12
Nodes (17): WorkProfileOption, addCheckin(), BalanceCheckin, RupeeString, WorkProfile, Code Style, Coding Conventions, Database Interaction Conventions (+9 more)

### Community 76 - "OneRupeeCoin"
Cohesion: 0.26
Nodes (8): HeroSection(), HeroSectionProps, LandingSections(), LandingSectionsProps, OneRupeeCoin(), OneRupeeCoinProps, MorphBridgeProps, OneRupeeMorphBridge()

### Community 77 - "addTransaction"
Cohesion: 0.12
Nodes (21): addTransaction(), receivePayout(), assertStrictEqual(), assertTrue(), it(), runTests(), NewTransaction, Task 1: Client-Side Idempotency (+13 more)

### Community 78 - "Locked Architectural Decisions (From Discussion)"
Cohesion: 0.29
Nodes (6): 1. Routing & Screen Anchoring, 2. Timeline Item Distinction & Expected Payouts, 3. Four Deterministic Financial Insights, 4. Financial Safety & Truthful Uncertainty, Locked Architectural Decisions (From Discussion), Phase 10 Context: Financial Activity, Money Overview & Insights

### Community 79 - "useAudioRecorder.ts"
Cohesion: 0.40
Nodes (5): AudioRecorderResult, detectSupportedMimeType(), RecorderStatus, SUPPORTED_MIME_CANDIDATES, useAudioRecorder()

### Community 80 - "voice.ts"
Cohesion: 0.12
Nodes (27): paiseToRupeeString(), FlovaCatchPage(), handleConfirm(), handleExtract(), btn(), VoiceCapturePage(), handleConfirmCheckin(), handleConfirmPayout() (+19 more)

### Community 81 - "2. Band-by-Band Cadence in Video 2"
Cohesion: 0.13
Nodes (14): 1. Hero-to-Followup 1-Rupee Indian Coin Morph Transition, 2. Band-by-Band Cadence in Video 2, 3. Currency & Data Rules Mapping (FLOVA Contract Compliance), 4. Master Build Roadmap (Step 3 Preview), Band 1: Dark Feature Showcase Card (`#111214` / `#141517`), Band 2: 4-Column Feature & Value Strip (Light Paper Surface), Band 3: Fine-Grid Testimonial & Real Worker Stories Band, Band 4: Vibrant Cyan/Aqua Callout Banner (`#25DCF5` / `#00D2F0`) (+6 more)

### Community 83 - "PhonePeHeroSlider.tsx"
Cohesion: 0.50
Nodes (3): PhonePeHeroSlider(), PhonePeHeroSliderProps, SlideData

### Community 84 - "useVoiceRecorder.ts"
Cohesion: 0.50
Nodes (3): RecorderState, useVoiceRecorder(), VoiceRecorderResult

### Community 85 - "Phase 10 Verification Report"
Cohesion: 0.50
Nodes (3): Phase 10 Verification Report, Test Summary Across Codebase, Verification Checklist

### Community 86 - "parseRupees.test.ts"
Cohesion: 0.18
Nodes (10): req650, reqEmpty, reqZero, res200, res995, resAbc, resDec, resEmpty (+2 more)

### Community 87 - "MockQueryBuilder"
Cohesion: 0.18
Nodes (3): MockQueryBuilder, Phase 7 UAT: Financial Data Contracts & Timeline Helpers, User Acceptance Criteria & Results

### Community 88 - "FLOVA Hero Section Blueprint: Video 1 Deep Analysis"
Cohesion: 0.20
Nodes (9): 1. Canvas, Background Surface & Spatial Framing, 2. Top Navigation Bar (Fixed / Sticky Editorial Header), 3. Centered Typography Lockup & Easing Choreography, 4. Central Focal Visual (Centerpiece), 5. Hand-Drawn Sketch Annotations, Medallion & Secondary Visuals, 6. Reveal on Scroll (Sub-Hero Section at `t = 12s–17.8s`), 7. Motion Choreography & Parallax Execution Plan, 8. Readiness Checklist for Video 2 & Master Build (+1 more)

### Community 89 - "candidateAdapter.ts"
Cohesion: 0.12
Nodes (36): 1. Overview & Ownership Boundaries, 3. Dedicated Receipt Extraction Endpoint: `extract-receipt`, 4. Groq API Implementation Details for M1, 5. End-to-End Sequence Flow, Endpoint, FLOVA — M1 Edge Function Integration Contract (Owner: M3 / AI Engine), candidateToNewTransaction(), confirmCandidateTransaction() (+28 more)

### Community 90 - "validation.ts"
Cohesion: 0.38
Nodes (11): validateExtractionOutput(), isValidISODate(), isValidISOTimestamp(), isValidPaise(), validateBalanceCheckin(), validatePayout(), validateRunwayInput(), validateTransaction() (+3 more)

### Community 91 - "Phase 9.1 User Acceptance Testing (UAT)"
Cohesion: 0.25
Nodes (7): Phase 9.1 User Acceptance Testing (UAT), Scenario 1: Language Pinned Transcription (Kannada), Scenario 2: Hindi Living Expense Extraction, Scenario 3: Truthful Uncertainty / Missing Amount (Kannada), Scenario 4: Platform Expected Payout Isolation (Telugu), Scenario 5: Balance Check-in Segregation (Urdu), Scenario 6: Multilingual Deterministic Financial Queries

### Community 93 - "Phase 7 Verification Report: Financial Data Contracts"
Cohesion: 0.33
Nodes (5): Automated Test Log, Execution Context, Phase 7 Verification Report: Financial Data Contracts, Production Build Log, Verification Verdict

### Community 94 - "Phase 8 Verification Report: Secure FLOVA Catch"
Cohesion: 0.33
Nodes (5): Automated Test Log (`receiptExtraction.test.ts`), Execution Context, Phase 8 Verification Report: Secure FLOVA Catch, Security & Bundle Audit, Verification Verdict

### Community 95 - "Phase 10 User Acceptance Testing (UAT)"
Cohesion: 0.33
Nodes (5): Phase 10 User Acceptance Testing (UAT), Scenario 1: Money Overview 10-Pillar Inspection, Scenario 2: Deterministic Insights Evaluation, Scenario 3: Financial Activity Filtering & Badging, Scenario 4: Truthful Uncertainty Handling

### Community 97 - "Phase 6 Verification Report: Realistic Demo Data"
Cohesion: 0.40
Nodes (4): Automated Test Log, Execution Context, Phase 6 Verification Report: Realistic Demo Data, Security & Architecture Audit

### Community 98 - "Phase 6: Support Realistic Demo Data - Context & Invariants"
Cohesion: 0.50
Nodes (3): 1. Safety & Isolation Invariants, 2. Canonical Scenario (Ravi - Delivery Partner), Phase 6: Support Realistic Demo Data - Context & Invariants

### Community 99 - "Phase 9.1 Verification Report"
Cohesion: 0.50
Nodes (3): Phase 9.1 Verification Report, Test Summary, Verification Checklist

### Community 102 - "Tasks"
Cohesion: 0.29
Nodes (6): Objectives, Plan 05-01: Payout Synchronization Hardening & Idempotency, Task 0: Database Migration (`20261121000100_harden_payout_sync.sql`), Task 2: PGlite Comprehensive Regression Suite, Task 3: Real Multi-Connection PostgreSQL Concurrency Test, Tasks

### Community 103 - "ProfileProvider"
Cohesion: 0.25
Nodes (6): ProfileProvider(), Key Accomplishments, Phase 2: Profile & Onboarding Data Summary, Goal Achievement, Observable Truths, Phase 2: Profile & Onboarding Data Verification Report

### Community 108 - "Phase 5: Payout Synchronization Hardening & Idempotency Verification Report"
Cohesion: 0.40
Nodes (4): Goal Achievement, Observable Truths, Phase 5: Payout Synchronization Hardening & Idempotency Verification Report, Technical Audit & Safety Bounds

## Knowledge Gaps
- **16 isolated node(s):** `udaan-engine`, `@supabase/supabase-js`, `PGPASSWORD`, `PGHOST`, `PGPORT` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 687 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `contracts.ts`, `useSession`, `api.ts`, `frontend/package.json`, `parseRequiredRupees`, `WishPage.tsx`, `App.tsx`, `useTransactions.ts`, `Naming Patterns`, `OneRupeeCoin`, `useAudioRecorder.ts`, `data.ts`, `PhonePeHeroSlider.tsx`, `Icons.tsx`, `useVoiceRecorder.ts`, `toPaise`, `PhonePeAppstoreHalo.tsx`, `PhonePeLandingPage.tsx`?**
  _High betweenness centrality (0.178) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `toPaise()` (e.g. with `Architectural Rules` and `Rules everyone follows`) actually correct?**
  _`toPaise()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `udaan-engine`, `@supabase/supabase-js`, `PGPASSWORD` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `test_engine.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05506329113924051 - nodes in this community are weakly interconnected._
- **Why does `main()` connect `test_engine.py` to `useSession`, `FLOVA data contract (v1 · owner: M1)`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `useSession()` (e.g. with `Layers` and `Primary Runway Feed Path`) actually correct?**
  _`useSession()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Should `contracts.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09425287356321839 - nodes in this community are weakly interconnected._