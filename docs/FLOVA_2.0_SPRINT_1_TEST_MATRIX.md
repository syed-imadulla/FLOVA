# FLOVA 2.0 — Sprint 1 Test Matrix & Verification Protocols

**Sprint:** Sprint 1  
**Target Platform:** Android (Capacitor 8)  
**Primary Verification Device:** Xiaomi Redmi 12 5G (Android 15, Xiaomi HyperOS 2.0 / MIUI launcher)  
**Document Version:** 2.0.0-sprint1-test  
**Date:** 2026-11-24  
**Author:** Lead Engineer & QA Architect  

---

## 1. Test Strategy Overview

This test matrix establishes the complete verification protocol for the Sprint 1 deliverables:
- **Feature A:** Native Android Home-Screen Widgets (Compact 1:2 and Extended 2:2) on Android 15 / Xiaomi HyperOS launcher, including voice auto-record idempotency and permission denial/manual retry.
- **Feature B:** Native Android UPI Payment Sharing (`ACTION_SEND` text/image via background executor and **authoritative native claim store with heartbeat renewal**), including process recreation before/after URL stripping, empty sessionStorage recovery, duplicate intent delivery, and heartbeat lease renewal.
- **Privacy Assurance:** Explicit verification that FLOVA processes **only** user-shared data and performs zero SMS scraping, background listening, or passive transaction monitoring. Zero payment content stored in browser storage.
- **Regression:** Stability of existing v1.0.0 core functionality (Authentication, Financial Engine, Voice STT, Receipt OCR).

All tests are mapped to specific acceptance criteria. Execution will be verified both via automated test suites and live manual verification on the Xiaomi Redmi 12 5G physical device.

---

## 2. Test Matrix: Feature A (Home-Screen Widgets & Voice Idempotency)

| Test ID | Test Category | Description & User Action | Expected Result | Pass / Fail Criteria | Verification Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **WID-01** | Widget Layout (1:2) | Add Compact Microphone widget to home screen on Xiaomi Redmi 12 5G. | Occupies 1 column by 2 rows on HyperOS launcher. Dark container `#192723`, 24dp rounded corners, mic circle `#2D4A41`, white mic, FLOVA title, "Tap to speak". | No clipped views, correct typography and contrast. | Physical Device (Redmi 12 5G) |
| **WID-02** | Widget Layout (2:2) | Add Extended Quick-Actions widget to home screen on Xiaomi Redmi 12 5G. | Occupies 2 columns by 2 rows. FLOVA header with wave icon, and 2x2 grid (Voice, Add, Receipt, History). | Correct 2x2 layout, touch targets $\ge 52\times 52\text{ dp}$. | Physical Device (Redmi 12 5G) |
| **WID-03** | Mic Action (Cold) | Tap Mic button on Compact 1:2 widget when app process is dead / terminated. | App launches from cold start, routes to `/voice?autoRecord=true`, checks permission, and initiates recording. | Recording active with waveform within 1s. | Physical Device (Redmi 12 5G) |
| **WID-04** | Mic Action (Warm) | Tap Mic button on Extended 2:2 widget when app is in background. | App is foregrounded via `onNewIntent`, switches to `/voice`, initiates recording. | Seamless navigation without activity recreation. | Physical Device (Redmi 12 5G) |
| **WID-05** | Auto-Record Idempotency (Render Guard) | Tap Mic widget $\rightarrow$ `VoiceScreen` opens. Trigger component state re-render (e.g. language dropdown change). | Recording continues uninterrupted; does not restart, reset duration timer, or spawn second session. | Exactly 1 recording session active. | Automated & Physical Device |
| **WID-06** | Auto-Record Idempotency (Remount Guard) | Trigger `autoRecord=true`, let recording complete. Navigate to `/app` then back to `/voice`. | `VoiceScreen` mounts in normal idle state; does not auto-record again. | `autoRecord` consumed and stripped on first entry. | Automated & Physical Device |
| **WID-07** | Auto-Record Idempotency (Cancelled State) | Tap Mic widget. While recording, tap "Cancel" or "Stop". | Recording stops and stays stopped. Does not auto-restart. | Clean teardown without zombie recording loops. | Physical Device (Redmi 12 5G) |
| **WID-08** | Add Action | Tap "Add" tile on Extended 2:2 widget. | App opens directly to `/add` (manual transaction review screen). | Empty form displayed; keyboard ready. | Physical Device (Redmi 12 5G) |
| **WID-09** | Receipt Action | Tap "Receipt" tile on Extended 2:2 widget. | App opens directly to `/catch` (receipt / payment screenshot scanner). | Camera and gallery options visible. | Physical Device (Redmi 12 5G) |
| **WID-10** | History Action | Tap "History" tile on Extended 2:2 widget. | App opens directly to `/activity` (transaction log screen). | Recent transaction feed loaded and scrollable. | Physical Device (Redmi 12 5G) |
| **WID-11** | Permission Denied | Revoke microphone permission in Android Settings, then tap widget mic. | App opens `/voice`. System permission dialog appears. User taps "Deny". | App remains on `/voice`, displays clear notice: "Microphone permission is required to record voice notes." No crash. | Physical Device (Redmi 12 5G) |
| **WID-12** | Permission Denial $\rightarrow$ Manual Retry | Revoke permission, tap widget mic $\rightarrow$ Deny prompt $\rightarrow$ User taps mic button manually on screen. | System prompt reappears or links to Settings. If granted, recording starts cleanly on that manual tap. | Idempotent transition; manual tap works after denial. | Physical Device (Redmi 12 5G) |
| **WID-13** | Lock-Screen Privacy | Inspect Android lock screen / ambient display with widgets placed. | Widget displays zero balance numbers, transaction names, or user personal data. Pure action buttons only. | Zero PII or financial leakage. | Security Audit / Manual |
| **WID-14** | Force-Stop & Reboot | Force-stop FLOVA, reboot Xiaomi Redmi 12 5G, then tap widget. | Widgets reload cleanly after system boot without stale UI; tapping successfully launches app. | Standard `AppWidgetProvider.onUpdate` survives reboot. | Physical Device (Redmi 12 5G) |

