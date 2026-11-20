import React from "react";

interface PhonePeAppstoreHaloProps {
  onExplore?: () => void;
}

export const PhonePeAppstoreHalo: React.FC<PhonePeAppstoreHaloProps> = ({ onExplore }) => {
  return (
    <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      {/* Warm Radiant Orange Halo Gradient in Background (Matching Screenshot 6) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[650px] phonepe-orange-halo pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 text-center">
        {/* Warm Orange Title */}
        <h2 className="text-4xl sm:text-5xl font-extrabold text-[#d84315] tracking-tight mb-4">
          More Than Just Apps
        </h2>

        {/* Explore Now Button */}
        <div className="flex justify-center mb-14">
          <button
            onClick={onExplore}
            className="px-8 py-3 rounded-full bg-[#d84315] hover:bg-[#bf360c] text-white text-sm font-bold tracking-wide shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            Explore Now
          </button>
        </div>

        {/* Central Smartphone Frame with Orbiting Badges */}
        <div className="relative max-w-sm sm:max-w-md mx-auto pt-4">
          {/* Floating Pill Badge 1: APPS (Top Left) */}
          <div className="absolute top-12 -left-4 sm:-left-12 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#673ab7] text-white shadow-xl animate-phonepe-float border border-white/20">
            <div className="w-6 h-6 rounded-md bg-white/20 grid grid-cols-2 gap-0.5 p-1">
              <span className="bg-amber-300 rounded-[2px]" />
              <span className="bg-pink-300 rounded-[2px]" />
              <span className="bg-purple-300 rounded-[2px]" />
              <span className="bg-emerald-300 rounded-[2px]" />
            </div>
            <span className="text-xs font-black tracking-wider uppercase">APPS</span>
          </div>

          {/* Floating Pill Badge 2: TOP-UPS (Bottom Left) */}
          <div
            className="absolute bottom-24 -left-6 sm:-left-16 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#673ab7] text-white shadow-xl animate-phonepe-float border border-white/20"
            style={{ animationDelay: "1.5s" }}
          >
            <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-amber-950 font-black text-xs shadow-xs">
              ₹
            </div>
            <span className="text-xs font-black tracking-wider uppercase">TOP-UPS</span>
          </div>

          {/* Floating Pill Badge 3: GIFT CARDS (Right) */}
          <div
            className="absolute top-36 -right-6 sm:-right-14 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#673ab7] text-white shadow-xl animate-phonepe-float border border-white/20"
            style={{ animationDelay: "0.8s" }}
          >
            <span className="text-xs font-black tracking-wider uppercase">GIFT CARDS</span>
            <div className="w-7 h-5 rounded bg-[#26a69a] border border-white/60 flex items-center justify-center relative shadow-xs">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="absolute -top-1 w-3 h-1 bg-red-400 rounded-full" />
            </div>
          </div>

          {/* Smartphone Hardware Frame */}
          <div className="mx-auto w-[290px] sm:w-[325px] bg-[#1a1a1a] rounded-[52px] p-3.5 shadow-2xl border-4 border-slate-700/80">
            {/* Screen */}
            <div className="bg-white rounded-[42px] pt-7 pb-6 px-6 flex flex-col items-center justify-between min-h-[480px] relative overflow-hidden border border-slate-100">
              {/* Dynamic Island / Notch */}
              <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-8" />

              {/* Screen Inner Content (Matching Screenshot 6) */}
              <div className="text-center my-auto">
                <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase block mb-4">
                  INTRODUCING
                </span>

                {/* Placeholder Emblem — replace with final FLOVA mark */}
                <div className="w-20 h-20 mx-auto rounded-full bg-[#e65100] text-white flex items-center justify-center shadow-lg mb-4">
                  <span className="text-2xl font-black tracking-tight leading-none select-none">F</span>
                </div>

                <div className="text-2xl font-black text-[#e65100] tracking-tight">
                  FLOVA
                </div>
                <div className="text-xl font-bold text-[#e65100]/90 tracking-tight">
                  Appstore
                </div>
                <p className="text-[11.5px] text-slate-500 mt-3 max-w-[210px] mx-auto leading-relaxed">
                  One-tap access to partner fuel top-ups, chai stops, and instant gig repair services.
                </p>
              </div>

              {/* Carousel Pagination Dots */}
              <div className="flex items-center gap-1.5 mt-8">
                <span className="w-6 h-2 rounded-full bg-[#673ab7]" />
                <span className="w-2 h-2 rounded-full bg-slate-200" />
                <span className="w-2 h-2 rounded-full bg-slate-200" />
                <span className="w-2 h-2 rounded-full bg-slate-200" />
                <span className="w-2 h-2 rounded-full bg-slate-200" />
                <span className="w-2 h-2 rounded-full bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
