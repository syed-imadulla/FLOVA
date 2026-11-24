# FLOVA: Continuous Integration & Automated Security Pipeline (SEC-11)

## 1. Overview

FLOVA's CI pipeline ([.github/workflows/ci.yml](file:///home/syed-imadulla/Desktop/FLOVA/.github/workflows/ci.yml)) provides automated regression and security validation on every `push` and `pull_request` targeting `main` and `dev`.

The workflow is architected following the **Principle of Least Privilege**:
- Enforces read-only permissions (`permissions: contents: read`).
- Action dependencies are pinned to immutable commit SHAs with semantic version comments.
- **Zero Secret Dependency**: No production Supabase service-role keys or Groq API keys are required to run tests or build bundles; in-memory PGlite WASM, mock loaders, and placeholder environment variables ensure fully hermetic execution.

---

## 2. Automated Jobs & Security Checks

| Job Identifier | Display Name | Automated Checks |
|---|---|---|
| `security-audit` | Security Scans & Dependency Audits | • [scripts/ci-security-scan.mjs](file:///home/syed-imadulla/Desktop/FLOVA/scripts/ci-security-scan.mjs) (secret scanning on all tracked files)<br>• Lockfile integrity check (`frontend`, `backend`, `deno.lock`)<br>• Frontend npm audit (`npm audit --audit-level=high`)<br>• Backend npm audit (`npm audit --audit-level=high`)<br>• Python package audit (`pip-audit`) |
| `database-rls` | Database Migrations & RLS Isolation | • Executes all 11 database migrations on PGlite WASM<br>• Validates 121 RLS, trigger, and constraint assertions (`npm run test:db`)<br>• Validates atomic Edge Function rate-limiting SQL (`npm run test:rate-limit`) |
| `edge-functions` | Edge Functions Deno & TypeScript | • TypeScript compilation check for Deno Edge Functions<br>• Executes Deno test suite for rate limiting, payload bounding, and stream limits (`npm run test:deno`) |
| `frontend` | Frontend TypeScript, Unit Tests & Build | • Runs services, intent, runway, WISH, and password reset unit tests (`make test-frontend`)<br>• Compiles production web bundle (`tsc -b && vite build`) with zero type errors |
| `python-stt` | Python STT & Udaan Engine | • Executes Python pytest test suite for IndicConformer STT service and Udaan engine (`pytest ai-engine/tests`) |
| `android-build` | Android Debug & Unsigned Release Builds | • Syncs Capacitor Android assets<br>• Compiles Android debug APK (`assembleDebug`)<br>• Compiles Android unsigned release APK with R8 tree-shaking and resource shrinking (`assembleRelease`) |

---

## 3. Recommended GitHub Repository Settings

To maximize branch integrity in GitHub:

1. **Branch Protection Rules (`main` and `dev`):**
   - Enable **Require status checks to pass before merging**.
   - Select all 6 CI jobs as required status checks:
     - `Security Scans & Dependency Audits`
     - `Database Migrations & RLS Isolation`
     - `Edge Functions Deno & TypeScript`
     - `Frontend TypeScript, Unit Tests & Build`
     - `Python STT & Udaan Engine`
     - `Android Debug & Unsigned Release Builds`
   - Enable **Require branches to be up to date before merging**.
2. **Repository Security Features:**
   - Navigate to **Settings** -> **Code security and analysis**:
     - Enable **Dependency graph**
     - Enable **Dependabot alerts** and **Dependabot security updates**
     - Enable **Secret scanning** and **Push protection** (blocks accidental commits of tokens)
