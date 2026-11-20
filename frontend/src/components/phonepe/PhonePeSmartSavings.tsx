import React from "react";

export const PhonePeSmartSavings: React.FC = () => {
  const savingsCards = [
    {
      id: "gold",
      title: "Gold",
      desc: "Buy 24K pure gold securely, starting from just ₹5. Manage, sell, or gift gold digitally anytime.",
      illustration: (
        <svg viewBox="0 0 100 80" className="w-16 h-14 mx-auto">
          {/* Glass Jar with Gold Coins (Matching Screenshot 9) */}
          {/* Jar Base */}
          <path
            d="M30 30 C30 20 70 20 70 30 L66 68 C66 74 34 74 34 68 Z"
            fill="#dbeafe"
            opacity="0.8"
            stroke="#93c5fd"
            strokeWidth="1.5"
          />
          {/* Jar Lid Rim */}
          <ellipse cx="50" cy="24" rx="18" ry="5" fill="#f8fafc" stroke="#93c5fd" strokeWidth="1.5" />
          <rect x="36" y="22" width="28" height="4" fill="#cbd5e1" />
          {/* Gold Coins inside/overflowing jar */}
          <circle cx="50" cy="54" r="8" fill="#f59e0b" />
          <circle cx="50" cy="54" r="6" fill="#fef08a" />
          <circle cx="42" cy="46" r="8" fill="#f59e0b" />
          <circle cx="42" cy="46" r="6" fill="#fef08a" />
          <circle cx="58" cy="44" r="8" fill="#f59e0b" />
          <circle cx="58" cy="44" r="6" fill="#fef08a" />
          <circle cx="50" cy="34" r="7" fill="#f59e0b" />
          <circle cx="50" cy="34" r="5" fill="#fef08a" />
          <text x="50" y="37" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#78350f">₹</text>
        </svg>
      ),
    },
    {
      id: "sip",
      title: "Monthly Gold SIP",
      desc: "Invest in 24K pure gold every month, starting from just ₹100. Set up a Gold SIP and grow your savings effortlessly.",
      illustration: (
        <svg viewBox="0 0 100 80" className="w-16 h-14 mx-auto">
          {/* Gold Bars & Gift Bag (Matching Screenshot 9) */}
          {/* Purple/Blue Gift Shopping Bag */}
          <rect x="44" y="32" width="36" height="38" rx="4" fill="#6366f1" />
          {/* Bag Handles */}
          <path d="M52 32 C52 20 72 20 72 32" fill="none" stroke="#e0e7ff" strokeWidth="2.5" />
          {/* Stack of Gold Bars in Front */}
          {/* Bar 1 */}
          <polygon points="26,66 48,66 54,58 32,58" fill="#f59e0b" />
          <polygon points="32,58 54,58 52,55 30,55" fill="#fef08a" />
          {/* Bar 2 */}
          <polygon points="32,56 54,56 60,48 38,48" fill="#f59e0b" />
          <polygon points="38,48 60,48 58,45 36,45" fill="#fef08a" />
          {/* Sparkles */}
          <polygon points="22,40 23,43 26,44 23,45 22,48 21,45 18,44 21,43" fill="#f59e0b" />
          <polygon points="76,24 77,27 80,28 77,29 76,32 75,29 72,28 75,27" fill="#fbbf24" />
        </svg>
      ),
    },
    {
      id: "slump",
      title: "Weekly Salary Buffer",
      desc: "Automatically lock monsoon & rainy-day reserves that top up your weekly paycheck during platform slumps.",
      illustration: (
        <svg viewBox="0 0 100 80" className="w-16 h-14 mx-auto">
          {/* Shield with Umbrella Buffer */}
          <path d="M50 16 L76 28 C76 56 62 70 50 74 C38 70 24 56 24 28 Z" fill="#60a5fa" />
          <rect x="46" y="32" width="8" height="24" rx="2" fill="#ffffff" />
          <rect x="38" y="40" width="24" height="8" rx="2" fill="#ffffff" />
        </svg>
      ),
    },
    {
      id: "wish",
      title: "FLOVA WISH",
      desc: "Save toward family milestones and vehicle upgrades with intelligent goal-based ringfencing.",
      illustration: (
        <svg viewBox="0 0 100 80" className="w-16 h-14 mx-auto">
          {/* Star Target / Trophy */}
          <circle cx="50" cy="44" r="22" fill="#fbcfe8" />
          <circle cx="50" cy="44" r="16" fill="#f472b6" />
          <polygon points="50,32 54,40 63,41 56,47 58,56 50,51 42,56 44,47 37,41 46,40" fill="#ffffff" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Section Headline (Matching Screenshot 9) */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#23173d] tracking-tight text-center mb-14">
          Smart savings <br className="sm:hidden" />
          start here
        </h2>

        {/* Stacked Double-Lobed Stadium Capsule Cards (Matching Screenshot 9 Exactly) */}
        <div className="space-y-6">
          {savingsCards.map((card) => (
            <div
              key={card.id}
              className="flex flex-col sm:flex-row items-stretch rounded-[48px] sm:rounded-full border border-slate-300 hover:border-[#5f259f] transition-all duration-300 bg-white shadow-xs hover:shadow-lg group cursor-pointer overflow-hidden"
            >
              {/* Left Capsule Lobe (Vertical pod with illustration & title) */}
              <div className="sm:w-64 py-6 px-8 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-slate-200 bg-[#fbfafc] group-hover:bg-[#f6f2fa] transition-colors shrink-0">
                <div className="mb-2 group-hover:scale-105 transition-transform duration-300">
                  {card.illustration}
                </div>
                <h3 className="text-lg font-bold text-[#5f259f] text-center tracking-tight">
                  {card.title}
                </h3>
              </div>

              {/* Right Lobe (Descriptive text) */}
              <div className="flex-1 py-6 px-8 sm:px-10 flex items-center justify-between">
                <p className="text-sm sm:text-base text-[#5e596e] leading-relaxed max-w-xl">
                  {card.desc}
                </p>
                <div className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center text-[#5f259f] text-xl font-bold group-hover:translate-x-2 transition-transform shrink-0 ml-4">
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
