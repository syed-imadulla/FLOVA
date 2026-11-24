# FLOVA Phase 3.1: Google Play Launch-Readiness Audit Report

**Date:** 2026-11-23  
**Application:** FLOVA (`in.flova.app`)  
**Repository:** https://github.com/syed-imadulla/FLOVA  
**Web Production:** https://myflova.vercel.app  
**Auditor Roles:** Senior Android Engineer, DevOps Release Engineer, Database Security Reviewer, Google Play Compliance Officer  

---

## 1. Executive Summary

FLOVA has completed all foundational Phase 1 (Production Infrastructure & Security) and Phase 2 (Native Android Core Verification, Portrait Lock, Offline Fallbacks, Native Camera OCR, and Google Sign-In) engineering milestones.

However, as of **Phase 3.1 initiation**, the application **cannot yet be submitted to Google Play** due to several critical policy and packaging gates. Under Google Play's 2024–2026 Developer Program Policies:
1. Applications handling financial records and voice recording **must provide an active, public Privacy Policy URL** disclosing all third-party AI data pipelines (Groq).
2. Apps supporting user registration **must offer both an in-app Account Deletion option and an external web request URL**.
3. A **Signed Android App Bundle (`.aab`)** must be compiled using an official release keystore (not the debug keystore).
4. For personal developer accounts created after November 2023, Google mandates a **12-tester, 14-day closed testing track** before production track access can be unlocked (see official Google documentation: https://support.google.com/googleplay/android-developer/answer/14151465).

---

## 2. Launch Readiness Inventory & Classification

Every requirement is audited and classified into three strict categories:
- **READY**: Fully implemented, verified, and complies with Google Play requirements.
- **NEEDS WORK**: Exists in part or needs asset production/minor code addition.
- **BLOCKED**: Release blocker under Google Play policy or requires explicit user approval/external credentials.

| Area | Item | Status | Technical Reality & Verification Findings |
| :--- | :--- | :---: | :--- |
| **Identity & SDK** | Package ID | **READY** | Confirmed `in.flova.app` across `build.gradle`, `AndroidManifest.xml`, Capacitor configs, and OS intent filters. |
| **Identity & SDK** | `minSdkVersion` | **READY** | `minSdkVersion 24` (Android 7.0+), covering 95%+ of active Indian Android smartphones. |
| **Identity & SDK** | `targetSdkVersion` | **READY** | `targetSdkVersion 36` (Android 15+ / 16 preview), fully exceeding Google Play's API 34+ requirement for 2025/2026. |
| **Identity & SDK** | Versioning | **NEEDS WORK** | Currently `versionCode 1`, `versionName "1.0"`. Must be coordinated with release tracks. |
| **Build & Packaging** | Release Signing | **BLOCKED** | Explicit user restriction active. Keystore `flova-release-key.jks` and `key.properties` must be generated once approved. |
| **Build & Packaging** | Release Artifact | **BLOCKED** | Google Play rejects `.apk` uploads for new apps; requires signed `.aab` compiled via `./gradlew bundleRelease`. |
| **Build & Packaging** | Proguard / R8 | **NEEDS WORK** | `minifyEnabled false` in `buildTypes.release`. Recommended to enable basic shrinking or verify rule suppression. |
| **Android Manifest** | Permissions | **READY** | Minimal footprint: `INTERNET`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`. No undeclared background permissions. System camera accessed cleanly via `FileProvider` without `android.permission.CAMERA`. |
| **Android Manifest** | Orientation Lock | **READY** | `android:screenOrientation="portrait"` verified on physical Redmi 12 5G; survives landscape rotation. |
| **Visual Assets** | App Launcher Icons | **READY** | Adaptive icons present in all mipmap densities (`mdpi` to `xxxhdpi`, `anydpi-v26` foreground/background). Hi-res 1024x1024 PNG exists at `frontend/public/app-icon-1024.png`. |
| **Visual Assets** | Splash Screen | **READY** | Native Android 12+ `androidx.core.splashscreen` properly wired (`@style/AppTheme.NoActionBarLaunch`). |
| **Store Listing** | Feature Graphic | **NEEDS WORK** | Google Play mandatory 1024x500 banner does not exist yet. |
| **Store Listing** | Phone Screenshots | **NEEDS WORK** | Minimum 2 required (16:9 or 9:16 aspect ratio). Need high-resolution device frames from Redmi 12 5G. |
| **Store Listing** | App Copy / Metadata | **NEEDS WORK** | Need Title (≤30 chars), Short Description (≤80 chars), Full Description (≤4000 chars) tailored to gig partners. |
| **Policy & Compliance** | Public Privacy Policy | **CRITICAL BLOCKER** | No `/privacy` URL exists. Google Play immediately flags apps with audio recording without this disclosure. |
| **Policy & Compliance** | Account Deletion Mechanism | **CRITICAL BLOCKER** | Google Play User Data Policy mandates both in-app account deletion and an external web URL to delete user data. Currently no `deleteUser` route or function exists. |
| **Policy & Compliance** | Data Safety Section | **NEEDS WORK** | Must declare data collection: Financial Info (income, expense, balance), Audio (voice notes sent to Groq Whisper), Device IDs. |
| **Testing Track** | 12-Tester Gate | **BLOCKED** | Google Play Console requirement for personal developer accounts: 12 continuously opted-in testers for 14 continuous days. |
| **Distribution** | Web APK Download | **READY** | Direct download live at `https://myflova.vercel.app/download/flova-latest.apk` (~20 MB) with proper MIME headers. |

---

## 3. Critical Blockers & Policy Vulnerabilities

### Blocker 1: Missing Public Privacy Policy (Mandatory Google Play Rejection)
- **Policy Violation:** Google Play Developer Policy &rarr; User Data & Privacy.
- **Why it Blocks:** FLOVA requests `RECORD_AUDIO` and processes financial transactions. Google Play algorithms auto-flag any submission missing a privacy policy URL.
- **Action Required:**
  1. Author a dedicated, plain-English Privacy Policy addressing:
     - Voice recordings processed ephemerally via Groq Whisper with zero data training retention.
     - Financial check-in and transaction isolation enforced via Supabase Postgres Row-Level Security.
     - Third-party sub-processors: Supabase (database & edge runtime), Groq Inc. (audio transcription).
  2. Create `frontend/src/pages/PrivacyPolicyPage.tsx` and host it at `https://myflova.vercel.app/privacy`.
  3. Link this URL inside the Google Play Console "App Content &rarr; Privacy Policy" section.

### Blocker 2: Missing Account & Data Deletion Mechanism (Mandatory Google Play Rejection)
- **Policy Violation:** Google Play User Data Policy &rarr; Account Deletion Requirement (Effective Dec 2023).
- **Why it Blocks:** Apps that allow account creation (email or Google OAuth) **must** allow users to request deletion of their account and associated data:
  - Both **in-app** (under Profile / Settings).
  - And via an **external web link** (accessible without reinstalling the app).
- **Action Required:**
  1. Create a Supabase Edge Function `delete-account` (or database RPC) running as `SECURITY DEFINER` to purge the authenticated user's row from `auth.users`, cascading deletions to `profiles`, `transactions`, `balance_checkins`, `payouts`, `commitments`, and `wish_goals`.
  2. Add a red "Delete Account & Purge Data" button with confirmation modal inside [ProfileScreen.tsx](file:///home/syed-imadulla/Desktop/FLOVA/frontend/src/screens/ProfileScreen.tsx).
  3. Publish an external deletion request form at `https://myflova.vercel.app/delete-account`.

### Blocker 3: Absence of Release Keystore & `.aab` Bundle
- **Status:** Under user boundary restriction.
- **Action Required:**
  1. User approves release keystore generation outside git (`~/flova-release-key.jks`).
  2. Configure `signingConfigs.release` in `frontend/android/app/build.gradle` reading passwords from git-ignored `frontend/android/key.properties`.
  3. Compile signed App Bundle via `./gradlew bundleRelease`.

---

## 4. Google Play Data Safety Matrix (Self-Declaration Ready)

Google Play Console requires answering an extensive Data Safety questionnaire. Based on FLOVA's architecture, here are the audited answers:

| Data Type | Collected? | Shared? | Handled Ephemerally? | Purpose |
| :--- | :---: | :---: | :---: | :--- |
| **Financial Info** (User payment records, expenses, income) | **Yes** | **No** | No (Stored in Postgres) | App functionality (runway calculation). Protected by RLS. |
| **Audio Recordings** (Microphone voice notes) | **Yes** | **Yes** (Shared with Groq for STT) | **Yes** (Ephemeral; immediately discarded after transcription) | App functionality (voice transaction logging). Never retained or used for AI training. |
| **Personal Info** (Name, Email address) | **Yes** | **No** | No (Supabase Auth) | Account management and authentication. |
| **Device Identifiers** | **No** | **No** | N/A | FLOVA does not collect IMEI, advertising ID, or hardware serials. |
| **Location Data** | **No** | **No** | N/A | No GPS or coarse location permissions declared. |

---

## 5. Recommended Execution Roadmap

Follow this exact staged sequence to reach Google Play submission:

```
[Phase 3.1: Audit Complete]
            │
            ▼
[Phase 3.2: Legal & Policy Compliance]
  ├── Create Privacy Policy Page (/privacy)
  ├── Create Account Deletion Edge Function & UI (/delete-account)
  └── Link Privacy Policy in App Footer and Settings
            │
            ▼
[Phase 3.3: Play Store Creative & Copy Assets]
  ├── Capture 4-6 high-res device screenshots from Redmi 12 5G (9:16)
  ├── Create 1024x500 Feature Graphic banner
  └── Finalize App Title, Short Description, and Full Description
            │
            ▼
[Phase 3.4: Release Keystore & Signed AAB Build]
  ├── Obtain user authorization to generate flova-release-key.jks
  ├── Configure signingConfigs.release in build.gradle & key.properties
  └── Build and verify signed app-release.aab with bundletool/aapt2
            │
            ▼
[Phase 3.5: Google Play Console Track Setup & Closed Testing]
  ├── Create App in Google Play Console (in.flova.app)
  ├── Complete Store Listing, Privacy Policy URL, and Data Safety Questionnaire
  ├── Upload AAB to Closed Testing Track
  └── Recruit 20 testers for mandatory 14-day testing period
```

---

## 6. Files Involved in Upcoming Phases

- **Privacy Policy:** `frontend/src/pages/PrivacyPolicyPage.tsx`, `frontend/src/App.tsx`, `frontend/src/components/landing/FlovaFooter.tsx`
- **Account Deletion:** `backend/supabase/functions/delete-account/index.ts`, `frontend/src/screens/ProfileScreen.tsx`, `frontend/src/pages/DeleteAccountPage.tsx`
- **Release Signing:** `frontend/android/app/build.gradle`, `frontend/android/key.properties` (git-ignored)
- **Store Listing Assets:** `docs/store-listing/` (copy, graphics, screenshot manifests)

---

## 7. Current Project Status & Boundaries Preserved

- **Phase 1 (Production Infrastructure):** 100.0% Verified.
- **Phase 2 (Android Native Application):** 100.0% Verified (Google OAuth & direct APK distribution complete).
- **Phase 3 (Google Play Store Release):** Audit phase complete. **Zero keystores, signing configs, AABs, deployments, or Git commits were executed.**
