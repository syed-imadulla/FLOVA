# Graph Report - FLOVA  (2026-11-21)

## Corpus Check
- 209 files · ~122,467 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .css 5, (none) 2, .example 2)

## Summary
- 1199 nodes · 2406 edges · 93 communities (66 shown, 27 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 162 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3c3f9cf0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- test_engine.py
- contracts.ts
- VERDICT — pick-f1-irregular-income
- parseRequiredRupees
- frontend/package.json
- Phase Details
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
- toPaise
- FLOVA Hero Section Blueprint: Video 1 Deep Analysis
- index.ts
- Project State
- Tests
- Codebase Structure
- AuthProvider.tsx
- Technology Stack
- Testing Patterns
- useSession
- External Integrations
- Tests
- 01-01-PLAN.md
- Plan 02-01: Profile and Onboarding Persistence
- addTransaction
- Phase 4: Runway Feed Verification Report
- data.ts
- Plan 03-01: Data Capture Hooks and Pages
- 20261120000100_init_schema.sql
- FLOVA (Udaan 2.0)
- Goal Achievement
- v1 Requirements
- useTransactions
- FLOVA (Udaan 2.0)
- react
- FLOVA AI Extraction Contract Specification (v1 · Owner: M3)
- FLOVA AI Extraction Contract Specification (v1 · Owner: M3)
- 1. Locked Decisions & Core Architecture
- ProfileSettingsView.tsx
- Onboarding Summary
- Tasks
- VoiceCapturePage.tsx
- Phase 5: Payout Synchronization Hardening & Idempotency Verification Report
- supabase.ts
- parseRupees.test.ts
- External Integrations
- toPaise
- 20261120000100_init_schema.sql
- extractTransaction.ts
- Phase 1: Auth flow - Context
- parseOptionalRupees
- v1 Requirements
- FLOVA Financial Engine (M3)
- Architecture
- Phase 1: Auth Flow Summary
- Project State
- idempotentRetry.test.ts
- Implementation Decisions
- Tables
- auth.ts
- signIn
- Observable Truths
- Key Accomplishments
- sw.js

## God Nodes (most connected - your core abstractions)
1. `react` - 74 edges
2. `useSession()` - 35 edges
3. `toPaise()` - 34 edges
4. `react-router-dom` - 29 edges
5. `formatINR()` - 27 edges
6. `parseRequiredRupees()` - 26 edges
7. `loadRunwayInput()` - 23 edges
8. `App()` - 22 edges
9. `useProfile()` - 22 edges
10. `AppShell()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Decision 4: Client-Side Submission Idempotency` --references--> `NewTransaction`  [INFERRED]
  .planning/phases/05-payout-synchronization-hardening/05-CONTEXT.md → frontend/src/types/contracts.ts
- `2. Auth Context & Session Management` --references--> `onAuthChange()`  [INFERRED]
  .planning/phases/01-auth-flow/01-CONTEXT.md → frontend/src/services/auth.ts
- `Component Responsibilities` --references--> `loadRunwayInput()`  [INFERRED]
  .planning/codebase/ARCHITECTURE.md → frontend/src/services/data.ts
- `Fragile Areas` --references--> `loadRunwayInput()`  [INFERRED]
  .planning/codebase/CONCERNS.md → frontend/src/services/data.ts
- `Technical Audit & Safety Bounds` --references--> `addTransaction()`  [INFERRED]
  .planning/phases/05-payout-synchronization-hardening/05-VERIFICATION.md → frontend/src/services/data.ts

## Import Cycles
- None detected.

## Communities (93 total, 27 thin omitted)

### Community 0 - "test_engine.py"
Cohesion: 0.07
Nodes (36): test_backtest_shape(), test_buffer_never_negative_and_money_is_conserved(), test_estimate_ignores_one_big_week(), test_estimate_with_little_history_is_cautious(), test_generate_year_is_reproducible(), test_lean_week_is_covered_by_buffer(), test_low_income_is_not_called_a_timing_problem(), test_negative_income_week_handled() (+28 more)

### Community 1 - "contracts.ts"
Cohesion: 0.11
Nodes (19): ProfileContext, ProfileContextType, APP_LANGUAGES, COMMITMENT_KINDS, COMMITMENT_STATUSES, CommitmentKind, ENTRY_SOURCES, EntrySource (+11 more)

### Community 2 - "VERDICT — pick-f1-irregular-income"
Cohesion: 0.05
Nodes (40): An alternative approach (same problem, same user), Contradictions between jurors, If I were your team…, Next experiment (30 min), Ranked improvements, Ratings /10, VERDICT — pick-f1-irregular-income, Votes (+32 more)

### Community 3 - "parseRequiredRupees"
Cohesion: 0.10
Nodes (17): AddTransactionPage(), handleSubmit(), CommitmentsPage(), handleAddCommitment(), handleAddPayout(), parseRequiredRupees(), ContributionCadence, ArrowLeftIcon() (+9 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.07
Nodes (33): dependencies, react@18.3.1, react-dom@18.3.1, react-router-dom@^6.30.6, @supabase/supabase-js@^2.119.2, devDependencies, autoprefixer@^10.7.0, postcss@^8.5.33 (+25 more)

### Community 5 - "Phase Details"
Cohesion: 0.15
Nodes (12): Overview, Phase 1: Auth flow, Phase 2: Profile & onboarding data, Phase 4: Runway feed, Phase 5: Payout Synchronization Hardening, Phase 6: Demo data, Phase 7: Deployment, Phase 8: Verify & freeze (+4 more)

### Community 6 - "FLOVA data contract (v1 · owner: M1)"
Cohesion: 0.12
Nodes (13): Branches, Definition of done for any pull request, Every working session, Graphify: required for everyone, One-time setup (each member, each laptop), Who owns what, Working on FLOVA (team rules for the 24-hour build), Evidence (backtest, 50 simulated years per rider type) (+5 more)

### Community 7 - "backend/package.json"
Cohesion: 0.10
Nodes (20): description, devDependencies, @electric-sql/pglite@^0.5.17, @supabase/supabase-js@^2.119.2, @supabase/supabase-js, name, private, scripts (+12 more)

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

### Community 34 - "toPaise"
Cohesion: 0.29
Nodes (10): App(), RedirectIfAuthed(), RequireAuth(), useSession(), DataVersionProvider(), InsightsView(), ProfileProvider(), RequireOnboarded() (+2 more)

### Community 35 - "FLOVA Hero Section Blueprint: Video 1 Deep Analysis"
Cohesion: 0.20
Nodes (9): 1. Canvas, Background Surface & Spatial Framing, 2. Top Navigation Bar (Fixed / Sticky Editorial Header), 3. Centered Typography Lockup & Easing Choreography, 4. Central Focal Visual (Centerpiece), 5. Hand-Drawn Sketch Annotations, Medallion & Secondary Visuals, 6. Reveal on Scroll (Sub-Hero Section at `t = 12s–17.8s`), 7. Motion Choreography & Parallax Execution Plan, 8. Readiness Checklist for Video 2 & Master Build (+1 more)

### Community 36 - "index.ts"
Cohesion: 0.07
Nodes (64): d1, d2, iso1, iso2, calculateConfirmedBalance(), ConfirmedBalanceResult, ConfirmedBalanceStatus, ExtractedCheckinData (+56 more)

### Community 37 - "Project State"
Cohesion: 0.13
Nodes (14): 1. Hero-to-Followup 1-Rupee Indian Coin Morph Transition, 2. Band-by-Band Cadence in Video 2, 3. Currency & Data Rules Mapping (FLOVA Contract Compliance), 4. Master Build Roadmap (Step 3 Preview), Band 1: Dark Feature Showcase Card (`#111214` / `#141517`), Band 2: 4-Column Feature & Value Strip (Light Paper Surface), Band 3: Fine-Grid Testimonial & Real Worker Stories Band, Band 4: Vibrant Cyan/Aqua Callout Banner (`#25DCF5` / `#00D2F0`) (+6 more)

### Community 38 - "Tests"
Cohesion: 0.13
Nodes (14): 1. Logged out redirect to /login (B1), 2. Sign up with new email and display name (B2), 3. Session persistence on refresh (B3), 4. Logout and route protection (B4), 5. Login error handling (B5), 6. Redirect authenticated user away from /login (B6), 7. Client-side password length validation (B7), A. Live RLS Test (+6 more)

### Community 39 - "Codebase Structure"
Cohesion: 0.29
Nodes (6): Codebase Structure, Directory Layout, Directory Purposes, Key File Locations, Naming Conventions, Where to Add New Code

### Community 40 - "AuthProvider.tsx"
Cohesion: 0.47
Nodes (5): AuthContext, AuthContextValue, AuthProvider(), onAuthChange(), Authentication & Routing Infrastructure

### Community 41 - "Technology Stack"
Cohesion: 0.25
Nodes (7): Configuration, Frameworks, Key Dependencies, Languages, Platform Requirements, Runtime, Technology Stack

### Community 42 - "Testing Patterns"
Cohesion: 0.29
Nodes (6): Mocking & Isolation, Required Pre-Shipping Checks, Test File Organization, Test Framework, Test Structure, Testing Patterns

### Community 43 - "useSession"
Cohesion: 0.17
Nodes (14): Service functions (`frontend/src/services/`), getLatestCheckin(), getMyProfile(), listPayouts(), loadRunwayInput(), Primary Runway Feed Path, Objectives, Plan 04-01: Runway Feed Integration and Dashboard (+6 more)

### Community 44 - "External Integrations"
Cohesion: 0.29
Nodes (3): __dirname, __filename, mockSupabasePath

### Community 45 - "Tests"
Cohesion: 0.12
Nodes (15): 1. Currency parser unit tests, 1. New user signup routing, 2. Blank ₹ fields submission, 2. M3 Engine tests regression suite, 3. Database test suite, 3. Session refresh persistence, 4. Edit profile updates immediately, 5. Client-side validation (+7 more)

### Community 48 - "addTransaction"
Cohesion: 0.13
Nodes (16): addTransaction(), NewTransaction, Task 1: Client-Side Idempotency, Artifacts Produced, Key Accomplishments, Plan 05-01 Summary: Payout Synchronization Hardening & Idempotency, Objectives, Plan 05-02: Idempotent Retry UX Fix in `addTransaction` (+8 more)

### Community 49 - "Phase 4: Runway Feed Verification Report"
Cohesion: 0.33
Nodes (5): Goal Achievement, Investigation Findings: Previous Aggregate Test Command Failures, M1 Data Layer & M3 Engine Integration Audit, Observable Truths, Phase 4: Runway Feed Verification Report

### Community 50 - "data.ts"
Cohesion: 0.22
Nodes (15): useLatestCheckin(), addCheckin(), addPayout(), money(), setPayoutStatus(), updateMyProfile(), BalanceCheckin, Commitment (+7 more)

### Community 52 - "20261120000100_init_schema.sql"
Cohesion: 0.06
Nodes (67): api, BacktestRow, FALLBACK_PROFILES, OutlookWeek, Plan, Profile, Rider, rs() (+59 more)

### Community 54 - "FLOVA (Udaan 2.0)"
Cohesion: 0.25
Nodes (7): 1. Database Regression Suite (PGlite), 2. Multi-Connection PostgreSQL Concurrency & Deadlock Suite, 3. Frontend Compilation & Idempotent Retry UX Suite, Current Test, Gaps, Summary, Tests

### Community 55 - "Goal Achievement"
Cohesion: 0.50
Nodes (3): Goal Achievement, Observable Truths, Phase 3: Data Capture Hooks Verification Report

### Community 56 - "v1 Requirements"
Cohesion: 0.29
Nodes (6): PGDATABASE, PGHOST, PGPASSWORD, PGPORT, PGUSER, test-concurrency-postgres.sh script

### Community 57 - "useTransactions"
Cohesion: 0.15
Nodes (22): DataVersionContext, DataVersionContextType, useDataVersion(), useCommitments(), usePayouts(), useTransactions(), unwrap(), addCommitment() (+14 more)

### Community 58 - "FLOVA (Udaan 2.0)"
Cohesion: 0.22
Nodes (8): Business & Problem Context, Constraints & Rules for Every Phase, Core Value, FLOVA (Udaan 2.0), Key Decisions Log, Team Ownership & Boundaries, Technical Environment & Architecture, What This Is

### Community 59 - "react"
Cohesion: 0.06
Nodes (39): HeroSection(), HeroSectionProps, FlovaBottomCTA(), FlovaClarityShowcase(), FlovaFooter(), FlovaHero(), FlovaHowItWorks(), FlovaIndiaContext() (+31 more)

### Community 60 - "FLOVA AI Extraction Contract Specification (v1 · Owner: M3)"
Cohesion: 0.13
Nodes (14): 1. Overview & Architectural Boundaries, 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (OpenAPI 3.1 / Draft 2020-12 Compatible), 5. Five Concrete Extraction Examples, 6. Ambiguity Handling & Clarification Rules, 7. Mapping to FLOVA Application Contracts (Consumer Adapter), Architectural Rules (+6 more)

### Community 61 - "FLOVA AI Extraction Contract Specification (v1 · Owner: M3)"
Cohesion: 0.13
Nodes (14): 1. Overview & Architectural Boundaries, 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (OpenAPI 3.1 / Draft 2020-12 Compatible), 5. Five Concrete Extraction Examples, 6. Ambiguity Handling & Clarification Rules, 7. Mapping to FLOVA Application Contracts (Consumer Adapter), Architectural Rules (+6 more)

### Community 62 - "1. Locked Decisions & Core Architecture"
Cohesion: 0.22
Nodes (8): 1. Locked Decisions & Core Architecture, 2. Boundaries & Out-of-Scope, Decision 1: Database Trigger Derived Totals & Row-Level Locking, Decision 2: Status State Machine Transitions, Decision 3: Deadlock-Free Payout Reassignment, Decision 4: Client-Side Submission Idempotency, Decision 5: Security & RLS Invariants, Phase 5: Payout Synchronization Hardening - Context & Decisions

### Community 63 - "ProfileSettingsView.tsx"
Cohesion: 0.19
Nodes (15): AppShell(), handleSignOut(), AppShellProps, ProfileSettingsView(), handleSignOut(), useProfile(), signOut(), AppLanguage (+7 more)

### Community 64 - "Onboarding Summary"
Cohesion: 0.29
Nodes (6): Codebase Context, Docs Context, Onboarding Summary, Project State, Recommended Next Step, Workstream & Rules

### Community 65 - "Tasks"
Cohesion: 0.29
Nodes (6): Objectives, Plan 05-01: Payout Synchronization Hardening & Idempotency, Task 0: Database Migration (`20261121000100_harden_payout_sync.sql`), Task 2: PGlite Comprehensive Regression Suite, Task 3: Real Multi-Connection PostgreSQL Concurrency Test, Tasks

### Community 67 - "VoiceCapturePage.tsx"
Cohesion: 0.15
Nodes (16): todayLocalISO(), HomePlaceholder(), handleLogout(), btn(), card, Step, VoiceCapturePage(), handleProceedToReview() (+8 more)

### Community 68 - "Phase 5: Payout Synchronization Hardening & Idempotency Verification Report"
Cohesion: 0.40
Nodes (4): Goal Achievement, Observable Truths, Phase 5: Payout Synchronization Hardening & Idempotency Verification Report, Technical Audit & Safety Bounds

### Community 69 - "supabase.ts"
Cohesion: 0.25
Nodes (5): client(), login(), publishableKey, supabase, url

### Community 71 - "parseRupees.test.ts"
Cohesion: 0.15
Nodes (25): ConfirmedBalanceBreakdown, Paise, RupeeString, calculateWish(), CreateWishInput, formatDateISO(), formatMonthYear(), Wish (+17 more)

### Community 72 - "External Integrations"
Cohesion: 0.25
Nodes (7): Authentication & Identity, CI/CD & Deployment, Data Storage, Environment Configuration, External Integrations, Monitoring & Observability, Webhooks & Callbacks

### Community 73 - "toPaise"
Cohesion: 0.19
Nodes (13): formatINR(), toPaise(), toPaiseOrNull(), HistoryPage(), handleSaveEdit(), startEdit(), HomeRunwayView(), PayoutsPage() (+5 more)

### Community 74 - "20261120000100_init_schema.sql"
Cohesion: 0.16
Nodes (21): balance_checkins_user_time, commitments_updated_at, commitments_user_due, on_auth_user_created, payouts_guard_received, payouts_updated_at, payouts_user_date, profiles_updated_at (+13 more)

### Community 75 - "extractTransaction.ts"
Cohesion: 0.25
Nodes (10): CATEGORY_MAP, EXPENSE_KEYWORDS, extractAmount(), extractTransaction(), guessCategory(), guessDescription(), guessExpenseType(), INCOME_KEYWORDS (+2 more)

### Community 76 - "Phase 1: Auth flow - Context"
Cohesion: 0.25
Nodes (7): Canonical References, Established Patterns, Existing Code Insights, Integration Points, Phase 1: Auth flow - Context, Phase Boundary, Reusable Assets

### Community 77 - "parseOptionalRupees"
Cohesion: 0.19
Nodes (11): CheckinPage(), handleSubmit(), OnboardingPage(), handleSubmit(), handleSave(), parseOptionalRupees(), ParseRequiredRupeesResult, ParseRupeesResult (+3 more)

### Community 78 - "v1 Requirements"
Cohesion: 0.18
Nodes (10): Out of Scope, Phase 1: Authentication Flow, Phase 4: Runway Feed & Engine Integration, Phase 5: Secure AI Function (Stretch), Phase 6: Demo Data Seed & Test Fixtures, Phase 7: Deployment & Production Smoke Test, Phase 8: Verify & Release Freeze, Requirements: FLOVA (M1 Backend & Database) (+2 more)

### Community 79 - "FLOVA Financial Engine (M3)"
Cohesion: 0.20
Nodes (9): Architectural Principles, Calculation Semantics (Option A), FLOVA Financial Engine (M3), Historical Ravi Fixture Preservation, Key Rules:, Option A: Remaining Daily Budget Logic, Problem Addressed, Results: (+1 more)

### Community 80 - "Architecture"
Cohesion: 0.12
Nodes (15): FLOVA data contract (v1 · owner: M1), Frontend data hooks (`frontend/src/data/`), How to record each money situation, Rules everyone follows, Rules for M3's runway engine (from the master plan), paiseToRupeeString(), Architectural Constraints, Architecture (+7 more)

### Community 81 - "Phase 1: Auth Flow Summary"
Cohesion: 0.22
Nodes (8): 1. Executive Summary, 2. Key Deliverables & Changes, 3. Verification & Quality Gates, 4. Note for M2 (Frontend/UI), 5. Next Steps, Database & Backend Hygiene, Pages & App Wiring, Phase 1: Auth Flow Summary

### Community 82 - "Project State"
Cohesion: 0.40
Nodes (4): Current Position, Performance Metrics, Project Reference, Project State

### Community 83 - "idempotentRetry.test.ts"
Cohesion: 0.31
Nodes (7): assertStrictEqual(), assertTrue(), it(), runTests(), MockState, mockState, supabase

### Community 84 - "Implementation Decisions"
Cohesion: 0.29
Nodes (7): 1. Routing & Dependencies, 2. Auth Context & Session Management, 3. Pages & UI Presentation, 4. Authentication Workflows & Form Behavior, 5. Architectural Boundaries, 6. Backend Hygiene & Explicit Permissions, Implementation Decisions

### Community 85 - "Tables"
Cohesion: 0.33
Nodes (6): `balance_checkins` (actual cash + bank at a moment), `commitments` (bills and debts), `payouts` (money expected, **not cash until received**), `profiles` (one per user, created automatically at sign-up), Tables, `transactions` (money that actually moved)

### Community 86 - "auth.ts"
Cohesion: 0.73
Nodes (4): SignupPage(), handleSubmit(), getSession(), signUp()

### Community 87 - "signIn"
Cohesion: 0.60
Nodes (4): LoginPage(), handleSubmit(), signIn(), APIs & External Services

### Community 88 - "Observable Truths"
Cohesion: 0.50
Nodes (3): Goal Achievement, Observable Truths, Phase 1: Auth Flow Verification Report

## Knowledge Gaps
- **6 isolated node(s):** `udaan-engine`, `PGDATABASE`, `PGHOST`, `PGPASSWORD`, `PGPORT` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 550 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `contracts.ts`, `toPaise`, `VoiceCapturePage.tsx`, `frontend/package.json`, `parseRequiredRupees`, `parseRupees.test.ts`, `AuthProvider.tsx`, `toPaise`, `parseOptionalRupees`, `data.ts`, `20261120000100_init_schema.sql`, `auth.ts`, `signIn`, `useTransactions`, `ProfileSettingsView.tsx`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `useSession()` (e.g. with `Layers` and `Primary Runway Feed Path`) actually correct?**
  _`useSession()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `udaan-engine`, `PGDATABASE`, `PGHOST` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `test_engine.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06680080482897384 - nodes in this community are weakly interconnected._
- **Why does `toPaise()` connect `toPaise` to `toPaise`, `VoiceCapturePage.tsx`, `parseRequiredRupees`, `useSession`, `parseOptionalRupees`, `Architecture`, `addTransaction`, `data.ts`, `FLOVA AI Extraction Contract Specification (v1 · Owner: M3)`, `FLOVA AI Extraction Contract Specification (v1 · Owner: M3)`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `toPaise()` (e.g. with `Architectural Rules` and `Rules everyone follows`) actually correct?**
  _`toPaise()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Should `contracts.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11428571428571428 - nodes in this community are weakly interconnected._