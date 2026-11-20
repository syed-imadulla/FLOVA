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
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        {/* Top 3D Purple Play Button with Light Rays & Soft Blue Clouds (Matching Screenshot 8 Exactly) */}
        <div className="relative flex items-center justify-center mb-10">
          {/* Light Rays Burst */}
          <div className="absolute w-96 h-48 flex items-center justify-center pointer-events-none">
            <span className="absolute w-14 h-1.5 bg-[#a7f3d0]/60 rounded-full -top-4 -left-16 rotate-[-28deg]" />
            <span className="absolute w-18 h-1.5 bg-[#a7f3d0]/60 rounded-full top-0 right-[-36px] rotate-[22deg]" />
            <span className="absolute w-12 h-1.5 bg-[#c4b5fd]/60 rounded-full -top-8 right-20 rotate-[-15deg]" />
            <span className="absolute w-14 h-1.5 bg-[#a7f3d0]/60 rounded-full bottom-3 -left-20 rotate-[18deg]" />
            <span className="absolute w-16 h-1.5 bg-[#a7f3d0]/60 rounded-full bottom-0 right-[-30px] rotate-[-24deg]" />
          </div>

          {/* Left Fluffy Cyan Cloud */}
          <div className="hidden sm:block absolute -left-16 top-2 w-36 h-20 opacity-90 pointer-events-none">
            <svg viewBox="0 0 120 60" className="w-full h-full fill-[#cffafe]">
              <path d="M15 50 A20 20 0 0 1 45 35 A26 26 0 0 1 90 30 A22 22 0 0 1 110 50 Z" />
            </svg>
          </div>

          {/* Right Fluffy Cyan Cloud */}
          <div className="hidden sm:block absolute -right-16 top-2 w-36 h-20 opacity-90 pointer-events-none">
            <svg viewBox="0 0 120 60" className="w-full h-full fill-[#cffafe]">
              <path d="M10 50 A22 22 0 0 1 35 30 A26 26 0 0 1 80 35 A20 20 0 0 1 110 50 Z" />
            </svg>
          </div>

          {/* 3D Purple Circular Play Button */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-[#6a1b9a] via-[#8e24aa] to-[#ab47bc] flex items-center justify-center shadow-2xl border-4 border-white cursor-pointer hover:scale-105 transition-transform group">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white" className="ml-1.5 group-hover:scale-110 transition-transform">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Section Headline (Matching Screenshot 8) */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#23173d] tracking-tight mb-5 leading-tight">
          Payments on FLOVA are safe, <br className="hidden sm:inline" />
          reliable, and quick
        </h2>

        {/* Subtitle Paragraph */}
        <p className="text-base sm:text-lg text-[#5e596e] max-w-3xl mx-auto leading-relaxed mb-12">
          One in three gig delivery riders uses FLOVA to log earnings, shield against order slumps, and ringfence company cash — all in just a few clicks. FLOVA also offers automated weekly salary buffers, giving every Indian gig worker equal opportunity to unlock stability and long-term peace of mind.
        </p>

        {/* Interactive Story Carousel Card */}
        <div className="bg-[#faf9fc] rounded-[28px] p-8 sm:p-10 border border-[#ebe5f5] text-left shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-[#f3e8ff] text-[#5f259f] border border-[#e9d5ff]">
              {stories[currentSlide].tag}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-[#5f259f] font-bold shadow-xs border border-slate-200 transition-colors"
                aria-label="Previous slide"
              >
                ←
              </button>
              <button
                onClick={nextSlide}
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-[#5f259f] font-bold shadow-xs border border-slate-200 transition-colors"
                aria-label="Next slide"
              >
                →
              </button>
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-[#23173d] mb-3">
            {stories[currentSlide].title}
          </h3>

          <p className="text-slate-600 italic text-base leading-relaxed mb-6">
            {stories[currentSlide].quote}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500">
              {stories[currentSlide].role}
            </span>
            <span className="text-sm font-black text-[#5f259f]">
              {stories[currentSlide].stat}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
