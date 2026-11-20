# FLOVA Hero Section Blueprint: Video 1 Deep Analysis
> Reference Source: `Screen Recording 2026-11-20 211529.mp4` (Duration: 17.80s, 1920x1080 @ 30fps)
> Target Workspace: `FLOVA` ("Make your money move smarter") · `feature/frontend`

---

## 1. Canvas, Background Surface & Spatial Framing

- **Base Paper Canvas**:
  - Color: Warm tactile off-white paper canvas (`#F8F7F4` / `#F7F6F2`).
  - Texture: Smooth high-grade archival editorial paper.
- **Architectural Hairline Grid Geometry**:
  - Grid cell size: Exactly `214px × 214px` squares (`background-size: 214px 214px`).
  - Stroke: `1px` crisp hairline with low contrast (`rgba(25, 35, 30, 0.055)` or `#E4E0D6`).
  - Alignment: Centered horizontally on the viewport axis (`background-position: center top`).
- **Edge & Bottom Vignette Depth**:
  - Soft radial light vignette: `radial-gradient(circle at 50% 50%, rgba(248, 247, 244, 0) 35%, rgba(220, 215, 203, 0.42) 100%)`.
  - Dark bottom fade in video player: Dark bottom gradient for the control overlay; the web canvas itself maintains a clean, open bottom edge leading into the metadata divider.
- **Margin Coordinates & Axis Markers**:
  - Faint typographic compass coordinates aligned to the right-most vertical grid line (~428px right of center / ~28px from right edge on laptops):
    - `"N"`: Positioned at ~38% viewport height.
    - `"S"`: Positioned at ~58% viewport height.
    - Typography: Monospace/grotesque sans-serif, 11px, `letter-spacing: 0.12em`, color `rgba(60, 75, 70, 0.45)`.

---

## 2. Top Navigation Bar (Fixed / Sticky Editorial Header)

- **Layout Structure**:
  - Single row, full viewport width (`width: 100%`), edge padding: `18px 48px` (desktop) / `14px 20px` (mobile).
  - Pinned with `position: sticky; top: 0; z-index: 20;`.
  - Border: Subtle bottom hairline divider (`border-bottom: 1px solid #E5E1D7`).
  - Backdrop: `background: rgba(248, 247, 244, 0.85); backdrop-filter: blur(8px);`.
- **Left Group (Brand Identity)**:
  - Brand Mark: `FLOVA` (high-contrast serif bold, 20px, `letter-spacing: 0.04em`, `#19211E`).
  - Edition Sub-tag: `2026 Edition` (italic serif, 13px, `#64736D`, sitting right of the brand mark).
- **Center Group (Navigation Links & Pill Toggle)**:
  - Links: `Intro`, `How It Works`, `About` (or `The book`, `About the Author` in reference).
  - Active State: `Intro` has a crisp `1.5px` underline (`#19211E`) seated 2px below text.
  - Hover State: Subtle color shift to emerald `#0E6B52` with smooth 0.2s transition.
  - Compact Pill Control: `"Aa"` (pill button: `border: 1px solid #E5E1D7; border-radius: 999px; padding: 3px 12px; font-size: 13px; font-weight: 600;`).
    - Behavior: Active/pressed state feedback (scales to 0.96 on click, switches display scale).
- **Right Group (Action CTA & Metadata Badge)**:
  - Secondary Badge: Subtle muted text next to CTA (`<s>$0/mo</s> Free MVP` or `$9.99` strikethrough in reference).
  - Primary CTA: `Launch Runway →` (or `Buy it now!`, `Open FLOVA →`).
    - Dark fill `#19211E`, white text, border-radius `6px`, arrow translates right on hover (`transform: translateX(3px)`).

---

## 3. Centered Typography Lockup & Easing Choreography

