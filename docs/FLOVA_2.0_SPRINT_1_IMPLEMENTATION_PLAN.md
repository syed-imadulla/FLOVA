# FLOVA 2.0 — Sprint 1 Implementation Plan
## Native Android Home-Screen Widgets & UPI Share Integration

**Sprint:** Sprint 1  
**Target Release:** FLOVA v2.0.0-alpha1  
**Date:** 2026-11-24  
**Author:** Technical Architect & Lead Engineer  
**Status:** IMPLEMENTATION PLANNING & READINESS (Pending Explicit User Approval)  
**Primary Test Device:** Xiaomi Redmi 12 5G (Android 15, Xiaomi HyperOS 2.0 / MIUI launcher)  
**Target Branch:** `dev` (Base: `v1.0.0`, commit `09999df`)  
**Android SDK:** `minSdkVersion = 24`, `compileSdkVersion = 36`, `targetSdkVersion = 36`  

---

## 1. Architectural Boundaries & Non-Negotiable Invariants

Sprint 1 delivers two independent native Android capabilities that bridge Android OS interactions into FLOVA without modifying or rewriting existing v1.0.0 features:

1. **Feature A: Native Android Home-Screen Widgets:**
   - **Widget 1: Compact Microphone Widget (1:2 vertical aspect ratio):** High-impact single-action launcher focused on instant voice transaction capture.
   - **Widget 2: Extended Quick-Actions Widget (2:2 square aspect ratio):** 2x2 grid offering immediate shortcuts to Voice (`/voice?autoRecord=true`), Add Transaction (`/add`), Receipt Scan (`/catch`), and History (`/activity`).
2. **Feature B: Native Android UPI Payment Share Target:**
   - Interception of UPI confirmation SMS/text and payment receipt screenshots explicitly shared by the user from Google Pay, PhonePe, Paytm, and BHIM via standard Android `ACTION_SEND`.
   - **Privacy Boundary:** FLOVA **only** processes content explicitly shared by the user via the system share sheet. FLOVA **does not** intercept background SMS, does not use Accessibility APIs, and does not automatically monitor bank accounts or UPI transactions.
   - Durable, app-private persistent payload bridge implementing an **authoritative native claim store with heartbeat lease renewal and atomic acknowledgment** routing to `/catch` with AI-assisted candidate extraction and mandatory explicit user confirmation on `/add`.

### Mandatory Engineering Invariants:
1. **Zero Direct Writes:** AI extraction (Whisper STT or Vision OCR) drafts candidates only; explicit user confirmation is strictly mandatory before database commit.
2. **Integer Paise Representation:** All money values continue using integer paise arithmetic ($1\text{ INR} = 100\text{ paise}$).
3. **Lock-Screen Privacy:** Widgets display zero balance or sensitive PII.
4. **Preserved Speech Paths:** Groq Whisper (`whisper-large-v3-turbo`) remains active production STT; IndicConformer remains dormant.
5. **No Background Audio Violations:** Mic recording is triggered upon application foregrounding, adhering to Android 12+ foreground service and microphone privacy indicators.
6. **No Dangerous File Sharing:** Zero `file://` URLs exposed to WebView; file paths validated natively, and `Capacitor.convertFileSrc()` applied exclusively in TypeScript.
7. **No Sensitive Query Strings:** Full UPI payment text is never exposed in browser URL query parameters.
8. **No Payment Content in Browser Storage:** Neither `sessionStorage`, `localStorage`, nor IndexedDB stores payment text, images, or extracted candidates permanently. `sessionStorage` acts only as a volatile convenience cache; native Android storage is the authoritative truth.
9. **Explicit User Sharing Only:** Zero passive background listening, zero SMS scraping.

---

## 2. Feature A: Android Home-Screen Widgets Architecture

### 2.1 Android Widget Sizing Rules & HyperOS Compatibility

