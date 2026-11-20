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
      desc: "Manage all your payments and daily gig earnings seamlessly in real time",
      illustration: (
        <svg viewBox="0 0 200 150" className="w-44 h-32 mx-auto drop-shadow-sm">
          {/* Tilted background card (Purple #7842c7) */}
          <g transform="rotate(-14 85 75)">
            <rect x="30" y="38" width="112" height="68" rx="10" fill="#7842c7" />
            <rect x="30" y="52" width="112" height="15" fill="#4c2288" />
            <circle cx="50" cy="85" r="6" fill="#ba68c8" opacity="0.6" />
            <rect x="62" y="82" width="40" height="6" rx="3" fill="#ba68c8" opacity="0.5" />
          </g>

          {/* Foreground card (Navy / Dark Blue #284697) */}
          <rect x="44" y="48" width="118" height="74" rx="10" fill="#1e3a8a" />
          <rect x="44" y="64" width="118" height="16" fill="#172554" />
          <rect x="56" y="98" width="46" height="7" rx="3.5" fill="#93c5fd" opacity="0.8" />
          {/* Mastercard-style overlapping circles */}
          <circle cx="132" cy="100" r="9" fill="#f59e0b" opacity="0.9" />
          <circle cx="144" cy="100" r="9" fill="#ef4444" opacity="0.85" />

          {/* Stack of Gold Rupee Coins on the left */}
          {/* Bottom coin */}
          <ellipse cx="44" cy="124" rx="20" ry="7.5" fill="#b45309" />
          <rect x="24" y="117" width="40" height="7" fill="#f59e0b" />
          <ellipse cx="44" cy="117" rx="20" ry="7.5" fill="#fef08a" />
          <text x="44" y="120" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f">₹</text>

          {/* Middle coin */}
          <ellipse cx="44" cy="113" rx="20" ry="7.5" fill="#b45309" />
          <rect x="24" y="106" width="40" height="7" fill="#f59e0b" />
          <ellipse cx="44" cy="106" rx="20" ry="7.5" fill="#fef08a" />
          <text x="44" y="109" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f">₹</text>

          {/* Top coin */}
          <ellipse cx="44" cy="102" rx="20" ry="7.5" fill="#b45309" />
          <rect x="24" y="95" width="40" height="7" fill="#f59e0b" />
          <ellipse cx="44" cy="95" rx="20" ry="7.5" fill="#fef08a" />
          <text x="44" y="98" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f">₹</text>

          {/* Floating Gold Coin with sparkles (upper right) */}
          <circle cx="152" cy="38" r="16" fill="#f59e0b" />
          <circle cx="152" cy="38" r="13" fill="#fef08a" />
          <text x="152" y="43" textAnchor="middle" fontSize="14" fontWeight="900" fill="#78350f">₹</text>
          {/* Sparkles */}
          <polygon points="126,20 128,26 134,28 128,30 126,36 124,30 118,28 124,26" fill="#f59e0b" />
          <polygon points="174,48 175,52 179,53 175,54 174,58 173,54 169,53 173,52" fill="#fbbf24" />
        </svg>
      ),
    },
    {
      id: "investments",
      title: "Investments",
      desc: "Build, manage & grow your wealth while safeguarding company cash",
      illustration: (
        <svg viewBox="0 0 200 150" className="w-44 h-32 mx-auto drop-shadow-sm">
          {/* Base Platform (Deep Purple) */}
          <rect x="30" y="120" width="140" height="10" rx="5" fill="#3b0764" />
          
          {/* Three Rising Bars */}
          {/* Bar 1: Periwinkle / Blue */}
          <rect x="48" y="64" width="28" height="56" rx="6" fill="#6366f1" />
          {/* Bar 2: Coral Pink */}
          <rect x="86" y="48" width="28" height="72" rx="6" fill="#f472b6" />
          {/* Bar 3: Peach / Terracotta */}
          <rect x="124" y="32" width="28" height="88" rx="6" fill="#fb923c" />

          {/* Floating 3D Gold Coin with Rupee */}
          <circle cx="76" cy="36" r="17" fill="#f59e0b" />
          <circle cx="76" cy="36" r="14" fill="#fef08a" />
          <text x="76" y="41" textAnchor="middle" fontSize="15" fontWeight="900" fill="#78350f">₹</text>

          {/* Sparkles */}
          <polygon points="156,18 158,24 164,26 158,28 156,34 154,28 148,26 154,24" fill="#f59e0b" />
          <polygon points="40,48 41,52 45,53 41,54 40,58 39,54 35,53 39,52" fill="#fbbf24" />
        </svg>
      ),
    },
    {
      id: "insurance",
      title: "Insurance",
      desc: "Protect, plan & secure your future against rainy-day order slumps",
      illustration: (
        <svg viewBox="0 0 200 150" className="w-44 h-32 mx-auto drop-shadow-sm">
          {/* Shield Base (Sky Blue & Royal Blue) */}
          <path
            d="M100 18 L152 42 C152 92 128 122 100 134 C72 122 48 92 48 42 Z"
            fill="#bfdbfe"
          />
          <path
            d="M100 25 L145 47 C145 88 124 115 100 126 C76 115 55 88 55 47 Z"
            fill="#60a5fa"
          />
          {/* Green Cross on Shield */}
          <rect x="93" y="52" width="14" height="40" rx="3" fill="#15803d" />
          <rect x="80" y="65" width="40" height="14" rx="3" fill="#15803d" />

          {/* Green Umbrella in front with hooked orange handle */}
          {/* Umbrella Canopy */}
          <path
            d="M44 80 C44 54 84 54 84 80 Z"
            fill="#16a34a"
          />
          {/* Umbrella Handle Stick */}
          <path
            d="M64 80 V102 C64 107 58 107 58 102"
            fill="none"
            stroke="#ea580c"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      id: "lending",
      title: "Lending",
      desc: "Access quick, transparent & secure loans against verified delivery payouts",
      illustration: (
        <svg viewBox="0 0 200 150" className="w-44 h-32 mx-auto drop-shadow-sm">
          {/* Purple Tied Money Pouch / Sack (Behind) */}
          <path
            d="M106 36 C92 36 78 52 78 82 C78 106 94 118 118 118 C142 118 158 106 158 82 C158 52 144 36 130 36 Z"
            fill="#818cf8"
          />
          {/* Pouch Tie String & Folded Fabric */}
          <ellipse cx="118" cy="46" rx="18" ry="6" fill="#4338ca" />
          <path d="M112 46 L102 24 M124 46 L134 24" stroke="#4338ca" strokeWidth="4" strokeLinecap="round" />

          {/* Stack of Green Currency Banknotes (Foreground) */}
          <rect x="36" y="70" width="84" height="48" rx="6" fill="#14b8a6" stroke="#0d9488" strokeWidth="2" />
          <rect x="42" y="75" width="72" height="38" rx="4" fill="#2dd4bf" />
          <circle cx="78" cy="94" r="12" fill="#99f6e4" />
          <text x="78" y="100" textAnchor="middle" fontSize="15" fontWeight="900" fill="#0f766e">₹</text>

          {/* Banknote Decorative Borders */}
          <line x1="44" y1="80" x2="56" y2="80" stroke="#ccfbf1" strokeWidth="2" strokeLinecap="round" />
          <line x1="100" y1="108" x2="112" y2="108" stroke="#ccfbf1" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <section id="solutions" className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* 4 Elevated White Cards Grid (Matching Screenshot 2 Exactly) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar) => (
            <div
              key={pillar.id}
              onClick={onLaunchStage}
              className="phonepe-card p-7 flex flex-col justify-between group cursor-pointer border border-[#f0edf5] hover:border-[#d9c4f4] bg-white rounded-[24px]"
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
                <p className="text-[13.5px] text-[#5e596e] mt-2 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>

              {/* Bottom Right Purple Arrow */}
              <div className="flex justify-end pt-6">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[#5f259f] text-2xl font-bold group-hover:translate-x-1.5 transition-transform">
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
