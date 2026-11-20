# Graph Report - FLOVA  (2026-11-20)

## Corpus Check
- 122 files · ~59,906 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 2, .css 1)

## Summary
- 751 nodes · 1447 edges · 57 communities (34 shown, 23 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 177 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4a2c05c1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- test_engine.py
- contracts.ts
- VERDICT — pick-f1-irregular-income
- api.ts
- frontend/package.json
- FLOVA (Udaan 2.0)
- FLOVA data contract (v1 · owner: M1)
- backend/package.json
- STATEMENTS — The Big Hack 2.0
- AuthProvider
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
- Architecture
- index.ts
- Project State
- Tests
- Codebase Structure
- signIn
- Technology Stack
- Testing Patterns
- parseRupees.test.ts
- signOut
- Tests
- 01-01-PLAN.md
- Plan 02-01: Profile and Onboarding Persistence
- auth.ts
- External Integrations
- Coding Conventions
- Plan 03-01: Data Capture Hooks and Pages
- getSession
- rls-live-check.mjs
- Goal Achievement
- Key Accomplishments

## God Nodes (most connected - your core abstractions)
1. `toPaise()` - 27 edges
2. `react` - 26 edges
3. `useSession()` - 25 edges
4. `formatINR()` - 18 edges
5. `parseRequiredRupees()` - 18 edges
6. `loadRunwayInput()` - 18 edges
7. `SelfSalary` - 17 edges
8. `App()` - 17 edges
9. `useTransactions()` - 16 edges
10. `unwrap()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Branches` --references--> `main()`  [INFERRED]
  CONTRIBUTING.md → ai-engine/udaan_engine/__main__.py
- `Pattern Overview` --references--> `toPaise()`  [INFERRED]
  .planning/codebase/ARCHITECTURE.md → frontend/src/lib/money.ts
- `Monitoring & Observability` --references--> `unwrap()`  [INFERRED]
  .planning/codebase/INTEGRATIONS.md → frontend/src/lib/supabase.ts
- `5. Next Steps` --references--> `useProfile()`  [INFERRED]
  .planning/phases/01-auth-flow/01-01-SUMMARY.md → frontend/src/profile/useProfile.ts
- `Phase 2: Profile & onboarding data` --references--> `useProfile()`  [INFERRED]
  .planning/ROADMAP.md → frontend/src/profile/useProfile.ts

## Import Cycles
- None detected.

## Communities (57 total, 23 thin omitted)

### Community 0 - "test_engine.py"
Cohesion: 0.07
Nodes (35): test_backtest_shape(), test_buffer_never_negative_and_money_is_conserved(), test_estimate_ignores_one_big_week(), test_estimate_with_little_history_is_cautious(), test_generate_year_is_reproducible(), test_lean_week_is_covered_by_buffer(), test_low_income_is_not_called_a_timing_problem(), test_negative_income_week_handled() (+27 more)

### Community 1 - "contracts.ts"
Cohesion: 0.06
Nodes (73): Service functions (`frontend/src/services/`), useSession(), DataVersionContext, DataVersionContextType, useDataVersion(), useCommitments(), usePayouts(), useTransactions() (+65 more)

### Community 2 - "VERDICT — pick-f1-irregular-income"
Cohesion: 0.05
Nodes (40): An alternative approach (same problem, same user), Contradictions between jurors, If I were your team…, Next experiment (30 min), Ranked improvements, Ratings /10, VERDICT — pick-f1-irregular-income, Votes (+32 more)

### Community 3 - "api.ts"
Cohesion: 0.11
Nodes (29): api, BacktestRow, OutlookWeek, Plan, Profile, Rider, rs(), Status (+21 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.07
Nodes (26): dependencies, react, react-dom, react-router-dom, @supabase/supabase-js, devDependencies, @types/react, @types/react-dom (+18 more)

### Community 5 - "FLOVA (Udaan 2.0)"
Cohesion: 0.05
Nodes (40): main(), Codebase Context, Docs Context, Onboarding Summary, Project State, Recommended Next Step, Workstream & Rules, Business & Problem Context (+32 more)

### Community 6 - "FLOVA data contract (v1 · owner: M1)"
Cohesion: 0.08
Nodes (22): Branches, Definition of done for any pull request, Every working session, Graphify: required for everyone, One-time setup (each member, each laptop), Who owns what, Working on FLOVA (team rules for the 24-hour build), `balance_checkins` (actual cash + bank at a moment) (+14 more)

### Community 7 - "backend/package.json"
Cohesion: 0.10
Nodes (18): description, devDependencies, @electric-sql/pglite, @supabase/supabase-js, @supabase/supabase-js, name, private, scripts (+10 more)

### Community 8 - "STATEMENTS — The Big Hack 2.0"
Cohesion: 0.12
Nodes (15): Dropped, First read: fit with our team and the booklet rubric [AI], ⚠ Rubric conflict (resolved 14:15 IST: team uses the booklet rubric), Statement B1: Know what you're signing, Statement B2: Fair tickets, Statement B3: Logs the attacker can't erase, Statement F1: The irregular income problem, Statement F2: Credit for the credit-invisible (+7 more)

### Community 9 - "AuthProvider"
Cohesion: 0.20
Nodes (10): AuthProvider(), Codebase Concerns, Fragile Areas, Missing Critical Features (To be delivered in Roadmap), Security Considerations, Tech Debt, 2. Key Deliverables & Changes, Authentication & Routing Infrastructure (+2 more)

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
Cohesion: 0.09
Nodes (45): Frontend data hooks (`frontend/src/data/`), Rules everyone follows, App(), RedirectIfAuthed(), RequireAuth(), DataVersionProvider(), todayLocalISO(), useLatestCheckin() (+37 more)

### Community 35 - "Architecture"
Cohesion: 0.20
Nodes (9): Architectural Constraints, Architecture, Component Responsibilities, Data Flow, Entry Points, Error Handling, Layers, Pattern Overview (+1 more)

### Community 36 - "index.ts"
Cohesion: 0.14
Nodes (36): d1, d2, iso1, iso2, calculateConfirmedBalance(), ConfirmedBalanceBreakdown, ConfirmedBalanceResult, ConfirmedBalanceStatus (+28 more)

### Community 37 - "Project State"
Cohesion: 0.40
Nodes (4): Current Position, Performance Metrics, Project Reference, Project State

### Community 38 - "Tests"
Cohesion: 0.13
Nodes (14): 1. Logged out redirect to /login (B1), 2. Sign up with new email and display name (B2), 3. Session persistence on refresh (B3), 4. Logout and route protection (B4), 5. Login error handling (B5), 6. Redirect authenticated user away from /login (B6), 7. Client-side password length validation (B7), A. Live RLS Test (+6 more)

### Community 39 - "Codebase Structure"
Cohesion: 0.33
Nodes (5): Codebase Structure, Directory Layout, Directory Purposes, Key File Locations, Where to Add New Code

### Community 40 - "signIn"
Cohesion: 0.22
Nodes (9): LoginPage(), handleSubmit(), signIn(), Canonical References, Established Patterns, Existing Code Insights, Integration Points, Phase 1: Auth flow - Context (+1 more)

### Community 41 - "Technology Stack"
Cohesion: 0.25
Nodes (7): Configuration, Frameworks, Key Dependencies, Languages, Platform Requirements, Runtime, Technology Stack

### Community 42 - "Testing Patterns"
Cohesion: 0.29
Nodes (6): Mocking & Isolation, Required Pre-Shipping Checks, Test File Organization, Test Framework, Test Structure, Testing Patterns

### Community 43 - "parseRupees.test.ts"
Cohesion: 0.18
Nodes (10): req650, reqEmpty, reqZero, res200, res995, resAbc, resDec, resEmpty (+2 more)

### Community 44 - "signOut"
Cohesion: 0.16
Nodes (13): handleLogout(), onAuthChange(), signOut(), APIs & External Services, 1. Routing & Dependencies, 2. Auth Context & Session Management, 3. Pages & UI Presentation, 4. Authentication Workflows & Form Behavior (+5 more)

### Community 45 - "Tests"
Cohesion: 0.12
Nodes (15): 1. Currency parser unit tests, 1. New user signup routing, 2. Blank ₹ fields submission, 2. M3 Engine tests regression suite, 3. Database test suite, 3. Session refresh persistence, 4. Edit profile updates immediately, 5. Client-side validation (+7 more)

### Community 48 - "auth.ts"
Cohesion: 0.31
Nodes (5): AuthContext, AuthContextValue, publishableKey, supabase, url

### Community 49 - "External Integrations"
Cohesion: 0.25
Nodes (7): Authentication & Identity, CI/CD & Deployment, Data Storage, Environment Configuration, External Integrations, Monitoring & Observability, Webhooks & Callbacks

### Community 50 - "Coding Conventions"
Cohesion: 0.29
Nodes (6): RupeeString, Code Style, Coding Conventions, Database Interaction Conventions, Error Handling, Import Organization

### Community 52 - "getSession"
Cohesion: 0.80
Nodes (4): SignupPage(), handleSubmit(), getSession(), signUp()

### Community 55 - "Goal Achievement"
Cohesion: 0.50
Nodes (3): Goal Achievement, Observable Truths, Phase 3: Data Capture Hooks Verification Report

## Knowledge Gaps
- **6 isolated node(s):** `udaan-engine`, `@supabase/supabase-js`, `@supabase/supabase-js`, `@types/react`, `@types/react-dom` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 383 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `main()` connect `FLOVA (Udaan 2.0)` to `test_engine.py`, `contracts.ts`, `FLOVA data contract (v1 · owner: M1)`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `toPaise()` (e.g. with `Rules everyone follows` and `Key Abstractions`) actually correct?**
  _`toPaise()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `udaan-engine`, `@supabase/supabase-js`, `@supabase/supabase-js` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `test_engine.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06749482401656315 - nodes in this community are weakly interconnected._
- **Why does `Active (M1 Roadmap Scope)` connect `contracts.ts` to `AuthProvider`, `App.tsx`, `FLOVA (Udaan 2.0)`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `useSession()` (e.g. with `Layers` and `Primary Runway Feed Path`) actually correct?**
  _`useSession()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `contracts.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06196213425129088 - nodes in this community are weakly interconnected._