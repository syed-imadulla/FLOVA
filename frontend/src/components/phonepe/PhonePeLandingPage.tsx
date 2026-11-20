import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { PhonePeNavbar } from "./PhonePeNavbar";
import { PhonePeHeroPillars } from "./PhonePeHeroPillars";
import { PhonePeAppstoreHalo } from "./PhonePeAppstoreHalo";
import { PhonePeConcentricSection } from "./PhonePeConcentricSection";
import { PhonePeConvenienceBills } from "./PhonePeConvenienceBills";
import { PhonePeTransitRow } from "./PhonePeTransitRow";
import { PhonePePanIndiaBanner } from "./PhonePePanIndiaBanner";
import { PhonePeSafeQuickCarousel } from "./PhonePeSafeQuickCarousel";
import { PhonePeSmartSavings } from "./PhonePeSmartSavings";
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
      {/* 1. Sticky PhonePe Navbar */}
      <PhonePeNavbar onLaunchStage={scrollToStage} />

      {/* Main PhonePe Section Cadence Rebranded for FLOVA */}
      <main>
        {/* SECTION 1 — HERO 4-PILLAR ELEVATED CARDS ROW */}
        <PhonePeHeroPillars
          onExploreSolutions={scrollToSolutions}
          onLaunchStage={scrollToStage}
        />

        {/* SECTION 2 — "MORE THAN JUST APPS" ORANGE RADIAL HALO + APPSTORE PHONE */}
        <PhonePeAppstoreHalo onExplore={scrollToStage} />

        {/* SECTION 3 — CONCENTRIC RINGS DARK-NAVY TRANSACTIONS SHOWCASE */}
        <PhonePeConcentricSection />

        {/* SECTION 4 — "CONVENIENCE AT YOUR FINGERTIPS" RECEIPT & BILL CAPSULES */}
        <PhonePeConvenienceBills />

        {/* SECTION 5 — "TRAVEL, STAYS & COMMUTE" 4-CARD TRANSIT ROW */}
        <PhonePeTransitRow onExplore={scrollToStage} />

        {/* SECTION 6 — "FLOVA PAN-INDIA CORRIDORS" METRO FLAGS CONTAINER */}
        <PhonePePanIndiaBanner />

        {/* SECTION 7 — "PAYMENTS ON FLOVA ARE SAFE, RELIABLE, AND QUICK" + CAROUSEL */}
        <PhonePeSafeQuickCarousel />

        {/* SECTION 8 — "SMART SAVINGS START HERE" STACKED STADIUM CAPSULES */}
        <PhonePeSmartSavings />

        {/* SECTION 9 — "ACCEPT PAYMENTS EVERYWHERE" DOT WAVE ARCH + SOUNDBOX */}
        <PhonePeDotWaveDevices />

        {/* SECTION 10 & 11 — ORBITAL INDIA STACK + 5-COL DIRECTORY FOOTER */}
        <PhonePeOrbitalFooter />
      </main>

      {/* SECTION 12 — INTERACTIVE WORKER WORKSPACE STAGE (#flova-app-stage) */}
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
              <p className="text-[#5e596e] text-sm mt-1">
                Explore the deterministic runway engine with 50 backtested simulation years.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#5f259f] text-white hover:bg-[#4d1d83] transition-colors"
              >
                Sign In to Full App →
              </Link>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 pb-6 border-b border-slate-100 mb-6 overflow-x-auto">
            {([
              ["week", "My week (Rider View)"],
              ["sms", "SMS Mode Fallback"],
              ["evidence", "50-Year Simulation Evidence"],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  tab === k
                    ? "bg-[#5f259f] text-white shadow-xs"
                    : "bg-[#f5efff] text-[#5f259f] hover:bg-[#ebdcfc]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Render Active Stage Component */}
          <div className="pt-2">
            {tab === "week" && <RiderView riderId={riderId} onRider={onRider} />}
            {tab === "sms" && <SmsView defaultPhone="9876543210" />}
            {tab === "evidence" && <EvidenceView />}
          </div>
        </div>
      </section>
    </div>
  );
};
