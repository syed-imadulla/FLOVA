import React, { useState } from "react";

export const WarmConcentricShowcase: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<number>(0);

  const features = [
    {
      title: "Daily 30-Second Check-In",
      eyebrow: "POCKET CASH + BANK - COD",
      subtext:
        "Every evening, record what is in your pocket and bank account. FLOVA locks the timestamp so you know your true liquid starting point without messy math.",
      metricValue: "₹4,200",
      metricLabel: "Starting Liquid Cash",
      tag: "Habit",
      detailItems: [
        { label: "Pocket Physical Cash", value: "₹1,500 (150,000 paise)" },
        { label: "UPI Bank Account", value: "₹3,200 (320,000 paise)" },
        { label: "Customer COD Held", value: "−₹500 (Not-Mine Ringfenced)" },
      ],
      tagline: "Synthetic Preview Example: Ravi's Daily Check-in",
    },
    {
      title: "COD Custodial Ringfence",
      eyebrow: "ACTUAL CASH VS. PLATFORM MONEY",
      subtext:
        "Customer cash collected from deliveries is strictly isolated from your own earnings. It never inflates your spendable balance or tricks you into accidental overspending.",
      metricValue: "₹1,800",
      metricLabel: "Ringfenced COD Liability",
      tag: "Protection",
      detailItems: [
        { label: "Swiggy Order Cash Collected", value: "₹1,200" },
        { label: "Rapido Passenger Cash", value: "₹600" },
        { label: "Remittance Status", value: "Due Friday (Excluded from balance)" },
      ],
      tagline: "Synthetic Preview Example: COD Protection Active",
    },
    {
      title: "Monsoon & Slump Buffer",
      eyebrow: "UNBUFFERED SLUMP VS. STEADY SALARY",
      subtext:
        "When heavy rains or platform downtime reduce order volumes by 40%, your FLOVA buffer absorbs the dip so household food, fuel, and room rent remain steady.",
      metricValue: "₹4,500/wk",
      metricLabel: "Guaranteed Weekly Baseline",
      tag: "Smoothing",
      detailItems: [
        { label: "50-Year Simulation", value: "100% Backtested" },
        { label: "Rain Slump Absorption", value: "Up to 5 Days Dip" },
        { label: "Panic Loan Avoidance", value: "Zero Debt Traps" },
      ],
      tagline: "Synthetic Preview Example: 50-Yr Backtested Slump Buffer",
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF7F2] relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Deep-Yet-Warm Rounded Container with Concentric Ring Lines (00:02-00:07 blueprint) */}
        <div className="relative rounded-[36px] bg-[#152220] text-white p-8 sm:p-14 lg:p-16 overflow-hidden warm-shadow-deep border border-emerald-950">
          {/* Subtle Concentric Rings SVG in Background */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-15 overflow-hidden">
            <svg width="1200" height="1200" viewBox="0 0 1200 1200" fill="none">
              <circle cx="600" cy="600" r="160" stroke="#6EE7B7" strokeWidth="1" strokeDasharray="6 6" />
              <circle cx="600" cy="600" r="280" stroke="#6EE7B7" strokeWidth="1" />
              <circle cx="600" cy="600" r="420" stroke="#6EE7B7" strokeWidth="1.2" strokeDasharray="8 8" />
              <circle cx="600" cy="600" r="560" stroke="#6EE7B7" strokeWidth="1" />
            </svg>
          </div>

          {/* Warm Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Row */}
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-12 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider mb-4">
                <span>✦ CONCENTRIC RUNWAY ENGINE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                Confidence Built on Pure Mathematical Clarity
              </h2>
            </div>

            {/* Quick Interactive Selector Tabs */}
            <div className="flex flex-wrap gap-2">
              {features.map((f, idx) => (
                <button
                  key={f.title}
                  onClick={() => setActiveFeature(idx)}
                  className={`px-4 py-2 rounded-full font-mono text-xs font-bold transition-all cursor-pointer ${
                    activeFeature === idx
                      ? "bg-white text-[#152220] shadow-md"
                      : "bg-white/10 text-stone-300 hover:bg-white/20"
                  }`}
                >
                  {f.tag}: {f.title.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Feature Stage */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mt-12">
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-emerald-400 block">
                {features[activeFeature].eyebrow}
              </span>

              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {features[activeFeature].title}
              </h3>

              <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
                {features[activeFeature].subtext}
              </p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 font-mono text-xs space-y-2.5">
                {features[activeFeature].detailItems.map((item) => (
                  <div key={item.label} className="flex justify-between items-center text-stone-200">
                    <span className="text-stone-400">{item.label}:</span>
                    <span className="font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="text-[11px] font-mono text-amber-300/80">
                ✦ {features[activeFeature].tagline}
              </div>
            </div>

            {/* Right Interactive Centerpiece / Action Card with Centered Action Badge */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="relative w-full max-w-md bg-[#1C2C29] border border-white/15 rounded-3xl p-8 warm-shadow-lg text-center overflow-hidden">
                {/* Floating Centered Action Badge (00:02-00:07) */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[#0F5C4C] to-[#0A3D33] border-2 border-emerald-400/50 flex flex-col items-center justify-center shadow-lg transform transition-transform hover:scale-105 select-none">
                  <span className="text-2xl font-bold font-serif text-white">₹1</span>
                  <span className="text-[8px] font-mono text-emerald-300 uppercase tracking-tight">PAISE</span>
                </div>

                <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold mb-1">
                  {features[activeFeature].metricLabel}
                </div>

                <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-mono mb-4">
                  {features[activeFeature].metricValue}
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-xs text-stone-300 leading-relaxed font-sans mb-6">
                  Calculated deterministically in integer paise from agreed contracts.
                  No algorithmic hallucination or predatory loan fees.
                </div>

                <div className="flex justify-center gap-3">
                  <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ✓ RLS Validated
                  </span>
                  <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ✦ Synthetic Demo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
