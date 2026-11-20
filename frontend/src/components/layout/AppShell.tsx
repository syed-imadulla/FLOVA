import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../../auth/useSession";
import { useProfile } from "../../profile/useProfile";
import { signOut } from "../../services/auth";

interface AppShellProps {
  children: React.ReactNode;
  activeNav?: "home" | "add" | "transactions" | "insights" | "plan" | "profile";
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user } = useSession();
  const { profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const pathname = location.pathname;

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Sign out error:", err);
      setIsSigningOut(false);
    }
  }

  const navItems = [
    {
      id: "home",
      label: "Runway Home",
      path: "/app",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: "transactions",
      label: "Ledger",
      path: "/history",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
    },
    {
      id: "insights",
      label: "Insights",
      path: "/insights",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      id: "plan",
      label: "Plan & Bills",
      path: "/commitments",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      id: "profile",
      label: "Settings",
      path: "/profile",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Partner";
  const workProfile = profile?.work_profile || "delivery";

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#16181D] font-sans flex flex-col md:flex-row antialiased">
      {/* =========================================================================
          DESKTOP SIDEBAR NAVIGATION (md and above)
          ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E5E2DC] p-6 shrink-0 sticky top-0 h-screen justify-between shadow-xs">
        <div>
          {/* Logo Brandmark */}
          <Link to="/app" className="flex items-center gap-3 mb-8 group focus:outline-none">
            <div className="w-10 h-10 rounded-full bg-[#0F5C4C] text-white flex items-center justify-center font-black text-xl shadow-xs group-hover:scale-105 transition-transform">
              F
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-[#0F5C4C]">FLOVA</span>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-[#7A7468]">
                Runway Engine
              </span>
            </div>
          </Link>

          {/* User Profile Card */}
          <div className="mb-6 p-3 rounded-2xl bg-[#F6F3EC] border border-[#EBE7DF]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#16181D] truncate max-w-[130px]">
                {displayName}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live RLS
              </span>
            </div>
            <div className="text-[11px] text-[#7A7468] capitalize flex items-center gap-1.5">
              <span>🛵</span>
              <span>{workProfile.replace("_", " ")}</span>
            </div>
          </div>

          {/* Main Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.path || (item.path === "/app" && pathname === "/dashboard");
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[#0F5C4C] text-white shadow-xs font-bold"
                      : "text-[#5A554A] hover:text-[#16181D] hover:bg-[#F4F0E8]"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-[#7A7468]"}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Action Buttons */}
          <div className="mt-6 pt-6 border-t border-[#E5E2DC] space-y-2">
            <Link
              to="/voice"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold tracking-wide shadow-xs transition-transform active:scale-95"
            >
              <span>🎙</span>
              <span>Quick Voice Entry</span>
            </Link>

            <Link
              to="/add"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-[#F4F0E8] text-[#0F5C4C] border border-[#0F5C4C]/30 text-xs font-bold tracking-wide shadow-xs transition-colors"
            >
              <span>+</span>
              <span>Add Transaction</span>
            </Link>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-[#E5E2DC] flex items-center justify-between text-xs text-[#7A7468]">
          <Link to="/" className="hover:text-[#0F5C4C] text-[11px] font-medium">
            ← Landing Page
          </Link>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="text-red-700 hover:text-red-800 font-bold text-[11px] cursor-pointer"
          >
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE TOP BAR (< md)
          ========================================================================= */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E2DC] px-4 py-3 flex items-center justify-between shadow-xs">
        <Link to="/app" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0F5C4C] text-white flex items-center justify-center font-black text-sm">
            F
          </div>
          <span className="text-lg font-black tracking-tight text-[#0F5C4C]">FLOVA</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Real Data
          </span>
          <Link
            to="/profile"
            className="w-8 h-8 rounded-full bg-[#F6F3EC] border border-[#EBE7DF] flex items-center justify-center text-xs font-bold text-[#0F5C4C]"
          >
            {displayName.charAt(0).toUpperCase()}
          </Link>
        </div>
      </header>

      {/* =========================================================================
          MAIN CONTENT AREA (Spacious 2-3 column responsive container)
          ========================================================================= */}
      <main className="flex-1 pb-24 md:pb-12 pt-4 md:pt-8 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* =========================================================================
          MOBILE BOTTOM NAVIGATION BAR (< md)
          ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-[#E5E2DC] px-2 py-1.5 flex items-center justify-around shadow-lg">
        {/* Home */}
        <Link
          to="/app"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold ${
            pathname === "/app" || pathname === "/dashboard"
              ? "text-[#0F5C4C]"
              : "text-[#7A7468] hover:text-[#16181D]"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          <span>Runway</span>
        </Link>

        {/* Ledger / History */}
        <Link
          to="/history"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold ${
            pathname === "/history" ? "text-[#0F5C4C]" : "text-[#7A7468] hover:text-[#16181D]"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
          </svg>
          <span>Ledger</span>
        </Link>

        {/* Center Quick Action Floating Pill (+ / 🎙) */}
        <button
          onClick={() => setQuickAddOpen(!quickAddOpen)}
          className="w-12 h-12 -mt-5 rounded-full bg-[#0F5C4C] hover:bg-[#0c4a3d] text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-emerald-950/20 active:scale-95 transition-transform"
          aria-label="Quick Action"
        >
          {quickAddOpen ? "✕" : "＋"}
        </button>

        {/* Plan / Bills */}
        <Link
          to="/commitments"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold ${
            pathname === "/commitments" ? "text-[#0F5C4C]" : "text-[#7A7468] hover:text-[#16181D]"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
          </svg>
          <span>Plan</span>
        </Link>

        {/* Profile */}
        <Link
          to="/profile"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold ${
            pathname === "/profile" ? "text-[#0F5C4C]" : "text-[#7A7468] hover:text-[#16181D]"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Profile</span>
        </Link>
      </nav>

      {/* Mobile Quick Action Modal */}
      {quickAddOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center p-4 md:hidden"
          onClick={() => setQuickAddOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm border border-[#E5E2DC] shadow-2xl space-y-3 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E2DC]">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7A7468]">
                Quick Entry
              </span>
              <button
                onClick={() => setQuickAddOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <Link
              to="/voice"
              onClick={() => setQuickAddOpen(false)}
              className="flex items-center gap-3.5 p-3 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-900 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center text-lg">
                🎙
              </div>
              <div>
                <div className="text-sm font-bold">Voice Entry (AI Assist)</div>
                <div className="text-[11px] text-red-700">Speak your petrol, food, or payout</div>
              </div>
            </Link>

            <Link
              to="/add"
              onClick={() => setQuickAddOpen(false)}
              className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#F6F3EC] hover:bg-[#EBE7DF] border border-[#E5E2DC] text-[#16181D] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0F5C4C] text-white flex items-center justify-center text-lg">
                ＋
              </div>
              <div>
                <div className="text-sm font-bold">Add Transaction</div>
                <div className="text-[11px] text-[#7A7468]">Manual income or expense record</div>
              </div>
            </Link>

            <Link
              to="/checkin"
              onClick={() => setQuickAddOpen(false)}
              className="flex items-center gap-3.5 p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-950 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center text-lg">
                ₹
              </div>
              <div>
                <div className="text-sm font-bold">Balance Check-In</div>
                <div className="text-[11px] text-sky-800">Count cash & ringfence COD</div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
