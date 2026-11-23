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

### 2.1 (remaining): build environment (done, see §6)
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

## 6. First debug build and install (2026-11-23)

**Toolchain (user-installed):** Android Studio 2026.2.2.10 (snap, Snapcrafters), SDK platform `android-36` (+ `android-37.0`), Build-Tools 36.0.0/37.0.0 (Gradle also installed 35.0.0 automatically), Platform-Tools, Command-line Tools, OpenJDK **21.0.13** (`apt`). System Java and Android Studio's bundled JBR are JDK 25, which Gradle 8.14.3 cannot run on, so builds use `JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64`. `frontend/android/local.properties` (`sdk.dir`) is git-ignored.

**Build:** `npm run android:sync` then `./gradlew assembleDebug` → BUILD SUCCESSFUL in 3m 18s; `app-debug.apk` 6.1 MB. `aapt2 dump badging`: package `in.flova.app`, versionCode 1 / versionName 1.0, compileSdk 36, targetSdk 36; permissions `INTERNET`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` (no `CAMERA`).

**Device:** Redmi 12 5G (`23076RN4BI`), Android 15, Android System WebView 157. First `adb install` failed with `INSTALL_FAILED_USER_RESTRICTED` (Xiaomi blocks USB installs until **Developer options → Install via USB** is on); after enabling it: `Success`.

**Launch:** app process starts, no `FATAL`/`AndroidRuntime` errors in logcat, opens on `/login` (fresh install, no restored session). Screenshot: the FLOVA header sits below the status bar (safe-area offset works).

Observed: the phone was in landscape with the keyboard covering most of the screen; FLOVA is designed for portrait. Candidate change: lock the activity to portrait.

Pending manual tests on the phone: sign in, voice (microphone prompt → recording → Groq Whisper), receipt camera and gallery, Android back button, bottom navigation clear of the gesture bar, refresh and offline.

## 7. Device feedback fixes (2026-11-23)

User test on the Redmi 12 5G found two problems and asked for FLOVA branding.

| Issue | Root cause | Fix |
|---|---|---|
| "Take photo" opened the gallery | Capacitor opens the camera only when the file input's `accept` contains `image/*` (`BridgeWebChromeClient.java:283`); FLOVA listed specific types | Camera input in `CatchScreen.tsx` uses `accept="image/*"` + `capture="environment"`; gallery input unchanged; `imageOptimizer` still rejects unsupported formats |
| Bottom navigation rode up on top of the keyboard | Android resizes the window for the keyboard; the nav is fixed to the window bottom | `src/native/keyboard.ts` detects the keyboard (visible height > 150 px below the tallest height at that width); `AppLayout` hides the nav and drops its bottom padding while the keyboard is open. Works in the app and phone browsers |
| Capacitor default icon/splash | Generated defaults | FLOVA mark extracted from `public/app-icon-1024.png` (white tile and shadow removed, anti-aliased edges kept) into `frontend/assets/`. All launcher icons regenerated with Python/PIL at the existing sizes: adaptive foreground (108dp, mark ~56dp inside the 66dp safe zone) on white, legacy square and round icons, and all 11 splash PNGs (mark on `#F6F7F4`). Android 12+ splash theme: `windowSplashScreenBackground` `#F6F7F4`, `windowSplashScreenAnimatedIcon` = FLOVA foreground, `postSplashScreenTheme` |

`@capacitor/assets` was not used: running it via `npx` was blocked by the session's safety check, so the same standard files were generated locally without new packages.

Tests: `nativeShell.test.ts` now 10 (adds keyboard threshold, camera `accept="image/*"`, splash/icon config). `tsc` clean, `make test-frontend` passes, debug APK rebuilt (6.6 MB), installed (`Success`), launches without errors in portrait.

Pending user check: camera opens on "Take photo", nav hidden while typing, FLOVA icon on the home screen and splash on launch.

Observation: the app starts on the marketing landing page (the site's `/`). Candidate change: in the native app, start at `/login` (signed out) or `/app` (signed in).

## 8. Logo sharpness, app entry and Install app (2026-11-23)

**Logo sharpness.** No vector logo exists (both SVGs wrap a 512 px PNG), so `public/app-icon-1024.png` stays the source. The Android 12+ splash icon was pointing at the launcher foreground (max 432 px) while Android draws it at ~240dp (~660 px on the Redmi), so it was upscaled ~1.5× and looked soft. Fix: dedicated `drawable-*/splash_icon.png` at 288dp (288–1152 px), always downscaled from the full-resolution mark; `windowSplashScreenAnimatedIcon` now uses it. All launcher icons and splash PNGs regenerated from the full-resolution mark with a light unsharp mask (colour only, alpha edge kept smooth).

**Landing page is website-only.** `src/native/platform.ts` (`IS_NATIVE_APP`, `APP_START_PATH = "/login"`). In the Android app `/` redirects to `/login`, and `RedirectIfAuthed` sends signed-in users to `/app`; the website still shows the landing page at `/`. "← Return to FLOVA Home" is hidden on login/signup inside the app. Sign out already goes to `/login`. Device check: a cold start of the rebuilt APK opened directly on Home (signed-in session), no errors.

**Install app on the website.** `src/pwa/installPrompt.ts` captures `beforeinstallprompt` at startup (`initInstallPrompt()` in `main.tsx`) and exposes the state. New landing section `FlovaInstallApp` (`#install`): Chrome/Edge/Android show an **Install FLOVA** button (native install dialog); iPhone shows Safari Share → Add to Home Screen steps; other browsers show menu steps; installed shows "Open FLOVA". Google Play link appears when `VITE_PLAY_STORE_URL` is set, otherwise "Android app on Google Play: coming soon". Navbar gets an "Install app" link (desktop pill now from `lg`, one line; menu below `lg`); the bottom CTA's "Installable as Fast PWA" became a link to `#install`.

