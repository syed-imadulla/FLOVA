# FLOVA 2.0 — Agile Sprint Plan

**Document Version:** 2.0.0-sprint0  
**Date:** 2026-11-24  
**Author:** Technical Architect & Lead Engineer  
**Strategy:** Incremental, test-driven sprints. Each sprint delivers independently reviewable, production-ready increments without breaking v1.0.0 stability.

---

## Sprint Roadmap Overview

```
+-----------------------------------------------------------------------------------------+
| Sprint 0: Repository Audit, Architecture Review & Product Backlog (CURRENT - AUDIT ONLY)|
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
| Sprint 1: Native Android Core — Home-Screen Widget & UPI Share Target                   |
| Scope: AppWidgetProvider, RemoteViews, ACTION_SEND Intent Filter, Capacitor Bridge      |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
| Sprint 2: Conversational Two-Way Voice & Assistant Experience                           |
| Scope: Turn-taking State Machine, Multilingual Voice (EN/HI/KN), Assistant Home Screen  |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
| Sprint 3: People & Shared Finance Engine                                                |
| Scope: People Directory, Peer Debt Ledger, Partial Repayments, Multi-Agent Router       |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
| Sprint 4: Proactive Intelligence, Student/Family Mode & Group Splits                    |
| Scope: Group Splits, Student/Family Persona Adaptation, Proactive Local Notifications   |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
| Sprint 5: Offline Reliability (WAL), Cloud Receipts & Production Release v2.0.0         |
| Scope: IndexedDB Outbox WAL, Cloud Receipts, Regression Testing, Android v2.0.0 Build   |
+-----------------------------------------------------------------------------------------+
```

---

## Detailed Sprint Specifications

### Sprint 0: Audit, Architecture Review & Feasibility (COMPLETED)
- **Sprint Objective:** Audit the full v1.0.0 repository, evaluate technical feasibility of native Android features, establish architectural contracts, and formalize the product backlog and sprint plan without modifying application code or production state.
- **Deliverables:**
  - `docs/FLOVA_2.0_FEATURE_AUDIT.md`
  - `docs/FLOVA_2.0_ARCHITECTURE.md`
  - `docs/FLOVA_2.0_AGILE_BACKLOG.md`
  - `docs/FLOVA_2.0_SPRINT_PLAN.md`
  - Comprehensive Sprint 0 Review report.
- **Definition of Done:**
  - Zero application code, database schema, or production setting mutations.
  - v1.0.0 clean Git state and test suite verified passing.
  - All audit documents committed and peer-reviewable.

---

### Sprint 1: Native Android Core — Home-Screen Widgets & UPI Share Target
- **Sprint Objective:** Deliver the two critical native Android capabilities: the two Home-Screen AppWidgets (Compact 1:2 and Extended 2:2) and the UPI Payment Share Target.
- **Scope & User Stories:**
  - **US-I1:** Native Android Home-Screen Widgets (Compact 1:2 Mic Widget and Extended 2:2 Quick-Actions Widget via `AppWidgetProvider`, `RemoteViews`, `FlovaWidgetBridge`).
  - **US-G1:** Native Android UPI Share Target (`ACTION_SEND` intent filter for text/image, `MainActivity` routing to `/catch`).
- **Deliverables:**
  - Android native widget resource layouts (`widget_compact_mic.xml`, `widget_extended_quick_actions.xml`, drawables, preview assets).
  - `FlovaMicWidgetProvider.java` and `FlovaQuickActionsWidgetProvider.java` managing `RemoteViews` updates and `PendingIntent` deep-link click handlers.
  - `FlovaWidgetBridge.java` custom Capacitor plugin managing widget updates, logout clearing, and state synchronization.
  - Updated `AndroidManifest.xml` with `<receiver>` registrations and `<intent-filter>` for `ACTION_SEND` (`text/plain`, `image/*`).
  - TypeScript integration in `CatchScreen.tsx` handling shared intent payloads and `VoiceScreen.tsx` handling `autoRecord=true`.
- **Acceptance Criteria:**
  - Compact widget (1:2) renders FLOVA branding, prominent microphone button, and "Tap to speak".
  - Extended widget (2:2) renders 2x2 grid for Voice, Add, Receipt, and History.
  - Tapping Voice opens FLOVA directly into voice recording mode (`in.flova.app://voice?autoRecord=true`).
  - Tapping Add opens `/add`; Receipt opens `/catch`; History opens `/activity`.
  - Lock-screen privacy: zero financial balances or PII rendered.
  - User logout clears cached widget state.
  - Sharing UPI payment receipt text or screenshot from Google Pay / PhonePe launches FLOVA `/catch` with extracted candidate.
  - Zero automatic writes: All shared transactions require explicit review on `/add`.
- **Test Requirements:**
  - Unit tests for intent parameter parsing and URL query generation.
  - Physical Android device (Xiaomi Redmi 12 5G, Android 15) verification of widget placement, resizing, tap navigation, and share target intent chooser.
- **Definition of Done:**
  - Android project compiles cleanly with `npm run build && npx cap sync android`.
  - All existing frontend unit tests pass.
  - Physical device manual verification log documented.

---

