import React, { useState } from "react";

export const PhonePeSafeQuickCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const stories = [
    {
      id: 1,
      title: "How Ramesh secured his ₹14,000 monthly bike EMI",
      role: "Swiggy Delivery Partner • Bengaluru",
      quote:
        "“Before FLOVA, I was taking high-interest daily loans whenever rain stopped orders. With FLOVA's Weekly Salary Buffer, my Friday pay is guaranteed even during monsoons.”",
      stat: "₹0 Shortfall in 14 Months",
      tag: "BIKE EMI SHIELD",
    },
    {
      id: 2,
      title: "Zero accidental COD spending on weekend orders",
      role: "Zomato & Rapido Rider • Delhi-NCR",
      quote:
        "“I used to mix cash collected from customers with my own wallet money. FLOVA's 30s Check-In automatically locks company cash into custodial holding.”",
      stat: "100% On-Time Cash Return",
      tag: "COD RINGFENCING",
    },
    {
      id: 3,
      title: "50-year deterministic runway simulation gave peace of mind",
      role: "Zepto Hub Logistics • Mumbai",
      quote:
        "“Seeing how my savings buffer survives 50 simulated years of order slumps gave my family real confidence. It's built for how gig workers actually live.”",
      stat: "42 Days Emergency Runway",
      tag: "RUNWAY STABILITY",
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % stories.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + stories.length) % stories.length);
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        {/* Top 3D Purple Play Button with Light Rays & Soft Blue Clouds */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Light Rays */}
          <div className="absolute w-72 h-36 flex items-center justify-center pointer-events-none">
            <span className="absolute w-12 h-1 bg-cyan-200/70 rounded-full -top-4 -left-12 rotate-[-25deg]" />
            <span className="absolute w-16 h-1 bg-cyan-200/70 rounded-full top-0 right-[-30px] rotate-[20deg]" />
            <span className="absolute w-10 h-1 bg-purple-200/70 rounded-full -top-6 right-16 rotate-[-15deg]" />
            <span className="absolute w-12 h-1 bg-cyan-200/70 rounded-full bottom-2 -left-16 rotate-[15deg]" />
            <span className="absolute w-14 h-1 bg-cyan-200/70 rounded-full bottom-0 right-[-24px] rotate-[-25deg]" />
          </div>

          {/* Left Fluffy Cloud */}
          <div className="hidden sm:block absolute -left-12 top-4 w-28 h-14 opacity-80 pointer-events-none">
            <svg viewBox="0 0 100 50" className="w-full h-full fill-cyan-100">
              <path d="M10 40 A15 15 0 0 1 35 30 A20 20 0 0 1 70 25 A18 18 0 0 1 90 40 Z" />
            </svg>
          </div>

          {/* Right Fluffy Cloud */}
          <div className="hidden sm:block absolute -right-12 top-4 w-28 h-14 opacity-80 pointer-events-none">
            <svg viewBox="0 0 100 50" className="w-full h-full fill-cyan-100">
              <path d="M10 40 A18 18 0 0 1 30 25 A20 20 0 0 1 65 30 A15 15 0 0 1 90 40 Z" />
            </svg>
          </div>

          {/* 3D Purple Circular Play Button */}
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#6a1b9a] via-[#8e24aa] to-[#ab47bc] flex items-center justify-center shadow-xl border-4 border-white cursor-pointer hover:scale-105 transition-transform">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white" className="ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Section Headline */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#23173d] tracking-tight mb-4 max-w-2xl mx-auto leading-tight">
          Payments on FLOVA are safe, reliable, and quick
        </h2>

        {/* Subtitle Paragraph */}
        <p className="text-sm text-[#5e596e] max-w-3xl mx-auto mb-14 leading-relaxed">
          Over 45,000 gig delivery partners use the FLOVA app to track cash earnings, separate
          COD liabilities, and build predictable weekly income — all in just a few taps. FLOVA
          also offers dedicated financial stability tools, including Slump Insurance, Reserve
          Buffers, and Micro-Lending, giving every Indian worker an equal opportunity to unlock
          the flow of money and access to security.
        </p>

        {/* Story Card Carousel */}
        <div className="relative max-w-2xl mx-auto bg-[#faf8fc] border border-[#ece4f5] rounded-3xl p-8 sm:p-10 shadow-sm text-left">
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f3e8ff] text-[#7e22ce] mb-4">
            {stories[currentSlide].tag}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-[#23173d] mb-2">
            {stories[currentSlide].title}
          </h3>

          <div className="text-xs font-semibold text-[#5f259f] mb-4">
            {stories[currentSlide].role}
          </div>

          <blockquote className="text-sm text-[#525866] italic leading-relaxed mb-6">
            {stories[currentSlide].quote}
          </blockquote>

          <div className="flex items-center justify-between pt-4 border-t border-[#ece4f5]">
            <div className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              ✓ {stories[currentSlide].stat}
            </div>

            {/* Prev / Next Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer text-sm font-bold"
                aria-label="Previous story"
              >
                ‹
              </button>
              <span className="text-xs font-mono font-bold text-slate-500">
                {currentSlide + 1} / {stories.length}
              </span>
              <button
                onClick={nextSlide}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer text-sm font-bold"
                aria-label="Next story"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
