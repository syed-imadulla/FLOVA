# Graph Report - FLOVA  (2026-11-21)

## Corpus Check
- 154 files · ~82,945 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .css 4, (none) 2, .example 2)

## Summary
- 958 nodes · 1872 edges · 75 communities (49 shown, 26 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 147 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a33c7272`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- test_engine.py
- contracts.ts
- VERDICT — pick-f1-irregular-income
- data.ts
- frontend/package.json
- 20261120000100_init_schema.sql
- FLOVA data contract (v1 · owner: M1)
- backend/package.json
- STATEMENTS — The Big Hack 2.0
- auth.ts
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
- loader.mjs
- toPaise
- FLOVA Hero Section Blueprint: Video 1 Deep Analysis
- contracts.ts
- 2. Band-by-Band Cadence in Video 2
- money.ts
- Service functions (`frontend/src/services/`)
- Implementation Decisions
- Technology Stack
- Testing Patterns
- parseRupees.test.ts
- External Integrations
- Tests
- 01-01-PLAN.md
- Plan 02-01: Profile and Onboarding Persistence
- auth.ts
- Phase 4: Runway Feed Verification Report
- auth.ts
- Plan 03-01: Data Capture Hooks and Pages
- react
- useTransactions
- Goal Achievement
- App.tsx
- Phase Details
- OneRupeeCoin
- useSession
- FLOVA (Udaan 2.0)
- v1 Requirements
- FLOVA Financial Engine (M3)
- Architecture
- Coding Conventions
- Onboarding Summary
- Phase 1: Auth Flow Summary
- Project State
- Observable Truths
- ProfileProvider.tsx
- react
- rls-live-check.mjs
- Objectives
- Decisions

## God Nodes (most connected - your core abstractions)
1. `react` - 46 edges
2. `useSession()` - 27 edges
3. `toPaise()` - 25 edges
4. `loadRunwayInput()` - 23 edges
5. `App()` - 20 edges
6. `RunwayInput` - 20 edges
7. `formatINR()` - 18 edges
8. `parseRequiredRupees()` - 18 edges
9. `SelfSalary` - 17 edges
10. `react-router-dom` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Phase Boundary` --references--> `useSession()`  [INFERRED]
  .planning/phases/01-auth-flow/01-CONTEXT.md → frontend/src/auth/useSession.ts
- `Phase 1: Authentication Flow` --references--> `useSession()`  [INFERRED]
  .planning/REQUIREMENTS.md → frontend/src/auth/useSession.ts
- `Phase 1: Auth flow` --references--> `useSession()`  [INFERRED]
  .planning/ROADMAP.md → frontend/src/auth/useSession.ts
- `Monitoring & Observability` --references--> `unwrap()`  [INFERRED]
  .planning/codebase/INTEGRATIONS.md → frontend/src/lib/supabase.ts
- `Component Responsibilities` --references--> `loadRunwayInput()`  [INFERRED]
  .planning/codebase/ARCHITECTURE.md → frontend/src/services/data.ts

## Import Cycles
- None detected.

## Communities (75 total, 26 thin omitted)

### Community 0 - "test_engine.py"
Cohesion: 0.07
Nodes (36): test_backtest_shape(), test_buffer_never_negative_and_money_is_conserved(), test_estimate_ignores_one_big_week(), test_estimate_with_little_history_is_cautious(), test_generate_year_is_reproducible(), test_lean_week_is_covered_by_buffer(), test_low_income_is_not_called_a_timing_problem(), test_negative_income_week_handled() (+28 more)

### Community 1 - "contracts.ts"
Cohesion: 0.09
Nodes (31): deleteTransaction(), APP_LANGUAGES, BalanceCheckin, COMMITMENT_KINDS, COMMITMENT_STATUSES, CommitmentKind, ENTRY_SOURCES, EntrySource (+23 more)

### Community 2 - "VERDICT — pick-f1-irregular-income"
Cohesion: 0.05
Nodes (40): An alternative approach (same problem, same user), Contradictions between jurors, If I were your team…, Next experiment (30 min), Ranked improvements, Ratings /10, VERDICT — pick-f1-irregular-income, Votes (+32 more)

### Community 3 - "data.ts"
Cohesion: 0.19
Nodes (18): DataVersionContext, DataVersionContextType, unwrap(), addCheckin(), addCommitment(), addPayout(), addTransaction(), listCommitments() (+10 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.09
Nodes (26): dependencies, react@18.3.1, react-dom@18.3.1, react-router-dom@^6.30.6, @supabase/supabase-js@^2.119.2, devDependencies, @types/react@18.3.12, @types/react-dom@18.3.1 (+18 more)

### Community 5 - "20261120000100_init_schema.sql"
Cohesion: 0.16
Nodes (21): balance_checkins_user_time, commitments_updated_at, commitments_user_due, on_auth_user_created, payouts_guard_received, payouts_updated_at, payouts_user_date, profiles_updated_at (+13 more)

### Community 6 - "FLOVA data contract (v1 · owner: M1)"
Cohesion: 0.08
Nodes (22): Branches, Definition of done for any pull request, Every working session, Graphify: required for everyone, One-time setup (each member, each laptop), Who owns what, Working on FLOVA (team rules for the 24-hour build), `balance_checkins` (actual cash + bank at a moment) (+14 more)

### Community 7 - "backend/package.json"
Cohesion: 0.10
Nodes (18): description, devDependencies, @electric-sql/pglite@^0.5.17, @supabase/supabase-js@^2.119.2, @supabase/supabase-js, name, private, scripts (+10 more)

### Community 8 - "STATEMENTS — The Big Hack 2.0"
Cohesion: 0.12
Nodes (15): Dropped, First read: fit with our team and the booklet rubric [AI], ⚠ Rubric conflict (resolved 14:15 IST: team uses the booklet rubric), Statement B1: Know what you're signing, Statement B2: Fair tickets, Statement B3: Logs the attacker can't erase, Statement F1: The irregular income problem, Statement F2: Credit for the credit-invisible (+7 more)

### Community 9 - "auth.ts"
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

### Community 33 - "loader.mjs"
Cohesion: 0.10
Nodes (20): 10. Form state preservation on tab switch, 1. Balance check-in and COD bounds, 1. Currency parser unit tests, 2. Add income and expense transactions, 2. Local date formatting unit tests, 3. Expense Living/Work validation, 3. M3 Engine tests regression suite, 4. COD not-mine transaction (+12 more)

### Community 34 - "toPaise"
Cohesion: 0.10
Nodes (32): Rules everyone follows, formatINR(), paiseToRupeeString(), toPaise(), toPaiseOrNull(), AddTransactionPage(), handleSubmit(), CheckinPage() (+24 more)

### Community 35 - "FLOVA Hero Section Blueprint: Video 1 Deep Analysis"
Cohesion: 0.20
Nodes (9): 1. Canvas, Background Surface & Spatial Framing, 2. Top Navigation Bar (Fixed / Sticky Editorial Header), 3. Centered Typography Lockup & Easing Choreography, 4. Central Focal Visual (Centerpiece), 5. Hand-Drawn Sketch Annotations, Medallion & Secondary Visuals, 6. Reveal on Scroll (Sub-Hero Section at `t = 12s–17.8s`), 7. Motion Choreography & Parallax Execution Plan, 8. Readiness Checklist for Video 2 & Master Build (+1 more)

### Community 36 - "contracts.ts"
Cohesion: 0.10
Nodes (47): d1, d2, iso1, iso2, calculateConfirmedBalance(), ConfirmedBalanceBreakdown, ConfirmedBalanceResult, ConfirmedBalanceStatus (+39 more)

### Community 37 - "2. Band-by-Band Cadence in Video 2"
Cohesion: 0.13
Nodes (14): 1. Hero-to-Followup 1-Rupee Indian Coin Morph Transition, 2. Band-by-Band Cadence in Video 2, 3. Currency & Data Rules Mapping (FLOVA Contract Compliance), 4. Master Build Roadmap (Step 3 Preview), Band 1: Dark Feature Showcase Card (`#111214` / `#141517`), Band 2: 4-Column Feature & Value Strip (Light Paper Surface), Band 3: Fine-Grid Testimonial & Real Worker Stories Band, Band 4: Vibrant Cyan/Aqua Callout Banner (`#25DCF5` / `#00D2F0`) (+6 more)

### Community 38 - "money.ts"
Cohesion: 0.13
Nodes (14): 1. Logged out redirect to /login (B1), 2. Sign up with new email and display name (B2), 3. Session persistence on refresh (B3), 4. Logout and route protection (B4), 5. Login error handling (B5), 6. Redirect authenticated user away from /login (B6), 7. Client-side password length validation (B7), A. Live RLS Test (+6 more)

### Community 39 - "Service functions (`frontend/src/services/`)"
Cohesion: 0.33
Nodes (5): Codebase Structure, Directory Layout, Directory Purposes, Key File Locations, Where to Add New Code

### Community 40 - "Implementation Decisions"
Cohesion: 0.14
Nodes (13): 1. Routing & Dependencies, 2. Auth Context & Session Management, 3. Pages & UI Presentation, 4. Authentication Workflows & Form Behavior, 5. Architectural Boundaries, 6. Backend Hygiene & Explicit Permissions, Established Patterns, Existing Code Insights (+5 more)

### Community 41 - "Technology Stack"
Cohesion: 0.25
Nodes (7): Configuration, Frameworks, Key Dependencies, Languages, Platform Requirements, Runtime, Technology Stack

### Community 42 - "Testing Patterns"
Cohesion: 0.29
Nodes (6): Mocking & Isolation, Required Pre-Shipping Checks, Test File Organization, Test Framework, Test Structure, Testing Patterns

### Community 43 - "parseRupees.test.ts"
Cohesion: 0.18
Nodes (10): req650, reqEmpty, reqZero, res200, res995, resAbc, resDec, resEmpty (+2 more)

### Community 44 - "External Integrations"
Cohesion: 0.25
Nodes (7): Authentication & Identity, CI/CD & Deployment, Data Storage, Environment Configuration, External Integrations, Monitoring & Observability, Webhooks & Callbacks

### Community 45 - "Tests"
Cohesion: 0.12
Nodes (15): 1. Currency parser unit tests, 1. New user signup routing, 2. Blank ₹ fields submission, 2. M3 Engine tests regression suite, 3. Database test suite, 3. Session refresh persistence, 4. Edit profile updates immediately, 5. Client-side validation (+7 more)

### Community 48 - "auth.ts"
Cohesion: 0.24
Nodes (12): AuthProvider(), SignupPage(), handleSubmit(), getSession(), onAuthChange(), signUp(), APIs & External Services, Authentication & Routing Infrastructure (+4 more)

### Community 49 - "Phase 4: Runway Feed Verification Report"
Cohesion: 0.33
Nodes (5): Goal Achievement, Investigation Findings: Previous Aggregate Test Command Failures, M1 Data Layer & M3 Engine Integration Audit, Observable Truths, Phase 4: Runway Feed Verification Report

### Community 50 - "auth.ts"
Cohesion: 0.31
Nodes (6): publishableKey, supabase, url, LoginPage(), handleSubmit(), signIn()

### Community 52 - "react"
Cohesion: 0.06
Nodes (66): api, BacktestRow, OutlookWeek, Plan, Profile, Rider, rs(), Status (+58 more)

### Community 54 - "useTransactions"
Cohesion: 0.24
Nodes (14): Frontend data hooks (`frontend/src/data/`), useDataVersion(), useCommitments(), useLatestCheckin(), usePayouts(), useTransactions(), receivePayout(), Deferred Ideas (+6 more)

### Community 55 - "Goal Achievement"
Cohesion: 0.50
Nodes (3): Goal Achievement, Observable Truths, Phase 3: Data Capture Hooks Verification Report

### Community 56 - "App.tsx"
Cohesion: 0.18
Nodes (18): AddTransactionPage, App(), AuthProvider, CheckinPage, CommitmentsPage, DataVersionProvider, HistoryPage, HomePlaceholder (+10 more)

### Community 57 - "Phase Details"
Cohesion: 0.15
Nodes (12): Overview, Phase 1: Auth flow, Phase 2: Profile & onboarding data, Phase 4: Runway feed, Phase 5: Secure AI function (stretch), Phase 6: Demo data, Phase 7: Deployment, Phase 8: Verify & freeze (+4 more)

### Community 58 - "OneRupeeCoin"
Cohesion: 0.26
Nodes (8): HeroSection(), HeroSectionProps, LandingSections(), LandingSectionsProps, OneRupeeCoin(), OneRupeeCoinProps, MorphBridgeProps, OneRupeeMorphBridge()

### Community 59 - "useSession"
Cohesion: 0.18
Nodes (21): Service functions (`frontend/src/services/`), useSession(), todayLocalISO(), HomePlaceholder(), handleLogout(), useProfile(), useRunway(), signOut() (+13 more)

### Community 60 - "FLOVA (Udaan 2.0)"
Cohesion: 0.18
Nodes (10): Business & Problem Context, Constraints & Rules for Every Phase, Core Value, FLOVA (Udaan 2.0), Key Decisions Log, Out of Scope, Requirements, Team Ownership & Boundaries (+2 more)

### Community 61 - "v1 Requirements"
Cohesion: 0.18
Nodes (10): Out of Scope, Phase 1: Authentication Flow, Phase 4: Runway Feed & Engine Integration, Phase 5: Secure AI Function (Stretch), Phase 6: Demo Data Seed & Test Fixtures, Phase 7: Deployment & Production Smoke Test, Phase 8: Verify & Release Freeze, Requirements: FLOVA (M1 Backend & Database) (+2 more)

### Community 62 - "FLOVA Financial Engine (M3)"
Cohesion: 0.20
Nodes (9): Architectural Principles, Calculation Semantics (Option A), FLOVA Financial Engine (M3), Historical Ravi Fixture Preservation, Key Rules:, Option A: Remaining Daily Budget Logic, Problem Addressed, Results: (+1 more)

### Community 63 - "Architecture"
Cohesion: 0.22
Nodes (8): Architectural Constraints, Architecture, Component Responsibilities, Data Flow, Entry Points, Error Handling, Pattern Overview, System Overview

### Community 64 - "Coding Conventions"
Cohesion: 0.40
Nodes (4): Coding Conventions, Database Interaction Conventions, Error Handling, Import Organization

### Community 65 - "Onboarding Summary"
Cohesion: 0.29
Nodes (6): Codebase Context, Docs Context, Onboarding Summary, Project State, Recommended Next Step, Workstream & Rules

### Community 66 - "Phase 1: Auth Flow Summary"
Cohesion: 0.22
Nodes (8): 1. Executive Summary, 2. Key Deliverables & Changes, 3. Verification & Quality Gates, 4. Note for M2 (Frontend/UI), 5. Next Steps, Database & Backend Hygiene, Pages & App Wiring, Phase 1: Auth Flow Summary

### Community 67 - "Project State"
Cohesion: 0.40
Nodes (4): Current Position, Performance Metrics, Project Reference, Project State

### Community 69 - "ProfileProvider.tsx"
Cohesion: 0.29
Nodes (7): ProfileContext, ProfileContextType, ProfileProvider(), Profile, ProfileUpdate, Key Accomplishments, Phase 2: Profile & Onboarding Data Summary

### Community 71 - "react"
Cohesion: 0.27
Nodes (7): AuthContext, AuthContextValue, RedirectIfAuthed(), RequireAuth(), RequireOnboarded(), react, react-router-dom

## Knowledge Gaps
- **1 isolated node(s):** `udaan-engine`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 450 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `contracts.ts`, `toPaise`, `data.ts`, `frontend/package.json`, `ProfileProvider.tsx`, `auth.ts`, `auth.ts`, `react`, `App.tsx`, `OneRupeeCoin`, `useSession`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `useSession()` (e.g. with `Layers` and `Primary Runway Feed Path`) actually correct?**
  _`useSession()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `udaan-engine` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `test_engine.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06680080482897384 - nodes in this community are weakly interconnected._
- **Why does `RunwayInput` connect `contracts.ts` to `contracts.ts`, `data.ts`, `Phase Details`, `useSession`, `v1 Requirements`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `toPaise()` (e.g. with `Rules everyone follows` and `Key Abstractions`) actually correct?**
  _`toPaise()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `contracts.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08571428571428572 - nodes in this community are weakly interconnected._