# VERDICT — pick-f1-irregular-income

> Summary: REVISE · NOT GUILTY 6 · GUILTY 3 · INSUFFICIENT EVIDENCE 3 · 12 of 12 valid votes

**DECISION: REVISE**
On trial: "Is this problem real and worth solving here, and can this team solve it for its real users in the time?"
Jury: finance seats (compliance officer, fraud analyst, financial literacy trainer replace domain pro, workaround user, systems person) · full 12
Average confidence: 5.8/10 (how sure jurors were, not a probability of success)

> Simulated jurors are perspectives, not real users or experts. Use this verdict to decide what to test and fix, not as proof.

## Votes
| # | Juror | Vote | Conf | Evidence | Reason |
|---|---|---|---|---|---|
| 1 | End user | INSUFFICIENT | 6 | medium | Lean-week loans real, but an on-screen buffer may not stop spending; no adherence proof |
| 2 | Least-digital user | GUILTY | 6 | medium | Keypad-phone Kannada vendor can't use WhatsApp; helper support only "could" |
| 3 | Front-line worker | GUILTY | 5 | medium | Daily manual logging; buffer easy to ignore; no plan for missed logs |
| 4 | Compliance officer | NOT GUILTY | 6 | medium | Advice-only, holds no money, so avoids regulated flows |
| 5 | Fraud analyst | NOT GUILTY | 5 | medium | Real problem, low fraud loss, but WhatsApp bot can be impersonated |
| 6 | Root-cause analyst | GUILTY | 6 | medium | [V] data suggests income too low, not just uneven |
| 7 | 'Already exists' researcher | INSUFFICIENT | 6 | weak | Prior art only from unopened snippets |
| 8 | Safety & ethics | NOT GUILTY | 6 | medium | Checkable rule, no money held; risk = false warnings, privacy |
| 9 | Financial literacy trainer | NOT GUILTY | 5 | medium | "Pay yourself ₹X weekly" is teachable; untested with users |
| 10 | Engineer | NOT GUILTY | 6 | medium | Rule engine + backtest buildable in 21 h |
| 11 | Statement-owner judge | NOT GUILTY | 7 | medium | Answers F1 directly; evidence via labelled backtest |
| 12 | Sceptic | INSUFFICIENT | 6 | weak | "Timing not low income" premise unsourced; synthetic backtest circular |

No vote or invalid: none. Raw votes: `votes-raw.json` (unedited). Retries: `trial-log.md`.

## Contradictions between jurors
| Jurors | Disagreement | Evidence favours |
|---|---|---|
| Defense / statement owner vs root-cause / sceptic | Is the cause *timing* or *too little income*? | Unresolved. [V] shows low pay (~₹75/h net) and distress borrowing; no source shows good weeks leave surplus |
| Engineer vs least-digital user | Voice/WhatsApp is "buildable" vs "excludes keypad phones" | Least-digital user: WhatsApp needs a smartphone [T] |
| Compliance vs fraud analyst | Low risk vs impersonation risk | Both right: low money risk, real scam-copy risk |

## Ratings /10
| Item | Score | Why (labels) |
|---|---|---|
| Problem is real | 7 | [V] distress borrowing, thin credit files, low net pay |
| Problem matters | 7 | [V] 77 lakh → 2.35 crore workers; 40% < ₹15k/month |
| Solution fits the root cause | 4 | Timing-vs-low-income unresolved [?] |
| Works for real users | 4 | WhatsApp excludes keypad users; daily logging burden [T] |
| Fits existing systems | 7 | No money held, sits beside UPI/cash [T] |
| Safe | 7 | Rule-based, checkable; privacy/consent missing |
| Buildable and demo-able | 7 | Engine + backtest fine; live voice/WhatsApp risky |
| Different from what exists | 4 | Prior art not checked [AI] |

## What's genuinely strong
1. The pain is real: platform workers borrow or sell assets when income falls [V] (ADBI WP 1495, 2025).
2. The core is a checkable rule that holds no money: safe and explainable [T].
3. It answers the statement and the Evidence criterion directly via a labelled backtest [T].

## Weakest assumption
Good weeks leave enough spare money to fill a buffer, and workers won't spend it under pressure. Label [?]. Kill test: **collapses** (if false, the self-salary only displays the shortfall).

## What we're overlooking
- Riders get weekly platform payouts. One weekly payout figure (or screenshot) could replace daily logging.
- The tool can't hold money, but it *can* nudge the worker's own UPI autopay / recurring deposit, so the buffer becomes real money in their own account.
- The "income too low" camp may be right for part of the users. The backtest should show who it helps and who it doesn't (that's the failure analysis judges want).

## An alternative approach (same problem, same user)
- Instead of a personal buffer, a peer "lean-week pool" through an existing union/SHG: members put in during good weeks and draw in bad weeks, with the rule deciding amounts.

## Ranked improvements
| # | Change | Impact | Effort | Priority | Raised by | Inside the core? | How to check it worked |
|---|---|---|---|---|---|---|---|
| 1 | Calibrate synthetic income on published figures (IDInsight ₹170/115/75 per h, seasonal/monsoon dips); backtest hard cases (back-to-back lean weeks, emergency withdrawal, no-surplus weeks) and show where the rule fails | high | low | P0 | 6, 11, 12 | yes | Backtest report has a "who it doesn't help" section |
| 2 | One weekly input (read out or screenshot the platform payout); carry forward if missed | high | low | P0 | 3, 1 | yes | Journey needs ≤ 1 input/week |
| 3 | Make the buffer real: nudge into the worker's own RD/UPI autopay (tool never holds money) | high | medium | P1 | 1 | yes | Demo shows money moving into own account (mocked) |
| 4 | Non-smartphone channel: Kannada IVR / missed-call + NGO-helper entry mode | high | medium | P1 | 2 | yes | Keypad-phone flow works end to end (can be mocked) |
| 5 | Prior-art table: open 3–5 existing gig-finance/smoothing apps | high | low | P0 | 7 | no (`/hack:compete`) | Table with honest gap |
| 6 | Anti-scam rules: one verified number, never asks for OTP/PIN/links; spoken warning | high | low | P1 | 5 | no | Message templates include warning |
| 7 | Consent, audit log of rule outputs, DPDP-style retention policy | medium | low | P2 | 4, 8 | no | Consent screen + log exist |
| 8 | Show warnings as a range with plain reasoning | medium | low | P2 | 8 | no | Warning text shows range |
| 9 | Build rule engine + backtest first; voice/WhatsApp as stretch with typed fallback | high | low | P0 | 10 | no (plan) | Engine done before integrations |

## Next experiment (30 min)
Test: using published rider earnings (IDInsight) plus plausible seasonal dips, simulate 52 weeks for 3 rider types (full-time, part-time, monsoon-hit). Check whether good weeks leave any surplus after basic costs.
PASS if: at least 2 of 3 rider types have enough surplus weeks to fill a 2–3 week buffer.
FAIL if: surplus is near zero for most types, meaning the problem is low income, not timing. Then reframe the solution (e.g., timing of bills/EMIs, or the pool alternative).

## If I were your team…
I'd keep F1 but make the backtest honest about who it can't help. That honesty is your Evidence score.

**Next →** `/hack:improve` (REVISE)
