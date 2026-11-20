import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PhonePeNavbar } from "./PhonePeNavbar";
import { PhonePeHeroSlider } from "./PhonePeHeroSlider";
import { PhonePeHeroPillars } from "./PhonePeHeroPillars";
import { PhonePeConcentricSection } from "./PhonePeConcentricSection";
import { PhonePeConvenienceBills } from "./PhonePeConvenienceBills";
import { PhonePeTransitRow } from "./PhonePeTransitRow";
import { PhonePeSafeQuickCarousel } from "./PhonePeSafeQuickCarousel";
import { PhonePeSmartSavings } from "./PhonePeSmartSavings";
import { PhonePePanIndiaBanner } from "./PhonePePanIndiaBanner";
import { PhonePeDotWaveDevices } from "./PhonePeDotWaveDevices";
import { PhonePeOrbitalFooter } from "./PhonePeOrbitalFooter";

export type Tab = "week" | "sms" | "evidence";

interface PhonePeLandingPageProps {
  tab?: Tab;
  setTab?: (tab: Tab) => void;
  riderId?: number | null;
  onRider?: (id: number | null) => void;
}

export const PhonePeLandingPage: React.FC<PhonePeLandingPageProps> = () => {
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
    <div className="phonepe-page selection:bg-[#5f259f] selection:text-white">
      {/* 1. Sticky Top Navigation Bar */}
      <PhonePeNavbar onLaunchStage={handleLaunchRunway} />

      {/* Main Section Cadence */}
      <main>
        {/* SECTION 1 — PRIMARY SLIDING HERO SHOWCASE */}
        <PhonePeHeroSlider
          onExplore={scrollToSolutions}
          onLaunchStage={handleLaunchRunway}
        />

        {/* SECTION 2 — 4-PILLAR ELEVATED CARDS ROW (Payments, Investments, Insurance, Lending) */}
        <PhonePeHeroPillars
          onExploreSolutions={scrollToSolutions}
          onLaunchStage={handleLaunchRunway}
        />

        {/* SECTION 3 — CONCENTRIC RINGS DARK-NAVY TRANSACTIONS SHOWCASE */}
        <PhonePeConcentricSection />

        {/* SECTION 4 — "CONVENIENCE AT YOUR FINGERTIPS" RECEIPT & BILL CAPSULES */}
        <PhonePeConvenienceBills />

        {/* SECTION 5 — "TRAVEL, STAYS & COMMUTE" 4-CARD TRANSIT ROW */}
        <PhonePeTransitRow onExplore={handleLaunchRunway} />

        {/* SECTION 6 — "PAYMENTS ON FLOVA ARE SAFE, RELIABLE, AND QUICK" + CAROUSEL */}
        <PhonePeSafeQuickCarousel />

        {/* SECTION 7 — "SMART SAVINGS START HERE" STACKED STADIUM CAPSULES */}
        <PhonePeSmartSavings />

        {/* SECTION 8 — "FLOVA INTERNATIONAL & PAN-INDIA" COUNTRY FLAGS CONTAINER */}
        <PhonePePanIndiaBanner />

        {/* SECTION 9 — "ACCEPT PAYMENTS EVERYWHERE" DOT WAVE ARCH + SOUNDBOX */}
        <PhonePeDotWaveDevices />

        {/* SECTION 10 — ORBITAL INDIA STACK + 5-COL DIRECTORY FOOTER */}
        <PhonePeOrbitalFooter />
      </main>
    </div>
  );
};
