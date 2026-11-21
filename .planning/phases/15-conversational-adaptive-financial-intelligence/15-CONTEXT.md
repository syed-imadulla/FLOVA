# Phase 15 Context: Conversational & Adaptive Financial Intelligence

## Phase Scope & Objectives
Transform FLOVA from a financial tracking and smart-capture application into an adaptive, voice-first financial companion that understands conversations, processes multiple transactions in single utterances, manages uploaded invoices without hallucinating payments, analyses spending behavior using deterministic aggregations, and provides adaptive safety buffer recommendations and income forecasting.

---

## 1. Locked Architecture Decisions

### Workstream A: Conversational Multi-Transaction Agent
- **Multiple Extraction:** Users can express multiple transactions in one utterance (e.g., "I spent ₹200 on petrol, ₹500 on groceries and earned ₹1,000 from delivery").
- **Independent Candidate UUIDs:** Each extracted transaction is assigned a stable client UUID. Amounts from one clause never leak into another clause.
- **Ambiguous Classifications:** If an amount's direction (income vs. expense) is unclear (e.g. "₹500 from Y"), mark candidate with `clarification_required = true` and keep valid companions intact.
- **Batch Arithmetic:** Calculated exclusively by deterministic TypeScript engine using integer paise (`Paise`). The LLM never calculates authoritative financial totals.
- **Single Confirmation Path:** Confirmation remains strictly on `/add` via `confirmCandidateTransaction`. Pressing confirm repeatedly is idempotent. Zero rows written before confirmation.
- **Conversation Continuation:** Support conversational session state to append candidates, edit individual candidates ("Change petrol to 250"), or remove candidates ("Remove groceries") before final confirmation.

### Workstream B: Invoice Intelligence Agent (Upload & Management Only)
- **Scope Limit:** Invoice agent ONLY reads and manages uploaded invoices (PDF, image, photo). NO invoice generation, NO automatic emailing, NO automatic payments.
- **Field Extraction:** Supplier name, customer name, invoice number, invoice date, due date, itemized line items, subtotal, tax/GST, discounts, total amount, paid amount, outstanding amount, payment terms, status.
- **Direction Classification:** Receivables (issued by user/freelancer to client) vs. Payables (incoming supplier bills). Direction is never guessed if ambiguous.
- **Settlement & Linkage:** Partial settlements track `received_amount` / `paid_amount` and `outstanding_amount`. Confirmed receivables integrate with expected payouts; confirmed payables integrate with commitments.
- **Database Model:** New `invoices`, `invoice_items`, `invoice_settlements` tables with RLS isolation per authenticated user.

### Workstream C: Financial Intelligence & Adaptive Safety Buffer
- **Smart Expense Intelligence:** Category breakdown, week-over-week trends, recurring expenses, work vs living breakdown based strictly on confirmed database transactions.
- **Adaptive Safety Buffer:**
  - Formula baseline: `Recommended Buffer = Estimated Daily Essential Requirement (living + work) × Protection Horizon Days + Relevant Upcoming Commitments`.
  - Horizon adapts to user work profile: daily earners (shorter horizon), weekly payouts (aligned with payout cadence), variable/freelance (longer buffer).
  - Pure planning boundary: buffer is NEVER silently deducted from confirmed liquid cash.
- **Income Forecasting:** Transparent deterministic/statistical forecasting using historical confirmed earnings, payout cycles, and variability profiles. Communicates statistical bounds and data insufficiency honestly.
- **Scenario Simulator:** Pure hypothetical calculations ("What if income drops 30%?", "What if client delays payment 7 days?", "What if unexpected ₹3,000 expense?"). Computes projected balance, buffer shortfall date, and cash shortfall date without ever mutating real data.

### Workstream D: WISH 2.0 (Persistent Savings Goals)
- **Database Persistence:** New `wish_goals` and `wish_contributions` tables with user RLS.
- **Safe Migration:** Safe hydration and migration from legacy `localStorage` goals to authenticated database storage.
- **Non-Coercive Planning:** Suggestions based on spendable money (confirmed balance minus buffer); no automatic fund locking or artificial account transfers without confirmation.
- **Gamification:** Meaningful progress milestones, streaks, celebration states without shaming or encouraging reckless savings during shortfalls.

### Workstream E: Voice Assistant & Accessibility
- **Grounded Financial Queries:** Natural voice answers ("How much did I spend today?", "What bills are due this week?", "How long will my money last?") querying real application state and deterministic engine values.
- **Spoken Output & Accessibility:** Simple, conversational, jargon-free spoken and textual explanations. Large touch targets, high contrast, WCAG compliant.
- **Multilingual Continuity:** Supports English, Hindi, Kannada, Telugu, and Urdu using Whisper speech recognition and localized intent processing.

---

## 2. Invariants & Guardrails
1. **Paise Integrity:** All money calculations use integer paise (`toPaise()`).
2. **Limit Enforcement:** Individual transaction limit of ₹10,00,000 and daily aggregate calendar limit of ₹10,00,000 strictly enforced across all capture and invoice settlement paths.
3. **Third-Party Segregation:** `ownership = not_mine` (e.g. COD collections) excluded from personal balance and safety buffer.
4. **Expected Payout Separation:** Expected payouts are not received income until confirmed received.
5. **Idempotency & Re-entrancy:** Stable UUIDs ensure network retries or multi-clicks never create duplicate rows.
