# FLOVA 2.0 — Architecture Assessment & Target Architecture

**Document Version:** 2.0.0-sprint0  
**Date:** 2026-11-24  
**Author:** Technical Architect & Lead Engineer (FLOVA 2.0 Sprint 0)  
**Target Release:** FLOVA v2.0.0  
**Repository:** `https://github.com/syed-imadulla/FLOVA`  

---

## 1. Introduction & Architecture Philosophy

FLOVA 2.0 transforms FLOVA from a reactive manual transaction tracker with single-shot voice input into a proactive, two-way conversational AI financial companion. 

In accordance with the **Mandatory Engineering Principles**, FLOVA 2.0 is an **incremental evolution**, not a rewrite. All core invariants established in FLOVA 1.0 are preserved:

1. **AI Suggests, User Confirms:** LLMs or vision models extract draft candidates; financial writes to PostgreSQL are executed **only** upon explicit, interactive user confirmation.
2. **Integer Paise Precision:** Authoritative financial math is strictly executed in deterministic TypeScript using integer paise ($1\text{ INR} = 100\text{ paise}$).
3. **Strict Money Segregation:** Third-party custodial money (`not_mine`) and unearned receivables (`payouts`) are segregated and never counted towards spendable runway.
4. **Zero-Trust Security & Row Level Security:** Every table enforces strict RLS isolating tenants by `auth.uid()`. Edge Functions run server-side inference without exposing provider API keys.
5. **Dormant IndicConformer & Active Groq Whisper:** Groq Whisper (`whisper-large-v3-turbo`) remains the production STT engine; the Python IndicConformer microservice remains dormant.

---

## 2. Current Architecture (FLOVA 1.0) vs Target Architecture (FLOVA 2.0)

### 2.1 Current Architecture Overview (v1.0.0)

FLOVA 1.0 consists of:
- **Frontend / Client:** React 18 SPA built with Vite, TypeScript, and Tailwind CSS, wrapped in Capacitor 8 for Android and hosted on Vercel as a PWA.
- **Voice & Vision:** Client records audio or captures images, sending requests to two stateless Supabase Edge Functions: `process-voice` (Groq Whisper + Llama 3.3) and `extract-receipt` (Groq Qwen 27B / Llama 3.2 Vision).
- **Backend / Database:** Supabase PostgreSQL with 10 tables:
  1. `profiles` — User profile, work profile, income variability, daily spend limits.
  2. `transactions` — Financial records with integer paise, living/work classification, not_mine ownership.
  3. `payouts` — Gig platform payout tracking (scheduled, estimated, unearned, settled).
  4. `commitments` — Fixed recurring obligations (bills, debts).
  5. `balance_checkins` — Periodic cash-in-hand and bank balance reconciliations.
  6. `invoices` — Client payable/receivable invoices.
  7. `invoice_items` — Itemized line items for invoices.
  8. `invoice_settlements` — Payment tracking and partial settlements for invoices.
  9. `wish_goals` — Savings targets with deadline and target amounts in paise.
  10. `wish_contributions` — Individual contribution records towards goals.
  Plus security infrastructure tables: `edge_function_rate_limits` and `edge_function_rate_limit_configs`.
- **Android Integration:** Capacitor 8 Android project (`in.flova.app`) acting as a WebView shell with HTTPS App Links and URI scheme routing. Android `minSdkVersion = 24` (Android 7.0 Nougat), `compileSdkVersion = 36` (Android 16), `targetSdkVersion = 36`.

### 2.2 Target Architecture (v2.0.0)

FLOVA 2.0 introduces four architectural pillars:
1. **Native Android Subsystem:**
   - **FLOVA Home-Screen AppWidgets:** Two native Android `AppWidgetProvider` implementations:
     - **Compact Microphone Widget (1:2 vertical):** Minimal FLOVA branding, prominent microphone button, small FLOVA label, and "Tap to speak" guidance. Purpose: Instant one-tap voice capture launch.
     - **Extended Quick-Actions Widget (2:2 square):** FLOVA branding at top with 2x2 action grid: Voice (mic), Add (plus), Receipt (camera), and History (clock/list).
     - **Lock-Screen Privacy:** Widgets never display balances or private financial data on lock screens.
     - **Account Lifecycle:** Widgets clear cached user state upon logout or account switching.
   - **UPI Share Target Receiver:** Native Android `ACTION_SEND` intent filter capturing shared text and receipt screenshots from external UPI applications (Google Pay, PhonePe, Paytm, BHIM) and routing them to `/catch`.
