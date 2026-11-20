# Graph Report - FLOVA  (2026-11-21)

## Corpus Check
- 159 files · ~87,629 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 2, .css 1)

## Summary
- 1020 nodes · 1912 edges · 79 communities (55 shown, 24 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 161 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4288ad6b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- test_engine.py
- contracts.ts
- VERDICT — pick-f1-irregular-income
- api.ts
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
- App.tsx
- FLOVA Financial Engine (M3)
- index.ts
- Project State
- Tests
- Codebase Structure
- auth.ts
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
- parseRequiredRupees
- FLOVA (Udaan 2.0)
- v1 Requirements
- FLOVA AI Extraction Contract Specification (v1 · Owner: M3)
- FLOVA AI Extraction Contract Specification (v1 · Owner: M3)
- 1. Locked Decisions & Core Architecture
- react
- Onboarding Summary
- Tasks
- VoiceCapturePage.tsx
- Phase 5: Payout Synchronization Hardening & Idempotency Verification Report
- rls-live-check.mjs
- WishPage.tsx
- External Integrations
- toPaise
- extractTransaction.ts
- Naming Patterns
- Implementation Decisions
- Tasks
- ProfileProvider.tsx

## God Nodes (most connected - your core abstractions)
1. `toPaise()` - 32 edges
2. `react` - 32 edges
3. `useSession()` - 29 edges
4. `parseRequiredRupees()` - 26 edges
5. `formatINR()` - 23 edges
6. `loadRunwayInput()` - 23 edges
7. `todayLocalISO()` - 21 edges
8. `RunwayInput` - 20 edges
9. `App()` - 19 edges
10. `WishPage()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Decision 4: Client-Side Submission Idempotency` --references--> `NewTransaction`  [INFERRED]
  .planning/phases/05-payout-synchronization-hardening/05-CONTEXT.md → frontend/src/types/contracts.ts
- `Pattern Overview` --references--> `toPaise()`  [INFERRED]
  .planning/codebase/ARCHITECTURE.md → frontend/src/lib/money.ts
- `4. Authentication Workflows & Form Behavior` --references--> `signOut()`  [INFERRED]
  .planning/phases/01-auth-flow/01-CONTEXT.md → frontend/src/services/auth.ts
- `Phase Boundary` --references--> `useSession()`  [INFERRED]
  .planning/phases/01-auth-flow/01-CONTEXT.md → frontend/src/auth/useSession.ts
- `Phase 1: Authentication Flow` --references--> `useSession()`  [INFERRED]
  .planning/REQUIREMENTS.md → frontend/src/auth/useSession.ts

## Import Cycles
- None detected.

## Communities (79 total, 24 thin omitted)

### Community 0 - "test_engine.py"
Cohesion: 0.07
Nodes (36): test_backtest_shape(), test_buffer_never_negative_and_money_is_conserved(), test_estimate_ignores_one_big_week(), test_estimate_with_little_history_is_cautious(), test_generate_year_is_reproducible(), test_lean_week_is_covered_by_buffer(), test_low_income_is_not_called_a_timing_problem(), test_negative_income_week_handled() (+28 more)

### Community 1 - "contracts.ts"
Cohesion: 0.10
Nodes (19): APP_LANGUAGES, AppLanguage, COMMITMENT_KINDS, COMMITMENT_STATUSES, CommitmentKind, CommitmentStatus, ENTRY_SOURCES, EntrySource (+11 more)

### Community 2 - "VERDICT — pick-f1-irregular-income"
Cohesion: 0.05
Nodes (40): An alternative approach (same problem, same user), Contradictions between jurors, If I were your team…, Next experiment (30 min), Ranked improvements, Ratings /10, VERDICT — pick-f1-irregular-income, Votes (+32 more)

### Community 3 - "api.ts"
Cohesion: 0.14
Nodes (22): api, BacktestRow, OutlookWeek, Plan, Profile, Rider, rs(), Status (+14 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.09
Nodes (26): dependencies, react@18.3.1, react-dom@18.3.1, react-router-dom@^6.30.6, @supabase/supabase-js@^2.119.2, devDependencies, @types/react@18.3.12, @types/react-dom@18.3.1 (+18 more)

### Community 5 - "Phase Details"
Cohesion: 0.05
Nodes (34): RequireOnboarded(), useProfile(), Architectural Constraints, Architecture, Component Responsibilities, Data Flow, Entry Points, Error Handling (+26 more)

### Community 6 - "FLOVA data contract (v1 · owner: M1)"
Cohesion: 0.07
Nodes (24): Branches, Definition of done for any pull request, Every working session, Graphify: required for everyone, One-time setup (each member, each laptop), Who owns what, Working on FLOVA (team rules for the 24-hour build), `balance_checkins` (actual cash + bank at a moment) (+16 more)

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

### Community 34 - "App.tsx"
Cohesion: 0.19
Nodes (12): App(), AuthProvider(), RedirectIfAuthed(), RequireAuth(), DataVersionProvider(), LoginPage(), handleSubmit(), ProfileProvider() (+4 more)

### Community 35 - "FLOVA Financial Engine (M3)"
Cohesion: 0.20
Nodes (9): Architectural Principles, Calculation Semantics (Option A), FLOVA Financial Engine (M3), Historical Ravi Fixture Preservation, Key Rules:, Option A: Remaining Daily Budget Logic, Problem Addressed, Results: (+1 more)

### Community 36 - "index.ts"
Cohesion: 0.09
Nodes (54): d1, d2, iso1, iso2, calculateConfirmedBalance(), ConfirmedBalanceResult, ConfirmedBalanceStatus, ExtractedCheckinData (+46 more)

### Community 37 - "Project State"
Cohesion: 0.40
Nodes (4): Current Position, Performance Metrics, Project Reference, Project State

### Community 38 - "Tests"
Cohesion: 0.13
Nodes (14): 1. Logged out redirect to /login (B1), 2. Sign up with new email and display name (B2), 3. Session persistence on refresh (B3), 4. Logout and route protection (B4), 5. Login error handling (B5), 6. Redirect authenticated user away from /login (B6), 7. Client-side password length validation (B7), A. Live RLS Test (+6 more)

### Community 39 - "Codebase Structure"
Cohesion: 0.33
Nodes (5): Codebase Structure, Directory Layout, Directory Purposes, Key File Locations, Where to Add New Code

### Community 40 - "auth.ts"
Cohesion: 0.10
Nodes (26): AuthContext, AuthContextValue, publishableKey, supabase, url, SignupPage(), handleSubmit(), HomePlaceholder() (+18 more)

### Community 41 - "Technology Stack"
Cohesion: 0.25
Nodes (7): Configuration, Frameworks, Key Dependencies, Languages, Platform Requirements, Runtime, Technology Stack

### Community 42 - "Testing Patterns"
Cohesion: 0.29
Nodes (6): Mocking & Isolation, Required Pre-Shipping Checks, Test File Organization, Test Framework, Test Structure, Testing Patterns

### Community 43 - "useSession"
Cohesion: 0.14
Nodes (20): Service functions (`frontend/src/services/`), toPaiseOrNull(), unwrap(), getLatestCheckin(), getMyProfile(), listCommitments(), listPayouts(), loadRunwayInput() (+12 more)

### Community 44 - "External Integrations"
Cohesion: 0.29
Nodes (3): __dirname, __filename, mockSupabasePath

### Community 45 - "Tests"
Cohesion: 0.12
Nodes (15): 1. Currency parser unit tests, 1. New user signup routing, 2. Blank ₹ fields submission, 2. M3 Engine tests regression suite, 3. Database test suite, 3. Session refresh persistence, 4. Edit profile updates immediately, 5. Client-side validation (+7 more)

### Community 48 - "addTransaction"
Cohesion: 0.14
Nodes (17): addTransaction(), receivePayout(), assertStrictEqual(), assertTrue(), it(), runTests(), MockState, mockState (+9 more)

### Community 49 - "Phase 4: Runway Feed Verification Report"
Cohesion: 0.33
Nodes (5): Goal Achievement, Investigation Findings: Previous Aggregate Test Command Failures, M1 Data Layer & M3 Engine Integration Audit, Observable Truths, Phase 4: Runway Feed Verification Report

### Community 50 - "data.ts"
Cohesion: 0.27
Nodes (12): addCheckin(), addCommitment(), addPayout(), deleteTransaction(), listTransactions(), money(), setPayoutStatus(), updateTransaction() (+4 more)

### Community 52 - "20261120000100_init_schema.sql"
Cohesion: 0.16
Nodes (21): balance_checkins_user_time, commitments_updated_at, commitments_user_due, on_auth_user_created, payouts_guard_received, payouts_updated_at, payouts_user_date, profiles_updated_at (+13 more)

### Community 54 - "FLOVA (Udaan 2.0)"
Cohesion: 0.25
Nodes (7): 1. Database Regression Suite (PGlite), 2. Multi-Connection PostgreSQL Concurrency & Deadlock Suite, 3. Frontend Compilation & Idempotent Retry UX Suite, Current Test, Gaps, Summary, Tests

### Community 55 - "Goal Achievement"
Cohesion: 0.50
Nodes (3): Goal Achievement, Observable Truths, Phase 3: Data Capture Hooks Verification Report

### Community 56 - "v1 Requirements"
Cohesion: 0.29
Nodes (6): PGDATABASE, PGHOST, PGPASSWORD, PGPORT, PGUSER, test-concurrency-postgres.sh script

### Community 57 - "parseRequiredRupees"
Cohesion: 0.14
Nodes (15): todayLocalISO(), usePayouts(), AddTransactionPage(), handleSubmit(), CommitmentsPage(), handleAddCommitment(), PayoutsPage(), handleAddPayout() (+7 more)

### Community 58 - "FLOVA (Udaan 2.0)"
Cohesion: 0.22
Nodes (8): Business & Problem Context, Constraints & Rules for Every Phase, Core Value, FLOVA (Udaan 2.0), Key Decisions Log, Team Ownership & Boundaries, Technical Environment & Architecture, What This Is

### Community 59 - "v1 Requirements"
Cohesion: 0.18
Nodes (10): Out of Scope, Phase 1: Authentication Flow, Phase 4: Runway Feed & Engine Integration, Phase 5: Secure AI Function (Stretch), Phase 6: Demo Data Seed & Test Fixtures, Phase 7: Deployment & Production Smoke Test, Phase 8: Verify & Release Freeze, Requirements: FLOVA (M1 Backend & Database) (+2 more)

### Community 60 - "FLOVA AI Extraction Contract Specification (v1 · Owner: M3)"
Cohesion: 0.13
Nodes (14): 1. Overview & Architectural Boundaries, 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (OpenAPI 3.1 / Draft 2020-12 Compatible), 5. Five Concrete Extraction Examples, 6. Ambiguity Handling & Clarification Rules, 7. Mapping to FLOVA Application Contracts (Consumer Adapter), Architectural Rules (+6 more)

### Community 61 - "FLOVA AI Extraction Contract Specification (v1 · Owner: M3)"
Cohesion: 0.13
Nodes (14): 1. Overview & Architectural Boundaries, 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (OpenAPI 3.1 / Draft 2020-12 Compatible), 5. Five Concrete Extraction Examples, 6. Ambiguity Handling & Clarification Rules, 7. Mapping to FLOVA Application Contracts (Consumer Adapter), Architectural Rules (+6 more)

### Community 62 - "1. Locked Decisions & Core Architecture"
Cohesion: 0.22
Nodes (8): 1. Locked Decisions & Core Architecture, 2. Boundaries & Out-of-Scope, Decision 1: Database Trigger Derived Totals & Row-Level Locking, Decision 2: Status State Machine Transitions, Decision 3: Deadlock-Free Payout Reassignment, Decision 4: Client-Side Submission Idempotency, Decision 5: Security & RLS Invariants, Phase 5: Payout Synchronization Hardening - Context & Decisions

### Community 63 - "react"
Cohesion: 0.38
Nodes (8): useSession(), DataVersionContext, DataVersionContextType, useDataVersion(), useCommitments(), useLatestCheckin(), useRunway(), react

### Community 64 - "Onboarding Summary"
Cohesion: 0.29
Nodes (6): Codebase Context, Docs Context, Onboarding Summary, Project State, Recommended Next Step, Workstream & Rules

### Community 65 - "Tasks"
Cohesion: 0.29
Nodes (6): Objectives, Plan 05-01: Payout Synchronization Hardening & Idempotency, Task 0: Database Migration (`20261121000100_harden_payout_sync.sql`), Task 2: PGlite Comprehensive Regression Suite, Task 3: Real Multi-Connection PostgreSQL Concurrency Test, Tasks

### Community 67 - "VoiceCapturePage.tsx"
Cohesion: 0.15
Nodes (14): useTransactions(), btn(), card, Step, VoiceCapturePage(), handleProceedToReview(), ExpenseType, SUGGESTED_CATEGORIES (+6 more)

### Community 68 - "Phase 5: Payout Synchronization Hardening & Idempotency Verification Report"
Cohesion: 0.40
Nodes (4): Goal Achievement, Observable Truths, Phase 5: Payout Synchronization Hardening & Idempotency Verification Report, Technical Audit & Safety Bounds

### Community 71 - "WishPage.tsx"
Cohesion: 0.06
Nodes (47): ConfirmedBalanceBreakdown, handleSubmit(), OnboardingPage(), handleSubmit(), parseOptionalRupees(), req650, reqEmpty, reqZero (+39 more)

### Community 72 - "External Integrations"
Cohesion: 0.25
Nodes (7): Authentication & Identity, CI/CD & Deployment, Data Storage, Environment Configuration, External Integrations, Monitoring & Observability, Webhooks & Callbacks

### Community 73 - "toPaise"
Cohesion: 0.22
Nodes (11): formatINR(), toPaise(), CheckinPage(), HistoryPage(), handleSaveEdit(), startEdit(), handleSave(), ParseRequiredRupeesResult (+3 more)

### Community 74 - "extractTransaction.ts"
Cohesion: 0.25
Nodes (10): CATEGORY_MAP, EXPENSE_KEYWORDS, extractAmount(), extractTransaction(), guessCategory(), guessDescription(), guessExpenseType(), INCOME_KEYWORDS (+2 more)

### Community 75 - "Naming Patterns"
Cohesion: 0.18
Nodes (13): paiseToRupeeString(), BalanceCheckin, Commitment, RupeeString, WorkProfile, Code Style, Coding Conventions, Database Interaction Conventions (+5 more)

### Community 76 - "Implementation Decisions"
Cohesion: 0.18
Nodes (10): 1. Routing & Dependencies, 3. Pages & UI Presentation, 4. Authentication Workflows & Form Behavior, 5. Architectural Boundaries, 6. Backend Hygiene & Explicit Permissions, Established Patterns, Existing Code Insights, Implementation Decisions (+2 more)

### Community 77 - "Tasks"
Cohesion: 0.25
Nodes (7): Objectives, Plan 05-02: Idempotent Retry UX Fix in `addTransaction`, Task 0: Implement Idempotent Retry in `addTransaction`, Task 1: Add Comprehensive Regression Tests, Task 2: Execute Test Suites, Task 3: Verification & Documentation, Tasks

### Community 78 - "ProfileProvider.tsx"
Cohesion: 0.60
Nodes (4): ProfileContext, ProfileContextType, Profile, ProfileUpdate

## Knowledge Gaps
- **6 isolated node(s):** `udaan-engine`, `PGDATABASE`, `PGHOST`, `PGPASSWORD`, `PGPORT` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 499 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `contracts.ts`, `App.tsx`, `api.ts`, `frontend/package.json`, `VoiceCapturePage.tsx`, `Phase Details`, `WishPage.tsx`, `auth.ts`, `toPaise`, `ProfileProvider.tsx`, `data.ts`, `parseRequiredRupees`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `toPaise()` (e.g. with `Architectural Rules` and `Rules everyone follows`) actually correct?**
  _`toPaise()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `udaan-engine`, `PGDATABASE`, `PGHOST` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `test_engine.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06680080482897384 - nodes in this community are weakly interconnected._
- **Why does `toPaise()` connect `toPaise` to `VoiceCapturePage.tsx`, `Phase Details`, `FLOVA data contract (v1 · owner: M1)`, `WishPage.tsx`, `useSession`, `Naming Patterns`, `addTransaction`, `data.ts`, `parseRequiredRupees`, `FLOVA AI Extraction Contract Specification (v1 · Owner: M3)`, `FLOVA AI Extraction Contract Specification (v1 · Owner: M3)`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `useSession()` (e.g. with `Layers` and `Primary Runway Feed Path`) actually correct?**
  _`useSession()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `contracts.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10476190476190476 - nodes in this community are weakly interconnected._