#### Launcher Grid Mechanics & HyperOS Sizing Limitations
On Android, home-screen launchers subdivide the display into grid cells (typically $4\times 5$, $4\times 6$, or $5\times 6$). OEM launchers such as **Xiaomi HyperOS (Redmi 12 5G)** apply internal cell padding, custom margins, and icon labels that alter effective bounding boxes.

- **Design Invariant:** We do not claim exact millimeter dimensions across all third-party launchers prior to physical device testing. We target exact $1\times 2$ (compact vertical) and $2\times 2$ (square) cell spans using Android's dual-attribute specification:
  1. **Legacy dimensions (`minWidth`, `minHeight`):**
     - Compact (1:2): `minWidth="60dp"`, `minHeight="130dp"`
     - Extended (2:2): `minWidth="130dp"`, `minHeight="130dp"`
  2. **Android 12+ dimensions (`targetCellWidth`, `targetCellHeight`, `minResizeWidth`, `minResizeHeight`):**
     - Compact (1:2): `targetCellWidth="1"`, `targetCellHeight="2"`, `minResizeWidth="60dp"`, `minResizeHeight="120dp"`
     - Extended (2:2): `targetCellWidth="2"`, `targetCellHeight="2"`, `minResizeWidth="120dp"`, `minResizeHeight="120dp"`
  3. **Resize Mode:** `android:resizeMode="none"` (enforces fixed layout ratios, preventing user resizing distortion).
  4. **Layout Fitting:** `android:fitsSystemWindows="false"` with internal responsive padding to prevent HyperOS border truncation.

### 2.2 Visual Layout & RemoteViews Structure

#### Widget 1: Compact Microphone Widget (1:2 Vertical)
- **File:** `res/layout/widget_compact_mic.xml`
- **Background:** Rounded dark container `#192723` (`@drawable/widget_bg_rounded`, 24dp corner radius).
- **Top / Center:** Circular microphone button `#2D4A41` (`@drawable/widget_circle_mic_bg`, 56dp diameter) enclosing white vector mic icon (`@drawable/ic_widget_mic`).
- **Typography:**
  - App Name: `FLOVA` in bold `#FFFFFF` (15sp, `fontFamily="sans-serif-medium"`).
  - Subtitle: `Tap to speak` in `#A3B8B0` (12sp).
- **Behavior:** Tapping the container or mic executes a `PendingIntent` launching `MainActivity` with deep link `in.flova.app://voice?autoRecord=true`.

#### Widget 2: Extended Quick-Actions Widget (2:2 Square)
- **File:** `res/layout/widget_extended_quick_actions.xml`
- **Background:** Rounded dark container `#192723` (`@drawable/widget_bg_rounded`, 24dp corner radius).
- **Header:**
  - Left: `FLOVA` title in bold `#FFFFFF` (16sp).
  - Right: FLOVA audio wave icon (`@drawable/ic_widget_wave`) in brand accent `#4E8777`.
- **Action Grid (2x2):**
  1. **Voice:** Mic icon `#FFFFFF`, tile `#2D4A41`, label `Voice` $\rightarrow$ `in.flova.app://voice?autoRecord=true`.
  2. **Add:** Plus icon `#FFFFFF`, tile `#2D4A41`, label `Add` $\rightarrow$ `in.flova.app://add`.
  3. **Receipt:** Viewfinder/camera icon `#FFFFFF`, tile `#2D4A41`, label `Receipt` $\rightarrow$ `in.flova.app://catch`.
  4. **History:** Clock icon `#FFFFFF`, tile `#2D4A41`, label `History` $\rightarrow$ `in.flova.app://activity`.
- **Touch Targets:** Each tile is $\ge 52 \times 52\text{ dp}$ with touch feedback ripple.

### 2.3 Widget Updates & Zero Financial State
- Both widgets are **pure action launchers** that display zero financial balances or personal data.
- **Update Mechanism:** Standard `AppWidgetProvider.onUpdate()` binds `PendingIntent`s and calls `appWidgetManager.updateAppWidget(appWidgetId, views)`.
- `android:updatePeriodMillis="0"` ensures zero battery drain or background polling.

### 2.4 Voice Auto-Record Idempotency Strategy

