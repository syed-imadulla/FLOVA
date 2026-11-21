# FLOVA

> **"Every rupee has a story. FLOVA remembers."**

FLOVA is an adaptive, voice-first financial companion designed specifically for people with irregular and unpredictable income: delivery riders, cab drivers, auto drivers, freelancers, tradespeople, small vendors, and daily-wage workers across India.

Instead of rigid monthly budgets that fail when income fluctuates, FLOVA answers the one question that truly matters: **"Will my available money last until my next payout?"**

---

## 🌟 Core Capabilities

### 1. Conversational Voice Intelligence
- **AI4Bharat IndicConformer (PRIMARY STT):** Native speech-to-text inference tuned for Indian languages, accents, and code-switching (`kn`, `hi`, `te`, `ta`, `ml`, `en`).
- **Groq Whisper (SECONDARY FALLBACK):** Automated, seamless failover to `whisper-large-v3-turbo` if the primary engine is unavailable or times out.
- **Multilingual Understanding:** Natural financial extraction across English, Hindi, Kannada, Telugu, Tamil, Malayalam, Marathi, Bengali, Gujarati, and Urdu.
- **Multi-Transaction Extraction:** Accurately separates multiple financial events from a single sentence (e.g., *"Spent ₹250 on groceries and earned ₹800 from a freelance project"*) without amount duplication.
- **Truthful Uncertainty:** Ambiguous or incomplete statements prompt clarification rather than hallucinating amounts or categories.

### 2. Smart Capture & Receipt / UPI Intelligence
- **Physical Paper Receipts:** Parses itemized lines, taxes, fees, and final payable amounts with arithmetic discrepancy detection.
- **UPI Payment Screenshots:** Recognizes screenshots from Google Pay, PhonePe, Paytm, CRED, and BHIM. Automatically classifies status (`COMPLETED`, `PENDING`, `FAILED`) and extracts the 12-digit UPI reference number (UTR).
- **Duplicate Payment Prevention:** Rejects duplicate entries with identical UTR numbers.
- **20 MB Image Optimization:** Client-side HTML5 canvas downscaling and compression reduce photos up to 20 MB to sub-megabyte payloads for instant edge inference.
- **PWA Web Share Target:** Share payment receipts or screenshots directly from WhatsApp, PhonePe, or gallery into FLOVA.

### 3. Invoice Intelligence Agent
- **Payables & Receivables Tracking:** Manage contractor and client invoices with line items, due dates, and counterparties.
- **Partial Settlements:** Record multi-part payments with automatic status tracking (`unpaid`, `partially_paid`, `paid`, `overdue`).
- **No Double-Counting:** Unpaid receivables represent expected cash flow and are excluded from confirmed balances until settled into the ledger.

### 4. Deterministic Financial Engine
- **Integer Paise Representation:** All financial totals and balances are calculated strictly in integer paise (`1 Rupee = 100 Paise`). AI never performs authoritative balance math.
- **Strict Money Isolation:** Segregates personal spendable income, custodial third-party collections (Cash on Delivery / `not_mine`), and expected future payouts.
- **₹10 Lakh Safeguard:** Strict individual (₹10,00,000) and India-local calendar day aggregate (₹10,00,000) transaction limits enforced in PostgreSQL triggers with row-level locking.

### 5. Adaptive Safety Buffer & Runway Outlook
- **Self-Salary Rule:** Cautious estimate of sustainable personal pay with essential expenses protected first.
- **Buffer Deficit Projections:** 30-day forward cash flow modeling detects when spending threatens safety buffers before an actual cash deficit occurs.
- **Canonical Ravi Delivery Fixture:** Deterministically reproduces the −₹1,170 Saturday shortfall scenario for delivery workers.
- **WISH 2.0 Micro-Savings:** Database-persisted savings goals that automatically absorb surplus earnings from good weeks.

---

## 🏗️ Architecture & Technology Stack