2. **Two-Way Conversational Assistant Engine:**
   - In-memory conversation state machine managing multi-turn dialogue, clarifying missing fields, handling interruptions, and generating natural voice responses via Web Speech Synthesis or lightweight cloud TTS.
3. **Multi-Agent Orchestrator:**
   - Modular intent routing layer directing conversational turns to specialized domain agents (Transaction Agent, People/Repayment Agent, Receipt Agent, Budget/Goals Agent, Insights Agent) while enforcing controlled deterministic tool execution.
4. **Offline Write-Ahead Log (WAL) & IndexedDB Sync:**
   - Offline-first mutation queue allowing users to record and confirm transactions without internet connectivity, synchronizing reliably when connectivity resumes.

---

## 3. High-Level System Architecture Diagram

```
+---------------------------------------------------------------------------------------------------+
|                                       ANDROID 14+ HOST OS                                         |
|                                                                                                   |
|  +-----------------------------+   +-------------------------------+   +-----------------------+  |
|  |     FLOVA AppWidget         |   |    UPI Share Target Intent    |   |     Native Push /     |  |
|  | (RemoteViews / Glance)      |   | (ACTION_SEND / text & image)  |   | Local Notifications   |  |
|  +--------------+--------------+   +---------------+---------------+   +-----------+-----------+  |
|                 | (Deep Link / Data Sync)          | (Intent Bridge)               ^ (Proactive)  |
|                 v                                  v                               |              |
|  +---------------------------------------------------------------------------------+-----------+  |
|  |                                  CAPACITOR ANDROID BRIDGE                                   |  |
|  |  MainActivity.java · IntentHandler · FlovaWidgetBridge · LocalNotificationsPlugin           |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                |                                                  |
|                                                v                                                  |
|  +---------------------------------------------------------------------------------------------+  |
|  |                                     REACT 18 WEBVIEW SPA                                    |  |
|  |                                                                                             |  |
|  |  +----------------------------------+             +--------------------------------------+  |  |
|  |  |   Conversational Voice UI        |             |    Assistant-Centered Home Screen    |  |  |
|  |  |  - Two-Way Turn-Taking Engine    |             |   - Daily Status Card                |  |  |
|  |  |  - Multi-Turn Context Manager    |             |   - Pending Action Feed (Split/Debts)|  |  |
|  |  |  - TTS Synthesis & Audio Player  |             |   - Prominent Mic FAB                |  |  |
|  |  +----------------+-----------------+             +-------------------+------------------+  |  |
|  |                   |                                                   |                     |  |
|  |                   v                                                   v                     |  |
|  |  +---------------------------------------------------------------------------------------+  |  |
|  |  |                              MULTI-AGENT ORCHESTRATOR                                 |  |  |
|  |  |   - Router Agent          - Transaction Agent      - People & Debt Agent              |  |  |
|  |  |   - Receipt Agent         - Goals & Budget Agent   - Insights & Persona Agent         |  |  |
|  |  +--------------------------------------------+------------------------------------------+  |  |
|  |                                               |                                             |  |
|  |                                               v                                             |  |
|  |  +---------------------------------------------------------------------------------------+  |  |
|  |  |                           DETERMINISTIC FINANCIAL ENGINE                              |  |  |
|  |  |   - Integer Paise Arithmetic               - Available Cash & Runway Simulator        |  |  |
|  |  |   - Safe Buffer Cushion                    - ₹10,00,000 Safeguard Limit Validator     |  |  |
|  |  |   - People Ledger & Split Calculator       - Candidate Review & Confirmation Adapter  |  |  |
|  |  +--------------------+------------------------------------------------------------------+  |  |
|  |                       |                                                                     |  |
|  |                       v                                                                     |  |
|  |  +------------------------------------------------------+                                   |  |
|  |  |              OFFLINE WRITE-AHEAD LOG                 |                                   |  |
|  |  |   - IndexedDB Outbox Queue                           |                                   |  |
|  |  |   - Conflict Resolution & Sync Worker                |                                   |  |
|  |  +--------------------+---------------------------------+                                   |  |
+--------------------------|------------------------------------------------------------------------+
                           | HTTPS / Supabase JWT
                           v
+---------------------------------------------------------------------------------------------------+
|                                   SUPABASE BACKEND CLOUD                                          |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  |                                  SUPABASE EDGE FUNCTIONS                                    |  |
|  |                                                                                             |  |
|  |   [process-voice]                                 [extract-receipt]                         |  |
|  |   - Groq Whisper (Large v3 Turbo)                 - Groq Vision (Qwen 27B / Llama 3.2)      |  |
|  |   - Groq Llama 3.3 Versatile                      - Multilingual Pre-processing             |  |
|  |   - Multi-Turn Conversation Classifier            - Text / Image Extraction                 |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                |                                                  |
|                                                v                                                  |
|  +---------------------------------------------------------------------------------------------+  |
|  |                                   POSTGRESQL 15 WITH RLS                                    |  |
|  |                                                                                             |  |
|  |   Existing Core Tables:              New FLOVA 2.0 Tables:                                  |  |
|  |   • profiles                         • people (Directory of counterparties)                 |  |
|  |   • transactions                     • peer_debts (Lending & borrowing ledger)              |  |
|  |   • payouts                          • debt_repayments (Installment repayments)             |  |
|  |   • commitments                      • group_expenses (Shared expense events)               |  |
|  |   • balance_checkins                 • group_splits (Individual splits & settlements)       |  |
|  |   • invoices                         • audit_logs (Append-only change history)              |  |
|  |   • wish_goals / contributions                                                              |  |
|  |                                                                                             |  |
|  |   Security & Constraints:                                                                   |  |
|  |   - Row Level Security isolating user_id = auth.uid() on all tables                         |  |
|  |   - Daily ₹10,00,000 transaction ceiling enforcement trigger                                |  |
|  |   - Payout sync row-locking state machine                                                   |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 4. Subsystem Details & Integration Contracts

### 4.1 Android Home-Screen Widget Integration

#### Native Implementation Architecture
- **Technology:** Android Native `AppWidgetProvider` with `RemoteViews`.
- **Supported Android API Range:** `minSdkVersion = 24` (Android 7.0) to `targetSdkVersion = 36` (Android 16), thoroughly verified on Android 15 (Xiaomi Redmi 12 5G).
- **Two Distinct Widget Configurations:**
  1. **Compact Microphone Widget (1:2 vertical aspect ratio):**
     - Target size: $1 \times 2$ grid cells.
     - Minimal FLOVA branding, high-visibility microphone button in FLOVA brand palette (`#134E4A` / teal-800), FLOVA text label, and "Tap to speak" guidance.
     - Action: One-tap `PendingIntent` launching `MainActivity` with deep link `in.flova.app://voice?autoRecord=true`.
     - No financial balances, numbers, or account details. Complete lock-screen privacy by design.
  2. **Extended Quick-Actions Widget (2:2 square aspect ratio):**
     - Target size: $2 \times 2$ grid cells.
     - FLOVA branding header with app icon.
     - $2 \times 2$ Grid of action tiles:
       - **Voice:** Mic icon $\rightarrow$ `in.flova.app://voice?autoRecord=true`
       - **Add:** Plus icon $\rightarrow$ `in.flova.app://add`
       - **Receipt:** Camera/receipt scan icon $\rightarrow$ `in.flova.app://catch`
       - **History:** Clock/history icon $\rightarrow$ `in.flova.app://activity`
