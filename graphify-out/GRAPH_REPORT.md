# Graph Report - FLOVA  (2026-11-21)

## Corpus Check
- 267 files · ~182,488 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .css 5, .example 3, (none) 2)

## Summary
- 1525 nodes · 3281 edges · 118 communities (89 shown, 29 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 280 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fb249ef6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- test_engine.py
- contracts.ts
- VERDICT — pick-f1-irregular-income
- api.ts
- frontend/package.json
- Architecture
- FLOVA
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
- auth.ts
- Technology Stack
- Testing Patterns
- toPaise
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
- todayLocalISO
- FLOVA (Udaan 2.0)
- v1 Requirements
- Plan 08-01: Secure FLOVA Catch (Receipt Extraction)
- react
- ProfileSettingsView.tsx
- onAuthChange
- FinancialExtractionDTO
- engine/index.ts
- parseRequiredRupees
- FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)
- Key Architectural & Design Decisions
- RiderView
- integrationVoiceCatchWish.test.ts
- WishPage.tsx
- External Integrations
- Key Architectural & Design Decisions
- extractTransaction.ts
- WorkProfile
- FLOVA data contract (v1 · owner: M1)
- addTransaction
- Locked Architectural Decisions (From Discussion)
- Voice Capture Integration
- voice.ts
- 2. Band-by-Band Cadence in Video 2
- generalisedProfiles.test.ts
- RequireAuth
- Phase 1: Auth Flow Summary
- Phase 10 Verification Report
- parseRupees.test.ts
- MockQueryBuilder
- FLOVA Hero Section Blueprint: Video 1 Deep Analysis
- candidateAdapter.ts
- Roadmap: FLOVA (12-Phase Hackathon Roadmap)
- Phase 9.1 User Acceptance Testing (UAT)
- main
- Phase 7 Verification Report: Financial Data Contracts
- Phase 8 Verification Report: Secure FLOVA Catch
- Phase 10 User Acceptance Testing (UAT)
- Working on FLOVA (team rules for the 24-hour build)
- Phase 6 Verification Report: Realistic Demo Data
- Phase 6: Support Realistic Demo Data - Context & Invariants
- Phase 9.1 Verification Report
- AuthProvider
- Goal Achievement
- Coding Conventions
- Goal Achievement
- sw.js
- ravi.test.ts
- confirmCandidateTransaction
- activityAndOverview.test.ts
- Onboarding Summary
- Plan 10-01: Financial Activity, Money Overview & Deterministic Insights
- signIn
- Phase 7 Plan 01 Summary: Financial Data Contracts & Timeline Helpers
- Plan 10-01 Summary: Financial Activity, Money Overview & Deterministic Insights
- Objectives
- Plan 07-01: Financial Data Contracts & Timeline Helpers
- Phase 8 Plan 01 Summary: Secure FLOVA Catch (Receipt Extraction)

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
- `3. Canonical Data Contracts: FinancialExtractionDTO & VoiceTransactionCandidate` --references--> `FinancialExtractionDTO`  [INFERRED]
  .planning/phases/09-voice-transcription/09-CONTEXT.md → frontend/src/engine/extractionTypes.ts
- `Team Coordination Roles` --references--> `FinancialExtractionDTO`  [INFERRED]
  .planning/phases/09-voice-transcription/09-CONTEXT.md → frontend/src/engine/extractionTypes.ts
- `Pattern Overview` --references--> `toPaise()`  [INFERRED]
  .planning/codebase/ARCHITECTURE.md → frontend/src/lib/money.ts

## Import Cycles
- None detected.

## Communities (118 total, 29 thin omitted)

### Community 0 - "test_engine.py"
Cohesion: 0.07
Nodes (35): test_backtest_shape(), test_buffer_never_negative_and_money_is_conserved(), test_estimate_ignores_one_big_week(), test_estimate_with_little_history_is_cautious(), test_generate_year_is_reproducible(), test_lean_week_is_covered_by_buffer(), test_low_income_is_not_called_a_timing_problem(), test_negative_income_week_handled() (+27 more)

### Community 1 - "contracts.ts"
Cohesion: 0.11
Nodes (28): ExtractedReceiptCandidate, VoiceTransactionCandidate, ProposedEvidenceType, ProposedPaymentMethod, ProposedVerificationStatus, GenerateInsightsOptions, DailyProjectionEntry, RunwayProjectionResult (+20 more)

