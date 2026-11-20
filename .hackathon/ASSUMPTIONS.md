# ASSUMPTIONS — F1 irregular income (idea not chosen yet)

> Summary: 8 open · 0 testing · 0 validated · 0 rejected · 3 "collapses" still open

## Test-first list
1. #1 Good weeks leave enough surplus to fill a buffer: 30-min 52-week simulation for 3 rider types, calibrated on IDInsight earnings.
2. #3 Timing vs low income: same simulation; check share of weeks above basic costs.
3. #2 Workers keep the buffer: quick chat with 2–3 delivery riders near campus (venue interview).

## All assumptions
| # | Assumption | Importance | Team confidence | Evidence (label) | Kill test | How to test | Pass if / fail if | Status | Updated | Source |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Good weeks leave enough spare money to fill a 2–3 week buffer | high | ? | [?] — [V] net pay ~₹75/h suggests thin margins | collapses | 52-week simulation from published earnings + seasonal dips | Pass: ≥ 2 of 3 rider types can fill buffer / Fail: surplus ≈ 0 for most | open | 2026-11-20 15:20 IST | court pick-f1 (jurors 1, 6) |
| 2 | Workers will follow a self-salary rule and not spend the buffer under pressure | high | ? | [?] — [V] they borrow/sell assets instead of using savings | collapses | Ask 2–3 riders; design buffer into own RD/UPI autopay | Pass: riders say they'd keep it if it's "locked" in own account / Fail: they'd spend it anyway | open | 2026-11-20 15:20 IST | court pick-f1 (jurors 1, 9) |
| 3 | The cause is uneven timing, not only too-low income | high | ? | [?] | collapses | Same simulation: weeks above basic costs | Pass: many workers have surplus weeks / Fail: shortfall in most weeks | open | 2026-11-20 15:20 IST | court pick-f1 (jurors 6, 12) |
| 4 | Workers will give income input regularly | medium | ? | [AI] | weakens | One weekly payout figure or screenshot; carry forward if missed | Pass: ≤ 1 input/week works in demo | open | 2026-11-20 15:20 IST | court pick-f1 (juror 3) |
| 5 | The least-digital user can be reached without a smartphone | medium | ? | [?] | weakens | IVR / missed-call / NGO-helper mode (can be mocked) | Pass: keypad flow shown end to end | open | 2026-11-20 15:20 IST | court pick-f1 (juror 2) |
| 6 | Synthetic income patterns are realistic enough for the backtest | medium | ? | [AI] | weakens | Calibrate on IDInsight figures + seasonal dips; state sources | Pass: every synthetic parameter has a cited source | open | 2026-11-20 15:20 IST | court pick-f1 (jurors 11, 12) |
| 7 | Lean-month warnings won't cause needless cuts to food/fuel | low | ? | [AI] | minor | Show warning as a range with reasons | Pass: warnings show range + reason | open | 2026-11-20 15:20 IST | court pick-f1 (juror 8) |
| 8 | Existing gig-finance apps don't already do self-salary smoothing in Kannada | medium | ? | [AI] snippets, not opened | weakens | `/hack:compete`: open 3–5 tools | Pass: honest gap found / Fail: a tool already does it | open | 2026-11-20 15:20 IST | court pick-f1 (juror 7) |

- Kill test: **collapses** (the idea fails if this is false) · weakens · minor.
- Status: open · testing · validated (needs `[V]` or `[T]`) · rejected.

## Status history
| Date time | # | From → to | Evidence added | By |
|---|---|---|---|---|
| 2026-11-20 15:20 IST | 1–8 | new → open | From F1 pick trial | Claude |
