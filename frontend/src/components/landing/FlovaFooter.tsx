import React from "react";
import { Link } from "react-router-dom";

export const FlovaFooter: React.FC = () => {
  return (
    <footer className="bg-[#FAF7F2] border-t border-[#E5E2DC] py-12 text-[#4A524C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0F5C4C] text-white flex items-center justify-center font-extrabold text-base">
                F
              </div>
              <span className="text-xl font-black text-[#16181D] tracking-tight">FLOVA</span>
            </div>
            <p className="text-xs text-[#5A635B] max-w-sm leading-relaxed">
              Deterministic financial runway planner engineered for gig delivery partners, cab drivers, and irregular earners across India.
            </p>
            <div className="text-[11px] text-[#7A7468]">
              Verified Row-Level Security · Zero Banking Credentials · Real Cash Math
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <h4 className="text-xs font-bold text-[#16181D] uppercase tracking-wider mb-3">
              Application
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/app" className="hover:text-[#0F5C4C] transition-colors">
                  Runway Dashboard
                </Link>
              </li>
              <li>
                <Link to="/voice" className="hover:text-[#0F5C4C] transition-colors">
                  Add Transaction / Voice
                </Link>
              </li>
              <li>
                <Link to="/commitments" className="hover:text-[#0F5C4C] transition-colors">
                  Commitments & Rent
                </Link>
              </li>
              <li>
                <Link to="/payouts" className="hover:text-[#0F5C4C] transition-colors">
                  Weekly Payouts
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy & Trust */}
          <div>
            <h4 className="text-xs font-bold text-[#16181D] uppercase tracking-wider mb-3">
              Security Standards
            </h4>
            <ul className="space-y-2 text-xs text-[#5A635B]">
              <li>✓ No bank login or password</li>
              <li>✓ No UPI PIN requested</li>
              <li>✓ Customer COD kept separate</li>
              <li>✓ Cloud-connected Postgres RLS</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#E5E2DC] flex flex-col sm:flex-row items-center justify-between text-xs text-[#7A7468] gap-4">
          <p>© {new Date().getFullYear()} FLOVA. Engineered for India's irregular-income workforce.</p>
          <p className="text-[11px]">
            Financial projections are computed using deterministic integer math based on user-entered transactions.
          </p>
        </div>
      </div>
    </footer>
  );
};
