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

## 🚀 Development Workflow (One-Command Setup)

FLOVA provides a unified, reliable development workflow using GNU Make. Rather than opening separate terminals and manually launching frontend, backend, and speech services, you can manage the entire stack directly from the project root.

### 1. Prerequisites
- **GNU Make:** `make` (Installed by default on Linux/macOS. Ubuntu/Debian: `sudo apt install make`, macOS: `brew install make`)
- **Node.js:** Node.js 20+ and npm (`node --version`)
- **Python:** Python 3.10+ with `python3-venv` (`python3 --version`)
- **FFmpeg:** Audio transcoding for STT (`sudo apt install ffmpeg`)

### 2. Initial Installation
Install all dependencies across Frontend, Backend, and AI STT with a single command:
```bash
make install
```
This automatically:
- Installs frontend packages (`frontend/node_modules`)
- Sets up an isolated Python virtual environment at `ai-engine/.venv`
- Installs all IndicConformer STT requirements (`fastapi`, `uvicorn`, `onnxruntime`, `numpy`, `scipy`)
- Installs backend database test dependencies

### 3. One-Command Development Server (with Live Public Tunnel)
Start all required local development services concurrently:
```bash
make dev
```
This launches:
- **Frontend (React + Vite)** on `http://localhost:5173`
- **STT Microservice (FastAPI + IndicConformer)** on `http://localhost:8001`
- **Public HTTPS Tunnel Link** (e.g. `https://<unique-id>.trycloudflare.com`) for direct mobile PWA testing, external reviewers, or remote testing without port forwarding.
- **Database & Auth**: Connects to hosted Supabase automatically.

**Key Features of `make dev`:**
- **Instant Public Tunneling:** Automatically detects `cloudflared` (or `localtunnel`), connects a secure HTTPS tunnel to Vite, and displays the public link right in your terminal. (To run offline without a tunnel, use `make dev TUNNEL=0`).
- **Concurrent Logging:** Displays color-coded prefixes (`[frontend]`, `[stt]`, `[tunnel]`) for real-time log streaming.
- **Port Conflict Prevention:** Detects if port 5173 or 8001 is already held by another process before starting.
- **Clean Ctrl+C Shutdown:** Intercepts `SIGINT`/`SIGTERM` and terminates all child process groups cleanly, guaranteeing zero orphaned background processes or stuck ports.

To stop all services at any time, simply press **Ctrl+C** in the terminal.

---

### 4. Service Ports & URLs

| Service | Port | Local URL | Health Endpoint | Description |
|---|---|---|---|---|
| **Frontend PWA** | `5173` | [http://localhost:5173](http://localhost:5173) | — | React 18, Vite HMR development server |
| **STT Microservice** | `8001` | [http://localhost:8001](http://localhost:8001) | [http://localhost:8001/health](http://localhost:8001/health) | AI4Bharat IndicConformer inference API |
| **Public Tunnel** | Dynamic | `https://*.trycloudflare.com` | — | Cloudflare / localtunnel HTTPS public link |
| **Backend / Supabase**| Hosted | [Gateway URL](https://msjzkylvafuwlkkujxpv.supabase.co) | — | Hosted PostgreSQL + RLS + Edge Functions |
| **Local Supabase** | `54321`| [http://localhost:54321](http://localhost:54321) | — | Optional local database (if Supabase CLI configured) |

---

### 5. Individual Service & Utility Commands

If you need to control services independently:

```bash
# Start only the public HTTPS tunnel for the frontend
make tunnel

# Start only the React + Vite frontend
make frontend

# Start only the IndicConformer STT microservice
make stt

# Inspect status, active ports, and health of local services
make dev-status

# Stop any running processes currently occupying dev ports (5173/8001)
make stop

# Inspect backend status and run database schema RLS validation
make backend

# Start local Supabase instance (if local Supabase CLI is configured)
make supabase
```

---

### 6. Testing, Linting & Building

Run the complete test suite or individual tiers:

```bash
# Run ALL automated tests (Frontend + Backend + STT)
make test

# Run only frontend services & financial engine tests
make test-frontend

# Run only database schema, triggers & RLS tests
make test-backend

# Run only Python STT microservice & udaan engine tests
make test-stt

# Compile the production frontend bundle (tsc -b && vite build)
make build

# Run TypeScript type verification
make lint

# Clean temporary build and cache files (preserves weights & envs)
make clean

# Display interactive command help
make help
```

---

### 7. Troubleshooting

- **Port 5173 or 8001 Already in Use:**
  Run `make stop` to cleanly terminate any orphaned Vite or Uvicorn processes holding the ports. Alternatively, check status with `make dev-status`.
- **Python Virtual Environment Missing:**
  Run `make install-stt` to recreate `ai-engine/.venv` and reinstall requirements.
- **FFmpeg Missing on Linux:**
  Audio conversion for voice transactions requires `ffmpeg`. Install via `sudo apt install ffmpeg` on Ubuntu/Debian or `brew install ffmpeg` on macOS.

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
