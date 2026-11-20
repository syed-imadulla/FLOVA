import React from "react";

export const FlovaPillars: React.FC = () => {
  const pillars = [
    {
      id: "confirmed-cash",
      badge: "01",
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-200",
      title: "Confirmed Cash Only",
      description:
        "Only verified pocket cash and settled bank balances count toward your runway. FLOVA never inflates your budget with unearned promises.",
      icon: (
        <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: "cod-ringfence",
      badge: "02",
      badgeColor: "bg-amber-100 text-amber-950 border-amber-200",
      title: "COD & Platform Ringfencing",
      description:
        "Cash collected from delivery customers belongs to the platform or vendor. FLOVA isolates COD money so you never spend company cash by mistake.",
      icon: (
        <svg className="w-6 h-6 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: "pending-payouts",
      badge: "03",
      badgeColor: "bg-indigo-100 text-indigo-950 border-indigo-200",
      title: "Pending vs. Settled Payouts",
      description:
        "Scheduled, estimated, or unearned weekly payouts stay separated until the moment they actually settle into your bank account.",
      icon: (
        <svg className="w-6 h-6 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "shortfall-alerts",
      badge: "04",
      badgeColor: "bg-rose-100 text-rose-950 border-rose-200",
      title: "Early Shortfall Warnings",
      description:
        "Mathematical alerts 3 to 5 days before your bike EMI, room rent, or phone recharge is due, giving you time to plan shifts or adjust spending.",
      icon: (
        <svg className="w-6 h-6 text-rose-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 bg-[#FAF7F2] border-t border-b border-[#E5E2DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold text-[#0F5C4C] uppercase tracking-wider block mb-2">
            The FLOVA Difference
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#16181D] tracking-tight">
            Financial Guardrails Built for the Real World
          </h2>
          <p className="mt-3 text-base text-[#4A524C]">
            Mainstream budgeting apps assume fixed monthly salaries. FLOVA is engineered ground-up for variable daily income, weekly payout cycles, and custodial delivery cash.
          </p>
        </div>

        {/* 4-Column Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl p-6 border border-[#E5E2DC] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#E5E2DC] flex items-center justify-center">
                    {p.icon}
                  </div>
                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#16181D] mb-2 leading-snug">
                  {p.title}
                </h3>
                <p className="text-sm text-[#4A524C] leading-relaxed">
                  {p.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
