import React, { useState } from "react";

export const WarmSmartBufferArches: React.FC = () => {
  const [selectedPill, setSelectedPill] = useState<number>(0);

  const bufferPills = [
    {
      id: "slump",
      title: "Monsoon & Slump Shock Buffer",
      amount: "₹5,000",
      cadence: "Seasonal Target",
      desc: "Buffers against the 30-40% order dip during heavy Indian monsoon rains without borrowing from high-interest loan apps.",
      tag: "Resilience",
      accent: "border-[#0F5C4C] bg-[#F6FAF7]",
    },
    {
      id: "rent",
      title: "Essential Room Rent Ringfence",
      amount: "₹3,000",
      cadence: "Monthly Target",
      desc: "Locks shelter money on the calendar so daily petrol and food expenses never deplete what is owed to your landlord on the 1st.",
      tag: "Shelter",
      accent: "border-[#B45309] bg-[#FFFBF5]",
    },
    {
      id: "emi",
      title: "Two-Wheeler EMI & Service Pot",
      amount: "₹2,000",
      cadence: "Vehicle Health",
      desc: "Ensures your bike EMI is always deducted on schedule and unexpected tyre punctures or oil changes are cushioned.",
      tag: "Mobility",
      accent: "border-[#7E22CE] bg-[#FBF8FC]",
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF7F2] relative overflow-hidden">
      {/* Curved Arch of Warm Amber & Soft Mint Dots in Background */}
      <div className="absolute inset-x-0 top-0 h-64 dot-wave-arch opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E6F4EA] border border-[#C2E7CD] text-[#0F5C4C] text-xs font-mono font-bold uppercase tracking-wider mb-4">
            <span>✦ SMART SALARY ALLOCATION</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#181A1F] tracking-tight">
            Buffers That Protect Your Household
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#525866] leading-relaxed">
            Organize irregular earnings into targeted allocations that guard against emergency debt.
            Every rupee is recorded in integer paise.
          </p>
        </div>

        {/* Stacked Horizontal Pill Cards (00:20-00:25 blueprint) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Stacked Buffer Options */}
          <div className="lg:col-span-7 space-y-4">
            {bufferPills.map((pill, idx) => (
              <div
                key={pill.id}
                onClick={() => setSelectedPill(idx)}
                className={`p-6 sm:p-7 rounded-3xl border-2 transition-all duration-300 warm-shadow-sm hover:warm-shadow-md cursor-pointer flex items-center justify-between gap-4 ${
                  selectedPill === idx ? pill.accent : "bg-white border-[#E8E3DA] hover:border-stone-400"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-white border border-[#E8E3DA] text-[#525866]">
                      {pill.tag}
                    </span>
                    <span className="text-xs font-mono text-[#7E8695]">
                      (Synthetic Preview Option)
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#181A1F] tracking-tight">
                    {pill.title}
                  </h3>
                  <p className="text-xs text-[#525866] max-w-md leading-relaxed">
                    {pill.desc}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-2xl font-extrabold text-[#181A1F] font-mono">
                    {pill.amount}
                  </div>
                  <div className="text-[11px] text-[#7E8695] font-mono">
                    {pill.cadence}
                  </div>
                  <div className="mt-2 text-sm text-[#0F5C4C] font-bold">
                    &gt;
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Informational Device & Data Integrity Card */}
          <div className="lg:col-span-5 bg-white border border-[#E8E3DA] rounded-3xl p-8 sm:p-10 warm-shadow-lg space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#F5F1EB]">
              <div className="w-10 h-10 rounded-2xl bg-[#E6F4EA] text-[#0F5C4C] flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <div className="font-bold text-sm text-[#181A1F]">Zero Offline Fraud Claims</div>
                <div className="text-xs text-[#7E8695] font-mono">Strict PostgreSQL RLS Sync</div>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#525866] leading-relaxed">
              <p>
                <strong>Truthful Network Reporting:</strong> FLOVA never pretends an unconfirmed save succeeded.
                All financial runway contracts are validated directly through your authenticated session in PostgreSQL.
              </p>
              <p>
                <strong>Uncertainty is Respected:</strong> Missing daily living or fuel costs show as
                <span className="font-mono text-[#B45309] font-bold"> "Not enough information yet"</span>, never as ₹0.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E3DA] font-mono text-xs flex justify-between items-center">
              <span className="text-[#525866]">Math Arithmetic:</span>
              <span className="font-bold text-[#0F5C4C]">100% Integer Paise</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
