# Graph Report - FLOVA  (2026-11-21)

## Corpus Check
- 254 files · ~167,133 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .css 5, (none) 2, .example 2)

## Summary
- 1444 nodes · 3024 edges · 113 communities (86 shown, 27 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 313 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `833a57de`
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
- AuthProvider
- FLOVA Financial Engine (M3)
- testUtils.ts
- Project State
- Tests
- RunwayInput
- auth.ts
- Technology Stack
- Testing Patterns
- useSession
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
- App.tsx
- FLOVA (Udaan 2.0)
- v1 Requirements
- listActivityTimeline
- react
- 1. Locked Decisions & Core Architecture
- FLOVA AI Extraction Contract Specification (v1 · Owner: M3)
- FinancialExtractionDTO
- Key Architectural & Design Decisions
- Key Architectural & Design Decisions
- FLOVA AI Extraction Contract Specification (v1 · Owner: M3)
- VoiceTransactionCandidate
- RiderView
- receipt.ts
- WishPage.tsx
- External Integrations
- Plan 08-01: Secure FLOVA Catch (Receipt Extraction)
- extractTransaction.ts
- Naming Patterns
- onAuthChange
- addTransaction
- ProfileProvider.tsx
- FLOVA
- voice.ts
- 2. Band-by-Band Cadence in Video 2
- Phase 9 User Acceptance Testing (UAT) Report: Voice Transcription & Intent Integration
- Phase 1: Auth Flow Summary
- main
- Working on FLOVA (team rules for the 24-hour build)
- parseRupees.test.ts
- MockQueryBuilder
- FLOVA Hero Section Blueprint: Video 1 Deep Analysis
- adapter.ts
- engine/index.ts
- Phase 9.1 User Acceptance Testing (UAT)
- Roadmap: FLOVA (12-Phase Hackathon Roadmap)
- Phase 7 Verification Report: Financial Data Contracts
- Phase 8 Verification Report: Secure FLOVA Catch
- Phase 10 User Acceptance Testing (UAT)
- dates.test.ts
- Phase 6 Verification Report: Realistic Demo Data
- Phase 6: Support Realistic Demo Data - Context & Invariants
- Phase 9.1 Verification Report
- Codebase Structure
- Goal Achievement
- Tasks
- Goal Achievement
- sw.js
- Onboarding Summary
- Phase 5: Payout Synchronization Hardening & Idempotency Verification Report
- Phase 9 Verification Report: Secure Voice Transcription & Intent Integration
- signIn
- FLOVA Integration Report: M4 Voice Capture, Catch & Wish Integration
- Plan 05-01 Summary: Payout Synchronization Hardening & Idempotency

## God Nodes (most connected - your core abstractions)
1. `react` - 77 edges
2. `toPaise()` - 44 edges
3. `confirmCandidateTransaction()` - 38 edges
4. `useSession()` - 34 edges
5. `react-router-dom` - 31 edges
6. `todayLocalISO()` - 31 edges
7. `formatINR()` - 31 edges
8. `parseRequiredRupees()` - 26 edges
9. `RunwayInput` - 25 edges
10. `App()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Branches` --references--> `main()`  [INFERRED]
  CONTRIBUTING.md → ai-engine/udaan_engine/__main__.py
- `Scope of Verification` --references--> `FinancialExtractionDTO`  [INFERRED]
  .planning/phases/09-voice-transcription/09-UAT.md → frontend/src/engine/extractionTypes.ts
- `Execution Context` --references--> `FinancialExtractionDTO`  [INFERRED]
  .planning/phases/09-voice-transcription/09-VERIFICATION.md → frontend/src/engine/extractionTypes.ts
- `Pattern Overview` --references--> `toPaise()`  [INFERRED]
  .planning/codebase/ARCHITECTURE.md → frontend/src/lib/money.ts
- `5. Next Steps` --references--> `useProfile()`  [INFERRED]
  .planning/phases/01-auth-flow/01-01-SUMMARY.md → frontend/src/profile/useProfile.ts

## Import Cycles
- None detected.

## Communities (113 total, 27 thin omitted)

### Community 0 - "test_engine.py"
Cohesion: 0.07
Nodes (35): test_backtest_shape(), test_buffer_never_negative_and_money_is_conserved(), test_estimate_ignores_one_big_week(), test_estimate_with_little_history_is_cautious(), test_generate_year_is_reproducible(), test_lean_week_is_covered_by_buffer(), test_low_income_is_not_called_a_timing_problem(), test_negative_income_week_handled() (+27 more)

### Community 1 - "contracts.ts"
Cohesion: 0.09
Nodes (25): ExtractedCheckinData, ExtractedPayoutData, ExtractedQueryData, ExtractedTransactionData, ExtractionActionIntent, ExtractionEntryIntent, ExtractionMetadata, APP_LANGUAGES (+17 more)

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
Cohesion: 0.20
Nodes (9): Architectural Constraints, Architecture, Component Responsibilities, Data Flow, Entry Points, Error Handling, Key Abstractions, Pattern Overview (+1 more)

### Community 6 - "FLOVA data contract (v1 · owner: M1)"
Cohesion: 0.20
Nodes (10): `balance_checkins` (actual cash + bank at a moment), `commitments` (bills and debts), FLOVA data contract (v1 · owner: M1), How to record each money situation, `payouts` (money expected, **not cash until received**), `profiles` (one per user, created automatically at sign-up), Rules everyone follows, Rules for M3's runway engine (from the master plan) (+2 more)

### Community 7 - "backend/package.json"
Cohesion: 0.06
Nodes (31): description, devDependencies, @electric-sql/pglite, @supabase/supabase-js, @supabase/supabase-js, name, private, scripts (+23 more)

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

### Community 34 - "AuthProvider"
Cohesion: 0.33
Nodes (6): AuthProvider(), Codebase Concerns, Fragile Areas, Missing Critical Features (To be delivered in Roadmap), Security Considerations, Tech Debt

### Community 35 - "FLOVA Financial Engine (M3)"
Cohesion: 0.20
Nodes (9): Architectural Principles, Calculation Semantics (Option A), FLOVA Financial Engine (M3), Historical Ravi Fixture Preservation, Key Rules:, Option A: Remaining Daily Budget Logic, Problem Addressed, Results: (+1 more)

### Community 36 - "testUtils.ts"
Cohesion: 0.27
Nodes (12): RunwayProjectionInput, baseProfile, baseProfile, assertMatch(), assertStrictEqual(), assertThrows(), describe(), it() (+4 more)

### Community 37 - "Project State"
Cohesion: 0.40
Nodes (4): Current Position, Performance Metrics, Project Reference, Project State

### Community 38 - "Tests"
Cohesion: 0.13
Nodes (14): 1. Logged out redirect to /login (B1), 2. Sign up with new email and display name (B2), 3. Session persistence on refresh (B3), 4. Logout and route protection (B4), 5. Login error handling (B5), 6. Redirect authenticated user away from /login (B6), 7. Client-side password length validation (B7), A. Live RLS Test (+6 more)

### Community 39 - "RunwayInput"
Cohesion: 0.14
Nodes (12): processRunwayFeed(), fridayEntry, mondayEntry, raviInput, result, saturdayEntry, RunwayInput, Key Accomplishments (+4 more)

### Community 40 - "auth.ts"
Cohesion: 0.24
Nodes (8): client(), login(), AuthContext, AuthContextValue, SignupPage(), handleSubmit(), getSession(), signUp()

### Community 41 - "Technology Stack"
Cohesion: 0.25
Nodes (7): Configuration, Frameworks, Key Dependencies, Languages, Platform Requirements, Runtime, Technology Stack

### Community 42 - "Testing Patterns"
Cohesion: 0.29
Nodes (6): Mocking & Isolation, Required Pre-Shipping Checks, Test File Organization, Test Framework, Test Structure, Testing Patterns

### Community 43 - "useSession"
Cohesion: 0.22
Nodes (11): Service functions (`frontend/src/services/`), getLatestCheckin(), getMyProfile(), listPayouts(), loadRunwayInput(), Primary Runway Feed Path, Objectives, Plan 04-01: Runway Feed Integration and Dashboard (+3 more)

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
Cohesion: 0.29
Nodes (14): unwrap(), addCheckin(), addCommitment(), addPayout(), listCommitments(), money(), setCommitmentStatus(), setPayoutStatus() (+6 more)

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

### Community 57 - "App.tsx"
Cohesion: 0.05
Nodes (100): Frontend data hooks (`frontend/src/data/`), App(), RedirectIfAuthed(), RequireAuth(), useSession(), AppShell(), handleSignOut(), AppShellProps (+92 more)

### Community 58 - "FLOVA (Udaan 2.0)"
Cohesion: 0.25
Nodes (7): Business & Problem Context, Core Value, FLOVA (Udaan 2.0), Key Decisions Log, Team Ownership & Boundaries, Technical Environment & Architecture, What This Is

### Community 59 - "v1 Requirements"
Cohesion: 0.20
Nodes (9): Out of Scope, Phase 1: Authentication Flow, Phase 4: Runway Feed & Engine Integration, Phase 5: Secure AI Function (Stretch), Phase 6: Demo Data Seed & Test Fixtures, Phase 7: Deployment & Production Smoke Test, Requirements: FLOVA (M1 Backend & Database), Traceability Matrix (+1 more)

### Community 60 - "listActivityTimeline"
Cohesion: 0.07
Nodes (29): loadData(), loadActivity(), listActivityTimeline(), ActivityItemKind, 1. Extend Contracts & Timeline Service, 2. Implement Deterministic Financial Insights Engine, 3. Build Financial Activity Screen (`/activity`), 4. Build Money Overview Screen (`/overview`) (+21 more)

### Community 61 - "react"
Cohesion: 0.05
Nodes (44): HeroSection(), HeroSectionProps, FlovaBottomCTA(), FlovaClarityShowcase(), FlovaFooter(), FlovaHero(), FlovaHowItWorks(), FlovaIndiaContext() (+36 more)

### Community 62 - "1. Locked Decisions & Core Architecture"
Cohesion: 0.22
Nodes (8): 1. Locked Decisions & Core Architecture, 2. Boundaries & Out-of-Scope, Decision 1: Database Trigger Derived Totals & Row-Level Locking, Decision 2: Status State Machine Transitions, Decision 3: Deadlock-Free Payout Reassignment, Decision 4: Client-Side Submission Idempotency, Decision 5: Security & RLS Invariants, Phase 5: Payout Synchronization Hardening - Context & Decisions

### Community 63 - "FLOVA AI Extraction Contract Specification (v1 · Owner: M3)"
Cohesion: 0.13
Nodes (14): 1. Overview & Architectural Boundaries, 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (OpenAPI 3.1 / Draft 2020-12 Compatible), 5. Five Concrete Extraction Examples, 6. Ambiguity Handling & Clarification Rules, 7. Mapping to FLOVA Application Contracts (Consumer Adapter), Architectural Rules (+6 more)

### Community 64 - "FinancialExtractionDTO"
Cohesion: 0.14
Nodes (19): FinancialExtractionDTO, confirmCandidateTransaction(), Edge Function Contract (`process-voice`), Implementation Tasks, Objectives, Plan 09-01: Secure Voice Transcription and Financial Intent Integration, Security Boundaries & Guardrails, Task 0: Contracts Extension (`frontend/src/types/contracts.ts`) (+11 more)

### Community 65 - "Key Architectural & Design Decisions"
Cohesion: 0.20
Nodes (9): 1. Security Boundary & API Key Protection, 2. AI Provider: Groq (Verified Model Identifiers), 3. Truthful Uncertainty & Contract Alignment, 4. Mandatory User Confirmation, 5. Input Modes: Dual Image & Pasted-Text, 6. Idempotency & Retries, Key Architectural & Design Decisions, Phase 8: Secure FLOVA Catch (Receipt Extraction) — Context & Decisions (+1 more)

### Community 66 - "Key Architectural & Design Decisions"
Cohesion: 0.18
Nodes (10): 1. Security Boundary & Server-Side Credentials, 2. Dual-Stage Groq AI Pipeline (Whisper + Llama 3.3), 3. Canonical Data Contracts: FinancialExtractionDTO & VoiceTransactionCandidate, 4. Truthful Uncertainty & Anti-Hallucination, 5. Mandatory User Confirmation & Read-Only Inference, 6. Fallback Input, Key Architectural & Design Decisions, Phase 9: Secure Voice Transcription and Financial Intent Integration — Context & Decisions (+2 more)

### Community 67 - "FLOVA AI Extraction Contract Specification (v1 · Owner: M3)"
Cohesion: 0.13
Nodes (14): 1. Overview & Architectural Boundaries, 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (OpenAPI 3.1 / Draft 2020-12 Compatible), 5. Five Concrete Extraction Examples, 6. Ambiguity Handling & Clarification Rules, 7. Mapping to FLOVA Application Contracts (Consumer Adapter), Architectural Rules (+6 more)

### Community 68 - "VoiceTransactionCandidate"
Cohesion: 0.14
Nodes (16): ActivityItem, ExtractedReceiptCandidate, VoiceTransactionCandidate, Objectives, Plan 07-01: Financial Data Contracts & Timeline Helpers, Tasks, Key Implementation Details, Outcome (+8 more)

### Community 69 - "RiderView"
Cohesion: 0.35
Nodes (11): rs(), EvidenceView(), IncomeChart(), RiderView(), logPayout(), run(), signUp(), SmsView() (+3 more)

### Community 70 - "receipt.ts"
Cohesion: 0.29
Nodes (6): publishableKey, supabase, url, ExtractReceiptInput, ExtractReceiptResult, fileToBase64()

### Community 71 - "WishPage.tsx"
Cohesion: 0.12
Nodes (27): calculateWish(), ContributionCadence, CreateWishInput, formatDateISO(), formatMonthYear(), Wish, WishCalculation, WishStatus (+19 more)

### Community 72 - "External Integrations"
Cohesion: 0.25
Nodes (7): Authentication & Identity, CI/CD & Deployment, Data Storage, Environment Configuration, External Integrations, Monitoring & Observability, Webhooks & Callbacks

### Community 73 - "Plan 08-01: Secure FLOVA Catch (Receipt Extraction)"
Cohesion: 0.20
Nodes (9): Edge Function Contract (`extract-receipt`), Implementation Tasks, Objectives, Plan 08-01: Secure FLOVA Catch (Receipt Extraction), Security Boundaries & Rules, Task 0: Supabase Edge Function (`backend/supabase/functions/extract-receipt/index.ts`), Task 1: Frontend Receipt Service (`frontend/src/services/receipt.ts`), Task 3: Automated Test Suite (`frontend/src/services/__tests__/receiptExtraction.test.ts`) (+1 more)

### Community 74 - "extractTransaction.ts"
Cohesion: 0.09
Nodes (24): corsHeaders, ExtractReceiptRequest, corsHeaders, ProcessVoiceRequest, VoiceProcessInput, CATEGORY_MAP, EXPENSE_KEYWORDS, extractAmount() (+16 more)

### Community 75 - "Naming Patterns"
Cohesion: 0.29
Nodes (6): RupeeString, Code Style, Coding Conventions, Database Interaction Conventions, Error Handling, Import Organization

### Community 76 - "onAuthChange"
Cohesion: 0.13
Nodes (15): onAuthChange(), APIs & External Services, 1. Routing & Dependencies, 2. Auth Context & Session Management, 3. Pages & UI Presentation, 4. Authentication Workflows & Form Behavior, 6. Backend Hygiene & Explicit Permissions, Canonical References (+7 more)

### Community 77 - "addTransaction"
Cohesion: 0.14
Nodes (19): addTransaction(), receivePayout(), assertStrictEqual(), assertTrue(), it(), runTests(), NewTransaction, Task 1: Client-Side Idempotency (+11 more)

### Community 78 - "ProfileProvider.tsx"
Cohesion: 0.60
Nodes (4): ProfileContext, ProfileContextType, Profile, ProfileUpdate

### Community 79 - "FLOVA"
Cohesion: 0.22
Nodes (6): Evidence (backtest, 50 simulated years per rider type), FLOVA, Layout, Run it, Tech and credits, What it does

### Community 80 - "voice.ts"
Cohesion: 0.17
Nodes (23): listTransactions(), assertStrictEqual(), assertTrue(), it(), runTests(), resetMockState(), assertStrictEqual(), assertTrue() (+15 more)

### Community 81 - "2. Band-by-Band Cadence in Video 2"
Cohesion: 0.13
Nodes (14): 1. Hero-to-Followup 1-Rupee Indian Coin Morph Transition, 2. Band-by-Band Cadence in Video 2, 3. Currency & Data Rules Mapping (FLOVA Contract Compliance), 4. Master Build Roadmap (Step 3 Preview), Band 1: Dark Feature Showcase Card (`#111214` / `#141517`), Band 2: 4-Column Feature & Value Strip (Light Paper Surface), Band 3: Fine-Grid Testimonial & Real Worker Stories Band, Band 4: Vibrant Cyan/Aqua Callout Banner (`#25DCF5` / `#00D2F0`) (+6 more)

### Community 82 - "Phase 9 User Acceptance Testing (UAT) Report: Voice Transcription & Intent Integration"
Cohesion: 0.19
Nodes (7): Core Requirements & Boundaries, Goal, Phase 9.1 Context: Multilingual Voice Support & Language-Specific Financial Extraction, Phase 9 User Acceptance Testing (UAT) Report: Voice Transcription & Intent Integration, Scope of Verification, Test Results Summary, Verdict

### Community 83 - "Phase 1: Auth Flow Summary"
Cohesion: 0.25
Nodes (7): 1. Executive Summary, 2. Key Deliverables & Changes, 3. Verification & Quality Gates, 5. Next Steps, Authentication & Routing Infrastructure, Database & Backend Hygiene, Phase 1: Auth Flow Summary

### Community 84 - "main"
Cohesion: 0.29
Nodes (7): main(), Workstream & Rules, Active (M1 Roadmap Scope), Constraints & Rules for Every Phase, Out of Scope, Requirements, Phase 8: Verify & Release Freeze

### Community 85 - "Working on FLOVA (team rules for the 24-hour build)"
Cohesion: 0.29
Nodes (7): Branches, Definition of done for any pull request, Every working session, Graphify: required for everyone, One-time setup (each member, each laptop), Who owns what, Working on FLOVA (team rules for the 24-hour build)

### Community 86 - "parseRupees.test.ts"
Cohesion: 0.18
Nodes (10): req650, reqEmpty, reqZero, res200, res995, resAbc, resDec, resEmpty (+2 more)

### Community 87 - "MockQueryBuilder"
Cohesion: 0.18
Nodes (3): MockQueryBuilder, Phase 7 UAT: Financial Data Contracts & Timeline Helpers, User Acceptance Criteria & Results

### Community 88 - "FLOVA Hero Section Blueprint: Video 1 Deep Analysis"
Cohesion: 0.20
Nodes (9): 1. Canvas, Background Surface & Spatial Framing, 2. Top Navigation Bar (Fixed / Sticky Editorial Header), 3. Centered Typography Lockup & Easing Choreography, 4. Central Focal Visual (Centerpiece), 5. Hand-Drawn Sketch Annotations, Medallion & Secondary Visuals, 6. Reveal on Scroll (Sub-Hero Section at `t = 12s–17.8s`), 7. Motion Choreography & Parallax Execution Plan, 8. Readiness Checklist for Video 2 & Master Build (+1 more)

### Community 89 - "adapter.ts"
Cohesion: 0.20
Nodes (14): FinancialInsight, GenerateInsightsOptions, InsightSeverity, DailyProjectionEntry, RunwayProjectionResult, ProcessedRunway, assertStrictEqual(), assertTrue() (+6 more)

### Community 90 - "engine/index.ts"
Cohesion: 0.34
Nodes (17): calculateConfirmedBalance(), ConfirmedBalanceBreakdown, ConfirmedBalanceResult, ConfirmedBalanceStatus, addDays(), calculateDailyRunway(), RunwayProjectionStatus, isValidISODate() (+9 more)

### Community 91 - "Phase 9.1 User Acceptance Testing (UAT)"
Cohesion: 0.25
Nodes (7): Phase 9.1 User Acceptance Testing (UAT), Scenario 1: Language Pinned Transcription (Kannada), Scenario 2: Hindi Living Expense Extraction, Scenario 3: Truthful Uncertainty / Missing Amount (Kannada), Scenario 4: Platform Expected Payout Isolation (Telugu), Scenario 5: Balance Check-in Segregation (Urdu), Scenario 6: Multilingual Deterministic Financial Queries

### Community 92 - "Roadmap: FLOVA (12-Phase Hackathon Roadmap)"
Cohesion: 0.25
Nodes (7): Overview, Phase 6: Demo data, Phase 8: Secure FLOVA Catch receipt extraction integration, Phase Details, Phases, Progress, Roadmap: FLOVA (12-Phase Hackathon Roadmap)

### Community 93 - "Phase 7 Verification Report: Financial Data Contracts"
Cohesion: 0.33
Nodes (5): Automated Test Log, Execution Context, Phase 7 Verification Report: Financial Data Contracts, Production Build Log, Verification Verdict

### Community 94 - "Phase 8 Verification Report: Secure FLOVA Catch"
Cohesion: 0.33
Nodes (5): Automated Test Log (`receiptExtraction.test.ts`), Execution Context, Phase 8 Verification Report: Secure FLOVA Catch, Security & Bundle Audit, Verification Verdict

### Community 95 - "Phase 10 User Acceptance Testing (UAT)"
Cohesion: 0.33
Nodes (5): Phase 10 User Acceptance Testing (UAT), Scenario 1: Money Overview 10-Pillar Inspection, Scenario 2: Deterministic Insights Evaluation, Scenario 3: Financial Activity Filtering & Badging, Scenario 4: Truthful Uncertainty Handling

### Community 96 - "dates.test.ts"
Cohesion: 0.40
Nodes (4): d1, d2, iso1, iso2

### Community 97 - "Phase 6 Verification Report: Realistic Demo Data"
Cohesion: 0.40
Nodes (4): Automated Test Log, Execution Context, Phase 6 Verification Report: Realistic Demo Data, Security & Architecture Audit

### Community 98 - "Phase 6: Support Realistic Demo Data - Context & Invariants"
Cohesion: 0.50
Nodes (3): 1. Safety & Isolation Invariants, 2. Canonical Scenario (Ravi - Delivery Partner), Phase 6: Support Realistic Demo Data - Context & Invariants

### Community 99 - "Phase 9.1 Verification Report"
Cohesion: 0.50
Nodes (3): Phase 9.1 Verification Report, Test Summary, Verification Checklist

### Community 100 - "Codebase Structure"
Cohesion: 0.29
Nodes (6): Codebase Structure, Directory Layout, Directory Purposes, Key File Locations, Naming Conventions, Where to Add New Code

### Community 102 - "Tasks"
Cohesion: 0.29
Nodes (6): Objectives, Plan 05-01: Payout Synchronization Hardening & Idempotency, Task 0: Database Migration (`20261121000100_harden_payout_sync.sql`), Task 2: PGlite Comprehensive Regression Suite, Task 3: Real Multi-Connection PostgreSQL Concurrency Test, Tasks

### Community 107 - "Onboarding Summary"
Cohesion: 0.33
Nodes (5): Codebase Context, Docs Context, Onboarding Summary, Project State, Recommended Next Step

### Community 108 - "Phase 5: Payout Synchronization Hardening & Idempotency Verification Report"
Cohesion: 0.40
Nodes (4): Goal Achievement, Observable Truths, Phase 5: Payout Synchronization Hardening & Idempotency Verification Report, Technical Audit & Safety Bounds

### Community 109 - "Phase 9 Verification Report: Secure Voice Transcription & Intent Integration"
Cohesion: 0.40
Nodes (4): Automated Test Log (`voiceIntent.test.ts`), Execution Context, Phase 9 Verification Report: Secure Voice Transcription & Intent Integration, Verification Verdict

### Community 110 - "signIn"
Cohesion: 0.83
Nodes (3): LoginPage(), handleSubmit(), signIn()

### Community 111 - "FLOVA Integration Report: M4 Voice Capture, Catch & Wish Integration"
Cohesion: 0.50
Nodes (3): 1. M4 Commits Identified on `origin/dev`, 3. Test & Verification Results (166 Passed, 0 Failed), FLOVA Integration Report: M4 Voice Capture, Catch & Wish Integration

## Knowledge Gaps
- **14 isolated node(s):** `udaan-engine`, `@supabase/supabase-js`, `PGPASSWORD`, `PGHOST`, `PGPORT` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 671 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `api.ts`, `frontend/package.json`, `WishPage.tsx`, `auth.ts`, `signIn`, `ProfileProvider.tsx`, `data.ts`, `Icons.tsx`, `App.tsx`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `toPaise()` (e.g. with `Architectural Rules` and `Rules everyone follows`) actually correct?**
  _`toPaise()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `udaan-engine`, `@supabase/supabase-js`, `PGPASSWORD` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `test_engine.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06749482401656315 - nodes in this community are weakly interconnected._
- **Why does `main()` connect `main` to `test_engine.py`, `Working on FLOVA (team rules for the 24-hour build)`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Are the 20 inferred relationships involving `confirmCandidateTransaction()` (e.g. with `Tasks` and `Objectives`) actually correct?**
  _`confirmCandidateTransaction()` has 20 INFERRED edges - model-reasoned connections that need verification._
- **Should `contracts.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09401709401709402 - nodes in this community are weakly interconnected._