To guarantee that one widget tap causes **at most one** recording session, `VoiceScreen.tsx` implements a strict **one-shot execution guard**:

```
[Deep Link: in.flova.app://voice?autoRecord=true]
       |
       v
[VoiceScreen Component Mounts]
       |
       +---> Check autoRecordGuardRef.current === true?
       |     YES -> Abort. (Already triggered for this navigation)
       |     NO  -> Proceed to Step 1.
       |
       +---> Step 1: Set autoRecordGuardRef.current = true
       |
       +---> Step 2: Strip `autoRecord` from searchParams immediately:
       |             navigate('/voice', { replace: true })
       |             (Guarantees re-renders / re-mounts do not re-trigger)
       |
       +---> Step 3: Check isListening || recorder.status !== "idle"
       |             If already active, do not trigger a second recording.
       |
       +---> Step 4: Verify microphone permissions
       |             If granted -> start recording once.
       |             If missing -> request permission.
       |                           (Permission callback executes once)
       |
       +---> Step 5: If user taps "Stop" or "Cancel"
                     Recording aborts cleanly. Guard prevents auto-restart.
```

---

## 3. Feature B: Android UPI Payment Share Integration

### 3.1 Background Executor & Transient URI Invariant

When an external application shares a `content://` URI via `ACTION_SEND`, Android grants transient read permissions (`Intent.FLAG_GRANT_READ_URI_PERMISSION`) tied strictly to the lifetime of the received intent.

- **Non-Blocking Invariant:** Heavy image stream copying must **never** run on Android's main UI thread. It is offloaded to a dedicated background executor (`Executors.newSingleThreadExecutor()`).
- **Immediate Permission Capture:** The incoming `Uri streamUri` and its `Intent` context are captured immediately within `MainActivity.handleSendIntent()`. The background task begins stream reading while the URI permission grant remains valid.
- **Atomic Writing to Disk:** The background worker reads the `InputStream` into `context.getCacheDir() + "/flova_shares/<token>.tmp"`. Upon complete, uncorrupted byte copy ($\le 15\text{ MB}$), the file is atomically renamed to `.../<token>.jpg`.
- **Deferred Token Dispatch:** The share token URL (`/catch?sharedToken=<token>`) is dispatched to the Capacitor WebView **only after** the background copy completes successfully. If copying fails (e.g. disk full or corrupted stream), the `.tmp` file is purged, the token is not created, and an error notice is displayed.

### 3.2 Native Authoritative Claim Recovery Architecture

To ensure 100% durability regardless of whether `window.sessionStorage` survives OS process death, the native Android layer (`FlovaShareStore.java`) is the **sole authoritative source of truth** for `{token, claimId}` state:

