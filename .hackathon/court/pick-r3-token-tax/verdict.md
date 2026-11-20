# VERDICT — pick-r3-token-tax

> Summary: REVISE · NOT GUILTY 5 · GUILTY 4 · INSUFFICIENT EVIDENCE 3 · 12 of 12 valid votes

**DECISION: REVISE**
On trial: "Is this problem real and worth solving here, and can this team solve it for its real users in the time?"
Jury: universal seats (domain unclear: NLP; domain pro set to an Indic NLP engineer) · full 12
Average confidence: 5.9/10 (how sure jurors were, not a probability of success)

> Simulated jurors are perspectives, not real users or experts. Use this verdict to decide what to test and fix, not as proof.

## Votes
| # | Juror | Vote | Conf | Evidence | Reason |
|---|---|---|---|---|---|
| 1 | End user | GUILTY | 6 | weak | I never see token bills; toy CPU benchmark changes nothing for me |
| 2 | Least-digital user | INSUFFICIENT | 6 | weak | Needs nothing from me, but no proof I'd feel it; transliteration may garble Kannada |
| 3 | Front-line worker | INSUFFICIENT | 6 | medium | Hosted-API devs can't swap tokenizers; quality loss unknown |
| 4 | Domain professional (Indic NLP) | NOT GUILTY | 6 | medium | Real gap (2.72× even on o200k); CPU measurement legitimate |
| 5 | Workaround user | GUILTY | 6 | medium | My workaround is o200k or an Indic model; toy extension not better |
| 6 | Root-cause analyst | NOT GUILTY | 5 | medium | Vocab extension hits the cause; pre-pass only a symptom |
| 7 | 'Already exists' researcher | GUILTY | 6 | medium | o200k/XLM-R already shrink gap; vocab extension published |
| 8 | Safety & ethics | NOT GUILTY | 6 | medium | Output is a measurement, low harm |
| 9 | Systems person | GUILTY | 6 | medium | Needs self-hosting; hosted-API devs can't adopt |
| 10 | Engineer | NOT GUILTY | 6 | medium | Tokenizer benchmark buildable on CPU; quality part risky |
| 11 | Statement-owner judge | NOT GUILTY | 6 | medium | Answers the challenge; innovation weak |
| 12 | Sceptic | INSUFFICIENT | 6 | medium | o200k already shrinks gap; savings/latency unsourced |

No vote or invalid: none. Raw votes: `votes-raw.json` (unedited). Retries: `trial-log.md`.

## Contradictions between jurors
| Jurors | Disagreement | Evidence favours |
|---|---|---|
| Domain pro / root-cause vs workaround / systems | Fix at the root vs nobody can adopt it | Adoption side: most Kannada apps use hosted APIs [AI]; unresolved |
| Front-line vs root-cause | Drop-in pre-pass vs pre-pass is only a symptom | Unresolved; depends on measured quality loss |

## Ratings /10
| Item | Score | Why (labels) |
|---|---|---|
| Problem is real | 8 | [V] 12.06× cl100k; 2.72× o200k; 11.9% context |
| Problem matters | 5 | Users rarely see token cost [AI]; latency unmeasured [?] |
| Solution fits the root cause | 6 | Vocab extension yes; pre-pass no |
| Works for real users | 3 | Hosted-API devs can't adopt [AI] |
| Fits existing systems | 3 | Self-hosting needed |
| Safe | 7 | Measurement output |
| Buildable and demo-able | 6 | Benchmark yes; CPU quality eval [?] |
| Different from what exists | 3 | Published vocab-extension work; o200k already better |

## What's genuinely strong
1. The gap is measured precisely [V] (arXiv 2607.24276).
2. The tokenizer benchmark part is cheap and reproducible on CPU [V] (SentencePiece).

## Weakest assumption
CPU-only continued training gives quality numbers a developer can trust. Label [?]. Kill test: **weakens** (could fall back to a no-retrain benchmark).

## What we're overlooking
- **9 of 12 jurors:** the baseline must be o200k_base and Indic tokenizers, not cl100k. Against cl100k the result overstates savings.
- Developers on hosted APIs can't swap tokenizers, so a tool that *picks* the cheapest model/tokenizer for their Kannada data may help more.

## An alternative approach (same problem, same user)
- A drop-in proxy in front of hosted APIs with a no-retrain pre-pass, plus a meaning check with auto-fallback to raw text.

## Ranked improvements
| # | Change | Impact | Effort | Priority | Raised by | Inside the core? | How to check it worked |
|---|---|---|---|---|---|---|---|
| 1 | Baselines: o200k_base, XLM-R, an Indic tokenizer (not just cl100k) | high | low | P0 | 4, 5, 6, 7, 8, 9, 10, 11, 12 | yes | Results table has 3+ baselines |
| 2 | One-hour CPU pilot: SentencePiece + tiny-model perplexity | high | low | P0 | 10, 12 | yes | Pilot finishes with a number |
| 3 | Native-speaker meaning check on 30–50 outputs | high | low | P1 | 2, 8 | yes | Error rate reported |
| 4 | Measure end-to-end latency on throttled mobile | high | medium | P2 | 2, 1 | no | Latency table |
| 5 | Tool that picks cheapest tokenizer/model for a dev's own data | medium | low | P2 | 5 | no | Works on sample data |

## Next experiment (30 min)
Test: count tokens on 1,000 Kannada sentences (FLORES) with cl100k, o200k, XLM-R and a quick 8k SentencePiece trained on Kannada Wikipedia.
PASS if: our vocab beats o200k by ≥ 30% fewer tokens.
FAIL if: the gain over o200k is small. Then the story is weak against modern models.

## If I were your team…
Pick R3 only if the 30-minute o200k comparison shows a big gain. Otherwise the problem has largely been solved already.

**Next →** `/hack:improve` (REVISE)