**PWA manifest.** `start_url` and `id` → `/app` (installed web app opens the app, not the landing page); `scope` `/`; new full-bleed `icon-maskable-192/512.png` replace the rounded-tile maskable icons. Service worker cache bumped to `flova-shell-v4` and precaches the new icons, so existing visitors get the new manifest.

Tests: new `appEntryInstall.test.ts` (5): install state logic, iOS detection, native `/` redirect and hidden home links, manifest `start_url`/maskable icons/share target, landing install section and startup capture. `tsc` clean, `make test-frontend` passes, local preview shows the section and a one-line navbar at 1280 px and the menu at 760 px with no console errors. APK rebuilt and installed.

## 9. Portrait-Only Orientation Lock (2026-11-23)

- **Requirement:** Enforce strict vertical (portrait) orientation across the entire application, ignoring system auto-rotate on the device.
- **Manifest Configuration:** Added `android:screenOrientation="portrait"` to `.MainActivity` in `frontend/android/app/src/main/AndroidManifest.xml`.
- **Capacitor Interaction:** `MainActivity.java` extends `BridgeActivity` without calling `setRequestedOrientation()`. The Android OS Activity Manager locks the activity to portrait before view creation.
- **Automated Test:** Added test 11 to `frontend/src/services/__tests__/nativeShell.test.ts` verifying that `android:screenOrientation="portrait"` is declared in the manifest. All 11 tests pass.
- **Binary Verification:** Rebuilt debug APK (`./gradlew assembleDebug`). Binary manifest inspected via `aapt2 dump badging` (confirms `android.hardware.screen.portrait`) and `aapt2 dump xmltree` (confirms `android:screenOrientation(0x0101001e)=1`).
- **Platform Limitations:** On all smartphones (including Redmi 12 5G), portrait lock is strictly enforced. On large-screen tablets or foldables (Android 12L+), system-level letterboxing may apply if the OS allows users to override app-requested orientation.
- **Device Update:** Installed on Redmi 12 5G via `adb install -r` on 2026-11-23 21:16:24 IST. App launched in portrait mode.

## 10. Physical Hardware Device Verification (2026-11-23)

All five physical hardware tests were executed by the user on the Xiaomi Redmi 12 5G (`23076RN4BI`, Android 15, System WebView 157) and confirmed passing:

| Test Case | Interaction on Redmi 12 5G | Result |
|---|---|---|
| **1. Portrait Orientation Lock** | Enabled system auto-rotate in quick settings; rotated phone 90° and 180° into landscape. | **USER-CONFIRMED PASS** (App remained strictly in vertical portrait orientation; zero UI glitch or restart). |
| **2. Voice Recording & Groq Whisper** | Tapped microphone button; spoke phrase in Hinglish; verified audio encoding and upload. | **USER-CONFIRMED PASS** (Microphone permission granted; Groq Whisper generated candidate review card). |
| **3. Native Camera Receipt Capture** | Tapped "Take photo" on Catch screen. | **USER-CONFIRMED PASS** (System camera intent opened directly via FileProvider; photo captured; OCR extracted items). |
| **4. Virtual Keyboard Avoidance** | Tapped into rupee/text amount inputs on transaction screens. | **USER-CONFIRMED PASS** (Bottom navigation bar hidden cleanly while keyboard was open; no overlap). |
| **5. Android Hardware Back Button** | Triggered gesture/button back from inner screens (Invoices, Catch, Runway). | **USER-CONFIRMED PASS** (Navigated back through screen history; exited app cleanly only from top-level screens). |
