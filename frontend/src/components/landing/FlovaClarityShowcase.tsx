import React, { useState } from "react";

export const FlovaClarityShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"cod" | "commitments" | "alerts">("cod");

  return (
    <section id="clarity" className="py-16 sm:py-24 bg-[#FAF7F2] border-b border-[#E5E2DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#0F5C4C] uppercase tracking-wider block mb-2">
            Designed for Absolute Clarity
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#16181D] tracking-tight">
            Three Common Traps FLOVA Prevents
          </h2>
          <p className="mt-3 text-base text-[#4A524C]">
            See how FLOVA handles the subtle financial edge cases that trip up gig delivery partners and freelancers every week.
          </p>

          {/* Scenario Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setActiveTab("cod")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "cod"
                  ? "bg-[#0F5C4C] text-white shadow-sm"
                  : "bg-white text-[#4A524C] border border-[#E5E2DC] hover:bg-slate-50"
              }`}
            >
              1. The Cash-on-Delivery Trap
            </button>
            <button
              onClick={() => setActiveTab("commitments")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "commitments"
                  ? "bg-[#0F5C4C] text-white shadow-sm"
                  : "bg-white text-[#4A524C] border border-[#E5E2DC] hover:bg-slate-50"
              }`}
            >
              2. Protecting Rent & Bike EMI
            </button>
            <button
              onClick={() => setActiveTab("alerts")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "alerts"
                  ? "bg-[#0F5C4C] text-white shadow-sm"
                  : "bg-white text-[#4A524C] border border-[#E5E2DC] hover:bg-slate-50"
              }`}
            >
              3. Honest Shortfall Warnings
            </button>
          </div>
        </div>

        {/* Tab Showcase Cards */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-[#E5E2DC] shadow-lg">
          {activeTab === "cod" && (
            <div className="space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">
                    Problem: You have ₹2,000 cash in pocket, but ₹1,500 is customer COD
                  </span>
                  <h3 className="text-2xl font-black text-[#16181D]">
                    Accidental Spending of Company Money
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  Ringfenced Protection
                </span>
              </div>

              <p className="text-sm text-[#4A524C] leading-relaxed">
                When you collect ₹500 for a food order and ₹1,000 for a grocery delivery, that cash sits in your wallet with your own earnings. Conventional apps treat all cash as yours. When the platform deducts COD from your payout on Friday, your balance suddenly crashes to zero.
              </p>

              {/* Visual Comparison Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200">
                  <div className="text-xs font-bold text-red-900 mb-1">❌ Other Budget Apps</div>
                  <div className="text-xl font-bold text-red-950 font-mono">Available: ₹2,000</div>
                  <p className="text-xs text-red-800 mt-2">
                    Lures you into thinking you can spend ₹2,000 today. Leads to harsh platform deductions on payout day.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-900 mb-1">✓ FLOVA Runway Engine</div>
                  <div className="text-xl font-black text-emerald-950 font-mono">Available: ₹500</div>
                  <p className="text-xs text-emerald-800 mt-2">
                    ₹1,500 is ringfenced as <strong>Not Yours</strong>. Your runway only spends the true ₹500.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "commitments" && (
            <div className="space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                    Problem: Rent of ₹4,500 due on 1st, Bike EMI of ₹2,800 due on 10th
                  </span>
                  <h3 className="text-2xl font-black text-[#16181D]">
                    Protecting High-Stakes Obligations
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                  Buffer Isolation
                </span>
              </div>

              <p className="text-sm text-[#4A524C] leading-relaxed">
                If you have ₹6,000 in your bank account today but a ₹2,800 bike EMI auto-debit hits in 4 days, you do not have ₹6,000 to spend. FLOVA locks your upcoming commitment amounts out of your daily spending pool.
              </p>

              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5E2DC] space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">Bank Balance</span>
                  <span className="font-mono font-bold text-slate-900">₹6,000</span>
                </div>
                <div className="flex items-center justify-between text-sm text-red-700">
                  <span className="font-semibold">− Protected Bike EMI (Due Thu)</span>
                  <span className="font-mono font-bold">−₹2,800</span>
                </div>
                <div className="flex items-center justify-between text-sm text-red-700">
                  <span className="font-semibold">− 4 Days Living Baseline (₹350/day)</span>
                  <span className="font-mono font-bold">−₹1,400</span>
                </div>
                <div className="pt-2 border-t border-[#E5E2DC] flex items-center justify-between text-base">
                  <strong className="text-emerald-900">True Safe Discretionary Cash</strong>
                  <strong className="font-mono font-black text-emerald-900">₹1,800</strong>
                </div>
              </div>
            </div>
          )}

          {activeTab === "alerts" && (
            <div className="space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block mb-1">
                    Problem: Apps guessing numbers or displaying fake ₹0 zeros
                  </span>
                  <h3 className="text-2xl font-black text-[#16181D]">
                    Honest Alerts or "Not Enough Information Yet"
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-200">
                  Mathematical Truth
                </span>
              </div>

              <p className="text-sm text-[#4A524C] leading-relaxed">
                If you just created an account and haven't logged daily petrol or food costs yet, FLOVA will never invent an imaginary 30-day runway or show a false zero. Instead, it honestly alerts: <em>"Not enough information yet — log 2 more daily expense entries to compute safe horizon."</em>
              </p>

              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">⚠️</span>
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    First Shortfall Notice (3 Days Notice)
                  </span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Projected cash hits zero on Thursday before Friday payout. <strong>Suggested adjustment:</strong> Complete 4 extra delivery orders on Wednesday or limit non-essential dining to keep ₹350 buffer intact.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
