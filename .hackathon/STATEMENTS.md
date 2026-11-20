# STATEMENTS — The Big Hack 2.0

> Summary: 9 statements decoded across 3 tracks · strongest looking: F1, R3 · dropped: B1, B2, B3 (whole cybersecurity + blockchain track).

Source: `~/Downloads/The_Big_Hack_2.0_Problem_Statements.pdf`, read 2026-11-20 14:05 IST.
Label notes: numbers marked "[V] booklet" come from the organiser's booklet (which I read). The booklet names its original sources, but I didn't open those. Web search results I didn't open are marked "[AI] snippet, not opened".

## ⚠ Rubric conflict (resolved 14:15 IST: team uses the booklet rubric)
The booklet (page 15) gives **different criteria** from the rulebook:

| Booklet (problem-statement PDF) | | Rulebook | |
|---|---|---|---|
| Innovation | 25 | Technical Implementation | 25 |
| Technical depth (incl. "handles difficult cases") | 25 | Innovation and Creativity | 20 |
| **Evidence** ("how convincingly you show it works") | 20 | Problem Relevance and Impact | 20 |
| Impact (real users in India) | 15 | Functionality and Prototype | 20 |
| Presentation | 15 | Presentation and Demonstration | 15 |

The booklet is newer and specific to these problems, and the rulebook calls its own weights "indicative". **Use the booklet rubric unless the organisers say otherwise.** The big change is that **Evidence (20)** now carries real weight: we need measured results against a baseline, not just a working demo.

## Track rules (apply to every statement in the track)
- **Finance (F):** must be a working prototype. Synthetic data is OK, but say clearly which data is real and which is synthetic.
- **Cyber + blockchain (B):** a blockchain must be a *core* part of the solution. Testnet or local chain is OK. If it would work the same with the blockchain removed, it fails the rule.
- **AI research (R):** must state a hypothesis/method, evaluate against a baseline, and analyse where it fails. A negative result counts if measured properly. Just prompting a hosted model doesn't count. Don't publish harmful outputs that work. Only test code you own.

## Summary table
| # | Statement | One-line problem | End user | Obvious idea | Smarter angle | Biggest unknown |
|---|---|---|---|---|---|---|
| F1 | Irregular income | Gig workers run short in lean months even when their yearly income is enough | Delivery riders / street vendors in Bengaluru | Budgeting app with charts | A self-paid "weekly salary" from a buffer the tool fills in good weeks; backtest the rule on real income patterns; WhatsApp/voice, no app | Can we get realistic weekly income data for riders? |
| F2 | Credit-invisible MSMEs | Lenders can't tell a healthy no-history shop from a risky one | Kirana/tailor owners + small-loan officers | "AI credit score from UPI data" | Start with a small loan that grows with repayments (credit ladder) + explainable, fairness-tested terms the loan officer can override | No real UPI/AA data, so everything is synthetic; fairness hard to prove |
| F3 | Finfluencer noise | Retail investors act on tips whose quality they can't judge | Young retail investors on Telegram/YouTube | Tip-accuracy leaderboard | "Pre-trade pause": paste a tip and see the source's past hit rate, pump-and-dump signs and SEBI registration, never a buy/sell | Getting tip history at scale (scraping Telegram/YouTube) |
| B1 | Know what you're signing | Signers approve transactions they can't read | Multisig signers at exchanges/DAOs | Transaction "explainer" plugin | An on-chain guard contract that only lets a multisig run a transaction if it matches a human-readable intent signed separately | Strong existing players (Blockaid, Tenderly); hard to beat in 24 h |
| B2 | Fair tickets | Bots, scalpers and fakes beat real fans | Concert fans + organisers + gate staff | NFT tickets with resale cap | Rotating QR codes tied to the identity behind the ticket + capped resale through the contract only + gate check that works offline | Most teams will build this; is it new? |
| B3 | Logs attacker can't erase | Root attacker edits logs, so nobody can trust them | Security/IT team at a startup or bank + the auditor/court | "Store logs on a blockchain" | Hash-chain logs on the host, ship them to an outside witness, anchor Merkle roots to a chain every N min; a one-click "proof bundle" the auditor verifies *without trusting the company* | Gas/latency trade-off; how a court accepts it (Indian evidence law) |
| R1 | Vibe-coded and vulnerable | AI-written code ships with security holes | Student/startup devs using Cursor/Lovable | Another code scanner | Pre-commit guard tuned to AI-specific mistakes (missing RLS, hard-coded keys), measured against a Semgrep+Gitleaks baseline on a seeded vulnerable set | Building a fair labelled test set fast |
| R2 | Jailbreaks speak Kannada | Models refuse harmful prompts in English but not Kannada/Kanglish | Indian chatbot users + companies deploying LLMs | Translate prompts, run them, report a number | Measure the gap in Kannada script vs romanised vs code-mixed on a small open model, then test a cheap fix (normalise/translate-back guard) against a baseline | GPU/compute on laptops; safe handling of harmful outputs |
| R3 | Token tax | Kannada costs ~12× the tokens of English | Indian-language LLM users + devs | Tokenizer fertility chart | Cheap fix (vocab extension / transliteration pre-pass) on an open model, with measured cost in quality, latency and ₹ | Can we retrain/extend and evaluate quality in 24 h on laptops? |

