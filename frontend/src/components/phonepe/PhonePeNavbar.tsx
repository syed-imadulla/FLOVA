import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface PhonePeNavbarProps {
  onLaunchStage: () => void;
}

export const PhonePeNavbar: React.FC<PhonePeNavbarProps> = ({ onLaunchStage }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
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
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-200 border-b ${
        scrolled ? "border-slate-200 shadow-sm py-2.5" : "border-slate-100 py-3.5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Exact PhonePe Logo Rebranded to FLOVA */}
          <a
            href="#"
            className="flex items-center gap-2.5 group focus:outline-none"
            aria-label="FLOVA Home"
          >
            {/* PhonePe-Style Circular Purple Emblem with Stylized 'f' */}
            <div className="w-10 h-10 rounded-full bg-[#5f259f] flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-white">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-5H9V9.5h2V7.8c0-1.7 1-2.6 2.6-2.6.8 0 1.5.1 1.7.1v2h-1.1c-.8 0-1 .4-1 1v1.2h2.2l-.3 2h-1.9v5z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black tracking-tight text-[#5f259f]">
                FLOVA
              </span>
              <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider text-[#5f259f] bg-[#f5efff] px-1.5 py-0.5 rounded border border-[#e8d7ff]">
                2026
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links (PhonePe All-Caps Uppercase Style) */}
          <nav className="hidden lg:flex items-center gap-8 text-[12px] font-bold tracking-wider text-[#3c354a]">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="hover:text-[#5f259f] transition-colors py-1 relative tracking-widest text-[11.5px]"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-4">
            <Link
              to="/login"
              className="text-xs font-bold text-[#5f259f] hover:text-[#451675] px-3 py-1.5 rounded-full hover:bg-[#f5efff] transition-colors"
            >
              Sign In
            </Link>

            <button
              onClick={onLaunchStage}
              className="px-5 py-2 rounded-full bg-[#5f259f] hover:bg-[#4d1d83] text-white text-xs font-bold tracking-wide shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Launch Runway</span>
              <span className="text-white/80">→</span>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={onLaunchStage}
              className="px-3.5 py-1.5 rounded-full bg-[#5f259f] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Launch
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-xs font-bold tracking-wider text-[#3c354a] hover:text-[#5f259f]"
            >
              {link.name}
            </a>
          ))}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/login"
              className="py-2 text-center text-xs font-bold text-[#5f259f] border border-[#e8d7ff] rounded-lg"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
