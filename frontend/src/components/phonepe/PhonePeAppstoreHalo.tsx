import React from "react";

interface PhonePeAppstoreHaloProps {
  onExplore?: () => void;
}

export const PhonePeAppstoreHalo: React.FC<PhonePeAppstoreHaloProps> = ({ onExplore }) => {
  return (
    <section className="relative pt-16 pb-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      {/* Warm Orange Halo Gradient in Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[550px] phonepe-orange-halo pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 text-center">
        {/* Warm Orange Title */}
        <h2 className="text-4xl sm:text-5xl font-extrabold text-[#d84315] tracking-tight mb-4">
          More Than Just Apps
        </h2>

        {/* Explore Now Button */}
        <div className="flex justify-center mb-12">
          <button
            onClick={onExplore}
            className="px-7 py-2.5 rounded-full bg-[#d84315] hover:bg-[#bf360c] text-white text-xs font-bold tracking-wide shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
          >
            Explore Now
          </button>
        </div>

        {/* Central Phone Mockup with Floating Badges */}
        <div className="relative max-w-sm sm:max-w-md mx-auto pt-6">
          {/* Floating Pill Badge 1: APPS (Top Left) */}
          <div className="absolute top-16 -left-6 sm:-left-12 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#673ab7] text-white shadow-lg animate-phonepe-float">
            <div className="w-6 h-6 rounded-md bg-white/20 grid grid-cols-2 gap-0.5 p-1">
              <span className="bg-amber-300 rounded-[1px]" />
              <span className="bg-pink-300 rounded-[1px]" />
              <span className="bg-purple-300 rounded-[1px]" />
              <span className="bg-emerald-300 rounded-[1px]" />
            </div>
            <span className="text-xs font-black tracking-wider uppercase">APPS</span>
          </div>

          {/* Floating Pill Badge 2: TOP-UPS (Bottom Left) */}
          <div
            className="absolute bottom-24 -left-8 sm:-left-16 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#673ab7] text-white shadow-lg animate-phonepe-float"
            style={{ animationDelay: "1.5s" }}
          >
            <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-amber-900 font-bold text-[10px]">
              ₹
            </div>
            <span className="text-xs font-black tracking-wider uppercase">TOP-UPS</span>
          </div>

          {/* Floating Pill Badge 3: GIFT CARDS / VOUCHERS (Right) */}
          <div
            className="absolute top-32 -right-6 sm:-right-12 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#673ab7] text-white shadow-lg animate-phonepe-float"
            style={{ animationDelay: "0.8s" }}
          >
            <span className="text-xs font-black tracking-wider uppercase">GIFT CARDS</span>
            <div className="w-6 h-4 rounded bg-teal-300 border border-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            </div>
          </div>

          {/* Smartphone Frame */}
          <div className="mx-auto w-[280px] sm:w-[320px] bg-[#1a1a1a] rounded-[48px] p-3 shadow-2xl border-4 border-slate-800">
            {/* Screen */}
            <div className="bg-white rounded-[38px] pt-8 pb-6 px-6 flex flex-col items-center justify-between min-h-[460px] relative overflow-hidden border border-slate-100">
              {/* Dynamic Island / Notch */}
              <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto mb-6" />

              {/* Screen Content */}
              <div className="text-center my-auto">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block mb-4">
                  INTRODUCING
                </span>

                {/* Orange Circular Appstore Emblem */}
                <div className="w-20 h-20 mx-auto rounded-full bg-[#e65100] text-white flex items-center justify-center shadow-md mb-4 group-hover:scale-105 transition-transform">
                  <span className="text-3xl font-black">पे</span>
                </div>

                <div className="text-2xl font-black text-[#e65100] tracking-tight">
                  FLOVA
                </div>
                <div className="text-xl font-bold text-[#e65100]/90 tracking-tight">
                  Appstore
                </div>
                <p className="text-[11px] text-slate-500 mt-2 max-w-[200px] mx-auto">
                  One-tap micro-apps for platform fuel, instant chai breaks, and gig repairs.
                </p>
              </div>

              {/* Carousel Pagination Dots */}
              <div className="flex items-center gap-1.5 mt-6">
                <span className="w-6 h-2 rounded-full bg-[#673ab7]" />
                <span className="w-2 h-2 rounded-full bg-slate-200" />
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
