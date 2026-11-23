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

### 2.2: native behaviour (code done, device test pending)
See §5.

### 2.3–2.4: UX pass, icons/splash, signing, AAB
- Tap targets under 32 px noted in Phase 1 QA (info icon, "See all").
- App icon and splash from the existing FLOVA logo.
- Release signing key created and stored by the user outside the repo; signed AAB built and checked.

## 5. Phase 2.2: native behaviour (2026-11-23, local)

| Area | Change | Why |
|---|---|---|
| Voice | `RECORD_AUDIO` + `MODIFY_AUDIO_SETTINGS` in `AndroidManifest.xml` | The Android WebView has no Web Speech API, so `VoiceScreen` falls back to recording audio (`useAudioRecorder`) and `process-voice` transcribes it with **Groq Whisper**. Capacitor requests the runtime permission when the page calls `getUserMedia` |
| Voice (finding) | — | In Chrome on a phone, voice uses Chrome's built-in speech recognition (Google), and only text reaches `process-voice`. The user's phone test covered that path, not Groq Whisper audio. The Android app will be the first live test of the Whisper audio path |
| Receipt camera / gallery | No change; **no `CAMERA` permission** declared on purpose | `capture="environment"` opens the system camera through Capacitor's existing `FileProvider`; declaring `CAMERA` without requesting it at runtime would block that intent |
| Service worker | `registerServiceWorker` skips registration when `Capacitor.isNativePlatform()` | Assets ship inside the APK; a service worker could keep serving an old cache after an app update. The website keeps its PWA service worker |
| Backup | `allowBackup="false"`, `fullBackupContent="false"`, `dataExtractionRules` excluding all domains for cloud backup and device transfer | The signed-in session should not be copied to cloud backups or new devices; the user signs in again |
| Back button | `@capacitor/app` **8.1.2** + `src/native/AndroidBackButton.tsx` (rule in `src/native/backAction.ts`) | Back goes through in-app history; with no history it exits only on `/`, `/app`, `/login`, `/onboarding`, otherwise goes to `/app`. No effect on the web |
| Safe areas (edge-to-edge, targetSdk 36) | `--sat`/`--sab` CSS variables = Capacitor's `--safe-area-inset-*`, falling back to `env()`. Body padded by the status-bar height with a background strip behind the status bar; sticky screen header and landing navbar offset by `--sat`; bottom nav, page bottom padding and sheets use `--sab` | Android 15+ draws apps behind the system bars. On desktop browsers the values are 0 (no visual change); on notched iPhones `env()` now also keeps the header clear of the notch |

Tests: new `frontend/src/services/__tests__/nativeShell.test.ts` (7): back-button rules, `RECORD_AUDIO` present, no `CAMERA`, backup exclusions, package ID `in.flova.app` in Capacitor config and Gradle, `targetSdk 36`. `tsc` clean, build passes, `cap sync` lists `@capacitor/app@8.1.2`, `make test` passes.

**Not yet verified on a device** (needs Android Studio + a phone): microphone prompt and Whisper transcription, camera and gallery pickers, back button, status/navigation bar layout, and dark/light status-bar icon contrast.

Sources: [Capacitor SystemBars](https://capacitorjs.com/docs/apis/system-bars), [Capacitor edge-to-edge guide (Capawesome)](https://capawesome.io/blog/capacitor-edge-to-edge-and-safe-areas-guide/).
