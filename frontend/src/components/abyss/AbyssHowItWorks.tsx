import React, { useState } from "react";
import { Check, Copy } from "./Icons";
import { SectionHeading } from "./SectionHeading";
import { RubberStamp } from "./FloatingElements";

export const AbyssHowItWorks: React.FC = () => {
  const [cashPaise, setCashPaise] = useState(1500);
  const [bankPaise, setBankPaise] = useState(3200);
  const [notMinePaise, setNotMinePaise] = useState(900);
  const [isCopied, setIsCopied] = useState(false);

  const netAvailable = Math.max(cashPaise + bankPaise - notMinePaise, 0);

  const handleCopyCode = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(`CHECKIN CASH ${cashPaise} BANK ${bankPaise} COD ${notMinePaise}`);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setIsCopied(false);
    }
  };

  return (
    <section id="how-it-works" className="py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#f7f5f0]">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 dot-pattern-light opacity-50 pointer-events-none" />

      <SectionHeading
        eyebrow="SIMPLE 3-STEP ARCHITECTURE"
        title="From uneven gig payouts to"
        italicWord="a steady weekly salary."
        description="A completely deterministic runway engine designed for real Indian gig workers. No algorithmic guess-work, zero loan sharks, and zero floating-point rounding."
      />

      <div className="max-w-6xl mx-auto mt-20 space-y-16">
        {/* STEP 01 — Set Daily Baselines */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-8 sm:p-10 rounded-3xl border border-stone-200/90 paper-shadow-lg relative overflow-hidden">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-mono font-bold border border-stone-200">
              <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">
                01
              </span>
              <span>STEP ONE • ONBOARDING PROFILE</span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#121316] tracking-tight">
              Record Essential Living &amp; Work Costs
            </h3>

            <p className="text-stone-600 text-base leading-relaxed">
              Tell FLOVA what you need to survive each day: food for your family and petrol for your bike.
              Values are stored strictly in integer paise. If an estimate is not given, FLOVA shows
              <span className="font-mono text-amber-800 font-semibold"> "Not enough information yet"</span> instead of guessing zero.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <RubberStamp text="INTEGER PAISE" variant="green" rotation="rotate-[-2deg]" />
              <RubberStamp text="UNCERTAINTY HONORED" variant="blue" rotation="rotate-[3deg]" />
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-[#121316] text-[#faf8f5] p-6 rounded-2xl font-mono text-xs shadow-xl border border-stone-800 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-stone-800 text-stone-400">
                <span>PROFILE CONTRACT SPEC</span>
                <span className="text-emerald-400">● VALIDATED</span>
              </div>
              <div className="space-y-1 text-stone-300">
                <p><span className="text-stone-500">work_profile:</span> "delivery" (Swiggy / Zomato / Zepto)</p>
                <p><span className="text-stone-500">daily_living_estimate:</span> ₹350.00 (35,000 paise)</p>
                <p><span className="text-stone-500">daily_work_estimate:</span> ₹180.00 petrol (18,000 paise)</p>
                <p><span className="text-stone-500">user_id:</span> &lt;auto-populated by RLS&gt;</p>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 02 — Daily 30-Second Check-In */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-8 sm:p-10 rounded-3xl border border-stone-200/90 paper-shadow-lg relative overflow-hidden">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-mono font-bold border border-stone-200">
              <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">
                02
              </span>
              <span>STEP TWO • 30-SECOND CHECK-IN</span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#121316] tracking-tight">
              Count Pocket Cash &amp; Bank
            </h3>

            <p className="text-stone-600 text-base leading-relaxed">
              Every evening or morning, count the rupees in your physical pocket, your UPI bank balance,
              and note down any customer cash you collected for the platform. FLOVA locks your starting point
              from the timestamp of your latest check-in.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <RubberStamp text="30 SECONDS DAILY" variant="amber" rotation="rotate-[2deg]" />
              <RubberStamp text="COD LIABILITY RINGFENCED" variant="green" rotation="rotate-[-3deg]" />
            </div>
          </div>

          <div className="lg:col-span-6 bg-stone-50 border border-stone-200 p-6 rounded-2xl font-mono text-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <span className="font-bold text-stone-800">INTERACTIVE CHECK-IN BENCH</span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-[11px] text-stone-600 hover:text-stone-950 font-bold bg-white px-2.5 py-1 rounded border border-stone-300 cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? "Copied" : "Copy SMS"}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Cash Pocket</span>
                <input
                  type="number"
                  value={cashPaise}
                  onChange={(e) => setCashPaise(Number(e.target.value))}
                  className="w-full text-center font-bold text-sm text-stone-900 bg-transparent border-b border-stone-300 focus:outline-none"
                />
              </div>
              <div className="bg-white p-2.5 rounded border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Bank UPI</span>
                <input
                  type="number"
                  value={bankPaise}
                  onChange={(e) => setBankPaise(Number(e.target.value))}
                  className="w-full text-center font-bold text-sm text-stone-900 bg-transparent border-b border-stone-300 focus:outline-none"
                />
              </div>
              <div className="bg-rose-50 p-2.5 rounded border border-rose-200">
                <span className="text-[10px] text-rose-700 block">COD Held</span>
                <input
                  type="number"
                  value={notMinePaise}
                  onChange={(e) => setNotMinePaise(Number(e.target.value))}
                  className="w-full text-center font-bold text-sm text-rose-700 bg-transparent border-b border-rose-300 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
              <span className="text-emerald-900 font-bold">Confirmed Liquid Starting Cash:</span>
              <span className="text-base font-extrabold text-emerald-800">₹{netAvailable.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* STEP 03 — Guaranteed Runway Outlook */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-8 sm:p-10 rounded-3xl border border-stone-200/90 paper-shadow-lg relative overflow-hidden">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-mono font-bold border border-stone-200">
              <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">
                03
              </span>
              <span>STEP THREE • GUARANTEED RUNWAY</span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#121316] tracking-tight">
              Steady Weekly Salary Runway
            </h3>

            <p className="text-stone-600 text-base leading-relaxed">
              FLOVA projects day-by-day closing balances over a 7-day horizon. Deducts daily food, petrol, and upcoming
              rent/EMI commitments on their exact due dates. Payouts that are still pending or unearned are never counted as cash.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <RubberStamp text="ZERO DEBT TRAPS" variant="green" rotation="rotate-[-1deg]" />
              <RubberStamp text="7-DAY HORIZON" variant="blue" rotation="rotate-[2deg]" />
            </div>
          </div>

          <div className="lg:col-span-6 bg-[#0b2318] text-white p-6 rounded-2xl font-mono text-xs space-y-3 border border-emerald-900">
            <div className="flex justify-between items-center pb-2 border-b border-emerald-800 text-emerald-300">
              <span>FLOVA RUNWAY ENGINE OUTPUT</span>
              <span className="text-emerald-400 font-bold">7-DAY OUTLOOK</span>
            </div>
            <div className="space-y-1.5 text-stone-200">
              <div className="flex justify-between">
                <span>Today's Outflow:</span>
                <span className="text-rose-400">−₹530 (Food + Petrol)</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday Rent Commitment:</span>
                <span className="text-rose-400">−₹2,200</span>
              </div>
              <div className="flex justify-between border-t border-emerald-900/60 pt-1.5 font-bold text-emerald-300">
                <span>Projected Safe Runway:</span>
                <span>8.4 Full Days (No Shortfall)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
