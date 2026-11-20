import React, { useState } from "react";

export const WarmBillsAndStories: React.FC = () => {
  const [storyIndex, setStoryIndex] = useState(0);

  const billCategories = [
    { name: "Family Food & Rations", amount: "₹350/day", tag: "Living" },
    { name: "Petrol / Fuel for Bike", amount: "₹180/day", tag: "Work" },
    { name: "Room Rent on 1st", amount: "₹2,500/mo", tag: "Commitment" },
    { name: "Two-Wheeler EMI", amount: "₹1,850/mo", tag: "Debt" },
    { name: "Mobile & 5G Data Pack", amount: "₹349/mo", tag: "Work" },
    { name: "Kids' School Fees", amount: "₹1,200/mo", tag: "Commitment" },
    { name: "Emergency Medicine Buffer", amount: "₹500/mo", tag: "Buffer" },
    { name: "Vehicle Maintenance & Oil", amount: "₹450/mo", tag: "Work" },
  ];

  const stories = [
    {
      id: "rajesh",
      name: "Rajesh S.",
      role: "Delivery Captain, Bengaluru",
      platform: "Swiggy & Zepto",
      quote:
        "Before FLOVA, whenever monsoon rains hit Bengaluru and order volumes dipped, I had to borrow ₹2,000 from local loan apps just to pay my room rent. Now my FLOVA buffer turns chaotic daily payouts into a steady ₹4,500 weekly salary.",
      avatarWash: "bg-[#E6F4EA] text-[#0F5C4C]",
      initials: "RS",
      metric: "50-Yr Backtested Slump Buffer",
    },
    {
      id: "sunita",
      name: "Sunita M.",
      role: "Home Service Specialist, Mumbai",
      platform: "Urban Company",
      quote:
        "Holding customer cash collections used to give me panic. I never knew which rupees were mine to take home and which belonged to the platform. FLOVA ringfenced COD on day one. My household cashflow is finally peaceful.",
      avatarWash: "bg-[#FEF3C7] text-[#B45309]",
      initials: "SM",
      metric: "100% COD Custodial Ringfence",
    },
    {
      id: "vikram",
      name: "Vikram R.",
      role: "Bike Taxi Captain, Delhi-NCR",
      platform: "Uber & Rapido",
      quote:
        "The 30-second evening check-in is the easiest habit I ever formed. Just count my cash, check my bank UPI, and FLOVA tells me exactly how many days I have until the next payout without guesswork or false promises.",
      avatarWash: "bg-[#F3E8FF] text-[#7E22CE]",
      initials: "VR",
      metric: "8.4 Days Guaranteed Runway",
    },
  ];

  const handlePrev = () => {
    setStoryIndex((prev) => (prev === 0 ? stories.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setStoryIndex((prev) => (prev === stories.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF7F2] relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-20">
        {/* PART 1: Bill & Payout Marquee Strip (00:08-00:12) */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#B45309] block mb-2">
              EVERYDAY REALITY
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#181A1F] tracking-tight">
              Every Day Has Real Expenses. Your Runway Keeps Them Safe.
            </h2>
          </div>

          {/* Smooth Horizontal Marquee Pill Strip */}
          <div className="marquee-wrapper py-3">
            <div className="marquee-content">
              {billCategories.concat(billCategories).map((bill, index) => (
                <div
                  key={`${bill.name}-${index}`}
                  className="px-5 py-3 rounded-2xl bg-white border border-[#E8E3DA] warm-shadow-sm flex items-center gap-3 shrink-0"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0F5C4C]" />
                  <span className="text-xs font-bold text-[#181A1F]">{bill.name}</span>
                  <span className="text-[11px] font-mono text-[#525866] bg-[#F5F1EB] px-2 py-0.5 rounded-lg">
                    {bill.amount}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[#7E8695]">
                    {bill.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-3 text-[11px] font-mono text-[#7E8695]">
            ✦ Synthetic Illustrative Preview: Everyday living &amp; work expenses modeled in integer paise
          </div>
        </div>

        {/* PART 2: Cross-Payout Multi-Platform Showcase (00:13-00:15) */}
        <div className="rounded-[32px] bg-[#F5F1EB] border border-[#E8E3DA] p-8 sm:p-12 warm-shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#0F5C4C]">
                MULTI-PLATFORM COMPATIBILITY
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#181A1F] tracking-tight">
                Works Across All Major Indian Delivery &amp; Cab Networks
              </h3>
              <p className="text-sm text-[#525866] leading-relaxed">
                Whether your earnings disburse daily, weekly, or per-ride, FLOVA maps multiple platform inflows
                into one unified weekly salary envelope so you never juggle fragmented balances.
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-wrap gap-2.5 justify-start lg:justify-end">
              {["Swiggy", "Zomato", "Uber", "Rapido", "Zepto", "Urban Company"].map((platform) => (
                <span
                  key={platform}
                  className="px-4 py-2.5 rounded-2xl bg-white border border-[#E8E3DA] text-xs font-bold text-[#181A1F] warm-shadow-sm flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#0F5C4C]" />
                  <span>{platform}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* PART 3: Wide Story Carousel with Prev/Next Controls (00:16-00:19) */}
        <div className="rounded-[36px] bg-white border border-[#E8E3DA] p-8 sm:p-14 warm-shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 mb-8 border-b border-[#E8E3DA]">
            <div>
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#0F5C4C] block mb-1">
                COMMUNITY PROOF
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#181A1F] tracking-tight">
                Real Stories from Indian Gig Earners
              </h3>
            </div>

            {/* Carousel Previous / Next Circular Buttons */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                onClick={handlePrev}
                className="w-11 h-11 rounded-full bg-[#F5F1EB] hover:bg-[#E8E3DA] text-[#181A1F] font-bold flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Previous story"
              >
                ←
              </button>
              <button
                onClick={handleNext}
                className="w-11 h-11 rounded-full bg-[#0F5C4C] hover:bg-[#0A3D33] text-white font-bold flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Next story"
              >
                →
              </button>
            </div>
          </div>

          {/* Active Story Card */}
          <div className="space-y-6">
            <p className="font-serif italic text-xl sm:text-2xl text-[#181A1F] leading-relaxed">
              "{stories[storyIndex].quote}"
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#F5F1EB]">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold font-mono text-base ${stories[storyIndex].avatarWash}`}
                >
                  {stories[storyIndex].initials}
                </div>
                <div>
                  <div className="font-bold text-base text-[#181A1F]">{stories[storyIndex].name}</div>
                  <div className="text-xs text-[#525866]">
                    {stories[storyIndex].role} • {stories[storyIndex].platform}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-[#E6F4EA] text-[#0F5C4C] border border-[#C2E7CD]">
                  {stories[storyIndex].metric}
                </span>
                <span className="text-[10px] font-mono text-[#7E8695]">
                  (Synthetic Preview Story)
                </span>
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 pt-4">
              {stories.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setStoryIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    storyIndex === idx ? "w-8 bg-[#0F5C4C]" : "bg-[#E8E3DA] hover:bg-[#7E8695]"
                  }`}
                  aria-label={`Go to story ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
