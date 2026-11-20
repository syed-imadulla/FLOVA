import React from "react";

interface PhonePeHeroPillarsProps {
  onExploreSolutions?: () => void;
  onLaunchStage: () => void;
}

export const PhonePeHeroPillars: React.FC<PhonePeHeroPillarsProps> = ({
  onLaunchStage,
}) => {
  const pillars = [
    {
      id: "payments",
      title: "Payments",
      subtitle: "30s Daily Check-In",
      desc: "Manage all your daily gig earnings, fuel, and expenses seamlessly in integer paise.",
      illustration: (
        <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto drop-shadow-sm">
          {/* Background card (purple/blue tilt) */}
          <rect x="25" y="32" width="95" height="58" rx="8" transform="rotate(-12 72 61)" fill="#7842c7" opacity="0.9" />
          <rect x="25" y="44" width="95" height="12" rx="0" transform="rotate(-12 72 61)" fill="#4c2288" />
          {/* Foreground card (deep blue/cyan) */}
          <rect x="35" y="42" width="96" height="60" rx="9" fill="#3b78e7" />
          <rect x="35" y="56" width="96" height="13" fill="#1d4592" />
          <rect x="45" y="84" width="40" height="6" rx="3" fill="#8bb5ff" />
          <circle cx="112" cy="85" r="7" fill="#f4b400" opacity="0.9" />
          <circle cx="120" cy="85" r="7" fill="#ea4335" opacity="0.85" />
          {/* Gold Coin Stack */}
          <ellipse cx="44" cy="100" rx="18" ry="7" fill="#e37400" />
          <rect x="26" y="94" width="36" height="6" fill="#f9ab00" />
          <ellipse cx="44" cy="94" rx="18" ry="7" fill="#fdd663" />
          <text x="44" y="97" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#b06000">₹</text>

          <ellipse cx="44" cy="90" rx="18" ry="7" fill="#e37400" />
          <rect x="26" y="84" width="36" height="6" fill="#f9ab00" />
          <ellipse cx="44" cy="84" rx="18" ry="7" fill="#ffe082" />
          <text x="44" y="87" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#b06000">₹</text>

          {/* Floating Gold Coin */}
          <circle cx="128" cy="38" r="14" fill="#f9ab00" />
          <circle cx="128" cy="38" r="11" fill="#ffe082" />
          <text x="128" y="42" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#b06000">₹</text>
          {/* Sparkles */}
          <polygon points="108,22 110,27 115,29 110,31 108,36 106,31 101,29 106,27" fill="#f9ab00" />
        </svg>
      ),
    },
    {
      id: "investments",
      title: "Investments",
      subtitle: "COD & Reserve Buffers",
      desc: "Build, manage & grow your reserve wealth while ringfencing company COD cash.",
      illustration: (
        <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto drop-shadow-sm">
          {/* Bar Chart Bars */}
          <rect x="36" y="52" width="22" height="52" rx="4" fill="#6d79ff" />
          <rect x="68" y="40" width="22" height="64" rx="4" fill="#f38ba8" />
          <rect x="100" y="28" width="22" height="76" rx="4" fill="#e7997a" />
          {/* Base Platform */}
          <rect x="24" y="102" width="110" height="7" rx="3.5" fill="#4a1584" />
          {/* Floating Coin with Rupee */}
          <circle cx="58" cy="30" r="14" fill="#f9ab00" />
          <circle cx="58" cy="30" r="11" fill="#ffe082" />
          <text x="58" y="34" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#b06000">₹</text>
          {/* Sparkle */}
          <polygon points="126,18 128,23 133,25 128,27 126,32 124,27 119,25 124,23" fill="#f9ab00" />
        </svg>
      ),
    },
    {
      id: "insurance",
      title: "Insurance",
      subtitle: "Weekly Salary & Shield",
      desc: "Protect, plan & secure your future against order slumps and sudden monsoon downtime.",
      illustration: (
        <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto drop-shadow-sm">
          {/* Shield */}
          <path
            d="M80 18 L122 36 C122 75 104 100 80 110 C56 100 38 75 38 36 Z"
            fill="#a6c8ff"
          />
          <path
            d="M80 24 L116 40 C116 72 101 94 80 103 C59 94 44 72 44 40 Z"
            fill="#5b93ff"
          />
          {/* Medical Cross on Shield */}
          <rect x="74" y="44" width="12" height="32" rx="2" fill="#1b5e20" opacity="0.8" />
          <rect x="64" y="54" width="32" height="12" rx="2" fill="#1b5e20" opacity="0.8" />

          {/* Umbrella at angle */}
          <path
            d="M36 68 C36 46 68 46 68 68 Z"
            fill="#2e7d32"
          />
          <path
            d="M52 68 V86 C52 90 46 90 46 86"
            fill="none"
            stroke="#f5a623"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      id: "lending",
      title: "Lending",
      subtitle: "0% Slump Advances",
      desc: "Access quick, transparent & secure loans against verified delivery payouts.",
      illustration: (
        <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto drop-shadow-sm">
          {/* Money Pouch */}
          <path
            d="M78 30 C64 30 52 46 52 74 C52 96 66 106 88 106 C110 106 124 96 124 74 C124 46 112 30 98 30 Z"
            fill="#7986cb"
          />
          {/* Pouch Tie Ribbon */}
          <ellipse cx="88" cy="40" rx="16" ry="6" fill="#3f51b5" />
          <path d="M84 40 L76 22 M92 40 L100 22" stroke="#3f51b5" strokeWidth="4" strokeLinecap="round" />

          {/* Stack of Currency Banknotes */}
          <rect x="22" y="66" width="60" height="36" rx="4" fill="#4db6ac" />
          <rect x="26" y="70" width="52" height="28" rx="2" fill="#26a69a" />
          <circle cx="52" cy="84" r="8" fill="#80cbc4" />
          <text x="52" y="88" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#004d40">₹</text>

          {/* Top note outline */}
          <line x1="28" y1="74" x2="38" y2="74" stroke="#e0f2f1" strokeWidth="2" strokeLinecap="round" />
          <line x1="66" y1="94" x2="76" y2="94" stroke="#e0f2f1" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <section id="solutions" className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* 4 Elevated White Cards Grid (PhonePe Signature Hero Feature Row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar) => (
            <div
              key={pillar.id}
              onClick={onLaunchStage}
              className="phonepe-card p-6 flex flex-col justify-between group cursor-pointer border border-[#f0edf5] hover:border-[#d9c4f4]"
            >
              {/* Top Colorful 3D SVG Illustration */}
              <div className="pt-2 pb-4 flex justify-center group-hover:scale-105 transition-transform duration-300">
                {pillar.illustration}
              </div>

              {/* Card Body */}
              <div className="mt-2">
                <h3 className="text-[26px] font-bold text-[#23173d] tracking-tight group-hover:text-[#5f259f] transition-colors leading-tight">
                  {pillar.title}
                </h3>
                <p className="text-[13px] text-[#5e596e] mt-2 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>

              {/* Bottom Right Purple Arrow */}
              <div className="flex justify-end pt-6">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#5f259f] text-lg font-bold group-hover:translate-x-1.5 transition-transform">
                  →
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
