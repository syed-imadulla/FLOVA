import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { WarmNavbar } from "./WarmNavbar";
import { WarmHeroSolutions } from "./WarmHeroSolutions";
import { WarmConcentricShowcase } from "./WarmConcentricShowcase";
import { WarmBillsAndStories } from "./WarmBillsAndStories";
import { WarmSmartBufferArches } from "./WarmSmartBufferArches";
import { WarmOrbitalTrustFooter } from "./WarmOrbitalTrustFooter";
import { RiderView } from "../RiderView";
import { SmsView } from "../SmsView";
import { EvidenceView } from "../EvidenceView";

export type Tab = "week" | "sms" | "evidence";

interface WarmLandingPageProps {
  tab: Tab;
  setTab: (tab: Tab) => void;
  riderId: number | null;
  onRider: (id: number | null) => void;
}

export const WarmLandingPage: React.FC<WarmLandingPageProps> = ({
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
    <div className="flova-warm-page selection:bg-[#0F5C4C] selection:text-white">
      {/* 1. Sticky Top Navigation Bar */}
      <WarmNavbar onLaunchStage={scrollToStage} />

      {/* Main Experience Flow */}
      <main>
        {/* SECTION 01 — HERO & 4-CARD CORE SOLUTIONS ROW */}
        <WarmHeroSolutions
          onExploreSolutions={scrollToSolutions}
          onLaunchStage={scrollToStage}
        />

        {/* SECTION 02 — CONCENTRIC ARC SHOWCASE & INTERACTIVE FEATURE CAROUSEL */}
        <WarmConcentricShowcase />

        {/* SECTION 03 — BILL/PAYOUT MARQUEE STRIP & STORY CAROUSEL */}
        <WarmBillsAndStories />

        {/* SECTION 04 — SMART SAVINGS/BUFFER PILLS & ARCHED DOT WAVE */}
        <WarmSmartBufferArches />
      </main>

      {/* SECTION 05 — INTERACTIVE WORKER WORKSPACE STAGE (#flova-app-stage) */}
      <section
        id="flova-app-stage"
        className="py-20 px-4 sm:px-6 bg-[#F5F1EB] border-t border-[#E8E3DA]"
      >
        <div className="max-w-5xl mx-auto bg-white p-6 sm:p-10 rounded-[32px] border border-[#E8E3DA] warm-shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E8E3DA]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E6F4EA] text-[#0F5C4C] border border-[#C2E7CD] mb-2">
                <span>✦ SYNTHETIC DEMO &amp; WORKER STAGE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#181A1F] tracking-tight">
                Interactive Worker Workspace
              </h2>
              <p className="text-[#525866] text-sm mt-1">
                Explore the deterministic runway engine with 50 backtested simulation years.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#0F5C4C] text-white hover:bg-[#0A3D33] transition-colors"
              >
                Sign In to Full App →
              </Link>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 pb-6 border-b border-[#F5F1EB] mb-6 overflow-x-auto">
            {([
              ["week", "My week (Rider View)"],
              ["sms", "SMS Mode Fallback"],
              ["evidence", "50-Year Simulation Evidence"],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                type="button"
                className={`px-4 py-2 rounded-full font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  tab === k
                    ? "bg-[#0F5C4C] text-white shadow-xs"
                    : "bg-[#F5F1EB] text-[#525866] hover:bg-[#E8E3DA]"
                }`}
                onClick={() => setTab(k)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Active View Container */}
          <div className="stage-active-view-container">
            {tab === "week" && <RiderView riderId={riderId} onRider={onRider} />}
            {tab === "sms" && <SmsView defaultPhone="9876543210" />}
            {tab === "evidence" && <EvidenceView />}
          </div>
        </div>
      </section>

      {/* SECTION 06 — ORBITAL RING INNOVATION DIAGRAM, TRUST STRIP & FOOTER */}
      <WarmOrbitalTrustFooter onLaunchStage={scrollToStage} />
    </div>
  );
};
