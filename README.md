<p align="center">
  <a href="https://github.com/syed-imadulla/FLOVA">
    <img src="docs/assets/flova-icon.png" width="128" alt="FLOVA Application Icon" style="border-radius: 28px;">
  </a>
</p>

<h1 align="center">FLOVA</h1>

<p align="center">
  <strong>Every rupee has a story. FLOVA remembers.</strong>
</p>

<p align="center">
  A voice-first, deterministic financial companion engineered for irregular earners, freelancers, gig workers, and independent tradespeople across India.
</p>

<p align="center">
  <a href="https://myflova.vercel.app"><img src="https://img.shields.io/badge/Web_App-myflova.vercel.app-0F5C4C.svg?style=flat" alt="Live Web App"></a>
  <a href="https://github.com/syed-imadulla/FLOVA/releases"><img src="https://img.shields.io/badge/Release-v1.0.0-0F5C4C.svg?style=flat" alt="Release v1.0.0"></a>
  <a href="https://github.com/syed-imadulla/FLOVA/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-0F5C4C.svg?style=flat" alt="License: MIT"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black" alt="React"></a>
  <a href="https://capacitorjs.com/"><img src="https://img.shields.io/badge/Capacitor-8.6-119EFF.svg?logo=capacitor&logoColor=white" alt="Capacitor"></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg?logo=supabase&logoColor=white" alt="Supabase"></a>
</p>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#the-problem">The Problem</a> •
  <a href="#how-flova-works">How It Works</a> •
  <a href="#core-features">Features</a> •
  <a href="#visual-identity">Visual Identity</a> •
  <a href="#system-architecture">Architecture</a> •
  <a href="#technology-stack">Tech Stack</a> •
  <a href="#repository-structure">Repository</a> •
  <a href="#financial-safety-principles">Financial Safety</a> •
  <a href="#quickstart--development">Quickstart</a> •
  <a href="#android-installation">Android Release</a> •
  <a href="#testing-suite">Testing</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#security">Security</a> •
  <a href="#roadmap">Roadmap</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## Overview

FLOVA is a financial companion designed specifically for people with variable, unpredictable income. Built from the ground up for freelancers, independent contractors, delivery executives, cab drivers, and small business owners in India, FLOVA departs from rigid calendar-month budgeting tools and instead anchors personal finance on **cash runway intelligence** and **deterministic ledger mathematics**.

FLOVA operates under a foundational design invariant: **AI Suggests, User Confirms**. Machine learning models assist in transcribing multilingual voice notes and optical character recognition (OCR) on receipts, but all financial calculations, state transitions, and database writes are governed by deterministic, verifiable rules.

---

## The Problem

Conventional personal finance applications are built on the assumption of a predictable monthly paycheck deposited on a fixed date. For over 15 million gig workers, independent service professionals, and irregular earners across India:

1. **Unpredictable Inflow Timing:** Earnings arrive on varying schedules—daily cash tips, weekly platform payouts, or net-30 client invoices.
2. **Custodial Money Mixing:** Delivery partners frequently collect Cash on Delivery (COD) for third-party platforms. When mixed into personal wallets or UPI accounts, standard apps treat customer cash as spendable personal wealth.
3. **Volatility & Runway Blindness:** When weekly earnings swing between ₹2,500 and ₹9,000, monthly category budgets provide no actionable guidance. Users need to know: *"Will my available cash survive until my next confirmed payout?"*

---

