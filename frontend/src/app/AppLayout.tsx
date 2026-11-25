// Persistent authenticated layout. Mounted once by the router: screens swap inside <Outlet/>
// while the bottom navbar stays mounted, so there is no flicker or layout jump between screens.
import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cx } from "../ui/kit";
import { useKeyboardOpen } from "../native/keyboard";
import { IconActivity, IconHome, IconInsights, IconMic, IconWallet } from "../ui/icons";

const MONEY_PATHS = ["/money", "/groups", "/insights", "/more", "/wish", "/payouts", "/commitments", "/invoices", "/profile"];

export function AppLayout() {
  const { pathname } = useLocation();

  // Each screen starts at the top (no inherited scroll position from the previous screen).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const peopleActive = pathname.startsWith("/people");
  const moneyActive = MONEY_PATHS.some((p) => pathname.startsWith(p));
  // Hide the bottom bar while the on-screen keyboard is open so it does not sit on top of it.
  const keyboardOpen = useKeyboardOpen();

  return (
    <div className="flova-app min-h-dvh bg-[#E9ECE6] text-ink antialiased">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-canvas md:shadow-[0_0_0_1px_#E1E4DE,0_10px_40px_rgba(0,0,0,0.06)]">
        <main className={cx("flex-1", keyboardOpen ? "pb-4" : "pb-[calc(84px+var(--sab))]")}>
          <Outlet />
        </main>

        <nav
          aria-label="Main"
          hidden={keyboardOpen}
          className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-line bg-white/95 backdrop-blur shadow-nav pb-[var(--sab)]"
        >
          <div className="grid h-[68px] grid-cols-5 items-end px-1">
            <Tab to="/app" label="Home" icon={<IconHome />} />
            <Tab to="/activity" label="Activity" icon={<IconActivity />} />
            <div className="flex justify-center">
              <NavLink
                to="/voice"
                aria-label="Add by voice"
                className={({ isActive }) =>
                  cx(
                    "-mt-6 mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full text-white shadow-fab ring-4 ring-white transition-transform active:scale-95",
                    isActive ? "bg-brand-800" : "bg-brand-700"
                  )
                }
              >
                <IconMic size={26} />
              </NavLink>
            </div>
            <Tab to="/people" label="People" icon={<IconInsights />} forceActive={peopleActive} />
            <Tab to="/money" label="Money" icon={<IconWallet />} forceActive={moneyActive} />
          </div>
        </nav>
      </div>
    </div>
  );
}

function Tab({ to, label, icon, forceActive }: { to: string; label: string; icon: React.ReactNode; forceActive?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx(
          "flex h-full flex-col items-center justify-center gap-1 pb-1 text-[11px] font-semibold transition-colors",
          isActive || forceActive ? "text-brand-700" : "text-ink-muted hover:text-ink"
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cx("flex h-7 w-12 items-center justify-center rounded-full", (isActive || forceActive) && "bg-brand-50")}>{icon}</span>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