---

## 3. Test Matrix: Feature B (UPI Payment Sharing Integration & Authoritative Native Store)

| Test ID | Test Category | Description & User Action | Expected Result | Pass / Fail Criteria | Verification Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UPI-01** | Share Target Registration | Inspect Android share sheet from gallery or text app. | "FLOVA" appears with official icon and name in Android intent chooser. | `ACTION_SEND` declared with `CATEGORY_DEFAULT` for `text/plain` and `image/*`. | Manifest / Intent Test |
| **UPI-02** | Text Sharing (Google Pay) | Share payment confirmation text from Google Pay. | `MainActivity` writes to store, generates token, opens `/catch?sharedToken=...`. Text claimed with lease and acknowledged. | Draft candidate populated; **not committed** to database. Full text not exposed in URL. | Physical Device (Redmi 12 5G) |
| **UPI-03** | Text Sharing (PhonePe) | Share payment confirmation text from PhonePe. | Token bridge extracts amount, merchant, and UPI reference. Candidate displayed with editable fields. | Extracted candidate accurate; editable on `/add`. | Physical Device (Redmi 12 5G) |
| **UPI-04** | Text Sharing (Paytm) | Share payment confirmation text from Paytm. | Token bridge extracts amount and payment details. Candidate displayed with editable fields. | Extracted candidate accurate; editable on `/add`. | Physical Device (Redmi 12 5G) |
| **UPI-05** | Text Sharing (BHIM) | Share payment confirmation text from BHIM. | Token bridge extracts amount and payment details. | Extracted candidate accurate; editable on `/add`. | Physical Device (Redmi 12 5G) |
| **UPI-06** | Image Sharing (Background Copy) | Share receipt screenshot. Background executor copies stream off main thread. | UI does not stutter or drop frames. Share token dispatched only after copy finishes. File converted via `Capacitor.convertFileSrc()`. | Smooth transition; valid image loaded; acknowledged and deleted. | Physical Device (Redmi 12 5G) |
| **UPI-07** | Process Death BEFORE URL Stripping | Share receipt $\rightarrow$ `MainActivity` created with `?sharedToken=...`. Force kill process before `navigate(replace: true)` runs. Reopen app. | Native store recognizes existing token, returns the authoritative native `claimId`. React continues loading. | Recovers cleanly; no duplicate claim ID generated. | ADB / Physical Device |
| **UPI-08** | Process Death AFTER URL Stripping | Share receipt $\rightarrow$ URL stripped $\rightarrow$ Force kill process during image load. Reopen app in same task. | Screen queries native for active token (or uses sessionStorage token). Native returns authoritative `claimId`. | Seamless recovery; image loaded without error. | ADB / Physical Device |
| **UPI-09** | Empty sessionStorage Recovery | Simulate OS clearing `sessionStorage`. Call `claimSharedPayload({ token })`. | Native store checks `/flova_shares/<token>.json`, sees active lease, and returns the existing native `claimId`. | Survives complete browser storage wipe. | Automated Unit Test |
| **UPI-10** | Duplicate Intent Delivery | User rapidly taps "Share to FLOVA" twice in external app, firing duplicate `ACTION_SEND` intents. | Native store detects existing active token/intent; does not overwrite or corrupt image copy. Reuses valid lease. | Zero payload collision or file corruption. | Physical Device (Redmi 12 5G) |
| **UPI-11** | Lease Renewal During Long Ingestion | Ingest large receipt image requiring $>75\text{s}$ for downscaling and OCR. Heartbeat fires every 20s. | `renewSharedPayloadLease` extends `claimExpiresAt` every 20s. Payload is not reclaimed by another instance. | Ingestion completes without lease expiry. | Automated Unit Test |
| **UPI-12** | Reclamation After Renewal Stops | Client A claims payload, then crashes or stops heartbeat. Wait 65s. | Client B calls claim $\rightarrow$ expired lease reclaimed! Native assigns new claimId to Client B. | Dead lease reclaimed after renewal ceases. | Automated Unit Test |
| **UPI-13** | Replaced Lease Cannot Acknowledge | Client A loses lease (due to freeze $>60\text{s}$), Client B reclaims lease. Client A wakes up and attempts `acknowledgeSharedPayload`. | Native checks `claimId`: Client A's request is rejected with `{ status: "lease_lost" }`. Disk files preserved for Client B. | Stale acknowledgment strictly prohibited. | Automated Unit Test |
| **UPI-14** | Absolute 15-Minute TTL Invariant | Client keeps heartbeat active for $>15\text{ minutes}$. | At 15:01, `renewSharedPayloadLease` rejects renewal with `{ status: "expired" }`. Files purged. | Absolute 15-minute TTL strictly enforced. | Automated Unit Test |
| **UPI-15** | Concurrent Acknowledgment | Dispatch two concurrent calls to `acknowledgeSharedPayload()` for the same claimed token. | Synchronized execution: first call deletes files and returns `{ status: "ok" }`; second call returns `{ status: "not_found" }`. | Idempotent cleanup; zero unhandled crash. | Automated Unit Test |
| **UPI-16** | Background Copy Failure | Simulate disk full or I/O failure during background image stream copy. | Copy task terminates, `.tmp` deleted, share token is **not** created or dispatched. User sees error notice. | Corrupted file never registered or passed to WebView. | Automated Unit Test |
| **UPI-17** | Native Metadata Cleanup After Ack | Check `/flova_shares/` directory immediately before and after `acknowledgeSharedPayload()`. | Files `<token>.json` and `<token>.jpg` are deleted immediately from disk. | Disk directory contains 0 lingering files after acknowledgment. | ADB / Automated Test |
| **UPI-18** | Privacy: Zero Passive Scraping | Run background network / intent monitor while receiving SMS or making background UPI payment. | FLOVA triggers zero activity, reads zero SMS, makes zero background network calls. | Strict passive isolation: processes **only** user-shared intents. | Security Audit |
| **UPI-19** | Zero Auto-Save Invariant | Share valid UPI receipt text and exit app without confirming. | Inspect PostgreSQL database `transactions` table. | Exactly **0 rows inserted**. Invariant strictly upheld. | Automated / DB Inspection |
| **UPI-20** | Confirm & Save | Review extracted candidate on `/add`, tap "Confirm Transaction". | Transaction is saved to PostgreSQL in integer paise. Balance updates. | 1 row inserted; amount matches integer paise. | Manual / Automated |
| **UPI-21** | Oversized Image | Share image exceeding 15 MB. | Native bridge rejects oversized file with user-friendly error before reading into memory. | App does not encounter Out-Of-Memory error. | Manual / Test Fixture |