## How FLOVA Works

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FLOVA Interaction Model                         │
└────────────────────────────────────────────────────────────────────────┘

    Voice Note (Whisper)       Receipt / UPI Screenshot (OCR)
            │                                  │
            ▼                                  ▼
 ┌──────────────────────┐           ┌──────────────────────┐
 │  Groq Audio Pipeline │           │ Qwen Vision / Regex  │
 └──────────┬───────────┘           └──────────┬───────────┘
            │                                  │
            └───────────────┬──────────────────┘
                            ▼
           ┌──────────────────────────────────┐
           │ Structured Candidate Extraction  │
           └────────────────┬─────────────────┘
                            ▼
           ┌──────────────────────────────────┐
           │   AI Suggests, User Confirms     │◄── Explicit User Review
           └────────────────┬─────────────────┘
                            ▼
           ┌──────────────────────────────────┐
           │ Pure Integer Paise Engine        │
           │ (Deterministic, Zero Math Drift) │
           └────────────────┬─────────────────┘
                            ▼
           ┌──────────────────────────────────┐
           │ Day-by-Day Cash Runway & Ledger  │
           └──────────────────────────────────┘
```

1. **Natural Input:** Record a quick voice note in English, Hindi, Kannada, Tamil, Telugu, or Malayalam, or snap a photo of a merchant receipt or UPI payment confirmation.
2. **Structured Proposal:** FLOVA extracts transaction amounts, categories, dates, and ownership types (`mine` vs. `not_mine`), presenting an interactive candidate draft.
3. **User Confirmation:** No transaction enters the ledger automatically. The user reviews and verifies details before commitment.
4. **Runway Simulation:** The deterministic financial engine computes available liquidity, separates custodial cash, calculates required adaptive buffers, and simulates forward cash runway.

---

## Core Features

### 1. Cash Runway Intelligence
- **Day-by-Day Simulation:** Projects cash availability over the next 30 days based on confirmed daily living burn rates and scheduled commitments.
- **Adaptive Safety Buffer:** Dynamically calculates between 3 and 21 days of baseline reserves based on the worker's earnings variability profile (daily, weekly, or unpredictable).
- **Buffer Breach Warnings:** Identifies cash shortfalls before they occur, allowing users to adjust discretionary spending proactively.

### 2. Custodial Cash Isolation (`not_mine`)
- **COD Separation:** Mark transactions as custodial third-party money (e.g. delivery cash collections).
- **Zero Runway Inflation:** Custodial cash is excluded from spendable balances, ensuring users never accidentally spend money owed back to an employer or platform.

### 3. Balance Check-Ins & Reconciliation
- **Physical Cash & Bank Splitting:** Separate tracking for physical wallet cash and digital bank balances.
- **One-Tap Reconciliation:** Periodic check-ins compare calculated ledger balances against actual wallet counts and surface discrepancies without destructive database overwrites.

### 4. Invoices & Gig Payout Management
- **Receivables & Payables:** Track contractor invoices and upcoming platform payouts with due dates and counterparties.
- **Partial Settlements:** Record multi-part payments with automated contract status lifecycles (`unpaid`, `partially_paid`, `paid`, `overdue`).
- **No Inflow Double-Counting:** Unsettled expected payouts never inflate current spendable cash until confirmed as received.

### 5. Multilingual Voice Intelligence
- **Cloud STT via Groq Whisper:** Sub-second speech recognition fine-tuned for Indian English, Hindi, and regional accents using `whisper-large-v3-turbo`.
- **Compound Sentence Parsing:** Automatically parses complex multi-intent sentences (e.g. *"Spent 300 on petrol and received 1200 from client"*) into distinct income and expense records.
- **Local Fallback Pipeline:** Architecture preserves dormant support for self-hosted AI4Bharat IndicConformer on dedicated GPU instances.

### 6. Smart Capture & Receipt OCR
- **Receipt Line-Item Extraction:** Extracts merchant names, dates, individual line items, and totals with automatic arithmetic verification.
- **UPI Screenshot Intelligence:** Recognizes payment status (`COMPLETED`, `PENDING`, `FAILED`) and extracts 12-digit UTR reference numbers.
- **UTR De-Duplication:** Rejects duplicate submissions sharing the same reference number to eliminate double-counting.

### 7. WISH 2.0 Micro-Savings Goals
- **Surplus Absorption:** Direct surplus cash during peak earnings weeks into dedicated micro-goals (tools, bike maintenance, insurance).
- **Database-Backed Persistence:** Complete tracking with contribution histories and goal progress milestones.

---

## Visual Identity

<p align="center">
  <img src="docs/assets/flova-logo.svg" width="320" alt="FLOVA Vector Logo">
</p>

The FLOVA visual system balances utilitarian clarity with warmth. Designed with high contrast for outdoor visibility in Indian sunlight, it utilizes an emerald primary palette (`#0F5C4C`), clean typography, and tactile list cards.

