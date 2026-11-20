import React, { useState, useEffect, useCallback, useRef } from "react";

interface HeroSectionProps {
  onLaunch?: () => void;
  onSelectTab?: (tab: "week" | "sms" | "evidence") => void;
  activeTab?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onLaunch,
  onSelectTab,
  activeTab = "week",
}) => {
  const [headlineMode, setHeadlineMode] = useState<"money" | "runway">("money");
  const [fontSizeToggle, setFontSizeToggle] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [targetPos, setTargetPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const heroRef = useRef<HTMLElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Smooth damped parallax tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
    setTargetPos({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTargetPos({ x: 0, y: 0 });
  }, []);

  // Spring lerp for smooth parallax
  useEffect(() => {
    let currentX = mousePos.x;
    let currentY = mousePos.y;

    const tick = () => {
      currentX += (targetPos.x - currentX) * 0.08;
      currentY += (targetPos.y - currentY) * 0.08;
      setMousePos({ x: currentX, y: currentY });
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targetPos]);

  const scrollToApp = () => {
    if (onLaunch) {
      onLaunch();
    }
    const target = document.getElementById("flova-app-stage");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      ref={heroRef}
      className={`flova-hero-stage ${fontSizeToggle ? "hero-expanded" : ""}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label="FLOVA Landing Experience"
    >
      {/* 1. Canvas, Grid & Vignette Framing */}
      <div
        className="hero-grid-canvas"
        style={{
          transform: `translate3d(${mousePos.x * 4}px, ${mousePos.y * 4}px, 0)`,
        }}
      />
      <div className="hero-vignette-overlay" />

      {/* Margin Compass / Grid Notations (N & S on right margin line) */}
      <div className="hero-margin-markers" aria-hidden="true">
        <span className="hero-coord hero-coord-n">N</span>
        <span className="hero-coord hero-coord-s">S</span>
      </div>

      {/* 2. Top Navigation Bar */}
      <header className="hero-nav-bar">
        <div className="hero-nav-left">
          <span className="hero-brand">FLOVA</span>
          <span className="hero-edition-tag">2026 Edition</span>
        </div>

        <nav className="hero-nav-center" aria-label="Main Navigation">
          <a
            href="#intro"
            className="hero-nav-link active"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Intro
          </a>
          <button
            type="button"
            className={`hero-nav-link ${activeTab === "evidence" ? "active" : ""}`}
            onClick={() => {
              if (onSelectTab) onSelectTab("evidence");
              scrollToApp();
            }}
          >
            How It Works
          </button>
          <button
            type="button"
            className={`hero-nav-link ${activeTab === "week" ? "active" : ""}`}
            onClick={() => {
              if (onSelectTab) onSelectTab("week");
              scrollToApp();
            }}
          >
            About
          </button>

          {/* Compact Pill Button ("Aa" typography / size feedback) */}
          <button
            type="button"
            className={`hero-pill-btn ${fontSizeToggle ? "active" : ""}`}
            onClick={() => setFontSizeToggle(!fontSizeToggle)}
            title="Toggle editorial display scale"
            aria-label="Toggle scale"
          >
            Aa
          </button>
        </nav>

        <div className="hero-nav-right">
          <span className="hero-secondary-badge" title="24-Hour Hackathon Build">
            <s>$0/mo</s> Free MVP
          </span>
          <button
            type="button"
            className="hero-primary-cta"
            onClick={scrollToApp}
            aria-label="Launch Runway"
          >
            Launch Runway <span className="hero-cta-arrow">→</span>
          </button>
        </div>
      </header>

      {/* 3. Centered Display Lockup & Layered Depth Stage */}
      <div className="hero-lockup-stage">
        {/* Eyebrow in italic editorial serif */}
        <p
          className="hero-eyebrow"
          style={{
            transform: `translate3d(${mousePos.x * -2}px, ${mousePos.y * -2}px, 0)`,
          }}
        >
          Make your money move smarter
        </p>

        {/* Massive Two-Line Condensed Display Headline */}
        <div
          className="hero-display-headline"
          onClick={() => setHeadlineMode((m) => (m === "money" ? "runway" : "money"))}
          title="Click to toggle display wording (MONEY / RUNWAY)"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setHeadlineMode((m) => (m === "money" ? "runway" : "money"));
            }
          }}
          style={{
            cursor: "pointer",
            pointerEvents: "auto",
            transform: `translate3d(${mousePos.x * -6}px, ${mousePos.y * -6}px, 0)`,
          }}
        >
          {/* Top Line: starts translucent and fades to deep emerald */}
          <div className="hero-headline-line line-top" aria-label={headlineMode === "money" ? "MONEY" : "RUNWAY"}>
            {headlineMode === "money" ? (
              <div className="headline-text-flanked">
                <span className="flank-left">M&nbsp;O</span>
                <span className="flank-gap" aria-hidden="true">
                  <span className="hidden-letter">N</span>
                </span>
                <span className="flank-right">E&nbsp;Y</span>
              </div>
            ) : (
              <div className="headline-text-flanked">
                <span className="flank-left">R&nbsp;U</span>
                <span className="flank-gap" aria-hidden="true">
                  <span className="hidden-letter">N</span>
                </span>
                <span className="flank-right">W&nbsp;Y</span>
              </div>
            )}
          </div>

          {/* Bottom Line: rises & fades smoothly behind centerpiece */}
          <div className="hero-headline-line line-bottom" aria-label="IN CHECK">
            <div className="headline-text-flanked">
              <span className="flank-left-wide">
                <span className="word-in">I&nbsp;N</span>
                <span className="word-c">C</span>
              </span>
              <span className="flank-gap" aria-hidden="true">
                <span className="hidden-letter">H</span>
              </span>
              <span className="flank-right">E&nbsp;C&nbsp;K</span>
            </div>
          </div>
        </div>

        {/* 4. Central Focal Visual (sculpted centerpiece with micro-float) */}
        <div
          className="hero-centerpiece-container"
          style={{
            transform: `translate3d(${mousePos.x * 12}px, ${mousePos.y * 12}px, 0)`,
          }}
          aria-hidden="true"
        >
          <img
            src="/hero/centerpiece.png"
            alt="FLOVA Chess Knight Cash Centerpiece"
            className="hero-centerpiece-img"
            loading="eager"
          />
        </div>

        {/* Standing Minimalist Human Figure Silhouette near lower-left of bottom word */}
        <div
          className="hero-figure-wrapper"
          style={{
            transform: `translate3d(${mousePos.x * 8}px, ${mousePos.y * 8}px, 0)`,
          }}
          aria-hidden="true"
        >
          <img
            src="/hero/man.png"
            alt="Standing figure silhouette"
            className="hero-figure-img"
          />
          {/* Subtle animated ambient smoke puff */}
          <div className="smoke-ambient-puff" />
        </div>

        {/* Subtitle in centered editorial serif */}
        <p
          className="hero-subtitle"
          style={{
            transform: `translate3d(${mousePos.x * -2}px, ${mousePos.y * -2}px, 0)`,
          }}
        >
          Adaptive runway for irregular income
        </p>

        {/* Centered Scroll Mouse Diagram Emblem */}
        <button
          type="button"
          className="hero-scroll-emblem"
          onClick={scrollToApp}
          title="Scroll to FLOVA interactive runway"
          aria-label="Scroll down to app"
          style={{
            transform: `translate3d(${mousePos.x * -1}px, ${mousePos.y * -1}px, 0)`,
          }}
        >
          <div className="scroll-arc-text">
            <span>s</span>
            <span>c</span>
            <span>r</span>
            <span>o</span>
            <span>l</span>
            <span>l</span>
          </div>
          <svg
            className="scroll-mouse-icon"
            viewBox="0 0 24 38"
            width="18"
            height="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="2" y="2" width="20" height="34" rx="10" stroke="#2B3632" />
            <line x1="12" y1="8" x2="12" y2="15" stroke="#2B3632" strokeLinecap="round" className="scroll-wheel" />
            <path d="M9 25L12 28L15 25" stroke="#2B3632" strokeLinecap="round" strokeLinejoin="round" className="scroll-chevron" />
          </svg>
        </button>

        {/* 5. Hand-Drawn Sketch Markers & Index Labels */}
        <div className="hero-sketch-layer" aria-hidden="true">
          {/* Upper-left flourish & index */}
          <span className="sketch-mark mark-e4" style={{ transform: `translate3d(${mousePos.x * -4}px, ${mousePos.y * -4}px, 0)` }}>
            e4
          </span>
          <span className="sketch-mark mark-e5" style={{ transform: `translate3d(${mousePos.x * -5}px, ${mousePos.y * -5}px, 0)` }}>
            e5
          </span>

          {/* Left-center and right-center sketch labels flanking the centerpiece */}
          <span className="sketch-mark mark-nf3" style={{ transform: `translate3d(${mousePos.x * 6}px, ${mousePos.y * 6}px, 0)` }}>
            Nf3
          </span>
          <span className="sketch-mark mark-nc6" style={{ transform: `translate3d(${mousePos.x * 6}px, ${mousePos.y * 6}px, 0)` }}>
            Nc6
          </span>

          {/* Right-side sketch markers */}
          <span className="sketch-mark mark-bc4" style={{ transform: `translate3d(${mousePos.x * -4}px, ${mousePos.y * -4}px, 0)` }}>
            Bc4
          </span>
          <span className="sketch-mark mark-bc5" style={{ transform: `translate3d(${mousePos.x * -3}px, ${mousePos.y * -3}px, 0)` }}>
            Bc5
          </span>

          {/* Lower sketch notations */}
          <span className="sketch-mark mark-c3">c3</span>
          <span className="sketch-mark mark-d6">d6</span>
          <span className="sketch-mark mark-d3">d3</span>
          <span className="sketch-mark mark-castling">0-0</span>
        </div>

        {/* Circular Roman Coin Graphic entering from top right and rolling down */}
        <div
          className="hero-coin-container"
          style={{
            transform: `translate3d(${mousePos.x * 16}px, ${mousePos.y * 16}px, 0)`,
          }}
          aria-hidden="true"
        >
          <img
            src="/hero/coin.png"
            alt="Antique Coin Medallion"
            className="hero-coin-img"
          />
        </div>

        {/* Partial Corner Card/Note Peeking Up from Bottom-Left Corner */}
        <div className="hero-corner-bill-container" aria-hidden="true">
          <img
            src="/hero/corner_bill.png"
            alt="Banknote corner"
            className="hero-corner-bill-img"
          />
        </div>
      </div>
    </section>
  );
};
