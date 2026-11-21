import React from "react";

export const FlovaUserStories: React.FC = () => {
  const stories = [
    {
      name: "Ravi Kumar",
      city: "Bengaluru (Koramangala)",
      role: "Delivery Partner",
      platform: "Swiggy & Zomato",
      avatarBg: "bg-emerald-700",
      initial: "R",
      quote:
        "For the first time, I never accidentally spend restaurant COD money on bike petrol. FLOVA keeps company collections ringfenced in a separate box so my Friday payout isn't wiped out by deductions.",
      highlight: "Saved ₹2,500 from accidental COD spending",
    },
    {
      name: "Sunita Murthy",
      city: "Hyderabad (Hitec City)",
      role: "Ride & Auto Partner",
      platform: "Uber & Rapido",
      avatarBg: "bg-teal-700",
      initial: "S",
      quote:
        "My daily CNG and vehicle rental costs ₹650. FLOVA tells me on Tuesday afternoon whether my current cash will survive until Friday's payout. No more borrowing emergency hand loans with interest.",
      highlight: "Knows cash horizon 4 days ahead",
    },
    {
      name: "Arjun Patil",
      city: "Pune (Viman Nagar)",
      role: "Quick Commerce Rider",
      platform: "Zepto & Blinkit",
      avatarBg: "bg-slate-700",
      initial: "A",
      quote:
        "I have a monthly bike EMI of ₹3,400. FLOVA deducts upcoming bills from my daily spending runway. When I see a yellow warning, I put in a 3-hour evening surge shift to maintain my buffer.",
      highlight: "Protected bike EMI with zero missed mandates",
    },
  ];

  return (
    <section id="stories" className="py-16 sm:py-24 bg-[#FAF7F2] border-b border-[#E5E2DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-3">
            <span>Illustrative Personas Derived from Indian Gig Research</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#16181D] tracking-tight">
            Built from Real Field Stories Across Indian Cities
          </h2>
          <p className="mt-3 text-base text-[#4A524C]">
            Representative scenarios modeled from Indian gig delivery worker research, demonstrating how FLOVA prevents cash traps.
          </p>
        </div>

        {/* 3 User Story Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stories.map((s, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-7 border border-[#E5E2DC] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Rider Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-11 h-11 rounded-full ${s.avatarBg} text-white flex items-center justify-center font-bold text-base shadow-xs`}>
                    {s.initial}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#16181D] leading-snug">
                      {s.name}
                    </h3>
                    <div className="text-xs text-[#5A635B]">
                      {s.role} · {s.city}
                    </div>
                  </div>
                </div>

                {/* Platform Tag */}
                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#FAF7F2] text-[#4A524C] border border-[#E5E2DC] mb-4">
                  {s.platform}
                </span>

                {/* Quote */}
                <p className="text-sm text-[#333B37] leading-relaxed italic">
                  "{s.quote}"
                </p>
              </div>

              {/* Highlight footer */}
              <div className="mt-6 pt-4 border-t border-[#F0ECE1] flex items-center gap-2 text-xs font-bold text-[#0F5C4C]">
                <span>✓</span>
                <span>{s.highlight}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
