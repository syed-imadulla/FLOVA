# Graph Report - FLOVA  (2026-11-21)

## Corpus Check
- 278 files · ~176,977 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .css 5, .example 3, (none) 2)

## Summary
- 1650 nodes · 3955 edges · 117 communities (90 shown, 27 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 278 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `187ea668`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- test_engine.py
- adapter.ts
- VERDICT — pick-f1-irregular-income
- contracts.ts
- frontend/package.json
- paiseToRupeeString
- FLOVA (Udaan 2.0)
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
- react
- FLOVA Financial Engine (M3)
- validation.ts
- Project State
- Tests
- kit.tsx
- voice.ts
- Technology Stack
- Testing Patterns
- VoiceScreen.tsx
- External Integrations
- Tests
- 01-01-PLAN.md
- Plan 02-01: Profile and Onboarding Persistence
- Coding Conventions
- Phase 4: Runway Feed Verification Report
- CommitmentsScreen.tsx
- Plan 03-01: Data Capture Hooks and Pages
- Icons.tsx
- FLOVA (Udaan 2.0)
- Goal Achievement
- v1 Requirements
- Phase 10 Verification Report
- icons.tsx
- Requirements: FLOVA (M1 Backend & Database)
- Plan 08-01: Secure FLOVA Catch (Receipt Extraction)
- PhonePeLandingPage.tsx
- PayoutsScreen.tsx
- AuthProvider
- mockSupabase.ts
- engine/index.ts
- FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)
- OnboardingScreen.tsx
- Key Architectural & Design Decisions
- useSession
- CheckinScreen.tsx
- useWish.ts
- FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)
- Key Architectural & Design Decisions
- extractTransaction.ts
- OneRupeeCoin
- useMonthSummary.ts
- addTransaction
- Locked Architectural Decisions (From Discussion)
- App.tsx
- 1. Locked Decisions & Core Architecture
- 2. Band-by-Band Cadence in Video 2
- ProfileProvider.tsx
- Tasks
- Tasks
- dates.test.ts
- parseRupees.test.ts
- MockQueryBuilder
- FLOVA Hero Section Blueprint: Video 1 Deep Analysis
- candidateAdapter.ts
- Roadmap: FLOVA (12-Phase Hackathon Roadmap)
- Phase 9.1 User Acceptance Testing (UAT)
- FinancialExtractionDTO
- Phase 7 Verification Report: Financial Data Contracts
- Phase 8 Verification Report: Secure FLOVA Catch
- Phase 10 User Acceptance Testing (UAT)
- useAudioRecorder.ts
- Phase 6 Verification Report: Realistic Demo Data
- Phase 6: Support Realistic Demo Data - Context & Invariants
- Phase 9.1 Verification Report
- loadRunwayInput
- Codebase Structure
- Phase 10.2: Application UI shell and screens — Plan 01
- Phase 10.2 Plan 01: Summary
- sw.js
- useVoiceRecorder.ts
- useSpeechToText.ts
- listActivityTimeline
- Key Accomplishments
- Plan 10-01: Financial Activity, Money Overview & Deterministic Insights
- Phase 7 Plan 01 Summary: Financial Data Contracts & Timeline Helpers
- Phase 5: Payout Synchronization Hardening & Idempotency Verification Report
- Plan 10-01 Summary: Financial Activity, Money Overview & Deterministic Insights
- Phase 8 Plan 01 Summary: Secure FLOVA Catch (Receipt Extraction)
- PhonePeAppstoreHalo.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 84 edges
2. `Notice()` - 40 edges
3. `toPaise()` - 39 edges
4. `useSession()` - 36 edges
5. `todayLocalISO()` - 35 edges
6. `Card()` - 34 edges
7. `formatINR()` - 32 edges
8. `FinancialExtractionDTO` - 31 edges
9. `Button()` - 31 edges
10. `react-router-dom` - 29 edges

