import React, { useCallback } from "react";
import { PhonePeNavbar } from "./PhonePeNavbar";
import { PhonePeHeroPillars } from "./PhonePeHeroPillars";
import { PhonePeConcentricSection } from "./PhonePeConcentricSection";
import { PhonePeConvenienceBills } from "./PhonePeConvenienceBills";
import { PhonePeAppstoreHalo } from "./PhonePeAppstoreHalo";
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
  const scrollToStage = useCallback(() => {
    const el = document.getElementById("flova-app-stage");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const scrollToSolutions = useCallback(() => {
    const el = document.getElementById("solutions");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="phonepe-page selection:bg-[#5f259f] selection:text-white">
      {/* 1. Sticky PhonePe-Style Navbar */}
      <PhonePeNavbar onLaunchStage={scrollToStage} />

      {/* Main Section Cadence Matching Screenshots Exactly */}
      <main>
        {/* SECTION 1 — HERO 4-PILLAR ELEVATED CARDS ROW (Screenshot 2) */}
        <PhonePeHeroPillars
          onExploreSolutions={scrollToSolutions}
          onLaunchStage={scrollToStage}
        />

        {/* SECTION 2 — CONCENTRIC RINGS DARK-NAVY TRANSACTIONS SHOWCASE (Screenshot 4) */}
        <PhonePeConcentricSection />

        {/* SECTION 3 — "CONVENIENCE AT YOUR FINGERTIPS" RECEIPT & BILL CAPSULES (Screenshots 3 & 5) */}
        <PhonePeConvenienceBills />

        {/* SECTION 4 — "MORE THAN JUST APPS" ORANGE RADIAL HALO + APPSTORE PHONE (Screenshot 6) */}
        <PhonePeAppstoreHalo onExplore={scrollToStage} />

        {/* SECTION 5 — "TRAVEL, STAYS & COMMUTE" 4-CARD TRANSIT ROW (Screenshot 7) */}
        <PhonePeTransitRow onExplore={scrollToStage} />

        {/* SECTION 6 — "PAYMENTS ON FLOVA ARE SAFE, RELIABLE, AND QUICK" + CAROUSEL (Screenshot 8) */}
        <PhonePeSafeQuickCarousel />

        {/* SECTION 7 — "SMART SAVINGS START HERE" STACKED STADIUM CAPSULES (Screenshot 9) */}
        <PhonePeSmartSavings />

        {/* SECTION 8 — "FLOVA INTERNATIONAL & PAN-INDIA" COUNTRY FLAGS CONTAINER (Screenshot 10) */}
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
                onClick={() => setTab("week")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  tab === "week"
                    ? "bg-[#5f259f] text-white shadow-xs"
                    : "text-[#5e596e] hover:text-[#23173d]"
                }`}
              >
                Weekly Runway
              </button>
              <button
                onClick={() => setTab("sms")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  tab === "sms"
                    ? "bg-[#5f259f] text-white shadow-xs"
                    : "text-[#5e596e] hover:text-[#23173d]"
                }`}
              >
                SMS Parser
              </button>
              <button
                onClick={() => setTab("evidence")}
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
            {tab === "week" && (
              <RiderView riderId={riderId} onRider={onRider} />
            )}
            {tab === "sms" && <SmsView defaultPhone="" />}
            {tab === "evidence" && <EvidenceView />}
          </div>
        </div>
      </section>
    </div>
  );
};
