# Graph Report - FLOVA  (2026-11-20)

## Corpus Check
- 71 files · ~40,134 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .example 2, (none) 1, .css 1)

## Summary
- 513 nodes · 740 edges · 43 communities (26 shown, 17 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 83 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d8cfbb29`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- test_engine.py
- data.ts
- VERDICT — pick-f1-irregular-income
- api.ts
- frontend/package.json
- FLOVA (Udaan 2.0)
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
- contracts.ts
- loadRunwayInput
- Naming Patterns
- Phase Details
- Project State
- toPaise
- Codebase Structure
- Architecture
- Technology Stack
- Testing Patterns

## God Nodes (most connected - your core abstractions)
1. `loadRunwayInput()` - 18 edges
2. `SelfSalary` - 17 edges
3. `unwrap()` - 16 edges
4. `backtest_profile()` - 15 edges
5. `STATEMENTS — The Big Hack 2.0` - 15 edges
6. `Naming Patterns` - 15 edges
7. `generate_year()` - 13 edges
8. `compilerOptions` - 12 edges
9. `toPaise()` - 11 edges
10. `VERDICT — pick-f1-irregular-income` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Branches` --references--> `main()`  [INFERRED]
  CONTRIBUTING.md → ai-engine/udaan_engine/__main__.py
- `Pattern Overview` --references--> `toPaise()`  [INFERRED]
  .planning/codebase/ARCHITECTURE.md → frontend/src/lib/money.ts
- `Monitoring & Observability` --references--> `unwrap()`  [INFERRED]
  .planning/codebase/INTEGRATIONS.md → frontend/src/lib/supabase.ts
- `Component Responsibilities` --references--> `loadRunwayInput()`  [INFERRED]
  .planning/codebase/ARCHITECTURE.md → frontend/src/services/data.ts
- `Workstream & Rules` --references--> `main()`  [INFERRED]
  .planning/onboarding/SUMMARY.md → ai-engine/udaan_engine/__main__.py

## Import Cycles
- None detected.

## Communities (43 total, 17 thin omitted)

### Community 0 - "test_engine.py"
Cohesion: 0.07
Nodes (35): test_backtest_shape(), test_buffer_never_negative_and_money_is_conserved(), test_estimate_ignores_one_big_week(), test_estimate_with_little_history_is_cautious(), test_generate_year_is_reproducible(), test_lean_week_is_covered_by_buffer(), test_low_income_is_not_called_a_timing_problem(), test_negative_income_week_handled() (+27 more)

### Community 1 - "data.ts"
Cohesion: 0.12
Nodes (26): unwrap(), addCheckin(), addCommitment(), addPayout(), addTransaction(), getMyProfile(), listCommitments(), listPayouts() (+18 more)

### Community 2 - "VERDICT — pick-f1-irregular-income"
Cohesion: 0.05
Nodes (40): An alternative approach (same problem, same user), Contradictions between jurors, If I were your team…, Next experiment (30 min), Ranked improvements, Ratings /10, VERDICT — pick-f1-irregular-income, Votes (+32 more)

### Community 3 - "api.ts"
Cohesion: 0.12
Nodes (26): api, BacktestRow, OutlookWeek, Plan, Profile, Rider, rs(), Status (+18 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.08
Nodes (25): dependencies, react, react-dom, @supabase/supabase-js, devDependencies, @types/react, @types/react-dom, typescript (+17 more)

### Community 5 - "FLOVA (Udaan 2.0)"
Cohesion: 0.07
Nodes (28): main(), Codebase Context, Docs Context, Onboarding Summary, Project State, Recommended Next Step, Workstream & Rules, Active (M1 Roadmap Scope) (+20 more)

### Community 6 - "FLOVA data contract (v1 · owner: M1)"
Cohesion: 0.08
Nodes (22): Branches, Definition of done for any pull request, Every working session, Graphify: required for everyone, One-time setup (each member, each laptop), Who owns what, Working on FLOVA (team rules for the 24-hour build), `balance_checkins` (actual cash + bank at a moment) (+14 more)

### Community 7 - "backend/package.json"
Cohesion: 0.11
Nodes (16): description, devDependencies, @electric-sql/pglite, @supabase/supabase-js, @supabase/supabase-js, name, private, scripts (+8 more)

### Community 8 - "STATEMENTS — The Big Hack 2.0"
Cohesion: 0.12
Nodes (15): Dropped, First read: fit with our team and the booklet rubric [AI], ⚠ Rubric conflict (resolved 14:15 IST: team uses the booklet rubric), Statement B1: Know what you're signing, Statement B2: Fair tickets, Statement B3: Logs the attacker can't erase, Statement F1: The irregular income problem, Statement F2: Credit for the credit-invisible (+7 more)

### Community 9 - "auth.ts"
Cohesion: 0.11
Nodes (19): client(), login(), Service functions (`frontend/src/services/`), publishableKey, supabase, url, getSession(), onAuthChange() (+11 more)

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
Cohesion: 0.09
Nodes (21): APP_LANGUAGES, AppLanguage, COMMITMENT_KINDS, COMMITMENT_STATUSES, CommitmentKind, ENTRY_SOURCES, EntrySource, EXPENSE_TYPES (+13 more)

### Community 34 - "loadRunwayInput"
Cohesion: 0.23
Nodes (12): getLatestCheckin(), loadRunwayInput(), RunwayInput, Data Flow, Primary Runway Feed Path, Codebase Concerns, Fragile Areas, Missing Critical Features (To be delivered in Roadmap) (+4 more)

### Community 35 - "Naming Patterns"
Cohesion: 0.18
Nodes (12): Commitment, ISODate, Paise, Payout, RupeeString, Transaction, Code Style, Coding Conventions (+4 more)

### Community 36 - "Phase Details"
Cohesion: 0.18
Nodes (10): Overview, Phase 1: Auth flow, Phase 2: Profile & onboarding data, Phase 5: Secure AI function (stretch), Phase 6: Demo data, Phase 7: Deployment, Phase Details, Phases (+2 more)

### Community 37 - "Project State"
Cohesion: 0.18
Nodes (10): Accumulated Context, Blockers/Concerns, Current Position, Decisions, Deferred Items, Pending Todos, Performance Metrics, Project Reference (+2 more)

### Community 38 - "toPaise"
Cohesion: 0.47
Nodes (8): Rules everyone follows, formatINR(), paiseToRupeeString(), toPaise(), toPaiseOrNull(), Key Abstractions, Financial & Money Conventions, Validated (Already Shipped in Init Schema)

### Community 39 - "Codebase Structure"
Cohesion: 0.22
Nodes (8): BalanceCheckin, WorkProfile, Codebase Structure, Directory Layout, Directory Purposes, Key File Locations, Naming Conventions, Where to Add New Code

### Community 40 - "Architecture"
Cohesion: 0.22
Nodes (8): Architectural Constraints, Architecture, Component Responsibilities, Entry Points, Error Handling, Layers, Pattern Overview, System Overview

### Community 41 - "Technology Stack"
Cohesion: 0.25
Nodes (7): Configuration, Frameworks, Key Dependencies, Languages, Platform Requirements, Runtime, Technology Stack

### Community 42 - "Testing Patterns"
Cohesion: 0.29
Nodes (6): Mocking & Isolation, Required Pre-Shipping Checks, Test File Organization, Test Framework, Test Structure, Testing Patterns

## Knowledge Gaps
- **6 isolated node(s):** `udaan-engine`, `@supabase/supabase-js`, `@supabase/supabase-js`, `@types/react`, `@types/react-dom` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 301 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `main()` connect `FLOVA (Udaan 2.0)` to `test_engine.py`, `FLOVA data contract (v1 · owner: M1)`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `loadRunwayInput()` (e.g. with `Service functions (`frontend/src/services/`)` and `Component Responsibilities`) actually correct?**
  _`loadRunwayInput()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `udaan-engine`, `@supabase/supabase-js`, `@supabase/supabase-js` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `test_engine.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06749482401656315 - nodes in this community are weakly interconnected._
- **Why does `Active (M1 Roadmap Scope)` connect `FLOVA (Udaan 2.0)` to `data.ts`, `loadRunwayInput`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `backtest_profile()` (e.g. with `RiderProfile` and `.mean_weekly_income()`) actually correct?**
  _`backtest_profile()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `data.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12433862433862433 - nodes in this community are weakly interconnected._