- **Native Preferences & State Handling:**
  - Standard Android `SharedPreferences` (mode `MODE_PRIVATE`) stores non-sensitive UI configuration if needed.
  - No deprecated `androidx.security.crypto.EncryptedSharedPreferences` (which was deprecated in Android Jetpack due to unmaintained crypto primitives and Keystore deadlocks on older OEM ROMs). Since neither widget displays sensitive balances or PII, standard private app preferences are used.
  - **Account Lifecycle & Logout:** When user logs out, React calls `FlovaWidgetBridge.clearWidgetData()`, clearing preferences and redrawing widgets in clean logged-out state.
  - **Lock-Screen Privacy:** Because widgets are action-oriented launchers displaying zero balances, no financial data is ever exposed to lock-screen widgets or ambient displays.
- **Battery & Background Restrictions:**
  - Android 8.0+ background execution limits and Android 12+ foreground service launch restrictions prevent background services from recording audio directly from a widget.
  - Audio capture is strictly triggered upon app foregrounding in `MainActivity` with user interaction, respecting all Android mic privacy indicators and runtime permission grants.
  - Widget XML configuration declares `android:updatePeriodMillis="0"` (or $1800000$ for system minimum 30 min), relying on push events via `AppWidgetManager.notifyAppWidgetViewDataChanged` rather than battery-draining polling.

### 4.2 Android UPI Share Target Integration

