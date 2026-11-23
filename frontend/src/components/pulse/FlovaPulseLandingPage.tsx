import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FlovaPulseNavbar } from "./FlovaPulseNavbar";
import { FlovaHeroSlider } from "./FlovaHeroSlider";
import { FlovaFeaturePillars } from "./FlovaFeaturePillars";
import { FlovaConcentricShowcase } from "./FlovaConcentricShowcase";
import { FlovaBillsAndUtilities } from "./FlovaBillsAndUtilities";
import { FlovaTransitSection } from "./FlovaTransitSection";
import { FlovaQuickTrustCarousel } from "./FlovaQuickTrustCarousel";
import { FlovaSavingsGrowSection } from "./FlovaSavingsGrowSection";
import { FlovaPanIndiaBanner } from "./FlovaPanIndiaBanner";
import { FlovaDeviceGrid } from "./FlovaDeviceGrid";
import { FlovaBrandOrbitalFooter } from "./FlovaBrandOrbitalFooter";

export type Tab = "week" | "sms" | "evidence";

interface FlovaPulseLandingPageProps {
  tab?: Tab;
  setTab?: (tab: Tab) => void;
  riderId?: number | null;
  onRider?: (id: number | null) => void;
}

export const FlovaPulseLandingPage: React.FC<FlovaPulseLandingPageProps> = () => {
  const navigate = useNavigate();

  const handleLaunchRunway = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  const scrollToSolutions = useCallback(() => {
    const el = document.getElementById("solutions");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="flova-pulse-page selection:bg-[#5f259f] selection:text-white">
      {/* 1. Sticky Top Navigation Bar */}
      <FlovaPulseNavbar onLaunchStage={handleLaunchRunway} />

      {/* Main Section Cadence */}
      <main>
        {/* SECTION 1 — PRIMARY SLIDING HERO SHOWCASE */}
        <FlovaHeroSlider
          onExplore={scrollToSolutions}
          onLaunchStage={handleLaunchRunway}
        />

        {/* SECTION 2 — 4-PILLAR ELEVATED CARDS ROW (Payments, Investments, Insurance, Lending) */}
        <FlovaFeaturePillars
          onExploreSolutions={scrollToSolutions}
          onLaunchStage={handleLaunchRunway}
        />

        {/* SECTION 3 — CONCENTRIC RINGS DARK-NAVY TRANSACTIONS SHOWCASE */}
        <FlovaConcentricShowcase />

        {/* SECTION 4 — "CONVENIENCE AT YOUR FINGERTIPS" RECEIPT & BILL CAPSULES */}
        <FlovaBillsAndUtilities />

        {/* SECTION 5 — "TRAVEL, STAYS & COMMUTE" 4-CARD TRANSIT ROW */}
        <FlovaTransitSection onExplore={handleLaunchRunway} />

        {/* SECTION 6 — "PAYMENTS ON FLOVA ARE SAFE, RELIABLE, AND QUICK" + CAROUSEL */}
        <FlovaQuickTrustCarousel />

        {/* SECTION 7 — "SMART SAVINGS START HERE" STACKED STADIUM CAPSULES */}
        <FlovaSavingsGrowSection />

        {/* SECTION 8 — "FLOVA INTERNATIONAL & PAN-INDIA" COUNTRY FLAGS CONTAINER */}
        <FlovaPanIndiaBanner />

        {/* SECTION 9 — "ACCEPT PAYMENTS EVERYWHERE" DOT WAVE ARCH + SOUNDBOX */}
        <FlovaDeviceGrid />

        {/* SECTION 10 — ORBITAL INDIA STACK + 5-COL DIRECTORY FOOTER */}
        <FlovaBrandOrbitalFooter />
      </main>
    </div>
  );
};
