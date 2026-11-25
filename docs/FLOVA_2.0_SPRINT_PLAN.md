# FLOVA 2.0 — Agile Sprint Plan

**Document Version:** 2.0.0-PROD-PLAN-REV2  
**Date:** 2026-11-25  
**Author:** Technical Architect & Lead Engineer  
**Current Production Baseline:** `v1.0.1` (Commit `ab4bdef`)  
**Strategy:** Incremental, test-driven sprints. Each sprint delivers independently reviewable, production-ready increments without breaking `v1.0.1` stability.

---

## Completed Baseline (FLOVA v1.0.1 — Commit `ab4bdef`)
The following capabilities are **already implemented, verified on Xiaomi Redmi 12 5G, and shipped in `v1.0.1`**:
- Privacy-preserving Android home-screen widgets: Compact Mic (2×2) and Quick Actions (2×2 default, 4×2 resizable) displaying zero financial balances or private data.
- Native Android UPI Share Target (`ACTION_SEND` text/image) with durable claim store, heartbeat lease renewal, and atomic acknowledgment.
- Deterministic integer-paise financial engine (`balance.ts`, `runway.ts`, `adaptiveBuffer.ts`), Groq Whisper production STT (`process-voice`), and dormant `indicconformer/`.
- Permanent RSA 4096-bit keystore (`~/.android/flova-release.keystore`, alias `flova-release`, SHA-256 `3E:2E:D1:B3:24:A8:A9:B3:0E:8A:07:E0:F5:52:D3:C0:6B:E8:9F:A9:4E:4B:C7:E0:A4:1D:F8:23:52:DA:34:D6`, Min SDK 24, Compile/Target SDK 36) with GitHub Releases APK distribution.

---

## Sprint Roadmap Overview (Sprints 1–6)

1. **Sprint 1 (`v2.0.0-alpha.0`): Financial Foundation, Single Source of Truth & Database Compatibility**
   - Scope: Additive migration `20261125000100_flova_2_foundation.sql` (`people`, `peer_debts`, `debt_settlements`, `financial_audit_log`, nullable `transactions.inflow_category`), composite `UNIQUE (id, user_id)` & composite FKs, RLS + `SECURITY DEFINER` append-only audit triggers (including `people`), Available Liquidity vs Sustainable Runway engine with zero double-counting, and `v1.0.1` seeded compatibility + disposable local rollback tests. Preserves existing 5-tab navigation.
2. **Sprint 2 (`v2.0.0-alpha.1`): People & Shared Finance**
   - Scope: People Directory UI, Peer Debt Ledger UI, partial settlement workflow, and equal/custom group bill splitting with integer-paise remainder allocation.
3. **Sprint 3 (`v2.0.0-beta.0`): Navigation Redesign, Two-Way Voice & Multi-Agent Intelligence**
   - Scope: 4-tab shell (`People`, `Money`, `Insights`, `Profile`) + center FAB Inline Assistant Modal Bottom Sheet, 3–5 turn dialogue state machine, Groq Llama 3.3 Central Agent Router, Indic TTS, and human-in-the-loop confirmation gate.
4. **Sprint 4 (`v2.0.0-beta.1`): Student, Family & Persona Workflows**
   - Scope: Student pocket money & semester burn-rate mode, family household shared pools, and proactive daily spend envelope alerts.
5. **Sprint 5 (`v2.0.0-rc.0`): Receipt Cloud Storage, Vision Agent & Proactive Notifications**
   - Scope: Private `receipts/` Supabase Storage bucket with signed URLs, itemized receipt OCR validation, and Android WorkManager / LocalNotifications alarms.
6. **Sprint 6 (`v2.0.0`): Offline WAL, Security Hardening & Production Release**
   - Scope: IndexedDB Write-Ahead Log (WAL) outbox with idempotency keys, R8 verification, permanent keystore verification, and signed GitHub Release APK (`FLOVA-v2.0.0-android.apk`).
