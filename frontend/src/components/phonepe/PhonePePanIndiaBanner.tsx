import React from "react";

export const PhonePePanIndiaBanner: React.FC = () => {
  const hubs = [
    {
      id: "bengaluru",
      name: "Bengaluru",
      badge: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md">
          <circle cx="50" cy="50" r="48" fill="#e53935" />
          <path d="M50 2 A48 48 0 0 1 50 98 Z" fill="#fdd835" />
          <circle cx="50" cy="50" r="28" fill="#ffffff" />
          <text x="50" y="55" textAnchor="middle" fontSize="16" fontWeight="900" fill="#2e1b4d">BLR</text>
        </svg>
      ),
    },
    {
      id: "mumbai",
      name: "Mumbai",
      badge: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md">
          <circle cx="50" cy="50" r="48" fill="#1e88e5" />
          <rect x="2" y="35" width="96" height="30" fill="#ffffff" />
          <rect x="2" y="65" width="96" height="33" fill="#43a047" />
          <circle cx="50" cy="50" r="28" fill="#ffffff" />
          <text x="50" y="55" textAnchor="middle" fontSize="16" fontWeight="900" fill="#2e1b4d">BOM</text>
        </svg>
      ),
    },
    {
      id: "delhi",
      name: "Delhi-NCR",
      badge: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md">
          <circle cx="50" cy="50" r="48" fill="#ff9933" />
          <rect x="2" y="34" width="96" height="32" fill="#ffffff" />
          <rect x="2" y="66" width="96" height="32" fill="#138808" />
          <circle cx="50" cy="50" r="14" fill="none" stroke="#000080" strokeWidth="2.5" />
          <circle cx="50" cy="50" r="3" fill="#000080" />
        </svg>
      ),
    },
    {
      id: "hyderabad",
      name: "Hyderabad",
      badge: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md">
          <circle cx="50" cy="50" r="48" fill="#8e24aa" />
          <circle cx="50" cy="50" r="38" fill="#fdd835" />
          <circle cx="50" cy="50" r="28" fill="#ffffff" />
          <text x="50" y="55" textAnchor="middle" fontSize="16" fontWeight="900" fill="#4a148c">HYD</text>
        </svg>
      ),
    },
    {
      id: "chennai",
      name: "Chennai",
      badge: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md">
          <circle cx="50" cy="50" r="48" fill="#fb8c00" />
          <circle cx="50" cy="50" r="36" fill="#00acc1" />
          <circle cx="50" cy="50" r="26" fill="#ffffff" />
          <text x="50" y="55" textAnchor="middle" fontSize="16" fontWeight="900" fill="#006064">MAA</text>
        </svg>
      ),
    },
    {
      id: "pune",
      name: "Pune",
      badge: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md">
          <circle cx="50" cy="50" r="48" fill="#e91e63" />
          <circle cx="50" cy="50" r="36" fill="#4caf50" />
          <circle cx="50" cy="50" r="26" fill="#ffffff" />
          <text x="50" y="55" textAnchor="middle" fontSize="16" fontWeight="900" fill="#880e4f">PNQ</text>
        </svg>
      ),
    },
  ];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-[36px] bg-[#251A45] text-white py-14 px-6 sm:px-12 text-center relative overflow-hidden shadow-2xl">
          {/* Top Globe with Acoustic Wave Brackets */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6">
            {/* Left Acoustic Waves */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-14 rounded-full bg-[#9c27b0]/40 -rotate-12" />
              <span className="w-4 h-20 rounded-full bg-[#ba68c8]/60 -rotate-6" />
            </div>

            {/* Glowing 3D Wireframe Globe */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-[#1a237e] to-[#3949ab] flex items-center justify-center shadow-lg border-2 border-indigo-400/30 overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-200/40">
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <ellipse cx="50" cy="50" rx="46" ry="18" fill="none" stroke="currentColor" strokeWidth="1" />
                <ellipse cx="50" cy="50" rx="46" ry="34" fill="none" stroke="currentColor" strokeWidth="1" />
                <ellipse cx="50" cy="50" rx="18" ry="46" fill="none" stroke="currentColor" strokeWidth="1" />
                <ellipse cx="50" cy="50" rx="34" ry="46" fill="none" stroke="currentColor" strokeWidth="1" />
                <line x1="2" y1="50" x2="98" y2="50" stroke="currentColor" strokeWidth="1" />
                <line x1="50" y1="2" x2="50" y2="98" stroke="currentColor" strokeWidth="1" />
              </svg>
              {/* Pulsing Light Center */}
              <div className="absolute w-8 h-8 rounded-full bg-cyan-400/40 blur-md animate-pulse" />
            </div>

            {/* Right Acoustic Waves */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-20 rounded-full bg-[#ba68c8]/60 rotate-6" />
              <span className="w-4 h-14 rounded-full bg-[#9c27b0]/40 rotate-12" />
            </div>
          </div>

          {/* Section Headline */}
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            FLOVA Pan-India Corridors
          </h2>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl mx-auto mb-12 leading-relaxed">
            Real-time gig earnings tracking and instant zero-fee payout separation at all delivery hubs.
            Now available across Bengaluru, Mumbai, Delhi-NCR, Hyderabad, Chennai, and Pune.
          </p>

          {/* 6 Circular Metro Hub Badges */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
            {hubs.map((hub) => (
              <div
                key={hub.id}
                className="flex flex-col items-center group cursor-pointer hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="rounded-full p-1 bg-white/10 group-hover:bg-white/30 transition-colors">
                  {hub.badge}
                </div>
                <span className="text-[11px] font-bold tracking-wider text-white/80 mt-2">
                  {hub.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
