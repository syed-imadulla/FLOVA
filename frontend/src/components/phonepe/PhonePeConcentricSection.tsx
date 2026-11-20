import React from "react";

export const PhonePeConcentricSection: React.FC = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Large Rounded Dark-Navy Card Container */}
        <div className="phonepe-concentric-container pt-16 pb-28 px-6 sm:px-12 text-center text-white relative">
          {/* Concentric Arc Circles */}
          <div
            className="phonepe-arc-line w-[450px] h-[450px] top-24 left-1/2 -translate-x-1/2"
            style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}
          />
          <div
            className="phonepe-arc-line w-[750px] h-[750px] top-12 left-1/2 -translate-x-1/2"
            style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
          />
          <div
            className="phonepe-arc-line w-[1050px] h-[1050px] top-0 left-1/2 -translate-x-1/2"
            style={{ borderColor: "rgba(255, 255, 255, 0.04)" }}
          />

          {/* Section Headline */}
          <div className="relative z-10 max-w-xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Simple, fast &amp; <br className="hidden sm:inline" />
              secure transactions
            </h2>
          </div>

          {/* 3 Floating Cards Along The Arc */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-4xl mx-auto mb-8">
            {/* 1. UPI Lite (Left) */}
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-white/90 mb-4 block">
                UPI Lite
              </span>
              <div className="w-56 h-36 rounded-2xl bg-[#ff8ca3] p-4 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:scale-105 transition-transform">
                {/* Tote / Pouch Handle */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-8 border-4 border-white rounded-t-xl bg-white/20" />
                <div className="pt-4 flex justify-center">
                  <div className="flex items-center gap-1.5 bg-white/95 px-3 py-1.5 rounded-lg shadow-xs">
                    <span className="text-xs font-black tracking-wider text-slate-800">
                      UPI
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-600">
                      LITE
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-white/80 font-mono text-center">
                  Zero-PIN Small Fuel Payments
                </div>
              </div>
              <p className="text-xs text-white/70 mt-4 max-w-[210px] leading-relaxed">
                Make faster, low-value transactions with ease
              </p>
            </div>

            {/* 2. Credit Line on UPI (Center - Elevated) */}
            <div className="flex flex-col items-center -translate-y-4">
              <span className="text-sm font-bold text-white/90 mb-4 block">
                Credit Line on UPI
              </span>
              <div className="w-64 bg-white rounded-2xl p-6 shadow-2xl text-slate-900 border-2 border-purple-200/50 group hover:scale-105 transition-transform">
                {/* Bank Roof with Verified Green Tick */}
                <div className="relative w-12 h-12 mx-auto mb-2 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4-7L2 7v2h19V7l-9-4z" />
                  </svg>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">
                    ✓
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-500">
                  Pre - Approved Credit on UPI
                </div>
                <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                  ₹50,000
                </div>
              </div>
              <p className="text-xs text-white/70 mt-4 max-w-[220px] leading-relaxed">
                Link pre-sanctioned bank credit lines to UPI
              </p>
            </div>

            {/* 3. RuPay CC on UPI (Right) */}
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-white/90 mb-4 block">
                RuPay CC on UPI
              </span>
              <div className="w-56 h-36 rounded-2xl bg-[#36c5b8] p-4 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:scale-105 transition-transform text-white">
                <div className="flex justify-between items-center">
                  <span className="text-base font-black italic tracking-wide">
                    RuPay
                  </span>
                  <div className="w-6 h-5 rounded bg-amber-200/80 border border-white/50" />
                </div>
                <div className="flex gap-2 my-auto">
                  <span className="w-5 h-1.5 bg-white/60 rounded" />
                  <span className="w-5 h-1.5 bg-white/60 rounded" />
                  <span className="w-5 h-1.5 bg-white/60 rounded" />
                  <span className="w-5 h-1.5 bg-white/60 rounded" />
                </div>
                <div className="text-[10px] text-white/90 font-mono tracking-wider">
                  FLEET VERIFIED CARD
                </div>
              </div>
              <p className="text-xs text-white/70 mt-4 max-w-[210px] leading-relaxed">
                Use your RuPay credit card for UPI transactions
              </p>
            </div>
          </div>

          {/* Interactive QR Code Box Bridging the Bottom Edge */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-20">
            <div className="w-24 h-24 bg-white rounded-2xl p-2.5 shadow-2xl border border-slate-100 flex flex-col items-center justify-center hover:scale-110 transition-transform cursor-pointer">
              {/* QR Pattern Representation */}
              <div className="w-full h-full border-2 border-dashed border-[#5f259f] rounded-lg p-1 grid grid-cols-3 gap-1">
                <div className="bg-[#5f259f] rounded-xs" />
                <div className="bg-slate-200 rounded-xs" />
                <div className="bg-[#5f259f] rounded-xs" />
                <div className="bg-slate-200 rounded-xs" />
                <div className="bg-[#5f259f] rounded-xs" />
                <div className="bg-slate-200 rounded-xs" />
                <div className="bg-[#5f259f] rounded-xs" />
                <div className="bg-slate-200 rounded-xs" />
                <div className="bg-[#5f259f] rounded-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
