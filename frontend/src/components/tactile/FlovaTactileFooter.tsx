import React from "react";
import { ArrowUp } from "./Icons";
import { RubberStamp } from "./FloatingElements";

interface FooterProps {
  onLaunchStage: () => void;
}

export const FlovaTactileFooter: React.FC<FooterProps> = ({ onLaunchStage }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#121316] text-[#faf8f5] border-t border-stone-800 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-stone-800">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white text-stone-950 flex items-center justify-center font-mono font-bold text-sm">
                <span className="text-emerald-600">₹</span>F
              </div>
              <span className="font-extrabold tracking-tight text-xl text-white">
                FLOVA
              </span>
            </div>

            <p className="text-stone-400 text-sm leading-relaxed max-w-sm">
              Adaptive runway and weekly salary engine for Indian gig workers.
              Ringfences cash-on-delivery, absorbs platform income slumps, and guarantees zero debt traps.
            </p>

            <div className="pt-2 flex items-center gap-2">
              <RubberStamp text="INTEGER PAISE" variant="green" rotation="rotate-0" />
              <RubberStamp text="POSTGRESQL RLS" variant="blue" rotation="rotate-0" />
            </div>
          </div>

          {/* Quick Links Column 1: Product */}
          <div className="md:col-span-2 space-y-3 font-mono text-xs">
            <h5 className="font-bold uppercase tracking-wider text-stone-300">Product</h5>
            <ul className="space-y-2 text-stone-400">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#currencies" className="hover:text-white transition-colors">
                  Cash vs. COD
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#fraud" className="hover:text-white transition-colors">
                  Audit Engine
                </a>
              </li>
              <li>
                <a href="#resilience" className="hover:text-white transition-colors">
                  Connectivity
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links Column 2: Workspace */}
          <div className="md:col-span-2 space-y-3 font-mono text-xs">
            <h5 className="font-bold uppercase tracking-wider text-stone-300">Workspace</h5>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button
                  type="button"
                  onClick={onLaunchStage}
                  className="hover:text-white transition-colors text-left bg-transparent border-0 p-0 cursor-pointer font-mono text-xs text-stone-400"
                >
                  My Week View
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onLaunchStage}
                  className="hover:text-white transition-colors text-left bg-transparent border-0 p-0 cursor-pointer font-mono text-xs text-stone-400"
                >
                  SMS Mode
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onLaunchStage}
                  className="hover:text-white transition-colors text-left bg-transparent border-0 p-0 cursor-pointer font-mono text-xs text-stone-400"
                >
                  Backtest Evidence
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links Column 3: Platform */}
          <div className="md:col-span-3 space-y-3 font-mono text-xs">
            <h5 className="font-bold uppercase tracking-wider text-stone-300">Security &amp; Rules</h5>
            <div className="text-stone-400 text-xs leading-relaxed space-y-2">
              <p>• Money handled strictly in integer paise; never floating point.</p>
              <p>• Database fills user_id securely via Row-Level Security.</p>
              <p>• Pending or unearned payouts are never counted as cash.</p>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Back to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-stone-500">
          <div>
            © 2026 FLOVA. Built for Indian gig workers. Make your money move smarter.
          </div>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 hover:text-white transition-colors p-1 rounded cursor-pointer"
            aria-label="Back to top"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
