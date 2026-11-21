import React, { useState } from "react";

export const FlovaHowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      step: "01",
      title: "Check In Actual Cash",
      tagline: "10-second morning reality check",
      description:
        "Enter what you actually have in your physical wallet and verified bank account. FLOVA anchors all calculations in verifiable, ground-truth cash—never assumptions.",
      details: ["Separates personal notes from customer COD", "Verifies starting baseline for the week", "Zero bank integration or account linking needed"],
      previewContent: {
        headline: "Morning Cash Check-in",
        statusBadge: "Step 01 Complete",
        metric1Label: "Cash in Wallet",
        metric1Val: "₹1,200",
        metric2Label: "Bank Balance",
        metric2Val: "₹3,050",
        summaryText: "Starting verified baseline: ₹4,250 confirmed personal cash.",
      },
    },
    {
      step: "02",
      title: "Add Income, Expenses & Payouts",
      tagline: "Instant keypad or 1-tap voice notes",
      description:
        "Log daily petrol, bike maintenance, chai breaks, and customer tips with fast one-tap presets or quick voice memos in Hindi or English.",
      details: ["Voice capture for on-the-road logging", "Tag expenses as living or work-related", "Mark payouts as Scheduled vs. Settled"],
      previewContent: {
        headline: "Fast On-the-Road Entry",
        statusBadge: "Voice / Keypad Entry",
        metric1Label: "Petrol (Work)",
        metric1Val: "−₹250",
        metric2Label: "Chai & Lunch",
        metric2Val: "−₹120",
        summaryText: "Recorded at 3:15 PM via 4-second voice note. Category tagged automatically.",
      },
    },
    {
      step: "03",
      title: "See Day-by-Day Runway",
      tagline: "Crystal-clear mathematical horizon",
      description:
        "Answer the only question that matters: 'Will my available cash last until payout day?' See daily projected closing balances, protected EMI dates, and shortfall warnings.",
      details: ["Honest shortfall alerts days in advance", "Shows 'Not enough info yet' if data is missing", "No AI guesswork—pure deterministic integer math"],
      previewContent: {
        headline: "7-Day Runway Horizon",
        statusBadge: "Runway: Safe Until Friday",
        metric1Label: "Safe Daily Burn",
        metric1Val: "₹450 / day",
        metric2Label: "Protected EMI",
        metric2Val: "₹1,400 (Thu)",
        summaryText: "Closing cash Friday morning: ₹1,120 before fresh weekly payout settles.",
      },
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-[#EEF4EC] border-b border-[#DDE7DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#0F5C4C] uppercase tracking-wider block mb-2">
            Simple 3-Step Routine
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#16181D] tracking-tight">
            How FLOVA Works Every Day
          </h2>
          <p className="mt-3 text-base text-[#4A524C]">
            No complex accounting spreadsheets. Just a clean, 30-second daily habit that prevents mid-week cash crises.
          </p>
        </div>

        {/* 2-Column Interactive Steps + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: 3 Steps List */}
          <div className="lg:col-span-6 space-y-4">
            {steps.map((s, index) => {
              const isSelected = activeStep === index;
              return (
                <div
                  key={s.step}
                  onClick={() => setActiveStep(index)}
                  className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-[#0F5C4C] shadow-md -translate-y-0.5"
                      : "bg-white/60 hover:bg-white border-[#DDE7DA] shadow-xs"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`text-sm font-black px-3 py-1.5 rounded-xl border ${
                        isSelected
                          ? "bg-[#0F5C4C] text-white border-[#0F5C4C]"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {s.step}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-[#16181D]">
                          {s.title}
                        </h3>
                        <span className="text-xs font-semibold text-[#0F5C4C]">
                          {s.tagline}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-[#4A524C] leading-relaxed">
                        {s.description}
                      </p>
                      {isSelected && (
                        <ul className="mt-3 space-y-1.5 pt-3 border-t border-[#F0ECE1]">
                          {s.details.map((d, i) => (
                            <li key={i} className="text-xs text-[#0F5C4C] flex items-center gap-2 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0F5C4C]" />
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Step Preview Hardware Container */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DDE7DA] shadow-xl relative">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#0F5C4C]" />
                  <span className="text-sm font-bold text-[#16181D]">
                    {steps[activeStep].previewContent.headline}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0F5C4C]/10 text-[#0F5C4C]">
                  {steps[activeStep].previewContent.statusBadge}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5E2DC]">
                  <div className="text-xs font-medium text-[#7A7468]">
                    {steps[activeStep].previewContent.metric1Label}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#16181D] font-mono tabular-nums mt-1">
                    {steps[activeStep].previewContent.metric1Val}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5E2DC]">
                  <div className="text-xs font-medium text-[#7A7468]">
                    {steps[activeStep].previewContent.metric2Label}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#16181D] font-mono tabular-nums mt-1">
                    {steps[activeStep].previewContent.metric2Val}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="flex items-start gap-3">
                  <span className="text-lg">💡</span>
                  <div>
                    <div className="text-xs font-bold text-emerald-900">FLOVA Engine Logic</div>
                    <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                      {steps[activeStep].previewContent.summaryText}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Deterministic Math Engine</span>
                <span className="font-semibold text-[#0F5C4C]">Step {activeStep + 1} of 3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
