# FLOVA 2.0 — Agile Product Backlog

**Document Version:** 2.0.0-sprint0  
**Date:** 2026-11-24  
**Author:** Technical Architect & Lead Engineer  
**Priority Legend:**  
- **P0:** Critical Core Path (Must have for release; non-negotiable)  
- **P1:** High Value (Essential user experience & differentiators)  
- **P2:** Medium Value (Important enhancements & advanced edge cases)  
- **P3:** Low Value / Polish (Desirable enhancements for subsequent minor releases)

---

## Epic A: Assistant-Centered Experience

### US-A1: Assistant-First Home Screen
- **Priority:** P0
- **Complexity:** Medium (5 pts)
- **Dependencies:** None
- **Description:** As a user, when I open FLOVA, I see a conversational financial companion interface displaying my today's financial summary, actionable cards (pending splits, debt reminders), and quick prompt chips.
- **Acceptance Criteria:**
  - Displays confirmed available balance and daily safe spendable budget in integer paise.
  - Features high-priority card carousel: pending transactions, debt due today, upcoming bills.
  - Provides quick action prompt chips ("Spent 100 on chai", "Check runway", "Split dinner").
  - Retains instant navigation to People, Money, Insights, and Profile.

### US-A2: Persistent Voice FAB & Inline Assistant
- **Priority:** P0
- **Complexity:** Medium (5 pts)
- **Dependencies:** US-A1
- **Description:** As a user, I can tap the prominent center microphone FAB anywhere in the app to activate the assistant without losing my current screen context.
- **Acceptance Criteria:**
  - Center bottom bar FAB pulses when microphone is active.
  - Opens an inline conversational bottom sheet or overlay rather than navigating away.
  - Audio capture automatically initiates upon tap.

### US-A3: Pending Action Drawer & Candidate Feeds
- **Priority:** P1
- **Complexity:** Small (3 pts)
- **Dependencies:** None
- **Description:** As a user, I want a dedicated pending-action interface where unconfirmed receipts, shared UPI payments, and incomplete voice drafts are stored safely for later review.
- **Acceptance Criteria:**
  - Incomplete drafts persist in local storage or temporary table with TTL.
  - Badge on Home screen indicates pending items count.
  - Tapping an item opens the confirmation review card with pre-filled fields.

---

## Epic B: Two-Way Voice

### US-B1: Two-Way Conversational Dialogue & Turn-Taking
- **Priority:** P0
- **Complexity:** High (8 pts)
- **Dependencies:** US-A2, `process-voice`
- **Description:** As a user, when I speak partially formed financial inputs (e.g. "I paid for lunch"), the assistant asks a verbal follow-up ("How much was lunch?") and listens for my response.
- **Acceptance Criteria:**
  - In-memory conversation state tracks previous turns (up to 3 turns).
  - Identifies missing fields (`amount`, `category`, `expense_type`) and speaks a targeted follow-up.
  - User response updates the draft candidate without restarting the conversation.
  - Speech synthesis speaks the follow-up question naturally in the user's selected language.

### US-B2: Multilingual Speech-to-Text & Text-to-Speech (EN, HI, KN)
- **Priority:** P0
- **Complexity:** Medium (5 pts)
- **Dependencies:** US-B1
- **Description:** As a multilingual user, I can speak in English, Hindi, Kannada, or mixed dialects (Hinglish/Kanglish), and the assistant responds in the same language.
- **Acceptance Criteria:**
  - Language selector supports Auto, English, Hindi, Kannada.
  - Production STT uses Groq Whisper Large v3 Turbo; IndicConformer remains dormant.
  - System prompts and TTS voice engine correspond to the conversation language.

### US-B3: Voice Corrections and Interruptions
- **Priority:** P1
- **Complexity:** Medium (5 pts)
- **Dependencies:** US-B1
- **Description:** As a user, if the assistant mishears an amount, I can say "No, make it 350" or tap to interrupt and speak the correction.
- **Acceptance Criteria:**
  - Saying "Cancel" or "No" discards or resets the active draft.
  - Relative corrections ("Actually 400", "Change category to groceries") update the candidate.
  - Speaking while TTS is playing immediately silences TTS and starts recording.

---

## Epic C: Multi-Agent Intelligence

### US-C1: Central Agent Router & Orchestrator
- **Priority:** P0
- **Complexity:** Medium (5 pts)
- **Dependencies:** None
- **Description:** As the FLOVA system, a lightweight router analyzes input intent and dispatches to specialized agent handlers without unnecessary latency or multi-agent overhead.
- **Acceptance Criteria:**
  - Single-shot classification routes to: Transaction, People/Repayment, Receipt, Goals, Insights.
  - Simple direct tasks (e.g. "Spent 50 on tea") invoke only the Transaction Agent.
  - Errors and unclassifiable inputs return friendly guidance without throwing unhandled exceptions.