```
+-----------------------------------------------------------------------------------------------+
|                                    NATIVE ANDROID STORAGE                                     |
|                                                                                               |
|   /flova_shares/<token>.json:                                                                 |
|   {                                                                                           |
|     "token": "...",                                                                           |
|     "type": "text" | "image",                                                                 |
|     "textContent": "...",                                                                     |
|     "imagePath": "/data/user/0/in.flova.app/cache/flova_shares/<token>.jpg",                  |
|     "createdAt": 1732450000000,                                                               |
|     "expiresAt": 1732450900000,       // Absolute 15-minute TTL                               |
|     "status": "PENDING" | "CLAIMED",                                                          |
|     "claimId": "...",                 // Authoritative native UUID                            |
|     "claimExpiresAt": 1732450060000   // 60-second lease window                               |
|   }                                                                                           |
+-----------------------------------------------+-----------------------------------------------+
                                                |
                                                v
+-----------------------------------------------------------------------------------------------+
|                            REACT WEBVIEW / CATCHSCREEN LIFECYCLE                              |
|                                                                                               |
| 1. On Mount:                                                                                  |
|    - Checks searchParams.get("sharedToken") -> token                                          |
|    - Calls FlovaSharePlugin.claimSharedPayload({ token, clientClaimId: optId })               |
|                                                                                               |
| 2. Native Claim Execution (Atomic Synchronized Block):                                        |
|    - If token not found: returns { status: "not_found" }                                      |
|    - If currentTime > payload.expiresAt: deletes files, returns { status: "expired" }         |
|    - If payload.status == "CLAIMED" and currentTime <= payload.claimExpiresAt:                |
|        * RECOVERY RULE: Native returns existing payload.claimId!                              |
|        * Never generates a replacement claimId while active lease exists.                     |
|        * Returns { status: "ok", claimId: payload.claimId, payload: { ... } }                 |
|    - If payload.status == "PENDING" or (CLAIMED and currentTime > claimExpiresAt):            |
|        * Generates (or adopts) authoritative claimId, sets status = "CLAIMED",                |
|          sets claimExpiresAt = currentTime + 60s. Persists atomically to disk.                |
|        * Returns { status: "ok", claimId, payload: { ... } }                                  |
|                                                                                               |
| 3. React Ingestion:                                                                           |
|    - Saves claimId returned by native into React state (and sessionStorage as optional cache).|
|    - URL parameter `sharedToken` is stripped immediately via replace: true.                   |
|    - Starts 20s heartbeat timer: FlovaSharePlugin.renewSharedPayloadLease({ token, claimId }) |
|    - Loads image File into memory and downscales.                                             |
|                                                                                               |
| 4. Atomic Acknowledgment:                                                                     |
|    - Calls FlovaSharePlugin.acknowledgeSharedPayload({ token, claimId })                      |
|    - Native verifies active lease matching claimId, deletes <token>.json and <token>.jpg.     |
|    - React clears heartbeat and sessionStorage.                                               |
+-----------------------------------------------------------------------------------------------+
```

#### Durability Scenarios Handled authoritatively:
- **Process Death Before URL Stripping:** The URL still has `?sharedToken=<token>`. On recreation, React calls `claimSharedPayload({ token })`. Native detects an active lease and returns the **existing authoritative `claimId`** and file path.
- **Process Death After URL Stripping:** React checks `sessionStorage` (or queries native for any active pending share token via `getActivePendingToken()`). It calls `claimSharedPayload({ token })` and recovers cleanly.
- **Empty `sessionStorage` Recovery:** Even if `sessionStorage` was wiped by Android OS, providing the `token` returns the native lease without clobbering the active claim state.
- **Duplicate Intent Delivery:** Tapping Share twice delivers the same intent or token; native returns the existing claim rather than creating redundant allocations.

### 3.3 Active Lease Renewal (Heartbeat) Protocol

To ensure that lengthy image decoding, downscaling, or slow network OCR does not allow another client to reclaim an actively processed payload:

- **Renewal Cycle:** Every 20 seconds, `CatchScreen` calls `renewSharedPayloadLease({ token, claimId })`.
- **Ceiling Invariant:** The absolute 15-minute payload TTL (`payload.expiresAt`) is never bypassed. If `currentTime >= payload.expiresAt`, renewal is rejected with `{ status: "expired" }` and files are deleted.
- **Immediate Heartbeat Teardown:** If image processing succeeds, fails, or the user cancels, the heartbeat timer is cleared immediately.
- **Stale Write Rejection:** If a client freezes for $>60\text{s}$ without sending a heartbeat and another client reclaims the lease, the native store updates the lease record. When the frozen client wakes up and attempts `acknowledgeSharedPayload()`, native code rejects it with `{ status: "lease_lost" }`, strictly preventing stale disk overwrites or commits.

### 3.4 TypeScript-Native File Path Separation
- **Native Responsibility:** Native Java code strictly validates and returns the internal absolute file path (e.g. `/data/user/0/in.flova.app/cache/flova_shares/<token>.jpg`). Native Java does **not** invoke `convertFileSrc()`.
- **TypeScript Responsibility:** The TypeScript wrapper (`native/sharePlugin.ts`) receives the path, validates it, and calls `Capacitor.convertFileSrc(filePath)` to construct the `https://localhost/_capacitor_file_/...` URL for React ingestion.

