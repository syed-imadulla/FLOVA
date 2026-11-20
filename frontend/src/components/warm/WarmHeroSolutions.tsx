import React from "react";

interface WarmHeroSolutionsProps {
  onExploreSolutions: () => void;
  onLaunchStage: () => void;
}

export const WarmHeroSolutions: React.FC<WarmHeroSolutionsProps> = ({
  onExploreSolutions,
  onLaunchStage,
}) => {
  const solutionPillars = [
    {
      id: "checkin",
      tag: "DAILY HABIT",
      title: "30-Second Check-In",
      desc: "Lock in pocket cash and UPI bank balances every evening without spreadsheet dread.",
      badge: "Integer Paise",
      wash: "bg-[#FFFBF5] border-[#F2E8DC] hover:border-[#D4AF37]",
      accent: "text-[#B45309]",
      iconBg: "bg-[#FEF3C7] text-[#B45309]",
      syntheticNote: "Synthetic Preview: 30s record locks starting runway.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      id: "cod",
      tag: "CUSTODIAL SHIELD",
      title: "COD Cash Separation",
      desc: "Ringfence Swiggy, Zomato & Rapido customer cash collections as strictly not-mine.",
      badge: "Never Overspend",
      wash: "bg-[#F6FAF7] border-[#DFECE2] hover:border-[#0F5C4C]",
      accent: "text-[#0F5C4C]",
      iconBg: "bg-[#E6F4EA] text-[#0F5C4C]",
      syntheticNote: "Synthetic Preview: Auto-excludes platform COD liabilities.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    {
      id: "salary",
      tag: "STEADY BASELINE",
      title: "Weekly Salary Buffer",
      desc: "Smooth out volatile day-to-day gig payouts into a dependable weekly paycheck.",
      badge: "50-Yr Backtested",
      wash: "bg-[#FBF8FC] border-[#EADEEF] hover:border-[#7E22CE]",
      accent: "text-[#7E22CE]",
      iconBg: "bg-[#F3E8FF] text-[#7E22CE]",
      syntheticNote: "Synthetic Preview: Eliminates panic loans during order slumps.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      id: "bills",
      tag: "COMMITMENT SHIELD",
      title: "Essential Bills & Rent",
      desc: "Automatically ringfences room rent, bike EMI, and child school fees on due dates.",
      badge: "Zero Shortfall",
      wash: "bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#0284C7]",
      accent: "text-[#0284C7]",
      iconBg: "bg-[#E0F2FE] text-[#0284C7]",
      syntheticNote: "Synthetic Preview: Auto-deducted only on scheduled calendar date.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
  ];

  return (
    <section id="company" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#FAF7F2]">
      {/* Subtle Background Organic Glows */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#FFF5E6]/60 via-[#F3EFEA]/40 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Main Confident & Warm Headline Lockup */}
        <div className="max-w-4xl mx-auto text-center mb-16 sm:mb-20">
          {/* Friendly pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E8E3DA] shadow-xs text-xs font-bold text-[#0F5C4C] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#0F5C4C] animate-pulse" />
            <span>ADAPTIVE RUNWAY ARCHITECTURE FOR INDIAN GIG WORKERS</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#181A1F] tracking-tight leading-[1.08] mb-6">
            Make your money move smarter.{" "}
            <span className="font-serif italic font-normal text-[#0F5C4C] underline decoration-[#C2E7CD] decoration-wavy underline-offset-8">
              Steady weekly salary
            </span>{" "}
            from uneven gig pay.
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-[#525866] leading-relaxed mb-10 font-normal">
            Built specifically for India's 12 million delivery riders, drivers, and freelance service professionals.
            Rings fence cash-on-delivery, absorbs monsoon slumps, and guarantees zero panic borrowing.
          </p>

          {/* Quick CTA Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onLaunchStage}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#0F5C4C] hover:bg-[#0A3D33] text-white font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Explore Interactive Runway</span>
              <span>→</span>
            </button>

            <button
              onClick={onExploreSolutions}
              className="w-full sm:w-auto px-7 py-4 rounded-full bg-white hover:bg-[#F5F1EB] border border-[#E8E3DA] text-[#181A1F] font-bold text-sm shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              View 4-Pillar Solutions
            </button>
          </div>
        </div>

        {/* 4-Card Core Solutions Row (00:00-00:02 blueprint) */}
        <div id="solutions" className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold font-mono tracking-widest uppercase text-[#0F5C4C] block mb-1">
                CORE SOLUTIONS
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#181A1F] tracking-tight">
                Designed for the Reality of Indian Gig Cashflow
              </h2>
            </div>
            <span className="text-xs font-mono text-[#7E8695] bg-white px-3 py-1.5 rounded-full border border-[#E8E3DA] self-start sm:self-auto">
              ✦ All preview figures illustrative (integer paise)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutionPillars.map((pillar) => (
              <div
                key={pillar.id}
                onClick={onLaunchStage}
                className={`rounded-3xl p-7 border transition-all duration-300 warm-shadow-sm hover:warm-shadow-md hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between ${pillar.wash}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${pillar.iconBg}`}>
                      {pillar.icon}
                    </div>
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-white/80 border border-[#E8E3DA] text-[#525866]">
                      {pillar.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#181A1F] tracking-tight mb-2">
                    {pillar.title}
                  </h3>

                  <p className="text-xs text-[#525866] leading-relaxed mb-6">
                    {pillar.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-black/5 flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] text-[#7E8695]">
                    {pillar.badge}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-[#181A1F] shadow-xs group-hover:bg-[#181A1F] group-hover:text-white transition-colors">
                    →
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
