# Graph Report - FLOVA  (2026-11-20)

## Corpus Check
- 97 files · ~52,790 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 2, .css 1)

## Summary
- 645 nodes · 1081 edges · 55 communities (34 shown, 21 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 94 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `991ab163`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- test_engine.py
- data.ts
- VERDICT — pick-f1-irregular-income
- api.ts
- frontend/package.json
- Phase Details
- FLOVA data contract (v1 · owner: M1)
- backend/package.json
- STATEMENTS — The Big Hack 2.0
- App.tsx
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
- contracts.ts
- loadRunwayInput
- receivePayout
- index.ts
- Project State
- Tests
- Codebase Structure
- Architecture
- Technology Stack
- Testing Patterns
- FLOVA (Udaan 2.0)
- External Integrations
- rls-live-check.mjs
- 01-01-PLAN.md
- loadRunwayInput
- 20261120000100_init_schema.sql
- v1 Requirements
- Coding Conventions
- Onboarding Summary
- Phase 1: Auth Flow Summary

## God Nodes (most connected - your core abstractions)
1. `loadRunwayInput()` - 18 edges
2. `SelfSalary` - 17 edges
3. `RunwayInput` - 16 edges
4. `unwrap()` - 16 edges
5. `backtest_profile()` - 15 edges
6. `useSession()` - 15 edges
7. `Naming Patterns` - 15 edges
8. `STATEMENTS — The Big Hack 2.0` - 15 edges
9. `generate_year()` - 13 edges
10. `react` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Monitoring & Observability` --references--> `unwrap()`  [INFERRED]
  .planning/codebase/INTEGRATIONS.md → frontend/src/lib/supabase.ts
- `Pattern Overview` --references--> `toPaise()`  [INFERRED]
  .planning/codebase/ARCHITECTURE.md → frontend/src/lib/money.ts
- `Component Responsibilities` --references--> `loadRunwayInput()`  [INFERRED]
  .planning/codebase/ARCHITECTURE.md → frontend/src/services/data.ts
- `Layers` --references--> `useSession()`  [INFERRED]
  .planning/codebase/ARCHITECTURE.md → frontend/src/auth/useSession.ts
- `Phase 1: Authentication Flow` --references--> `useSession()`  [INFERRED]
  .planning/REQUIREMENTS.md → frontend/src/auth/useSession.ts

## Import Cycles
- None detected.

## Communities (55 total, 21 thin omitted)

### Community 0 - "test_engine.py"
Cohesion: 0.07
Nodes (36): test_backtest_shape(), test_buffer_never_negative_and_money_is_conserved(), test_estimate_ignores_one_big_week(), test_estimate_with_little_history_is_cautious(), test_generate_year_is_reproducible(), test_lean_week_is_covered_by_buffer(), test_low_income_is_not_called_a_timing_problem(), test_negative_income_week_handled() (+28 more)

### Community 1 - "data.ts"
Cohesion: 0.17
Nodes (19): unwrap(), addCheckin(), addCommitment(), addPayout(), addTransaction(), listTransactions(), money(), setCommitmentStatus() (+11 more)

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

### Community 9 - "App.tsx"
Cohesion: 0.08
Nodes (44): App(), AuthContext, AuthContextValue, AuthProvider(), RedirectIfAuthed(), RequireAuth(), useSession(), publishableKey (+36 more)

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

### Community 33 - "contracts.ts"
Cohesion: 0.08
Nodes (28): APP_LANGUAGES, AppLanguage, BalanceCheckin, Commitment, COMMITMENT_KINDS, COMMITMENT_STATUSES, CommitmentKind, ENTRY_SOURCES (+20 more)

### Community 34 - "loadRunwayInput"
Cohesion: 0.42
Nodes (9): Rules everyone follows, formatINR(), paiseToRupeeString(), toPaise(), toPaiseOrNull(), Key Abstractions, Primary Runway Feed Path, Financial & Money Conventions (+1 more)

### Community 35 - "receivePayout"
Cohesion: 0.33
Nodes (6): receivePayout(), Active (M1 Roadmap Scope), Out of Scope, Requirements, Phase 3: Data Capture Hooks & Mutation Services, Phase 3: Data capture hooks

### Community 36 - "index.ts"
Cohesion: 0.16
Nodes (34): calculateConfirmedBalance(), ConfirmedBalanceBreakdown, ConfirmedBalanceResult, ConfirmedBalanceStatus, addDays(), calculateDailyRunway(), DailyProjectionEntry, RunwayProjectionInput (+26 more)

### Community 37 - "Project State"
Cohesion: 0.33
Nodes (5): Current Position, Performance Metrics, Project Reference, Project State, Risk Register

### Community 38 - "Tests"
Cohesion: 0.13
Nodes (14): 1. Logged out redirect to /login (B1), 2. Sign up with new email and display name (B2), 3. Session persistence on refresh (B3), 4. Logout and route protection (B4), 5. Login error handling (B5), 6. Redirect authenticated user away from /login (B6), 7. Client-side password length validation (B7), A. Live RLS Test (+6 more)

### Community 39 - "Codebase Structure"
Cohesion: 0.33
Nodes (5): Codebase Structure, Directory Layout, Directory Purposes, Key File Locations, Where to Add New Code

### Community 40 - "Architecture"
Cohesion: 0.20
Nodes (9): Architectural Constraints, Architecture, Component Responsibilities, Data Flow, Entry Points, Error Handling, Layers, Pattern Overview (+1 more)

### Community 41 - "Technology Stack"
Cohesion: 0.25
Nodes (7): Configuration, Frameworks, Key Dependencies, Languages, Platform Requirements, Runtime, Technology Stack

### Community 42 - "Testing Patterns"
Cohesion: 0.29
Nodes (6): Mocking & Isolation, Required Pre-Shipping Checks, Test File Organization, Test Framework, Test Structure, Testing Patterns

### Community 43 - "FLOVA (Udaan 2.0)"
Cohesion: 0.22
Nodes (8): Business & Problem Context, Constraints & Rules for Every Phase, Core Value, FLOVA (Udaan 2.0), Key Decisions Log, Team Ownership & Boundaries, Technical Environment & Architecture, What This Is

### Community 44 - "External Integrations"
Cohesion: 0.25
Nodes (7): Authentication & Identity, CI/CD & Deployment, Data Storage, Environment Configuration, External Integrations, Monitoring & Observability, Webhooks & Callbacks

### Community 47 - "loadRunwayInput"
Cohesion: 0.22
Nodes (12): Service functions (`frontend/src/services/`), getLatestCheckin(), getMyProfile(), listCommitments(), listPayouts(), loadRunwayInput(), Codebase Concerns, Fragile Areas (+4 more)

### Community 48 - "20261120000100_init_schema.sql"
Cohesion: 0.16
Nodes (21): balance_checkins_user_time, commitments_updated_at, commitments_user_due, on_auth_user_created, payouts_guard_received, payouts_updated_at, payouts_user_date, profiles_updated_at (+13 more)

### Community 49 - "v1 Requirements"
Cohesion: 0.18
Nodes (10): Out of Scope, Phase 1: Authentication Flow, Phase 4: Runway Feed & Engine Integration, Phase 5: Secure AI Function (Stretch), Phase 6: Demo Data Seed & Test Fixtures, Phase 7: Deployment & Production Smoke Test, Phase 8: Verify & Release Freeze, Requirements: FLOVA (M1 Backend & Database) (+2 more)

### Community 50 - "Coding Conventions"
Cohesion: 0.29
Nodes (6): RupeeString, Code Style, Coding Conventions, Database Interaction Conventions, Error Handling, Import Organization

### Community 51 - "Onboarding Summary"
Cohesion: 0.29
Nodes (6): Codebase Context, Docs Context, Onboarding Summary, Project State, Recommended Next Step, Workstream & Rules

### Community 52 - "Phase 1: Auth Flow Summary"
Cohesion: 0.33
Nodes (5): 1. Executive Summary, 3. Verification & Quality Gates, 4. Note for M2 (Frontend/UI), 5. Next Steps, Phase 1: Auth Flow Summary

## Knowledge Gaps
- **1 isolated node(s):** `udaan-engine`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 322 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RunwayInput` connect `index.ts` to `data.ts`, `loadRunwayInput`, `contracts.ts`, `Phase Details`, `loadRunwayInput`, `v1 Requirements`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `loadRunwayInput()` (e.g. with `Service functions (`frontend/src/services/`)` and `Component Responsibilities`) actually correct?**
  _`loadRunwayInput()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `udaan-engine` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `test_engine.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06680080482897384 - nodes in this community are weakly interconnected._
- **Why does `Service functions (`frontend/src/services/`)` connect `loadRunwayInput` to `App.tsx`, `index.ts`, `FLOVA data contract (v1 · owner: M1)`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `RunwayInput` (e.g. with `Service functions (`frontend/src/services/`)` and `Primary Runway Feed Path`) actually correct?**
  _`RunwayInput` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Should `VERDICT — pick-f1-irregular-income` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._