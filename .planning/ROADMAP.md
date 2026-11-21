# Roadmap: FLOVA (12-Phase Hackathon Roadmap)

## Overview

This roadmap defines the 12 sequential execution phases for FLOVA (Owner: M1 Backend & Integration). The roadmap builds the complete authentication lifecycle, user profile and onboarding persistence, reactive data capture hooks for check-ins, transactions, payouts, and commitments, the runway engine data feed with the Ravi test fixture, payout synchronization hardening, realistic demo data seeding, financial data contracts, FLOVA Catch receipt extraction, voice transcription, Activity and Money Overview integration, deployment readiness, and final release verification.

Work is executed exclusively on branch `feature/backend` and shipped as pull requests into `dev`.

## Phases

- [x] **Phase 1: Auth flow** - AuthProvider + useSession, protected routes, minimal login/sign-up/logout screens. (Completed 2026-11-20)
- [x] **Phase 2: Profile & onboarding data** - useProfile hook, save onboarding fields, route by onboarding_completed. (Completed 2026-11-20)
- [x] **Phase 3: Data capture hooks** - Check-ins, transactions, payouts (receivePayout), commitments, history edit/delete, error states. (Completed 2026-11-20)
- [x] **Phase 4: Runway feed** - Wire loadRunwayInput() to M3's engine interface, same-day check-in rule, Ravi fixture test (expect −₹1,170 on Saturday). (Completed 2026-11-20)
- [x] **Phase 5: Payout Synchronization Hardening** - Row-level locking on payouts, status state machine, canonical deadlock-free reassignment, client submission idempotency. (Completed 2026-11-21)
- [x] **Phase 6: Demo data** - UUID-isolated idempotent seed script for the canonical Ravi delivery scenario with PGlite isolation and runway shortfall verification. (Completed 2026-11-21)
- [x] **Phase 7: Financial data contracts** - Extend shared contracts for receipt & voice candidates with truthful uncertainty representation and unified activity timeline with check-in segregation. (Completed 2026-11-21)
- [x] **Phase 8: Secure FLOVA Catch receipt extraction integration** - Structured receipt extraction suggestions requiring user confirmation before saving. (Completed 2026-11-21)
- [x] **Phase 9: Secure voice transcription and transaction integration** - Voice intent extraction into candidate transactions with review guardrails. (Completed 2026-11-21)
- [x] **Phase 9.1: Multilingual Voice Support & Language-Specific Financial Extraction** - Support for English, Hindi, Kannada, Urdu, and Telugu with Whisper language parameter routing, Indic intent extraction, and truthful uncertainty. (Completed 2026-11-21)
- [x] **Phase 10: Connect Activity and Money Overview to existing financial services** - Wire Activity timeline and Money Overview to data services, maintaining manual usability if AI fails. (Completed 2026-11-21)
- [x] **Phase 10.2: Application UI shell and screens** - One persistent mobile layout with a bottom navbar, every screen rebuilt on the existing services, multilingual voice, monthly timeline, live Groq AI layer (see `phases/10.2-app-ui-shell/`). (Completed 2026-11-21)
- [x] **Phase 13: Core Financial Correctness, Navigation and Account Management** - Voice amount deduplication, separate income categories, navigation fixes, logout & RLS isolation, ₹10L individual and daily aggregate limits. (Completed 2026-11-21)
- [x] **Phase 14: Smart Capture, Receipt Intelligence & UPI Share Integration** - Physical receipts with line items and date fallback, UPI screenshots (Google Pay, PhonePe, Paytm, CRED) with status detection & UTR reference, duplicate payment detection, camera/gallery distinction, PWA Web Share Target, and unified `/add` review & confirmation. (Completed 2026-11-21)
- [x] **Phase 16: Complete Receipt & UPI Extraction Pipeline Repair** - Active Groq vision model migration (qwen/qwen3.8-27b), 20 MB image support with client canvas downscaling & compression, line-item parsing, arithmetic discrepancy checks, and multi-step progress UX. (Completed 2026-11-21)
- [x] **Phase 17: AI4Bharat IndicConformer Primary STT Migration** - AI4Bharat IndicConformer primary STT engine with Groq Whisper secondary fallback, FastAPI STT microservice in ai-engine/stt_service/, singleton model caching, X-FLOVA-STT-KEY authentication, benchmark suite, and full integration test coverage. (Completed 2026-11-21)
- [ ] **Phase 11: Deployment readiness** - Production environment variables, Vercel SPA deployment configuration, and Supabase auth redirect settings.
- [ ] **Phase 12: Final verification** - End-to-end demo walkthrough (Quick Capture -> FLOVA Catch -> Activity -> Money Overview), smoke testing, and release freeze.

## Phase Details

### Phase 6: Demo data

**Goal**: Implement an isolated, repeatable, and idempotent demo seeding script for FLOVA that populates the canonical Ravi delivery partner scenario, ensuring unrelated user data is never touched and the deterministic engine reproduces the Saturday −₹1,170 shortfall.
**Plans**:

