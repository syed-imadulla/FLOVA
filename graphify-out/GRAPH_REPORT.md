# Graph Report - FLOVA  (2026-11-21)

## Corpus Check
- 291 files · ~191,204 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 5, (none) 3, .example 3)

## Summary
- 1770 nodes · 4214 edges · 154 communities (125 shown, 29 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 313 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `443513d5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- __init__.py
- validation.ts
- VERDICT — pick-f1-irregular-income
- contracts.ts
- frontend/package.json
- loadRunwayInput
- toPaise
- seed-demo.mjs
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
- testUtils.ts
- Project State
- Tests
- kit.tsx
- confirmCandidateTransaction
- Technology Stack
- Testing Patterns
- Card
- External Integrations
- Tests
- 01-01-PLAN.md
- Plan 02-01: Profile and Onboarding Persistence
- browser-audit.mjs
- Phase 4: Runway Feed Verification Report
- backend/package.json
- Plan 03-01: Data Capture Hooks and Pages
- Icons.tsx
- FLOVA (Udaan 2.0)
- Goal Achievement
- v1 Requirements
- integrationVoiceCatchWish.test.ts
- test-db.mjs
- CDPClient
- Plan 08-01: Secure FLOVA Catch (Receipt Extraction)
- PhonePeLandingPage.tsx
- scripts
- signOut
- test-payout-sync.mjs
- engine/index.ts
- FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)
- icons.tsx
- Key Architectural & Design Decisions
- useSession
- smartCaptureReceiptUpi.test.ts
- useWish.ts
- VoiceScreen.tsx
- Key Architectural & Design Decisions
- extractTransaction.ts
- OneRupeeCoin
- data.ts
- addTransaction
- generate_year
- test_engine.py
- 1. Locked Decisions & Core Architecture
- 2. Band-by-Band Cadence in Video 2
- v1 Requirements
- Tasks
- HomeScreen.tsx
- coreFinancialCorrectness.test.ts
- api.ts
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
- useSession
- Codebase Structure
- Phase 10.2: Application UI shell and screens — Plan 01
- Phase 10.2 Plan 01: Summary
- sw.js
- useVoiceRecorder.ts
- useSpeechToText.ts
- listActivityTimeline
- RiderView
- Plan 10-01: Financial Activity, Money Overview & Deterministic Insights
- ActivityItem
- main
- AddScreen.tsx
- Phase 5: Payout Synchronization Hardening & Idempotency Verification Report
- auth.ts
- Phase 8 Plan 01 Summary: Secure FLOVA Catch (Receipt Extraction)
- PhonePeAppstoreHalo.tsx
- App.tsx
- SmsView
- FLOVA data contract (v1 · owner: M1)
- candidateAdapter.ts
- parseRupees.test.ts
- FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)
- Implementation Tasks
- Implementation Decisions
- ProfileProvider.tsx
- FLOVA — Handoff & Full Context (2026-11-21)
- useMonthSummary.ts
- 2. Work Breakdown
- 1. Requirements & Acceptance Criteria Verification
- FLOVA (Udaan 2.0)
- generalisedProfiles.test.ts
- Technical Decisions & Architecture
- External Integrations
- Phase 1: Auth flow - Context
- Locked Architectural Decisions (From Discussion)
- resetMockState
- Coding Conventions
- FLOVA — M1 Edge Function Integration Contract (Owner: M3 / AI Engine)
- Implementation Tasks
- confirmCandidateTransaction
- getSession
- multilingualVoice.test.ts
- receiptExtraction.test.ts
- Phase 9 User Acceptance Testing (UAT) Report: Voice Transcription & Intent Integration
- Phase 9 Verification Report: Secure Voice Transcription & Intent Integration
- rls-live-check.mjs
- Plan 06-01: Realistic Demo Data Seeding & Isolation
- Phase 9.1 Context: Multilingual Voice Support & Language-Specific Financial Extraction
- Plan 10-01 Summary: Financial Activity, Money Overview & Deterministic Insights
- Phase 10 Verification Report
- Phase 9 Plan 01 Summary: Secure Voice Transcription and Financial Intent Integration

## God Nodes (most connected - your core abstractions)
1. `react` - 84 edges
2. `toPaise()` - 42 edges
3. `Notice()` - 42 edges
4. `todayLocalISO()` - 41 edges
5. `useSession()` - 36 edges
6. `Card()` - 34 edges
7. `FinancialExtractionDTO` - 33 edges
8. `formatINR()` - 33 edges
9. `react-router-dom` - 30 edges
10. `Button()` - 30 edges

## Surprising Connections (you probably didn't know these)
- `Branches` --references--> `main()`  [INFERRED]
  CONTRIBUTING.md → ai-engine/udaan_engine/__main__.py
- `Tasks` --references--> `AppLayout()`  [INFERRED]
  .planning/phases/10.2-app-ui-shell/10.2-01-PLAN.md → frontend/src/app/AppLayout.tsx
- `Task 1: Improved Receipt Scanning and Extraction` --references--> `todayLocalISO()`  [INFERRED]
  .planning/phases/14-smart-capture-receipt-intelligence-upi-share-integration/14-VERIFICATION.md → frontend/src/data/dates.ts
- `6. M1 Backend & Edge Function Integration` --references--> `validateExtractionOutput()`  [INFERRED]
  ai-engine/EXTRACTION_CONTRACT.md → frontend/src/engine/extractionPrompt.ts
- `Endpoint` --references--> `FinancialExtractionDTO`  [INFERRED]
  ai-engine/M1_GROQ_INTEGRATION.md → frontend/src/engine/extractionTypes.ts

## Import Cycles
- None detected.

## Communities (154 total, 29 thin omitted)

### Community 0 - "__init__.py"
Cohesion: 0.17
Nodes (11): test_backtest_shape(), test_low_income_is_not_called_a_timing_problem(), test_udaan_borrows_fewer_weeks_when_income_is_enough(), backtest_all(), backtest_profile(), can_smoothing_help(), _cv(), run_baseline() (+3 more)

### Community 1 - "validation.ts"
Cohesion: 0.17
Nodes (27): calculateConfirmedBalance(), validateExtractionOutput(), FinancialInsight, GenerateInsightsOptions, InsightSeverity, addDays(), calculateDailyRunway(), DailyProjectionEntry (+19 more)

### Community 2 - "VERDICT — pick-f1-irregular-income"
Cohesion: 0.05
Nodes (40): An alternative approach (same problem, same user), Contradictions between jurors, If I were your team…, Next experiment (30 min), Ranked improvements, Ratings /10, VERDICT — pick-f1-irregular-income, Votes (+32 more)

### Community 3 - "contracts.ts"
Cohesion: 0.10
Nodes (19): fridayEntry, mondayEntry, raviInput, result, saturdayEntry, APP_LANGUAGES, AppLanguage, COMMITMENT_KINDS (+11 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.06
Nodes (33): dependencies, react, react-dom, react-router-dom, @supabase/supabase-js, devDependencies, autoprefixer, postcss (+25 more)

### Community 5 - "loadRunwayInput"
Cohesion: 0.12
Nodes (18): Service functions (`frontend/src/services/`), getLatestCheckin(), getMyProfile(), loadRunwayInput(), Architectural Constraints, Architecture, Component Responsibilities, Data Flow (+10 more)

### Community 6 - "toPaise"
Cohesion: 0.19
Nodes (18): Rules everyone follows, PAYOUT_LABELS, VARIABILITY_LABELS, WORK_LABELS, paiseToRupeeString(), toPaise(), toPaiseOrNull(), ParseRequiredRupeesResult (+10 more)

### Community 7 - "seed-demo.mjs"
Cohesion: 0.20
Nodes (9): RAVI_FIXTURE, runLiveSeeding(), runTestVerification(), seedDemoUser(), Key Implementation Details, Outcome, Phase 6 Plan 01 Summary: Realistic Demo Data Seeding & Isolation, Phase 6 UAT: Realistic Demo Data Seeding & Isolation (+1 more)

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

### Community 36 - "testUtils.ts"
Cohesion: 0.19
Nodes (16): d1, d2, iso1, iso2, RunwayProjectionInput, baseProfile, baseProfile, assertMatch() (+8 more)

### Community 37 - "Project State"
Cohesion: 0.29
Nodes (6): Current Position, Integration Milestone (2026-11-21), Performance Metrics, Phase 10.2: Application UI Shell & Live AI (2026-11-21), Project Reference, Project State

### Community 38 - "Tests"
Cohesion: 0.13
Nodes (14): 1. Logged out redirect to /login (B1), 2. Sign up with new email and display name (B2), 3. Session persistence on refresh (B3), 4. Logout and route protection (B4), 5. Login error handling (B5), 6. Redirect authenticated user away from /login (B6), 7. Client-side password length validation (B7), A. Live RLS Test (+6 more)

### Community 39 - "kit.tsx"
Cohesion: 0.15
Nodes (38): todayLocalISO(), formatINR(), useRunway(), CommitmentsScreen(), InsightsScreen(), InsightsTab(), Runway, RunwayAndInsights() (+30 more)

### Community 40 - "confirmCandidateTransaction"
Cohesion: 0.29
Nodes (10): assertStrictEqual(), assertTrue(), it(), runTests(), mockState, supabase, BalanceCheckin, Payout (+2 more)

### Community 41 - "Technology Stack"
Cohesion: 0.25
Nodes (7): Configuration, Frameworks, Key Dependencies, Languages, Platform Requirements, Runtime, Technology Stack

### Community 42 - "Testing Patterns"
Cohesion: 0.29
Nodes (6): Mocking & Isolation, Required Pre-Shipping Checks, Test File Organization, Test Framework, Test Structure, Testing Patterns

### Community 43 - "Card"
Cohesion: 0.19
Nodes (34): TransactionForm(), submit(), parseOptionalRupees(), parseRequiredRupees(), CheckinScreen(), save(), CommitmentForm(), save() (+26 more)

### Community 44 - "External Integrations"
Cohesion: 0.29
Nodes (3): __dirname, __filename, mockSupabasePath

### Community 45 - "Tests"
Cohesion: 0.12
Nodes (15): 1. Currency parser unit tests, 1. New user signup routing, 2. Blank ₹ fields submission, 2. M3 Engine tests regression suite, 3. Database test suite, 3. Session refresh persistence, 4. Edit profile updates immediately, 5. Client-side validation (+7 more)

### Community 48 - "browser-audit.mjs"
Cohesion: 0.12
Nodes (13): activitySrc, addSrc, aliases, catchSrc, chrome, client, __dirname, distDir (+5 more)

### Community 49 - "Phase 4: Runway Feed Verification Report"
Cohesion: 0.33
Nodes (5): Goal Achievement, Investigation Findings: Previous Aggregate Test Command Failures, M1 Data Layer & M3 Engine Integration Audit, Observable Truths, Phase 4: Runway Feed Verification Report

### Community 50 - "backend/package.json"
Cohesion: 0.20
Nodes (9): description, devDependencies, @electric-sql/pglite, @supabase/supabase-js, @supabase/supabase-js, name, private, type (+1 more)

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

### Community 57 - "integrationVoiceCatchWish.test.ts"
Cohesion: 0.24
Nodes (12): assertStrictEqual(), assertTrue(), it(), runTests(), assertStrictEqual(), assertTrue(), it(), runTests() (+4 more)

### Community 58 - "test-db.mjs"
Cohesion: 0.25
Nodes (7): allProfiles, allVariabilities, db, expectError(), files, migrationsDir, ok()

### Community 60 - "Plan 08-01: Secure FLOVA Catch (Receipt Extraction)"
Cohesion: 0.20
Nodes (9): Edge Function Contract (`extract-receipt`), Implementation Tasks, Objectives, Plan 08-01: Secure FLOVA Catch (Receipt Extraction), Security Boundaries & Rules, Task 0: Supabase Edge Function (`backend/supabase/functions/extract-receipt/index.ts`), Task 1: Frontend Receipt Service (`frontend/src/services/receipt.ts`), Task 3: Automated Test Suite (`frontend/src/services/__tests__/receiptExtraction.test.ts`) (+1 more)

### Community 61 - "PhonePeLandingPage.tsx"
Cohesion: 0.11
Nodes (19): PhonePeConcentricSection(), PhonePeConvenienceBills(), PhonePeDotWaveDevices(), PhonePeHeroPillars(), PhonePeHeroPillarsProps, PhonePeHeroSlider(), PhonePeHeroSliderProps, SlideData (+11 more)

### Community 62 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, seed:demo, test:db, test:rls-live, test:seed

### Community 63 - "signOut"
Cohesion: 0.18
Nodes (13): onAuthChange(), signOut(), APIs & External Services, 1. Routing & Dependencies, 2. Auth Context & Session Management, 3. Pages & UI Presentation, 4. Authentication Workflows & Form Behavior, 6. Backend Hygiene & Explicit Permissions (+5 more)

### Community 64 - "test-payout-sync.mjs"
Cohesion: 0.50
Nodes (3): assert(), runTestSuite(), @electric-sql/pglite

### Community 65 - "engine/index.ts"
Cohesion: 0.12
Nodes (27): ConfirmedBalanceResult, ConfirmedBalanceStatus, adaptExtractedCheckin(), adaptExtractedPayout(), adaptExtractedTransactions(), CategoryMappingResult, CheckinAdaptationResult, CorrectionResolutionResult (+19 more)

### Community 66 - "FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)"
Cohesion: 0.18
Nodes (10): 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (Draft 2020-12 Compatible), 5. Concrete Extraction Examples, 6. M1 Backend & Edge Function Integration, Example 1: Multi-Transaction Sentence (Income + Expense), Example 2: Today's Spending Voice Query, Example 3: Pending Payments Voice Query (+2 more)

### Community 67 - "icons.tsx"
Cohesion: 0.14
Nodes (23): ActivityRow(), AppLayout(), MORE_PATHS, Tab(), ActivityScreen(), EditBody(), Filter, IconActivity (+15 more)

### Community 68 - "Key Architectural & Design Decisions"
Cohesion: 0.17
Nodes (11): 1. Security Boundary & Server-Side Credentials, 2. Dual-Stage Groq AI Pipeline (Whisper + Llama 3.3), 3. Canonical Data Contracts: FinancialExtractionDTO & VoiceTransactionCandidate, 4. Truthful Uncertainty & Anti-Hallucination, 5. Mandatory User Confirmation & Read-Only Inference, 6. Fallback Input, Context, Key Architectural & Design Decisions (+3 more)

### Community 69 - "useSession"
Cohesion: 0.15
Nodes (13): DataVersionProvider(), useTransactions(), remove(), save(), deleteTransaction(), listTransactions(), updateTransaction(), Key Accomplishments (+5 more)

### Community 70 - "smartCaptureReceiptUpi.test.ts"
Cohesion: 0.20
Nodes (15): checkDuplicateUpiReference(), extractReceipt(), extractReceiptFallback(), ExtractReceiptInput, ExtractReceiptResult, fileToBase64(), assertStrictEqual(), assertTrue() (+7 more)

### Community 71 - "useWish.ts"
Cohesion: 0.15
Nodes (24): calculateWish(), ContributionCadence, CreateWishInput, formatDateISO(), formatMonthYear(), Wish, WishCalculation, WishStatus (+16 more)

### Community 72 - "VoiceScreen.tsx"
Cohesion: 0.15
Nodes (20): paiseToInput(), rupeeStringToInput(), CatchScreen(), extract(), loadSharedContent(), pick(), CheckinPrefillState, EXAMPLES (+12 more)

### Community 73 - "Key Architectural & Design Decisions"
Cohesion: 0.20
Nodes (9): 1. Security Boundary & API Key Protection, 2. AI Provider: Groq (Verified Model Identifiers), 3. Truthful Uncertainty & Contract Alignment, 4. Mandatory User Confirmation, 5. Input Modes: Dual Image & Pasted-Text, 6. Idempotency & Retries, Key Architectural & Design Decisions, Phase 8: Secure FLOVA Catch (Receipt Extraction) — Context & Decisions (+1 more)

### Community 74 - "extractTransaction.ts"
Cohesion: 0.06
Nodes (37): corsHeaders, ExtractReceiptRequest, GROQ_PIN, GROQ_PREFS, groqCandidates(), groqListModels(), groqModelUnavailable(), groqWithModelFallback() (+29 more)

### Community 75 - "OneRupeeCoin"
Cohesion: 0.26
Nodes (8): HeroSection(), HeroSectionProps, LandingSections(), LandingSectionsProps, OneRupeeCoin(), OneRupeeCoinProps, MorphBridgeProps, OneRupeeMorphBridge()

### Community 76 - "data.ts"
Cohesion: 0.20
Nodes (20): Frontend data hooks (`frontend/src/data/`), useCommitments(), useLatestCheckin(), usePayouts(), unwrap(), addCheckin(), addCommitment(), addPayout() (+12 more)

### Community 77 - "addTransaction"
Cohesion: 0.12
Nodes (21): addTransaction(), receivePayout(), assertStrictEqual(), assertTrue(), it(), runTests(), NewTransaction, Task 1: Client-Side Idempotency (+13 more)

### Community 78 - "generate_year"
Cohesion: 0.13
Nodes (10): test_generate_year_is_reproducible(), test_outlook_needs_history(), test_outlook_warns_in_slow_season_with_empty_buffer(), lean_outlook(), generate_year(), month_of_week(), seasonal_factor(), Shock (+2 more)

### Community 79 - "test_engine.py"
Cohesion: 0.20
Nodes (14): test_buffer_never_negative_and_money_is_conserved(), test_estimate_ignores_one_big_week(), test_estimate_with_little_history_is_cautious(), test_lean_week_is_covered_by_buffer(), test_negative_income_week_handled(), test_reasons_match_what_happened(), test_rejects_bad_essentials(), test_salary_moves_slowly() (+6 more)

### Community 80 - "1. Locked Decisions & Core Architecture"
Cohesion: 0.22
Nodes (8): 1. Locked Decisions & Core Architecture, 2. Boundaries & Out-of-Scope, Decision 1: Database Trigger Derived Totals & Row-Level Locking, Decision 2: Status State Machine Transitions, Decision 3: Deadlock-Free Payout Reassignment, Decision 4: Client-Side Submission Idempotency, Decision 5: Security & RLS Invariants, Phase 5: Payout Synchronization Hardening - Context & Decisions

### Community 81 - "2. Band-by-Band Cadence in Video 2"
Cohesion: 0.13
Nodes (14): 1. Hero-to-Followup 1-Rupee Indian Coin Morph Transition, 2. Band-by-Band Cadence in Video 2, 3. Currency & Data Rules Mapping (FLOVA Contract Compliance), 4. Master Build Roadmap (Step 3 Preview), Band 1: Dark Feature Showcase Card (`#111214` / `#141517`), Band 2: 4-Column Feature & Value Strip (Light Paper Surface), Band 3: Fine-Grid Testimonial & Real Worker Stories Band, Band 4: Vibrant Cyan/Aqua Callout Banner (`#25DCF5` / `#00D2F0`) (+6 more)

### Community 82 - "v1 Requirements"
Cohesion: 0.18
Nodes (10): Out of Scope, Phase 2: Profile & Onboarding Data, Phase 3: Data Capture Hooks & Mutation Services, Phase 4: Runway Feed & Engine Integration, Phase 5: Secure AI Function (Stretch), Phase 6: Demo Data Seed & Test Fixtures, Phase 7: Deployment & Production Smoke Test, Requirements: FLOVA (M1 Backend & Database) (+2 more)

### Community 83 - "Tasks"
Cohesion: 0.29
Nodes (6): Objectives, Plan 05-01: Payout Synchronization Hardening & Idempotency, Task 0: Database Migration (`20261121000100_harden_payout_sync.sql`), Task 2: PGlite Comprehensive Regression Suite, Task 3: Real Multi-Connection PostgreSQL Concurrency Test, Tasks

### Community 84 - "HomeScreen.tsx"
Cohesion: 0.23
Nodes (18): useProfile(), HomeScreen(), QuickAction(), RunwayStatus(), StatusLink(), GROUPS, MoreScreen(), IconAlert (+10 more)

### Community 85 - "coreFinancialCorrectness.test.ts"
Cohesion: 0.18
Nodes (13): categoriesFor(), CategoryOption, EXPENSE_CATEGORIES, INCOME_CATEGORIES, PROFILE_INCOME_PRIORITY, DAILY_AGGREGATE_LIMIT_ERROR_MESSAGE, DAILY_ESTIMATE_LIMIT_ERROR_MESSAGE, LIMIT_ERROR_MESSAGE (+5 more)

### Community 86 - "api.ts"
Cohesion: 0.17
Nodes (11): api, BacktestRow, FALLBACK_PROFILES, OutlookWeek, Plan, Profile, Rider, Status (+3 more)

### Community 87 - "MockQueryBuilder"
Cohesion: 0.17
Nodes (3): MockQueryBuilder, Phase 7 UAT: Financial Data Contracts & Timeline Helpers, User Acceptance Criteria & Results

### Community 88 - "FLOVA Hero Section Blueprint: Video 1 Deep Analysis"
Cohesion: 0.20
Nodes (9): 1. Canvas, Background Surface & Spatial Framing, 2. Top Navigation Bar (Fixed / Sticky Editorial Header), 3. Centered Typography Lockup & Easing Choreography, 4. Central Focal Visual (Centerpiece), 5. Hand-Drawn Sketch Annotations, Medallion & Secondary Visuals, 6. Reveal on Scroll (Sub-Hero Section at `t = 12s–17.8s`), 7. Motion Choreography & Parallax Execution Plan, 8. Readiness Checklist for Video 2 & Master Build (+1 more)

### Community 89 - "candidateAdapter.ts"
Cohesion: 0.21
Nodes (19): 1. Overview & Ownership Boundaries, candidateToNewTransaction(), confirmCandidateTransaction(), deriveDeterministicUUID(), fnv1a32(), generateUUID(), getTransactionsFromDto(), isValidUUID() (+11 more)

### Community 90 - "Roadmap: FLOVA (12-Phase Hackathon Roadmap)"
Cohesion: 0.20
Nodes (9): Overview, Phase 13: Core Financial Correctness, Navigation and Account Management, Phase 6: Demo data, Phase 7: Financial data contracts, Phase 8: Secure FLOVA Catch receipt extraction integration, Phase Details, Phases, Progress (+1 more)

### Community 91 - "Phase 9.1 User Acceptance Testing (UAT)"
Cohesion: 0.25
Nodes (7): Phase 9.1 User Acceptance Testing (UAT), Scenario 1: Language Pinned Transcription (Kannada), Scenario 2: Hindi Living Expense Extraction, Scenario 3: Truthful Uncertainty / Missing Amount (Kannada), Scenario 4: Platform Expected Payout Isolation (Telugu), Scenario 5: Balance Check-in Segregation (Urdu), Scenario 6: Multilingual Deterministic Financial Queries

### Community 92 - "FinancialExtractionDTO"
Cohesion: 0.21
Nodes (12): 2. Canonical Edge Function Endpoint Specification: `process-voice`, Endpoint, Mode 1: Audio Input (Microphone Recording), Mode 2: Typed Text / Transcript Input (Direct Extraction), Response Body, FinancialExtractionDTO, Edge Function Contract (`process-voice`), Objectives (+4 more)

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

### Community 100 - "useSession"
Cohesion: 0.23
Nodes (10): AuthProvider(), RedirectIfAuthed(), useSession(), Codebase Concerns, Fragile Areas, Missing Critical Features (To be delivered in Roadmap), Security Considerations, Tech Debt (+2 more)

### Community 101 - "Codebase Structure"
Cohesion: 0.29
Nodes (6): Codebase Structure, Directory Layout, Directory Purposes, Key File Locations, Naming Conventions, Where to Add New Code

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
Cohesion: 0.31
Nodes (9): listActivityTimeline(), ActivityItemKind, 1. Extend Contracts & Timeline Service, 2. Implement Deterministic Financial Insights Engine, 3. Build Financial Activity Screen (`/activity`), 4. Build Money Overview Screen (`/overview`), 6. Automated Verification & Regression Testing, Tasks (+1 more)

### Community 110 - "RiderView"
Cohesion: 0.32
Nodes (12): rs(), WeekPlan, EvidenceView(), pct(), ChartLegend(), IncomeChart(), Props, RiderView() (+4 more)

### Community 111 - "Plan 10-01: Financial Activity, Money Overview & Deterministic Insights"
Cohesion: 0.33
Nodes (5): Objective, Owner: M1 (Backend/Contracts) & M2/M3 (Frontend & Insights Engine), Phase: 10, Plan: 01, Plan 10-01: Financial Activity, Money Overview & Deterministic Insights

### Community 112 - "ActivityItem"
Cohesion: 0.20
Nodes (8): ActivityItem, Objectives, Plan 07-01: Financial Data Contracts & Timeline Helpers, Tasks, Key Implementation Details, Outcome, Phase 7 Plan 01 Summary: Financial Data Contracts & Timeline Helpers, Context

### Community 113 - "main"
Cohesion: 0.15
Nodes (10): main(), 3. Git state, Codebase Context, Docs Context, Onboarding Summary, Project State, Recommended Next Step, Workstream & Rules (+2 more)

### Community 114 - "AddScreen.tsx"
Cohesion: 0.26
Nodes (9): categoryLabel(), emptyDraft(), useActivity(), DataVersionContext, DataVersionContextType, useDataVersion(), AddScreen(), save() (+1 more)

### Community 115 - "Phase 5: Payout Synchronization Hardening & Idempotency Verification Report"
Cohesion: 0.40
Nodes (4): Goal Achievement, Observable Truths, Phase 5: Payout Synchronization Hardening & Idempotency Verification Report, Technical Audit & Safety Bounds

### Community 116 - "auth.ts"
Cohesion: 0.23
Nodes (8): AuthContext, AuthContextValue, publishableKey, supabase, url, LoginPage(), handleSubmit(), signIn()

### Community 119 - "App.tsx"
Cohesion: 0.36
Nodes (9): App(), RequireAuth(), RequireOnboarded(), Splash(), Task 2: FLOVA Catch UI (`frontend/src/pages/FlovaCatchPage.tsx` & Route), Key Implementation Details, Task 3: Voice UI Page (`frontend/src/pages/VoicePage.tsx` & Route), 5. Wire App Routes & Launcher (+1 more)

### Community 120 - "SmsView"
Cohesion: 0.18
Nodes (10): SmsView(), 1. Executive Summary, 2. Key Deliverables & Changes, 3. Verification & Quality Gates, 4. Note for M2 (Frontend/UI), 5. Next Steps, Authentication & Routing Infrastructure, Database & Backend Hygiene (+2 more)

### Community 121 - "FLOVA data contract (v1 · owner: M1)"
Cohesion: 0.08
Nodes (22): Branches, Definition of done for any pull request, Every working session, Graphify: required for everyone, One-time setup (each member, each laptop), Who owns what, Working on FLOVA (team rules for the 24-hour build), `balance_checkins` (actual cash + bank at a moment) (+14 more)

### Community 122 - "candidateAdapter.ts"
Cohesion: 0.18
Nodes (19): 1. Overview & Architectural Boundaries, Architectural Rules, TxDraft, TxSubmit, ConfirmedBalanceBreakdown, ExtractedReceiptCandidate, VoiceTransactionCandidate, 1. Overview & Architectural Boundaries (+11 more)

### Community 123 - "parseRupees.test.ts"
Cohesion: 0.17
Nodes (11): req650, reqEmpty, reqZero, res10L, res200, res995, resAbc, resDec (+3 more)

### Community 124 - "FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)"
Cohesion: 0.18
Nodes (10): 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (Draft 2020-12 Compatible), 5. Concrete Extraction Examples, 6. M1 Backend & Edge Function Integration, Example 1: Multi-Transaction Sentence (Income + Expense), Example 2: Today's Spending Voice Query, Example 3: Pending Payments Voice Query (+2 more)

### Community 125 - "Implementation Tasks"
Cohesion: 0.25
Nodes (7): Implementation Tasks, Objective, Plan 13-01: Core Financial Correctness, Navigation and Account Management, Task 2: Add Income Categories & Profile Adaptation, Task 3: Fix Navigation and Redirects, Task 4: Complete Logout & Session State Clearing, Verification Plan

### Community 126 - "Implementation Decisions"
Cohesion: 0.17
Nodes (11): ReviewState, 5. Screens (all inside the bottom-navbar layout), Task 1: Fix Voice Transaction Amount Duplication, 1. Voice Transaction Amount Duplication, 2. Income Categories, 3. Navigation and Redirects, 5. Application Daily Limit (₹10 Lakh), Implementation Decisions (+3 more)

### Community 127 - "ProfileProvider.tsx"
Cohesion: 0.19
Nodes (11): ProfileContext, ProfileContextType, ProfileProvider(), updateMyProfile(), Profile, ProfileUpdate, Key Accomplishments, Phase 2: Profile & Onboarding Data Summary (+3 more)

### Community 128 - "FLOVA — Handoff & Full Context (2026-11-21)"
Cohesion: 0.18
Nodes (10): 10. Open issues / next work, 1. Product, 4. Repository map, 6. Rules the code relies on (keep them), 7. AI layer (Edge Functions), 8. Database, 9. Run, test, build, Deploying functions (+2 more)

### Community 129 - "useMonthSummary.ts"
Cohesion: 0.23
Nodes (11): DayTotals, monthRange(), MonthSummary, pad(), shiftMonth(), summarise(), useMonthSummary(), Financial Integrity Audit (+3 more)

### Community 130 - "2. Work Breakdown"
Cohesion: 0.20
Nodes (9): 1. Plan Overview, 2. Work Breakdown, Owner: M1 Backend & Integration, Phase: 14-smart-capture-receipt-intelligence-upi-share-integration, Plan 14-01: Smart Capture, Receipt Intelligence & UPI Share Integration, Wave 1: Schema, Contracts, Edge Function & Service Contracts, Wave 2: PWA Share Target & Service Worker, Wave 3: UI Enhancement in `CatchScreen.tsx` & `AddScreen.tsx` (+1 more)

### Community 131 - "1. Requirements & Acceptance Criteria Verification"
Cohesion: 0.20
Nodes (9): 1. Requirements & Acceptance Criteria Verification, 2. Test Execution Results, 3. Edge Function Deployment, Phase 14 Verification: Smart Capture, Receipt Intelligence & UPI Share Integration, Phase Overview, Task 1: Improved Receipt Scanning and Extraction, Task 2: Support for UPI Payment Screenshots, Task 3: Camera, Gallery & File Uploads (+1 more)

### Community 132 - "FLOVA (Udaan 2.0)"
Cohesion: 0.20
Nodes (9): Business & Problem Context, Core Value, FLOVA (Udaan 2.0), Key Decisions Log, Out of Scope, Requirements, Team Ownership & Boundaries, Technical Environment & Architecture (+1 more)

### Community 133 - "generalisedProfiles.test.ts"
Cohesion: 0.31
Nodes (8): assertStrictEqual(), assertTrue(), it(), runTests(), INCOME_VARIABILITIES, OCCUPATION_WORK_CATEGORIES, UNIVERSAL_LIVING_CATEGORIES, WORK_PROFILES

### Community 134 - "Technical Decisions & Architecture"
Cohesion: 0.22
Nodes (8): 1. Edge Function `extract-receipt` Enhancement, 2. Date Fallback Invariant, 3. Payment Status & Duplicate Guardrails, 4. PWA Web Share Target, 5. Camera vs Gallery Separation, Phase 14 Context: Smart Capture, Receipt Intelligence & UPI Share Integration, Phase Overview & Goals, Technical Decisions & Architecture

### Community 135 - "External Integrations"
Cohesion: 0.25
Nodes (7): Authentication & Identity, CI/CD & Deployment, Data Storage, Environment Configuration, External Integrations, Monitoring & Observability, Webhooks & Callbacks

### Community 136 - "Phase 1: Auth flow - Context"
Cohesion: 0.25
Nodes (7): Deferred Ideas, Established Patterns, Existing Code Insights, Integration Points, Phase 1: Auth flow - Context, Phase Boundary, Reusable Assets

### Community 137 - "Locked Architectural Decisions (From Discussion)"
Cohesion: 0.25
Nodes (7): 1. Routing & Screen Anchoring, 2. Timeline Item Distinction & Expected Payouts, 3. Four Deterministic Financial Insights, 4. Financial Safety & Truthful Uncertainty, Locked Architectural Decisions (From Discussion), Phase 10 Context: Financial Activity, Money Overview & Insights, Phase Goal

### Community 138 - "resetMockState"
Cohesion: 0.52
Nodes (6): generateFinancialInsights(), assertStrictEqual(), assertTrue(), it(), runTests(), resetMockState()

### Community 139 - "Coding Conventions"
Cohesion: 0.29
Nodes (6): RupeeString, Code Style, Coding Conventions, Database Interaction Conventions, Error Handling, Import Organization

### Community 140 - "FLOVA — M1 Edge Function Integration Contract (Owner: M3 / AI Engine)"
Cohesion: 0.33
Nodes (5): 3. Dedicated Receipt Extraction Endpoint: `extract-receipt`, 4. Groq API Implementation Details for M1, 5. End-to-End Sequence Flow, Endpoint, FLOVA — M1 Edge Function Integration Contract (Owner: M3 / AI Engine)

### Community 141 - "Implementation Tasks"
Cohesion: 0.33
Nodes (6): FinancialQueryType, Implementation Tasks, Task 0: Contracts Extension (`frontend/src/types/contracts.ts`), Task 1: Supabase Edge Function (`backend/supabase/functions/process-voice/index.ts`), Task 2: Frontend Voice Service & Audio Capture Hook, Task 4: Automated Test Suite (`frontend/src/services/__tests__/voiceIntent.test.ts`)

### Community 142 - "confirmCandidateTransaction"
Cohesion: 0.60
Nodes (5): confirmCandidateTransaction(), assertStrictEqual(), assertTrue(), it(), runTests()

### Community 143 - "getSession"
Cohesion: 0.80
Nodes (4): SignupPage(), handleSubmit(), getSession(), signUp()

### Community 144 - "multilingualVoice.test.ts"
Cohesion: 0.70
Nodes (4): assertStrictEqual(), assertTrue(), it(), runTests()

### Community 145 - "receiptExtraction.test.ts"
Cohesion: 0.70
Nodes (4): assertStrictEqual(), assertTrue(), it(), runTests()

### Community 146 - "Phase 9 User Acceptance Testing (UAT) Report: Voice Transcription & Intent Integration"
Cohesion: 0.40
Nodes (4): Phase 9 User Acceptance Testing (UAT) Report: Voice Transcription & Intent Integration, Scope of Verification, Test Results Summary, Verdict

### Community 147 - "Phase 9 Verification Report: Secure Voice Transcription & Intent Integration"
Cohesion: 0.40
Nodes (4): Automated Test Log (`voiceIntent.test.ts`), Execution Context, Phase 9 Verification Report: Secure Voice Transcription & Intent Integration, Verification Verdict

### Community 149 - "Plan 06-01: Realistic Demo Data Seeding & Isolation"
Cohesion: 0.50
Nodes (3): Objectives, Plan 06-01: Realistic Demo Data Seeding & Isolation, Tasks

### Community 150 - "Phase 9.1 Context: Multilingual Voice Support & Language-Specific Financial Extraction"
Cohesion: 0.50
Nodes (3): Core Requirements & Boundaries, Goal, Phase 9.1 Context: Multilingual Voice Support & Language-Specific Financial Extraction

### Community 151 - "Plan 10-01 Summary: Financial Activity, Money Overview & Deterministic Insights"
Cohesion: 0.50
Nodes (3): Key Metrics, Overview, Plan 10-01 Summary: Financial Activity, Money Overview & Deterministic Insights

### Community 152 - "Phase 10 Verification Report"
Cohesion: 0.50
Nodes (3): Phase 10 Verification Report, Test Summary Across Codebase, Verification Checklist

## Knowledge Gaps
- **16 isolated node(s):** `udaan-engine`, `@supabase/supabase-js`, `PGPASSWORD`, `PGHOST`, `PGPORT` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 776 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `useMonthSummary.ts`, `frontend/package.json`, `toPaise`, `getSession`, `kit.tsx`, `Card`, `Icons.tsx`, `PhonePeLandingPage.tsx`, `icons.tsx`, `useSession`, `useWish.ts`, `VoiceScreen.tsx`, `OneRupeeCoin`, `data.ts`, `HomeScreen.tsx`, `api.ts`, `useAudioRecorder.ts`, `useSession`, `useVoiceRecorder.ts`, `useSpeechToText.ts`, `RiderView`, `AddScreen.tsx`, `auth.ts`, `PhonePeAppstoreHalo.tsx`, `App.tsx`, `ProfileProvider.tsx`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `toPaise()` (e.g. with `Architectural Rules` and `Rules everyone follows`) actually correct?**
  _`toPaise()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `udaan-engine`, `@supabase/supabase-js`, `PGPASSWORD` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `VERDICT — pick-f1-irregular-income` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Why does `main()` connect `main` to `__init__.py`, `FLOVA data contract (v1 · owner: M1)`, `useSession`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `todayLocalISO()` (e.g. with `Key Accomplishments` and `Decisions`) actually correct?**
  _`todayLocalISO()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `contracts.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._