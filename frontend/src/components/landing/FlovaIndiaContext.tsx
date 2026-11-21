import React from "react";

export const FlovaIndiaContext: React.FC = () => {
  const metrics = [
    {
      value: "12.5M+",
      label: "Gig & Platform Delivery Workers",
      subtext: "Actively delivering across Tier 1, 2, and 3 Indian cities",
      source: "NITI Aayog (2022) Booming Gig Economy Study",
    },
    {
      value: "34%",
      label: "Average Income Volatility",
      subtext: "Week-to-week fluctuation in take-home gig payouts",
      source: "IDInsight 2024 Gig Worker Financial Study",
    },
    {
      value: "₹0",
      label: "Bank Passwords or UPI PINs",
      subtext: "Zero banking data scraping; private client-side security",
      source: "FLOVA Core Privacy Principle",
    },
  ];

  const workProfiles = [
    { label: "Food Delivery", platforms: "Zomato · Swiggy · Zepto", icon: "🛵" },
    { label: "Cab / Auto Driver", platforms: "Uber · Ola · Rapido", icon: "🛺" },
    { label: "Field & Home Tech", platforms: "Urban Company · Local Pros", icon: "🔧" },
    { label: "Freelancer & Tech", platforms: "Upwork · Design · Code", icon: "💻" },
    { label: "Small Shop & Vendor", platforms: "Kirana · Stalls · Markets", icon: "🏪" },
    { label: "Daily Wage & Trades", platforms: "Construction · Craft Trades", icon: "🔨" },
    { label: "Seasonal & Agro", platforms: "Harvest · Regional Trade", icon: "🌾" },
  ];

  return (
    <section className="py-16 sm:py-20 bg-[#FAF7F2] border-b border-[#E5E2DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#0F5C4C] uppercase tracking-wider block mb-2">
            The Indian Reality
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#16181D] tracking-tight">
            Designed for India's Unpredictable Weekly Earnings
          </h2>
          <p className="mt-3 text-base text-[#4A524C]">
            When payouts vary weekly and platform incentives shift daily, a conventional monthly budget is useless. FLOVA is purpose-built for the reality of Indian gig work.
          </p>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E2DC] shadow-xs text-center flex flex-col justify-between"
            >
              <div>
                <div className="text-4xl sm:text-5xl font-black text-[#0F5C4C] font-mono tracking-tight mb-2">
                  {m.value}
                </div>
                <div className="text-base font-bold text-[#16181D] mb-1">
                  {m.label}
                </div>
                <div className="text-xs text-[#5A635B]">
                  {m.subtext}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F0ECE1] text-[11px] text-[#7A7468] italic font-medium">
                Source: {m.source}
              </div>
            </div>
          ))}
        </div>

        {/* Research Context Notice */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center max-w-3xl mx-auto mb-10">
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong className="text-slate-800">Research Transparency:</strong> Metrics above cite published economic studies (NITI Aayog 2022, IDInsight 2024, Economic Survey 2025-26). All app screenshots and dashboard previews demonstrate synthetic illustrative profiles.
          </p>
        </div>

        {/* Work Category Pills */}
        <div className="text-center">
          <span className="text-xs font-bold text-[#7A7468] uppercase tracking-wider block mb-4">
            Adaptive Profiles Supported
          </span>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {workProfiles.map((p, idx) => (
              <div
                key={idx}
                className="px-4 py-2.5 rounded-xl bg-white border border-[#E5E2DC] shadow-xs flex items-center gap-2.5 text-xs text-[#16181D]"
              >
                <span className="text-base">{p.icon}</span>
                <span className="font-bold">{p.label}</span>
                <span className="text-[#7A7468] hidden sm:inline">({p.platforms})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