- **Eyebrow**:
  - Text: *"Make your money move smarter"* (in reference: *"The Invisible Rules of Wealth"*).
  - Style: Editorial serif italic (`Cormorant Garamond` / `Playfair Display`), font-size clamp `20px–28px`, color `#2D3633`.
  - Timing: Fades in smoothly from `t = 0.0s` to `1.2s` with a gentle 10px upward settle (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Two-Line Condensed Uppercase Display Headline**:
  - Typeface: Massive condensed high-contrast serif (Playfair Display / Didot / Bodoni MT).
  - Font Size: Clamp `68px` to `168px`, line-height `0.88`, letter-spacing `clamp(4px, 0.9vw, 18px)`.
  - Color: Deep forest emerald green (`#0E6B52` / `#0A523E`).
  - **Top Line (`MONEY` / `RUNWAY`)**:
    - Starts softer and translucent at `t = 0.0s` (`opacity: 0.18; filter: blur(3px)`).
    - Over `1.4s`, sharpens and deepens into rich emerald (`opacity: 1; filter: blur(0)`).
    - Spatial Split: Flanked with `M O` on the left and `E Y` on the right, leaving an intentional ~280px–420px center negative space for the centerpiece.
  - **Bottom Line (`IN CHECK` / `MOVE SMARTER`)**:
    - Starts hidden at `t = 0.0s` (`opacity: 0; transform: translateY(28px)`).
    - Rises and fades into position from `t = 0.45s` to `1.8s` behind and around the centerpiece.
    - Spatial Split: `I N` + `C` on the left, `E C K` on the right.
- **Bottom Sub-line**:
  - Text: *"Adaptive runway for irregular income"* (in reference: *"A novel by Óscar Pérez"*).
  - Style: Editorial serif italic, clamp `17px–24px`, color `#34403B`.
  - Timing: Fades in at `t = 1.0s` to `2.2s`.

---

## 4. Central Focal Visual (Centerpiece)

- **Visual Subject**:
  - Carved black chess knight layered inside a rolled US banknote / currency cylinder, bound firmly with a dual-loop elastic cord.
- **Positioning**:
  - Anchored centrally over the gap of both headline lines (`top: 48%; left: 50%; transform: translate(-50%, -50%)`).
  - Layering: Sits on `z-index: 12`, positioned *in front* of the headline text.
- **Drop Shadows & Depth**:
  - Dual-tier soft shadow:
    `filter: drop-shadow(0 28px 36px rgba(10, 30, 24, 0.24)) drop-shadow(0 8px 16px rgba(10, 30, 24, 0.12));`
- **Micro-Float Motion**:
  - Present from `t = 0.0s`.
  - Calm, continuous breathing float (`translateY(0)` to `translateY(-10px)`, 6s period, `cubic-bezier(0.45, 0, 0.55, 1)` infinite alternate).
  - Avoids any jarring jumps; maintains a poised, sculpted presence.

---

## 5. Hand-Drawn Sketch Annotations, Medallion & Secondary Visuals

All sketch markings mimic authentic pen-and-ink chess strategy notations from the Italian Game (Giuoco Piano):

| Marker / Element | Video Timestamp | Spatial Location | Visual Description |
|---|---|---|---|
| **`e4` (`L4`)** | `t ≈ 1.0s` | Upper-left (`top: 15%`, left of headline) | Cursive ink sketch, scale-in fade |
| **`e5` (`L5`)** | `t ≈ 1.2s` | Top-center-left (`top: 24%`, above `M`) | Cursive index notation |
| **`Nf3` (`N73`)** | `t ≈ 1.5s` | Left of knight (`top: 34%`, near `O`) | Green/charcoal sketch, hugging knight shoulder |
| **`Nc6` (`N66`)** | `t ≈ 1.8s` | Right of knight (`top: 31%`, near `E`) | Green/charcoal sketch, hugging knight muzzle |
| **`Bc4` (`B24`)** | `t ≈ 2.2s` | Mid-right (`top: 48%`, between lines) | Hand-drawn bishop move label |
| **`Bc5` (`B25`)** | `t ≈ 2.8s` | Lower-right (`top: 43%`, above `K`) | Hand-drawn bishop move label |
| **`c3`** | `t ≈ 2.3s` | Center-left (`top: 55%`, above `C`) | Faint ink notation |
| **`d6`** | `t ≈ 2.6s` | Lower-left (`bottom: 12%`, under `IN`) | Faint ink notation |
| **`d3`** | `t ≈ 2.7s` | Lower-center-right (`bottom: 27%`, near `E`) | Faint ink notation |
| **`0-0` (Castling)** | `t ≈ 3.1s` | Lower-right (`bottom: 8%`, under `ECK`) | Castling notation |
| **Standing Figure** | `t ≈ 0.8s` | Lower-left base of `IN` (`x ≈ 490px, y ≈ 740px`) | Ink silhouette of man in coat with pipe |
| **Pipe Smoke Wisp** | `t = 0.8s+` | Above figure's head | Ambient curling smoke puff animating upwards |
| **Circular Medallion** | `t ≈ 3.0s–6.0s` | Enters top-right, rolls to lower-right | Ancient Roman silver coin (Trajan), rotating 360° |
| **Corner Banknote** | `t ≈ 0.6s` | Bottom-left corner (`left: -20px, bottom: -15px`) | Angled banknote peeking up into viewport |
| **Scroll Emblem** | `t ≈ 1.4s` | Center below sub-line (`x: 50%`) | Mouse outline + pulsating wheel + arched `s c r o l l` |

---

## 6. Reveal on Scroll (Sub-Hero Section at `t = 12s–17.8s`)

As the user scrolls down:
1. **Two-Bill Reveal**: The corner banknote peeking up from the bottom-left transforms into **two crisp folded floating banknotes** with overlapping shadows.
2. **Metadata Divider Strip**: A clean horizontal rule reveals four aligned columns:
   - **Col 1**: `Money in Check.` (or `FLOVA Runway.`)
   - **Col 2**: `The Principles of Wealth.` (or `Guaranteed Weekly Salary Engine.`)
   - **Col 3**: `August 8, 2026, 3:24 PM` (live timestamp / edition date in muted teal)
   - **Col 4**: `Boston, MA` (or `Bengaluru, KA` / edition location)
3. **Sub-fold Annotations**: Additional faint chess moves along the lower grid: `a4`, `Re1`, `h6`.
4. **Editorial Body Lead**: Below the divider, large low-contrast serif body text emerges (`"adulthood as if they were..."`).

---

## 7. Motion Choreography & Parallax Execution Plan

- **Parallax Layers (GPU accelerated `transform: translate3d(...)` only)**:
  - Layer 1 (Background Grid): `factor: 4px` (moves slightly with mouse)
  - Layer 2 (Headline Text): `factor: -6px` (counter-moves for depth)
  - Layer 3 (Centerpiece): `factor: 12px` (strongest focal depth)
  - Layer 4 (Coin Medallion): `factor: 16px` (front-most floating plane)
  - Layer 5 (Sketch Annotations): `factor: -4px` (anchored to grid surface)
- **Reduced Motion Support**:
  - `@media (prefers-reduced-motion: reduce)`:
    - All entrance animations (`@keyframes`) disabled.
    - Centerpiece breathing float set to static centered position.
    - Parallax translations clamped to zero (`transform: none`).
    - Opacities set immediately to `1.0`.

---

## 8. Readiness Checklist for Video 2 & Master Build

- [x] All 6 core dimensions of Video 1 catalogued with sub-second accuracy.
- [x] High-resolution assets extracted and validated (`centerpiece.png`, `coin.png`, `man.png`, `corner_bill.png`).
- [x] Strict data contract boundaries maintained (no floating-point math, no client balances, no unauthorized `VITE_` variables).
- [x] Ready to receive Video 2 and execute the Master Build in Step 3.
