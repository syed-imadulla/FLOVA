import React from "react";

export const PhonePeConcentricSection: React.FC = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Large Rounded Dark-Navy Card Container (Matching Screenshot 4 Exactly) */}
        <div className="phonepe-concentric-container pt-16 pb-28 px-6 sm:px-12 text-center text-white relative rounded-[36px] overflow-hidden">
          {/* Concentric Arc Circles */}
          <div
            className="phonepe-arc-line w-[480px] h-[480px] top-28 left-1/2 -translate-x-1/2"
            style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}
          />
          <div
            className="phonepe-arc-line w-[780px] h-[780px] top-16 left-1/2 -translate-x-1/2"
            style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
          />
          <div
            className="phonepe-arc-line w-[1080px] h-[1080px] top-4 left-1/2 -translate-x-1/2"
            style={{ borderColor: "rgba(255, 255, 255, 0.04)" }}
          />

          {/* Section Headline */}
          <div className="relative z-10 max-w-xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Simple, fast &amp; <br />
              secure transactions
            </h2>
          </div>

          {/* 3 Floating Cards Along The Arc */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-4xl mx-auto mb-12">
            {/* 1. UPI Lite (Left) */}
            <div className="flex flex-col items-center">
              <span className="text-base font-bold text-white mb-4 block">
                UPI Lite
              </span>
              <div className="w-56 h-36 rounded-2xl bg-[#ff8ca3] p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:scale-105 transition-transform">
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
                <div className="text-[10px] text-white/90 font-mono text-center">
                  Zero-PIN Instant Check-Out
                </div>
              </div>
              <p className="text-xs sm:text-sm text-white/80 mt-4 max-w-[210px] leading-relaxed">
                Make faster, low-value transactions with ease
              </p>
            </div>

            {/* 2. Credit Line on UPI (Center - Elevated Higher) */}
            <div className="flex flex-col items-center -translate-y-6">
              <span className="text-base font-bold text-white mb-4 block">
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
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                  ₹50,000
                </div>
              </div>
              <p className="text-xs sm:text-sm text-white/80 mt-4 max-w-[220px] leading-relaxed">
                Link pre-sanctioned bank credit lines to UPI
              </p>
            </div>

            {/* 3. RuPay CC on UPI (Right) */}
            <div className="flex flex-col items-center">
              <span className="text-base font-bold text-white mb-4 block">
                RuPay CC on UPI
              </span>
              <div className="w-56 h-36 rounded-2xl bg-[#28b5a6] p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:scale-105 transition-transform text-white">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-black italic tracking-wide">
                    RuPay
                  </span>
                  <div className="w-7 h-5 rounded bg-amber-200/90 border border-white/60" />
                </div>
                <div className="flex gap-2 my-auto">
                  <span className="w-6 h-1.5 bg-white/40 rounded-full" />
                  <span className="w-6 h-1.5 bg-white/40 rounded-full" />
                  <span className="w-6 h-1.5 bg-white/40 rounded-full" />
                  <span className="w-6 h-1.5 bg-white/70 rounded-full" />
                </div>
                <div className="text-[10px] text-white/80 font-mono tracking-wider">
                  •••• 8824
                </div>
              </div>
              <p className="text-xs sm:text-sm text-white/80 mt-4 max-w-[210px] leading-relaxed">
                Use your RuPay credit card for UPI transactions
              </p>
            </div>
          </div>

          {/* Bottom Center Floating QR Code Box */}
          <div className="relative z-10 flex justify-center -mb-20">
            <div className="w-24 h-24 bg-white rounded-2xl p-2.5 shadow-2xl border-4 border-white flex items-center justify-center group hover:scale-110 transition-transform cursor-pointer">
              {/* Stylized QR Code with purple accents */}
              <div className="w-full h-full relative grid grid-cols-5 grid-rows-5 gap-0.5 p-0.5">
                {/* Corner Position Boxes */}
                <div className="col-span-2 row-span-2 border-2 border-[#5f259f] p-0.5 rounded-xs flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#5f259f] rounded-xs" />
                </div>
                <div className="col-start-4 col-span-2 row-span-2 border-2 border-[#5f259f] p-0.5 rounded-xs flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#5f259f] rounded-xs" />
                </div>
                <div className="col-span-2 row-start-4 row-span-2 border-2 border-[#5f259f] p-0.5 rounded-xs flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#5f259f] rounded-xs" />
                </div>
                {/* Data bits */}
                <div className="col-start-3 row-start-3 bg-[#5f259f] rounded-xs" />
                <div className="col-start-4 row-start-3 bg-[#23173d] rounded-xs" />
                <div className="col-start-3 row-start-4 bg-[#23173d] rounded-xs" />
                <div className="col-start-5 row-start-4 bg-[#5f259f] rounded-xs" />
                <div className="col-start-4 row-start-5 bg-[#5f259f] rounded-xs" />
                <div className="col-start-5 row-start-5 bg-[#23173d] rounded-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
