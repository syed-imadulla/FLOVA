import React from "react";

export const PhonePeDotWaveDevices: React.FC = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
      {/* Curved Dot Wave Arch Illustration (PhonePe Signature Wave) */}
      <div className="absolute inset-0 pointer-events-none flex justify-center items-center opacity-30">
        <svg viewBox="0 0 1200 400" className="w-full h-auto">
          {/* Parabolic dotted curves in rainbow pastel tones */}
          <path
            d="M 50 350 Q 600 -50 1150 350"
            fill="none"
            stroke="#b39ddb"
            strokeWidth="3"
            strokeDasharray="6 14"
          />
          <path
            d="M 50 380 Q 600 0 1150 380"
            fill="none"
            stroke="#80deea"
            strokeWidth="3"
            strokeDasharray="6 16"
          />
          <path
            d="M 50 410 Q 600 50 1150 410"
            fill="none"
            stroke="#ffcc80"
            strokeWidth="3"
            strokeDasharray="6 18"
          />
          <path
            d="M 50 440 Q 600 100 1150 440"
            fill="none"
            stroke="#f48fb1"
            strokeWidth="3"
            strokeDasharray="6 20"
          />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#23173d] tracking-tight mb-3">
            Accept payments everywhere
          </h2>
          <p className="text-sm text-[#5e596e] max-w-xl mx-auto">
            Hardware, soundbox voice alerts, and point-of-sale tools built for high-speed
            Indian merchant counters.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Device Mockup (Smart Soundbox & POS Terminal) */}
          <div className="relative flex justify-center items-center">
            {/* Soft Ambient Shadow */}
            <div className="absolute w-72 h-72 bg-purple-100 rounded-full blur-2xl -z-10" />

            {/* Smart Speaker Box Graphic */}
            <div className="relative mr-4 sm:mr-8">
              <div className="w-44 h-48 sm:w-52 sm:h-56 rounded-3xl bg-[#5f259f] p-4 text-white shadow-2xl flex flex-col justify-between border-2 border-purple-400">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black tracking-widest uppercase text-purple-200">
                    FLOVA AUDIO
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                </div>

                {/* Speaker Grille Dots */}
                <div className="grid grid-cols-4 gap-2 my-auto px-4">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <span key={i} className="w-2 h-2 rounded-full bg-white/30" />
                  ))}
                </div>

                {/* Voice Banner */}
                <div className="bg-white/10 rounded-xl p-2 text-center text-[10px] font-mono font-bold tracking-tight">
                  “FLOVA पर ₹150 प्राप्त हुए”
                </div>
              </div>
            </div>

            {/* Compact POS Terminal Graphic */}
            <div className="w-36 h-52 sm:w-44 sm:h-64 rounded-2xl bg-slate-900 p-3 text-white shadow-2xl flex flex-col justify-between -ml-8 -mb-10 border-2 border-slate-700">
              <div className="bg-emerald-950 border border-emerald-500/40 rounded-lg p-2 text-center">
                <div className="text-[9px] text-emerald-400 font-mono">PAYMENT SUCCESS</div>
                <div className="text-base font-black text-white">₹350.00</div>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-1.5 px-2 my-auto">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "X", "0", "OK"].map((k) => (
                  <span
                    key={k}
                    className="h-6 rounded bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-300"
                  >
                    {k}
                  </span>
                ))}
              </div>

              <div className="w-full h-1.5 bg-slate-800 rounded-full" />
            </div>
          </div>

          {/* Right: Overlapping Merchant Cards */}
          <div className="space-y-6">
            <div className="bg-[#faf8fc] rounded-3xl p-6 sm:p-8 border border-[#ebe5f5] shadow-sm hover:border-[#5f259f] transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5f259f] flex items-center justify-center font-bold mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#23173d] mb-2">
                Offline Merchant Solutions
              </h3>
              <p className="text-xs sm:text-sm text-[#5e596e] leading-relaxed">
                Equip fuel stations, bike repair workshops, and roadside tea counters with
                instant QR soundbox notifications in 9 regional Indian languages with 0% MDR.
              </p>
            </div>

            <div className="bg-[#faf8fc] rounded-3xl p-6 sm:p-8 border border-[#ebe5f5] shadow-sm hover:border-[#5f259f] transition-all">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#e65100] flex items-center justify-center font-bold mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#23173d] mb-2">
                FLOVA Fleet Ads &amp; Marketing
              </h3>
              <p className="text-xs sm:text-sm text-[#5e596e] leading-relaxed">
                Connect brands with hyperlocal delivery delivery partners. Monetize top-box
                branding and high-density metro delivery routes for supplemental passive income.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