### US-C2: People & Repayment Agent
- **Priority:** P1
- **Complexity:** High (8 pts)
- **Dependencies:** US-C1, Epic E
- **Description:** As a user, I can say "I lent Suresh 1000 rupees" or "Ramesh paid back 500", and the agent routes the entry to the People Ledger.
- **Acceptance Criteria:**
  - Extracts counterparty person name, debt direction (`lent` vs `borrowed`), amount, and optional due date.
  - Matches or creates contacts in the `people` directory.
  - Generates a debt confirmation candidate for user review.

---

## Epic D: Complete Financial Engine

### US-D1: Separation of Earned Income, Borrowing & Gifts
- **Priority:** P0
- **Complexity:** Medium (5 pts)
- **Dependencies:** None
- **Description:** As a user, my financial engine distinguishes between earned operating income, personal borrowings, gifts, and platform payouts.
- **Acceptance Criteria:**
  - Income transactions classify ownership and source type.
  - Borrowed money increases cash balance but is tagged as a liability, not earned income.
  - Integer paise arithmetic is strictly maintained across all transaction types.

### US-D2: Append-Only Financial Audit History
- **Priority:** P1
- **Complexity:** Medium (5 pts)
- **Dependencies:** None
- **Description:** As a user or auditor, any modification or deletion of a transaction is recorded in an immutable audit log.
- **Acceptance Criteria:**
  - Database trigger captures `old_data`, `new_data`, `action` (`INSERT`, `UPDATE`, `DELETE`), and `timestamp`.
  - Stored in `transaction_audit_logs` table protected by RLS.
  - Users can view "Edited on [date]" in the transaction details modal.

---

## Epic E: People and Shared Finance

### US-E1: People Directory & Debt Ledger
- **Priority:** P0
- **Complexity:** High (8 pts)
- **Dependencies:** None
- **Description:** As a user, I have a dedicated People tab where I see who owes me money and whom I owe, with running net balances.
- **Acceptance Criteria:**
  - PostgreSQL table `people` (`id`, `user_id`, `name`, `phone`, `created_at`).
  - Table `peer_debts` (`id`, `user_id`, `person_id`, `amount_paise`, `direction`, `status`, `due_date`).
  - Displays total receivables (money lent) and total liabilities (money borrowed).
  - Strictly isolates receivables from spendable cash until confirmed repaid.

### US-E2: Partial Repayments & Settlement History
- **Priority:** P1
- **Complexity:** Medium (5 pts)
- **Dependencies:** US-E1
- **Description:** As a user, when someone repays part of a loan, I can record a partial repayment and see the remaining outstanding balance.
- **Acceptance Criteria:**
  - Table `debt_repayments` records each installment in integer paise.
  - Updates `peer_debts.amount_repaid_paise` and marks status `settled` when fully paid.
  - Recording repayment prompts an optional linked cash/bank transaction update.

### US-E3: Group Expense Splitting
- **Priority:** P2
- **Complexity:** High (8 pts)
- **Dependencies:** US-E1
- **Description:** As a user, I can record an expense paid by me for a group (e.g. dinner for 4 people) and split it equally or by exact amounts.
- **Acceptance Criteria:**
  - Table `group_expenses` and `group_splits`.
  - Calculates each person's share in integer paise with zero rounding remainder.
  - My share is recorded as an expense; others' shares automatically become receivables in `peer_debts`.

---

## Epic F: Student, Family and Gig Finance

### US-F1: Pocket Money & Family Budget Mode
- **Priority:** P1
- **Complexity:** Medium (5 pts)
- **Dependencies:** None
- **Description:** As a student or homemaker, I can configure a "Student" or "Family" profile mode that adapts category suggestions, allowance tracking, and milestone goals.
- **Acceptance Criteria:**
  - `work_profile` enum supports `student` and `homemaker`.
  - Tailors categories: canteen, hostel, books, coaching, family contribution, household groceries.
  - Replaces gig-worker platform payouts with scheduled allowances / pocket money.

---

## Epic G: Receipt and UPI Intelligence

