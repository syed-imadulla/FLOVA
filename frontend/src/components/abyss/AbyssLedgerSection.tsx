import React, { useState } from "react";
import { RefreshCw, CheckCircle2 } from "./Icons";
import { SectionHeading } from "./SectionHeading";
import { StickyNote, RubberStamp } from "./FloatingElements";

export const AbyssLedgerSection: React.FC = () => {
  const [grossPocketRupees, setGrossPocketRupees] = useState<number>(6500);
  const [codLiabilityRupees, setCodLiabilityRupees] = useState<number>(2000);

  // Spendable cash is gross minus ringfenced COD
  const spendableRupees = Math.max(grossPocketRupees - codLiabilityRupees, 0);

  return (
    <section id="currencies" className="py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#faf8f5]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* Heading */}
      <SectionHeading
        eyebrow="ACTUAL CASH VS. COD SEPARATION"
        title="One wallet. Multiple gig platforms."
        italicWord="Zero confusion."
        description="Delivery riders and cab captains hold customer cash-on-delivery every day. FLOVA automatically ringfences COD collections as liabilities so you only spend what you actually own."
      />

      {/* Main Interactive Visual Composition */}
      <div className="max-w-6xl mx-auto mt-16 relative">
        {/* Floating Decorative Elements around Section */}
        <div className="hidden lg:block absolute -top-8 -left-6 z-20 pointer-events-none">
          <StickyNote
            title="FLOVA RULE #1"
            text="COD collected from customers is NOT your money. It belongs to the platform."
            author="custodial_contract"
            rotation="rotate-[-6deg]"
          />
        </div>

        <div className="hidden lg:block absolute -bottom-6 -right-4 z-20 pointer-events-none">
          <RubberStamp text="RINGFENCE VERIFIED" variant="green" rotation="rotate-[8deg]" />
        </div>

        {/* Interactive Cash vs COD Cards Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Card 1: GROSS CASH HELD (Physical pocket + Bank) */}
          <div className="lg:col-span-5 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-stone-200 to-amber-100 rounded-3xl blur-xs opacity-70 group-hover:opacity-100 transition duration-300" />
            <div className="relative bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 paper-shadow-lg transform -rotate-1 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <span className="text-[11px] font-mono uppercase font-bold text-stone-500 tracking-wider">
                  GROSS HOLDINGS • [POCKET + BANK]
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold border border-emerald-200">
                  Daily Check-in
                </span>
              </div>

              <div className="mt-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#121316] text-white flex items-center justify-center font-bold font-mono text-xl shadow-md">
                  ₹
                </div>
                <div>
                  <div className="text-xl font-extrabold text-stone-900">Ravi Kumar</div>
                  <div className="text-xs font-mono text-stone-500">Swiggy &amp; Rapido Captain</div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                <div className="flex justify-between items-center text-xs text-stone-500 font-mono mb-2">
                  <span>GROSS CASH RECORDED</span>
                  <span className="font-bold text-stone-900">₹{grossPocketRupees.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="15000"
                  step="500"
                  value={grossPocketRupees}
                  onChange={(e) => setGrossPocketRupees(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-1">
                  <span>Min ₹2,000</span>
                  <span>Max ₹15,000</span>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-amber-50/60 border border-amber-200/60">
                <div className="flex justify-between items-center text-xs text-amber-900 font-mono mb-2">
                  <span>PLATFORM COD COLLECTED (NOT-MINE)</span>
                  <span className="font-bold text-rose-700">−₹{codLiabilityRupees.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={grossPocketRupees - 500}
                  step="250"
                  value={codLiabilityRupees}
                  onChange={(e) => setCodLiabilityRupees(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-amber-700/70 font-mono mt-1">
                  <span>₹0 COD</span>
                  <span>High COD Surge</span>
                </div>
              </div>
            </div>
          </div>

          {/* Central Animated Flow Divider */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-4">
            <div className="w-12 h-12 rounded-full bg-white border border-stone-200/90 shadow-md flex items-center justify-center text-stone-700 hover:rotate-180 transition-transform duration-500">
              <RefreshCw className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="mt-2 text-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 font-bold block">
                RINGFENCE
              </span>
              <span className="text-xs font-bold text-stone-800">Deterministic</span>
            </div>
          </div>

          {/* Card 2: TRUE SPENDABLE ENVELOPE */}
          <div className="lg:col-span-5 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-3xl blur-xs opacity-70 group-hover:opacity-100 transition duration-300" />
            <div className="relative bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 paper-shadow-lg transform rotate-1 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <span className="text-[11px] font-mono uppercase font-bold text-emerald-700 tracking-wider">
                  CONFIRMED SPENDABLE LIQUID RUNWAY
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  Safe To Spend
                </span>
              </div>

              <div className="mt-6 text-center py-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/60">
                <div className="text-xs font-mono uppercase tracking-widest text-emerald-800 font-semibold mb-1">
                  Actual Personal Rupee Balance
                </div>
                <div className="text-4xl sm:text-5xl font-extrabold text-stone-900 tracking-tight font-mono">
                  ₹{spendableRupees.toLocaleString("en-IN")}
                </div>
                <div className="mt-2 text-xs font-mono text-emerald-700 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                  <span>Excludes ₹{codLiabilityRupees.toLocaleString("en-IN")} owed to Swiggy/Zomato</span>
                </div>
              </div>

              <div className="mt-6 space-y-3 font-mono text-xs text-stone-600">
                <div className="flex justify-between pb-2 border-b border-stone-100">
                  <span className="text-stone-500">Gross Pocket Cash:</span>
                  <span className="font-bold text-stone-900">₹{grossPocketRupees.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-stone-100">
                  <span className="text-rose-600">Custodial COD Ringfence:</span>
                  <span className="font-bold text-rose-600">−₹{codLiabilityRupees.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-stone-900 pt-1">
                  <span>Available For Household Food &amp; Fuel:</span>
                  <span className="text-emerald-700">₹{spendableRupees.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