## Surprising Connections (you probably didn't know these)
- `Tasks` --references--> `AppLayout()`  [INFERRED]
  .planning/phases/10.2-app-ui-shell/10.2-01-PLAN.md → frontend/src/app/AppLayout.tsx
- `6. M1 Backend & Edge Function Integration` --references--> `validateExtractionOutput()`  [INFERRED]
  ai-engine/EXTRACTION_CONTRACT.md → frontend/src/engine/extractionPrompt.ts
- `3. Canonical Data Contracts: FinancialExtractionDTO & VoiceTransactionCandidate` --references--> `FinancialExtractionDTO`  [INFERRED]
  .planning/phases/09-voice-transcription/09-CONTEXT.md → frontend/src/engine/extractionTypes.ts
- `Team Coordination Roles` --references--> `FinancialExtractionDTO`  [INFERRED]
  .planning/phases/09-voice-transcription/09-CONTEXT.md → frontend/src/engine/extractionTypes.ts
- `Scope of Verification` --references--> `FinancialExtractionDTO`  [INFERRED]
  .planning/phases/09-voice-transcription/09-UAT.md → frontend/src/engine/extractionTypes.ts

## Import Cycles
- None detected.

## Communities (117 total, 27 thin omitted)

### Community 0 - "test_engine.py"
Cohesion: 0.07
Nodes (35): test_backtest_shape(), test_buffer_never_negative_and_money_is_conserved(), test_estimate_ignores_one_big_week(), test_estimate_with_little_history_is_cautious(), test_generate_year_is_reproducible(), test_lean_week_is_covered_by_buffer(), test_low_income_is_not_called_a_timing_problem(), test_negative_income_week_handled() (+27 more)

### Community 1 - "adapter.ts"
Cohesion: 0.14
Nodes (16): FinancialInsight, GenerateInsightsOptions, InsightSeverity, DailyProjectionEntry, RunwayProjectionResult, ProcessedRunway, processRunwayFeed(), fridayEntry (+8 more)

### Community 2 - "VERDICT — pick-f1-irregular-income"
Cohesion: 0.05
Nodes (40): An alternative approach (same problem, same user), Contradictions between jurors, If I were your team…, Next experiment (30 min), Ranked improvements, Ratings /10, VERDICT — pick-f1-irregular-income, Votes (+32 more)

