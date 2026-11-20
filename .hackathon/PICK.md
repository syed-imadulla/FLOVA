# PICK — F1 The irregular income problem

> Summary: F1 chosen by captain M1 at ~15:20 IST after 3 trials (all REVISE). F1 had the strongest support (NG 6 · G 3 · IE 3). Riskiest assumption: good weeks leave enough surplus to fill a buffer.

## Weights used (adjusted to booklet rubric)
Innovation 25 → "Room for directions" raised to ×3. Evidence 20 → "Data" raised to ×2. Max 95.

| Statement | Real ×3 | User ×2 | Rubric ×3 | Directions ×3 | Buildable ×3 | Wow ×2 | Data ×2 | Team ×1 | Total /95 | Certainty | Red flags |
|---|---|---|---|---|---|---|---|---|---|---|---|
| F1 Irregular income | 4 | 5 | 4 | 4 | 5 | 4 | 3 | 3 | **78** | medium | Synthetic data only (lowers) |
| R1 Vibe-coded | 4 | 4 | 4 | 3 | 4 | 4 | 4 | 4 | **73** | medium | Free tools + Lovable built-in scan (lowers) |
| R3 Token tax | 4 | 3 | 5 | 3 | 3 | 3 | 5 | 3 | **70** | medium | No GPU (lowers) |
| F2 Credit-invisible | 4 | 4 | 3 | 4 | 4 | 3 | 2 | 2 | 65 | low | No real UPI/AA data; fairness hard to prove (lowers) |
| F3 Finfluencers | 4 | 4 | 3 | 3 | 3 | 4 | 2 | 3 | 62 | low | Tip data hard to get; SEBI PaRRVA exists (lowers) |
| R2 Jailbreaks | 4 | 3 | 4 | 3 | 2 | 3 | 3 | 2 | 59 | low | No GPU; harmful-output handling (lowers) |

No red flag removed a statement outright. (B1–B3 were dropped in `/hack:decode`.)

## Evidence boost (sources opened before trial, 2026-11-20)
| Statement | Claim | Label | Source |
|---|---|---|---|
| F1 | 77 lakh gig workers (2020-21) → 2.35 crore (2029-30) | [V] | [Business Today on NITI Aayog report](https://www.businesstoday.in/amp/latest/economy/story/gig-workforce-expected-to-expand-to-2-35-cr-by-2029-30-niti-aayog-report-339332-2022-06-27) (27 Jun 2022) |
| F1 | ~40% of gig workers earn < ₹15,000/month; thin-file credit histories | [V] | [Upstox on Economic Survey 2025-26](https://upstox.com/news/business-news/latest-updates/40-of-gig-workers-earn-under-15-000-a-month-economic-survey-pitches-pay-floors-algorithm-checks/article-188520) (29 Jan 2026) |
| F1 | Platform workers more likely to borrow or sell assets than use savings when income falls | [V] | [ADBI WP 1495](https://www.adb.org/publications/exploring-economic-challenges-and-resilience-during-covid-19-of-low-skilled-gig-workers-in-urban-india) (Apr 2025, abstract) |
| F1 | Delivery drivers ~₹170/h gross, ~₹115/h after costs, ~₹75/h net (consistent drivers); n = 2,547 | [V] | [IDR on IDInsight 2024 study](https://idronline.org/article/livelihoods/what-the-data-reveals-about-indias-gig-workers/) (20 Jan 2026) |
| R1 | AI code had risky flaws in 45% of tests, >100 LLMs | [V] | [Veracode GenAI report page](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/) (Oct 2025) |
| R1 | CVE-2025-48757: Lovable RLS flaw, CVSS 9.3; 170 / 1,645 projects | [V] | [GHSA-773x-pxjg-gxgx](https://github.com/advisories/GHSA-773x-pxjg-gxgx), [mattpalmer.io](https://mattpalmer.io/posts/statement-on-CVE-2025-48757) (May 2025) |
| R1 | AI-assisted commits leak secrets ~2× | [V] | [GitGuardian 2026](https://www.gitguardian.com/state-of-secrets-sprawl-report-2026) |
| R3 | Kannada 12.06× (cl100k), 2.72× (o200k); 11.9% context | [V] | [arXiv 2607.24276](https://arxiv.org/abs/2607.24276) (27 Jul 2026) |

Failed fetches (not guessed): NITI Aayog PDF (403), IFMR LEAD PDF (404), NVD/cve.org pages (empty JS shells), arXiv 2506.17789 full text (404).

## Trials
| Statement | Score | Certainty | Decision | Votes (NG · G · IE) | Avg conf | Weakest assumption | Best fix | Trial |
|---|---|---|---|---|---|---|---|---|
| F1 | 78 | medium | REVISE | 6 · 3 · 3 | 5.8 | Good weeks leave surplus; workers won't spend the buffer | Calibrate synthetic data on published earnings; show who it can't help | [court/pick-f1-irregular-income/verdict.md](court/pick-f1-irregular-income/verdict.md) |
| R1 | 73 | medium | REVISE | 5 · 3 · 4 | 5.9 | Free scanners + Lovable miss these patterns | Live anon-key access probe (catches `using(true)`) | [court/pick-r1-vibe-code/verdict.md](court/pick-r1-vibe-code/verdict.md) |
| R3 | 70 | medium | REVISE | 5 · 4 · 3 | 5.9 | CPU-only training gives trustworthy quality numbers | Baseline against o200k + Indic tokenizers | [court/pick-r3-token-tax/verdict.md](court/pick-r3-token-tax/verdict.md) |

> Simulated jurors are perspectives, not real users or experts. These verdicts guide what to test, not proof.

## Final pick
**F1 The irregular income problem**, decided by captain M1.

Why:
1. Most juror support (6 NOT GUILTY, fewest GUILTY) and the strongest official problem evidence [V].
2. The weakest assumption can be tested in 30 minutes (52-week surplus simulation for 3 rider types), and the other gaps (weekly input, keypad-phone channel, prior-art check) are cheap.
3. Highest impact, and the rule engine + backtest suits the team (M1 backend, M3 core logic).

## Rejected (and why)
| Statement | Why not |
|---|---|
| R1 Vibe-coded | Close second. Lovable already scans the same patterns at publish [V]; only stands out with the live-probe angle. Kept as backup. |
| R3 Token tax | Most GUILTY votes (4). Newer o200k tokenizer already cuts the Kannada gap to 2.72× [V]; hosted-API devs can't adopt a new tokenizer; CPU-only quality eval uncertain. |
| F2 Credit-invisible | Scored 65; no real UPI/AA data, fairness hard to prove in 24 h. Not trialled. |
| F3 Finfluencers | Scored 62; tip data hard to collect, "measurably improves" hard to show in 24 h. Not trialled. |
| R2 Jailbreaks | Scored 59; no GPU and harmful-output handling. Not trialled. |
| B1–B3 | Dropped in decode (mandatory blockchain, no team skill). |

## Assumptions carried forward (to ASSUMPTIONS.md)
1. Good weeks leave enough spare money to fill a buffer (collapses).
2. Workers won't spend the buffer under pressure / will follow a self-salary rule (collapses).
3. The cause is timing of income, not only low income (collapses).
4. Workers will give income input regularly (weakens; plan: once a week).
5. The least-digital user can be reached without a smartphone (weakens).
6. Synthetic income patterns are realistic enough for the backtest to mean something (weakens).
7. Lean-month warnings won't cause needless cuts to food or fuel (minor).
8. Existing gig-finance apps don't already do self-salary smoothing in Kannada (weakens).
