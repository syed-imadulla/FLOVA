CASE: R1 "Vibe-coded and vulnerable" (AI research track, The Big Hack 2.0, 24 h)
QUESTION ON TRIAL: Is this problem real and worth solving here, and can this team solve it for its real users in the time?
PROBLEM: Students and startups ship apps mostly written by AI tools. The code often has hard-coded secrets, injection flaws, missing access checks and outdated packages, and nobody reviews it. Challenge: make AI-written code safe to ship without slowing the developer.
REAL USERS: end user = student/early-startup developer using Cursor/Lovable/Copilot · least-digital user = first-year student who doesn't know what row-level security or injection is · operator = the developer / CI pipeline. Indirect: users of the shipped apps whose data leaks.
ROUGH DIRECTION (not final): hypothesis that a checker targeting the top AI-specific failure patterns (database access rules off, keys in frontend, routes without auth) finds more real issues with fewer false alarms than a Semgrep+Gitleaks baseline, with a one-click fix; evaluate on a seeded set of AI-built apps the team owns.
CONSTRAINTS: ~21 h left. Team: backend/DB, UI, AI/core logic, integrations/testing. Rubric: Innovation 25, Technical depth 25, Evidence 20, Impact 15, Presentation 15. Track rule: must state hypothesis, compare with a baseline, analyse failures; only prompting a hosted model is not accepted; test only own code.
EXISTING SOLUTIONS: Semgrep, Gitleaks, GitHub secret scanning, pre-commit pipelines are free and widely recommended [AI] snippet, not opened; an arXiv "VibeGuard" security-gate framework exists [AI] snippet, not opened.
EVIDENCE (labelled):
  [V] AI-generated code introduced risky security flaws in 45% of tests; >100 LLMs tested across Java, JavaScript, Python, C#; larger/newer models did not improve security — Veracode GenAI Code Security Report (Oct 2025 update page)
  [V] CVE-2025-48757: insufficient Supabase row-level security in Lovable-generated sites lets unauthenticated attackers read/write tables; CVSS 9.3 (GitHub advisory GHSA-773x-pxjg-gxgx, 30 May 2025)
  [V] Researcher scan: 170 of 1,645 Lovable showcase projects (~10.3%) had inadequate RLS; leaked names, emails, API keys, payment status (mattpalmer.io, 29 May 2025)
  [V] AI-assisted (Claude Code co-authored) commits leak secrets at ~2× baseline on public GitHub; ~28.6M new secrets in public commits 2025 — GitGuardian State of Secrets Sprawl 2026
  [V] 2.19 crore developers on GitHub in India (organiser booklet, citing GitHub Octoverse 2025)
  [?] Whether Indian student devs would run an extra check before shipping
  [?] Whether existing free scanners already catch these AI-specific patterns
KEY ASSUMPTIONS: none recorded yet.