---

## System Architecture

FLOVA is built with an offline-tolerant, decoupled architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          System Architecture                           │
└────────────────────────────────────────────────────────────────────────┘

 [Android Release APK] (in.flova.app)     [Web Progressive Web App]
         │                                            │
         └─────────────────────┬──────────────────────┘
                               │
                       Vite + React 18 SPA
                      (Tailwind CSS, Router)
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   Pure Financial Engine                 Supabase Auth Client
  (Integer Paise Arithmetic,            (Native Google Sign-In,
   Runway Simulation, Cache)             Credential Manager OIDC)
            │                                     │
            └──────────────────┬──────────────────┘
                               │ HTTPS / TLS 1.3
                               ▼
        ┌──────────────────────────────────────────────┐
        │        Supabase Backend (ap-south-1)         │
        ├──────────────────────────────────────────────┤
        │ • PostgreSQL 17 (Row Level Security)         │
        │ • GoTrue Auth (Automatic Account Linking)    │
        │ • Edge Functions (process-voice, rate-limit) │
        └──────────────────────┬───────────────────────┘
                               │ Private API
                               ▼
        ┌──────────────────────────────────────────────┐
        │            External AI Providers             │
        ├──────────────────────────────────────────────┤
        │ • Groq Cloud (Whisper Large v3, Llama 3.3)   │
        └──────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Mobile Runtime** | Capacitor 8.6.2, Android SDK 36 (Android 15/16) | Native Android container with orientation lock |
| **Frontend Framework** | React 18.3, TypeScript 5.6, Vite 6.4 | SPA application layer with responsive mobile UX |
| **Styling** | Tailwind CSS 3.4, PostCSS, Autoprefixer | High-contrast design system optimized for readability |
| **Authentication** | Supabase Auth (GoTrue), Android Credential Manager | Native Google OAuth with automatic account linking |
| **Database & API** | Supabase PostgreSQL 17 (`ap-south-1`) | Persistent ledger, strict RLS isolation, atomic triggers |
| **Edge Compute** | Deno runtime (Supabase Edge Functions) | Rate-limited serverless token extraction and AI proxy |
| **AI Processing** | Groq Cloud (Whisper Large v3 Turbo, Llama 3.3 70B) | Multilingual STT and structured financial NLP |
| **Hosting & CDN** | Vercel (Edge Network) | Static SPA hosting and verified Android App Links |

---

## Repository Structure

