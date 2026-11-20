import React from "react";
import { useNavigate } from "react-router-dom";

export const FlovaHero: React.FC = () => {
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 bg-gradient-to-b from-[#F4F6F0] via-[#FAF7F2] to-[#FAF7F2]">
      {/* Subtle organic background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-br from-[#0F5C4C]/10 via-[#10B981]/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Indian Context Copy & CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F5C4C]/10 border border-[#0F5C4C]/20 text-[#0F5C4C] text-xs sm:text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#0F5C4C] animate-pulse" />
              <span>Built for India&apos;s 12M+ Delivery Partners &amp; Irregular Earners</span>
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#16181D] tracking-tight leading-[1.12]">
              Make Your Money <br className="hidden sm:block" />
              <span className="text-[#0F5C4C]">Move Smarter.</span>
            </h1>

            {/* Indian-context Subheadline */}
            <p className="text-base sm:text-lg text-[#4A524C] max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Swiggy, Zomato, Blinkit, Uber, Ola or freelance? Irregular earnings and weekly payouts make budgeting stressful. FLOVA calculates your safe daily runway using <strong>confirmed cash only</strong>—keeping customer COD separate and protecting your rent and bike EMI.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => navigate("/signup")}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0F5C4C] hover:bg-[#0c4a3d] text-white font-bold text-base shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Free Runway</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              <button
                onClick={() => scrollTo("how-it-works")}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-[#16181D] font-bold text-base border border-[#E5E2DC] shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                See How It Works
              </button>
            </div>

            {/* Micro Trust Points */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#5A635B] font-medium">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-700">✓</span>
                <span>Zero Bank Password or UPI PIN</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-700">✓</span>
                <span>Deterministic Math (No AI guesses)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-700">✓</span>
                <span>Works as Fast Mobile PWA</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hardware/Dashboard Simulation Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-[#E5E2DC] relative">
              {/* Illustrative Tag */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F0ECE1]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-[#16181D]">FLOVA Runway Engine</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Illustrative Preview
                </span>
              </div>

              {/* Runway Status Banner */}
              <div className="p-4 rounded-2xl bg-[#0F5C4C]/10 border border-[#0F5C4C]/20 mb-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#0F5C4C] uppercase tracking-wider">Current Runway</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#0F5C4C] text-white">HEALTHY</span>
                </div>
                <div className="text-2xl font-black text-[#0F5C4C] font-mono tabular-nums">
                  5 Days Safe
                </div>
                <p className="text-[11px] text-[#4A524C] mt-1">
                  Cash lasts until Friday payout after daily fuel (₹280) &amp; food (₹200).
                </p>
              </div>

              {/* 3 Core Buckets Highlight */}
              <div className="space-y-3">
                {/* 1. Confirmed Cash */}
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <span>Confirmed Cash (Wallet & Bank)</span>
                    </div>
                    <div className="text-[11px] text-emerald-800">Only verified money you can safely spend</div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black font-mono text-emerald-900 tabular-nums">₹4,250</span>
                  </div>
                </div>

                {/* 2. COD / Not Yours */}
                <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/70 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <span>🔒 COD & Platform Cash</span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">NOT YOURS</span>
                    </div>
                    <div className="text-[11px] text-amber-900">Ringfenced for platform deposit · Excluded</div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold font-mono text-amber-950 tabular-nums">₹1,850</span>
                  </div>
                </div>

                {/* 3. Pending Payout */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>⏳ Scheduled Weekly Payout</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">PENDING</span>
                    </div>
                    <div className="text-[11px] text-slate-600">Expected Friday · Not counted in cash yet</div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold font-mono text-slate-800 tabular-nums">₹3,800</span>
                  </div>
                </div>
              </div>

              {/* Protected Commitment Pill */}
              <div className="mt-4 pt-3 border-t border-[#F0ECE1] flex items-center justify-between text-xs text-[#4A524C]">
                <span className="flex items-center gap-1 font-medium">
                  <span>🛡️ Bike EMI Due Thursday:</span>
                  <strong className="text-[#16181D]">₹1,400</strong>
                </span>
                <span className="font-bold text-emerald-700">Protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