| Tier | Technologies |
|---|---|
| **Frontend PWA** | React 18, Vite 5.4.11, TypeScript 5.6.3, Tailwind CSS 3.4.19, Service Worker (Network-First) |
| **Backend & Storage** | Supabase Auth, PostgreSQL 15 with Row Level Security (RLS) on project `msjzkylvafuwlkkujxpv` |
| **Serverless Functions**| Supabase Edge Functions on Deno runtime (`process-voice`, `extract-receipt`) |
| **AI / Speech-to-Text** | AI4Bharat IndicConformer (Primary microservice), Groq Whisper Large v3 (Secondary fallback) |
| **AI / Vision & Extraction** | Groq Qwen 2.5 27B Vision, Groq Llama 3.3 70B Versatile Chat |
| **Mathematical Engine**| Deterministic TypeScript Engine (`frontend/src/engine/`) in integer paise |

Detailed architectural documentation is available in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ and npm
- Python 3.10+
- FFmpeg (`sudo apt install ffmpeg`)
- Supabase account (or local PGlite for testing)

### 1. Clone & Install
```bash
git clone https://github.com/syed-imadulla/FLOVA.git
cd FLOVA

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend testing dependencies
cd backend && npm install && cd ..

# Install Python STT service dependencies
cd ai-engine && pip install -r stt_service/requirements.txt && cd ..
```

### 2. Configure Environment
```bash
# Frontend configuration
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your Supabase URL and Anon Key
```

### 3. Run Development Servers
```bash
# Start frontend application (http://localhost:5173)
cd frontend && npm run dev

# Start IndicConformer STT microservice (http://localhost:8001)
cd ai-engine && python3 -m uvicorn stt_service.main:app --port 8001
```

---

## 🧪 Testing & Verification

FLOVA includes exhaustive multi-tier automated test coverage:

```bash
# 1. Frontend Service, UI & Voice Tests (21 suites, 100+ tests)
cd frontend
node --loader ./src/services/__tests__/mockLoader.mjs --test "src/services/__tests__/*.test.ts"

# 2. Deterministic Financial Engine & Runway Tests (9 suites)
cd frontend
node --loader ./src/services/__tests__/mockLoader.mjs --test \
  "src/engine/__tests__/*.test.ts" \
  "src/runway/__tests__/*.test.ts" \
  "src/wish/__tests__/*.test.ts" \
  "src/profile/__tests__/*.test.ts" \
  "src/data/__tests__/*.test.ts"

# 3. Database Schema, Triggers & Row Level Security (54 tests)
cd backend
npm run test:db

# 4. Demo Seeding & Isolation Verification (17 tests)
cd backend
npm run test:seed

# 5. Python STT Service & Engine Tests (23 tests)
cd ai-engine
python3 -m pytest

# 6. Production Build Check
cd frontend
npm run build
```

---

## 📚 Technical Documentation

Comprehensive engineering documentation is maintained in the [`docs/`](docs/) directory:

- [System Architecture](docs/ARCHITECTURE.md)
- [Speech-to-Text & Conversational Voice](docs/VOICE-STT.md)
- [Smart Capture & Receipt/UPI Intelligence](docs/SMART-CAPTURE.md)
- [Invoice Intelligence Agent](docs/INVOICE-INTELLIGENCE.md)
- [Deterministic Financial Engine & Limits](docs/FINANCIAL-ENGINE.md)
- [Adaptive Safety Buffer & Runway](docs/ADAPTIVE-BUFFER.md)
- [Security, RLS & Authentication](docs/SECURITY.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Environment Variables & Secrets](docs/ENVIRONMENT.md)
- [Testing & Verification Guide](docs/TESTING.md)

---

## 🔒 Security & Privacy

- **Row Level Security (RLS):** Every user's transactions, check-ins, payouts, invoices, and goals are strictly isolated at the database engine level.
- **Zero Secrets in Frontend:** The client bundle contains no private API keys, service role tokens, or model credentials.
- **Explicit Confirmation:** No AI-inferred candidate is ever committed to the ledger without the user reviewing and clicking "Confirm" in `/add`.

---

## 📄 License
This project is licensed under the MIT License. Models from AI4Bharat are open-source and governed by their respective research and open licenses.
