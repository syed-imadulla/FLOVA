import React, { useState, useEffect, useCallback } from "react";

interface PhonePeHeroSliderProps {
  onExplore?: () => void;
  onLaunchStage: () => void;
}

interface SlideData {
  id: string;
  headline: string;
  ctaText: string;
  themeColor: string;
  haloClass: string;
  badgeBg: string;
  phoneHeader: string;
  phoneTitle: string;
  phoneSubtitle: string;
  badges: {
    topLeft: { text: string; icon: React.ReactNode; bg: string };
    bottomLeft: { text: string; icon: React.ReactNode; bg: string };
    right: { text: string; icon: React.ReactNode; bg: string };
  };
}

export const PhonePeHeroSlider: React.FC<PhonePeHeroSliderProps> = ({
  onExplore,
  onLaunchStage,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides: SlideData[] = [
    {
      id: "appstore",
      headline: "More Than Just Apps",
      ctaText: "Explore Now",
      themeColor: "#d84315",
      haloClass: "from-orange-500/25 via-orange-100/40 to-transparent",
      badgeBg: "#e65100",
      phoneHeader: "INTRODUCING",
      phoneTitle: "FLOVA Appstore",
      phoneSubtitle: "One-tap micro-apps for platform fuel, instant chai breaks, and gig repairs.",
      badges: {
        topLeft: {
          text: "APPS",
          bg: "#673ab7",
          icon: (
            <div className="w-5 h-5 rounded-md bg-white/20 grid grid-cols-2 gap-0.5 p-1">
              <span className="bg-amber-300 rounded-[2px]" />
              <span className="bg-pink-300 rounded-[2px]" />
              <span className="bg-purple-300 rounded-[2px]" />
              <span className="bg-emerald-300 rounded-[2px]" />
            </div>
          ),
        },
        bottomLeft: {
          text: "TOP-UPS",
          bg: "#673ab7",
          icon: (
            <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-amber-950 font-black text-[11px] shadow-xs">
              ₹
            </div>
          ),
        },
        right: {
          text: "GIFT CARDS",
          bg: "#673ab7",
          icon: (
            <div className="w-6 h-4 rounded bg-[#26a69a] border border-white/60 flex items-center justify-center relative shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="absolute -top-1 w-2.5 h-1 bg-red-400 rounded-full" />
            </div>
          ),
        },
      },
    },
    {
      id: "runway",
      headline: "Make Your Money Move Smarter",
      ctaText: "Launch Runway",
      themeColor: "#5f259f",
      haloClass: "from-purple-600/25 via-purple-100/40 to-transparent",
      badgeBg: "#5f259f",
      phoneHeader: "PREDICTABLE PAYCHECKS",
      phoneTitle: "FLOVA Runway",
      phoneSubtitle: "Shield your earnings against monsoon order slumps and late settlements.",
      badges: {
        topLeft: {
          text: "FAST CAPTURE",
          bg: "#0d9488",
          icon: (
            <div className="w-5 h-5 rounded-full bg-emerald-300 flex items-center justify-center text-teal-900 font-bold text-xs">
              ⚡
            </div>
          ),
        },
        bottomLeft: {
          text: "COD SHIELD",
          bg: "#d97706",
          icon: (
            <div className="w-5 h-5 rounded-full bg-amber-300 flex items-center justify-center text-amber-950 font-bold text-xs">
              🔒
            </div>
          ),
        },
        right: {
          text: "WEEKLY SALARY",
          bg: "#5f259f",
          icon: (
            <div className="w-5 h-5 rounded-full bg-purple-300 flex items-center justify-center text-purple-950 font-bold text-xs">
              ₹
            </div>
          ),
        },
      },
    },
    {
      id: "transactions",
      headline: "Simple, Fast & Secure Transactions",
      ctaText: "Explore Payouts",
      themeColor: "#0284c7",
      haloClass: "from-sky-500/25 via-sky-100/40 to-transparent",
      badgeBg: "#0284c7",
      phoneHeader: "INSTANT SETTLEMENT",
      phoneTitle: "FLOVA Pay",
      phoneSubtitle: "Zero-PIN low-value fuel checkouts & verified delivery advances.",
      badges: {
        topLeft: {
          text: "UPI LITE",
          bg: "#db2777",
          icon: (
            <div className="w-5 h-5 rounded-full bg-pink-200 flex items-center justify-center text-pink-900 font-bold text-[10px]">
              UPI
            </div>
          ),
        },
        bottomLeft: {
          text: "SLUMP BUFFER",
          bg: "#2563eb",
          icon: (
            <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-blue-900 font-bold text-xs">
              🛡️
            </div>
          ),
        },
        right: {
          text: "CREDIT LINE",
          bg: "#0284c7",
          icon: (
            <div className="w-5 h-5 rounded-full bg-sky-200 flex items-center justify-center text-sky-900 font-bold text-xs">
              ✓
            </div>
          ),
        },
      },
    },
    {
      id: "savings",
      headline: "Smart Savings For Everyday Wins",
      ctaText: "Start Saving",
      themeColor: "#b45309",
      haloClass: "from-amber-500/25 via-amber-100/40 to-transparent",
      badgeBg: "#b45309",
      phoneHeader: "GROW WEALTH",
      phoneTitle: "FLOVA WISH & Gold",
      phoneSubtitle: "24K pure digital gold starting from ₹5, plus goal-based buffer vaults.",
      badges: {
        topLeft: {
          text: "24K GOLD",
          bg: "#7c3aed",
          icon: (
            <div className="w-5 h-5 rounded-full bg-amber-300 flex items-center justify-center text-amber-950 font-bold text-[10px]">
              24K
            </div>
          ),
        },
        bottomLeft: {
          text: "GOLD SIP",
          bg: "#7c3aed",
          icon: (
            <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-amber-950 font-black text-xs">
              ₹
            </div>
          ),
        },
        right: {
          text: "FLOVA WISH",
          bg: "#e11d48",
          icon: (
            <div className="w-5 h-5 rounded-full bg-rose-200 flex items-center justify-center text-rose-950 font-bold text-xs">
              ★
            </div>
          ),
        },
      },
    },
  ];

  const totalDots = 8;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-advance slides every 5.5 seconds unless paused
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  const slide = slides[currentSlide];

  return (
    <section
      id="hero-slider"
      className="relative pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Radiant Glowing Halo Background (Interpolates per slide theme) */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[720px] rounded-full pointer-events-none transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${slide.themeColor}33 0%, ${slide.themeColor}12 40%, transparent 70%)`,
        }}
      />

      <div className="max-w-5xl mx-auto relative z-10 text-center">
        {/* Main Slide Headline (Matching Reference Screenshot) */}
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 transition-colors duration-500 leading-tight"
          style={{ color: slide.themeColor }}
        >
          {slide.headline}
        </h1>

        {/* CTA Button */}
        <div className="flex justify-center mb-10 sm:mb-12">
          <button
            onClick={onExplore || onLaunchStage}
            className="px-8 py-3 rounded-full text-white text-sm font-bold tracking-wide shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 cursor-pointer"
            style={{ backgroundColor: slide.themeColor }}
          >
            {slide.ctaText}
          </button>
        </div>

        {/* Smartphone Hardware Frame & Orbiting Pills */}
        <div className="relative max-w-sm sm:max-w-md mx-auto pt-2">
          {/* Left Arrow Button */}
          <button
            onClick={prevSlide}
            className="absolute left-[-20px] sm:left-[-60px] top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md border border-slate-200 flex items-center justify-center font-bold text-lg transition-all hover:scale-110 active:scale-95"
            aria-label="Previous slide"
          >
            ‹
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={nextSlide}
            className="absolute right-[-20px] sm:right-[-60px] top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md border border-slate-200 flex items-center justify-center font-bold text-lg transition-all hover:scale-110 active:scale-95"
            aria-label="Next slide"
          >
            ›
          </button>

          {/* Floating Pill Badge 1: Top-Left (Matching Reference) */}
          <div
            key={`badge-top-${currentSlide}`}
            className="absolute top-12 -left-4 sm:-left-14 z-20 flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-white shadow-xl animate-phonepe-float border border-white/20 transition-all duration-500"
            style={{ backgroundColor: slide.badges.topLeft.bg }}
          >
            {slide.badges.topLeft.icon}
            <span className="text-[11px] sm:text-xs font-black tracking-wider uppercase">
              {slide.badges.topLeft.text}
            </span>
          </div>

          {/* Floating Pill Badge 2: Bottom-Left (Matching Reference) */}
          <div
            key={`badge-bottom-${currentSlide}`}
            className="absolute bottom-24 -left-6 sm:-left-16 z-20 flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-white shadow-xl animate-phonepe-float border border-white/20 transition-all duration-500"
            style={{ backgroundColor: slide.badges.bottomLeft.bg, animationDelay: "1.2s" }}
          >
            {slide.badges.bottomLeft.icon}
            <span className="text-[11px] sm:text-xs font-black tracking-wider uppercase">
              {slide.badges.bottomLeft.text}
            </span>
          </div>

          {/* Floating Pill Badge 3: Right (Matching Reference) */}
          <div
            key={`badge-right-${currentSlide}`}
            className="absolute top-36 -right-6 sm:-right-14 z-20 flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-white shadow-xl animate-phonepe-float border border-white/20 transition-all duration-500"
            style={{ backgroundColor: slide.badges.right.bg, animationDelay: "0.7s" }}
          >
            <span className="text-[11px] sm:text-xs font-black tracking-wider uppercase">
              {slide.badges.right.text}
            </span>
            {slide.badges.right.icon}
          </div>

          {/* Smartphone Hardware Frame */}
          <div className="mx-auto w-[290px] sm:w-[325px] bg-[#1a1a1a] rounded-[52px] p-3.5 shadow-2xl border-4 border-slate-700/80">
            {/* Screen */}
            <div className="bg-white rounded-[42px] pt-7 pb-6 px-6 flex flex-col items-center justify-between min-h-[480px] relative overflow-hidden border border-slate-100">
              {/* Dynamic Island / Notch */}
              <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-6" />

              {/* Screen Inner Content (Animated on Slide Change) */}
              <div
                key={`screen-content-${currentSlide}`}
                className="text-center my-auto transition-all duration-500 animate-fadeIn"
              >
                <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase block mb-3">
                  {slide.phoneHeader}
                </span>

                {/* Circular Brand Placeholder Emblem with 'F' (NO PhonePe logo) */}
                <div
                  className="w-20 h-20 mx-auto rounded-full text-white flex items-center justify-center shadow-lg mb-4 transition-transform duration-300 hover:scale-105"
                  style={{ backgroundColor: slide.badgeBg }}
                >
                  <span className="text-3xl font-black tracking-tight leading-none select-none">
                    F
                  </span>
                </div>

                <div
                  className="text-2xl font-black tracking-tight leading-tight"
                  style={{ color: slide.themeColor }}
                >
                  {slide.phoneTitle}
                </div>

                <p className="text-[11.5px] text-slate-500 mt-3 max-w-[210px] mx-auto leading-relaxed">
                  {slide.phoneSubtitle}
                </p>
              </div>

              {/* Carousel Pagination Dots at Bottom of Phone (Matching Reference: [ === ] • • • • • • •) */}
              <div className="flex items-center gap-1.5 mt-6 cursor-pointer">
                {Array.from({ length: totalDots }).map((_, index) => {
                  const isActive = index === (currentSlide % totalDots);
                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index % slides.length)}
                      className="transition-all duration-300 focus:outline-none"
                      aria-label={`Go to slide ${index + 1}`}
                    >
                      {isActive ? (
                        <span
                          className="w-7 h-2 rounded-full block transition-all duration-300 shadow-xs"
                          style={{ backgroundColor: slide.themeColor }}
                        />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-200 hover:bg-slate-300 block transition-colors" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