---

## 4. Test Matrix: Regression Testing (Core v1.0.0 Functionality)

| Test ID | Test Category | Area Tested | Expected Result | Pass / Fail Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **REG-01** | Financial Engine | `balance.ts`, `runway.ts` integer paise calculations | Ravi delivery driver fixture passes with ₹3,930 starting balance and ₹1,170 shortfall. | Automated unit tests pass (`balance.test.ts`, `runway.test.ts`). |
| **REG-02** | Daily Ceiling | Trigger `enforce_daily_transaction_limit` | Transactions exceeding ₹10,00,000 in IST day are rejected. | Database trigger unit tests pass. |
| **REG-03** | Segregation | Third-party funds (`not_mine`) | Custodial collections are strictly excluded from personal spendable balance. | `lifecycle.test.ts` passes. |
| **REG-04** | Expected Payouts | Platform payouts (`payouts` table) | Unearned/scheduled payouts are excluded from current balance. | Payout sync regression tests pass. |
| **REG-05** | Transaction Edits | `TransactionForm.tsx` & `expense_type_rule` | Updating income/expense preserves check constraints without SQL error. | `transactionUpdateCheckConstraint.test.ts` passes (7/7). |
| **REG-06** | Voice STT Pipeline | Groq Whisper + local fallback | Voice recording passes to `process-voice` and falls back gracefully if offline. | `voiceIntent.test.ts` passes (13/13). |
| **REG-07** | Multilingual STT | Indic language support (en, hi, kn) | Parses Hindi and Kannada voice utterances accurately. | `multilingualVoice.test.ts` passes (14/14). |
| **REG-08** | Auth & Session | Google Sign-In & Supabase session | Login, session persistence, and logout operate smoothly. | Auth integration tests pass. |

