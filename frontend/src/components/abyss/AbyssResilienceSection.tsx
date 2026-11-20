import React, { useState } from "react";
import { Wifi, WifiOff } from "./Icons";
import { SectionHeading } from "./SectionHeading";
import { RubberStamp } from "./FloatingElements";

export const AbyssResilienceSection: React.FC = () => {
  const [networkMode, setNetworkMode] = useState<"broadband" | "low_bandwidth">("broadband");

  return (
    <section id="resilience" className="py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#faf8f5]">
      <SectionHeading
        eyebrow="RESILIENT CORRIDOR CONNECTIVITY"
        title="Financial clarity that works"
        italicWord="on every road."
        description="Delivery riders travel through weak mobile signal corridors every day. FLOVA communicates directly with secure Supabase PostgreSQL and offers an SMS Mode fallback—with zero fake offline saves."
      />

      <div className="max-w-6xl mx-auto mt-16 space-y-12">
        {/* Interactive Connectivity Simulation Toggle Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-stone-100 rounded-2xl border border-stone-200/90 gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${
                networkMode === "low_bandwidth"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {networkMode === "low_bandwidth" ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <span>Signal Corridor State:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    networkMode === "low_bandwidth"
                      ? "bg-amber-200 text-amber-900"
                      : "bg-emerald-200 text-emerald-900"
                  }`}
                >
                  {networkMode === "low_bandwidth" ? "LOW-BANDWIDTH SMS MODE" : "FULL BROADBAND WEB MODE"}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-mono">
                {networkMode === "low_bandwidth"
                  ? "SMS Mode active: log balance & expenses via plain text without browser overhead."
                  : "Full live synchronization with PostgreSQL Row-Level Security."}
              </p>
            </div>
          </div>

          <button
            onClick={() => setNetworkMode(networkMode === "broadband" ? "low_bandwidth" : "broadband")}
            className="px-4 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-xs font-semibold text-stone-800 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            Toggle {networkMode === "broadband" ? "Low-Bandwidth Mode" : "Full Web Mode"}
          </button>
        </div>

        {/* Visual Inspection Window */}
        <div className="bg-white border border-stone-200/90 rounded-3xl paper-shadow-lg overflow-hidden">
          {/* Window Chrome Header */}
          <div className="bg-stone-100 px-5 py-3 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400"></span>
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
              <span className="ml-3 font-mono text-xs text-stone-600 font-semibold">
                flova://network/status • PostgreSQL RLS Authenticated
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RubberStamp text="TRUTHFUL SYNC" variant="green" rotation="rotate-0" />
            </div>
          </div>

          <div className="p-6 sm:p-8 font-mono text-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] text-stone-500 uppercase block font-bold mb-1">DATA INTEGRITY</span>
                <span className="text-sm font-bold text-stone-900 block">Integer Paise</span>
                <span className="text-stone-500 text-[11px]">No floating point arithmetic in ledger</span>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] text-stone-500 uppercase block font-bold mb-1">SECURITY SPEC</span>
                <span className="text-sm font-bold text-stone-900 block">Row-Level Security</span>
                <span className="text-stone-500 text-[11px]">Database fills user_id securely</span>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] text-stone-500 uppercase block font-bold mb-1">FALLBACK ACCESS</span>
                <span className="text-sm font-bold text-stone-900 block">SMS Gateway</span>
                <span className="text-stone-500 text-[11px]">Accessible via standard feature phone SMS</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs">
              <strong>Architecture Note:</strong> FLOVA truthfully reports connection status and never pretends an unconfirmed save succeeded. No offline saving exists; data integrity is maintained strictly through confirmed PostgreSQL records.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
