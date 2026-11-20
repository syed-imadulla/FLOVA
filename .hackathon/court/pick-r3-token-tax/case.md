CASE: R3 "The token tax" (AI research track, The Big Hack 2.0, 24 h)
QUESTION ON TRIAL: Is this problem real and worth solving here, and can this team solve it for its real users in the time?
PROBLEM: Tokenizers trained mostly on English split Indian-language text into many more tokens. Indian-language users pay more per request (APIs bill per token), wait longer, and fit less text in the context window. Challenge: reduce the cost or quality gap and measure exactly what the improvement costs.
REAL USERS: end user = Kannada-speaking person using an AI chatbot/app · least-digital user = Kannada-only user on slow mobile data · operator = developer/ML engineer building Kannada apps on language models.
ROUGH DIRECTION (not final): on a small open model, test a cheap fix (Kannada vocabulary extension with short continued training, or a no-retrain transliteration/compression pre-pass) vs the baseline tokenizer; report tokens saved, ₹ saved, speed, and quality loss, plus where it fails.
CONSTRAINTS: ~21 h left. Team: backend/DB, UI, AI/core logic, integrations/testing. **No GPU laptops** [T]. Rubric: Innovation 25, Technical depth 25, Evidence 20, Impact 15, Presentation 15. Track rule: hypothesis, baseline comparison, failure analysis required; just prompting a hosted model is not accepted.
EXISTING SOLUTIONS: Indic model builders (e.g., BharatGen PARAM-1, Sarvam-related work) already extend tokenizers for Indian languages [AI] snippet, not opened; newer tokenizers such as o200k_base already cut the gap a lot [V] (below).
EVIDENCE (labelled):
  [V] cl100k_base word-fertility vs English: Kannada 12.06×, Tamil 9.89×, Hindi 4.08×, Malayalam 13.04×; mean 8.0× over ten Indian languages — Srivastava, "The Tokenizer Tax", arXiv 2607.24276 (27 Jul 2026), Table 1
  [V] At a fixed 8,192-token budget, Kannada users get ~11.9% of the usable characters an English user gets (same paper)
  [V] o200k_base cuts the mean Indic tax from 8.0× to 2.1×; Kannada 2.72× under o200k_base, 1.86× under XLM-R (same paper, Section 6/Table 2)
  [V] Script-specific normalisation and Unigram LM / cluster-based vocabularies improve Indic tokenization (Brahma et al., arXiv 2506.17789, ACL 2026 Findings, abstract only)
  [AI] One report: vocab extension cut Indic fertility 3.55 → 2.18 (snippet, not opened)
  [?] Latency impact was not measured in the paper
  [?] Can the team train/evaluate anything meaningful on CPU in 24 h
KEY ASSUMPTIONS: none recorded yet.