### US-G1: Native Android UPI Share Target
- **Priority:** P0
- **Complexity:** High (8 pts)
- **Dependencies:** None
- **Description:** As an Android user, when I share a payment receipt or text from Google Pay, PhonePe, Paytm, or BHIM, FLOVA appears as a share option and opens `/catch` with the transaction parsed.
- **Acceptance Criteria:**
  - `AndroidManifest.xml` registers `ACTION_SEND` for `text/plain` and `image/*`.
  - `MainActivity.java` captures intent extras and forwards them to Capacitor WebView.
  - `/catch` receives payload, calls `extract-receipt` Edge Function, and displays candidate card.
  - **Zero auto-commit:** Transaction is saved only after user explicitly reviews and taps "Confirm" on `/add`.

### US-G2: Cloud Receipt Storage & Attachments
- **Priority:** P2
- **Complexity:** Medium (5 pts)
- **Dependencies:** None
- **Description:** As a user, receipt images confirmed on `/add` are securely uploaded to a private Supabase Storage bucket and linked to the transaction.
- **Acceptance Criteria:**
  - Storage bucket `receipts` created with RLS (`user_id` folder isolation).
  - Image compressed client-side before upload to conserve bandwidth.
  - Transaction record holds `receipt_url` viewing link.

---

## Epic H: Goals and Financial Intelligence

### US-H1: Proactive Safe-to-Spend & Runway Alerts
- **Priority:** P1
- **Complexity:** Small (3 pts)
- **Dependencies:** None
- **Description:** As a user, when my spendable buffer drops below my configured safety cushion, the assistant displays an urgent warning banner on Home.
- **Acceptance Criteria:**
  - Evaluates `runway.startingSpendableBalancePaise < runway.safeRunwayBufferPaise`.
  - Visual indicator transitions from calm green to caution amber/red.
  - Recommends delaying non-essential expenses.

---

## Epic I: Android Home-Screen Widget & Proactive Assistance

### US-I1: Native Android Home-Screen Widgets (Compact 1:2 & Extended 2:2)
- **Priority:** P0
- **Complexity:** High (8 pts)
- **Dependencies:** None
- **Description:** As an Android user, I can add two native FLOVA widgets to my home screen: a compact 1:2 microphone widget for one-tap voice capture, and an extended 2:2 quick-actions widget with Voice, Add, Receipt, and History.
- **Acceptance Criteria:**
  - Implemented as two native Android `AppWidgetProvider` classes with `RemoteViews`: `FlovaMicWidgetProvider` (1:2 vertical) and `FlovaQuickActionsWidgetProvider` (2:2 square).
  - Compact widget shows FLOVA branding, prominent microphone button, and "Tap to speak" label.
  - Extended widget shows FLOVA branding with a 2x2 grid of action tiles: Voice (`in.flova.app://voice?autoRecord=true`), Add (`in.flova.app://add`), Receipt (`in.flova.app://catch`), and History (`in.flova.app://activity`).
  - No balances or financial PII displayed, ensuring 100% lock-screen privacy.
  - User logout or account switching calls `FlovaWidgetBridge.clearWidgetData()` to reset widgets.
  - Zero background battery drain; updates driven by intent events without background audio recording violations.

### US-I2: Local Push Notifications for Bills & Check-Ins
- **Priority:** P1
- **Complexity:** Medium (5 pts)
- **Dependencies:** None
- **Description:** As a user, I receive gentle local Android notifications for due commitments and daily balance check-ins during my preferred active hours.
- **Acceptance Criteria:**
  - Configurable notification preferences and quiet hours (e.g. 10 PM to 8 AM).
  - Uses `@capacitor/local-notifications` to schedule notifications locally on device without external push servers.

---

## Epic J: Reliability and Release

### US-J1: Offline Write-Ahead Log (WAL) & Sync
- **Priority:** P0
- **Complexity:** High (8 pts)
- **Dependencies:** None
- **Description:** As a user in low-connectivity areas, I can confirm and save transactions offline; FLOVA saves them in IndexedDB and syncs them automatically when back online.
- **Acceptance Criteria:**
  - Confirmed transactions write to local IndexedDB outbox queue first.
  - Background worker pushes queued writes to Supabase PostgreSQL when online.
  - UI indicates "Saved offline — will sync when connected".
  - Retains integer paise precision and client idempotency UUIDs to eliminate duplicates.

---

## Backlog Summary by Priority

| Priority | Story Count | Total Story Points | Sprints |
| :--- | :--- | :--- | :--- |
| **P0 (Critical)** | 9 stories | 57 pts | Sprint 1, 2, 3 |
| **P1 (High)** | 6 stories | 29 pts | Sprint 3, 4 |
| **P2 (Medium)** | 2 stories | 13 pts | Sprint 4, 5 |
| **P3 (Polish)** | 0 stories | 0 pts | Sprint 5+ |
| **Total** | **17 stories** | **99 pts** | **5 Execution Sprints** |