### Community 2 - "VERDICT — pick-f1-irregular-income"
Cohesion: 0.05
Nodes (40): An alternative approach (same problem, same user), Contradictions between jurors, If I were your team…, Next experiment (30 min), Ranked improvements, Ratings /10, VERDICT — pick-f1-irregular-income, Votes (+32 more)

### Community 3 - "api.ts"
Cohesion: 0.16
Nodes (15): api, BacktestRow, FALLBACK_PROFILES, OutlookWeek, Plan, Profile, Rider, Status (+7 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.06
Nodes (33): dependencies, react, react-dom, react-router-dom, @supabase/supabase-js, devDependencies, autoprefixer, postcss (+25 more)

### Community 5 - "Architecture"
Cohesion: 0.22
Nodes (8): Architectural Constraints, Architecture, Component Responsibilities, Data Flow, Entry Points, Error Handling, Pattern Overview, System Overview

### Community 6 - "FLOVA"
Cohesion: 0.22
Nodes (6): Evidence (backtest, 50 simulated years per rider type), FLOVA, Layout, Run it, Tech and credits, What it does

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
Cohesion: 0.19
Nodes (19): useSession(), AppShell(), handleSignOut(), AppShellProps, useTransactions(), HomePlaceholder(), handleLogout(), HomeRunwayView() (+11 more)

### Community 35 - "FLOVA Financial Engine (M3)"
Cohesion: 0.20
Nodes (9): Architectural Principles, Calculation Semantics (Option A), FLOVA Financial Engine (M3), Historical Ravi Fixture Preservation, Key Rules:, Option A: Remaining Daily Budget Logic, Problem Addressed, Results: (+1 more)

### Community 36 - "testUtils.ts"
Cohesion: 0.19
Nodes (16): d1, d2, iso1, iso2, RunwayProjectionInput, baseProfile, baseProfile, assertMatch() (+8 more)

### Community 37 - "Project State"
Cohesion: 0.40
Nodes (4): Current Position, Performance Metrics, Project Reference, Project State

### Community 38 - "Tests"
Cohesion: 0.13
Nodes (14): 1. Logged out redirect to /login (B1), 2. Sign up with new email and display name (B2), 3. Session persistence on refresh (B3), 4. Logout and route protection (B4), 5. Login error handling (B5), 6. Redirect authenticated user away from /login (B6), 7. Client-side password length validation (B7), A. Live RLS Test (+6 more)

### Community 39 - "RunwayInput"
Cohesion: 0.16
Nodes (26): calculateConfirmedBalance(), ConfirmedBalanceBreakdown, ConfirmedBalanceResult, ConfirmedBalanceStatus, validateExtractionOutput(), addDays(), calculateDailyRunway(), RunwayProjectionStatus (+18 more)

### Community 40 - "auth.ts"
Cohesion: 0.24
Nodes (8): client(), login(), AuthContext, AuthContextValue, SignupPage(), handleSubmit(), getSession(), signUp()

### Community 41 - "Technology Stack"
Cohesion: 0.25
Nodes (7): Configuration, Frameworks, Key Dependencies, Languages, Platform Requirements, Runtime, Technology Stack

### Community 42 - "Testing Patterns"
Cohesion: 0.29
Nodes (6): Mocking & Isolation, Required Pre-Shipping Checks, Test File Organization, Test Framework, Test Structure, Testing Patterns

### Community 43 - "toPaise"
Cohesion: 0.10
Nodes (28): Rules everyone follows, Service functions (`frontend/src/services/`), paiseToRupeeString(), toPaise(), toPaiseOrNull(), FlovaCatchPage(), handleConfirm(), handleExtract() (+20 more)

### Community 44 - "External Integrations"
Cohesion: 0.29
Nodes (3): __dirname, __filename, mockSupabasePath

### Community 45 - "Tests"
Cohesion: 0.12
Nodes (15): 1. Currency parser unit tests, 1. New user signup routing, 2. Blank ₹ fields submission, 2. M3 Engine tests regression suite, 3. Database test suite, 3. Session refresh persistence, 4. Edit profile updates immediately, 5. Client-side validation (+7 more)

### Community 48 - "mockSupabase.ts"
Cohesion: 0.29
Nodes (10): assertStrictEqual(), assertTrue(), it(), runTests(), mockState, supabase, BalanceCheckin, Payout (+2 more)

### Community 49 - "Phase 4: Runway Feed Verification Report"
Cohesion: 0.33
Nodes (5): Goal Achievement, Investigation Findings: Previous Aggregate Test Command Failures, M1 Data Layer & M3 Engine Integration Audit, Observable Truths, Phase 4: Runway Feed Verification Report

### Community 50 - "data.ts"
Cohesion: 0.19
Nodes (22): DataVersionContext, DataVersionContextType, useDataVersion(), useCommitments(), usePayouts(), unwrap(), addCheckin(), addCommitment() (+14 more)

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

### Community 57 - "todayLocalISO"
Cohesion: 0.13
Nodes (24): todayLocalISO(), FinancialInsight, generateFinancialInsights(), InsightSeverity, formatINR(), ActivityPage(), loadData(), MoneyOverviewPage() (+16 more)

### Community 58 - "FLOVA (Udaan 2.0)"
Cohesion: 0.25
Nodes (7): Business & Problem Context, Core Value, FLOVA (Udaan 2.0), Key Decisions Log, Team Ownership & Boundaries, Technical Environment & Architecture, What This Is

### Community 59 - "v1 Requirements"
Cohesion: 0.18
Nodes (10): Out of Scope, Phase 1: Authentication Flow, Phase 2: Profile & Onboarding Data, Phase 4: Runway Feed & Engine Integration, Phase 5: Secure AI Function (Stretch), Phase 6: Demo Data Seed & Test Fixtures, Phase 7: Deployment & Production Smoke Test, Requirements: FLOVA (M1 Backend & Database) (+2 more)

### Community 60 - "Plan 08-01: Secure FLOVA Catch (Receipt Extraction)"
Cohesion: 0.20
Nodes (9): Edge Function Contract (`extract-receipt`), Implementation Tasks, Objectives, Plan 08-01: Secure FLOVA Catch (Receipt Extraction), Security Boundaries & Rules, Task 0: Supabase Edge Function (`backend/supabase/functions/extract-receipt/index.ts`), Task 1: Frontend Receipt Service (`frontend/src/services/receipt.ts`), Task 3: Automated Test Suite (`frontend/src/services/__tests__/receiptExtraction.test.ts`) (+1 more)

### Community 61 - "react"
Cohesion: 0.06
Nodes (39): HeroSection(), HeroSectionProps, FlovaBottomCTA(), FlovaClarityShowcase(), FlovaFooter(), FlovaHero(), FlovaHowItWorks(), FlovaIndiaContext() (+31 more)

### Community 62 - "ProfileSettingsView.tsx"
Cohesion: 0.18
Nodes (12): INCOME_VARIABILITY_OPTIONS, WORK_PROFILE_OPTIONS, WORK_ICONS, ParseRequiredRupeesResult, ParseRupeesResult, ProfileContext, ProfileContextType, AppLanguage (+4 more)

### Community 63 - "onAuthChange"
Cohesion: 0.13
Nodes (15): onAuthChange(), APIs & External Services, 1. Routing & Dependencies, 2. Auth Context & Session Management, 3. Pages & UI Presentation, 4. Authentication Workflows & Form Behavior, 6. Backend Hygiene & Explicit Permissions, Canonical References (+7 more)

### Community 64 - "FinancialExtractionDTO"
Cohesion: 0.05
Nodes (36): 2. Canonical Edge Function Endpoint Specification: `process-voice`, 3. Dedicated Receipt Extraction Endpoint: `extract-receipt`, 4. Groq API Implementation Details for M1, 5. End-to-End Sequence Flow, Endpoint, Endpoint, FLOVA — M1 Edge Function Integration Contract (Owner: M3 / AI Engine), Mode 1: Audio Input (Microphone Recording) (+28 more)

### Community 65 - "engine/index.ts"
Cohesion: 0.14
Nodes (24): adaptExtractedCheckin(), adaptExtractedPayout(), adaptExtractedTransactions(), CategoryMappingResult, CheckinAdaptationResult, CorrectionResolutionResult, mapCanonicalCategory(), resolveCorrectionIntent() (+16 more)

### Community 66 - "parseRequiredRupees"
Cohesion: 0.10
Nodes (30): Frontend data hooks (`frontend/src/data/`), App(), RedirectIfAuthed(), DataVersionProvider(), useLatestCheckin(), AddTransactionPage(), handleSubmit(), CheckinPage() (+22 more)

### Community 67 - "FLOVA AI Extraction Contract Specification (v1.2 · Owner: M3)"
Cohesion: 0.15
Nodes (12): 1. Overview & Architectural Boundaries, 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (Draft 2020-12 Compatible), 5. Concrete Extraction Examples, 6. M1 Backend & Edge Function Integration, Architectural Rules, Example 1: Multi-Transaction Sentence (Income + Expense) (+4 more)

### Community 68 - "Key Architectural & Design Decisions"
Cohesion: 0.17
Nodes (11): 1. Security Boundary & Server-Side Credentials, 2. Dual-Stage Groq AI Pipeline (Whisper + Llama 3.3), 3. Canonical Data Contracts: FinancialExtractionDTO & VoiceTransactionCandidate, 4. Truthful Uncertainty & Anti-Hallucination, 5. Mandatory User Confirmation & Read-Only Inference, 6. Fallback Input, Context, Key Architectural & Design Decisions (+3 more)

### Community 69 - "RiderView"
Cohesion: 0.35
Nodes (11): rs(), EvidenceView(), IncomeChart(), RiderView(), logPayout(), run(), signUp(), SmsView() (+3 more)

### Community 70 - "integrationVoiceCatchWish.test.ts"
Cohesion: 0.19
Nodes (16): listTransactions(), extractReceipt(), ExtractReceiptInput, ExtractReceiptResult, fileToBase64(), assertStrictEqual(), assertTrue(), it() (+8 more)

### Community 71 - "WishPage.tsx"
Cohesion: 0.07
Nodes (41): 1. Overview & Architectural Boundaries, 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (Draft 2020-12 Compatible), 5. Concrete Extraction Examples, 6. M1 Backend & Edge Function Integration, Architectural Rules, Example 1: Multi-Transaction Sentence (Income + Expense) (+33 more)

### Community 72 - "External Integrations"
Cohesion: 0.25
Nodes (7): Authentication & Identity, CI/CD & Deployment, Data Storage, Environment Configuration, External Integrations, Monitoring & Observability, Webhooks & Callbacks

### Community 73 - "Key Architectural & Design Decisions"
Cohesion: 0.18
Nodes (10): 1. Security Boundary & API Key Protection, 2. AI Provider: Groq (Verified Model Identifiers), 3. Truthful Uncertainty & Contract Alignment, 4. Mandatory User Confirmation, 5. Input Modes: Dual Image & Pasted-Text, 6. Idempotency & Retries, Context, Key Architectural & Design Decisions (+2 more)

### Community 74 - "extractTransaction.ts"
Cohesion: 0.09
Nodes (24): corsHeaders, ExtractReceiptRequest, corsHeaders, ProcessVoiceRequest, VoiceProcessInput, CATEGORY_MAP, EXPENSE_KEYWORDS, extractAmount() (+16 more)

### Community 75 - "WorkProfile"
Cohesion: 0.22
Nodes (8): WorkProfileOption, WorkProfile, Codebase Structure, Directory Layout, Directory Purposes, Key File Locations, Naming Conventions, Where to Add New Code

### Community 76 - "FLOVA data contract (v1 · owner: M1)"
Cohesion: 0.22
Nodes (9): `balance_checkins` (actual cash + bank at a moment), `commitments` (bills and debts), FLOVA data contract (v1 · owner: M1), How to record each money situation, `payouts` (money expected, **not cash until received**), `profiles` (one per user, created automatically at sign-up), Rules for M3's runway engine (from the master plan), Tables (+1 more)

### Community 77 - "addTransaction"
Cohesion: 0.06
Nodes (39): addTransaction(), receivePayout(), assertStrictEqual(), assertTrue(), it(), runTests(), NewTransaction, Objectives (+31 more)

### Community 78 - "Locked Architectural Decisions (From Discussion)"
Cohesion: 0.29
Nodes (6): 1. Routing & Screen Anchoring, 2. Timeline Item Distinction & Expected Payouts, 3. Four Deterministic Financial Insights, 4. Financial Safety & Truthful Uncertainty, Locked Architectural Decisions (From Discussion), Phase 10 Context: Financial Activity, Money Overview & Insights

### Community 79 - "Voice Capture Integration"
Cohesion: 0.12
Nodes (15): AudioRecorderResult, detectSupportedMimeType(), RecorderStatus, SUPPORTED_MIME_CANDIDATES, useAudioRecorder(), RecorderState, useVoiceRecorder(), VoiceRecorderResult (+7 more)

### Community 80 - "voice.ts"
Cohesion: 0.19
Nodes (17): publishableKey, supabase, url, assertStrictEqual(), assertTrue(), it(), runTests(), assertStrictEqual() (+9 more)

### Community 81 - "2. Band-by-Band Cadence in Video 2"
Cohesion: 0.13
Nodes (14): 1. Hero-to-Followup 1-Rupee Indian Coin Morph Transition, 2. Band-by-Band Cadence in Video 2, 3. Currency & Data Rules Mapping (FLOVA Contract Compliance), 4. Master Build Roadmap (Step 3 Preview), Band 1: Dark Feature Showcase Card (`#111214` / `#141517`), Band 2: 4-Column Feature & Value Strip (Light Paper Surface), Band 3: Fine-Grid Testimonial & Real Worker Stories Band, Band 4: Vibrant Cyan/Aqua Callout Banner (`#25DCF5` / `#00D2F0`) (+6 more)

### Community 82 - "generalisedProfiles.test.ts"
Cohesion: 0.31
Nodes (8): assertStrictEqual(), assertTrue(), it(), runTests(), INCOME_VARIABILITIES, OCCUPATION_WORK_CATEGORIES, UNIVERSAL_LIVING_CATEGORIES, WORK_PROFILES

### Community 83 - "RequireAuth"
Cohesion: 0.43
Nodes (8): RequireAuth(), RequireOnboarded(), Task 2: FLOVA Catch UI (`frontend/src/pages/FlovaCatchPage.tsx` & Route), Key Implementation Details, Task 3: Voice UI Page (`frontend/src/pages/VoicePage.tsx` & Route), Key Implementation Details, 5. Wire App Routes & Launcher, Implemented Components

### Community 84 - "Phase 1: Auth Flow Summary"
Cohesion: 0.25
Nodes (7): 1. Executive Summary, 2. Key Deliverables & Changes, 3. Verification & Quality Gates, 5. Next Steps, Authentication & Routing Infrastructure, Database & Backend Hygiene, Phase 1: Auth Flow Summary

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
Cohesion: 0.21
Nodes (19): 1. Overview & Ownership Boundaries, candidateToNewTransaction(), confirmCandidateTransaction(), deriveDeterministicUUID(), fnv1a32(), generateUUID(), getTransactionsFromDto(), isValidUUID() (+11 more)

### Community 90 - "Roadmap: FLOVA (12-Phase Hackathon Roadmap)"
Cohesion: 0.25
Nodes (7): Overview, Phase 6: Demo data, Phase 8: Secure FLOVA Catch receipt extraction integration, Phase Details, Phases, Progress, Roadmap: FLOVA (12-Phase Hackathon Roadmap)

### Community 91 - "Phase 9.1 User Acceptance Testing (UAT)"
Cohesion: 0.25
Nodes (7): Phase 9.1 User Acceptance Testing (UAT), Scenario 1: Language Pinned Transcription (Kannada), Scenario 2: Hindi Living Expense Extraction, Scenario 3: Truthful Uncertainty / Missing Amount (Kannada), Scenario 4: Platform Expected Payout Isolation (Telugu), Scenario 5: Balance Check-in Segregation (Urdu), Scenario 6: Multilingual Deterministic Financial Queries

### Community 92 - "main"
Cohesion: 0.29
Nodes (7): main(), Workstream & Rules, Active (M1 Roadmap Scope), Constraints & Rules for Every Phase, Out of Scope, Requirements, Phase 8: Verify & Release Freeze

### Community 93 - "Phase 7 Verification Report: Financial Data Contracts"
Cohesion: 0.33
Nodes (5): Automated Test Log, Execution Context, Phase 7 Verification Report: Financial Data Contracts, Production Build Log, Verification Verdict

### Community 94 - "Phase 8 Verification Report: Secure FLOVA Catch"
Cohesion: 0.33
Nodes (5): Automated Test Log (`receiptExtraction.test.ts`), Execution Context, Phase 8 Verification Report: Secure FLOVA Catch, Security & Bundle Audit, Verification Verdict

### Community 95 - "Phase 10 User Acceptance Testing (UAT)"
Cohesion: 0.33
Nodes (5): Phase 10 User Acceptance Testing (UAT), Scenario 1: Money Overview 10-Pillar Inspection, Scenario 2: Deterministic Insights Evaluation, Scenario 3: Financial Activity Filtering & Badging, Scenario 4: Truthful Uncertainty Handling

### Community 96 - "Working on FLOVA (team rules for the 24-hour build)"
Cohesion: 0.29
Nodes (7): Branches, Definition of done for any pull request, Every working session, Graphify: required for everyone, One-time setup (each member, each laptop), Who owns what, Working on FLOVA (team rules for the 24-hour build)

### Community 97 - "Phase 6 Verification Report: Realistic Demo Data"
Cohesion: 0.40
Nodes (4): Automated Test Log, Execution Context, Phase 6 Verification Report: Realistic Demo Data, Security & Architecture Audit

### Community 98 - "Phase 6: Support Realistic Demo Data - Context & Invariants"
Cohesion: 0.50
Nodes (3): 1. Safety & Isolation Invariants, 2. Canonical Scenario (Ravi - Delivery Partner), Phase 6: Support Realistic Demo Data - Context & Invariants

### Community 99 - "Phase 9.1 Verification Report"
Cohesion: 0.50
Nodes (3): Phase 9.1 Verification Report, Test Summary, Verification Checklist

### Community 100 - "AuthProvider"
Cohesion: 0.33
Nodes (6): AuthProvider(), Codebase Concerns, Fragile Areas, Missing Critical Features (To be delivered in Roadmap), Security Considerations, Tech Debt

### Community 102 - "Coding Conventions"
Cohesion: 0.29
Nodes (6): RupeeString, Code Style, Coding Conventions, Database Interaction Conventions, Error Handling, Import Organization

### Community 107 - "ravi.test.ts"
Cohesion: 0.33
Nodes (5): fridayEntry, mondayEntry, raviInput, result, saturdayEntry

### Community 108 - "confirmCandidateTransaction"
Cohesion: 0.60
Nodes (5): confirmCandidateTransaction(), assertStrictEqual(), assertTrue(), it(), runTests()

### Community 109 - "activityAndOverview.test.ts"
Cohesion: 0.60
Nodes (5): assertStrictEqual(), assertTrue(), it(), runTests(), resetMockState()

### Community 110 - "Onboarding Summary"
Cohesion: 0.33
Nodes (5): Codebase Context, Docs Context, Onboarding Summary, Project State, Recommended Next Step

### Community 111 - "Plan 10-01: Financial Activity, Money Overview & Deterministic Insights"
Cohesion: 0.33
Nodes (5): Objective, Owner: M1 (Backend/Contracts) & M2/M3 (Frontend & Insights Engine), Phase: 10, Plan: 01, Plan 10-01: Financial Activity, Money Overview & Deterministic Insights

### Community 112 - "signIn"
Cohesion: 0.83
Nodes (3): LoginPage(), handleSubmit(), signIn()

### Community 113 - "Phase 7 Plan 01 Summary: Financial Data Contracts & Timeline Helpers"
Cohesion: 0.50
Nodes (3): Key Implementation Details, Outcome, Phase 7 Plan 01 Summary: Financial Data Contracts & Timeline Helpers

### Community 114 - "Plan 10-01 Summary: Financial Activity, Money Overview & Deterministic Insights"
Cohesion: 0.50
Nodes (3): Key Metrics, Overview, Plan 10-01 Summary: Financial Activity, Money Overview & Deterministic Insights

## Knowledge Gaps
- **16 isolated node(s):** `udaan-engine`, `@supabase/supabase-js`, `PGPASSWORD`, `PGHOST`, `PGPORT` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 687 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `useSession`, `api.ts`, `frontend/package.json`, `parseRequiredRupees`, `WishPage.tsx`, `auth.ts`, `toPaise`, `Voice Capture Integration`, `signIn`, `data.ts`, `Icons.tsx`, `todayLocalISO`, `ProfileSettingsView.tsx`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `toPaise()` (e.g. with `Architectural Rules` and `Rules everyone follows`) actually correct?**
  _`toPaise()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `udaan-engine`, `@supabase/supabase-js`, `PGPASSWORD` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `test_engine.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06749482401656315 - nodes in this community are weakly interconnected._
- **Why does `Active (M1 Roadmap Scope)` connect `main` to `useSession`, `toPaise`, `AuthProvider`, `addTransaction`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `useSession()` (e.g. with `Layers` and `Primary Runway Feed Path`) actually correct?**
  _`useSession()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Should `contracts.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11182795698924732 - nodes in this community are weakly interconnected._