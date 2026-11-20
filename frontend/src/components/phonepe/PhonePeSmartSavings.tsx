import React from "react";

export const PhonePeSmartSavings: React.FC = () => {
  const savingsCards = [
    {
      id: "gold",
      title: "24K Digital Gold",
      desc: "Buy 24K 99.99% pure certified gold starting from just ₹10.",
      iconBg: "bg-amber-100 text-amber-600",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
    },
    {
      id: "sip",
      title: "Monthly Savings SIP",
      desc: "Automate weekly micro-investments into secure liquid funds from ₹100.",
      iconBg: "bg-emerald-100 text-emerald-600",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
        </svg>
      ),
    },
    {
      id: "slump",
      title: "Slump Buffer Deposit",
      desc: "Locked monsoon reserves that automatically top up your weekly paycheck.",
      iconBg: "bg-blue-100 text-blue-600",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
        </svg>
      ),
    },
    {
      id: "nps",
      title: "NPS & Pension Contribution",
      desc: "Secure long-term post-gig independence with government-backed pension.",
      iconBg: "bg-purple-100 text-purple-600",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#faf9fc]">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#23173d] tracking-tight text-center mb-12">
          Smart savings start here
        </h2>

        {/* Stacked Horizontal Stadium Cards */}
        <div className="space-y-4">
          {savingsCards.map((card) => (
            <div
              key={card.id}
              className="phonepe-savings-pill group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${card.iconBg} flex items-center justify-center shrink-0 shadow-xs`}>
                  {card.icon}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#23173d] group-hover:text-[#5f259f] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5e596e]">
                    {card.desc}
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#5f259f] text-lg font-bold group-hover:translate-x-1.5 transition-transform shrink-0 ml-4">
                →
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