---

## Statement F1: The irregular income problem
> Build a solution that helps a person with irregular income stay financially stable through the months when they earn less.

| Field | Notes |
|---|---|
| In one line | Income goes up and down, but bills don't, so a bad month means debt. |
| Who posted it and why | Organisers (Finance track). They want real Indian users and a measurable "stable" definition, which the booklet demands. |
| Real end user | Delivery riders (Swiggy/Zomato/Blinkit) or street vendors in Bengaluru. |
| How bad / often / many | 2.35 crore gig workers projected by 2029-30 [V] booklet (cites NITI Aayog 2022); 40% earn < ₹15k/month [V] booklet (cites Economic Survey 2025-26). Research finds gig workers need flexible saving and have poor resilience [AI] snippet, not opened ([IFMR LEAD](https://ifmrlead.org/wp-content/uploads/2024/01/Measuring-Financial-Health-in-LMIC_Final-Report_December-2023.pdf), 2023). How often lean months hit [?]. |
| Operator | The worker themself, maybe a gig-worker union or NGO, or the platform (welfare board under Karnataka Gig Workers Act 2025 [V] booklet). |
| Least-digital user | Older street vendor with a basic phone, Kannada-only, cash income. |
| Where it happens | Roadside, between orders. Cheap Android phone, patchy data, Kannada/Hindi/English, UPI usage high. |
| Hidden constraints | No time to type. Cash income is invisible to apps. Can't hold or move money without being a regulated entity, so "nudge + UPI autopay/RD" is safer than holding funds. Data privacy. |
| Root cause (3 whys) | Short in lean month → no buffer → good-month money gets spent → nothing turns a good month into savings automatically, and tools assume fixed monthly salary. |
| Data situation | No public per-rider income series. Use synthetic data built from published rider earnings and seasonality (rain, festivals), clearly labelled. |
| Obvious idea | Budgeting app with charts + expense tracker. |
| Smarter angle | **Pay yourself a fixed weekly "salary"**: a rule-based buffer skims good weeks and tops up lean ones. A forecast flags a coming lean month early (monsoon, post-Diwali). WhatsApp/voice in Kannada. **Evidence:** backtest the rule vs no-rule on income patterns, measuring days short and debt avoided. |
| 24 h MVP | Log income by voice/WhatsApp → buffer engine → weekly payout plan + lean-month warning → simulation showing shortfall days drop vs baseline. |
| Unknowns to ask | Can we use synthetic data for the whole demo? Is there a mentor from a gig union/NGO? Does a WhatsApp sandbox count? |
| Quick sources | [Outlook Money](https://www.outlookmoney.com/personal-finance/no-fixed-paycheck-heres-how-to-build-wealth) · [WageIndicator](https://wageindicator.org/work/platform-economy/costs/india-inflation) · [IFMR LEAD](https://ifmrlead.org/?p=19618), all snippets, not opened (2026-11-20) |

---

## Statement F2: Credit for the credit-invisible
> Design a fairer way to decide which small businesses get credit, how much they get and on what terms, when the business has no formal credit history.

| Field | Notes |
|---|---|
| In one line | No history means no loan or an expensive one, even for a good shop. |
| Who posted it and why | Organisers. "Fairer", "how much" and "on what terms" are the key words, so a plain yes/no score misses half the brief. |
| Real end user | Kirana/tailor/repair shop owner with UPI sales, plus the loan officer at an NBFC/bank. |
| How bad / often / many | ₹30 lakh crore MSME credit gap (~24% of demand) [V] booklet (cites SIDBI); 35% gap for women-owned [V] booklet; 7.28 crore Udyam registrations [V] booklet. ~72% of Indian transactions cash-based [AI] snippet, not opened. |
| Operator | NBFC / bank credit team, or a lending app on OCEN. |
| Least-digital user | Woman-run home business, mostly cash, no GST. |
| Where it happens | Shop counter; owner's Android + UPI QR; lender's web dashboard. |
| Hidden constraints | RBI digital lending rules; AA consent framework; fairness/bias rules (no gender/caste proxies); explainability for rejections; AI must not make the final decision alone. |
| Root cause (3 whys) | Rejected → lender can't measure risk → scoring relies on bureau history and collateral → cash-flow data (UPI, AA, GST) exists but isn't used in a trusted, fair way by small lenders. |
| Data situation | No real UPI/AA data available. Fully synthetic transaction streams. Account Aggregator sandbox exists [?]. |
| Obvious idea | ML credit score from UPI transactions. |
| Smarter angle | **Credit ladder:** a small first loan sized from steady weekly cash flow, then limit and rate improve automatically with on-time repayment, so terms are earned. Explainable reasons + fairness test across synthetic groups + officer override. |
| 24 h MVP | Upload/consent synthetic statement → cash-flow features → offer (amount, rate, tenure) with reasons → ladder simulation → fairness report. |
| Unknowns to ask | Is synthetic-only OK for "Evidence"? Any AA sandbox access? |
| Quick sources | [Sattva OCEN primer](https://www.sattva.co.in/wp-content/uploads/2022/11/OCEN.pdf) · [IIFL OCEN](https://www.iifl.com/blogs/other/open-credit-enablement-network-ocen-the-future-of-micro-business-credit), snippets, not opened |

---

## Statement F3: Signal versus noise for retail investors
> Build a tool that measurably improves how a retail investor makes decisions, without ever telling them what to buy or sell.

| Field | Notes |
|---|---|
| In one line | People trade on social-media tips they can't judge, and lose. |
| Who posted it and why | Organisers. "Measurably improves" + "never tell buy/sell" are hard constraints (SEBI advice rules). |
| Real end user | 20–30 yr-old retail investor in Telegram/YouTube tip groups. |
| How bad / often / many | 62% say finfluencers influence decisions [V] booklet (SEBI survey 2025); 91% of F&O traders lost money, ₹1.06 lakh crore net loss 2024-25 [V] booklet. Only ~2% of finfluencers SEBI-registered [AI] snippet, not opened (CFA Institute). |
| Operator | The investor; maybe a broker app as an add-on. |
| Least-digital user | First-time investor in a Tier-2 town reading tips in Hindi/Kannada. |
| Where it happens | Phone, between Telegram and broker app; seconds before a trade. |
| Hidden constraints | Must not be investment advice (SEBI RA/IA rules). Scraping platforms' ToS. SEBI's own PaRRVA performance-verification framework is coming [AI] snippet, not opened, which is a competitor/ally. |
| Root cause (3 whys) | Lose money → act on bad tips → can't see a source's track record → nobody records tips and outcomes over time. |
| Data situation | Market prices public (NSE/yfinance). Tip history must be collected or mocked. |
| Obvious idea | Finfluencer accuracy leaderboard. |
| Smarter angle | **Pre-trade pause:** forward a tip and get the source's verified hit rate, pump-and-dump signs (volume spike, low float, coordinated posting), SEBI registration check. Measure decision quality in a small user test (paper trades with vs without). |
| 24 h MVP | Telegram bot: forward tip → extract stock + claim → check history + red flags → "here's what we know", no advice. |
| Unknowns to ask | Can we scrape public Telegram channels? How do we prove "measurably improves" in 24 h? |
| Quick sources | [Storyboard18 / CFA](https://www.storyboard18.com/how-it-works/33-finfluencers-give-stock-tips-2-sebi-registered-63-hide-sponsorships-report-59744.htm) · [CA Alley PaRRVA](https://caalley.com/news-updates/indian-news/parrva-explained-sebis-verification-tool-to-check-performance-claims), snippets, not opened |

---

## Statement B1: Know what you're signing
> Make it impossible, or at least very hard, for a person or an organisation to sign a transaction whose real effect they do not understand.

| Field | Notes |
|---|---|
| In one line | Signers click Confirm on hex they can't read, and get robbed. |
| Who posted it and why | Organisers. WazirX/CoinDCX hacks make it India-relevant. "Impossible or very hard" hints at *enforcement*, not just warnings. |
| Real end user | Multisig signers at an exchange/company treasury; individual crypto users. |
| How bad / often / many | $230M WazirX (2024), $44M CoinDCX (2025) [V] booklet. India #1 crypto adoption [V] booklet (Chainalysis). |
| Operator | Treasury/security team. |
| Least-digital user | Retail user on a mobile wallet who doesn't know what "approve" means. |
| Where it happens | Wallet pop-up, hardware wallet screen, Safe UI. |
| Hidden constraints | Display itself can be compromised (Bybit) [AI] snippet, not opened. Simulation tools already exist. Hardware wallets show only hashes. |
| Root cause (3 whys) | Wrong tx signed → signer trusts the screen → screen shows raw data or is spoofed → no independent, enforced check that intent equals effect. |
| Data situation | Public chain data, local fork (Anvil/Hardhat) for simulation. Fine. |
| Obvious idea | Browser extension that explains transactions in English. |
| Smarter angle | **Intent guard contract:** signers each sign a plain-language intent ("send 10 ETH to X") on a second device. An on-chain Safe guard only executes if the simulated effect matches the intent. |
| 24 h MVP | Local Safe + guard → malicious tx demo (looks like transfer, actually upgrades proxy) → blocked with reason. |
| Unknowns to ask | Does a guard module count as "blockchain core"? (likely yes) |
| Quick sources | [Candide blind signing](https://www.candide.dev/blog/blind-signing) · [Blockaid Cosigner](https://blockaid.io/blog/cosigner-the-onchain-security-layer-your-multisig-is-missing-blind-signing) · [Spark glossary](https://www.spark.money/glossary/transaction-simulation), snippets, not opened |

---

## Statement B2: Fair tickets
> Design a ticketing system where fans get tickets at a fair price, resale is possible but cannot be exploited, and a fake ticket is useless at the gate.

| Field | Notes |
|---|---|
| In one line | Bots buy first, scalpers resell at 10×, fakes sold on Instagram. |
| Who posted it and why | Organisers. Coldplay/Diljit incidents. Three parts: fair price, exploit-proof resale, fake-proof gate. |
| Real end user | Fans; organisers; gate staff. |
| How bad / often / many | 1.3 crore in queue; resale up to ₹3 lakh; ED raids in 5 cities [V] booklet. No anti-scalping law in India [V] booklet. |
| Operator | Event organiser + gate staff with phones. |
| Least-digital user | Fan without a crypto wallet (most fans). Gate staff with poor network. |
| Where it happens | Online queue; venue gate with 50,000 people and weak signal. |
| Hidden constraints | Fans won't install wallets. Gate check must be fast and offline. Identity checks vs privacy (Aadhaar ideas are risky). |
| Root cause (3 whys) | Fans overpay → resale uncontrolled + bots win queue → tickets are anonymous, transferable bearer tokens with no price rule. |
| Data situation | All synthetic; fine. |
| Obvious idea | NFT tickets with resale price cap. **Most crowded idea in the booklet.** |
| Smarter angle | Custodial wallet (fan never sees crypto), lottery instead of queue to beat bots, resale only via contract at ≤ face + x%, rotating signed QR verified offline at gate. |
| 24 h MVP | Buy → resell capped → fake/screenshot QR rejected at gate. |
| Unknowns to ask | How are other teams' B2 ideas going to differ? |
| Quick sources | [Forkast](https://forkast.news/could-nfts-prevent-taylor-swift-concert-sales-fiasco/) · [Coldplay case study](https://altinsights.substack.com/p/case-study-analyzing-the-coldplay-ticketing-frenzy-in-india), snippets, not opened |

---

## Statement B3: Logs the attacker can't erase
> Make an organisation's security logs and incident evidence tamper-evident and provable to an auditor or court, even if the attacker has root access.

| Field | Notes |
|---|---|
| In one line | A hacker with root deletes the logs, and then nobody can prove what happened. |
| Who posted it and why | Organisers. CERT-In 180-day retention + 6-hour reporting make it compliance-real. "Provable to an auditor or court" is the key phrase. |
| Real end user | Security/IT team at a startup, bank or IT firm, plus the **auditor / investigator / court** who must trust the logs. |
| How bad / often / many | CERT-In: 180 days retention, 6 h reporting, ~30 lakh incidents in 2025 [V] booklet. |
| Operator | DevOps/SecOps engineer; auditor uses a verify tool. |
| Least-digital user | Non-technical auditor or judge who must understand "this log is genuine". |
| Where it happens | Linux servers, cloud VMs, SIEM; later in an audit room or court. |
| Hidden constraints | Attacker has root, so anything on the box can be faked *after* compromise; what matters is what left the box *before*. Gas cost and frequency trade-off. Log privacy (only hashes on-chain). Indian evidence rules for electronic records [?]. |
| Root cause (3 whys) | Logs untrusted → attacker can edit them → logs live on the machine the attacker controls, with no outside copy or commitment. |
| Data situation | Generate our own logs (auth.log, app logs). Everything real, no mocks needed. Strong for Evidence. |
| Obvious idea | "Put logs on blockchain" or hash each log line to a chain. |
| Smarter angle | Per-line hash chain on host + streaming to an outside witness + Merkle root anchored to a testnet every N seconds. Then an **attack demo**: root deletes/edits lines, the verifier pinpoints exactly which lines and when. Produces a court-ready proof bundle. Measure detection rate, anchoring delay and gas per day. |
| 24 h MVP | Agent tails logs → hash chain → batch → anchor on Sepolia/Polygon Amoy → run attack script → verifier UI shows tampered lines in red + proof. |
| Unknowns to ask | Do judges expect a real chain (testnet) or local? Any lawyer/mentor on electronic evidence? |
| Quick sources | [OriginStamp anchoring](https://originstamp.com/en/blog/reader/tamper-proof-logging-ai-agents-blockchain-anchoring) · [Immutable audit log survey](https://www.emergentmind.com/topics/immutable-audit-log), snippets, not opened. AWS QLDB end-of-support [AI] from memory, verify. |

---

## Statement R1: Vibe-coded and vulnerable
> Make AI-written code safe to ship without slowing down the developer who uses AI.

| Field | Notes |
|---|---|
| In one line | Code nobody read goes live with leaked keys and open databases. |
| Who posted it and why | Organisers (research track). Wants a measured method, not just a tool. |
| Real end user | Students and early-stage startup devs using Cursor/Lovable/Copilot. |
| How bad / often / many | 45% of 80 tasks had flaws (Veracode 2025); 170/1,645 Lovable apps exposed data [V] booklet. AI-assisted commits leak secrets ~2× [V] booklet (GitGuardian). |
| Operator | The developer; CI pipeline. |
| Least-digital user | First-year student who doesn't know what RLS or injection is. |
| Where it happens | Laptop IDE, GitHub, Supabase/Firebase backends. |
| Hidden constraints | "Without slowing down" means fast and low false-positive. Must test only our own code. Many scanners exist (Semgrep, Gitleaks). |
| Root cause (3 whys) | Holes ship → nobody reviews → AI output feels finished and generic scanners miss AI-pattern bugs (missing RLS, client-side auth) or flood with noise. |
| Data situation | Generate our own vulnerable apps with AI tools; label flaws; public CVE examples. |
| Obvious idea | Wrap Semgrep + an LLM in a "vibe-code scanner". |
| Smarter angle | Hypothesis: a checker targeting the *top AI-specific failure patterns* (RLS off, keys in frontend, missing auth on routes) catches more real issues at lower false positives than a Semgrep+Gitleaks baseline, and auto-fix PR keeps speed. |
| 24 h MVP | Seeded set of ~20 AI-built apps → baseline vs ours → precision/recall + time-to-fix. |
| Unknowns to ask | Will judges accept a self-built test set? |
| Quick sources | [VibeGuard arXiv](https://arxiv.org/html/2604.01052) · [ShipIntel CVE-2025-48757](https://shipintel.is-a.dev/) · [Semgrep blog](https://dev.to/semgrep/product-engineers-should-ship-fast-and-secure-vibe-generated-code-1mdg), snippets, not opened |

---

## Statement R2: Jailbreaks speak Kannada too
> Measure and reduce the safety gap between English and Indian languages in open language models.

| Field | Notes |
|---|---|
| In one line | Safety training works in English, much less in Kannada/Kanglish. |
| Who posted it and why | Organisers (research). IndiaAI Safety Institute context. |
| Real end user | Indian chatbot users; companies deploying LLMs in India. |
| How bad / often / many | 79% unsafe prompts passed in low-resource languages vs < 1% English [V] booklet (Yong et al.). IndicJR covers 12 languages, 45k prompts; English→Indic attacks transfer strongly [AI] snippet, not opened ([arXiv 2602.16832](https://arxiv.org/abs/2602.16832)). |
| Operator | ML/safety team at a company. |
| Least-digital user | n/a (affects all Indian-language users). |
| Where it happens | Chat apps, customer bots. |
| Hidden constraints | Ethics: no publishing working harmful outputs. **Compute**: open models on laptops (1–3B only). Need a judge for "harmful", and LLM judges are weak in Kannada. |
| Root cause (3 whys) | Unsafe answers → safety data is English-only → tokenization/script of Kannada makes refusal features fire less. |
| Data situation | IndicJR may or may not be released [?]. AdvBench-style prompts + translation. |
| Obvious idea | Translate jailbreak prompts and report attack success rate. |
| Smarter angle | Compare script vs romanised vs code-mixed, then test a cheap input guard (transliterate/translate-to-English → safety classifier) vs baseline, measuring the reduction and the over-refusal cost. |
| 24 h MVP | Small open model + 100-prompt eval in 3 scripts + guard → gap before/after. |
| Unknowns to ask | GPU available at venue? Rules on handling harmful outputs in demo? |
| Quick sources | [IndicJR arXiv](https://arxiv.org/html/2602.16832) · [Promptfoo entry](https://promptfoo.dev/lm-security-db/vuln/indic-language-jailbreak-310e01ab/), snippets, not opened |

---

## Statement R3: The token tax
> Reduce the cost or quality gap for Indian languages in language models, and measure exactly what the improvement costs you.

| Field | Notes |
|---|---|
| In one line | Same sentence costs a Kannada speaker up to 12× more tokens, so slower, costlier and less fits. |
| Who posted it and why | Organisers (research). "Measure exactly what the improvement costs" means we must report trade-offs. |
| Real end user | Indian-language LLM users; developers building Kannada apps. |
| How bad / often / many | Kannada 12×, Tamil 9.9×, Hindi 4.1× tokens vs English on cl100k [V] booklet (cites arXiv 2607.24276). Vocab extension cut Indic fertility 3.55 → 2.18 (−38.6%) in one report [AI] snippet, not opened ([arXiv 2610.15373](https://arxiv.org/pdf/2610.15373)). |
| Operator | ML engineer / app developer. |
| Least-digital user | Kannada-only user paying per query or on slow data. |
| Where it happens | API calls, on-device models. |
| Hidden constraints | Retraining a tokenizer means the model must learn new embeddings (compute!). Quality must be measured, not assumed. |
| Root cause (3 whys) | Many tokens → tokenizer trained on English-heavy data → BPE merges rarely cover Kannada script. |
| Data situation | Public Kannada corpora (IndicCorp, Wikipedia, FLORES). Fine. |
| Obvious idea | Fertility comparison chart across tokenizers. |
| Smarter angle | Train small Kannada vocab extension on an open small model + short continued training, or a no-retrain trick (transliteration / compression pre-pass). Report tokens saved, ₹ saved, latency vs quality drop (perplexity/FLORES chrF). |
| 24 h MVP | Baseline vs extended tokenizer → fertility, cost, speed, quality table + failure analysis. |
| Unknowns to ask | GPU access? Which open model size is OK? |
| Quick sources | [arXiv 2610.15373](https://arxiv.org/pdf/2610.15373) · [arXiv 2506.17789](https://arxiv.org/html/2506.17789v2) · [PARAM-1](https://arxiv.org/pdf/2507.13390), snippets, not opened |

---

## First read: fit with our team and the booklet rubric [AI]
| # | Innovation room | Tech depth fit (M1 backend, M2 UI, M3 AI, M4 integrations) | Evidence ease | Impact | Risk |
|---|---|---|---|---|---|
| B3 | Medium–high (most teams will do naive "logs on chain") | High: agent + backend + chain + verifier UI | **Very high**: live attack demo, real data | Medium–high (compliance) | Nobody listed blockchain skill |
| F1 | Medium (budgeting apps are common; buffer + backtest is not) | Good | Medium (synthetic backtest) | **High** | Synthetic data only |
| R3 | Medium | High for M3, less for M2 | High (numbers by design) | Medium | Compute |
| R1 | Medium | Good | High if test set is fair | Medium | Crowded with tools |
| F2 | Medium | Good | Low–medium (synthetic) | High | Fairness proof |
| B1 | High | Hard (solidity + simulation) | High | Medium | Strong competitors, steep |
| F3 | Medium | Good | Low (user test hard in 24 h) | High | Data scraping |
| R2 | Medium | Hard on laptops | Medium | Medium | Compute + ethics |
| B2 | Low (most crowded) | Good | Medium | Medium | Same idea as many teams |

## Dropped
| # | Reason |
|---|---|
| B1 | Team dropped the whole cybersecurity + blockchain track (14:15 IST). Mandatory blockchain and nobody on the team has blockchain/Solidity experience. Also strong existing tools (Blockaid). |
| B2 | Team dropped it by name and with the track. Most crowded idea (NFT tickets), so weak on Innovation. |
| B3 | Dropped with the track. It looked strongest on Evidence (live attack demo), but blockchain is mandatory and there's no blockchain skill on the team. |

Still in play: F1, F2, F3, R1, R2, R3. Strongest looking now: **F1** (high impact, buffer-and-backtest angle) and **R3** (evidence built in, M3-heavy). R2 is weakest on our hardware (no GPU) and on ethics handling.
