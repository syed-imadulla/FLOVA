# Graph Report - FLOVA  (2026-11-21)

## Corpus Check
- 162 files · ~92,660 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .example 3, (none) 2, .css 1)

## Summary
- 1049 nodes · 2056 edges · 78 communities (51 shown, 27 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 174 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d71ac9ec`
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
- toPaise
- FLOVA Financial Engine (M3)
- FLOVA — M1 Edge Function Integration Contract (Owner: M3 / AI Engine)
- Project State
- Tests
- Architecture
- extractTransaction.ts
- Technology Stack
- Testing Patterns
- toPaise
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
- Observable Truths
- FLOVA (Udaan 2.0)
- v1 Requirements
- FLOVA AI Extraction Contract Specification (v1 · Owner: M3)
- FLOVA AI Extraction Contract Specification (v1 · Owner: M3)
- index.ts
- Objectives
- Onboarding Summary
- Decisions
- Phase 1: Auth Flow Summary
- rls-live-check.mjs
- parseRupees.test.ts
- External Integrations
- Implementation Decisions
- Codebase Concerns
- Codebase Structure
- Goal Achievement
- Coding Conventions
- dates.test.ts

## God Nodes (most connected - your core abstractions)
1. `toPaise()` - 40 edges
2. `react` - 30 edges
3. `useSession()` - 27 edges
4. `loadRunwayInput()` - 23 edges
5. `todayLocalISO()` - 21 edges
6. `formatINR()` - 21 edges
7. `parseRequiredRupees()` - 21 edges
8. `RunwayInput` - 20 edges
9. `App()` - 18 edges
10. `useTransactions()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Endpoint` --references--> `FinancialExtractionDTO`  [INFERRED]
  ai-engine/M1_GROQ_INTEGRATION.md → frontend/src/engine/extractionTypes.ts
- `Mode 1: Audio Input (Microphone Recording)` --references--> `FinancialExtractionDTO`  [INFERRED]
  ai-engine/M1_GROQ_INTEGRATION.md → frontend/src/engine/extractionTypes.ts
- `Mode 2: Typed Text / Transcript Input (Direct Extraction)` --references--> `FinancialExtractionDTO`  [INFERRED]
  ai-engine/M1_GROQ_INTEGRATION.md → frontend/src/engine/extractionTypes.ts
- `Response Body` --references--> `FinancialExtractionDTO`  [INFERRED]
  ai-engine/M1_GROQ_INTEGRATION.md → frontend/src/engine/extractionTypes.ts
- `Pattern Overview` --references--> `toPaise()`  [INFERRED]
  .planning/codebase/ARCHITECTURE.md → frontend/src/lib/money.ts

## Import Cycles
- None detected.

## Communities (78 total, 27 thin omitted)

### Community 0 - "test_engine.py"
Cohesion: 0.07
Nodes (36): test_backtest_shape(), test_buffer_never_negative_and_money_is_conserved(), test_estimate_ignores_one_big_week(), test_estimate_with_little_history_is_cautious(), test_generate_year_is_reproducible(), test_lean_week_is_covered_by_buffer(), test_low_income_is_not_called_a_timing_problem(), test_negative_income_week_handled() (+28 more)

### Community 1 - "contracts.ts"
Cohesion: 0.09
Nodes (22): ProfileContextType, APP_LANGUAGES, AppLanguage, COMMITMENT_KINDS, COMMITMENT_STATUSES, CommitmentKind, ENTRY_SOURCES, EntrySource (+14 more)

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
Cohesion: 0.15
Nodes (12): Overview, Phase 1: Auth flow, Phase 2: Profile & onboarding data, Phase 4: Runway feed, Phase 5: Payout Synchronization Hardening, Phase 6: Demo data, Phase 7: Deployment, Phase 8: Verify & freeze (+4 more)

### Community 6 - "FLOVA data contract (v1 · owner: M1)"
Cohesion: 0.08
Nodes (22): Branches, Definition of done for any pull request, Every working session, Graphify: required for everyone, One-time setup (each member, each laptop), Who owns what, Working on FLOVA (team rules for the 24-hour build), `balance_checkins` (actual cash + bank at a moment) (+14 more)

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
Cohesion: 0.05
Nodes (81): Frontend data hooks (`frontend/src/data/`), App(), AuthContext, AuthContextValue, AuthProvider(), RedirectIfAuthed(), RequireAuth(), useSession() (+73 more)

### Community 35 - "FLOVA Financial Engine (M3)"
Cohesion: 0.20
Nodes (9): Architectural Principles, Calculation Semantics (Option A), FLOVA Financial Engine (M3), Historical Ravi Fixture Preservation, Key Rules:, Option A: Remaining Daily Budget Logic, Problem Addressed, Results: (+1 more)

### Community 36 - "FLOVA — M1 Edge Function Integration Contract (Owner: M3 / AI Engine)"
Cohesion: 0.18
Nodes (10): 2. Canonical Edge Function Endpoint Specification: `process-voice`, 3. Dedicated Receipt Extraction Endpoint: `extract-receipt`, 4. Groq API Implementation Details for M1, 5. End-to-End Sequence Flow, Endpoint, Endpoint, FLOVA — M1 Edge Function Integration Contract (Owner: M3 / AI Engine), Mode 1: Audio Input (Microphone Recording) (+2 more)

### Community 37 - "Project State"
Cohesion: 0.40
Nodes (4): Current Position, Performance Metrics, Project Reference, Project State

### Community 38 - "Tests"
Cohesion: 0.13
Nodes (14): 1. Logged out redirect to /login (B1), 2. Sign up with new email and display name (B2), 3. Session persistence on refresh (B3), 4. Logout and route protection (B4), 5. Login error handling (B5), 6. Redirect authenticated user away from /login (B6), 7. Client-side password length validation (B7), A. Live RLS Test (+6 more)

### Community 39 - "Architecture"
Cohesion: 0.22
Nodes (8): Architectural Constraints, Architecture, Component Responsibilities, Data Flow, Entry Points, Error Handling, Pattern Overview, System Overview

### Community 40 - "extractTransaction.ts"
Cohesion: 0.25
Nodes (10): CATEGORY_MAP, EXPENSE_KEYWORDS, extractAmount(), extractTransaction(), guessCategory(), guessDescription(), guessExpenseType(), INCOME_KEYWORDS (+2 more)

### Community 41 - "Technology Stack"
Cohesion: 0.25
Nodes (7): Configuration, Frameworks, Key Dependencies, Languages, Platform Requirements, Runtime, Technology Stack

### Community 42 - "Testing Patterns"
Cohesion: 0.29
Nodes (6): Mocking & Isolation, Required Pre-Shipping Checks, Test File Organization, Test Framework, Test Structure, Testing Patterns

### Community 43 - "toPaise"
Cohesion: 0.21
Nodes (17): Rules everyone follows, Service functions (`frontend/src/services/`), paiseToRupeeString(), toPaise(), toPaiseOrNull(), startEdit(), startReceive(), getLatestCheckin() (+9 more)

### Community 44 - "External Integrations"
Cohesion: 0.29
Nodes (3): __dirname, __filename, mockSupabasePath

### Community 45 - "Tests"
Cohesion: 0.12
Nodes (15): 1. Currency parser unit tests, 1. New user signup routing, 2. Blank ₹ fields submission, 2. M3 Engine tests regression suite, 3. Database test suite, 3. Session refresh persistence, 4. Edit profile updates immediately, 5. Client-side validation (+7 more)

### Community 48 - "addTransaction"
Cohesion: 0.05
Nodes (42): addTransaction(), receivePayout(), assertStrictEqual(), assertTrue(), it(), runTests(), MockState, mockState (+34 more)

### Community 49 - "Phase 4: Runway Feed Verification Report"
Cohesion: 0.33
Nodes (5): Goal Achievement, Investigation Findings: Previous Aggregate Test Command Failures, M1 Data Layer & M3 Engine Integration Audit, Observable Truths, Phase 4: Runway Feed Verification Report

### Community 50 - "data.ts"
Cohesion: 0.20
Nodes (18): publishableKey, supabase, unwrap(), url, addCheckin(), addCommitment(), addPayout(), deleteTransaction() (+10 more)

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

### Community 57 - "Observable Truths"
Cohesion: 0.50
Nodes (3): Goal Achievement, Observable Truths, Phase 2: Profile & Onboarding Data Verification Report

### Community 58 - "FLOVA (Udaan 2.0)"
Cohesion: 0.18
Nodes (10): Business & Problem Context, Constraints & Rules for Every Phase, Core Value, FLOVA (Udaan 2.0), Key Decisions Log, Out of Scope, Requirements, Team Ownership & Boundaries (+2 more)

### Community 59 - "v1 Requirements"
Cohesion: 0.17
Nodes (11): Out of Scope, Phase 1: Authentication Flow, Phase 2: Profile & Onboarding Data, Phase 4: Runway Feed & Engine Integration, Phase 5: Secure AI Function (Stretch), Phase 6: Demo Data Seed & Test Fixtures, Phase 7: Deployment & Production Smoke Test, Phase 8: Verify & Release Freeze (+3 more)

### Community 60 - "FLOVA AI Extraction Contract Specification (v1 · Owner: M3)"
Cohesion: 0.15
Nodes (12): 1. Overview & Architectural Boundaries, 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (Draft 2020-12 Compatible), 5. Concrete Extraction Examples, 6. M1 Backend & Edge Function Integration, Architectural Rules, Example 1: Multi-Transaction Sentence (Income + Expense) (+4 more)

### Community 61 - "FLOVA AI Extraction Contract Specification (v1 · Owner: M3)"
Cohesion: 0.15
Nodes (12): 1. Overview & Architectural Boundaries, 2. Existing FLOVA Contract Enum Alignment, 3. TypeScript DTO Definitions, 4. Strict JSON Schema (Draft 2020-12 Compatible), 5. Concrete Extraction Examples, 6. M1 Backend & Edge Function Integration, Architectural Rules, Example 1: Multi-Transaction Sentence (Income + Expense) (+4 more)

### Community 62 - "index.ts"
Cohesion: 0.05
Nodes (97): 1. Overview & Ownership Boundaries, calculateConfirmedBalance(), ConfirmedBalanceBreakdown, ConfirmedBalanceResult, ConfirmedBalanceStatus, candidateToNewTransaction(), confirmCandidateTransaction(), deriveDeterministicUUID() (+89 more)

### Community 64 - "Onboarding Summary"
Cohesion: 0.29
Nodes (6): Codebase Context, Docs Context, Onboarding Summary, Project State, Recommended Next Step, Workstream & Rules

### Community 67 - "Phase 1: Auth Flow Summary"
Cohesion: 0.22
Nodes (8): 1. Executive Summary, 2. Key Deliverables & Changes, 3. Verification & Quality Gates, 4. Note for M2 (Frontend/UI), 5. Next Steps, Database & Backend Hygiene, Pages & App Wiring, Phase 1: Auth Flow Summary

### Community 71 - "parseRupees.test.ts"
Cohesion: 0.18
Nodes (10): req650, reqEmpty, reqZero, res200, res995, resAbc, resDec, resEmpty (+2 more)

### Community 72 - "External Integrations"
Cohesion: 0.25
Nodes (7): Authentication & Identity, CI/CD & Deployment, Data Storage, Environment Configuration, External Integrations, Monitoring & Observability, Webhooks & Callbacks

### Community 73 - "Implementation Decisions"
Cohesion: 0.14
Nodes (13): 1. Routing & Dependencies, 2. Auth Context & Session Management, 3. Pages & UI Presentation, 4. Authentication Workflows & Form Behavior, 5. Architectural Boundaries, 6. Backend Hygiene & Explicit Permissions, Established Patterns, Existing Code Insights (+5 more)

### Community 75 - "Codebase Concerns"
Cohesion: 0.50
Nodes (3): Codebase Concerns, Fragile Areas, Security Considerations

### Community 78 - "Codebase Structure"
Cohesion: 0.33
Nodes (5): Codebase Structure, Directory Layout, Directory Purposes, Key File Locations, Where to Add New Code

### Community 82 - "Coding Conventions"
Cohesion: 0.20
Nodes (11): BalanceCheckin, Payout, RupeeString, WorkProfile, Code Style, Coding Conventions, Database Interaction Conventions, Error Handling (+3 more)

### Community 85 - "dates.test.ts"
Cohesion: 0.40
Nodes (4): d1, d2, iso1, iso2

## Knowledge Gaps
- **8 isolated node(s):** `RFC-4122`, `RFC-4122`, `udaan-engine`, `PGDATABASE`, `PGHOST` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 497 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `toPaise()` connect `toPaise` to `toPaise`, `Architecture`, `addTransaction`, `data.ts`, `Coding Conventions`, `FLOVA AI Extraction Contract Specification (v1 · Owner: M3)`, `FLOVA AI Extraction Contract Specification (v1 · Owner: M3)`, `index.ts`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `toPaise()` (e.g. with `Architectural Rules` and `Rules everyone follows`) actually correct?**
  _`toPaise()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-4122`, `RFC-4122`, `udaan-engine` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `test_engine.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06680080482897384 - nodes in this community are weakly interconnected._
- **Why does `react` connect `toPaise` to `data.ts`, `api.ts`, `frontend/package.json`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `useSession()` (e.g. with `Layers` and `Primary Runway Feed Path`) actually correct?**
  _`useSession()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `contracts.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._