#### Native Implementation Architecture
- **Intent Filter Registration:** Declared in `frontend/android/app/src/main/AndroidManifest.xml` on `MainActivity`:
  ```xml
  <intent-filter>
      <action android:name="android.intent.action.SEND" />
      <category android:name="android.intent.category.DEFAULT" />
      <data android:mimeType="text/plain" />
      <data android:mimeType="image/*" />
  </intent-filter>
  ```
- **Execution Flow:**
  1. User makes a payment in Google Pay / PhonePe / Paytm / BHIM and taps "Share Receipt / Confirmation".
  2. Android Intent Chooser displays FLOVA. User selects FLOVA.
  3. `MainActivity.java` intercepts `getIntent()` in `onCreate()` and `onNewIntent()`.
  4. If `action == ACTION_SEND`:
     - **Text Intent (`text/plain`):** Extracts `Intent.EXTRA_TEXT` (e.g. payment confirmation SMS or UPI ref string).
     - **Image Intent (`image/*`):** Resolves content URI (`Intent.EXTRA_STREAM`), copies file securely to internal app cache using Android `ContentResolver`, and obtains a local file path or data URI.
  5. `MainActivity` forwards the payload to the Capacitor WebView via a custom JavaScript event or deep-link redirect:
     `/catch?shared=native&type=text&data=<encodedText>` or `/catch?shared=native&type=image&uri=<cachedUri>`.
  6. `CatchScreen.tsx` loads the payload, triggers OCR / extraction via `extract-receipt`, and displays the transaction candidate.
  7. **Crucial Rule:** The transaction is **never** saved directly. The user reviews the amount, merchant, and category on `/add` and confirms manually.

### 4.3 Two-Way Voice Pipeline & Conversational State Machine

#### Voice Pipeline Stages
1. **Audio Capture:**
   - Web Audio API / `MediaRecorder` in browser / WebView captures 16 kHz mono WAV/WebM.
2. **Speech Recognition (STT):**
   - Primary: Web Speech API for low-latency live preview (if supported).
   - Production Fallback / Final Accurate Transcription: Groq Whisper Large v3 Turbo via Supabase Edge Function `process-voice`.
3. **Conversational Turn-Taking & Intent Routing:**
   - Instead of immediately routing to a single screen, the query is processed by the Orchestrator with conversation history (last 3 turns).
   - If critical information is missing (e.g., user says *"I bought groceries"* without an amount), the agent synthesizes a follow-up response: *"How much did you spend on groceries?"*.
   - If the user provides a full transaction (*"Spent 250 on lunch"*), the agent presents the confirmation card while verbally confirming: *"Got it, 250 for lunch. Tap confirm to save."*.
4. **Text-to-Speech (TTS):**
   - Fast client-side playback using `window.speechSynthesis` with language-specific voice selection (`hi-IN`, `kn-IN`, `en-IN`).
   - Fallback to lightweight streaming TTS for natural Indic cadence.

---

## 5. Security, Rate Limiting & RLS Boundaries

1. **Database Row Level Security (RLS):**
   - All newly proposed tables (`people`, `peer_debts`, `debt_repayments`, `group_expenses`, `group_splits`, `audit_logs`) will enforce `ENABLE ROW LEVEL SECURITY`.
   - Security policies will strictly bind rows to `auth.uid() = user_id`.
2. **Edge Function Protection:**
   - Edge Functions continue to enforce user-based and IP-based rate limiting using PostgreSQL tables `edge_function_rate_limits` and `edge_function_rate_limit_configs`.
   - Service-role keys and Groq API keys remain strictly server-side secrets in Supabase vault; never bundled into the client build.
3. **Android Storage & File Security:**
   - Shared images from external UPI applications are copied to Android internal cache (`context.getCacheDir()`), inaccessible to other applications.
   - `FileProvider` authorities ensure zero cleartext file exposure.
   - `android:usesCleartextTraffic="false"` remains enforced in `AndroidManifest.xml`.

---

## 6. Migration Requirements & Backward Compatibility

- **Database Schemas:** All FLOVA 2.0 schema additions will be purely additive migrations (`20261125000100_people_and_debts.sql`). No existing columns or tables from v1.0.0 will be altered or dropped.
- **Preserved Existing Features:**
  - Integer paise representation and `lib/money.ts` utilities remain unchanged.
  - The ₹10,00,000 IST daily limit trigger and payout sync triggers remain intact.
  - The v1.0.0 navigation routes (`/app`, `/activity`, `/voice`, `/add`, `/insights`, `/payouts`, `/wish`) remain active and functional.
- **Android Signing & Keystore:**
  - The permanent Android release signing certificate (`flova-release-key.jks`) is preserved untouched. No package name change (`in.flova.app` is permanent).
