# Changelog

All notable changes to the FLOVA platform are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
