import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ArrowUpRight } from "./Icons";

interface NavbarProps {
  onLaunchStage: () => void;
}

export const AbyssNavbar: React.FC<NavbarProps> = ({ onLaunchStage }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Cash vs. COD", href: "#currencies" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Audit Engine", href: "#fraud" },
    { name: "Connectivity", href: "#resilience" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#faf8f5]/90 backdrop-blur-md border-b border-stone-200/80 shadow-xs py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <a
            href="#"
            className="flex items-center gap-2.5 group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-stone-900 rounded-lg p-1"
          >
            <div className="w-9 h-9 rounded-xl bg-[#121316] text-[#faf8f5] flex items-center justify-center font-mono font-bold text-base shadow-sm group-hover:scale-105 transition-transform duration-200">
              <span className="text-emerald-400">₹</span>F
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-lg text-[#121316] flex items-center gap-1.5">
                FLOVA
                <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-sm bg-stone-200 text-stone-700 uppercase tracking-wider">
                  2026 EDITION
                </span>
              </span>
              <span className="text-[10px] text-stone-500 font-mono tracking-tight -mt-0.5">
                Integer Paise • Deterministic Runway
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100/70 border border-stone-200/80 rounded-full px-4 py-1.5 backdrop-blur-xs">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-3 py-1 text-sm font-medium text-stone-600 hover:text-stone-950 hover:bg-stone-200/50 rounded-full transition-colors duration-150"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-mono text-stone-700 hover:text-stone-950 px-3 py-1.5 rounded-full hover:bg-stone-200/60 transition-colors"
            >
              Sign In
            </Link>

            <button
              onClick={onLaunchStage}
              className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#121316] hover:bg-stone-800 text-[#faf8f5] text-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg active:scale-95 cursor-pointer"
            >
              <span>Launch Runway</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={onLaunchStage}
              className="px-3 py-1.5 rounded-full bg-[#121316] text-[#faf8f5] text-xs font-semibold shadow-xs cursor-pointer"
            >
              Launch
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-700 hover:text-stone-950 hover:bg-stone-100 focus:outline-hidden cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 p-4 bg-white/95 rounded-2xl border border-stone-200 shadow-xl space-y-2 backdrop-blur-md">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-lg"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-2 border-t border-stone-200 flex flex-col gap-2">
              <Link
                to="/login"
                className="text-center py-2 text-sm font-mono text-stone-800 bg-stone-100 rounded-lg"
              >
                Sign In to Account
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLaunchStage();
                }}
                className="w-full py-2.5 rounded-xl bg-[#121316] text-white text-sm font-semibold flex items-center justify-center gap-1.5"
              >
                <span>Launch Interactive Runway</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