---

## 5. Acceptance Criteria Checklist for Sprint 1 Sign-Off

- [ ] Native Android 1:2 Compact Microphone widget installs and functions on Xiaomi Redmi 12 5G (Android 15, HyperOS 2.0).
- [ ] Native Android 2:2 Extended Quick-Actions widget installs and all 4 buttons route to their target screens.
- [ ] Tapping microphone on either widget opens `/voice?autoRecord=true` with one-shot execution guard (zero double-recordings; manual tap works after permission denial).
- [ ] Sharing payment text or receipt image from UPI apps (Google Pay, PhonePe, Paytm, BHIM) opens FLOVA `/catch` via authoritative native claim store.
- [ ] Native Android storage is the authoritative source for `{token, claimId}`; survives process recreation before and after URL stripping, and survives empty `sessionStorage`.
- [ ] Active image ingestion issues heartbeat renewals every 20s, while enforcing an absolute 15-minute payload TTL ceiling.
- [ ] Image stream copy is executed off the main thread using a background executor before dispatching the share token.
- [ ] Native Java code returns private file path; `Capacitor.convertFileSrc()` is applied exclusively in TypeScript.
- [ ] Temporary cached images and claim metadata are deleted from disk only after React explicitly acknowledges successful in-memory load.
- [ ] Replaced leases cannot acknowledge the payload; stale writes are rejected with `lease_lost`.
- [ ] Zero SMS scraping or passive background monitoring; strictly explicit user sharing.
- [ ] Full payment text is never exposed in URL search parameters or persistent browser storage.
- [ ] Zero transactions are saved without explicit user confirmation on `/add`.
- [ ] Zero balance or PII rendered on lock-screen widgets.
- [ ] All 67 existing frontend unit tests pass without regression.
- [ ] Android build completes without warnings or compile errors (`npx cap sync android`).