### Community 3 - "contracts.ts"
Cohesion: 0.11
Nodes (23): assertStrictEqual(), assertTrue(), it(), runTests(), APP_LANGUAGES, AppLanguage, COMMITMENT_KINDS, COMMITMENT_STATUSES (+15 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.06
Nodes (33): dependencies, react, react-dom, react-router-dom, @supabase/supabase-js, devDependencies, autoprefixer, postcss (+25 more)

### Community 5 - "paiseToRupeeString"
Cohesion: 0.09
Nodes (16): Architectural Constraints, Architecture, Component Responsibilities, Data Flow, Entry Points, Error Handling, Key Abstractions, Layers (+8 more)

### Community 6 - "FLOVA (Udaan 2.0)"
Cohesion: 0.05
Nodes (39): main(), Branches, Definition of done for any pull request, Every working session, Graphify: required for everyone, One-time setup (each member, each laptop), Who owns what, Working on FLOVA (team rules for the 24-hour build) (+31 more)

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

### Community 34 - "react"
Cohesion: 0.21
Nodes (12): FlovaBottomCTA(), FlovaClarityShowcase(), FlovaFooter(), FlovaHero(), FlovaHowItWorks(), FlovaIndiaContext(), FlovaLandingPage(), FlovaNavbar() (+4 more)

### Community 35 - "FLOVA Financial Engine (M3)"
Cohesion: 0.20
Nodes (9): Architectural Principles, Calculation Semantics (Option A), FLOVA Financial Engine (M3), Historical Ravi Fixture Preservation, Key Rules:, Option A: Remaining Daily Budget Logic, Problem Addressed, Results: (+1 more)

### Community 36 - "validation.ts"
Cohesion: 0.17
Nodes (29): calculateConfirmedBalance(), addDays(), calculateDailyRunway(), RunwayProjectionInput, baseProfile, baseProfile, assertMatch(), assertStrictEqual() (+21 more)

### Community 37 - "Project State"
Cohesion: 0.29
Nodes (6): Current Position, Integration Milestone (2026-11-21), Performance Metrics, Phase 10.2: Application UI Shell & Live AI (2026-11-21), Project Reference, Project State

### Community 38 - "Tests"
Cohesion: 0.13
Nodes (14): 1. Logged out redirect to /login (B1), 2. Sign up with new email and display name (B2), 3. Session persistence on refresh (B3), 4. Logout and route protection (B4), 5. Login error handling (B5), 6. Redirect authenticated user away from /login (B6), 7. Client-side password length validation (B7), A. Live RLS Test (+6 more)

### Community 39 - "kit.tsx"
Cohesion: 0.16
Nodes (35): useActivity(), HomeScreen(), QuickAction(), RunwayStatus(), StatusLink(), InsightsScreen(), InsightsTab(), Runway (+27 more)

### Community 40 - "voice.ts"
Cohesion: 0.10
Nodes (34): ExtractedQueryData, publishableKey, supabase, url, listTransactions(), extractReceipt(), ExtractReceiptInput, ExtractReceiptResult (+26 more)

### Community 41 - "Technology Stack"
Cohesion: 0.25
Nodes (7): Configuration, Frameworks, Key Dependencies, Languages, Platform Requirements, Runtime, Technology Stack

### Community 42 - "Testing Patterns"
Cohesion: 0.29
Nodes (6): Mocking & Isolation, Required Pre-Shipping Checks, Test File Organization, Test Framework, Test Structure, Testing Patterns

### Community 43 - "VoiceScreen.tsx"
Cohesion: 0.18
Nodes (18): paiseToInput(), rupeeStringToInput(), todayLocalISO(), useRunway(), ReviewState, CatchScreen(), extract(), EXAMPLES (+10 more)

### Community 44 - "External Integrations"
Cohesion: 0.29
Nodes (3): __dirname, __filename, mockSupabasePath

### Community 45 - "Tests"
Cohesion: 0.12
Nodes (15): 1. Currency parser unit tests, 1. New user signup routing, 2. Blank ₹ fields submission, 2. M3 Engine tests regression suite, 3. Database test suite, 3. Session refresh persistence, 4. Edit profile updates immediately, 5. Client-side validation (+7 more)

### Community 48 - "Coding Conventions"
Cohesion: 0.29
Nodes (6): Code Style, Coding Conventions, Database Interaction Conventions, Error Handling, Financial & Money Conventions, Import Organization

### Community 49 - "Phase 4: Runway Feed Verification Report"
Cohesion: 0.33
Nodes (5): Goal Achievement, Investigation Findings: Previous Aggregate Test Command Failures, M1 Data Layer & M3 Engine Integration Audit, Observable Truths, Phase 4: Runway Feed Verification Report

### Community 50 - "CommitmentsScreen.tsx"
Cohesion: 0.18
Nodes (19): ActivityRow(), categoryLabel(), CategoryOption, EXPENSE_CATEGORIES, INCOME_CATEGORIES, emptyDraft(), formatINR(), AddScreen() (+11 more)

### Community 52 - "Icons.tsx"
Cohesion: 0.05
Nodes (76): api, BacktestRow, FALLBACK_PROFILES, OutlookWeek, Plan, Profile, Rider, rs() (+68 more)

### Community 54 - "FLOVA (Udaan 2.0)"
Cohesion: 0.25
Nodes (7): 1. Database Regression Suite (PGlite), 2. Multi-Connection PostgreSQL Concurrency & Deadlock Suite, 3. Frontend Compilation & Idempotent Retry UX Suite, Current Test, Gaps, Summary, Tests

### Community 55 - "Goal Achievement"
Cohesion: 0.50
Nodes (3): Goal Achievement, Observable Truths, Phase 3: Data Capture Hooks Verification Report

### Community 56 - "v1 Requirements"
Cohesion: 0.29
Nodes (6): PGDATABASE, PGHOST, PGPASSWORD, PGPORT, PGUSER, test-concurrency-postgres.sh script

### Community 57 - "Phase 10 Verification Report"
Cohesion: 0.50
Nodes (3): Phase 10 Verification Report, Test Summary Across Codebase, Verification Checklist

### Community 58 - "icons.tsx"
Cohesion: 0.17
Nodes (18): AppLayout(), MORE_PATHS, Tab(), ActivityScreen(), EditBody(), Filter, IconActivity, IconChart (+10 more)

### Community 59 - "Requirements: FLOVA (M1 Backend & Database)"
Cohesion: 0.50
Nodes (3): Out of Scope, Requirements: FLOVA (M1 Backend & Database), Traceability Matrix

### Community 60 - "Plan 08-01: Secure FLOVA Catch (Receipt Extraction)"
Cohesion: 0.20
Nodes (9): Edge Function Contract (`extract-receipt`), Implementation Tasks, Objectives, Plan 08-01: Secure FLOVA Catch (Receipt Extraction), Security Boundaries & Rules, Task 0: Supabase Edge Function (`backend/supabase/functions/extract-receipt/index.ts`), Task 1: Frontend Receipt Service (`frontend/src/services/receipt.ts`), Task 3: Automated Test Suite (`frontend/src/services/__tests__/receiptExtraction.test.ts`) (+1 more)

### Community 61 - "PhonePeLandingPage.tsx"
Cohesion: 0.11
Nodes (19): PhonePeConcentricSection(), PhonePeConvenienceBills(), PhonePeDotWaveDevices(), PhonePeHeroPillars(), PhonePeHeroPillarsProps, PhonePeHeroSlider(), PhonePeHeroSliderProps, SlideData (+11 more)

### Community 62 - "PayoutsScreen.tsx"
Cohesion: 0.16
Nodes (37): categoriesFor(), TransactionForm(), submit(), parseOptionalRupees(), parseRequiredRupees(), CommitmentForm(), save(), OnboardingScreen() (+29 more)

### Community 63 - "AuthProvider"
Cohesion: 0.06
Nodes (39): client(), login(), AuthContext, AuthContextValue, AuthProvider(), LoginPage(), handleSubmit(), SignupPage() (+31 more)

### Community 64 - "mockSupabase.ts"
Cohesion: 0.20
Nodes (16): confirmCandidateTransaction(), assertStrictEqual(), assertTrue(), it(), runTests(), assertStrictEqual(), assertTrue(), it() (+8 more)

### Community 65 - "engine/index.ts"
Cohesion: 0.12
Nodes (31): Architectural Rules, ConfirmedBalanceResult, ConfirmedBalanceStatus, Architectural Rules, adaptExtractedCheckin(), adaptExtractedPayout(), adaptExtractedTransactions(), CategoryMappingResult (+23 more)

### Community 66 - "FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)"
Cohesion: 0.17
Nodes (11): 1. Overview & Architectural Boundaries, 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (Draft 2020-12 Compatible), 5. Concrete Extraction Examples, 6. M1 Backend & Edge Function Integration, Example 1: Multi-Transaction Sentence (Income + Expense), Example 2: Today's Spending Voice Query (+3 more)

### Community 67 - "OnboardingScreen.tsx"
Cohesion: 0.28
Nodes (10): PAYOUT_LABELS, VARIABILITY_LABELS, WORK_LABELS, toPaiseOrNull(), ParseRequiredRupeesResult, ParseRupeesResult, useProfile(), IncomeVariability (+2 more)

### Community 68 - "Key Architectural & Design Decisions"
Cohesion: 0.17
Nodes (11): 1. Security Boundary & Server-Side Credentials, 2. Dual-Stage Groq AI Pipeline (Whisper + Llama 3.3), 3. Canonical Data Contracts: FinancialExtractionDTO & VoiceTransactionCandidate, 4. Truthful Uncertainty & Anti-Hallucination, 5. Mandatory User Confirmation & Read-Only Inference, 6. Fallback Input, Context, Key Architectural & Design Decisions (+3 more)

### Community 69 - "useSession"
Cohesion: 0.12
Nodes (35): Frontend data hooks (`frontend/src/data/`), RedirectIfAuthed(), useSession(), DataVersionContext, DataVersionContextType, useDataVersion(), useCommitments(), useLatestCheckin() (+27 more)

### Community 70 - "CheckinScreen.tsx"
Cohesion: 0.23
Nodes (12): CheckinPrefillState, CheckinScreen(), save(), GROUPS, MoreScreen(), IconBank, IconLayers, IconLogout (+4 more)

### Community 71 - "useWish.ts"
Cohesion: 0.15
Nodes (24): calculateWish(), ContributionCadence, CreateWishInput, formatDateISO(), formatMonthYear(), Wish, WishCalculation, WishStatus (+16 more)

### Community 72 - "FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)"
Cohesion: 0.17
Nodes (11): 1. Overview & Architectural Boundaries, 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (Draft 2020-12 Compatible), 5. Concrete Extraction Examples, 6. M1 Backend & Edge Function Integration, Example 1: Multi-Transaction Sentence (Income + Expense), Example 2: Today's Spending Voice Query (+3 more)

### Community 73 - "Key Architectural & Design Decisions"
Cohesion: 0.18
Nodes (10): 1. Security Boundary & API Key Protection, 2. AI Provider: Groq (Verified Model Identifiers), 3. Truthful Uncertainty & Contract Alignment, 4. Mandatory User Confirmation, 5. Input Modes: Dual Image & Pasted-Text, 6. Idempotency & Retries, Context, Key Architectural & Design Decisions (+2 more)

### Community 74 - "extractTransaction.ts"
Cohesion: 0.06
Nodes (36): corsHeaders, ExtractReceiptRequest, GROQ_PIN, GROQ_PREFS, groqCandidates(), groqListModels(), groqModelUnavailable(), groqWithModelFallback() (+28 more)

### Community 75 - "OneRupeeCoin"
Cohesion: 0.26
Nodes (8): HeroSection(), HeroSectionProps, LandingSections(), LandingSectionsProps, OneRupeeCoin(), OneRupeeCoinProps, MorphBridgeProps, OneRupeeMorphBridge()

### Community 76 - "useMonthSummary.ts"
Cohesion: 0.46
Nodes (7): DayTotals, monthRange(), MonthSummary, pad(), shiftMonth(), summarise(), useMonthSummary()

### Community 77 - "addTransaction"
Cohesion: 0.19
Nodes (14): addTransaction(), receivePayout(), assertStrictEqual(), assertTrue(), it(), runTests(), NewTransaction, Task 1: Client-Side Idempotency (+6 more)

### Community 78 - "Locked Architectural Decisions (From Discussion)"
Cohesion: 0.25
Nodes (7): 1. Routing & Screen Anchoring, 2. Timeline Item Distinction & Expected Payouts, 3. Four Deterministic Financial Insights, 4. Financial Safety & Truthful Uncertainty, Locked Architectural Decisions (From Discussion), Phase 10 Context: Financial Activity, Money Overview & Insights, Phase Goal

### Community 79 - "App.tsx"
Cohesion: 0.36
Nodes (9): App(), RequireAuth(), RequireOnboarded(), Splash(), Task 2: FLOVA Catch UI (`frontend/src/pages/FlovaCatchPage.tsx` & Route), Key Implementation Details, Task 3: Voice UI Page (`frontend/src/pages/VoicePage.tsx` & Route), 5. Wire App Routes & Launcher (+1 more)

### Community 80 - "1. Locked Decisions & Core Architecture"
Cohesion: 0.22
Nodes (8): 1. Locked Decisions & Core Architecture, 2. Boundaries & Out-of-Scope, Decision 1: Database Trigger Derived Totals & Row-Level Locking, Decision 2: Status State Machine Transitions, Decision 3: Deadlock-Free Payout Reassignment, Decision 4: Client-Side Submission Idempotency, Decision 5: Security & RLS Invariants, Phase 5: Payout Synchronization Hardening - Context & Decisions

### Community 81 - "2. Band-by-Band Cadence in Video 2"
Cohesion: 0.13
Nodes (14): 1. Hero-to-Followup 1-Rupee Indian Coin Morph Transition, 2. Band-by-Band Cadence in Video 2, 3. Currency & Data Rules Mapping (FLOVA Contract Compliance), 4. Master Build Roadmap (Step 3 Preview), Band 1: Dark Feature Showcase Card (`#111214` / `#141517`), Band 2: 4-Column Feature & Value Strip (Light Paper Surface), Band 3: Fine-Grid Testimonial & Real Worker Stories Band, Band 4: Vibrant Cyan/Aqua Callout Banner (`#25DCF5` / `#00D2F0`) (+6 more)

### Community 82 - "ProfileProvider.tsx"
Cohesion: 0.13
Nodes (18): Service functions (`frontend/src/services/`), ProfileContext, ProfileContextType, ProfileProvider(), getMyProfile(), updateMyProfile(), Profile, ProfileUpdate (+10 more)

### Community 83 - "Tasks"
Cohesion: 0.29
Nodes (6): Objectives, Plan 05-01: Payout Synchronization Hardening & Idempotency, Task 0: Database Migration (`20261121000100_harden_payout_sync.sql`), Task 2: PGlite Comprehensive Regression Suite, Task 3: Real Multi-Connection PostgreSQL Concurrency Test, Tasks

### Community 84 - "Tasks"
Cohesion: 0.25
Nodes (7): Objectives, Plan 05-02: Idempotent Retry UX Fix in `addTransaction`, Task 0: Implement Idempotent Retry in `addTransaction`, Task 1: Add Comprehensive Regression Tests, Task 2: Execute Test Suites, Task 3: Verification & Documentation, Tasks

### Community 85 - "dates.test.ts"
Cohesion: 0.40
Nodes (4): d1, d2, iso1, iso2

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
Cohesion: 0.13
Nodes (33): 1. Overview & Ownership Boundaries, TxDraft, TxSubmit, ConfirmedBalanceBreakdown, candidateToNewTransaction(), confirmCandidateTransaction(), deriveDeterministicUUID(), fnv1a32() (+25 more)

### Community 90 - "Roadmap: FLOVA (12-Phase Hackathon Roadmap)"
Cohesion: 0.25
Nodes (7): Overview, Phase 6: Demo data, Phase 8: Secure FLOVA Catch receipt extraction integration, Phase Details, Phases, Progress, Roadmap: FLOVA (12-Phase Hackathon Roadmap)

### Community 91 - "Phase 9.1 User Acceptance Testing (UAT)"
Cohesion: 0.25
Nodes (7): Phase 9.1 User Acceptance Testing (UAT), Scenario 1: Language Pinned Transcription (Kannada), Scenario 2: Hindi Living Expense Extraction, Scenario 3: Truthful Uncertainty / Missing Amount (Kannada), Scenario 4: Platform Expected Payout Isolation (Telugu), Scenario 5: Balance Check-in Segregation (Urdu), Scenario 6: Multilingual Deterministic Financial Queries

### Community 92 - "FinancialExtractionDTO"
Cohesion: 0.06
Nodes (32): 2. Canonical Edge Function Endpoint Specification: `process-voice`, 3. Dedicated Receipt Extraction Endpoint: `extract-receipt`, 4. Groq API Implementation Details for M1, 5. End-to-End Sequence Flow, Endpoint, Endpoint, FLOVA — M1 Edge Function Integration Contract (Owner: M3 / AI Engine), Mode 1: Audio Input (Microphone Recording) (+24 more)

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

### Community 100 - "loadRunwayInput"
Cohesion: 0.11
Nodes (19): DataVersionProvider(), loadRunwayInput(), RunwayInput, Codebase Concerns, Fragile Areas, Missing Critical Features (To be delivered in Roadmap), Security Considerations, Tech Debt (+11 more)

### Community 101 - "Codebase Structure"
Cohesion: 0.33
Nodes (5): Codebase Structure, Directory Layout, Directory Purposes, Key File Locations, Where to Add New Code

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

### Community 109 - "listActivityTimeline"
Cohesion: 0.19
Nodes (15): generateFinancialInsights(), listActivityTimeline(), assertStrictEqual(), assertTrue(), it(), runTests(), resetMockState(), ActivityItem (+7 more)

### Community 111 - "Plan 10-01: Financial Activity, Money Overview & Deterministic Insights"
Cohesion: 0.18
Nodes (10): 2. Implement Deterministic Financial Insights Engine, 3. Build Financial Activity Screen (`/activity`), 4. Build Money Overview Screen (`/overview`), 6. Automated Verification & Regression Testing, Objective, Owner: M1 (Backend/Contracts) & M2/M3 (Frontend & Insights Engine), Phase: 10, Plan: 01 (+2 more)

### Community 112 - "Phase 7 Plan 01 Summary: Financial Data Contracts & Timeline Helpers"
Cohesion: 0.50
Nodes (3): Key Implementation Details, Outcome, Phase 7 Plan 01 Summary: Financial Data Contracts & Timeline Helpers

### Community 115 - "Phase 5: Payout Synchronization Hardening & Idempotency Verification Report"
Cohesion: 0.40
Nodes (4): Goal Achievement, Observable Truths, Phase 5: Payout Synchronization Hardening & Idempotency Verification Report, Technical Audit & Safety Bounds

### Community 116 - "Plan 10-01 Summary: Financial Activity, Money Overview & Deterministic Insights"
Cohesion: 0.50
Nodes (3): Key Metrics, Overview, Plan 10-01 Summary: Financial Activity, Money Overview & Deterministic Insights

## Knowledge Gaps
- **16 isolated node(s):** `udaan-engine`, `@supabase/supabase-js`, `PGPASSWORD`, `PGHOST`, `PGPORT` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 711 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `frontend/package.json`, `kit.tsx`, `VoiceScreen.tsx`, `CommitmentsScreen.tsx`, `Icons.tsx`, `icons.tsx`, `PhonePeLandingPage.tsx`, `PayoutsScreen.tsx`, `AuthProvider`, `OnboardingScreen.tsx`, `useSession`, `CheckinScreen.tsx`, `useWish.ts`, `OneRupeeCoin`, `useMonthSummary.ts`, `App.tsx`, `ProfileProvider.tsx`, `useAudioRecorder.ts`, `useVoiceRecorder.ts`, `useSpeechToText.ts`, `PhonePeAppstoreHalo.tsx`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `toPaise()` (e.g. with `Architectural Rules` and `Rules everyone follows`) actually correct?**
  _`toPaise()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `udaan-engine`, `@supabase/supabase-js`, `PGPASSWORD` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `test_engine.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06749482401656315 - nodes in this community are weakly interconnected._
- **Why does `Active (M1 Roadmap Scope)` connect `loadRunwayInput` to `OnboardingScreen.tsx`, `useSession`, `FLOVA (Udaan 2.0)`, `addTransaction`, `AuthProvider`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `useSession()` (e.g. with `Layers` and `Primary Runway Feed Path`) actually correct?**
  _`useSession()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Should `adapter.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14210526315789473 - nodes in this community are weakly interconnected._