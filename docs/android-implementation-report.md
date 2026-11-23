# FLOVA Android Implementation Report

**Last updated:** 2026-11-23 · Verified results only.

## 1. Decisions

| Item | Value | Notes |
|---|---|---|
| App name | FLOVA | |
| Package ID (`applicationId`) | **`in.flova.app`** | Chosen by the user. Permanent once published on Google Play. Uniqueness is only confirmed on the first Play upload. Valid in Java (`in` is a Kotlin keyword only; the generated code is Java) |
| Wrapper | Capacitor **8.6.2** (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli`, exact versions) | Keeps the existing React/Vite app; no rewrite |
| Web assets | `frontend/dist` (`webDir: 'dist'`) | Same build as Vercel |
| SDK levels | `minSdk 24` (Android 7.0+), `compileSdk 36`, `targetSdk 36` | Google Play requires API 36 for new apps and updates from 31 Aug 2026 |
| Version | `versionCode 1`, `versionName "1.0"` | `versionCode` must increase on every Play upload |

## 2. Phase 2.1: Capacitor integration (done, local)

- `frontend/capacitor.config.ts` created (`appId: 'in.flova.app'`, `appName: 'FLOVA'`, `webDir: 'dist'`).
- `npx cap add android` generated `frontend/android/` (53 tracked files, 3.2 MB). `MainActivity` is `in.flova.app.MainActivity` (Java).
- `npm run android:sync` builds the web app and copies it into the Android project (`cap sync android`). Verified: copied bundle is `index-BOhggNz-.js`, same as production.
- `.gitignore`: added `*.jks`, `*.keystore`, `keystore.properties`, `key.properties` so signing keys can never be committed (verified with a probe file). Copied web assets and build output are already ignored by Capacitor's templates.
- Checks: `npm run build` passes, `tsc` clean, `make test-frontend` passes.
- npm 12 warned that install scripts are blocked (`esbuild` postinstall); the build still passes because esbuild was already installed.

Not committed yet.

## 3. Toolchain on this machine

| Tool | Found | Needed |
|---|---|---|
| Node / npm | 24.22.1 / 12.2.2 | Node ≥ 22 for Capacitor 8 ✅ |
| Java | OpenJDK 25 (no `JAVA_HOME`) | JDK 21 for the Android build (Android Studio bundles it) |
| Android SDK / adb | Not installed | Required to build and install |
| Android Studio | Not installed | Otter 2025.2.1 or newer for Capacitor 8 |
| RAM / disk | 6 GB / 131 GB free | RAM is tight for Android Studio; close other apps while building |

## 4. Next steps

### 2.1 (remaining): build environment (user installs)
- Install Android Studio (Otter 2025.2.1+). It brings the Android SDK, platform tools (`adb`) and a JDK 21.
- Then: `cd frontend && npx cap open android` (or build with Gradle) to produce a debug APK and install it on the phone over USB with USB debugging on.

### 2.2: native behaviour (code work)
- Microphone: add `RECORD_AUDIO` (and `MODIFY_AUDIO_SETTINGS`) to `AndroidManifest.xml`; Capacitor's WebView requests the runtime permission when the page calls `getUserMedia`.
- Camera / gallery for receipts: check the `<input type="file">` capture path in the WebView; add `CAMERA` only if the capture intent needs it.
- Service worker: decide whether to skip PWA service-worker registration inside the native app so app updates are not served from a stale cache.
- Auth: email-confirmation links open `https://myflova.vercel.app` in the browser, not the app. Options: keep it (user signs in again in the app) or add Android App Links later.
- Android back button, status/navigation bar colours and safe areas, offline/error states.
- Review `android:allowBackup="true"` (currently on) for a finance app.

### 2.3–2.4: UX pass, icons/splash, signing, AAB
- Tap targets under 32 px noted in Phase 1 QA (info icon, "See all").
- App icon and splash from the existing FLOVA logo.
- Release signing key created and stored by the user outside the repo; signed AAB built and checked.
