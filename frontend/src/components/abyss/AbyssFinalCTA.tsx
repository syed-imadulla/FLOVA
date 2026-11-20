import React from "react";
import { ArrowUpRight } from "./Icons";
import {
  CurrencyToken,
  PaperClip,
  StickyNote,
  RubberStamp,
  PaperReceipt,
} from "./FloatingElements";

interface FinalCTAProps {
  onLaunch: () => void;
}

export const AbyssFinalCTA: React.FC<FinalCTAProps> = ({ onLaunch }) => {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 cutting-mat-grid text-white overflow-hidden">
      {/* Decorative Metric Ruler Marks on the cutting mat top/bottom edges */}
      <div className="absolute top-0 left-0 right-0 h-4 border-b border-white/10 flex justify-between px-2 text-[8px] font-mono text-emerald-400/40 select-none pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} className="flex flex-col items-center">
            <span className="h-2 w-px bg-white/20"></span>
            <span>{i * 5}cm</span>
          </span>
        ))}
      </div>

      {/* Floating Decorative Objects scattered across the Green Cutting Mat */}

      {/* Top Left: Post-It Note */}
      <div className="hidden lg:block absolute top-16 left-12 animate-float-subtle pointer-events-none z-10">
        <StickyNote
          title="CUTTING MAT NOTE"
          text="Zero loan app traps. 100% deterministic salary smoothing."
          author="flova.eng"
          rotation="rotate-[-6deg]"
        />
      </div>

      {/* Top Right: INR Currency Token + Verified Rubber Stamp */}
      <div className="hidden lg:flex flex-col items-center absolute top-16 right-16 animate-float-reverse pointer-events-none z-10">
        <CurrencyToken symbol="₹" code="INR" color="#10b981" size="lg" className="rotate-[14deg]" />
        <div className="mt-3">
          <RubberStamp text="ZERO GUESSWORK" variant="amber" rotation="rotate-[4deg]" />
        </div>
      </div>

      {/* Bottom Left: Silver Paperclip + Medallion */}
      <div className="hidden xl:block absolute bottom-16 left-20 animate-float-bob pointer-events-none z-10">
        <PaperClip className="rotate-[35deg] -mb-2 ml-4" />
        <CurrencyToken symbol="₹" code="FLOVA" color="#0e7490" size="md" className="rotate-[-12deg]" />
      </div>

      {/* Bottom Right: Miniature Receipt */}
      <div className="hidden xl:block absolute bottom-14 right-20 animate-float-subtle pointer-events-none z-10">
        <PaperReceipt
          id="TXN-FINAL"
          title="Session Status"
          amount="₹4,500"
          currency="Paise"
          status="50-Yr Backtested"
          rotation="rotate-[6deg]"
        />
      </div>

      {/* Center CTA Lockup */}
      <div className="relative z-20 max-w-3xl mx-auto text-center">
        {/* Eyebrow Stamp */}
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider shadow-sm">
            ✦ READY TO TAKE CONTROL OF YOUR INCOME?
          </span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
          Ditch the Guesswork.{" "}
          <span className="font-serif italic font-normal text-emerald-300 underline decoration-emerald-500/50 decoration-wavy underline-offset-8">
            Own Your Runway.
          </span>
        </h2>

        <p className="text-lg sm:text-xl text-emerald-100/80 leading-relaxed mb-10 max-w-2xl mx-auto font-normal">
          Join thousands of Indian gig delivery and taxi drivers who turned erratic platform payouts into a steady, reliable weekly salary.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onLaunch}
            className="w-full sm:w-auto px-9 py-4 rounded-full bg-white hover:bg-emerald-50 text-[#0b2318] font-bold text-base shadow-2xl hover:scale-105 active:scale-100 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Launch FLOVA Workspace</span>
            <ArrowUpRight className="w-5 h-5 text-[#0b2318]" />
          </button>
        </div>
      </div>
    </section>
  );
};
