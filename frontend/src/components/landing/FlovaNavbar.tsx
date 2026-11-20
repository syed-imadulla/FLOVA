import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export const FlovaNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E5E2DC] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Tagline */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0F5C4C] text-white flex items-center justify-center font-extrabold text-lg sm:text-xl shadow-sm group-hover:scale-105 transition-transform duration-200">
              <span>F</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#16181D]">
                FLOVA
              </span>
              <span className="text-[10px] font-semibold text-[#5A635B] uppercase tracking-wider -mt-1 hidden sm:block">
                Indian Runway Clarity
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollTo("features")}
              className="text-sm font-semibold text-[#4A524C] hover:text-[#0F5C4C] transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              Features
            </button>
            <button
              onClick={() => scrollTo("how-it-works")}
              className="text-sm font-semibold text-[#4A524C] hover:text-[#0F5C4C] transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollTo("clarity")}
              className="text-sm font-semibold text-[#4A524C] hover:text-[#0F5C4C] transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              Clarity
            </button>
            <button
              onClick={() => scrollTo("stories")}
              className="text-sm font-semibold text-[#4A524C] hover:text-[#0F5C4C] transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              Stories
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-[#16181D] hover:text-[#0F5C4C] px-3 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 rounded-xl bg-[#0F5C4C] hover:bg-[#0c4a3d] text-white text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Launch Runway
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => navigate("/login")}
              className="px-3.5 py-1.5 rounded-lg bg-[#0F5C4C] text-white text-xs font-bold shadow-xs"
            >
              Start
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#16181D] hover:bg-slate-200/50 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#E5E2DC] space-y-3 bg-[#FAF7F2]">
            <button
              onClick={() => scrollTo("features")}
              className="block w-full text-left px-3 py-2 text-sm font-semibold text-[#4A524C] hover:bg-[#0F5C4C]/10 rounded-lg"
            >
              Features
            </button>
            <button
              onClick={() => scrollTo("how-it-works")}
              className="block w-full text-left px-3 py-2 text-sm font-semibold text-[#4A524C] hover:bg-[#0F5C4C]/10 rounded-lg"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollTo("clarity")}
              className="block w-full text-left px-3 py-2 text-sm font-semibold text-[#4A524C] hover:bg-[#0F5C4C]/10 rounded-lg"
            >
              Clarity
            </button>
            <button
              onClick={() => scrollTo("stories")}
              className="block w-full text-left px-3 py-2 text-sm font-semibold text-[#4A524C] hover:bg-[#0F5C4C]/10 rounded-lg"
            >
              Stories
            </button>
            <div className="pt-2 border-t border-[#E5E2DC] flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center py-2.5 text-sm font-semibold text-[#16181D] border border-[#E5E2DC] rounded-xl bg-white"
              >
                Sign In
              </Link>
              <button
                onClick={() => navigate("/login")}
                className="w-full text-center py-2.5 text-sm font-bold text-white bg-[#0F5C4C] rounded-xl shadow-sm"
              >
                Launch Runway
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
