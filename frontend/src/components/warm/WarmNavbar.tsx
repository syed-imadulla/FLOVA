import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface WarmNavbarProps {
  onLaunchStage: () => void;
}

export const WarmNavbar: React.FC<WarmNavbarProps> = ({ onLaunchStage }) => {
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
    { name: "COMPANY", href: "#company" },
    { name: "OUR SOLUTIONS", href: "#solutions" },
    { name: "INVESTOR RELATIONS", href: "#evidence" },
    { name: "CONTACT US", href: "#contact" },
    { name: "TRUST & SAFETY", href: "#trust" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E3DA] shadow-xs py-3"
          : "bg-[#FAF7F2]/80 backdrop-blur-sm py-4 border-b border-[#E8E3DA]/60"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Tag */}
          <a
            href="#"
            className="flex items-center gap-3 group focus:outline-none"
            aria-label="FLOVA Home"
          >
            {/* Soft Warm Green Brand Emblem */}
            <div className="w-10 h-10 rounded-2xl bg-[#0F5C4C] text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              <span className="font-serif italic text-emerald-200">f</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-xl text-[#181A1F] flex items-center gap-2">
                FLOVA
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#0F5C4C] border border-[#C2E7CD]">
                  2026 EDITION
                </span>
              </span>
              <span className="text-[11px] text-[#7E8695] font-medium tracking-tight -mt-0.5">
                Make your money move smarter
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links (Calm, upper-case, confident) */}
          <nav className="hidden lg:flex items-center gap-8 text-[12px] font-bold tracking-wider text-[#525866]">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="hover:text-[#0F5C4C] transition-colors py-1 relative group"
              >
                <span>{link.name}</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0F5C4C] transition-all group-hover:w-full rounded-full" />
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-bold text-[#525866] hover:text-[#181A1F] px-3 py-2 rounded-full hover:bg-white/80 transition-colors"
            >
              Sign In
            </Link>

            <button
              onClick={onLaunchStage}
              className="px-5 py-2.5 rounded-full bg-[#0F5C4C] hover:bg-[#0A3D33] text-white text-xs font-bold tracking-wide shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Launch Runway</span>
              <span className="text-emerald-300">→</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={onLaunchStage}
              className="px-3.5 py-1.5 rounded-full bg-[#0F5C4C] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Launch
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#525866] hover:text-[#181A1F] hover:bg-white/80 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 p-5 bg-white rounded-3xl border border-[#E8E3DA] shadow-xl space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-xs font-bold text-[#525866] hover:text-[#0F5C4C] hover:bg-[#F5F1EB] rounded-xl"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-3 border-t border-[#E8E3DA] flex flex-col gap-2">
              <Link
                to="/login"
                className="text-center py-2 text-xs font-bold text-[#525866] bg-[#F5F1EB] rounded-xl"
              >
                Sign In to Account
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLaunchStage();
                }}
                className="w-full py-2.5 rounded-xl bg-[#0F5C4C] text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <span>Launch Interactive Runway</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
