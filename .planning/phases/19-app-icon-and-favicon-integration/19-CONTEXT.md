# Phase 19 Context: FLOVA App Icon & Favicon Integration

## 1. Objective
Establish complete, professional brand iconography across all FLOVA web and PWA touchpoints using the supplied transparent FLOVA logo PNG as the master brand asset.
Generate and integrate all required standard favicons, touch icons, and installable PWA application icons, maintaining strict fidelity to the original geometry, color gradients, and rupee symbol without distortion or decoration.

---

## 2. Master Brand Asset Specification
- **Master Source:** Supplied high-resolution 1024 × 1024 PNG (`media_1795406442151_fd944c97.png`).
- **Brand Geometry & Invariants:**
  - Preserve exact original logo geometry and aspect ratio.
  - Do not redraw, distort, rotate, or modify the central rupee symbol (₹).
  - Preserve the original dark-green (#014B30) and bright-green (#00A651) gradient palette.
  - Never add text, wordmarks, or extraneous lettering.
  - Do not add outer drop shadows, artificial outlines, or decorative elements.
  - Keep the master PNG unchanged; all sizes are generated deterministically using high-quality resampling (Lanczos).

---

## 3. Asset Specification & Delivery Requirements

### A. App Icon (PWA / Mobile / Home Screen)
- **Dimensions:** 1024 × 1024 PNG master.
- **Composition:** Centered FLOVA leaf symbol with white ribbon and rupee core on rounded-square app icon composition with very light neutral background.
- **Installable PWA Sizes:**
  - `icon-512.png` (512 × 512, any & maskable purpose).
  - `icon-192.png` (192 × 192, any & maskable purpose).
  - `apple-touch-icon.png` (180 × 180, iOS Safari home-screen icon).

### B. Favicon (Browser Tabs & Bookmarks)
- **Favicon ICO:** `favicon.ico` containing multi-resolution layers (16 × 16, 32 × 32, and 48 × 48 px).
- **Favicon PNGs:**
  - `favicon-16x16.png` (16 × 16 transparent background).
  - `favicon-32x32.png` (32 × 32 transparent background).
  - `favicon-48x48.png` (48 × 48 transparent background).
- **Favicon SVG:**
  - `favicon.svg` with transparent background preserving exact logo geometry and gradients for modern high-DPI browser tabs.

---

## 4. Integration Touchpoints
1. `frontend/index.html`:
   - Replace legacy placeholder icon links.
   - Add `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`.
   - Add `<link rel="alternate icon" href="/favicon.ico" />`.
   - Add `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />`.
   - Add `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />`.
   - Add `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />`.
   - Keep `<link rel="manifest" href="/manifest.webmanifest" />`.
2. `frontend/public/manifest.webmanifest`:
   - Register `icon-192.png` (192x192, image/png, purpose: "any").
   - Register `icon-512.png` (512x512, image/png, purpose: "any").
   - Register maskable icon variants (`icon-512.png` / `icon-192.png`, purpose: "maskable").
   - Keep `favicon.svg` (sizes: "any", type: "image/svg+xml").
3. `frontend/public/sw.js`:
   - Update `SHELL_ASSETS` to precache the essential icons (`/favicon.ico`, `/favicon.svg`, `/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png`).
4. **Obsolete Logo Cleanup:**
   - Remove the obsolete purple circle placeholder from `favicon.svg`.
   - Verify no broken image links or stale references in build.

---

## 5. Verification & Acceptance Criteria
- All 8 specified image files exist in `frontend/public/` with exact dimensions and formats.
- Production build passes without errors (`npm run build`).
- `index.html` and `manifest.webmanifest` link directly to valid, existing assets.
- No other UI or application logic is modified.
