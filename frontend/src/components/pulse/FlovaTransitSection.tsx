import React from "react";

interface FlovaTransitSectionProps {
  onExplore?: () => void;
}

export const FlovaTransitSection: React.FC<FlovaTransitSectionProps> = ({ onExplore }) => {
  const transitCards = [
    {
      id: "flights",
      title: "Flights",
      illustration: (
        <svg viewBox="0 0 180 120" className="w-full h-28">
          {/* Soft background cloud */}
          <path
            d="M20 90 A25 25 0 0 1 60 70 A35 35 0 0 1 120 65 A30 30 0 0 1 160 90 Z"
            fill="#f1f5f9"
          />
          {/* Airplane fuselage & wings slicing through */}
          <path
            d="M-10 74 L80 74 C105 74 135 66 165 76 L180 92 C180 96 172 98 160 98 L-10 98 Z"
            fill="#5b93ff"
          />
          <circle cx="140" cy="85" r="3.5" fill="#ffffff" />
          <circle cx="122" cy="85" r="3.5" fill="#ffffff" />
          <circle cx="104" cy="85" r="3.5" fill="#ffffff" />
          {/* Blue Wing */}
          <path d="M50 74 L25 40 L52 40 L90 74 Z" fill="#2563eb" />
          <rect x="-8" y="66" width="20" height="8" rx="2" fill="#2563eb" />
          {/* Nose pitot tube */}
          <line x1="168" y1="84" x2="178" y2="84" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "bus",
      title: "Bus",
      illustration: (
        <svg viewBox="0 0 180 120" className="w-full h-28">
          {/* Modern Purple Bus Front-Side Profile (FLOVA Design Specification) */}
          <path
            d="M48 38 C48 30 55 26 65 26 L160 26 C168 26 174 30 174 38 L174 94 L42 94 Z"
            fill="#c084fc"
          />
          {/* Windshield & Windows */}
          <rect x="62" y="36" width="98" height="30" rx="5" fill="#ffffff" />
          {/* Purple Body Stripe */}
          <rect x="42" y="70" width="132" height="8" fill="#7e22ce" />
          {/* Bus Wheels */}
          <circle cx="74" cy="94" r="13" fill="#3b0764" />
          <circle cx="74" cy="94" r="5" fill="#ffffff" />
          <circle cx="146" cy="94" r="13" fill="#3b0764" />
          <circle cx="146" cy="94" r="5" fill="#ffffff" />
          {/* Yellow Headlight */}
          <rect x="50" y="80" width="10" height="7" rx="2" fill="#facc15" />
        </svg>
      ),
    },
    {
      id: "train",
      title: "Train",
      illustration: (
        <svg viewBox="0 0 180 120" className="w-full h-28">
          {/* Pantograph Electric Catenary on Roof */}
          <path d="M85 16 L115 16 M100 16 L100 28" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          <path d="M90 28 L110 28" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />

          {/* Electric Train Locomotive Body (Yellow front & Purple base) */}
          <path
            d="M55 36 C55 28 62 24 72 24 L165 24 C172 24 178 28 178 36 L178 96 L48 96 Z"
            fill="#fde047"
          />
          {/* Driver Windshield (Dark Purple) */}
          <rect x="68" y="36" width="96" height="24" rx="5" fill="#3b0764" />
          {/* Lower Headlights */}
          <circle cx="78" cy="74" r="5.5" fill="#3b0764" />
          <circle cx="152" cy="74" r="5.5" fill="#3b0764" />
          {/* Purple Cowcatcher & Rail Underbody */}
          <path d="M48 88 L178 88 L178 98 L48 98 Z" fill="#3b0764" />
        </svg>
      ),
    },
    {
      id: "stays",
      title: "Stays & Hotels",
      illustration: (
        <svg viewBox="0 0 180 120" className="w-full h-28">
          {/* Modern Indigo Hotel Tower (FLOVA Design Specification) */}
          <rect x="75" y="16" width="95" height="92" rx="6" fill="#818cf8" />
          {/* Grid of Hotel Room Windows */}
          <rect x="88" y="28" width="14" height="14" rx="2.5" fill="#e0e7ff" />
          <rect x="114" y="28" width="14" height="14" rx="2.5" fill="#e0e7ff" />
          <rect x="140" y="28" width="14" height="14" rx="2.5" fill="#e0e7ff" />

          <rect x="88" y="50" width="14" height="14" rx="2.5" fill="#e0e7ff" />
          <rect x="114" y="50" width="14" height="14" rx="2.5" fill="#e0e7ff" />
          <rect x="140" y="50" width="14" height="14" rx="2.5" fill="#e0e7ff" />

          {/* Lobby Front Door */}
          <rect x="110" y="78" width="22" height="30" rx="3" fill="#312e81" />

          {/* Green Glowing Neon "HTL" Sign in Front */}
          <rect x="46" y="48" width="38" height="20" rx="10" fill="#10b981" />
          <text x="65" y="62" textAnchor="middle" fontSize="11" fontWeight="900" fill="#064e3b" letterSpacing="1">
            HTL
          </text>
        </svg>
      ),
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto text-center">
        {/* Headline (FLOVA Design Specification) */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#23173d] tracking-tight mb-3">
          Travel, stays &amp; commute
        </h2>
        <p className="text-sm sm:text-base text-[#5e596e] max-w-2xl mx-auto mb-14 leading-relaxed">
          Recharge FASTag, book flights, hotels, cabs, and metro tickets, get roadside
          assistance and more seamlessly.
        </p>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {transitCards.map((card) => (
            <div
              key={card.id}
              onClick={onExplore}
              className="bg-[#f8f7fa] hover:bg-white rounded-[24px] p-6 text-left border border-transparent hover:border-[#e2d4f8] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group cursor-pointer"
            >
              <h3 className="text-xl sm:text-2xl font-bold text-[#23173d] tracking-tight group-hover:text-[#5f259f] transition-colors">
                {card.title}
              </h3>
              <div className="mt-8 group-hover:scale-105 transition-transform duration-300 flex justify-center items-end">
                {card.illustration}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Explore CTA Button */}
        <div className="flex justify-center">
          <button
            onClick={onExplore}
            className="px-8 py-3.5 rounded-full bg-[#5f259f] hover:bg-[#4d1d83] text-white text-sm font-bold tracking-wide shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <span>Explore Now</span>
            <span className="text-white/90">→</span>
          </button>
        </div>
      </div>
    </section>
  );
};
