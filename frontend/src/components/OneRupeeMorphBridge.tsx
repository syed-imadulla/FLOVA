import React, { useEffect, useState, useRef } from "react";
import { OneRupeeCoin } from "./OneRupeeCoin";

interface MorphBridgeProps {
  onScrollToNext?: () => void;
}

export const OneRupeeMorphBridge: React.FC<MorphBridgeProps> = () => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate scroll progress from when top of bridge reaches window to when bottom reaches
      const start = windowHeight;
      const end = -rect.height;
      const current = rect.top;
      
      const raw = (start - current) / (start - end);
      const clamped = Math.min(Math.max(raw, 0), 1);
      setScrollProgress(clamped);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Compute transform and opacity based on scrollProgress
  // Phase 1 (0 to 0.45): Coin enlarges and travels to center
  // Phase 2 (0.45 to 0.85): Coin morphs into 3D metallic ring emblem
  // Phase 3 (0.85 to 1.0): Fully anchored inside dark card header
  const coinScale = 1 + scrollProgress * 0.9; // 1x to 1.9x
  const coinRotation = scrollProgress * 540; // Spun over 1.5 rotations
  const morphFade = Math.min(Math.max((scrollProgress - 0.35) / 0.35, 0), 1); // 0 -> 1

  return (
    <div ref={containerRef} className="one-rupee-morph-bridge-zone" aria-hidden="true">
      {/* Scroll-Driven Floating Morph Element */}
      <div
        className="morphing-coin-anchor"
        style={{
          transform: `translate3d(0, ${scrollProgress * 60}px, 0)`,
        }}
      >
        {/* Layer A: Indian 1-Rupee Coin */}
        <div
          className="morph-coin-face"
          style={{
            opacity: 1 - morphFade,
            transform: `scale(${coinScale}) rotate(${coinRotation}deg)`,
            transition: "opacity 0.2s ease",
          }}
        >
          <OneRupeeCoin size={84} />
        </div>

        {/* Layer B: 3D Chrome Metallic Interlocking Runway Ring / Emblem */}
        <div
          className="morph-emblem-face"
          style={{
            opacity: morphFade,
            transform: `scale(${coinScale * 0.9}) rotate(${coinRotation * 0.5}deg)`,
            transition: "opacity 0.2s ease",
          }}
        >
          <svg viewBox="0 0 100 100" width="84" height="84" className="metallic-runway-emblem">
            <defs>
              <linearGradient id="chromeKnot1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="35%" stopColor="#CCD3DD" />
                <stop offset="70%" stopColor="#6C7582" />
                <stop offset="100%" stopColor="#1B2026" />
              </linearGradient>
              <linearGradient id="chromeKnot2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E2E7EE" />
                <stop offset="50%" stopColor="#8A95A5" />
                <stop offset="100%" stopColor="#303844" />
              </linearGradient>
              <filter id="chromeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Interlocking 3D Armillary Rings */}
            <ellipse
              cx="50"
              cy="50"
              rx="42"
              ry="24"
              transform="rotate(-25 50 50)"
              fill="none"
              stroke="url(#chromeKnot1)"
              strokeWidth="4"
              filter="url(#chromeGlow)"
            />
            <ellipse
              cx="50"
              cy="50"
              rx="42"
              ry="24"
              transform="rotate(35 50 50)"
              fill="none"
              stroke="url(#chromeKnot2)"
              strokeWidth="4"
            />
            <circle cx="50" cy="50" r="14" fill="#111316" stroke="url(#chromeKnot1)" strokeWidth="3" />
            <circle cx="50" cy="50" r="6" fill="#38D6FF" />
          </svg>
        </div>
      </div>
    </div>
  );
};