### 3.5 AndroidManifest Intent Filters & Category Declarations

In `frontend/android/app/src/main/AndroidManifest.xml`, `MainActivity` declares explicit intent filters with required categories:

```xml
<!-- UPI Share Target: Explicit User Sharing of Text and Payment Screenshots -->
<intent-filter>
    <action android:name="android.intent.action.SEND" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="text/plain" />
</intent-filter>

<intent-filter>
    <action android:name="android.intent.action.SEND" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="image/*" />
</intent-filter>
```

---

## 4. UPI Application Compatibility Expectations

| UPI Application | Expected Content Type | Expected Payload Format | Current Status | Notes & Known Variations |
| :--- | :--- | :--- | :--- | :--- |
| **Google Pay (GPay)** | `text/plain` or `image/*` | Confirmation text: `"Paid ₹XXX to [Merchant] using Google Pay. UPI Ref: [12-digit]"` or receipt screenshot. | **Pending Physical Verification** | In GPay, "Share" button offers text or screenshot depending on bank channel. |
| **PhonePe** | `image/*` (Primary) & `text/plain` | Styled receipt screenshot (JPEG) with green checkmark, amount, Txn ID, and UTR. Text format: `"Paid Rs.XXX to [Merchant] on PhonePe..."` | **Pending Physical Verification** | PhonePe frequently shares as image rather than text. Image OCR pipeline is the critical path. |
| **Paytm** | `text/plain` & `image/*` | Text: `"Paid Rs.XXX to [Merchant] via Paytm UPI Ref: [UTR]"` or passbook receipt screenshot. | **Pending Physical Verification** | Paytm SMS text pasted or shared directly. |
| **BHIM (NPCI)** | `text/plain` | Text: `"Sent Rs.XXX from UPI to [VPA] on [Date]. Ref [UTR]"` | **Pending Physical Verification** | BHIM primarily shares plain text confirmation summaries. |

---

## 5. File-by-File Implementation Plan

### 5.1 Native Android Layer (`frontend/android/app/src/main/`)

| File Path | Nature | Purpose & Contents |
| :--- | :--- | :--- |
| `res/layout/widget_compact_mic.xml` | **New File** | XML layout for 1:2 Compact Microphone widget. Rounded dark container `#192723`, mic button `#2D4A41`, FLOVA title, "Tap to speak". |
| `res/layout/widget_extended_quick_actions.xml` | **New File** | XML layout for 2:2 Extended Quick-Actions widget. FLOVA header with audio wave, 2x2 grid of action tiles (Voice, Add, Receipt, History). |
| `res/xml/widget_compact_mic_info.xml` | **New File** | AppWidgetProviderInfo for 1:2 widget (`targetCellWidth="1"`, `targetCellHeight="2"`, `updatePeriodMillis="0"`, `resizeMode="none"`). |
| `res/xml/widget_extended_quick_actions_info.xml` | **New File** | AppWidgetProviderInfo for 2:2 widget (`targetCellWidth="2"`, `targetCellHeight="2"`, `updatePeriodMillis="0"`, `resizeMode="none"`). |
| `res/drawable/widget_bg_rounded.xml` | **New File** | Dark background shape (`#192723`, 24dp rounded corners). |
| `res/drawable/widget_circle_mic_bg.xml` | **New File** | Circular drawable for mic action button (`#2D4A41`). |
| `res/drawable/widget_tile_bg.xml` | **New File** | Rounded tile background for 2x2 grid (`#2D4A41`, 16dp corner radius). |
| `res/drawable/ic_widget_mic.xml` | **New File** | White vector drawable for microphone icon. |
| `res/drawable/ic_widget_add.xml` | **New File** | White vector drawable for Add plus icon. |
| `res/drawable/ic_widget_receipt.xml` | **New File** | White vector drawable for Receipt scan icon. |
| `res/drawable/ic_widget_history.xml` | **New File** | White vector drawable for History clock icon. |
| `res/drawable/ic_widget_wave.xml` | **New File** | Brand accent `#4E8777` sound wave icon. |
| `java/in/flova/app/FlovaMicWidgetProvider.java` | **New File** | `AppWidgetProvider` for 1:2 widget. Binds `PendingIntent` for `in.flova.app://voice?autoRecord=true`. |
| `java/in/flova/app/FlovaQuickActionsWidgetProvider.java` | **New File** | `AppWidgetProvider` for 2:2 widget. Binds `PendingIntent`s for all 4 tiles. |
| `java/in/flova/app/FlovaShareStore.java` | **New File** | Authoritative native store managing disk-backed payload metadata, background copy executor, atomic claimId generation/reuse, 60s lease, lease renewal heartbeat, 15m absolute TTL, and atomic disk deletion on acknowledgment. |
| `java/in/flova/app/FlovaSharePlugin.java` | **New File** | Capacitor plugin exposing `claimSharedPayload({token, clientClaimId})`, `renewSharedPayloadLease({token, claimId})`, `acknowledgeSharedPayload({token, claimId})`, and `getActivePendingToken()`. |
| `java/in/flova/app/MainActivity.java` | **Modify** | 1. Register `FlovaSharePlugin`.<br>2. Intercept `ACTION_SEND` in `onCreate()` and `onNewIntent()`.<br>3. Copy streams off-thread via background executor, dispatch token after copy completes.<br>4. Route WebView to `/catch?sharedToken=<token>`. |
| `AndroidManifest.xml` | **Modify** | 1. Register `<receiver>` for `FlovaMicWidgetProvider`.<br>2. Register `<receiver>` for `FlovaQuickActionsWidgetProvider`.<br>3. Add explicit `<intent-filter>` blocks for `ACTION_SEND` (`text/plain` and `image/*`) with `CATEGORY_DEFAULT`. |

