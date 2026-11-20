import React from "react";

interface PhonePeTransitRowProps {
  onExplore?: () => void;
}

export const PhonePeTransitRow: React.FC<PhonePeTransitRowProps> = ({ onExplore }) => {
  const transitCards = [
    {
      id: "flights",
      title: "Flights",
      illustration: (
        <svg viewBox="0 0 160 100" className="w-full h-24">
          <path
            d="M-20 60 L60 60 C80 60 105 52 135 62 L150 78 C150 82 145 84 135 84 L-20 84 Z"
            fill="#5b93ff"
          />
          <circle cx="125" cy="70" r="3" fill="#ffffff" />
          <circle cx="110" cy="70" r="3" fill="#ffffff" />
          <circle cx="95" cy="70" r="3" fill="#ffffff" />
          <path d="M40 60 L20 30 L45 30 L75 60 Z" fill="#3b78e7" />
          <rect x="-10" y="52" width="16" height="6" rx="2" fill="#3b78e7" />
        </svg>
      ),
    },
    {
      id: "bus",
      title: "Bus",
      illustration: (
        <svg viewBox="0 0 160 100" className="w-full h-24">
          <path
            d="M40 30 C40 24 46 20 54 20 L130 20 C136 20 142 24 142 30 L142 80 L35 80 Z"
            fill="#ba68c8"
          />
          <rect x="52" y="28" width="76" height="24" rx="4" fill="#ffffff" />
          <rect x="35" y="58" width="107" height="6" fill="#7b1fa2" />
          <circle cx="62" cy="80" r="10" fill="#4a148c" />
          <circle cx="62" cy="80" r="4" fill="#ffffff" />
          <circle cx="118" cy="80" r="10" fill="#4a148c" />
          <circle cx="118" cy="80" r="4" fill="#ffffff" />
          <rect x="42" y="66" width="8" height="6" rx="1" fill="#ffeb3b" />
        </svg>
      ),
    },
    {
      id: "train",
      title: "Train",
      illustration: (
        <svg viewBox="0 0 160 100" className="w-full h-24">
          {/* Pantograph */}
          <path d="M75 14 L95 14 M85 14 L85 24" stroke="#ffb300" strokeWidth="2.5" />
          <path
            d="M50 32 C50 26 56 22 64 22 L140 22 C146 22 152 26 152 32 L152 80 L45 80 Z"
            fill="#ffd54f"
          />
          {/* Windows */}
          <rect x="62" y="32" width="76" height="18" rx="4" fill="#4a148c" />
          <circle cx="70" cy="65" r="4" fill="#4a148c" />
          <circle cx="130" cy="65" r="4" fill="#4a148c" />
          {/* Train Front Cowcatcher */}
          <path d="M45 74 L152 74 L152 82 L45 82 Z" fill="#4a148c" />
        </svg>
      ),
    },
    {
      id: "stays",
      title: "Stays & Hotels",
      illustration: (
        <svg viewBox="0 0 160 100" className="w-full h-24">
          <rect x="65" y="10" width="75" height="74" rx="4" fill="#7986cb" />
          <rect x="76" y="20" width="12" height="12" rx="2" fill="#c5cae9" />
          <rect x="96" y="20" width="12" height="12" rx="2" fill="#c5cae9" />
          <rect x="116" y="20" width="12" height="12" rx="2" fill="#c5cae9" />
          <rect x="76" y="38" width="12" height="12" rx="2" fill="#c5cae9" />
          <rect x="96" y="38" width="12" height="12" rx="2" fill="#c5cae9" />
          <rect x="116" y="38" width="12" height="12" rx="2" fill="#c5cae9" />
          {/* Door */}
          <rect x="94" y="60" width="16" height="24" rx="2" fill="#303f9f" />
          {/* Neon Sign HTL */}
          <rect x="42" y="36" width="30" height="16" rx="8" fill="#00e676" />
          <text x="57" y="48" textAnchor="middle" fontSize="9" fontWeight="black" fill="#1b5e20">
            HTL
          </text>
        </svg>
      ),
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto text-center">
        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#23173d] tracking-tight mb-3">
          Travel, stays &amp; commute
        </h2>
        <p className="text-sm text-[#5e596e] max-w-2xl mx-auto mb-14 leading-relaxed">
          Recharge FASTag, book flights, hotels, cabs, and metro tickets, get roadside
          assistance and more seamlessly.
        </p>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {transitCards.map((card) => (
            <div
              key={card.id}
              className="bg-[#f7f6f9] rounded-3xl p-6 text-left flex flex-col justify-between min-h-[220px] hover:bg-[#f0edf5] transition-colors cursor-pointer group relative overflow-hidden"
            >
              <h3 className="text-2xl font-bold text-[#23173d] tracking-tight group-hover:text-[#5f259f] transition-colors">
                {card.title}
              </h3>
              <div className="mt-auto -mb-2 -mr-4 flex justify-end">
                {card.illustration}
              </div>
            </div>
          ))}
        </div>

        {/* Explore Now Button */}
        <button
          onClick={onExplore}
          className="px-8 py-3 rounded-full bg-[#5f259f] hover:bg-[#4d1d83] text-white text-xs font-bold tracking-wider uppercase shadow-xs transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Explore Now</span>
          <span className="text-white/80">→</span>
        </button>
      </div>
    </section>
  );
};
