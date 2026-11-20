import React from "react";
import {
  Wallet,
  Coins,
  RefreshCw,
  ShieldAlert,
  FileSpreadsheet,
} from "./Icons";
import { SectionHeading } from "./SectionHeading";

export const AbyssCapabilitiesSection: React.FC = () => {
  return (
    <section id="features" className="py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#f7f5f0]">
      <SectionHeading
        eyebrow="PRODUCT ARCHITECTURE"
        title="Everything your runway needs."
        italicWord="Nothing it doesn't."
        description="Engineered strictly for Indian gig delivery and transit workers. No loan app bloat, no predatory interest rates, and no floating-point rounding."
      />

      <div className="max-w-6xl mx-auto mt-20">
        {/* Bento Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Capability 1: Weekly Salary Engine (Span 7) */}
          <div className="md:col-span-7 bg-white p-7 sm:p-8 rounded-3xl border border-stone-200/90 paper-shadow hover:paper-shadow-lift transition-all relative overflow-hidden group">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-bold uppercase">
                CAPABILITY #01
              </span>
            </div>

            <h4 className="text-2xl font-extrabold text-stone-900 mt-4 tracking-tight">
              Deterministic Weekly Salary Engine
            </h4>
            <p className="text-stone-600 text-sm mt-2 leading-relaxed max-w-lg">
              Transforms erratic daily platform disbursements into a guaranteed weekly salary baseline.
              50 simulated years of Indian delivery data prove this eliminates panic borrowing.
            </p>

            <div className="mt-6 p-4 rounded-xl bg-stone-50 border border-stone-200/80 font-mono text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                  ₹
                </div>
                <span className="font-bold text-stone-900">₹4,500 Weekly Baseline</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Guaranteed
              </span>
            </div>
          </div>

          {/* Capability 2: COD Custodial Shield (Span 5) */}
          <div className="md:col-span-5 bg-white p-7 sm:p-8 rounded-3xl border border-stone-200/90 paper-shadow hover:paper-shadow-lift transition-all relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Coins className="w-5 h-5 text-amber-700" />
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-bold uppercase">
                CAPABILITY #02
              </span>
            </div>

            <h4 className="text-2xl font-extrabold text-stone-900 mt-4 tracking-tight">
              COD Custodial Shield
            </h4>
            <p className="text-stone-600 text-sm mt-2 leading-relaxed">
              Ringfences platform cash collections so you never accidentally spend what belongs to
              Swiggy, Zomato, or Zepto.
            </p>
          </div>

          {/* Capability 3: Monsoon & Slump Buffer (Span 4) */}
          <div className="md:col-span-4 bg-white p-6 sm:p-7 rounded-3xl border border-stone-200/90 paper-shadow hover:paper-shadow-lift transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold mb-4">
              <RefreshCw className="w-5 h-5 text-blue-700" />
            </div>
            <h5 className="text-lg font-bold text-stone-900 tracking-tight">Monsoon &amp; Slump Buffer</h5>
            <p className="text-stone-600 text-xs mt-2 leading-relaxed">
              Absorbs heavy rainfall and order slump dips so your rent and EMI are paid on time without touching loan apps.
            </p>
          </div>

          {/* Capability 4: Integer Paise Arithmetic (Span 4) */}
          <div className="md:col-span-4 bg-white p-6 sm:p-7 rounded-3xl border border-stone-200/90 paper-shadow hover:paper-shadow-lift transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold mb-4">
              <FileSpreadsheet className="w-5 h-5 text-purple-700" />
            </div>
            <h5 className="text-lg font-bold text-stone-900 tracking-tight">Integer Paise Precision</h5>
            <p className="text-stone-600 text-xs mt-2 leading-relaxed">
              All transactions and balances are computed in integer paise via money.ts. Zero floating point rounding drift.
            </p>
          </div>

          {/* Capability 5: Row-Level Security (Span 4) */}
          <div className="md:col-span-4 bg-white p-6 sm:p-7 rounded-3xl border border-stone-200/90 paper-shadow hover:paper-shadow-lift transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold mb-4">
              <ShieldAlert className="w-5 h-5 text-rose-700" />
            </div>
            <h5 className="text-lg font-bold text-stone-900 tracking-tight">PostgreSQL RLS</h5>
            <p className="text-stone-600 text-xs mt-2 leading-relaxed">
              Your financial data is only accessible to you. Supabase PostgreSQL row-level security rejects unauthorized reads.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
