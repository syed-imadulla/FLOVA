import React, { useState } from "react";
import {
  ShieldAlert,
  Activity,
} from "./Icons";
import { SectionHeading } from "./SectionHeading";
import { RubberStamp } from "./FloatingElements";

export const AbyssAuditSection: React.FC = () => {
  const [codHeld, setCodHeld] = useState<number>(3500);
  const [pendingPayout, setPendingPayout] = useState<number>(4200);

  const isCodAlert = codHeld > 3000;

  return (
    <section id="fraud" className="py-28 px-4 sm:px-6 lg:px-8 relative bg-[#09111e] text-white overflow-hidden">
      {/* Dark Ambient Gradients and Lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 dot-pattern-dark opacity-30 pointer-events-none" />

      {/* Heading with Navy Theme */}
      <SectionHeading
        theme="navy"
        eyebrow="DETERMINISTIC RULE &amp; AUDIT ENGINE"
        title="Every rupee tells a story."
        italicWord="Watch for the unusual."
        description="FLOVA's deterministic rules guard Indian gig workers against predatory loan apps and accidental COD spending. Unearned platform receipts are never counted as liquid cash."
      />

      <div className="max-w-6xl mx-auto mt-20 space-y-16 relative z-10">
        {/* Core Showcase Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#101b2f] border border-blue-900/40 rounded-3xl p-6 sm:p-10 navy-card-shadow relative overflow-hidden">
          {/* Accent Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Left: Audit Trace Diagram */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/50">
              <span className="text-xs font-mono font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                CUSTODIAL AUDIT TRACE #COD-4200
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${isCodAlert ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"}`}>
                {isCodAlert ? "COD REMITTANCE REQUIRED" : "SAFE BOUNDS"}
              </span>
            </div>

            {/* Visualizer Flow Box */}
            <div className="relative p-6 rounded-2xl bg-[#09111e]/90 border border-blue-900/60 font-mono text-xs space-y-4">
              <div className="flex justify-between items-center text-stone-300">
                <span>Rider Wallet Cash:</span>
                <span className="font-bold text-white">₹5,000 (500,000 paise)</span>
              </div>
              <div className="flex justify-between items-center text-rose-300">
                <span>Customer COD Cash Held:</span>
                <span className="font-bold text-rose-400">₹{codHeld.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center text-amber-300">
                <span>Expected Monday Payout:</span>
                <span className="font-bold text-amber-400">₹{pendingPayout.toLocaleString("en-IN")} (Excluded)</span>
              </div>
              <div className="pt-3 border-t border-blue-900/60 flex justify-between items-center font-bold text-emerald-300 text-sm">
                <span>Confirmed Liquid Cash:</span>
                <span>₹{Math.max(5000 - codHeld, 0).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <RubberStamp text="RLS RESTRICTED" variant="blue" rotation="rotate-[-2deg]" />
              <RubberStamp text="NO FLOATING POINT" variant="green" rotation="rotate-[3deg]" />
            </div>
          </div>

          {/* Right: Interactive Audit Controls */}
          <div className="lg:col-span-5 bg-[#09111e]/80 border border-blue-800/40 rounded-2xl p-6 font-mono text-xs space-y-5">
            <div className="flex items-center gap-2 text-blue-300 font-bold uppercase text-[11px]">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Interactive Rule Bench</span>
            </div>

            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>Simulate COD Cash Held:</span>
                <span className="text-white font-bold">₹{codHeld.toLocaleString("en-IN")}</span>
              </div>
              <input
                type="range"
                min="500"
                max="6000"
                step="500"
                value={codHeld}
                onChange={(e) => setCodHeld(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>Pending Platform Payout:</span>
                <span className="text-white font-bold">₹{pendingPayout.toLocaleString("en-IN")}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="8000"
                step="500"
                value={pendingPayout}
                onChange={(e) => setPendingPayout(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-stone-400 block mt-1">
                Contract Rule: Expected platform money never inflates spendable cash until settled.
              </span>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800/40 text-[11px] text-blue-200">
              <strong>Audit Status:</strong> {isCodAlert ? "High COD cash detected. Reminder sent: remit platform cash before weekend." : "Normal operational parameters. Zero debt risk."}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
