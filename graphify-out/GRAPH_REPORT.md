# Graph Report - FLOVA  (2026-11-20)

## Corpus Check
- 70 files · ~38,471 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .example 2, .css 1)

## Summary
- 464 nodes · 773 edges · 39 communities (20 shown, 19 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `886e7ade`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- test_engine.py
- data.ts
- VERDICT — pick-f1-irregular-income
- api.ts
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
- validation.test.ts
- contracts.ts
- money.ts
- Service functions (`frontend/src/services/`)
- rls-live-check.mjs

## God Nodes (most connected - your core abstractions)
1. `SelfSalary` - 17 edges
2. `backtest_profile()` - 15 edges
3. `unwrap()` - 15 edges
4. `STATEMENTS — The Big Hack 2.0` - 15 edges
5. `generate_year()` - 13 edges
6. `compilerOptions` - 12 edges
7. `VERDICT — pick-f1-irregular-income` - 11 edges
8. `VERDICT — pick-r1-vibe-code` - 11 edges
9. `VERDICT — pick-r3-token-tax` - 11 edges
10. `calculateDailyRunway()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Service functions (`frontend/src/services/`)` --references--> `getSession()`  [INFERRED]
  docs/CONTRACT.md → frontend/src/services/auth.ts
- `Service functions (`frontend/src/services/`)` --references--> `signIn()`  [INFERRED]
  docs/CONTRACT.md → frontend/src/services/auth.ts
- `Service functions (`frontend/src/services/`)` --references--> `signOut()`  [INFERRED]
  docs/CONTRACT.md → frontend/src/services/auth.ts
- `Service functions (`frontend/src/services/`)` --references--> `RunwayInput`  [INFERRED]
  docs/CONTRACT.md → frontend/src/types/contracts.ts
- `Rules everyone follows` --references--> `paiseToRupeeString()`  [INFERRED]
  docs/CONTRACT.md → frontend/src/lib/money.ts

## Import Cycles
- None detected.

## Communities (39 total, 19 thin omitted)

### Community 0 - "test_engine.py"
Cohesion: 0.07
Nodes (36): test_backtest_shape(), test_buffer_never_negative_and_money_is_conserved(), test_estimate_ignores_one_big_week(), test_estimate_with_little_history_is_cautious(), test_generate_year_is_reproducible(), test_lean_week_is_covered_by_buffer(), test_low_income_is_not_called_a_timing_problem(), test_negative_income_week_handled() (+28 more)

### Community 1 - "data.ts"
Cohesion: 0.13
Nodes (23): unwrap(), addCheckin(), addCommitment(), addPayout(), addTransaction(), listTransactions(), money(), receivePayout() (+15 more)

### Community 2 - "VERDICT — pick-f1-irregular-income"
Cohesion: 0.05
Nodes (40): An alternative approach (same problem, same user), Contradictions between jurors, If I were your team…, Next experiment (30 min), Ranked improvements, Ratings /10, VERDICT — pick-f1-irregular-income, Votes (+32 more)

### Community 3 - "api.ts"
Cohesion: 0.12
Nodes (26): api, BacktestRow, OutlookWeek, Plan, Profile, Rider, rs(), Status (+18 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.10
Nodes (25): dependencies, react@18.3.1, react-dom@18.3.1, @supabase/supabase-js@^2.119.2, devDependencies, @types/react@18.3.12, @types/react-dom@18.3.1, typescript@5.6.3 (+17 more)

### Community 5 - "20261120000100_init_schema.sql"
Cohesion: 0.16
Nodes (21): balance_checkins_user_time, commitments_updated_at, commitments_user_due, on_auth_user_created, payouts_guard_received, payouts_updated_at, payouts_user_date, profiles_updated_at (+13 more)

### Community 6 - "FLOVA data contract (v1 · owner: M1)"
Cohesion: 0.08
Nodes (22): Branches, Definition of done for any pull request, Every working session, Graphify: required for everyone, One-time setup (each member, each laptop), Who owns what, Working on FLOVA (team rules for the 24-hour build), `balance_checkins` (actual cash + bank at a moment) (+14 more)

### Community 7 - "backend/package.json"
Cohesion: 0.12
Nodes (16): description, devDependencies, @electric-sql/pglite@^0.5.17, @supabase/supabase-js@^2.119.2, @supabase/supabase-js, name, private, scripts (+8 more)

### Community 8 - "STATEMENTS — The Big Hack 2.0"
Cohesion: 0.12
Nodes (15): Dropped, First read: fit with our team and the booklet rubric [AI], ⚠ Rubric conflict (resolved 14:15 IST: team uses the booklet rubric), Statement B1: Know what you're signing, Statement B2: Fair tickets, Statement B3: Logs the attacker can't erase, Statement F1: The irregular income problem, Statement F2: Credit for the credit-invisible (+7 more)

### Community 9 - "auth.ts"
Cohesion: 0.22
Nodes (6): publishableKey, supabase, url, getSession(), signIn(), signOut()

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

### Community 34 - "validation.test.ts"
Cohesion: 0.16
Nodes (32): calculateConfirmedBalance(), ConfirmedBalanceBreakdown, ConfirmedBalanceResult, ConfirmedBalanceStatus, addDays(), calculateDailyRunway(), DailyProjectionEntry, RunwayProjectionInput (+24 more)

### Community 35 - "contracts.ts"
Cohesion: 0.08
Nodes (23): APP_LANGUAGES, AppLanguage, COMMITMENT_KINDS, COMMITMENT_STATUSES, CommitmentKind, ENTRY_SOURCES, EntrySource, EXPENSE_TYPES (+15 more)

### Community 36 - "money.ts"
Cohesion: 0.38
Nodes (5): Rules everyone follows, paiseToRupeeString(), toPaise(), toPaiseOrNull(), RupeeString

### Community 37 - "Service functions (`frontend/src/services/`)"
Cohesion: 0.53
Nodes (6): Service functions (`frontend/src/services/`), getLatestCheckin(), getMyProfile(), listCommitments(), listPayouts(), loadRunwayInput()

## Knowledge Gaps
- **1 isolated node(s):** `udaan-engine`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 224 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `FLOVA data contract (v1 · owner: M1)` connect `FLOVA data contract (v1 · owner: M1)` to `money.ts`, `Service functions (`frontend/src/services/`)`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `backtest_profile()` (e.g. with `RiderProfile` and `.mean_weekly_income()`) actually correct?**
  _`backtest_profile()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `udaan-engine` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `test_engine.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06680080482897384 - nodes in this community are weakly interconnected._
- **Why does `Service functions (`frontend/src/services/`)` connect `Service functions (`frontend/src/services/`)` to `auth.ts`, `validation.test.ts`, `FLOVA data contract (v1 · owner: M1)`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Should `data.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Why does `RunwayInput` connect `validation.test.ts` to `data.ts`, `contracts.ts`, `Service functions (`frontend/src/services/`)`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._