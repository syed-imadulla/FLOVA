# FLOVA Follow-Up Sections Blueprint: Video 2 Deep Analysis & Morph Architecture
> Reference Sources: `20261120-1720-18.1933541.mp4` (Part 1, 10.43s) & `20261120-1721-06.3918928.mp4` (Part 2, 7.27s)
> Target Workspace: `FLOVA` ("Make your money move smarter") · `feature/frontend`

---

## 1. Hero-to-Followup 1-Rupee Indian Coin Morph Transition

### The Transition Bridge
- In Video 1 (Hero Section), the coin settles at the lower-right baseline (`x ≈ 75%`, `y ≈ 85%`).
- For FLOVA's Indian gig worker context, this medallion maps to an **Indian 1-Rupee coin (`₹1`)**—featuring the Ashoka Lion Capital, ₹ symbol, and wheat corn ear stalks.
- **Scroll Interpolation Sequence**:
  1. **Descent & Trajectory (`t_scroll = 0% → 40%`)**: As the user scrolls past the hero lockup and the 4-column metadata strip (`Money in Check.`, `The Principles of Wealth.`, etc.), the ₹1 coin detaches from the lower-right grid and drifts gracefully toward the horizontal center (`x: 50%`) while descending into the viewport.
  2. **Scale & Dimensionality (`t_scroll = 40% → 75%`)**: The coin expands smoothly from its compact `75px` diameter up to `140px–160px` with an accelerating 3D tilt (`rotateX(35deg) rotateY(15deg)`).
  3. **Emblem Morph & Card Expansion (`t_scroll = 75% → 100%`)**:
     - The dark showcase card (`#111214` / `#141517`) enters with rounded corners (`border-radius: 32px`).
     - At the vertical center of the dark card, the ₹1 coin morphs into the rotating 3D chrome metallic emblem (FLOVA's interlocking runway rings / currency knot).
     - The dark card gently expands to full container width (`max-width: 1360px`), establishing the high-contrast transition between the warm paper canvas and the dark showcase experience.

---

## 2. Band-by-Band Cadence in Video 2

### Band 1: Dark Feature Showcase Card (`#111214` / `#141517`)
- **Container**: Rich obsidian/onyx rounded card (`background: #121316; border-radius: 32px; padding: 72px 48px; border: 1px solid rgba(255,255,255,0.06);`).
- **Eyebrow**: `ADAPTIVE SALARY RUNWAY · 2026 EDITION` (spaced uppercase, 12px, tracking `0.14em`, color `#8B95A5`).
- **Central Emblem**: 3D chrome metallic morph target spinning smoothly on a vertical axis with soft environmental reflections.
- **Headline**: `Steady Weekly Payouts From Volatile Gig Pay` (bold display sans, clamp `40px–64px`, white, line-height `1.05`).
- **Subcopy**: `Backed by 50 simulated years of Indian delivery rider and cab driver cashflow data. Smooth out dry weeks without high-interest loan apps.`
- **Interactive Carousel / Tabs**:
  - Tab 1: *Steady Weekly Salary* (Guaranteed weekly baseline from irregular gig platforms).
  - Tab 2: *Zero Debt Trap Guarantee* (Smooth out lean periods from savings buffer rather than predatory credit).
  - Tab 3: *COD vs. Personal Cash Isolation* (Never spend cash that belongs to platforms like Zomato, Swiggy, or Uber).

---

### Band 2: 4-Column Feature & Value Strip (Light Paper Surface)
- **Container**: Full-width section on warm off-white canvas (`#F8F7F4`), hairline borders dividing columns.
- **Layout**: 4 equal columns with top icons, bold subheads, and crisp explanatory copy:
  1. **Column 1 (`Daily Earnings Check-in`)**:
     - *Icon*: Pocket cash & bank check-in symbol.
     - *Heading*: `Log in 10 Seconds`
     - *Copy*: `Record actual cash in hand and bank balance each evening. The runway calculates from real held money.`
  2. **Column 2 (`Clean Payout Tracking`)**:
     - *Icon*: Calendar delivery symbol.
     - *Heading*: `Pending ≠ Received`
     - *Copy*: `Expected Friday payouts remain scheduled until received, preventing double-counting or phantom runway.`
  3. **Column 3 (`COD Cash Isolation`)**:
     - *Icon*: Vault / shield symbol.
     - *Heading*: `Not-Mine Money Ringfenced`
     - *Copy*: `Customer cash collected is tracked as not-mine, ensuring you never accidentally spend platform funds.`
  4. **Column 4 (`Low-Bandwidth & SMS Mode`)**:
     - *Icon*: Minimalist SMS phone bubble.
     - *Heading*: `Works On 2G & SMS`
     - *Copy*: `Text simple phrases like "earned 850 petrol 120" to update your runway instantly without an app open.`

---

### Band 3: Fine-Grid Testimonial & Real Worker Stories Band
- **Background**: Subtle graph-paper grid (`1px` hairline lines at 48px intervals, soft radial vignette).
- **Centered Headline**: `FLOVA Protects Gig Workers Across India` (clamp `36px–56px`, bold grotesque, text `#141816`).
- **Floating Story Cards (Organic staggered scatter with soft depth)**:
  - **Card 1 (Left - Delivery)**:
    - *Author*: `Ramesh K.` | `Bengaluru, KA` | `Swiggy Delivery Partner` (avatar with teal badge).
    - *Quote*: `"During monsoon, orders drop by 40%. FLOVA smoothed my earnings so my rent was paid on time without touching loan apps."`
  - **Card 2 (Center-Bottom - Rideshare)**:
    - *Author*: `Deepak S.` | `Delhi NCR` | `Uber / Rapido Auto Driver`
    - *Quote*: `"Before FLOVA, I used to mix CNG money and platform COD with my personal savings. Now my wallet shows exactly what's mine."`
  - **Card 3 (Right - Services)**:
    - *Author*: `Priya M.` | `Mumbai, MH` | `Urban Company Service Partner`
    - *Quote*: `"My client payouts come on different days of the month. FLOVA turns that chaos into a predictable weekly salary."`

---

### Band 4: Vibrant Cyan/Aqua Callout Banner (`#25DCF5` / `#00D2F0`)
- **Container**: High-contrast luminous cyan card (`background: linear-gradient(135deg, #25DCF5 0%, #00BCEB 100%); border-radius: 32px; padding: 64px 40px; text-align: center; color: #111417; position: relative; overflow: hidden;`).
- **Decorative Elements**: Symmetrical 3D gold/bronze sculpted laurel leaf branches flanking the left and right edges.
- **Heading**: `Join The Delivery & Driver Guild, Earn Together` (bold sans, clamp `38px–56px`, tight letter-spacing).
- **Subcopy**: `Invite fellow gig workers to FLOVA and unlock pooled emergency reserves and peer runway protection.`
- **CTA Button**: Sleek dark pill button (`background: #111417; color: #FFFFFF; padding: 12px 28px; border-radius: 999px; font-weight: 600;`).

---

### Band 5: Split 2-Column Safety & Custody Feature Block
- **Container**: 2-column layout on crisp paper surface.
- **Section Heading**: `Built for Safety, Designed for You`
- **Left Column**: Full-height photographic card with rounded corners (`border-radius: 28px`) featuring Indian gig workers collaborating.
- **Right Column (3 Feature Rows with horizontal dividers & icons)**:
  1. **Row 1 (`Paise-Exact Precision`)**:
     - *Copy*: `Every rupee is stored and computed in integer paise. No floating-point math, no rounding errors.`
  2. **Row 2 (`Row-Level Security (RLS)`)**:
     - *Copy*: `Your financial data is strictly bound to your authenticated session. Never sent to third parties.`
  3. **Row 3 (`Social & SMS Recovery`)**:
     - *Copy*: `Lost your phone on a delivery shift? Regain instant access through verified mobile or trusted peers.`

---

### Band 6: Dark Runway Chart Showcase (`#111214`)
- **Container**: Dark rounded showcase card (`background: #111214; border-radius: 32px; padding: 64px 48px; color: #FFFFFF;`).
- **Layout**: 2-column split (interactive chart on left, explanation on right):
  - **Left (Interactive Dual-Line Chart)**:
    - *Axes*: X-axis (`0W`, `1W`, `2W`, `4W`, `8W`), Y-axis (`₹0`, `₹15K`, `₹30K`).
    - *Unbuffered Baseline (White/Amber curve)*: Fluctuates erratically and drops toward zero during dry spells.
    - *FLOVA Steady Runway (Cyan/Emerald curve)*: Ascends steadily with a reliable weekly baseline payout.
  - **Right (Call to Action)**:
    - *Heading*: `See How Your Runway Stays Steady`
    - *Subcopy*: `Enter your typical weekly earnings and fixed commitments to preview your guaranteed weekly salary curve.`
    - *CTA Button*: Cyan pill button `Simulate Your Runway →`.

---

### Band 7: Centered Statement & Final Conversion Block
- **Layout**: Clean centered typography on white/off-white canvas.
- **Headline**: `Ditch The Debt Trap 🏆 Own Your Runway` (with embedded silver/gold trophy emblem between words).
- **Subcopy**: `Switch to FLOVA and unlock guaranteed weekly payouts, total cash clarity, and financial freedom.`
- **CTA Button**: Cyan/aqua pill button `Launch FLOVA Now`.

---

### Band 8: 4-Column Footer & Massive Bottom Wordmark
- **Container**: Large light footer card with rounded top corners (`border-top-left-radius: 32px; border-top-right-radius: 32px;`).
- **Brand Identity**: FLOVA Athena/Wreath logo on the top-left.
- **4 Link Columns**:
  - **Col 1 (`Worker Accounts`)**: `Daily Check-in`, `Weekly Payouts`, `COD Separator`
  - **Col 2 (`Why FLOVA`)**: `Guaranteed Baseline`, `Paise Precision`, `50-Yr Simulation`
  - **Col 3 (`Get Started`)**: `Runway Simulator`, `SMS Mode`, `Rider Dashboard`
  - **Col 4 (`Company`)**: `About Us`, `Contract Spec`, `GitHub`, `Security`
- **Massive Bottom Wordmark**:
  - `F L O V A` rendered in ultra-bold condensed letterforms across the entire card width (~120px–180px font size).
  - The letter `O` is formed by the 3D dome of the Indian 1-Rupee coin.
- **Legal & Data Disclaimers**:
  - *Disclaimer*: `FLOVA is a financial runway management technology for independent gig workers and freelancers, not a bank or NBFC. Runway projections are computed deterministically against agreed financial contracts in integer paise. All simulated backtests represent 50 simulated years of synthetic rider data.`
  - *Copyright*: `© FLOVA 2026, All Rights Reserved.` · `Terms` `Privacy` `Contract v1` `Paise Policy` · Social links (`X`, `GitHub`).

---

## 3. Currency & Data Rules Mapping (FLOVA Contract Compliance)

1. **Indian Currency Representation**:
   - Currency Symbol: `₹` (Indian Rupee).
   - Formatter: Always format money in Indian number format (e.g. `₹4,500`, `₹15,000`, `₹1,20,000`).
   - Internal Representation: All monetary values are strictly integer **paise** (`paiseToRupeeString()` from `frontend/src/lib/money.ts`).
2. **Actual Cash vs. Expected Payouts vs. COD**:
   - Actual Cash = `cash_amount + bank_amount - not_mine_amount`.
   - COD Cash = Tracked strictly as `not_mine` liability; never counted as spendable runway.
   - Payouts = `scheduled` / `estimated` payouts appear only in scenario projections, never in confirmed cash runway.
3. **No UI/AI Balance Math**:
   - UI components never invent or calculate balances; all runway math is sourced deterministically from `frontend/src/engine/` or service contracts.
4. **Synthetic & Preview Disclaimers**:
   - All sample numbers in the landing page are labeled with explicit `(Simulated Preview · 50 yr backtest)` badges.
5. **No Unauthorized Environment Keys or Offline Claims**:
   - Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are used.
   - Offline handling is represented truthfully (no claims of magic offline sync without network/SMS).

---

## 4. Master Build Roadmap (Step 3 Preview)

- **Component Hierarchy**:
  - `HeroSection.tsx`: Video 1 hero canvas, grid, centerpiece, and Indian ₹1 coin.
  - `CoinTransitionBridge.tsx`: Handles scroll-linked coin morph from hero to dark showcase card.
  - `FeatureShowcaseDark.tsx`: Band 1 dark card with rotating emblem and feature carousel.
  - `ValueStrip.tsx`: Band 2 4-column feature row on light paper.
  - `TestimonialsGrid.tsx`: Band 3 fine-grid testimonial band with floating cards.
  - `CyanBanner.tsx`: Band 4 vibrant cyan callout with laurel leaf graphics.
  - `SafetySection.tsx`: Band 5 2-column feature block.
  - `RunwayChartShowcase.tsx`: Band 6 dark chart card with steady vs. unbuffered curves.
  - `StatementBlock.tsx`: Band 7 centered conversion headline with trophy mark.
  - `FooterLanding.tsx`: Band 8 4-column footer with giant `F L O V A` wordmark.
- [x] Step 2 complete: Video 2 fully analyzed and documented. Ready for Step 3 Master Build Prompt!
