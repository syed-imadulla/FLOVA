# Graph Report - FLOVA  (2026-11-21)

## Corpus Check
- 287 files · ~185,260 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 5, (none) 3, .example 3)

## Summary
- 1726 nodes · 4129 edges · 116 communities (89 shown, 27 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 311 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `624bd49a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- test_engine.py
- ravi.test.ts
- VERDICT — pick-f1-irregular-income
- contracts.ts
- frontend/package.json
- paiseToRupeeString
- FLOVA data contract (v1 · owner: M1)
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
- validation.ts
- Project State
- Tests
- icons.tsx
- confirmCandidateTransaction
- Technology Stack
- Testing Patterns
- process-voice/index.ts
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
- FinancialExtractionDTO
- test-db.mjs
- CDPClient
- Plan 08-01: Secure FLOVA Catch (Receipt Extraction)
- PhonePeLandingPage.tsx
- scripts
- signOut
- test-payout-sync.mjs
- engine/index.ts
- validateExtractionOutput
- dates.test.ts
- Key Architectural & Design Decisions
- useSession
- integrationVoiceCatchWish.test.ts
- useWish.ts
- Key Architectural & Design Decisions
- coreFinancialCorrectness.test.ts
- OneRupeeCoin
- data.ts
- addTransaction
- 1. Locked Decisions & Core Architecture
- 2. Band-by-Band Cadence in Video 2
- v1 Requirements
- Tasks
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
- Plan 10-01: Financial Activity, Money Overview & Deterministic Insights
- activityAndOverview.test.ts
- Phase 5: Payout Synchronization Hardening & Idempotency Verification Report
- Phase 8 Plan 01 Summary: Secure FLOVA Catch (Receipt Extraction)
- PhonePeAppstoreHalo.tsx
- FLOVA — Handoff & Full Context (2026-11-21)
- candidateAdapter.ts
- Implementation Tasks
- Implementation Decisions
- ProfileProvider.tsx
- useMonthSummary.ts
- Phase 1: Core Financial Correctness, Navigation and Account Management Verification Report

## God Nodes (most connected - your core abstractions)
1. `react` - 84 edges
2. `toPaise()` - 40 edges
3. `Notice()` - 40 edges
4. `useSession()` - 36 edges
5. `todayLocalISO()` - 35 edges
6. `Card()` - 34 edges
7. `FinancialExtractionDTO` - 33 edges
8. `formatINR()` - 33 edges
9. `react-router-dom` - 30 edges
10. `Button()` - 30 edges

## Surprising Connections (you probably didn't know these)
- `Tasks` --references--> `AppLayout()`  [INFERRED]
  .planning/phases/10.2-app-ui-shell/10.2-01-PLAN.md → frontend/src/app/AppLayout.tsx
- `3. Canonical Data Contracts: FinancialExtractionDTO & VoiceTransactionCandidate` --references--> `FinancialExtractionDTO`  [INFERRED]
  .planning/phases/09-voice-transcription/09-CONTEXT.md → frontend/src/engine/extractionTypes.ts
- `Team Coordination Roles` --references--> `FinancialExtractionDTO`  [INFERRED]
  .planning/phases/09-voice-transcription/09-CONTEXT.md → frontend/src/engine/extractionTypes.ts
- `Pattern Overview` --references--> `toPaise()`  [INFERRED]
  .planning/codebase/ARCHITECTURE.md → frontend/src/lib/money.ts
- `5. Next Steps` --references--> `useProfile()`  [INFERRED]
  .planning/phases/01-auth-flow/01-01-SUMMARY.md → frontend/src/profile/useProfile.ts

## Import Cycles
- None detected.

## Communities (116 total, 27 thin omitted)

### Community 0 - "test_engine.py"
Cohesion: 0.07
Nodes (35): test_backtest_shape(), test_buffer_never_negative_and_money_is_conserved(), test_estimate_ignores_one_big_week(), test_estimate_with_little_history_is_cautious(), test_generate_year_is_reproducible(), test_lean_week_is_covered_by_buffer(), test_low_income_is_not_called_a_timing_problem(), test_negative_income_week_handled() (+27 more)

### Community 1 - "ravi.test.ts"
Cohesion: 0.14
Nodes (11): processRunwayFeed(), fridayEntry, mondayEntry, raviInput, result, saturdayEntry, Key Accomplishments, Phase 4: Runway Feed Summary (+3 more)

### Community 2 - "VERDICT — pick-f1-irregular-income"
Cohesion: 0.05
Nodes (40): An alternative approach (same problem, same user), Contradictions between jurors, If I were your team…, Next experiment (30 min), Ranked improvements, Ratings /10, VERDICT — pick-f1-irregular-income, Votes (+32 more)

### Community 3 - "contracts.ts"
Cohesion: 0.11
Nodes (24): assertStrictEqual(), assertTrue(), it(), runTests(), APP_LANGUAGES, AppLanguage, COMMITMENT_KINDS, COMMITMENT_STATUSES (+16 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.06
Nodes (33): dependencies, react, react-dom, react-router-dom, @supabase/supabase-js, devDependencies, autoprefixer, postcss (+25 more)

### Community 5 - "paiseToRupeeString"
Cohesion: 0.10
Nodes (18): paiseToRupeeString(), RupeeString, Architectural Constraints, Architecture, Component Responsibilities, Data Flow, Entry Points, Error Handling (+10 more)

### Community 6 - "FLOVA data contract (v1 · owner: M1)"
Cohesion: 0.18
Nodes (11): `balance_checkins` (actual cash + bank at a moment), `commitments` (bills and debts), FLOVA data contract (v1 · owner: M1), Frontend data hooks (`frontend/src/data/`), How to record each money situation, `payouts` (money expected, **not cash until received**), `profiles` (one per user, created automatically at sign-up), Rules everyone follows (+3 more)

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

### Community 36 - "validation.ts"
Cohesion: 0.18
Nodes (28): calculateConfirmedBalance(), addDays(), calculateDailyRunway(), RunwayProjectionInput, baseProfile, baseProfile, assertMatch(), assertStrictEqual() (+20 more)

### Community 37 - "Project State"
Cohesion: 0.29
Nodes (6): Current Position, Integration Milestone (2026-11-21), Performance Metrics, Phase 10.2: Application UI Shell & Live AI (2026-11-21), Project Reference, Project State

### Community 38 - "Tests"
Cohesion: 0.13
Nodes (14): 1. Logged out redirect to /login (B1), 2. Sign up with new email and display name (B2), 3. Session persistence on refresh (B3), 4. Logout and route protection (B4), 5. Login error handling (B5), 6. Redirect authenticated user away from /login (B6), 7. Client-side password length validation (B7), A. Live RLS Test (+6 more)

### Community 39 - "icons.tsx"
Cohesion: 0.05
Nodes (158): ActivityRow(), App(), AppLayout(), MORE_PATHS, Tab(), categoryLabel(), paiseToInput(), rupeeStringToInput() (+150 more)

### Community 40 - "confirmCandidateTransaction"
Cohesion: 0.23
Nodes (13): confirmCandidateTransaction(), assertStrictEqual(), assertTrue(), it(), runTests(), assertStrictEqual(), assertTrue(), it() (+5 more)

### Community 41 - "Technology Stack"
Cohesion: 0.25
Nodes (7): Configuration, Frameworks, Key Dependencies, Languages, Platform Requirements, Runtime, Technology Stack

### Community 42 - "Testing Patterns"
Cohesion: 0.29
Nodes (6): Mocking & Isolation, Required Pre-Shipping Checks, Test File Organization, Test Framework, Test Structure, Testing Patterns

### Community 43 - "process-voice/index.ts"
Cohesion: 0.14
Nodes (15): corsHeaders, ExtractReceiptRequest, GROQ_PIN, GROQ_PREFS, groqCandidates(), groqListModels(), groqModelUnavailable(), groqWithModelFallback() (+7 more)

### Community 44 - "External Integrations"
Cohesion: 0.29
Nodes (3): __dirname, __filename, mockSupabasePath

### Community 45 - "Tests"
Cohesion: 0.12
Nodes (15): 1. Currency parser unit tests, 1. New user signup routing, 2. Blank ₹ fields submission, 2. M3 Engine tests regression suite, 3. Database test suite, 3. Session refresh persistence, 4. Edit profile updates immediately, 5. Client-side validation (+7 more)

### Community 48 - "browser-audit.mjs"
Cohesion: 0.13
Nodes (11): activitySrc, aliases, chrome, client, __dirname, distDir, mimeTypes, moreSrc (+3 more)

### Community 49 - "Phase 4: Runway Feed Verification Report"
Cohesion: 0.33
Nodes (5): Goal Achievement, Investigation Findings: Previous Aggregate Test Command Failures, M1 Data Layer & M3 Engine Integration Audit, Observable Truths, Phase 4: Runway Feed Verification Report

### Community 50 - "backend/package.json"
Cohesion: 0.20
Nodes (9): description, devDependencies, @electric-sql/pglite, @supabase/supabase-js, @supabase/supabase-js, name, private, type (+1 more)

### Community 52 - "Icons.tsx"
Cohesion: 0.05
Nodes (77): api, BacktestRow, FALLBACK_PROFILES, OutlookWeek, Plan, Profile, Rider, rs() (+69 more)

### Community 54 - "FLOVA (Udaan 2.0)"
Cohesion: 0.25
Nodes (7): 1. Database Regression Suite (PGlite), 2. Multi-Connection PostgreSQL Concurrency & Deadlock Suite, 3. Frontend Compilation & Idempotent Retry UX Suite, Current Test, Gaps, Summary, Tests

### Community 55 - "Goal Achievement"
Cohesion: 0.50
Nodes (3): Goal Achievement, Observable Truths, Phase 3: Data Capture Hooks Verification Report

### Community 56 - "v1 Requirements"
Cohesion: 0.29
Nodes (6): PGDATABASE, PGHOST, PGPASSWORD, PGPORT, PGUSER, test-concurrency-postgres.sh script

### Community 57 - "FinancialExtractionDTO"
Cohesion: 0.22
Nodes (17): ExtractedQueryData, ProcessedRunway, assertStrictEqual(), assertTrue(), it(), runTests(), assertStrictEqual(), assertTrue() (+9 more)

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
Cohesion: 0.06
Nodes (37): client(), login(), AuthContext, AuthContextValue, LoginPage(), handleSubmit(), SignupPage(), handleSubmit() (+29 more)

### Community 64 - "test-payout-sync.mjs"
Cohesion: 0.50
Nodes (3): assert(), runTestSuite(), @electric-sql/pglite

### Community 65 - "engine/index.ts"
Cohesion: 0.09
Nodes (34): 1. Overview & Architectural Boundaries, Architectural Rules, ConfirmedBalanceResult, ConfirmedBalanceStatus, 1. Overview & Architectural Boundaries, Architectural Rules, adaptExtractedCheckin(), adaptExtractedPayout() (+26 more)

### Community 66 - "validateExtractionOutput"
Cohesion: 0.09
Nodes (21): 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (Draft 2020-12 Compatible), 5. Concrete Extraction Examples, 6. M1 Backend & Edge Function Integration, Example 1: Multi-Transaction Sentence (Income + Expense), Example 2: Today's Spending Voice Query, Example 3: Pending Payments Voice Query (+13 more)

### Community 67 - "dates.test.ts"
Cohesion: 0.40
Nodes (4): d1, d2, iso1, iso2

### Community 68 - "Key Architectural & Design Decisions"
Cohesion: 0.17
Nodes (11): 1. Security Boundary & Server-Side Credentials, 2. Dual-Stage Groq AI Pipeline (Whisper + Llama 3.3), 3. Canonical Data Contracts: FinancialExtractionDTO & VoiceTransactionCandidate, 4. Truthful Uncertainty & Anti-Hallucination, 5. Mandatory User Confirmation & Read-Only Inference, 6. Fallback Input, Context, Key Architectural & Design Decisions (+3 more)

### Community 69 - "useSession"
Cohesion: 0.13
Nodes (18): RedirectIfAuthed(), useSession(), DataVersionProvider(), useLatestCheckin(), usePayouts(), useTransactions(), remove(), save() (+10 more)

### Community 70 - "integrationVoiceCatchWish.test.ts"
Cohesion: 0.15
Nodes (19): publishableKey, supabase, url, listTransactions(), extractReceipt(), ExtractReceiptInput, ExtractReceiptResult, fileToBase64() (+11 more)

### Community 71 - "useWish.ts"
Cohesion: 0.15
Nodes (24): calculateWish(), ContributionCadence, CreateWishInput, formatDateISO(), formatMonthYear(), Wish, WishCalculation, WishStatus (+16 more)

### Community 73 - "Key Architectural & Design Decisions"
Cohesion: 0.18
Nodes (10): 1. Security Boundary & API Key Protection, 2. AI Provider: Groq (Verified Model Identifiers), 3. Truthful Uncertainty & Contract Alignment, 4. Mandatory User Confirmation, 5. Input Modes: Dual Image & Pasted-Text, 6. Idempotency & Retries, Context, Key Architectural & Design Decisions (+2 more)

### Community 74 - "coreFinancialCorrectness.test.ts"
Cohesion: 0.05
Nodes (48): ProcessVoiceRequest, categoriesFor(), CategoryOption, EXPENSE_CATEGORIES, INCOME_CATEGORIES, PROFILE_INCOME_PRIORITY, DAILY_AGGREGATE_LIMIT_ERROR_MESSAGE, DAILY_ESTIMATE_LIMIT_ERROR_MESSAGE (+40 more)

### Community 75 - "OneRupeeCoin"
Cohesion: 0.26
Nodes (8): HeroSection(), HeroSectionProps, LandingSections(), LandingSectionsProps, OneRupeeCoin(), OneRupeeCoinProps, MorphBridgeProps, OneRupeeMorphBridge()

### Community 76 - "data.ts"
Cohesion: 0.23
Nodes (18): useCommitments(), unwrap(), addCheckin(), addCommitment(), addPayout(), listCommitments(), money(), setCommitmentStatus() (+10 more)

### Community 77 - "addTransaction"
Cohesion: 0.12
Nodes (21): addTransaction(), receivePayout(), assertStrictEqual(), assertTrue(), it(), runTests(), NewTransaction, Task 1: Client-Side Idempotency (+13 more)

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

### Community 87 - "MockQueryBuilder"
Cohesion: 0.18
Nodes (3): MockQueryBuilder, Phase 7 UAT: Financial Data Contracts & Timeline Helpers, User Acceptance Criteria & Results

### Community 88 - "FLOVA Hero Section Blueprint: Video 1 Deep Analysis"
Cohesion: 0.20
Nodes (9): 1. Canvas, Background Surface & Spatial Framing, 2. Top Navigation Bar (Fixed / Sticky Editorial Header), 3. Centered Typography Lockup & Easing Choreography, 4. Central Focal Visual (Centerpiece), 5. Hand-Drawn Sketch Annotations, Medallion & Secondary Visuals, 6. Reveal on Scroll (Sub-Hero Section at `t = 12s–17.8s`), 7. Motion Choreography & Parallax Execution Plan, 8. Readiness Checklist for Video 2 & Master Build (+1 more)

### Community 89 - "candidateAdapter.ts"
Cohesion: 0.21
Nodes (20): 1. Overview & Ownership Boundaries, candidateToNewTransaction(), confirmCandidateTransaction(), deriveDeterministicUUID(), fnv1a32(), generateUUID(), getTransactionsFromDto(), isValidUUID() (+12 more)

### Community 90 - "Roadmap: FLOVA (12-Phase Hackathon Roadmap)"
Cohesion: 0.33
Nodes (5): Overview, Phase 13: Core Financial Correctness, Navigation and Account Management, Phases, Progress, Roadmap: FLOVA (12-Phase Hackathon Roadmap)

### Community 91 - "Phase 9.1 User Acceptance Testing (UAT)"
Cohesion: 0.25
Nodes (7): Phase 9.1 User Acceptance Testing (UAT), Scenario 1: Language Pinned Transcription (Kannada), Scenario 2: Hindi Living Expense Extraction, Scenario 3: Truthful Uncertainty / Missing Amount (Kannada), Scenario 4: Platform Expected Payout Isolation (Telugu), Scenario 5: Balance Check-in Segregation (Urdu), Scenario 6: Multilingual Deterministic Financial Queries

### Community 92 - "FinancialExtractionDTO"
Cohesion: 0.05
Nodes (37): 2. Canonical Edge Function Endpoint Specification: `process-voice`, 3. Dedicated Receipt Extraction Endpoint: `extract-receipt`, 4. Groq API Implementation Details for M1, 5. End-to-End Sequence Flow, Endpoint, Endpoint, FLOVA — M1 Edge Function Integration Contract (Owner: M3 / AI Engine), Mode 1: Audio Input (Microphone Recording) (+29 more)

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
Cohesion: 0.14
Nodes (19): Service functions (`frontend/src/services/`), AuthProvider(), getLatestCheckin(), getMyProfile(), listPayouts(), loadRunwayInput(), Primary Runway Feed Path, Codebase Concerns (+11 more)

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
Cohesion: 0.08
Nodes (26): listActivityTimeline(), ActivityItemKind, 1. Extend Contracts & Timeline Service, 2. Implement Deterministic Financial Insights Engine, 3. Build Financial Activity Screen (`/activity`), 4. Build Money Overview Screen (`/overview`), 6. Automated Verification & Regression Testing, Tasks (+18 more)

### Community 111 - "Plan 10-01: Financial Activity, Money Overview & Deterministic Insights"
Cohesion: 0.33
Nodes (5): Objective, Owner: M1 (Backend/Contracts) & M2/M3 (Frontend & Insights Engine), Phase: 10, Plan: 01, Plan 10-01: Financial Activity, Money Overview & Deterministic Insights

### Community 112 - "activityAndOverview.test.ts"
Cohesion: 0.14
Nodes (15): FinancialInsight, generateFinancialInsights(), GenerateInsightsOptions, InsightSeverity, assertStrictEqual(), assertTrue(), it(), runTests() (+7 more)

### Community 115 - "Phase 5: Payout Synchronization Hardening & Idempotency Verification Report"
Cohesion: 0.40
Nodes (4): Goal Achievement, Observable Truths, Phase 5: Payout Synchronization Hardening & Idempotency Verification Report, Technical Audit & Safety Bounds

### Community 121 - "FLOVA — Handoff & Full Context (2026-11-21)"
Cohesion: 0.04
Nodes (42): main(), Branches, Definition of done for any pull request, Every working session, Graphify: required for everyone, One-time setup (each member, each laptop), Who owns what, Working on FLOVA (team rules for the 24-hour build) (+34 more)

### Community 122 - "candidateAdapter.ts"
Cohesion: 0.22
Nodes (17): TxDraft, TxSubmit, ConfirmedBalanceBreakdown, ExtractedReceiptCandidate, VoiceTransactionCandidate, ProposedEvidenceType, ProposedPaymentMethod, ProposedVerificationStatus (+9 more)

### Community 125 - "Implementation Tasks"
Cohesion: 0.25
Nodes (7): Implementation Tasks, Objective, Plan 13-01: Core Financial Correctness, Navigation and Account Management, Task 1: Fix Voice Transaction Amount Duplication, Task 2: Add Income Categories & Profile Adaptation, Task 3: Fix Navigation and Redirects, Verification Plan

### Community 126 - "Implementation Decisions"
Cohesion: 0.29
Nodes (6): 2. Income Categories, 3. Navigation and Redirects, 5. Application Daily Limit (₹10 Lakh), Implementation Decisions, Phase 13 Context: Core Financial Correctness, Navigation and Account Management, Purpose & Scope

### Community 127 - "ProfileProvider.tsx"
Cohesion: 0.18
Nodes (10): ProfileContext, ProfileContextType, ProfileProvider(), Profile, ProfileUpdate, Key Accomplishments, Phase 2: Profile & Onboarding Data Summary, Goal Achievement (+2 more)

### Community 129 - "useMonthSummary.ts"
Cohesion: 0.48
Nodes (6): DayTotals, monthRange(), MonthSummary, pad(), shiftMonth(), summarise()

### Community 136 - "Phase 1: Core Financial Correctness, Navigation and Account Management Verification Report"
Cohesion: 0.50
Nodes (3): Financial Integrity Audit, Phase 1: Core Financial Correctness, Navigation and Account Management Verification Report, Test Execution Summary

## Knowledge Gaps
- **16 isolated node(s):** `udaan-engine`, `@supabase/supabase-js`, `PGPASSWORD`, `PGHOST`, `PGPORT` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 749 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `useAudioRecorder.ts`, `useMonthSummary.ts`, `frontend/package.json`, `useSession`, `icons.tsx`, `useWish.ts`, `OneRupeeCoin`, `data.ts`, `useSpeechToText.ts`, `useVoiceRecorder.ts`, `Icons.tsx`, `PhonePeAppstoreHalo.tsx`, `ProfileProvider.tsx`, `PhonePeLandingPage.tsx`, `signOut`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `toPaise()` (e.g. with `Architectural Rules` and `Rules everyone follows`) actually correct?**
  _`toPaise()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `udaan-engine`, `@supabase/supabase-js`, `PGPASSWORD` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `test_engine.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06749482401656315 - nodes in this community are weakly interconnected._
- **Why does `main()` connect `FLOVA — Handoff & Full Context (2026-11-21)` to `test_engine.py`, `loadRunwayInput`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `useSession()` (e.g. with `Layers` and `Primary Runway Feed Path`) actually correct?**
  _`useSession()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Should `ravi.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._