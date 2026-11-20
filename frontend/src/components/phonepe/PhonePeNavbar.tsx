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
        scrolled ? "border-slate-200 shadow-xs py-3" : "border-slate-100 py-3.5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo Mark: Purple Circular Emblem + FLOVA text (Matching Screenshot 2) */}
          <a
            href="#"
            className="flex items-center gap-3 group focus:outline-none"
            aria-label="FLOVA Home"
          >
            {/* PhonePe-Style Purple Emblem with Devanagari 'पे' */}
            <div className="w-11 h-11 rounded-full bg-[#5f259f] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
              <span className="text-2xl font-black font-sans leading-none">पे</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-[#5f259f]">
                FLOVA
              </span>
              <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider text-[#5f259f] bg-[#f5efff] px-1.5 py-0.5 rounded border border-[#e8d7ff]">
                2026
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links (Uppercase Tracked Sans, Matching Screenshot 2) */}
          <nav className="hidden lg:flex items-center gap-8 text-[12px] font-bold tracking-[0.08em] text-[#333333]">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="hover:text-[#5f259f] transition-colors py-1 relative text-[11.5px]"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-4">
            <Link
              to="/login"
              className="text-xs font-bold text-[#5f259f] hover:text-[#451675] px-3.5 py-2 rounded-full hover:bg-[#f5efff] transition-colors"
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
              className="p-2 rounded-lg text-slate-700 hover:text-[#5f259f] focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 shadow-xl">
          <nav className="flex flex-col space-y-3 text-xs font-bold tracking-wider text-[#333333]">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-[#5f259f] border-b border-slate-50"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                className="text-center py-2 text-xs font-bold text-[#5f259f] bg-[#f5efff] rounded-full"
              >
                Sign In
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLaunchStage();
                }}
                className="w-full py-2.5 rounded-full bg-[#5f259f] text-white text-xs font-bold"
              >
                Launch Runway →
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
