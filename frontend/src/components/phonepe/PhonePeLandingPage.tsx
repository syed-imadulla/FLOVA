import React, { useCallback, useState } from "react";
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
import { RiderView } from "../RiderView";
import { SmsView } from "../SmsView";
import { EvidenceView } from "../EvidenceView";

export type Tab = "week" | "sms" | "evidence";

interface PhonePeLandingPageProps {
  tab: Tab;
  setTab: (tab: Tab) => void;
  riderId: number | null;
  onRider: (id: number | null) => void;
}

export const PhonePeLandingPage: React.FC<PhonePeLandingPageProps> = ({
  tab,
  setTab,
  riderId,
  onRider,
}) => {
  // Only mount the demo stage components after the user explicitly interacts with the stage.
  const [stageActivated, setStageActivated] = useState(false);

  const scrollToStage = useCallback(() => {
    setStageActivated(true);
    const el = document.getElementById("flova-app-stage");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleTabChange = useCallback((t: Tab) => {
    setStageActivated(true);
    setTab(t);
  }, [setTab]);

  const scrollToSolutions = useCallback(() => {
    const el = document.getElementById("solutions");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="phonepe-page selection:bg-[#5f259f] selection:text-white">
      {/* 1. Sticky Top Navigation Bar */}
      <PhonePeNavbar onLaunchStage={scrollToStage} />

      {/* Main Section Cadence */}
      <main>
        {/* SECTION 1 — PRIMARY SLIDING HERO SHOWCASE (Matching Reference with Multiple Slides & FLOVA Name) */}
        <PhonePeHeroSlider
          onExplore={scrollToStage}
          onLaunchStage={scrollToStage}
        />

        {/* SECTION 2 — 4-PILLAR ELEVATED CARDS ROW (Payments, Investments, Insurance, Lending) */}
        <PhonePeHeroPillars
          onExploreSolutions={scrollToSolutions}
          onLaunchStage={scrollToStage}
        />

        {/* SECTION 3 — CONCENTRIC RINGS DARK-NAVY TRANSACTIONS SHOWCASE */}
        <PhonePeConcentricSection />

        {/* SECTION 4 — "CONVENIENCE AT YOUR FINGERTIPS" RECEIPT & BILL CAPSULES */}
        <PhonePeConvenienceBills />

        {/* SECTION 5 — "TRAVEL, STAYS & COMMUTE" 4-CARD TRANSIT ROW */}
        <PhonePeTransitRow onExplore={scrollToStage} />

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

      {/* SECTION 11 — INTERACTIVE WORKER WORKSPACE STAGE (#flova-app-stage) */}
      <section
        id="flova-app-stage"
        className="py-20 px-4 sm:px-6 bg-[#f7f5fa] border-t border-[#ece4f5]"
      >
        <div className="max-w-5xl mx-auto bg-white p-6 sm:p-10 rounded-[32px] border border-[#ece4f5] shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#ece4f5]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#f5efff] text-[#5f259f] border border-[#e8d7ff] mb-2">
                <span>✦ SYNTHETIC DEMO &amp; WORKER STAGE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#23173d] tracking-tight">
                Interactive Worker Workspace
              </h2>
              <p className="text-xs sm:text-sm text-[#5e596e] mt-1">
                Explore live daily check-in, SMS parsing, and verifiable mathematical evidence without leaving the page.
              </p>
            </div>

            {/* Stage Mode Tabs */}
            <div className="inline-flex p-1 bg-[#f0ebf7] rounded-full self-start sm:self-auto border border-[#e3d7f2]">
              <button
                onClick={() => handleTabChange("week")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  tab === "week"
                    ? "bg-[#5f259f] text-white shadow-xs"
                    : "text-[#5e596e] hover:text-[#23173d]"
                }`}
              >
                Weekly Runway
              </button>
              <button
                onClick={() => handleTabChange("sms")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  tab === "sms"
                    ? "bg-[#5f259f] text-white shadow-xs"
                    : "text-[#5e596e] hover:text-[#23173d]"
                }`}
              >
                SMS Parser
              </button>
              <button
                onClick={() => handleTabChange("evidence")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  tab === "evidence"
                    ? "bg-[#5f259f] text-white shadow-xs"
                    : "text-[#5e596e] hover:text-[#23173d]"
                }`}
              >
                Audit Evidence
              </button>
            </div>
          </div>

          {/* Active Stage Body */}
          <div className="min-h-[460px]">
            {!stageActivated ? (
              <div className="flex flex-col items-center justify-center min-h-[460px] gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-[#f5efff] flex items-center justify-center text-3xl">
                  🛵
                </div>
                <p className="text-sm text-[#5e596e] max-w-xs leading-relaxed">
                  Click <strong className="text-[#5f259f]">Launch Runway</strong> in the nav, or select a tab above to explore the live demo.
                </p>
              </div>
            ) : (
              <>
                {tab === "week" && (
                  <RiderView riderId={riderId} onRider={onRider} />
                )}
                {tab === "sms" && <SmsView defaultPhone="" />}
                {tab === "evidence" && <EvidenceView />}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
