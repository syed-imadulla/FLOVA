import React from "react";

export const PhonePeOrbitalFooter: React.FC = () => {
  return (
    <footer className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-[#fbf9fe] border-t border-[#ece4f5] relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Concentric Orbital Rings Innovation Section */}
        <div className="text-center mb-20 relative">
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f3e8ff] text-[#7e22ce] mb-3">
            INTEROPERABLE FINTECH INFRASTRUCTURE
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#23173d] tracking-tight mb-4">
            Engineered on India Stack
          </h2>
          <p className="text-sm text-[#5e596e] max-w-xl mx-auto mb-16">
            Direct protocol connectivity with NPCI, Account Aggregators, and UPI 2.0 rails.
          </p>

          {/* Interactive Concentric Orbital Rings */}
          <div className="relative w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] mx-auto flex items-center justify-center">
            {/* Outer Ring 3 */}
            <div className="absolute w-full h-full rounded-full border border-purple-200/70 animate-phonepe-orbit-slow">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1 rounded-full text-[11px] font-bold text-[#5f259f] shadow-md border border-purple-100 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                NPCI UPI 2.0 Rails
              </div>
              <div className="absolute bottom-6 left-1/4 -translate-x-1/2 bg-white px-3 py-1 rounded-full text-[11px] font-bold text-[#5f259f] shadow-md border border-purple-100 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                DigiLocker KYC
              </div>
            </div>

            {/* Middle Ring 2 */}
            <div className="absolute w-[240px] sm:w-[360px] h-[240px] sm:h-[360px] rounded-full border border-purple-300/80 animate-phonepe-orbit-counter">
              <div className="absolute top-1/2 -right-4 -translate-y-1/2 bg-white px-3 py-1 rounded-full text-[11px] font-bold text-[#5f259f] shadow-md border border-purple-100 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                RBI Account Aggregator
              </div>
            </div>

            {/* Inner Ring 1 */}
            <div className="absolute w-[160px] sm:w-[230px] h-[160px] sm:h-[230px] rounded-full border-2 border-dashed border-purple-400/80 animate-phonepe-orbit-mid">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-slate-800 shadow-sm border border-slate-200 whitespace-nowrap">
                ONDC Switch
              </div>
            </div>

            {/* Central Placeholder Circular Logo */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#5f259f] text-white flex flex-col items-center justify-center shadow-2xl z-10 border-4 border-white animate-phonepe-pulse-glow">
              <span className="text-xl sm:text-2xl font-black tracking-tight leading-none">F</span>
              <span className="text-[9px] font-mono font-bold tracking-widest text-purple-200 mt-0.5">
                FLOVA
              </span>
            </div>
          </div>
        </div>

        {/* 5-Column Directory Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 pt-16 pb-12 border-t border-[#ece4f5] text-xs">
          <div>
            <h4 className="font-bold text-[#23173d] uppercase tracking-wider mb-4">
              Business Solutions
            </h4>
            <ul className="space-y-2.5 text-[#5e596e]">
              <li><a href="#solutions" className="hover:text-[#5f259f]">Smart Soundbox Audio</a></li>
              <li><a href="#solutions" className="hover:text-[#5f259f]">Point of Sale POS</a></li>
              <li><a href="#solutions" className="hover:text-[#5f259f]">Merchant QR Stacks</a></li>
              <li><a href="#solutions" className="hover:text-[#5f259f]">Delivery Fleet Gateway</a></li>
              <li><a href="#solutions" className="hover:text-[#5f259f]">Top-Box Brand Ads</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#23173d] uppercase tracking-wider mb-4">
              Insurance &amp; Shield
            </h4>
            <ul className="space-y-2.5 text-[#5e596e]">
              <li><a href="#solutions" className="hover:text-[#5f259f]">Monsoon Slump Cover</a></li>
              <li><a href="#solutions" className="hover:text-[#5f259f]">Two-Wheeler EMI Ringfence</a></li>
              <li><a href="#solutions" className="hover:text-[#5f259f]">Daily Hospital Cash</a></li>
              <li><a href="#solutions" className="hover:text-[#5f259f]">Roadside EV Battery Swap</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#23173d] uppercase tracking-wider mb-4">
              Investments &amp; Wealth
            </h4>
            <ul className="space-y-2.5 text-[#5e596e]">
              <li><a href="#solutions" className="hover:text-[#5f259f]">24K Digital Gold (99.99%)</a></li>
              <li><a href="#solutions" className="hover:text-[#5f259f]">Weekly Micro-SIP</a></li>
              <li><a href="#solutions" className="hover:text-[#5f259f]">High-Yield Slump Buffer</a></li>
              <li><a href="#solutions" className="hover:text-[#5f259f]">National Pension (NPS)</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#23173d] uppercase tracking-wider mb-4">
              Runway Lending
            </h4>
            <ul className="space-y-2.5 text-[#5e596e]">
              <li><a href="#solutions" className="hover:text-[#5f259f]">0% Slump Micro-Advances</a></li>
              <li><a href="#solutions" className="hover:text-[#5f259f]">Pre-Sanctioned UPI ₹50k</a></li>
              <li><a href="#solutions" className="hover:text-[#5f259f]">Delivery Slip Factoring</a></li>
              <li><a href="#solutions" className="hover:text-[#5f259f]">Transparent Integer Paise</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#23173d] uppercase tracking-wider mb-4">
              Trust &amp; Legal
            </h4>
            <ul className="space-y-2.5 text-[#5e596e]">
              <li><a href="#trust" className="hover:text-[#5f259f]">Terms of Service</a></li>
              <li><a href="#trust" className="hover:text-[#5f259f]">Privacy Policy</a></li>
              <li><a href="#trust" className="hover:text-[#5f259f]">Grievance Officer</a></li>
              <li><a href="#trust" className="hover:text-[#5f259f]">RBI AA Regulatory Data</a></li>
            </ul>
          </div>
        </div>

        {/* Security / Compliance Badges */}
        <div className="py-6 border-t border-[#ece4f5] flex flex-wrap items-center justify-between gap-4 text-xs text-[#5e596e]">
          <div className="flex items-center gap-6">
            <span className="font-bold text-[#23173d]">PCI-DSS LEVEL 1</span>
            <span>•</span>
            <span className="font-bold text-[#23173d]">ISO/IEC 27001:2022</span>
            <span>•</span>
            <span className="font-bold text-[#23173d]">NPCI CERTIFIED</span>
          </div>
          <div>
            © 2026 FLOVA Technologies India Pvt. Ltd. All rights reserved.
          </div>
        </div>

        {/* Giant Watermark Brand Wordmark at Bottom */}
        <div className="pt-8 select-none pointer-events-none text-center">
          <span className="text-[14vw] font-black tracking-tighter text-[#5f259f]/5 leading-none block">
            FLOVA
          </span>
        </div>
      </div>
    </footer>
  );
};
