# STATE — The Big Hack 2.0

> Summary: The Big Hack 2.0 · phase 3 pick done (F1) · next: /hack:users

Schema version: 2
Last updated: 2026-11-20 15:20 IST

| Field | Value |
|---|---|
| Event | The Big Hack 2.0 (Tech Habba 2.0) |
| Track | Finance |
| Event length | 24 h (offline) |
| Mode | full |
| Captain (final decider) | M1 (backend and database) |
| Chosen statement | F1 The irregular income problem |
| Chosen idea | |
| Motto | |
| CORE version | — |
| Core locked at | |
| Idea freeze | 16:00 IST, 20 Nov 2026 (target) |
| Code freeze | 08:30 IST, 21 Nov 2026 (target) |
| Submission deadline (with time zone) | ~12:00 IST, 21 Nov 2026 (ASSUMED) |

## Time guard
- Phases 1–10 (idea locked): 80–100 min, so aim to lock by ~15:30–16:00 IST.
- Phases 11–13 (plan, verify, pitch outline): ~40 min.
- Build window: ~16:00 IST 20 Nov → 08:30 IST 21 Nov (~16.5 h).
- 08:30–12:00 IST 21 Nov: bug fixes only, backup demo recording, PPT, README, submission.

## Phases
| # | Phase | Status | When | Notes |
|---|---|---|---|---|
| 1 | start | done | 2026-11-20 13:55 IST | Rubric from rulebook; times partly assumed |
| 2 | decode | done | 2026-11-20 14:15 IST | 9 decoded; B1–B3 dropped; strongest F1, R3 |
| 3 | pick (trial) | done | 2026-11-20 15:20 IST | 3 trials, all REVISE; F1 chosen by M1 |
| 4 | users | next | | |
| 5 | ideate | not started | | |
| 6 | validate | not started | | |
| 7 | compete | not started | | |
| 8 | stress | not started | | |
| 9 | improve | not started | | |
| 10 | lock | not started | | |
| 11 | plan | not started | | |
| 12 | verify (trial) | not started | | |
| 13 | pitch | not started | | |
| 14 | ship | not started | | |

Status values: done · skipped (reason) · next · not started.

## Decisions log
| Time | Decision | Why | Rejected (and why) | By |
|---|---|---|---|---|
| 13:55 IST | Mode = full | 24 h event | quick (only for events under 12 h) | Claude (rule) |
| 13:55 IST | Use rulebook rubric (Tech 25 / Innov 20 / Impact 20 / Proto 20 / Pres 15) | Stated in the rulebook, marked indicative | default rubric (not needed) | team confirmed |
| 13:55 IST | Assume 10 slides, ~5 min demo + Q&A, submission at start + 24 h | Not in rulebook | — | team ("assume defaults") |
| 13:58 IST | Captain = M1 | Team chose | — | team |
| 14:15 IST | Score against booklet rubric (Innovation 25 / Tech depth 25 / Evidence 20 / Impact 15 / Presentation 15) | Newer, specific to these problems; rulebook weights were "indicative" | Rulebook rubric (superseded) | team |
| 14:15 IST | Drop B1, B2, B3 (whole cyber + blockchain track) | Blockchain is mandatory there and nobody has blockchain/Solidity skill; B2 most crowded | — (B3 looked strong on Evidence, still dropped) | team |
| 14:15 IST | No GPU laptops, no organiser hints | Team info | — | team |
| 15:20 IST | Pick **F1 Irregular income** | Most juror support (NG 6 · G 3 · IE 3), strongest [V] problem evidence, highest impact, fits team | R1 (Lovable already scans same patterns; backup), R3 (o200k already closes much of gap; 4 GUILTY), F2/F3/R2 (lower scores, data/compute issues) | M1 (captain) |

## Locked
- Problem:
- Main user:
- Core journey:
- Motto:

## Pending
- [x] Captain confirmed: M1
- [ ] Confirm official end time, slide limit and demo length at the briefing
- [ ] Confirm with organisers which rubric is final (booklet vs rulebook)
- [ ] Run 30-min surplus simulation (ASSUMPTIONS #1, #3) before ideating further
- [ ] Talk to 2–3 delivery riders near campus if possible (ASSUMPTIONS #2)
- [x] Problem statements decoded (STATEMENTS.md)
- [ ] Check for sponsor tech or required APIs

## Rules
- After lock, the problem, main user, core journey and motto don't change without the captain's OK. Solution details can still improve through `/hack:improve`.
- No code from before the event. Start a fresh repo during the event.

## Next command
`/hack:users` (F1: riders, vendors, least-digital user, union/NGO). Consider `/hack:improve` on the F1 verdict too.
