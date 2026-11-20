# VERDICT — pick-r1-vibe-code

> Summary: REVISE · NOT GUILTY 5 · GUILTY 3 · INSUFFICIENT EVIDENCE 4 · 12 of 12 valid votes

**DECISION: REVISE**
On trial: "Is this problem real and worth solving here, and can this team solve it for its real users in the time?"
Jury: universal seats (domain unclear: software security; domain pro set to an app-security engineer) · full 12
Average confidence: 5.9/10 (how sure jurors were, not a probability of success)

> Simulated jurors are perspectives, not real users or experts. Use this verdict to decide what to test and fix, not as proof.

## Votes
| # | Juror | Vote | Conf | Evidence | Reason |
|---|---|---|---|---|---|
| 1 | End user | INSUFFICIENT | 6 | medium | Flaws real, but I'd not run an extra tool; Lovable already checks |
| 2 | Least-digital user | INSUFFICIENT | 6 | weak | How does a beginner find, run, understand it? |
| 3 | Front-line worker | INSUFFICIENT | 6 | medium | Where it runs, steps added, what happens when it blocks unknown |
| 4 | Domain professional (AppSec) | NOT GUILTY | 5 | medium | Severe and real; Lovable doesn't cover Cursor/Copilot; static RLS check gives false confidence |
| 5 | Workaround user | GUILTY | 6 | medium | Lovable + Gitleaks already cover it; a third alert list isn't better |
| 6 | Root-cause analyst | GUILTY | 6 | medium | Root cause = insecure defaults + no review; optional scanner treats symptoms |
| 7 | 'Already exists' researcher | GUILTY | 6 | medium | Lovable already scans RLS/keys/endpoints [V]; no shown gap |
| 8 | Safety & ethics | NOT GUILTY | 6 | medium | Reduces real harm if fixes don't create false confidence |
| 9 | Systems person | NOT GUILTY | 6 | medium | Runs beside Semgrep/Gitleaks, no new hardware |
| 10 | Engineer | NOT GUILTY | 6 | medium | Narrow checks + fixed baseline buildable in 21 h |
| 11 | Statement-owner judge | NOT GUILTY | 6 | medium | Fits track rules; innovation weak vs Lovable; seeded eval weakens Evidence |
| 12 | Sceptic | INSUFFICIENT | 6 | medium | No evidence it catches anything free tools miss |

No vote or invalid: none. Raw votes: `votes-raw.json` (unedited). Retries: `trial-log.md`.

## Contradictions between jurors
| Jurors | Disagreement | Evidence favours |
|---|---|---|
| Engineer/systems vs workaround/exists | Useful addition vs duplicate of Lovable + free tools | Duplicate *for Lovable users* [V]; gap for Cursor/Copilot users is [?] |
| Defense vs prosecution #4 | One-click fix helps beginners vs gives false confidence (`using(true)`) | Prosecution [AI]; most jurors agree the fix must be tested live |

## Ratings /10
| Item | Score | Why (labels) |
|---|---|---|
| Problem is real | 8 | [V] Veracode 45%, CVE-2025-48757, GitGuardian 2× |
| Problem matters | 7 | [V] 170/1,645 apps leaked data |
| Solution fits the root cause | 4 | Optional scanner vs "nobody reviews" root cause |
| Works for real users | 4 | Adoption by beginners [?] |
| Fits existing systems | 7 | Pre-commit/CI drop-in [T] |
| Safe | 6 | False-confidence risk from static fixes |
| Buildable and demo-able | 7 | Narrow scope [T] |
| Different from what exists | 3 | Lovable's built-in scan covers the headline patterns [V] |

## What's genuinely strong
1. Very well-evidenced problem [V] (Veracode, GHSA advisory, Palmer scan, GitGuardian).
2. Natural research shape: hypothesis, fixed baseline, own test set [T].

## Weakest assumption
Existing free scanners and Lovable's checks miss these AI-specific patterns often enough to matter. Label [?]. Kill test: **collapses**.

## What we're overlooking
- **9 of 12 jurors** independently proposed the same angle: test whether access rules *actually block* an anonymous read/write (a live probe against your own Supabase), instead of checking that RLS is "on". This catches `using(true)`, which config checks miss. That is a real, different idea.
- Target Cursor/Copilot + Supabase users that Lovable's scan doesn't cover.

## An alternative approach (same problem, same user)
- Feed findings back into the AI coding agent so it regenerates secure code in the loop, instead of a separate scanner.

## Ranked improvements
| # | Change | Impact | Effort | Priority | Raised by | Inside the core? | How to check it worked |
|---|---|---|---|---|---|---|---|
| 1 | Live access probe: anon-key read/write against each table of your own app; show "Advisor passes, data still leaks" case | high | medium | P0 | 4, 5, 7, 8, 10, 11, 12, 9, 6 | yes | Demo: config check green, probe red |
| 2 | Target Cursor/Copilot + Supabase apps (not Lovable) | high | low | P0 | 1, 3, 5, 7, 12 | yes | Test set built with those tools |
| 3 | Run automatically as pre-push hook / GitHub Action (SARIF); warn, don't block | high | medium | P1 | 1, 2, 3, 9 | no | Zero-setup run on a repo |
| 4 | Fixes as diffs the dev approves, then re-probe | high | medium | P1 | 4, 8, 10 | yes | Re-probe after fix passes |
| 5 | Run baseline (Semgrep, Gitleaks, Supabase Advisor) first to measure real misses | high | low | P0 | 7, 12 | no | Baseline miss table |

## Next experiment (30 min)
Test: build one tiny Supabase app with Cursor/Copilot, add a `using(true)` policy, run Supabase Advisor + Semgrep + Gitleaks.
PASS if: the baseline tools report clean while an anon-key query reads the data.
FAIL if: an existing tool already flags it. Then the gap is smaller than claimed.

## If I were your team…
Only pick R1 if you go with the live-probe angle. The plain scanner is already built into Lovable.

**Next →** `/hack:improve` (REVISE)
