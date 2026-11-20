CASE: F1 "The irregular income problem" (Finance track, The Big Hack 2.0, 24 h)
QUESTION ON TRIAL: Is this problem real and worth solving here, and can this team solve it for its real users in the time?
PROBLEM: Gig workers (delivery riders, street vendors) earn different amounts each week. Budget tools assume a fixed monthly salary. In lean months they run short even if yearly income covers needs, then borrow at high interest, miss bills or sell assets.
REAL USERS: end user = delivery rider in Bengaluru · least-digital user = older Kannada-only street vendor with basic phone, cash income · operator = the worker; maybe a gig union/NGO or Karnataka gig-worker welfare board.
ROUGH DIRECTION (not final): a rule that pays the worker a fixed weekly "self-salary" from a buffer filled in good weeks, with an early lean-month warning; voice/WhatsApp input in Kannada; evidence = backtest the rule vs no rule on income patterns (days short, debt avoided).
CONSTRAINTS: ~21 h left. Team of 4: backend/DB, UI, AI/core logic, integrations/testing. Rubric: Innovation 25, Technical depth (difficult cases) 25, Evidence 20, Impact 15, Presentation 15. Track rule: working prototype; synthetic data OK if labelled. Tool must not hold money (regulated).
EXISTING SOLUTIONS: budgeting/expense apps and gig-worker finance apps exist [AI] snippet, not opened; no independent evaluation found that they improve outcomes [AI].
EVIDENCE (labelled):
  [V] Gig workforce 77 lakh (2020-21) → 2.35 crore projected 2029-30, NITI Aayog report (Business Today, 27 Jun 2022)
  [V] ~40% of gig workers earn < ₹15,000/month; many have thin-file credit histories limiting formal finance — Economic Survey 2025-26 (Upstox, 29 Jan 2026)
  [V] Platform gig workers were more likely to borrow or sell assets (less likely to use savings) than non-platform workers when income fell — ADBI Working Paper 1495 (Apr 2025, abstract)
  [V] Delivery drivers: ~₹170/h gross, ~₹115/h after costs, ~₹75/h net for consistent drivers — IDInsight 2024 via IDR (20 Jan 2026)
  [V] Karnataka passed Platform-Based Gig Workers Act 2025 (organiser booklet)
  [?] How often lean months hit a typical rider, and size of the dip
  [?] Whether riders would follow a buffer rule
  [T] No real rider income data available; demo uses synthetic data
KEY ASSUMPTIONS: none recorded yet.