- [x] 06-01: Implement `backend/scripts/seed-demo.mjs` with UUID-isolated seeding, PGlite isolation tests, and runway shortfall verification. (Completed 2026-11-21)

### Phase 7: Financial data contracts

**Goal**: Extend shared data contracts to support receipt extraction candidates, voice transaction candidates, and unified activity timelines with truthful missing-data representation, while preserving existing tables, idempotency, and RLS policies.
**Plans**:

- [x] 07-01: Add `ExtractedReceiptCandidate`, `VoiceTransactionCandidate`, and `ActivityItem` to `contracts.ts`, implement `listActivityTimeline()` and `confirmCandidateTransaction()` in `data.ts`, and verify via automated unit tests. (Completed 2026-11-21)

### Phase 8: Secure FLOVA Catch receipt extraction integration

**Goal**: Build an end-to-end receipt extraction flow that uses Groq via a secure Supabase Edge Function (`extract-receipt`), outputs truthful `ExtractedReceiptCandidate` suggestions without fabricating financial figures, provides an interactive review/edit UI, and persists confirmed expenses using `confirmCandidateTransaction()`.
**Plans**:

- [x] 08-01: Implement `extract-receipt` Edge Function, frontend receipt service, FLOVA Catch review UI (`/catch`), and automated regression tests. (Completed 2026-11-21)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12

| Phase | Plans Complete | Status | Completed |
|---|---|---|---|
| 1. Auth flow | 1/1 | Completed | 2026-11-20 |
| 2. Profile & onboarding data | 1/1 | Completed | 2026-11-20 |
| 3. Data capture hooks | 1/1 | Completed | 2026-11-20 |
| 4. Runway feed | 1/1 | Completed | 2026-11-20 |
| 5. Payout Synchronization Hardening | 2/2 | Completed | 2026-11-21 |
| 6. Demo data | 1/1 | Completed | 2026-11-21 |
| 7. Financial data contracts | 1/1 | Completed | 2026-11-21 |
| 8. FLOVA Catch integration | 1/1 | Completed | 2026-11-21 |
| 9. Voice transaction integration | 1/1 | Completed | 2026-11-21 |
| 9.1. Multilingual Voice Support | 1/1 | Completed | 2026-11-21 |
| 10. Activity & Money Overview | 1/1 | Completed | 2026-11-21 |
| 11. Deployment readiness | 0/1 | Pending | - |
| 12. Final verification | 0/1 | Pending | - |
| 13. Core Financial Correctness | 1/1 | Completed | 2026-11-21 |
| 14. Smart Capture & Receipt Intelligence | 1/1 | Completed | 2026-11-21 |
| 15. Conversational & Adaptive Financial Intelligence | 1/1 | Completed | 2026-11-21 |
| 16. Complete Receipt & UPI Extraction Repair | 1/1 | Completed | 2026-11-21 |

### Phase 13: Core Financial Correctness, Navigation and Account Management

**Goal:** Fix voice amount duplication, add adapted income categories, stabilize navigation and logout, and enforce the ₹10 Lakh application transaction limit.
**Status:** Completed (2026-11-21)
**Plans:** 1 plan

Plans:

- [x] 13-01: Core financial correctness, navigation and account management implementation and regression verification. (Completed 2026-11-21)

### Phase 14: Smart Capture, Receipt Intelligence & UPI Share Integration

**Goal:** Multi-source capture (receipts, UPI screenshots, gallery, camera, share target), date fallback rules, duplicate detection, and unified confirmation.
**Status:** Completed (2026-11-21)
**Plans:** 1 plan

Plans:

- [x] 14-01: Smart capture, receipt line items & date fallback, UPI screenshots, duplicate detection, PWA Share Target, and unified review. (Completed 2026-11-21)

### Phase 15: Conversational & Adaptive Financial Intelligence

**Goal:** Conversational multi-transaction extraction, batch arithmetic, invoice management & settlements, spending intelligence, adaptive buffers, income forecasting, scenario simulation, and persistent WISH 2.0.
**Status:** Completed (2026-11-21)
**Plans:** 1 plan

Plans:

- [x] 15-01: Multi-transaction extraction, batch arithmetic, invoice intelligence, financial intelligence, and WISH 2.0 database persistence. (Completed 2026-11-21)

### Phase 16: Complete Receipt & UPI Extraction Pipeline Repair

**Goal:** Repair Edge Function extraction failure by upgrading to active Groq vision models (`qwen/qwen3.8-27b`), support 20 MB image uploads with client-side downscaling and compression, add line-item parsing, arithmetic discrepancy checks, and multi-step progress UX.
**Status:** Completed (2026-11-21)
**Plans:** 1 plan

Plans:

- [x] 16-01: Repair vision models on Groq, implement 20MB client image optimizer, add line items and arithmetic verification, update CatchScreen progress UI, and add unit tests. (Completed 2026-11-21)
