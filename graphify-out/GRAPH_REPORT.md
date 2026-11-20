# Graph Report - FLOVA  (2026-11-20)

## Corpus Check
- 135 files · ~68,006 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 2, .css 1)

## Summary
- 844 nodes · 1596 edges · 67 communities (43 shown, 24 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 145 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7cd7ef47`
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
- Phase 1: Auth flow - Context
- Technology Stack
- Testing Patterns
- parseRupees.test.ts
- External Integrations
- Tests
- 01-01-PLAN.md
- Plan 02-01: Profile and Onboarding Persistence
- auth.ts
- Phase 4: Runway Feed Verification Report
- rls-live-check.mjs
- Plan 03-01: Data Capture Hooks and Pages
- 20261120000100_init_schema.sql
- FLOVA (Udaan 2.0)
- Goal Achievement
- v1 Requirements
- Architecture
- signOut
- Coding Conventions
- Onboarding Summary
- onAuthChange
- Phase 1: Auth Flow Summary
- getSession
- Implementation Decisions
- Key Accomplishments

## God Nodes (most connected - your core abstractions)
1. `react` - 28 edges
2. `useSession()` - 27 edges
3. `toPaise()` - 25 edges
4. `loadRunwayInput()` - 23 edges
5. `RunwayInput` - 20 edges
6. `formatINR()` - 18 edges
7. `parseRequiredRupees()` - 18 edges
8. `SelfSalary` - 17 edges
9. `App()` - 17 edges
10. `todayLocalISO()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Phase Boundary` --references--> `useSession()`  [INFERRED]
  .planning/phases/01-auth-flow/01-CONTEXT.md → frontend/src/auth/useSession.ts
- `Phase 1: Authentication Flow` --references--> `useSession()`  [INFERRED]
  .planning/REQUIREMENTS.md → frontend/src/auth/useSession.ts
- `Phase 1: Auth flow` --references--> `useSession()`  [INFERRED]
  .planning/ROADMAP.md → frontend/src/auth/useSession.ts
- `Pattern Overview` --references--> `toPaise()`  [INFERRED]
  .planning/codebase/ARCHITECTURE.md → frontend/src/lib/money.ts
- `Monitoring & Observability` --references--> `unwrap()`  [INFERRED]
  .planning/codebase/INTEGRATIONS.md → frontend/src/lib/supabase.ts

## Import Cycles
- None detected.

## Communities (67 total, 24 thin omitted)

### Community 0 - "test_engine.py"
Cohesion: 0.07
Nodes (36): test_backtest_shape(), test_buffer_never_negative_and_money_is_conserved(), test_estimate_ignores_one_big_week(), test_estimate_with_little_history_is_cautious(), test_generate_year_is_reproducible(), test_lean_week_is_covered_by_buffer(), test_low_income_is_not_called_a_timing_problem(), test_negative_income_week_handled() (+28 more)

### Community 1 - "contracts.ts"
Cohesion: 0.05
Nodes (85): Frontend data hooks (`frontend/src/data/`), Service functions (`frontend/src/services/`), useSession(), DataVersionContext, DataVersionContextType, useDataVersion(), useCommitments(), useLatestCheckin() (+77 more)

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
Nodes (12): Overview, Phase 1: Auth flow, Phase 2: Profile & onboarding data, Phase 4: Runway feed, Phase 5: Secure AI function (stretch), Phase 6: Demo data, Phase 7: Deployment, Phase 8: Verify & freeze (+4 more)

### Community 6 - "FLOVA data contract (v1 · owner: M1)"
Cohesion: 0.08
Nodes (22): Branches, Definition of done for any pull request, Every working session, Graphify: required for everyone, One-time setup (each member, each laptop), Who owns what, Working on FLOVA (team rules for the 24-hour build), `balance_checkins` (actual cash + bank at a moment) (+14 more)

### Community 7 - "backend/package.json"
Cohesion: 0.10
Nodes (18): description, devDependencies, @electric-sql/pglite@^0.5.17, @supabase/supabase-js@^2.119.2, @supabase/supabase-js, name, private, scripts (+10 more)

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
Cohesion: 0.08
Nodes (46): Rules everyone follows, App(), AuthProvider(), RedirectIfAuthed(), RequireAuth(), DataVersionProvider(), todayLocalISO(), formatINR() (+38 more)

### Community 35 - "FLOVA Financial Engine (M3)"
Cohesion: 0.20
Nodes (9): Architectural Principles, Calculation Semantics (Option A), FLOVA Financial Engine (M3), Historical Ravi Fixture Preservation, Key Rules:, Option A: Remaining Daily Budget Logic, Problem Addressed, Results: (+1 more)

### Community 36 - "index.ts"
Cohesion: 0.10
Nodes (47): d1, d2, iso1, iso2, calculateConfirmedBalance(), ConfirmedBalanceBreakdown, ConfirmedBalanceResult, ConfirmedBalanceStatus (+39 more)

### Community 37 - "Project State"
Cohesion: 0.40
Nodes (4): Current Position, Performance Metrics, Project Reference, Project State

### Community 38 - "Tests"
Cohesion: 0.13
Nodes (14): 1. Logged out redirect to /login (B1), 2. Sign up with new email and display name (B2), 3. Session persistence on refresh (B3), 4. Logout and route protection (B4), 5. Login error handling (B5), 6. Redirect authenticated user away from /login (B6), 7. Client-side password length validation (B7), A. Live RLS Test (+6 more)

### Community 39 - "Codebase Structure"
Cohesion: 0.33
Nodes (5): Codebase Structure, Directory Layout, Directory Purposes, Key File Locations, Where to Add New Code

### Community 40 - "Phase 1: Auth flow - Context"
Cohesion: 0.25
Nodes (7): Canonical References, Established Patterns, Existing Code Insights, Integration Points, Phase 1: Auth flow - Context, Phase Boundary, Reusable Assets

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
Cohesion: 0.18
Nodes (10): handleSubmit(), signIn(), APIs & External Services, Authentication & Identity, CI/CD & Deployment, Data Storage, Environment Configuration, External Integrations (+2 more)

### Community 45 - "Tests"
Cohesion: 0.12
Nodes (15): 1. Currency parser unit tests, 1. New user signup routing, 2. Blank ₹ fields submission, 2. M3 Engine tests regression suite, 3. Database test suite, 3. Session refresh persistence, 4. Edit profile updates immediately, 5. Client-side validation (+7 more)

### Community 48 - "auth.ts"
Cohesion: 0.31
Nodes (5): AuthContext, AuthContextValue, publishableKey, supabase, url

### Community 49 - "Phase 4: Runway Feed Verification Report"
Cohesion: 0.33
Nodes (5): Goal Achievement, Investigation Findings: Previous Aggregate Test Command Failures, M1 Data Layer & M3 Engine Integration Audit, Observable Truths, Phase 4: Runway Feed Verification Report

### Community 52 - "20261120000100_init_schema.sql"
Cohesion: 0.16
Nodes (21): balance_checkins_user_time, commitments_updated_at, commitments_user_due, on_auth_user_created, payouts_guard_received, payouts_updated_at, payouts_user_date, profiles_updated_at (+13 more)

### Community 54 - "FLOVA (Udaan 2.0)"
Cohesion: 0.18
Nodes (10): Business & Problem Context, Constraints & Rules for Every Phase, Core Value, FLOVA (Udaan 2.0), Key Decisions Log, Out of Scope, Requirements, Team Ownership & Boundaries (+2 more)

### Community 55 - "Goal Achievement"
Cohesion: 0.50
Nodes (3): Goal Achievement, Observable Truths, Phase 3: Data Capture Hooks Verification Report

### Community 56 - "v1 Requirements"
Cohesion: 0.18
Nodes (10): Out of Scope, Phase 1: Authentication Flow, Phase 4: Runway Feed & Engine Integration, Phase 5: Secure AI Function (Stretch), Phase 6: Demo Data Seed & Test Fixtures, Phase 7: Deployment & Production Smoke Test, Phase 8: Verify & Release Freeze, Requirements: FLOVA (M1 Backend & Database) (+2 more)

### Community 57 - "Architecture"
Cohesion: 0.20
Nodes (9): Architectural Constraints, Architecture, Component Responsibilities, Data Flow, Entry Points, Error Handling, Layers, Pattern Overview (+1 more)

### Community 58 - "signOut"
Cohesion: 0.29
Nodes (6): handleLogout(), signOut(), 4. Authentication Workflows & Form Behavior, Goal Achievement, Observable Truths, Phase 1: Auth Flow Verification Report

### Community 59 - "Coding Conventions"
Cohesion: 0.29
Nodes (6): RupeeString, Code Style, Coding Conventions, Database Interaction Conventions, Error Handling, Import Organization

### Community 60 - "Onboarding Summary"
Cohesion: 0.29
Nodes (6): Codebase Context, Docs Context, Onboarding Summary, Project State, Recommended Next Step, Workstream & Rules

### Community 61 - "onAuthChange"
Cohesion: 0.33
Nodes (6): onAuthChange(), 2. Key Deliverables & Changes, Authentication & Routing Infrastructure, Database & Backend Hygiene, Pages & App Wiring, 2. Auth Context & Session Management

### Community 62 - "Phase 1: Auth Flow Summary"
Cohesion: 0.33
Nodes (5): 1. Executive Summary, 3. Verification & Quality Gates, 4. Note for M2 (Frontend/UI), 5. Next Steps, Phase 1: Auth Flow Summary

### Community 63 - "getSession"
Cohesion: 0.80
Nodes (4): SignupPage(), handleSubmit(), getSession(), signUp()

### Community 64 - "Implementation Decisions"
Cohesion: 0.40
Nodes (5): 1. Routing & Dependencies, 3. Pages & UI Presentation, 5. Architectural Boundaries, 6. Backend Hygiene & Explicit Permissions, Implementation Decisions

## Knowledge Gaps
- **1 isolated node(s):** `udaan-engine`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 415 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.tsx` to `contracts.ts`, `api.ts`, `frontend/package.json`, `auth.ts`, `getSession`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `useSession()` (e.g. with `Layers` and `Primary Runway Feed Path`) actually correct?**
  _`useSession()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `udaan-engine` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `test_engine.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06680080482897384 - nodes in this community are weakly interconnected._
- **Why does `RunwayInput` connect `index.ts` to `v1 Requirements`, `contracts.ts`, `Phase Details`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `toPaise()` (e.g. with `Rules everyone follows` and `Key Abstractions`) actually correct?**
  _`toPaise()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `contracts.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.051111111111111114 - nodes in this community are weakly interconnected._