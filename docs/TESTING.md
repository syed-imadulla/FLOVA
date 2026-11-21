# FLOVA: Automated Testing & Verification Guide

## 1. Overview
FLOVA maintains comprehensive multi-tier test suites across the frontend client, deterministic financial engine, database schemas/RLS, and Python AI microservices.

---

## 2. Test Execution Commands

### A. Frontend Service & UI Integration Tests (21 suites, 100+ tests)
```bash
cd frontend
node --loader ./src/services/__tests__/mockLoader.mjs --test "src/services/__tests__/*.test.ts"
```
**Coverage:**
- `sttProviderMigration.test.ts`: IndicConformer primary STT, Whisper fallback, multi-amount deduplication, UUID stability.
- `smartCaptureReceiptUpi.test.ts`: Receipt extraction, UPI status classification, UTR duplicate prevention, Web Share Target.
- `receiptUpiRepair.test.ts`: 20 MB image validation, line items, arithmetic reconciliation, discrepancy alerts.
- `invoiceIntelligence.test.ts`: Payables, receivables, partial settlements, overdue calculation, no double counting.
- `wishPersistence.test.ts`: WISH 2.0 database persistence, goal completion, localStorage migration.
- `candidateIdStability.test.ts`: Idempotency, 23505 duplicate key recovery, candidate UUID stability.
- `coreFinancialCorrectness.test.ts`: ₹10 Lakh individual and calendar-day aggregate limits.
- `voiceIntent.test.ts` & `multilingualVoice.test.ts`: Multilingual speech recognition across 10 Indic languages.

### B. Deterministic Financial Engine & Runway Tests (9 suites)
```bash
cd frontend
node --loader ./src/services/__tests__/mockLoader.mjs --test \
  "src/engine/__tests__/*.test.ts" \
  "src/runway/__tests__/*.test.ts" \
  "src/wish/__tests__/*.test.ts" \
  "src/profile/__tests__/*.test.ts" \
  "src/data/__tests__/*.test.ts"
```
**Coverage:**
- `balance.test.ts`: Confirmed available cash baseline, custodial COD isolation.
- `runway.test.ts`: 30-day projected cash flow, buffer deficit alerts.
- `safeBuffer.test.ts`: Self-salary and adaptive cushion formulations.
- `ravi.test.ts`: Canonical Ravi delivery fixture (−₹1,170 shortfall on Saturday 2026-11-21).
- `parseRupees.test.ts`: Decimal rupee parsing and ₹10 Lakh boundary safeguards.

### C. Backend Database Schema, Triggers & RLS Tests (54 tests)
```bash
cd backend
npm run test:db
```
**Coverage:**
- PGlite embedded PostgreSQL database applying all 7 SQL migrations.
- Tenant isolation (User B cannot read/write User A's transactions, check-ins, payouts, commitments, invoices, wish goals).
- ₹10 Lakh aggregate calendar day trigger validation.
- Payout synchronization state machine.

### D. Demo Seeding & Isolation Verification (17 tests)
```bash
cd backend
npm run test:seed
```

### E. Python STT Service & Engine Tests (23 tests)
```bash
cd ai-engine
python3 -m pytest
```
**Coverage:**
- `test_stt_service.py`: Health endpoint, internal token auth, audio conversion, Kannada/Hindi/Telugu transcription.
- `test_engine.py`: Self-salary rule, lean-week outlook, backtest simulator.

### F. Frontend Production Build
```bash
cd frontend
npm run build
```
Executes `tsc -b && vite build`. Must complete with zero TypeScript errors or broken imports.