```
FLOVA/
├── ai-engine/                  # Python STT services & algorithmic engines
│   ├── stt_service/            # FastAPI microservice for audio transcription
│   ├── udaan_engine/           # Quantitative income & runway analysis
│   └── tests/                  # Pytest test suite (36 tests)
├── backend/                    # Supabase database & serverless backend
│   ├── scripts/                # PGlite regression and concurrency suites
│   ├── supabase/functions/     # Edge functions (process-voice, extract-receipt)
│   └── supabase/migrations/    # 11 declarative PostgreSQL migrations (RLS, schema)
├── docs/                       # Architecture, security, and operational documentation
│   ├── assets/                 # Brand assets, vectors, and icons
│   ├── ARCHITECTURE.md         # Detailed technical design contract
│   ├── DEPLOYMENT.md           # Production deployment & operations manual
│   ├── ENVIRONMENT.md          # Variable classification & secrets reference
│   └── SECURITY.md             # Threat model, RLS audit, and controls
├── frontend/                   # React TypeScript web & mobile application
│   ├── android/                # Native Android project (Capacitor)
│   ├── public/                 # Static assets & .well-known/assetlinks.json
│   ├── src/                    # Application source code
│   │   ├── app/                # Layouts, navigation, activity rows, categories
│   │   ├── engine/             # Deterministic integer-paise financial engine
│   │   ├── lib/                # Supabase client & API utilities
│   │   ├── pages/              # Screen components (Dashboard, Ledger, Invoices)
│   │   └── services/           # Social login, OCR, voice intent adapters
│   └── package.json            # Node.js dependencies and scripts
├── .gitignore                  # Strict credential, dump, and keystore exclusions
├── CHANGELOG.md                # Semantic version release history
└── README.md                   # Project overview & documentation
```

---

## Financial Safety Principles

1. **Integer Paise Mathematics:** Every monetary value is stored and calculated in whole paise (`1 INR = 100 paise`). Floats are strictly forbidden in calculation routines to eliminate rounding anomalies.
2. **AI Never Writes Directly:** Machine learning extractors output draft proposals. Transactions only commit to the database when confirmed by the user.
3. **Custodial Isolation:** Third-party funds (`ownership: 'not_mine'`) are strictly partitioned from personal liquid balances.
4. **Row Level Security (RLS):** Every PostgreSQL table enforces `auth.uid() = user_id`. No user can query or modify another user's financial ledger.
5. **Atomic Payout Sync:** Compound foreign keys (`payout_id, user_id`) and PostgreSQL `FOR UPDATE` triggers prevent double-crediting or lost updates during simultaneous transactions.

---

## Quickstart & Development

### Prerequisites
- Node.js 20+ and npm 10+
- Python 3.10+ (for `ai-engine`)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/syed-imadulla/FLOVA.git
cd FLOVA
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
```

Configure `frontend/.env.local`:
```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

Start the Vite development server:
```bash
npm run dev
```

### 3. Backend & AI Engine Setup
```bash
cd ../ai-engine
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. pytest tests/
```

---

## Android Installation

FLOVA for Android is distributed as an optimized, signed APK via **GitHub Releases**. It is not published to Google Play.

