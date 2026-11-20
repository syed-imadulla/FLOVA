import React from "react";
import { ArrowRight, Sparkles, ShieldCheck, Database, Layers } from "./Icons";
import {
  CurrencyToken,
  PaperClip,
  StickyNote,
  RubberStamp,
  PaperReceipt,
} from "./FloatingElements";

interface HeroProps {
  onExplore: () => void;
}

export const AbyssHero: React.FC<HeroProps> = ({ onExplore }) => {
  return (
    <section className="relative min-h-[92vh] pt-32 pb-20 overflow-hidden flex flex-col justify-center items-center">
      {/* Background Subtle Dot Pattern */}
      <div className="absolute inset-0 dot-pattern-light opacity-60 pointer-events-none" />

      {/* Floating Stationery / Desk Objects around Hero */}

      {/* Top Left: Silver Paperclip + Sticky Note */}
      <div className="hidden lg:block absolute top-28 left-8 xl:left-20 animate-float-subtle pointer-events-none z-10">
        <PaperClip className="rotate-[25deg] -mb-4 ml-6" />
        <StickyNote
          title="NOTE #01"
          text="Zero floating-point math. Everything strictly calculated in integer paise."
          author="flova.core"
          rotation="rotate-[-4deg]"
        />
      </div>

      {/* Top Right: INR Currency Token + Verified Rubber Stamp */}
      <div className="hidden lg:flex flex-col items-center absolute top-28 right-10 xl:right-24 animate-float-reverse pointer-events-none z-10">
        <CurrencyToken symbol="₹" code="INR" color="#10b981" size="lg" className="rotate-[12deg]" />
        <div className="mt-3">
          <RubberStamp text="PAISE PRECISION" variant="green" rotation="rotate-[-6deg]" />
        </div>
      </div>

      {/* Mid Left: Floating Indian 1-Rupee Medallion Token */}
      <div className="hidden xl:block absolute top-[52%] left-6 animate-float-bob pointer-events-none z-10">
        <CurrencyToken symbol="₹" code="RUNWAY" color="#0e7490" size="md" className="rotate-[-10deg]" />
      </div>

      {/* Mid Right: Floating Cash Receipt with Barcode */}
      <div className="hidden xl:block absolute top-[48%] right-8 animate-float-subtle pointer-events-none z-10">
        <PaperReceipt
          id="TXN-9021"
          title="Weekly Salary Buffer"
          amount="₹4,500"
          currency="Paise"
          status="Guaranteed Payout"
          rotation="rotate-[5deg]"
        />
      </div>

      {/* Bottom Left: Sticky Note with COD Rule Reminder */}
      <div className="hidden lg:block absolute bottom-12 left-16 animate-float-reverse pointer-events-none z-10">
        <StickyNote
          title="RULE ENGINE"
          text="Rule: Customer COD collections are ringfenced as liabilities. Never spend what belongs to Swiggy/Zomato."
          author="custodial_daemon"
          rotation="rotate-[6deg]"
        />
      </div>

      {/* Bottom Right: Rubber Stamp */}
      <div className="hidden lg:block absolute bottom-14 right-20 animate-float-bob pointer-events-none z-10">
        <RubberStamp text="50-YR BACKTEST CONFIRMED" variant="amber" rotation="rotate-[-4deg]" />
      </div>

      {/* Central Content */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-200/70 border border-stone-300 text-stone-800 text-xs font-mono font-semibold tracking-wider uppercase mb-6 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>DETERMINISTIC RUNWAY ENGINE • INTEGER PAISE</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#121316] leading-[1.08] mb-6">
          Make your money move smarter.{" "}
          <span className="font-serif italic font-normal text-stone-500 underline decoration-stone-300 decoration-wavy underline-offset-8">
            Steady weekly salary
          </span>{" "}
          from uneven gig pay.
        </h1>

        {/* Description */}
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-[#5a5f6e] leading-relaxed mb-10 font-normal">
          Built specifically for India's 12 million delivery riders, drivers, and freelance service professionals.
          Rings fence platform cash-on-delivery, absorbs monsoon slumps, and guarantees zero panic borrowing.
        </p>

        {/* Primary and Secondary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <button
            onClick={onExplore}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#121316] hover:bg-stone-800 text-white font-semibold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Launch Interactive Runway</span>
            <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href="#how-it-works"
            className="w-full sm:w-auto px-7 py-4 rounded-full bg-white hover:bg-stone-50 border border-stone-300/80 text-stone-800 font-semibold text-base shadow-2xs hover:shadow-sm transition-all duration-200 flex items-center justify-center gap-2 text-center"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>How It Works (3 Steps)</span>
          </a>
        </div>

        {/* Quick Audit / Precision Badges Tape */}
        <div className="pt-8 border-t border-stone-200/80 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono text-stone-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>PostgreSQL Row-Level Security</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <span>Integer Paise Precision</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Ringfenced COD Custodial Liability</span>
          </div>
        </div>
      </div>
    </section>
  );
};
