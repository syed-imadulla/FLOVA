import React from "react";
import { useNavigate } from "react-router-dom";

export const FlovaBottomCTA: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 sm:py-28 bg-[#0F5C4C] text-white relative overflow-hidden">
      {/* Subtle organic light glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-96 bg-emerald-400/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <span className="inline-block px-3.5 py-1.5 rounded-full bg-white/10 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-4 border border-white/15">
          Take Control of Your Weekly Cash
        </span>

        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Your Runway, Anywhere. <br className="hidden sm:block" />
          Built for India's Hardworking Earners.
        </h2>

        <p className="mt-5 text-base sm:text-lg text-emerald-100 max-w-2xl mx-auto leading-relaxed">
          Say goodbye to mid-week panic and emergency borrowing. Know exactly where your cash stands before your next payout.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <button
            onClick={() => navigate("/signup")}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-[#0F5C4C] hover:bg-emerald-50 font-black text-base shadow-xl transition-all active:scale-95 cursor-pointer"
          >
            Start Your Free Runway
          </button>
          <button
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-transparent hover:bg-white/10 text-white font-bold text-base border border-white/30 transition-all active:scale-95 cursor-pointer"
          >
            Sign In to Account
          </button>
        </div>

        {/* Reassurance points */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-emerald-200 font-medium">
          <span>🔒 Postgres Row-Level Security Isolation</span>
          <span>⚡ No Banking Credentials or OTPs</span>
          <a href="#install" className="underline underline-offset-4 hover:text-white">📱 Install the app</a>
        </div>
      </div>
    </section>
  );
};