### Sprint 2: Conversational Two-Way Voice & Assistant Experience
- **Sprint Objective:** Transform FLOVA's voice interaction into an assistant-first, two-way conversational dialogue with multilingual follow-ups and an assistant home screen.
- **Scope & User Stories:**
  - **US-A1:** Assistant-First Home Screen (today's financial cards, quick prompt chips).
  - **US-A2:** Persistent Voice FAB & Inline Assistant overlay.
  - **US-B1:** Two-Way Conversational Dialogue & Turn-Taking state machine.
  - **US-B2:** Multilingual Speech-to-Text & Text-to-Speech (EN, HI, KN).
  - **US-B3:** Voice Corrections and Interruptions.
- **Deliverables:**
  - `frontend/src/voice/useConversationManager.ts` managing turn history, missing field follow-up questions, and active audio synthesis.
  - Updated `frontend/src/screens/HomeScreen.tsx` featuring assistant status hero card and quick prompt chips.
  - Assistant overlay sheet component mounted in `AppLayout.tsx`.
- **Acceptance Criteria:**
  - Speaking "Paid for lunch" causes assistant to respond "How much was lunch?" and listen again.
  - Speaking "250" completes the candidate and displays confirmation card without user re-typing.
  - Supports English, Hindi, and Kannada natively.
  - Production STT uses Groq Whisper Large v3 Turbo; IndicConformer remains dormant.
- **Test Requirements:**
  - Automated unit tests covering multi-turn conversation state machine and missing field detection.
  - Regression testing on existing `voiceIntent.test.ts` and `multilingualVoice.test.ts`.
- **Definition of Done:**
  - Multi-turn voice interaction verified in browser and Android WebView.
  - 100% automated test suite passing.

---

### Sprint 3: People & Shared Finance Engine
- **Sprint Objective:** Implement the complete People Directory and Peer Debt Ledger for tracking lending, borrowing, and partial repayments.
- **Scope & User Stories:**
  - **US-C1:** Central Agent Router (directs queries to Transaction vs People vs Insights agents).
  - **US-C2:** People & Repayment Agent.
  - **US-E1:** People Directory & Debt Ledger.
  - **US-E2:** Partial Repayments & Settlement History.
  - **US-D1:** Segregation of Earned Income vs Borrowed Money.
  - **US-D2:** Append-Only Financial Audit History.
- **Deliverables:**
  - Database migration `20261125000100_people_and_debts.sql` (`people`, `peer_debts`, `debt_repayments`, `transaction_audit_logs`).
  - Frontend screens and components: `frontend/src/screens/PeopleScreen.tsx`, `DebtDetailModal.tsx`.
  - Reorganized `AppLayout.tsx` bottom navigation tabs (Home, People, Voice, Money, Insights).
- **Acceptance Criteria:**
  - Users can record money lent or borrowed via voice or form.
  - Receivables are strictly segregated from spendable cash until confirmed repaid.
  - Partial repayments accurately decrement outstanding debt balance in integer paise.
  - Database audit triggers log all transaction modifications.
- **Test Requirements:**
  - Automated tests for integer paise debt calculations and partial settlement logic.
  - RLS policy unit tests verifying multi-tenant isolation on all new tables.
- **Definition of Done:**
  - Database migration applied and verified in Supabase local/staging.
  - RLS security audit passes with 100% coverage.

---

### Sprint 4: Proactive Intelligence, Student/Family Mode & Group Splits
- **Sprint Objective:** Expand persona intelligence for students and families, introduce group expense splitting, and implement local proactive notifications.
- **Scope & User Stories:**
  - **US-E3:** Group Expense Splitting (equal and exact split matrix).
  - **US-F1:** Pocket Money & Family Budget Mode.
  - **US-H1:** Proactive Safe-to-Spend & Runway Alerts.
  - **US-I2:** Local Push Notifications for Bills & Check-Ins.
- **Deliverables:**
  - Group split calculator and database tables (`group_expenses`, `group_splits`).
  - Profile adaptation logic supporting `student` and `homemaker` work profiles.
  - Local notification scheduling service using `@capacitor/local-notifications`.
- **Acceptance Criteria:**
  - Group expense of ₹1,000 split across 4 friends creates 3 receivable debts of ₹250 each and 1 personal expense of ₹250 with 0 remainder.
  - Students see allowance tracking and college/hostel categories.
  - Daily check-in reminders fire at user-specified morning hours without violating quiet hours.
- **Test Requirements:**
  - Integer split rounding regression tests ensuring no paise are lost.
  - Local notification scheduling boundary tests.
- **Definition of Done:**
  - All new screens integrated into primary user flows.
  - Passing automated tests.

---

### Sprint 5: Offline Reliability (WAL), Cloud Receipts & Production Release v2.0.0
- **Sprint Objective:** Finalize offline write-ahead log synchronization, secure cloud receipt storage, execute comprehensive end-to-end regression audits, and build the v2.0.0 release.
- **Scope & User Stories:**
  - **US-J1:** Offline Write-Ahead Log (WAL) & IndexedDB Sync.
  - **US-G2:** Cloud Receipt Storage & Attachments.
  - **Epic J:** Production hardening, accessibility, and GitHub Releases APK distribution packaging.
- **Deliverables:**
  - IndexedDB transaction outbox service with network resumption listener.
  - Supabase Storage bucket `receipts` with user folder RLS.
  - Signed release APK for `in.flova.app` using permanent keystore (`flova-release-key.jks`) for GitHub Releases.
  - Official changelog and v2.0.0 release tag.
- **Acceptance Criteria:**
  - User can turn on airplane mode, record a transaction, see it in local activity, and have it sync to PostgreSQL when reconnecting.
  - Zero duplicate rows created on sync.
  - Complete regression test suite passes (frontend + ai-engine + edge functions).
  - Standalone release APK builds and installs cleanly on target physical devices (e.g. Xiaomi Redmi 12 5G).
- **Definition of Done:**
  - Full end-to-end UAT signoff.
  - Definition of Done verified across all 10 Epics.
  - Final Release Delivery Report published.
