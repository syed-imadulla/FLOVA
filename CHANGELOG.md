# Changelog

All notable changes to the FLOVA platform are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-11-24

### Added
- **Native Android Home-Screen Widgets**:
  - **Compact Microphone Widget (2×2)**: Dark green rounded widget with dedicated 68dp microphone button, FLOVA branding, and subtitle deep-linking directly to voice transaction capture with one-shot recording (`in.flova.app://voice?autoRecord=true`).
  - **Extended Quick-Actions Widget (2×2 Default & 4×2 Resizable)**: Four distinct shortcut tiles arranged in a balanced 2-column × 2-row grid (Row 1: Voice | Add, Row 2: Receipt | History) deep-linking to core workflows (`/voice?autoRecord=true`, `/add`, `/catch`, `/activity`).
  - **Responsive Launcher Resizing**: Full support for launcher resizing from 2×2 to 4×2 using Android 12+ responsive `RemoteViews(Map<SizeF, RemoteViews>)` and options changed callbacks, expanding tile horizontal touch targets to 414px while strictly preserving the 2-row × 2-column muscle memory layout.
- **Android ACTION_SEND Share Ingestion**:
  - Registered intent filters for `text/plain` and `image/*` enabling direct user sharing of payment confirmations and receipt screenshots from external UPI applications (Google Pay, PhonePe, Paytm, BHIM).
  - Background stream copying off Android's main thread with strict 15MB file size boundary enforcement while transient URI permissions remain valid.
- **App-Private Durable Share Store**:
  - Cryptographically secure one-time tokens (`UUID.randomUUID()`) storing share payloads in app-private native internal storage (`shared_payloads/`).
  - 15-minute absolute payload TTL with automatic proactive directory pruning on every access.
  - Concurrency-safe atomic claim lease protocol (30-second lease with 20-second heartbeat renewal) and recoverable native claim tracking surviving Android process death and WebView recreation.
  - Zero permanent storage of payment text, amounts, or merchant metadata; atomic payload cleanup immediately upon consumption acknowledgment or expiration.
- **Frontend Catch & Voice Integration**:
  - Auto-record one-shot execution guard in `VoiceScreen` preventing infinite recording loops or duplicate triggers upon component remount.
  - Native share plugin bridge with `Capacitor.convertFileSrc()` for secure WebView image rendering without exposing raw private file paths to browser contexts.
  - Explicit candidate confirmation gate guaranteeing zero transaction rows are created without user review.

## [1.0.0] - 2026-11-24

### Added
- **Native Android Release**: Production signed APK (`in.flova.app`, versionCode `1`, versionName `1.0.0`) signed with a permanent RSA 4096-bit release keystore.
- **Android App Links**: Verified Digital Asset Links (`/.well-known/assetlinks.json`) deployed to `https://myflova.vercel.app` enabling direct, verified URL deep-link routing.
- **Native Google Sign-In**: Integrated Android Credential Manager (`androidx.credentials`) via `@capgo/capacitor-social-login` with cryptographic SHA-256 raw nonce replay protection and Supabase native automatic account linking.
- **Voice Intelligence (STT & NLP)**: Natural voice transaction entry supporting Hindi, Kannada, Tamil, Telugu, Malayalam, and English via Groq Whisper (`whisper-large-v3-turbo`) and structured Llama 3.3 extraction pipeline.
- **Smart Capture & OCR**: Paper receipt scanning and UPI screenshot intelligence with arithmetic line-item reconciliation, automatic 12-digit UTR de-duplication, and client-side image optimization.
- **Invoice & Payout Management**: Accounts receivable and payable tracking with partial settlements, contract lifecycle status (`unpaid`, `partially_paid`, `paid`, `overdue`), and database-enforced compound foreign key isolation.
- **Deterministic Financial Engine**: Pure integer paise math (`100 paise = ₹1.00`) with zero floating-point drift across all cash runway, balance check-in, and budget projections.
- **Custodial Cash Isolation**: Dedicated `not_mine` ownership tagging for third-party cash (e.g. Cash on Delivery / COD) ensuring custodial funds never inflate spendable personal runway.
- **Adaptive Safety Buffer**: Dynamic 3-to-21 day emergency buffer sized to worker profile (freelancer, gig delivery partner, driver, daily earner).
- **WISH 2.0 Savings Goals**: Persistent database-backed micro-savings goals absorbing surplus income during high-earning cycles.
- **Database Hardening & Concurrency Safety**: Row Level Security (RLS) across all public tables, atomic `FOR UPDATE` payout synchronization, and fail-closed rate-limiting buckets.

### Changed
- Refactored category label resolution to ensure context-aware display (e.g. "other" expenses labeled as "Other expense" rather than "Other income").
- Minified and optimized Android release bundle with R8 shrinking and ProGuard rules.
- Upgraded Capacitor Android target SDK to API 36 with portrait orientation lock.

### Security
- Excluded release keystores, signing properties, and database dumps from version control.
- Hardened Edge Functions with authenticated JWT enforcement and per-user sliding-window rate limits.
- Audited zero hardcoded secrets or service-role keys in frontend and Android distribution bundles.
