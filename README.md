# FLOVA

**A steady weekly salary from uneven gig pay.** Built at The Big Hack 2.0 (Finance track, problem F1: the irregular income problem).

Delivery riders get paid a different amount every week. In lean weeks (illness, a bike repair, the January slowdown) many borrow at high informal rates, even though their average income covers their needs. FLOVA turns one number a week, that week's payout, into a steady salary. It puts the surplus from good weeks into a buffer and pays from the buffer in lean weeks.

## What it does
- **Self-salary rule**: a cautious estimate of sustainable pay, a 3-week buffer target, essentials protected first, and a salary that moves at most 15% a week. Every salary comes with plain reasons.
- **4-week lean outlook**: low / likely / high ranges with seasonal reasons, plus a warning when a slow stretch could run past the buffer.
- **SMS mode** for keypad phones: `PAY 5200`, `STATUS`, `UNDO`.
- **Honest limit**: when average income is below essentials, FLOVA says this is a low-income problem, not a timing problem, and points the rider to welfare schemes.

## Evidence (backtest, 50 simulated years per rider type)
Baseline: spend what comes in and borrow any gap at 5%/month. FLOVA: follow the rule and borrow only when the buffer is empty. Both use the same income.

| Rider | Weeks borrowing / yr | Interest / yr | Spending swings (CV) | Smoothing can help |
|---|---|---|---|---|
| Full-time | 12.8 → 2.6 | ₹782 → ₹611 | 0.20 → 0.15 | 100% of years |
| Part-time student | 15.4 → 3.4 | ₹547 → ₹459 | 0.27 → 0.19 | 100% of years |
| New rider (low rating) | 32.9 → 24.0 | ₹11,477 → ₹11,946 | — | 0% (low income) |

Run it yourself: `cd ai-engine && python3 -m udaan_engine`.

**Caveats.** Income is synthetic. Hourly rates come from IDInsight's 2024 study of 2,547 delivery drivers. Hours, essentials, seasonality, shock rates and the 5% informal rate are marked ASSUMED in `ai-engine/udaan_engine/profiles.py` and `backtest.py`, and need checking against rider interviews.

## Run it
```bash
# backend: Supabase (Auth + PostgreSQL + Row Level Security). One-time setup in backend/README.md.
cd backend && npm install && npm run test:db   # local schema + RLS tests, no Supabase account needed

# frontend
cd frontend
cp .env.example .env.local         # Supabase URL + publishable key (ask M1)
npm install
npm run dev                        # http://localhost:5173
```

Team rules, branches and the required **Graphify** workflow: [CONTRIBUTING.md](CONTRIBUTING.md).
Data contract (tables, fields, enums): [docs/CONTRACT.md](docs/CONTRACT.md).

Tests: `cd ai-engine && pytest -q` (16) and `cd backend && npm run test:db` (22 schema and RLS checks).

## Layout
| Folder | What |
|---|---|
| `ai-engine/` | Self-salary rule, outlook, synthetic income, backtest (pure Python, no dependencies) |
| `backend/` | Supabase schema, Row Level Security policies and database tests (M1) |
| `docs/` | Shared data contract |
| `graphify-out/` | Graphify knowledge graph of the repo (committed, cache ignored) |
| `frontend/` | React + Vite + TypeScript UI |
| `.hackathon/` | Problem picking, assumptions and trial notes from the event |

## Tech and credits
React, Vite, TypeScript, Supabase (Auth, PostgreSQL, Row Level Security), Python (ai-engine prototype). Data: IDInsight 2024 (via IDR), Economic Survey 2025-26 (via Upstox), NITI Aayog gig-workforce estimates.

**AI assistance:** parts of the code were written with Claude Code (Anthropic) during the event, as allowed by the rules. Each team member can explain their part.
