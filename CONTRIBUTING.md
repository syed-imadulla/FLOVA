# Working on FLOVA (team rules for the 24-hour build)

## Who owns what
| Member | Area | Branch | Main folders |
|---|---|---|---|
| M1 · Team lead | Backend, Supabase, schema, RLS, contracts, merges | `feature/backend` | `backend/`, `frontend/src/lib/`, `frontend/src/services/`, `frontend/src/types/`, `docs/` |
| M2 | Frontend, UI/UX | `feature/frontend` | `frontend/src/components/`, `frontend/src/pages/`, styles |
| M3 | AI/ML and core runway logic | `feature/ai-engine` | `ai-engine/` and `frontend/src/engine/` (TypeScript runway engine, per the final plan) |
| M4 | Integration, testing, extra features | `feature/integration` | `frontend/src/features/`, tests, demo data |

Need a change in someone else's folder? Ask them first. Changes to `frontend/src/types/contracts.ts` or anything in
`backend/supabase/migrations/` always go through M1.

## Branches
- `dev` is the integration branch and the GitHub default. Every pull request targets `dev`.
- `main` is demo-ready only. M1 merges `dev` into `main` at milestones. Nobody pushes to `main` directly.
- Work on your own `feature/...` branch and keep it current:

```bash
git checkout feature/frontend
git pull origin dev           # bring in everyone's merged work
# ...work, commit often...
git push origin feature/frontend   # then open a pull request into dev
```

Keep pull requests small, one feature each. M1 reviews and merges.

## Graphify: required for everyone

FLOVA uses [Graphify](https://github.com/Graphify-Labs/graphify) so everyone, and every AI coding assistant, can query
how the project connects instead of grepping through files. The graph lives in `graphify-out/` and is committed;
`graphify-out/cache/` is not.

### One-time setup (each member, each laptop)
```bash
# 1. Install (package name has TWO y's). The [sql] extra lets it read our Supabase schema.
uv tool install "graphifyy[sql]"        # or: pipx install "graphifyy[sql]"
#    "graphify: command not found"? Run `uv tool update-shell` (or `pipx ensurepath`) and open a new terminal.

# 2. Inside the repo: git hooks that refresh the graph after every commit, checkout, merge and rebase,
#    plus a merge driver for graph.json conflicts. The hooks store your machine's path, so everyone runs this themselves.
graphify hook install
graphify hook status                   # confirms the hooks are installed

# 3. Optional, if you use an AI coding assistant: install the /graphify skill.
graphify install                        # Claude Code (default), or: graphify install --platform cursor
```
`CLAUDE.md` and `.claude/settings.json` (from `graphify claude install`) are already committed, so nobody needs to run that.

### Every working session
```bash
git pull origin dev
graphify update .          # code only, no LLM or API key needed
# ...code...
graphify update .          # before every commit/push, so the graph matches your code
git add -A && git commit -m "feat(frontend): onboarding work-profile step"
```
- The hooks also update the graph on each commit. Running `graphify update .` yourself before pushing is still the rule.
- Deleted or refactored code and Graphify refuses because the new graph is smaller? Run `graphify update . --force`.
- Useful queries: `graphify query "how does a payout become cash"`, `graphify explain "loadRunwayInput"`,
  `graphify path "addTransaction" "payouts"`.
- A large diff in `graphify-out/graph.json` in a pull request is normal: it's rewritten on every build.

## Definition of done for any pull request
1. The frontend builds: `cd frontend && npm run build`. If you touched `backend/`, run `cd backend && npm run test:db`.
2. `graphify update .` was run and `graphify-out/` is committed.
3. No keys in code, no logging of user data, money handled in paise (`frontend/src/lib/money.ts`).