### Downloading the APK
- Download the official release APK: [**FLOVA v1.0.0 Android APK**](https://github.com/syed-imadulla/FLOVA/releases/download/v1.0.0/FLOVA-v1.0.0-android.apk)
- Package Identifier: `in.flova.app`
- Version: `1.0.0` (versionCode `1`)
- Minimum Android Version: Android 7.0 (API 24)
- Target Android Version: Android 15/16 (API 36)

### Sideloading Instructions
1. Download `FLOVA-v1.0.0-android.apk` to your Android device.
2. In your device settings, enable **Install unknown apps** for your browser or file manager.
3. Open the downloaded APK and tap **Install**.
4. Launch FLOVA and tap **Continue with Google** to sign in.

### Permanent Certificate Verification
All official FLOVA builds are signed with a permanent RSA 4096-bit release certificate. Users can verify the package integrity using the Android SDK:

```bash
apksigner verify --verbose --print-certs FLOVA-v1.0.0-android.apk
```

**Expected Certificate Fingerprints:**
- **SHA-256:** `3E:2E:D1:B3:24:A8:A9:B3:0E:8A:07:E0:F5:52:D3:C0:6B:E8:9F:A9:4E:4B:C7:E0:A4:1D:F8:23:52:DA:34:D6`
- **SHA-1:** `32:D2:5D:C8:86:6E:26:C5:0F:12:13:6A:25:16:53:C0:35:A5:B3:4E`

> **Update Policy:** Because FLOVA is distributed outside Google Play, updates are installed manually by downloading new releases. Sideloaded updates must match this exact signing certificate to install without data loss.

---

## Testing Suite

FLOVA maintains a test harness across frontend, backend, and machine learning components:

```bash
# 1. Frontend Unit & Integration Tests (67 tests)
cd frontend
npm test

# 2. Category Label Mapping Regression Test (7 tests)
node --loader ./src/services/__tests__/mockLoader.mjs ./src/services/__tests__/categoryLabelRegression.test.ts

# 3. TypeScript Typecheck & Production Build
npm run build

# 4. Backend Payout Synchronization & Concurrency Suite (23 tests)
cd ../backend
node scripts/test-payout-sync.mjs

# 5. Edge Function Rate Limiting & RLS Suite (54 tests)
node scripts/test-rate-limit.mjs

# 6. Python STT & Engine Tests (36 tests)
cd ../ai-engine
PYTHONPATH=. .venv/bin/pytest tests/
```

**Total Active Test Coverage:** 187 automated checks passing with zero failures.

---

## Deployment

- **Production Web Application:** Deployed to Vercel at [myflova.vercel.app](https://myflova.vercel.app)
- **App Links AssetLinks:** Served at `https://myflova.vercel.app/.well-known/assetlinks.json`
- **Database:** Supabase Managed PostgreSQL in Mumbai (`ap-south-1`)
- **Serverless Compute:** Supabase Edge Functions in Deno runtime

For complete deployment procedures, consult the [Operations Guide](docs/DEPLOYMENT.md).

---

## Security

FLOVA enforces defense-in-depth principles:
- **Authentication:** OAuth 2.0 with OpenID Connect (OIDC) through Google Credential Manager and Supabase GoTrue.
- **Data Protection:** Strict PostgreSQL Row Level Security (RLS) on all user data.
- **Fail-Closed Rate Limiting:** Sliding-window rate limiters reject excessive unauthenticated or abusive AI requests with HTTP 429 before expensive LLM inference occurs.
- **Zero Exposed Secrets:** Service-role keys and signing keystores are strictly excluded from code repositories and client distribution bundles.

Report vulnerabilities responsibly to the repository maintainer. For full details, see [SECURITY.md](docs/SECURITY.md).

---

## Roadmap

### Implemented (v1.0.0)
- [x] Pure integer paise deterministic financial engine
- [x] Day-by-day 30-day forward cash runway simulation
- [x] Custodial cash isolation (`not_mine` / COD)
- [x] Multilingual voice transcription via Groq Whisper Large v3 Turbo
- [x] Smart capture OCR with receipt line items and UPI UTR de-duplication
- [x] Accounts receivable/payable with partial settlements
- [x] WISH 2.0 persistent micro-savings goals
- [x] Signed Android native APK distribution with Android App Links

### Planned
- [ ] On-device speech recognition via compressed WebAssembly / ONNX models
- [ ] Bank statement PDF reconciliation parser
- [ ] Direct UPI payment deep-linking
- [ ] Multi-device sync indicators with offline-first write queue

---

## Contributing

Contributions to FLOVA are welcome:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/new-capability`).
3. Commit your changes (`git commit -m 'feat: add support for regional date format'`).
4. Ensure all unit and integration tests pass (`npm test`, `pytest`).
5. Push to the branch (`git push origin feature/new-capability`).
6. Open a Pull Request against `dev`.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for complete details.

---

## Project Links

- **GitHub Repository:** [https://github.com/syed-imadulla/FLOVA](https://github.com/syed-imadulla/FLOVA)
- **Live Web Application:** [https://myflova.vercel.app](https://myflova.vercel.app)
- **GitHub Releases:** [https://github.com/syed-imadulla/FLOVA/releases](https://github.com/syed-imadulla/FLOVA/releases)
- **Latest Android APK:** [Download v1.0.0 APK](https://github.com/syed-imadulla/FLOVA/releases/download/v1.0.0/FLOVA-v1.0.0-android.apk)
