import React from "react";

interface WarmFooterProps {
  onLaunchStage: () => void;
}

export const WarmOrbitalTrustFooter: React.FC<WarmFooterProps> = ({ onLaunchStage }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#152220] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* ===================================================================
          PART 1: ORBITAL RING INNOVATION DIAGRAM (00:24-00:32 blueprint)
          =================================================================== */}
      <div className="max-w-7xl mx-auto pb-24 border-b border-white/10 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider mb-4">
            <span>✦ ORBITAL ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            An Ecosystem Revolving Around Your Cash Security
          </h2>
        </div>

        {/* Orbital Centerpiece Container */}
        <div className="relative h-[380px] sm:h-[440px] flex items-center justify-center">
          {/* Ring 1 (Inner) */}
          <div className="orbital-ring w-[220px] h-[220px] sm:w-[260px] sm:h-[260px]">
            <div className="orbital-spinner">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="orbital-satellite px-3 py-1 rounded-full bg-emerald-900/90 text-emerald-200 border border-emerald-400/40 text-[10px] font-mono font-bold shadow-md">
                  Integer Paise
                </span>
              </div>
            </div>
          </div>

          {/* Ring 2 (Middle) */}
          <div className="orbital-ring w-[320px] h-[320px] sm:w-[380px] sm:h-[380px]">
            <div className="orbital-spinner" style={{ animationDuration: "45s", animationDirection: "reverse" }}>
              <div className="absolute top-1/2 -left-4 -translate-y-1/2">
                <span className="orbital-satellite px-3 py-1 rounded-full bg-blue-900/90 text-blue-200 border border-blue-400/40 text-[10px] font-mono font-bold shadow-md">
                  PostgreSQL RLS
                </span>
              </div>
              <div className="absolute top-1/2 -right-4 -translate-y-1/2">
                <span className="orbital-satellite px-3 py-1 rounded-full bg-purple-900/90 text-purple-200 border border-purple-400/40 text-[10px] font-mono font-bold shadow-md">
                  50-Yr Backtested
                </span>
              </div>
            </div>
          </div>

          {/* Ring 3 (Outer) */}
          <div className="orbital-ring w-[420px] h-[420px] sm:w-[500px] sm:h-[500px]">
            <div className="orbital-spinner" style={{ animationDuration: "60s" }}>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                <span className="orbital-satellite px-3 py-1 rounded-full bg-amber-900/90 text-amber-200 border border-amber-400/40 text-[10px] font-mono font-bold shadow-md">
                  COD Ringfenced
                </span>
              </div>
            </div>
          </div>

          {/* Central FLOVA Core Badge */}
          <div className="relative z-10 w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0F5C4C] to-[#0A3D33] border-2 border-emerald-400/60 shadow-2xl flex flex-col items-center justify-center select-none">
            <span className="font-serif italic font-bold text-3xl text-emerald-200">f</span>
            <span className="text-[9px] font-mono font-bold text-white tracking-widest uppercase">FLOVA</span>
          </div>
        </div>

        {/* Trust & Reassurance Banner */}
        <div className="mt-8 p-6 rounded-3xl bg-white/5 border border-white/10 text-center max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <div className="text-sm font-bold text-white">Backed by Deterministic Financial Contracts</div>
            <div className="text-xs text-stone-400">Zero algorithmic hallucination. 50 simulated years backtested.</div>
          </div>
          <button
            onClick={onLaunchStage}
            className="px-5 py-2.5 rounded-full bg-white text-[#152220] font-bold text-xs hover:bg-emerald-100 transition-colors cursor-pointer shrink-0"
          >
            Open Interactive Stage →
          </button>
        </div>
      </div>

      {/* ===================================================================
          PART 2: 5-COLUMN FOOTER DIRECTORY (00:06-00:10 blueprint)
          =================================================================== */}
      <div className="max-w-7xl mx-auto pt-16 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-16 border-b border-white/10 text-xs">
          {/* Column 1: Company */}
          <div className="space-y-3">
            <h5 className="font-mono font-bold text-emerald-400 tracking-wider uppercase text-[11px]">
              Company
            </h5>
            <ul className="space-y-2 text-stone-400 font-sans">
              <li><a href="#company" className="hover:text-white transition-colors">About FLOVA</a></li>
              <li><a href="#company" className="hover:text-white transition-colors">Our Mission</a></li>
              <li><a href="#evidence" className="hover:text-white transition-colors">50-Year Simulation</a></li>
              <li><a href="#company" className="hover:text-white transition-colors">Indian Gig Economy</a></li>
            </ul>
          </div>

          {/* Column 2: Solutions */}
          <div className="space-y-3">
            <h5 className="font-mono font-bold text-emerald-400 tracking-wider uppercase text-[11px]">
              Our Solutions
            </h5>
            <ul className="space-y-2 text-stone-400 font-sans">
              <li><a href="#solutions" className="hover:text-white transition-colors">30-Second Check-In</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">COD Cash Separation</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Weekly Salary Buffer</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Essential Rent Shield</a></li>
            </ul>
          </div>

          {/* Column 3: Platform */}
          <div className="space-y-3">
            <h5 className="font-mono font-bold text-emerald-400 tracking-wider uppercase text-[11px]">
              Platform Spec
            </h5>
            <ul className="space-y-2 text-stone-400 font-sans">
              <li><a href="#trust" className="hover:text-white transition-colors">PostgreSQL RLS</a></li>
              <li><a href="#trust" className="hover:text-white transition-colors">Integer Paise Spec</a></li>
              <li><a href="#trust" className="hover:text-white transition-colors">Contract v1 Rules</a></li>
              <li><a href="#trust" className="hover:text-white transition-colors">SMS Fallback Mode</a></li>
            </ul>
          </div>

          {/* Column 4: Earners */}
          <div className="space-y-3">
            <h5 className="font-mono font-bold text-emerald-400 tracking-wider uppercase text-[11px]">
              Earners Supported
            </h5>
            <ul className="space-y-2 text-stone-400 font-sans">
              <li><span className="text-stone-300">Swiggy &amp; Zomato Fleet</span></li>
              <li><span className="text-stone-300">Uber &amp; Rapido Captains</span></li>
              <li><span className="text-stone-300">Zepto &amp; Blinkit Delivery</span></li>
              <li><span className="text-stone-300">Urban Company Partners</span></li>
            </ul>
          </div>

          {/* Column 5: Trust & Safety */}
          <div className="space-y-3 col-span-2 md:col-span-1">
            <h5 className="font-mono font-bold text-emerald-400 tracking-wider uppercase text-[11px]">
              Trust &amp; Safety
            </h5>
            <ul className="space-y-2 text-stone-400 font-sans">
              <li><span className="text-stone-300">Deterministic Arithmetic</span></li>
              <li><span className="text-stone-300">Zero Predatory Loan Apps</span></li>
              <li><span className="text-stone-300">User Data Isolation</span></li>
              <li><span className="text-stone-300">Truthful Network Reporting</span></li>
            </ul>
          </div>
        </div>

        {/* Massive FLOVA Bottom Wordmark */}
        <div className="pt-12 pb-8 flex items-center justify-between text-white/10 font-bold select-none overflow-hidden">
          <span className="text-6xl sm:text-8xl lg:text-9xl font-extrabold tracking-tighter hover:text-white/20 transition-colors">
            F L O V A
          </span>
          <button
            onClick={scrollToTop}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white text-white hover:text-[#152220] flex items-center justify-center font-bold text-base transition-colors cursor-pointer select-auto"
            aria-label="Back to top"
          >
            ↑
          </button>
        </div>

        {/* Legal & Data Disclaimers */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-stone-500">
          <div>
            © 2026 FLOVA. All rights reserved. Adaptive runway management for Indian gig workers.
          </div>
          <div className="flex gap-6">
            <span>Integer Paise Spec</span>
            <span>Contract v1</span>
            <span>Supabase RLS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
