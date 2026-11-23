import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { FlovaPrimaryNavbar } from "./FlovaPrimaryNavbar";
import { FlovaTactileHero } from "./FlovaTactileHero";
import { FlovaLedgerSection } from "./FlovaLedgerSection";
import { FlovaTactileHowItWorks } from "./FlovaTactileHowItWorks";
import { FlovaAuditSection } from "./FlovaAuditSection";
import { FlovaResilienceSection } from "./FlovaResilienceSection";
import { FlovaCapabilitiesSection } from "./FlovaCapabilitiesSection";
import { FlovaFinalCTA } from "./FlovaFinalCTA";
import { FlovaTactileFooter } from "./FlovaTactileFooter";
import { RiderView } from "../RiderView";
import { SmsView } from "../SmsView";
import { EvidenceView } from "../EvidenceView";

export type Tab = "week" | "sms" | "evidence";

interface FlovaTactileLandingPageProps {
  tab: Tab;
  setTab: (tab: Tab) => void;
  riderId: number | null;
  onRider: (id: number | null) => void;
}

export const FlovaTactileLandingPage: React.FC<FlovaTactileLandingPageProps> = ({
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

  return (
    <div className="flova-tactile-container selection:bg-stone-900 selection:text-white">
      {/* 1. FLOVA Tactile Top Navbar */}
      <FlovaPrimaryNavbar onLaunchStage={scrollToStage} />

      {/* Main Landing Page Experience */}
      <main className="flex-1">
        {/* SECTION 01 — HERO */}
        <FlovaTactileHero onExplore={scrollToStage} />

        {/* SECTION 02 — ACTUAL CASH VS. COD SEPARATION */}
        <FlovaLedgerSection />

        {/* SECTION 03 — 3-STEP ARCHITECTURE */}
        <FlovaTactileHowItWorks />

        {/* SECTION 04 — AUDIT & FRAUD DETECTION (Deep Navy #09111e) */}
        <FlovaAuditSection />

        {/* SECTION 05 — RESILIENT CONNECTIVITY & SMS MODE */}
        <FlovaResilienceSection />

        {/* SECTION 06 — PRODUCT CAPABILITIES BENTO */}
        <FlovaCapabilitiesSection />

        {/* SECTION 07 — FINAL CTA (Deep Forest-Green Cutting Mat #0b2318) */}
        <FlovaFinalCTA onLaunch={scrollToStage} />
      </main>

      {/* Interactive Worker Workspace Stage (#flova-app-stage) */}
      <section id="flova-app-stage" className="py-20 px-4 sm:px-6 bg-[#f0eee9] border-t border-stone-300">
        <div className="max-w-5xl mx-auto bg-white p-6 sm:p-10 rounded-3xl border border-stone-200 paper-shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-stone-200">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 mb-2">
                <span>✦ SYNTHETIC DEMO &amp; WORKER STAGE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#121316] tracking-tight">
                Interactive Worker Workspace
              </h2>
              <p className="text-stone-600 text-sm mt-1">
                Explore the deterministic runway engine with 50 backtested simulation years.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#121316] text-white hover:bg-stone-800 transition-colors"
              >
                Sign In to Full App →
              </Link>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 pb-6 border-b border-stone-100 mb-6 overflow-x-auto">
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
                    ? "bg-[#121316] text-white shadow-sm"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
                onClick={() => setTab(k)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Active View */}
          <div className="stage-active-view-container">
            {tab === "week" && <RiderView riderId={riderId} onRider={onRider} />}
            {tab === "sms" && <SmsView defaultPhone="9876543210" />}
            {tab === "evidence" && <EvidenceView />}
          </div>
        </div>
      </section>

      {/* SECTION 08 — FOOTER */}
      <FlovaTactileFooter onLaunchStage={scrollToStage} />
    </div>
  );
};
