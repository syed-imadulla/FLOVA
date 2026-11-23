# FLOVA

> **Every rupee has a story. FLOVA remembers.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)

FLOVA is a voice-first, adaptive financial management platform designed specifically for people with irregular and unpredictable earnings: gig delivery riders, cab drivers, auto drivers, tradespeople, small vendors, and freelance contractors across India.

Instead of imposing rigid monthly budgets that collapse when weekly earnings fluctuate, FLOVA continuously answers the single question that matters most to irregular earners: **"Will my available cash last until my next payout?"**

---

## Table of Contents

- [What is FLOVA?](#what-is-flova)
- [Core Features](#core-features)
- [How FLOVA Works](#how-flova-works)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Service URLs & Ports](#service-urls--ports)
- [Project Structure](#project-structure)
- [Environment Configuration](#environment-configuration)
- [AI & Financial Safety](#ai--financial-safety)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## What is FLOVA?

### The Irregular Income Challenge
Standard personal finance software assumes a fixed monthly salary deposited on a predictable date. For tens of millions of Indian gig partners and independent workers, income arrives in irregular pulses:
- Daily cash collections mixed with personal money.
- Weekly gig platform payouts subject to platform deductions.
- Fluctuating customer demand driven by weather, holidays, and seasonal cycles.

When earnings fluctuate between ₹2,500 one week and ₹8,000 the next, monthly budgeting apps provide false security or trigger premature panic.

### The FLOVA Approach
FLOVA changes the financial management paradigm from monthly categorization to **available cash runway**:
1. **Voice-First Input:** Log transactions on the go in 10 Indian languages.
2. **Deterministic Cash Engine:** Track actual personal cash in integer paise—never floating-point approximations.
3. **Custodial Money Isolation:** Keep third-party cash collections (e.g., Cash on Delivery) separate from personal spendable income.
4. **Adaptive Safety Buffer:** Maintain an emergency reserve dynamically sized to the worker's income volatility profile.
5. **Truthful Horizon Outlook:** Clearly display the exact calendar day when projected cash will drop below the safety buffer or into deficit.

---

## Core Features

| Feature | Description | Status |
|---|---|---|
| **Multilingual Voice Capture** | Transcribe spoken earnings and expenses in 10 Indic languages with dialect adaptation. | **Implemented** |
| **IndicConformer Primary STT** | Low-latency speech recognition running native AI4Bharat IndicConformer checkpoints. | **Implemented** |
| **Whisper Fallback STT** | Automated cloud failover to Groq Whisper if the local speech engine times out or encounters errors. | **Implemented** |
| **Smart Receipt OCR** | Extract line items, tax, and totals from camera photos of printed paper receipts. | **Implemented** |
| **UPI Screenshot Extraction** | Identify payment status (`COMPLETED`, `PENDING`, `FAILED`) and 12-digit UTR numbers from GPay, PhonePe, Paytm, and CRED screenshots. | **Implemented** |
| **Duplicate Payment Detection** | Prevent accidental double-entry using extracted UPI reference (UTR) matching. | **Implemented** |
| **Invoice Intelligence** | Track client receivables and vendor payables with partial settlement reconciliation. | **Implemented** |
| **Deterministic Paise Math** | Authoritative calculations run entirely in integer paise (`100 paise = ₹1.00`). No LLM arithmetic. | **Implemented** |
| **Custodial Money Isolation** | Third-party collections (`ownership: 'not_mine'`) are excluded from personal spendable balance. | **Implemented** |
| **Adaptive Safety Cushion** | Dynamic reserve buffer recommendations based on work profile and earnings variability. | **Implemented** |
| **30-Day Forward Runway** | Day-by-day cash projection highlighting first buffer shortfall and first deficit dates. | **Implemented** |
| **WISH 2.0 Micro-Goals** | Persistent goal savings that automatically absorb surplus earnings from high-revenue weeks. | **Implemented** |
| **One-Command Dev Makefile** | Single root command (`make dev`) orchestrating frontend, STT, and public HTTPS tunnel. | **Implemented** |
| **PWA Web Share Target** | Direct receipt and screenshot sharing from WhatsApp and gallery apps into FLOVA. | **Experimental** |
| **On-Device IndicConformer ONNX** | In-browser client-side model execution for offline speech transcription. | **Experimental** |
| **Bank Statement PDF Parser** | Automated statement analysis for multi-account balance reconciliation. | **Planned** |
| **Direct UPI Payment Intent** | One-tap settlement of pending invoices through native UPI deep-linking. | **Planned** |

---

## How FLOVA Works

FLOVA adheres to a strict **"AI Suggests, User Confirms"** operating model. Automated extraction never bypasses user oversight:

```
[User Input] (Voice, Receipt Photo, UPI Screenshot, or Manual Entry)
      │
      ▼
[AI Extraction Pipeline]
  • Speech: IndicConformer (Primary) ──(on timeout/error)──► Whisper (Fallback)
  • Vision: Groq Qwen 2.5 27B Vision
  • Intent: Groq Llama 3.3 70B Versatile
      │
      ▼
[Review Screen (/add)]
  • Candidate draft presented with extracted amount, category, and date
  • Uncertain or ambiguous attributes flagged with needsReview: true
  • Missing values remain null — system never invents financial figures
      │
      ▼
[Explicit User Confirmation]
  • User inspects and verifies attributes
  • Clicks "Confirm" to commit
      │
      ▼
[Deterministic Engine & Database]
  • Committed to PostgreSQL with Row Level Security (RLS)
  • Evaluated against ₹10,00,000 calendar-day safeguard limit
  • Available cash and 30-day runway projections update instantly
```

---

## System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 18 + Vite PWA)"]
        UI["UI Screens & Navigation"]
        VoiceInput["Voice Capture (10 Languages)"]
        SmartCapture["Smart Capture (Receipt / UPI)"]
        ReviewAdd["Review & Confirmation (/add)"]
        Engine["Deterministic Financial Engine (Paise Math)"]
        UI --> VoiceInput
        UI --> SmartCapture
        VoiceInput --> ReviewAdd
        SmartCapture --> ReviewAdd
        ReviewAdd --> Engine
    end

    subgraph Edge["Supabase Serverless Edge Runtime"]
        VoiceEdge["process-voice Edge Function"]
        VisionEdge["extract-receipt Edge Function"]
    end

    subgraph AIServices["Speech & Vision AI Layer"]
        IndicConformer["Primary STT: FastAPI IndicConformer (:8001)"]
        Whisper["Fallback STT: Groq Whisper Large v3"]
        QwenVision["Vision OCR: Groq Qwen 2.5 27B"]
        LlamaIntent["Intent Parser: Groq Llama 3.3 70B"]
    end

    subgraph Storage["PostgreSQL 15 (Supabase Hosted)"]
        DB[(Transactions, Invoices, Profiles, WISH)]
        RLS["Row Level Security Policies"]
        Triggers["₹10L Daily Limit & Payout Sync Triggers"]
        DB --- RLS
        DB --- Triggers
    end

    VoiceInput -- Audio Blob --> VoiceEdge
    VoiceEdge -- 1. Primary Request --> IndicConformer
    VoiceEdge -. 2. Failover on Error .-> Whisper
    VoiceEdge -- Transcript --> LlamaIntent
    LlamaIntent -- Candidate DTO --> ReviewAdd

    SmartCapture -- Image Payload --> VisionEdge
    VisionEdge -- Image Stream --> QwenVision
    QwenVision -- Parsed Receipt DTO --> ReviewAdd

    Engine -- Confirmed Transactions (JWT Auth) --> DB
```

---

## Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend PWA** | React 18, Vite 5.4, TypeScript 5.6, Tailwind CSS 3.4 | Mobile-first user interface with client-side routing and PWA support |
| **Financial Engine** | Pure TypeScript (`frontend/src/engine/`) | Integer paise arithmetic, balance calculations, runway simulations |
| **Edge Functions** | Deno, TypeScript, Supabase CLI | Serverless ingestion, CORS validation, model discovery |
| **Primary Speech** | AI4Bharat IndicConformer, FastAPI, ONNX Runtime, PyTorch | Native speech-to-text inference for Indian languages (`kn`, `hi`, `te`, `ta`, `ml`, `en`) |
| **Fallback Speech** | Groq Whisper Large v3 Turbo | High-speed cloud transcription fallback |
| **Vision & Intent** | Groq Qwen 2.5 27B Vision, Groq Llama 3.3 70B Versatile | Receipt line-item OCR and conversational intent extraction |
| **Database & Auth** | PostgreSQL 15, Supabase Auth, Row Level Security | Multi-tenant isolated storage, row locks, schema triggers |
| **Dev & Process Ops**| GNU Make, Python 3 dev-runner, Cloudflare Tunnel | One-command process orchestration with public HTTPS tunneling |
| **Testing** | Node.js Test Runner, Pytest, PGlite (WASM Postgres) | Unit, contract, isolation, and end-to-end test suites |

---

## Getting Started

### Prerequisites
- **GNU Make:** Pre-installed on Linux/macOS. (Ubuntu/Debian: `sudo apt install make`, macOS: `brew install make`)
- **Node.js:** Version 20 or higher with npm (`node --version`)
- **Python:** Version 3.10 or higher with `python3-venv` (`python3 --version`)
- **FFmpeg:** Required for audio transcoding (`sudo apt install ffmpeg` or `brew install ffmpeg`)

### 1. Clone the Repository
```bash
git clone https://github.com/syed-imadulla/FLOVA.git
cd FLOVA
```

### 2. Install All Dependencies
Install dependencies across Frontend, Backend, and the AI STT microservice in one step:
```bash
make install
```
This target:
- Installs frontend npm packages (`frontend/node_modules`).
- Initializes an isolated Python virtual environment at `ai-engine/.venv`.
- Installs STT requirements (`fastapi`, `uvicorn`, `onnxruntime`, `numpy`, `scipy`).
- Installs backend database test dependencies.

### 3. Configure Environment Variables
Create your local frontend environment file:
```bash
cp frontend/.env.example frontend/.env.local
```
Add your Supabase project credentials to `frontend/.env.local`:
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Start Development Services
Start all development services with a single command:
```bash
make dev
```
`make dev` concurrently launches:
- **Frontend (Vite):** `http://localhost:5173`
- **STT Microservice (FastAPI):** `http://localhost:8001`
- **Public HTTPS Tunnel:** Secure live URL (e.g., `https://<random>.trycloudflare.com`) for direct mobile PWA installation and remote testing.

To run locally without opening an external tunnel:
```bash
make dev TUNNEL=0
```

To stop all running services cleanly, press **Ctrl+C**.

---

## Development Workflow

The root `Makefile` provides verified targets for common development, testing, and maintenance tasks:

```bash
# Display interactive command summary
make help

# Start all development services with public HTTPS tunnel
make dev

# Start only the public HTTPS tunnel for the frontend
make tunnel

# Start only the React + Vite frontend server
make frontend

# Start only the IndicConformer STT FastAPI microservice
make stt

# Inspect status, active ports, and health of local services
make dev-status

# Stop any running processes currently occupying dev ports (5173 / 8001)
make stop

# Run database migration and Row Level Security validation tests
make backend

# Run ALL automated test suites (Frontend + Backend + AI)
make test

# Run only frontend services and financial engine tests
make test-frontend

# Run only database schema, triggers, and demo seeding tests
make test-backend

# Run only Python STT and udaan engine unit tests
make test-stt

# Run TypeScript type checking across the frontend
make lint

# Compile the production frontend bundle (tsc -b && vite build)
make build

# Remove temporary build artifacts and test caches
make clean
```

---

## Service URLs & Ports

| Service | Port | Local URL | Health Endpoint | Notes |
|---|---|---|---|---|
| **Frontend PWA** | `5173` | [http://localhost:5173](http://localhost:5173) | — | Vite HMR server |
| **STT Microservice** | `8001` | [http://localhost:8001](http://localhost:8001) | [http://localhost:8001/health](http://localhost:8001/health) | IndicConformer inference |
| **Public HTTPS Tunnel** | Dynamic | `https://*.trycloudflare.com` | — | Cloudflare / localtunnel link |
| **Backend / Supabase**| Hosted | Hosted API Gateway | — | Hosted PostgreSQL + RLS |
| **Local Supabase** | `54321`| [http://localhost:54321](http://localhost:54321) | — | Optional local database |

---

## Project Structure

```text
FLOVA/
├── Makefile                     # Root development workflows and automation
├── LICENSE                      # Open-source MIT License
├── README.md                    # Project documentation
├── CLAUDE.md                    # Engineering invariants and coding guidelines
├── scripts/
│   └── dev-runner.py            # Process supervisor with port checks & tunneling
├── docs/                        # In-depth architectural and technical guides
│   ├── ARCHITECTURE.md          # System philosophy and design contracts
│   ├── VOICE-STT.md             # IndicConformer and Whisper audio pipeline
│   ├── SMART-CAPTURE.md         # Receipt OCR and UPI screenshot parsing
│   ├── INVOICE-INTELLIGENCE.md  # Invoices, payables, and settlements
│   ├── FINANCIAL-ENGINE.md      # Integer paise arithmetic and invariants
│   ├── ADAPTIVE-BUFFER.md       # Safety buffer and runway formulas
│   ├── SECURITY.md              # Row Level Security and authentication
│   ├── DEPLOYMENT.md            # Production deployment instructions
│   ├── ENVIRONMENT.md           # Environment variables and secrets reference
│   └── TESTING.md               # Automated testing strategies
├── frontend/                    # Client PWA application
│   ├── public/                  # Static assets, PWA manifest, and icons
│   ├── src/
│   │   ├── engine/              # Deterministic financial calculations (paise)
│   │   ├── services/            # Client data services (voice, receipt, data)
│   │   ├── screens/             # UI screen components
│   │   ├── components/          # Shared interface components
│   │   └── lib/                 # Utilities (money formatting, Supabase client)
│   ├── package.json             # Frontend dependencies
│   └── vite.config.ts           # Vite build configuration
├── backend/                     # Database migrations and serverless functions
│   ├── supabase/
│   │   ├── functions/           # Deno Edge Functions (process-voice, extract-receipt)
│   │   └── migrations/          # Idempotent PostgreSQL schema migrations
│   └── scripts/                 # Demo seeding and isolation tests
└── ai-engine/                   # Python AI services
    ├── stt_service/             # FastAPI IndicConformer microservice
    ├── udaan_engine/            # Backtesting and self-salary reference engine
    ├── tests/                   # Pytest test suites
    └── pyproject.toml           # Python package metadata
```

---

## Environment Configuration

Configuration variables are organized into three distinct tiers:

### 1. Frontend Client Configuration (`frontend/.env.local`)
| Variable | Description | Required | Example Placeholder |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Supabase API gateway URL | **Yes** | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public client key protected by Row Level Security | **Yes** | `eyJhbGciOi...` |

*Security Rule: Never place private API keys or database service-role tokens in frontend `.env` files.*

### 2. Edge Function Secrets (Supabase Vault)
| Secret | Description | Required By | Example Placeholder |
|---|---|---|---|
| `GROQ_API_KEY` | API key for Whisper fallback, Qwen vision, and Llama 3.3 | `process-voice`, `extract-receipt` | `gsk_...` |
| `INDICCONFORMER_URL` | URL for the IndicConformer FastAPI `/transcribe` endpoint | `process-voice` | `http://localhost:8001/transcribe` |
| `INDICCONFORMER_KEY` | Pre-shared bearer token for internal STT authentication | `process-voice` | `your-secure-internal-token` |

### 3. IndicConformer Python Microservice (`ai-engine/.env`)
| Variable | Description | Required | Default |
|---|---|---|---|
| `FLOVA_STT_PORT` | Listening port for the STT service | No | `8001` |
| `FLOVA_STT_HOST` | Network interface binding | No | `0.0.0.0` |
| `FLOVA_STT_INTERNAL_KEY` | Expected pre-shared token in `X-FLOVA-STT-KEY` header | **Yes** | `flova-indicconformer-secure-token-2026` |
| `DEVICE` | Computation device (`cpu` or `cuda`) | No | `cpu` |

---

## AI & Financial Safety

FLOVA incorporates strict safeguards to ensure financial truthfulness and tenant security:

1. **Deterministic Calculations:** All financial balances, runway horizons, and daily limits are computed by deterministic TypeScript logic in integer paise (`100 paise = ₹1.00`). LLMs are strictly forbidden from performing financial arithmetic.
2. **AI Suggests, User Confirms:** Speech and vision models produce draft candidates. No transaction is committed to the database without explicit user confirmation in the `/add` screen.
3. **Truthful Uncertainty:** Ambiguous amounts or unclassified expenses remain `null` and trigger `needsReview: true`. The system never invents numbers.
4. **Custodial Money Segregation:** Cash on Delivery (COD) collections and third-party cash (`ownership: 'not_mine'`) are tracked in isolated buckets and never added to the user's spendable balance.
5. **Pending Income Segregation:** Expected gig platform payouts and unpaid invoices represent future receivables. They are never counted as available cash until confirmed as received.
6. **₹10 Lakh Safeguard Limits:** Maximum individual transaction (₹10,00,000) and calendar-day aggregate (₹10,00,000) limits are enforced by PostgreSQL triggers with profile row-level locks.
7. **Database Row Level Security:** Every table enforces tenant isolation via PostgreSQL RLS policies keyed to `auth.uid()`.

---

## Testing & Quality Assurance

FLOVA maintains comprehensive multi-tier test coverage:

```bash
# Run all test suites across the stack
make test
```

### Individual Test Suites
- **Frontend Services & Financial Engine:**
  ```bash
  make test-frontend
  ```
  Validates balance calculations, runway projections, safe buffer formulations, WISH persistence, and candidate stability.
- **Backend Schema, Triggers & RLS:**
  ```bash
  make test-backend
  ```
  Runs migrations against an embedded PostgreSQL instance (PGlite) and tests tenant isolation, payout synchronization, and ₹10 Lakh boundary constraints.
- **Python STT & Engine:**
  ```bash
  make test-stt
  ```
  Executes Pytest suites covering IndicConformer inference, audio normalization, and self-salary rule logic.

### Adding New Tests
- **Frontend / Engine Tests:** Add files matching `src/**/__tests__/*.test.ts` using the Node.js test runner.
- **Database Tests:** Add schema and isolation tests in `backend/scripts/`.
- **Python Tests:** Add test cases in `ai-engine/tests/` using Pytest.

---

## Deployment

FLOVA is structured for standard cloud and serverless hosting:

1. **Frontend PWA:** Static SPA deployed to Vercel, Netlify, or Cloudflare Pages.
   - Build command: `cd frontend && npm install && npm run build`
   - Output directory: `frontend/dist/`
   - Client routing: All paths rewrite to `/index.html` (configured in `frontend/vercel.json`).
2. **Serverless Edge Functions:** Deployed to Supabase Edge Runtime:
   ```bash
   npx supabase functions deploy process-voice --workdir backend
   npx supabase functions deploy extract-receipt --workdir backend
   ```
3. **IndicConformer STT Service:** Deployed via systemd service or container on a GPU/CPU host.
   - Example systemd service configuration is documented in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

For comprehensive operational and production deployment instructions, see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## Roadmap

### Completed Milestones
- [x] Multilingual voice transaction capture across 10 Indic languages.
- [x] AI4Bharat IndicConformer primary STT with automated Groq Whisper fallback.
- [x] Smart Capture for receipts and UPI screenshots with duplicate UTR protection.
- [x] Invoices, receivables, payables, and partial settlement tracking.
- [x] Deterministic integer paise financial engine with Ravi delivery benchmark validation.
- [x] Adaptive safety cushion and 30-day buffer shortfall detection.
- [x] WISH 2.0 persistent goal savings.
- [x] Unified root Makefile with process supervisor and live HTTPS tunneling.
- [x] Complete brand identity, favicon, and PWA icon integration.

### Planned Enhancements
- [ ] Bank statement PDF extraction and automated multi-account reconciliation.
- [ ] Direct UPI deep-linking for one-tap client invoice settlements.
- [ ] Multi-party expense splitting for shared commercial vehicle rentals.
- [ ] Offline-first local data synchronization with background queueing.
- [ ] Extended regional language model checkpoints for additional dialects.

---

## Contributing

Contributions to FLOVA are welcome. To contribute:

1. **Fork the Repository:** Create a personal fork on GitHub.
2. **Create a Feature Branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make Your Changes:** Follow existing conventions (TypeScript strict mode, integer paise math, conventional commits).
4. **Verify Tests & Builds:**
   ```bash
   make lint
   make test
   make build
   ```
5. **Submit a Pull Request:** Open a pull request against the `dev` branch with a clear description of your changes and test verification results.

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).

Copyright (c) 2026 Syed Imadulla

AI4Bharat IndicConformer models are developed by the AI4Bharat research team at IIT Madras and are governed by their respective research and open-source licenses.

---

## Acknowledgements

FLOVA is built using open-source tools, models, and platforms:
- **[AI4Bharat](https://ai4bharat.iitm.ac.in/):** Open-source speech technology and IndicConformer model checkpoints for Indian languages.
- **[Groq](https://groq.com/):** Low-latency Llama 3.3, Qwen 2.5 Vision, and Whisper inference.
- **[Supabase](https://supabase.com/):** PostgreSQL, Row Level Security, Auth, and Edge Functions.
- **[Vite](https://vitejs.dev/) & [React](https://react.dev/):** Frontend build tooling and component architecture.
- **[Tailwind CSS](https://tailwindcss.com/):** Utility-first responsive design.