### 5.2 Frontend / TypeScript Layer (`frontend/src/`)

| File Path | Nature | Purpose & Contents |
| :--- | :--- | :--- |
| `screens/VoiceScreen.tsx` | **Modify** | Implements the one-shot autoRecord guard (`autoRecordGuardRef`), strips query parameter immediately, and verifies mic permissions cleanly. |
| `screens/CatchScreen.tsx` | **Modify** | Detects `sharedToken`, invokes `claimSharedPayload({token})`, retrieves native authoritative claimId, starts heartbeat renewal, calls `Capacitor.convertFileSrc(filePath)`, loads image into memory, and calls `acknowledgeSharedPayload({token, claimId})`. |
| `native/sharePlugin.ts` | **New File** | TypeScript wrapper for `FlovaSharePlugin` handling `Capacitor.convertFileSrc(filePath)` URL translation, native claim leases, lease renewal heartbeat, and acknowledgment. |

---

## 6. Execution Milestones & Step-by-Step Order

1. **Step 1: Android Resource Scaffolding**
   - Create layouts, metadata XMLs, and vector drawables in `res/`.
2. **Step 2: Native Widget Providers**
   - Implement `FlovaMicWidgetProvider.java` and `FlovaQuickActionsWidgetProvider.java`.
3. **Step 3: Native Durable Share Store, Background Executor & Plugin**
   - Implement `FlovaShareStore.java` with background executor, native authoritative claimId storage, and renewal heartbeat logic.
   - Implement `FlovaSharePlugin.java`.
   - Update `MainActivity.java` and `AndroidManifest.xml`.
4. **Step 4: Frontend Deep Link, Token Lease & Path Conversion**
   - Update `VoiceScreen.tsx` with one-shot guard and URL strip.
   - Update `CatchScreen.tsx` with native claim lease, heartbeat renewal, and `convertFileSrc()`.
   - Implement `native/sharePlugin.ts`.
5. **Step 5: Automated Testing & Xiaomi Redmi 12 5G Verification**
   - Run full frontend unit test suite (`npm test`).
   - Run Android build sync (`npx cap sync android`).
   - Execute manual verification matrix on Xiaomi Redmi 12 5G.
