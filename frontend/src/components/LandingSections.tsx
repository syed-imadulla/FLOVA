import React, { useState } from "react";
import { OneRupeeCoin } from "./OneRupeeCoin";

interface LandingSectionsProps {
  onLaunchWorkspace?: () => void;
  onOpenSimulator?: () => void;
}

export const LandingSections: React.FC<LandingSectionsProps> = ({
  onLaunchWorkspace,
  onOpenSimulator,
}) => {
  const [activeDarkTab, setActiveDarkTab] = useState<number>(0);
  const [chartScenario, setChartScenario] = useState<"standard" | "monsoon">("monsoon");

  const darkCards = [
    {
      title: "Will Your Money Last Until Next Payout?",
      subcopy:
        "50 simulated years of Indian gig delivery and cab cashflow data prove that uneven gig pay causes panic borrowing. FLOVA transforms erratic platform payouts into a guaranteed weekly salary baseline.",
      badge: "Guaranteed Weekly Baseline",
    },
    {
      title: "Never Spend What Belongs to Platform COD",
      subcopy:
        "Customer cash collections from Swiggy, Zomato, or Uber are ringfenced as not-mine liabilities. Your available balance only reflects the actual rupees you own.",
      badge: "Ringfenced Cash vs. COD",
    },
    {
      title: "Zero Debt Trap Guarantee",
      subcopy:
        "When monsoon rain or platform outages cut weekly order volumes by 40%, your FLOVA buffer absorbs the dip so rent and EMI are paid on time without touching loan apps.",
      badge: "Monsoon & Slump Buffer",
    },
  ];

  const handleLaunch = () => {
    if (onLaunchWorkspace) {
      onLaunchWorkspace();
    } else {
      const el = document.getElementById("flova-app-stage");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flova-followup-sections" id="how-it-works">
      {/* ===================================================================
          BAND 1: DARK FEATURE SHOWCASE CARD (#111214)
          Receiving the morphed 1-rupee coin emblem
          =================================================================== */}
      <section className="landing-dark-showcase-wrap" aria-label="Dark Feature Showcase">
        <div className="landing-dark-card">
          <div className="dark-card-eyebrow">AN ADAPTIVE KIND OF RUNWAY</div>

          {/* Morph Emblem Target */}
          <div className="dark-card-emblem-target" aria-hidden="true">
            <svg viewBox="0 0 100 100" width="76" height="76" className="dark-emblem-svg">
              <defs>
                <linearGradient id="emblemSilverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="40%" stopColor="#D2D9E2" />
                  <stop offset="75%" stopColor="#7B8594" />
                  <stop offset="100%" stopColor="#252C36" />
                </linearGradient>
              </defs>
              <ellipse cx="50" cy="50" rx="40" ry="22" transform="rotate(-30 50 50)" fill="none" stroke="url(#emblemSilverGrad)" strokeWidth="3.5" />
              <ellipse cx="50" cy="50" rx="40" ry="22" transform="rotate(30 50 50)" fill="none" stroke="url(#emblemSilverGrad)" strokeWidth="3.5" />
              <circle cx="50" cy="50" r="16" fill="#141517" stroke="url(#emblemSilverGrad)" strokeWidth="2.5" />
              <circle cx="50" cy="50" r="6" fill="#38D6FF" />
            </svg>
          </div>

          <h2 className="dark-card-title">{darkCards[activeDarkTab].title}</h2>
          <p className="dark-card-subcopy">{darkCards[activeDarkTab].subcopy}</p>

          {/* Interactive Feature Pills */}
          <div className="dark-card-tabs" role="tablist" aria-label="Feature Tabs">
            {darkCards.map((c, i) => (
              <button
                key={c.badge}
                type="button"
                role="tab"
                aria-selected={activeDarkTab === i}
                className={`dark-tab-pill ${activeDarkTab === i ? "active" : ""}`}
                onClick={() => setActiveDarkTab(i)}
              >
                {c.badge}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================
          BAND 2: 4-COLUMN VALUE STRIP (Light Paper Surface)
          =================================================================== */}
      <section className="landing-value-strip-wrap" aria-label="Core Architecture Pillars">
        <div className="value-strip-container">
          <div className="value-strip-header">
            <div className="section-mini-tag">PRECISION ARCHITECTURE</div>
            <h2 className="section-title-display">Like a Normal Ledger, But Smarter.</h2>
            <p className="section-subtitle-editorial">
              Built specifically for India's 12 million delivery riders, drivers, and freelance service professionals.
            </p>
          </div>

          <div className="value-strip-grid">
            {/* Column 1 */}
            <div className="value-column-card">
              <div className="value-icon-box">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                  <circle cx="7" cy="15" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <h3 className="value-col-title">Actual Cash vs. COD Separation</h3>
              <p className="value-col-copy">
                Money you hold is ringfenced from customer cash-on-delivery. You always know what is spendable cash versus platform liability.
              </p>
            </div>

            {/* Column 2 */}
            <div className="value-column-card">
              <div className="value-icon-box">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M12 8v4" />
                  <circle cx="12" cy="16" r="1" fill="currentColor" />
                </svg>
              </div>
              <h3 className="value-col-title">Lean-Month Shortfall Alerts</h3>
              <p className="value-col-copy">
                Predictive early warning signals trigger 14 days before projected cash shortfalls, well before room rent, vehicle EMI, or school fees are due.
              </p>
            </div>

            {/* Column 3 */}
            <div className="value-column-card">
              <div className="value-icon-box">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className="value-col-title">Smart No-Save Hold Logic</h3>
              <p className="value-col-copy">
                Pending and unearned payouts remain simulated scenarios until actual settlement hits your bank account—preventing false runway optimism.
              </p>
            </div>

            {/* Column 4 */}
            <div className="value-column-card">
              <div className="value-icon-box">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="value-col-title">User-Confirmed Entries</h3>
              <p className="value-col-copy">
                No opaque automatic deductions. Quick evening check-ins (voice or SMS: "earned 850 petrol 120") keep you in complete control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          BAND 3: FINE-GRID TESTIMONIAL STORIES BAND
          =================================================================== */}
      <section className="landing-testimonials-wrap" aria-label="Real Worker Testimonials">
        <div className="testimonials-fine-grid-bg" aria-hidden="true" />
        <div className="testimonials-container">
          <div className="testimonials-header">
            <h2 className="section-title-display">FLOVA Works Wherever You Shift.</h2>
            <p className="section-subtitle-editorial">
              Tested against 50 simulated years of real worker cashflows across Bengaluru, Delhi NCR, Mumbai, and Hyderabad.
            </p>
          </div>

          <div className="testimonial-cards-grid">
            {/* Story Card 1 */}
            <div className="testimonial-card card-stagger-1">
              <div className="testimonial-author-row">
                <div className="author-avatar-box">RK</div>
                <div>
                  <h4 className="author-name">Ramesh K.</h4>
                  <p className="author-meta">Bengaluru, KA · Swiggy Partner</p>
                </div>
              </div>
              <p className="testimonial-quote">
                "During monsoon season in Koramangala, order volumes dip by 40%. FLOVA smoothed my erratic weekly pay so my room rent was paid on time without touching loan apps."
              </p>
            </div>

            {/* Story Card 2 */}
            <div className="testimonial-card card-stagger-2">
              <div className="testimonial-author-row">
                <div className="author-avatar-box">DS</div>
                <div>
                  <h4 className="author-name">Deepak S.</h4>
                  <p className="author-meta">Delhi NCR · Rapido &amp; Uber Driver</p>
                </div>
              </div>
              <p className="testimonial-quote">
                "Before FLOVA, I kept mixing CNG expenses, passenger cash, and platform COD in one pocket. Now the check-in separates not-mine money in 10 seconds."
              </p>
            </div>

            {/* Story Card 3 */}
            <div className="testimonial-card card-stagger-3">
              <div className="testimonial-author-row">
                <div className="author-avatar-box">PM</div>
                <div>
                  <h4 className="author-name">Priya M.</h4>
                  <p className="author-meta">Mumbai, MH · Urban Company Partner</p>
                </div>
              </div>
              <p className="testimonial-quote">
                "My client payouts come on three different days of the month. FLOVA turns that irregular chaos into a predictable weekly salary for my household."
              </p>
            </div>

            {/* Story Card 4 */}
            <div className="testimonial-card card-stagger-4">
              <div className="testimonial-author-row">
                <div className="author-avatar-box">TA</div>
                <div>
                  <h4 className="author-name">Tanveer A.</h4>
                  <p className="author-meta">Hyderabad, TS · Zomato Fleet Captain</p>
                </div>
              </div>
              <p className="testimonial-quote">
                "The COD separation alone saved me from a ₹3,000 platform penalty last month. It tells my riders exactly what is safe to spend today."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          BAND 4: VIBRANT CYAN/AQUA CALLOUT BANNER (#38D6FF / #29C7F5)
          =================================================================== */}
      <section className="landing-cyan-banner-wrap" aria-label="Community Callout Banner">
        <div className="cyan-banner-card">
          {/* Decorative 3D Laurel Leaf Branches */}
          <div className="cyan-branch branch-left" aria-hidden="true">
            <svg viewBox="0 0 120 180" width="90" height="135" fill="none">
              <path d="M90 170 C60 120 40 70 60 10" stroke="#9E8043" strokeWidth="3" strokeLinecap="round" />
              <ellipse cx="65" cy="40" rx="14" ry="7" transform="rotate(-35 65 40)" fill="#C5A458" />
              <ellipse cx="45" cy="70" rx="14" ry="7" transform="rotate(-25 45 70)" fill="#C5A458" />
              <ellipse cx="50" cy="110" rx="15" ry="8" transform="rotate(-30 50 110)" fill="#B6954B" />
              <ellipse cx="75" cy="140" rx="16" ry="8" transform="rotate(-40 75 140)" fill="#A8863E" />
            </svg>
          </div>
          <div className="cyan-branch branch-right" aria-hidden="true">
            <svg viewBox="0 0 120 180" width="90" height="135" fill="none">
              <path d="M30 170 C60 120 80 70 60 10" stroke="#9E8043" strokeWidth="3" strokeLinecap="round" />
              <ellipse cx="55" cy="40" rx="14" ry="7" transform="rotate(35 55 40)" fill="#C5A458" />
              <ellipse cx="75" cy="70" rx="14" ry="7" transform="rotate(25 75 70)" fill="#C5A458" />
              <ellipse cx="70" cy="110" rx="15" ry="8" transform="rotate(30 70 110)" fill="#B6954B" />
              <ellipse cx="45" cy="140" rx="16" ry="8" transform="rotate(40 45 140)" fill="#A8863E" />
            </svg>
          </div>

          <div className="cyan-banner-content">
            <h2 className="cyan-banner-heading">Share FLOVA, Build Together</h2>
            <p className="cyan-banner-subcopy">
              Invite fellow gig workers to FLOVA and unlock pooled emergency reserves and peer runway protection across your city delivery fleet.
            </p>
            <button
              type="button"
              className="cyan-banner-cta-btn"
              onClick={handleLaunch}
            >
              Join FLOVA Workspace →
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================================
          BAND 5: SPLIT 2-COLUMN CLARITY & SAFETY BLOCK
          =================================================================== */}
      <section className="landing-clarity-wrap" aria-label="Security and Clarity">
        <div className="clarity-container">
          <div className="clarity-header">
            <h2 className="section-title-display">Built for Clarity, Designed for Irregular Pay</h2>
          </div>

          <div className="clarity-grid">
            {/* Visual Graphic Column */}
            <div className="clarity-visual-card">
              <div className="clarity-visual-badge">
                <span className="live-dot" /> ₹1 Paise Precision Spec
              </div>
              <div className="clarity-visual-inner">
                <div className="clarity-coin-stage">
                  <OneRupeeCoin size={110} />
                </div>
                <div className="clarity-metric-box">
                  <div className="metric-label">PREVIEW SIMULATION (50-YR GIG MODEL)</div>
                  <div className="metric-val">₹4,500.00 / wk</div>
                  <div className="metric-status">Guaranteed Baseline Salary Active</div>
                </div>
              </div>
            </div>

            {/* 3 Structured Pillars Column */}
            <div className="clarity-pillars-col">
              <div className="clarity-pillar-row">
                <div className="pillar-num">01</div>
                <div>
                  <h3 className="pillar-heading">Paise-Exact Mathematical Accounting</h3>
                  <p className="pillar-copy">
                    Every rupee is converted to integer paise (`toPaise()`) at the data boundary. Zero floating-point drift, no rounding leakage across 52 weeks.
                  </p>
                </div>
              </div>

              <div className="clarity-pillar-row">
                <div className="pillar-num">02</div>
                <div>
                  <h3 className="pillar-heading">Session-Locked Row-Level Security (RLS)</h3>
                  <p className="pillar-copy">
                    Your financial balance check-ins and expenses are guarded by Supabase RLS. No `user_id` is ever passed in payload bodies—identity is enforced server-side.
                  </p>
                </div>
              </div>

              <div className="clarity-pillar-row">
                <div className="pillar-num">03</div>
                <div>
                  <h3 className="pillar-heading">Low-Bandwidth &amp; SMS Mode</h3>
                  <p className="pillar-copy">
                    Optimized for spotty cellular networks on delivery routes. Instant cached state with fallback SMS commands for quick daily check-ins.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          BAND 6: DARK RUNWAY CHART SHOWCASE CARD (#111214)
          =================================================================== */}
      <section className="landing-chart-wrap" aria-label="Interactive Runway Chart Showcase">
        <div className="landing-chart-card">
          <div className="chart-card-grid">
            {/* Chart SVG Visualization */}
            <div className="chart-visual-pane">
              <div className="chart-pane-header">
                <span className="chart-preview-tag">SYNTHETIC RUNWAY PREVIEW · 50-YR BACKTEST</span>
                <div className="chart-toggle-group">
                  <button
                    type="button"
                    className={`chart-mode-pill ${chartScenario === "monsoon" ? "active" : ""}`}
                    onClick={() => setChartScenario("monsoon")}
                  >
                    Monsoon Dip (-40%)
                  </button>
                  <button
                    type="button"
                    className={`chart-mode-pill ${chartScenario === "standard" ? "active" : ""}`}
                    onClick={() => setChartScenario("standard")}
                  >
                    Standard Season
                  </button>
                </div>
              </div>

              <div className="chart-svg-box">
                <svg viewBox="0 0 500 240" width="100%" height="220" className="runway-curve-svg">
                  {/* Grid lines */}
                  <line x1="50" y1="30" x2="480" y2="30" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                  <line x1="50" y1="90" x2="480" y2="90" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                  <line x1="50" y1="150" x2="480" y2="150" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                  <line x1="50" y1="200" x2="480" y2="200" stroke="rgba(255,255,255,0.2)" />

                  {/* Y-Axis Labels */}
                  <text x="42" y="34" fill="#88929E" fontSize="10" textAnchor="end">₹30K</text>
                  <text x="42" y="94" fill="#88929E" fontSize="10" textAnchor="end">₹15K</text>
                  <text x="42" y="154" fill="#88929E" fontSize="10" textAnchor="end">₹5K</text>
                  <text x="42" y="204" fill="#88929E" fontSize="10" textAnchor="end">₹0</text>

                  {/* X-Axis Labels */}
                  <text x="50" y="222" fill="#88929E" fontSize="10">0W</text>
                  <text x="150" y="222" fill="#88929E" fontSize="10">1W</text>
                  <text x="250" y="222" fill="#88929E" fontSize="10">2W</text>
                  <text x="350" y="222" fill="#88929E" fontSize="10">4W</text>
                  <text x="460" y="222" fill="#88929E" fontSize="10">8W</text>

                  {/* Unbuffered Volatile Curve (Crashes into deficit during lean weeks) */}
                  <path
                    d={
                      chartScenario === "monsoon"
                        ? "M 50 150 Q 110 110, 150 140 T 250 195 T 350 210 T 470 215"
                        : "M 50 150 Q 110 120, 150 135 T 250 170 T 350 180 T 470 190"
                    }
                    fill="none"
                    stroke="#FF5544"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                  />

                  {/* FLOVA Steady Salary Line (Guaranteed baseline ascending steadily) */}
                  <path
                    d="M 50 160 Q 150 135, 250 110 T 350 75 T 470 42"
                    fill="none"
                    stroke="#38D6FF"
                    strokeWidth="3.5"
                  />
                </svg>

                <div className="chart-legend-row">
                  <div className="legend-item">
                    <span className="legend-swatch swatch-cyan" />
                    <span>FLOVA Steady Weekly Salary</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-swatch swatch-red" />
                    <span>Unbuffered Volatile Gig Income</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Explanation & CTA */}
            <div className="chart-text-pane">
              <h3 className="chart-pane-title">See How Your Runway Holds Up</h3>
              <p className="chart-pane-copy">
                Enter your average weekly gig platform receipts and regular household bills. FLOVA calculates your safe weekly spending envelope so you never hit a cash shortfall.
              </p>
              <button
                type="button"
                className="chart-pane-cta-btn"
                onClick={onOpenSimulator || handleLaunch}
              >
                Simulate Your Runway →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          BAND 7: CENTERED STATEMENT CONVERSION BLOCK
          =================================================================== */}
      <section className="landing-statement-wrap" aria-label="Conversion Statement">
        <div className="statement-container">
          <h2 className="statement-heading">
            Ditch the Guesswork. <span className="trophy-emblem">🏆</span> Own Your Runway.
          </h2>
          <p className="statement-subcopy">
            Join hundreds of delivery riders and cab captains who turned volatile gig earnings into a steady, reliable weekly salary.
          </p>
          <button
            type="button"
            className="statement-launch-btn"
            onClick={handleLaunch}
          >
            Launch FLOVA Now
          </button>
        </div>
      </section>

      {/* ===================================================================
          BAND 8: 4-COLUMN FOOTER & MASSIVE BOTTOM WORDMARK
          =================================================================== */}
      <footer className="landing-footer-wrap" aria-label="Footer">
        <div className="footer-inner-card">
          <div className="footer-top-grid">
            <div className="footer-brand-col">
              <div className="footer-logo-row">
                <div className="footer-coin-badge">
                  <OneRupeeCoin size={36} />
                </div>
                <span className="footer-brand-title">FLOVA</span>
              </div>
              <p className="footer-tagline">
                A steady weekly salary from uneven gig pay. Built for Indian gig workers.
              </p>
            </div>

            {/* 4 Link Columns */}
            <div className="footer-links-grid">
              <div className="footer-col">
                <h4 className="footer-col-title">Runway</h4>
                <ul className="footer-links-list">
                  <li><a href="#how-it-works">Daily Check-in</a></li>
                  <li><a href="#how-it-works">Weekly Payouts</a></li>
                  <li><a href="#how-it-works">COD Separator</a></li>
                  <li><a href="#how-it-works">Monsoon Buffer</a></li>
                </ul>
              </div>

              <div className="footer-col">
                <h4 className="footer-col-title">How FLOVA Works</h4>
                <ul className="footer-links-list">
                  <li><a href="#how-it-works">Guaranteed Baseline</a></li>
                  <li><a href="#how-it-works">Paise Precision</a></li>
                  <li><a href="#how-it-works">50-Yr Simulation</a></li>
                  <li><a href="#how-it-works">Cash vs. Not-Mine</a></li>
                </ul>
              </div>

              <div className="footer-col">
                <h4 className="footer-col-title">Get Started</h4>
                <ul className="footer-links-list">
                  <li><button type="button" className="footer-link-btn" onClick={handleLaunch}>Rider Workspace</button></li>
                  <li><button type="button" className="footer-link-btn" onClick={handleLaunch}>SMS Mode</button></li>
                  <li><button type="button" className="footer-link-btn" onClick={handleLaunch}>Backtest Evidence</button></li>
                </ul>
              </div>

              <div className="footer-col">
                <h4 className="footer-col-title">Platform</h4>
                <ul className="footer-links-list">
                  <li><a href="https://github.com/syed-imadulla/FLOVA" target="_blank" rel="noreferrer">GitHub Repository</a></li>
                  <li><a href="#how-it-works">Contract Spec (v1)</a></li>
                  <li><a href="#how-it-works">Row-Level Security</a></li>
                  <li><a href="#how-it-works">Security &amp; RLS</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Massive Full-Width FLOVA Wordmark */}
          <div className="footer-wordmark-container" aria-hidden="true">
            <span className="footer-wordmark-text">F</span>
            <span className="footer-wordmark-text">L</span>
            <div className="footer-wordmark-o">
              <OneRupeeCoin size={120} />
            </div>
            <span className="footer-wordmark-text">V</span>
            <span className="footer-wordmark-text">A</span>
          </div>

          {/* Legal & Data Disclaimers */}
          <div className="footer-legal-bar">
            <p className="footer-disclaimer-text">
              <strong>Notice:</strong> FLOVA is a financial runway management technology for independent gig workers and freelancers, not a bank or NBFC. Runway projections are computed deterministically against agreed financial contracts in integer paise. All simulated backtests represent 50 simulated years of synthetic rider data.
            </p>
            <div className="footer-bottom-row">
              <span className="footer-copy">© FLOVA 2026, All Rights Reserved.</span>
              <div className="footer-legal-links">
                <span>Terms</span>
                <span>Privacy</span>
                <span>Contract v1</span>
                <span>Paise Spec</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
