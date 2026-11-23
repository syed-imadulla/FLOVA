import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../../auth/useSession";

const LINKS = [
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How it works" },
  { id: "clarity", label: "Clarity" },
  { id: "stories", label: "Stories" },
  { id: "install", label: "Install app" },
];

export const FlovaNavbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { session } = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const scrollTo = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const primary = session ? { label: "Open app", to: "/app" } : { label: "Get started", to: "/signup" };

  return (
    <header
      className={`sticky top-[var(--sat)] z-50 w-full transition-[background-color,box-shadow,border-color] duration-200 border-b ${
        scrolled || open ? "bg-white/90 backdrop-blur-md border-[#E7E4DD] shadow-[0_1px_12px_rgba(22,24,29,0.06)]" : "bg-[#FAF7F2]/80 backdrop-blur-sm border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" onClick={() => setOpen(false)} className="flex min-w-0 shrink-0 items-center gap-2.5" aria-label="FLOVA home">
          <img src="/favicon.svg" alt="FLOVA" className="h-9 w-9 shrink-0 rounded-xl object-contain shadow-xs" />
          <span className="flex flex-col leading-none">
            <span className="text-[19px] font-black tracking-tight text-[#16181D]">FLOVA</span>
            <span className="mt-0.5 hidden text-[10.5px] font-medium text-[#6B6F68] sm:block">Every rupee has a story</span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav aria-label="Sections" className="hidden items-center gap-1 rounded-full border border-[#E7E4DD] bg-white/70 p-1 lg:flex">
          {LINKS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => scrollTo(l.id)}
              className="whitespace-nowrap rounded-full px-4 py-1.5 text-[13.5px] font-semibold text-[#4A524C] transition-colors hover:bg-[#0F5C4C]/[0.08] hover:text-[#0F5C4C]"
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {!session ? (
            <Link to="/login" className="hidden rounded-xl px-3.5 py-2 text-sm font-semibold text-[#16181D] transition-colors hover:bg-black/[0.04] sm:inline-flex">
              Sign in
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => navigate(primary.to)}
            className="inline-flex h-10 items-center rounded-xl bg-[#0F5C4C] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0c4a3d] active:scale-[0.98]"
          >
            {primary.label}
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#16181D] transition-colors hover:bg-black/[0.05] lg:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open ? (
        <div className="border-t border-[#E7E4DD] bg-white lg:hidden">
          <div className="mx-auto max-w-6xl space-y-1 px-4 py-3">
            {LINKS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => scrollTo(l.id)}
                className="flex h-11 w-full items-center rounded-xl px-3 text-left text-[15px] font-semibold text-[#2B302C] hover:bg-[#0F5C4C]/[0.06]"
              >
                {l.label}
              </button>
            ))}
            {!session ? (
              <div className="pt-2">
                <Link to="/login" onClick={() => setOpen(false)} className="flex h-11 w-full items-center justify-center rounded-xl border border-[#E7E4DD] text-[15px] font-semibold text-[#16181D]">
                  Sign in
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
};
