import React from "react";

export const PhonePePanIndiaBanner: React.FC = () => {
  const internationalFlags = [
    {
      id: "singapore",
      name: "Singapore",
      flag: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg">
          <circle cx="50" cy="50" r="48" fill="#ffffff" />
          {/* Top Half Red */}
          <path d="M2 50 A48 48 0 0 1 98 50 Z" fill="#ef4444" />
          {/* White Crescent */}
          <path d="M24 35 A14 14 0 0 0 38 22 A14 14 0 0 1 24 35 Z" fill="#ffffff" />
          {/* 5 Small Stars */}
          <circle cx="38" cy="24" r="1.5" fill="#ffffff" />
          <circle cx="44" cy="28" r="1.5" fill="#ffffff" />
          <circle cx="42" cy="35" r="1.5" fill="#ffffff" />
          <circle cx="34" cy="35" r="1.5" fill="#ffffff" />
          <circle cx="32" cy="28" r="1.5" fill="#ffffff" />
        </svg>
      ),
    },
    {
      id: "uae",
      name: "UAE",
      flag: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg">
          <circle cx="50" cy="50" r="48" fill="#ffffff" />
          {/* Top Green stripe */}
          <path d="M28 20 A48 48 0 0 1 98 50 L28 50 Z" fill="#16a34a" />
          {/* Middle White */}
          <rect x="28" y="36" width="70" height="28" fill="#ffffff" />
          {/* Bottom Black stripe */}
          <path d="M28 64 L98 50 A48 48 0 0 1 28 80 Z" fill="#000000" />
          {/* Left Red Vertical Bar */}
          <path d="M50 2 A48 48 0 0 0 28 80 L28 20 A48 48 0 0 0 50 2 Z" fill="#dc2626" />
        </svg>
      ),
    },
    {
      id: "nepal",
      name: "Nepal",
      flag: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg">
          <circle cx="50" cy="50" r="48" fill="#ffffff" />
          {/* Double Pennant Red Shape */}
          <polygon points="26,18 74,48 48,48 74,78 26,78" fill="#dc2626" stroke="#1e40af" strokeWidth="3" />
          {/* Sun and Moon symbols */}
          <circle cx="40" cy="38" r="5" fill="#ffffff" />
          <circle cx="40" cy="64" r="6" fill="#ffffff" />
        </svg>
      ),
    },
    {
      id: "srilanka",
      name: "Sri Lanka",
      flag: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg">
          <circle cx="50" cy="50" r="48" fill="#f59e0b" />
          {/* Left Vertical Orange and Green Stripes */}
          <path d="M20 25 A48 48 0 0 0 10 50 A48 48 0 0 0 20 75 L30 75 L30 25 Z" fill="#ea580c" />
          <rect x="30" y="25" width="12" height="50" fill="#16a34a" />
          {/* Maroon Center Panel */}
          <rect x="44" y="22" width="46" height="56" rx="4" fill="#881337" />
          {/* Golden Lion */}
          <circle cx="66" cy="48" r="10" fill="#fbbf24" />
          <rect x="62" y="44" width="14" height="6" fill="#fbbf24" />
        </svg>
      ),
    },
    {
      id: "bhutan",
      name: "Bhutan",
      flag: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg">
          <circle cx="50" cy="50" r="48" fill="#ea580c" />
          {/* Diagonal Yellow Upper-Left Half */}
          <path d="M50 2 A48 48 0 0 0 16 84 L84 16 A48 48 0 0 0 50 2 Z" fill="#facc15" />
          {/* White Dragon Emblem */}
          <path d="M38 52 C44 42 56 46 62 40 C66 46 54 58 46 60 Z" fill="#ffffff" />
          <circle cx="58" cy="42" r="3" fill="#ffffff" />
        </svg>
      ),
    },
    {
      id: "mauritius",
      name: "Mauritius",
      flag: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg">
          <circle cx="50" cy="50" r="48" fill="#ffffff" />
          {/* 4 Horizontal Stripes: Red, Blue, Yellow, Green */}
          <path d="M16 16 A48 48 0 0 1 84 16 L84 38 L16 38 Z" fill="#ef4444" />
          <rect x="4" y="38" width="92" height="12" fill="#2563eb" />
          <rect x="4" y="50" width="92" height="12" fill="#facc15" />
          <path d="M16 84 A48 48 0 0 0 84 84 L84 62 L16 62 Z" fill="#16a34a" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Large Rounded Royal Purple Container (Matching Screenshot 10 Exactly) */}
        <div className="rounded-[40px] bg-[#251A45] text-white py-16 px-6 sm:px-12 text-center relative overflow-hidden shadow-2xl">
          {/* Top Globe with Purple Acoustic Waves (Matching Screenshot 10) */}
          <div className="flex items-center justify-center gap-3 sm:gap-5 mb-6">
            {/* Left Acoustic Waves */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-14 rounded-full bg-[#9c27b0]/50 -rotate-12" />
              <span className="w-4 h-22 rounded-full bg-[#ba68c8]/70 -rotate-6" />
            </div>

            {/* Glowing 3D Wireframe Globe */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-[#1e1b4b] to-[#312e81] flex items-center justify-center shadow-2xl border-2 border-indigo-400/40 overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-200/50">
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <ellipse cx="50" cy="50" rx="46" ry="18" fill="none" stroke="currentColor" strokeWidth="1" />
                <ellipse cx="50" cy="50" rx="46" ry="34" fill="none" stroke="currentColor" strokeWidth="1" />
                <ellipse cx="50" cy="50" rx="18" ry="46" fill="none" stroke="currentColor" strokeWidth="1" />
                <ellipse cx="50" cy="50" rx="34" ry="46" fill="none" stroke="currentColor" strokeWidth="1" />
                {/* Dotted Nodes on Globe */}
                <circle cx="48" cy="38" r="2.5" fill="#a78bfa" />
                <circle cx="62" cy="54" r="2.5" fill="#a78bfa" />
                <circle cx="34" cy="60" r="2.5" fill="#a78bfa" />
              </svg>
            </div>

            {/* Right Acoustic Waves */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-22 rounded-full bg-[#ba68c8]/70 rotate-6" />
              <span className="w-4 h-14 rounded-full bg-[#9c27b0]/50 rotate-12" />
            </div>
          </div>

          {/* Headline (Matching Screenshot 10) */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
            FLOVA International &amp; Pan-India
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-indigo-200/90 max-w-2xl mx-auto mb-14 leading-relaxed">
            Make UPI payments internationally at select merchants. Now active across Singapore, UAE, Nepal, Sri Lanka, Bhutan, and Mauritius.
          </p>

          {/* 6 Country Flag Badges Row (Matching Screenshot 10 Exactly) */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
            {internationalFlags.map((item) => (
              <div
                key={item.id}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="group-hover:scale-115 transition-transform duration-300">
                  {item.flag}
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white/90 mt-3 group-hover:text-amber-300 transition-colors">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
