import { useCallback, useState } from "react";
import { EvidenceView } from "./components/EvidenceView";
import { RiderView } from "./components/RiderView";
import { SmsView } from "./components/SmsView";
import { HeroSection } from "./components/HeroSection";

type Tab = "week" | "sms" | "evidence";

function loadRider(): number | null {
  try {
    const v = localStorage.getItem("flova.rider");
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [tab, setTab] = useState<Tab>("week");
  const [riderId, setRiderId] = useState<number | null>(loadRider);

  const handleLaunch = useCallback(() => {
    setTab("week");
  }, []);

  const handleSelectTab = useCallback((selectedTab: Tab) => {
    setTab(selectedTab);
  }, []);

  const onRider = useCallback((id: number | null) => {
    setRiderId(id);
    try {
      if (id == null) localStorage.removeItem("flova.rider");
      else localStorage.setItem("flova.rider", String(id));
    } catch {
      /* storage blocked: fine, just not remembered */
    }
  }, []);

  return (
    <div className="flova-root">
      {/* Editorial Landing Hero Section (Choreographed to 20261120-1435-37 reference) */}
      <HeroSection
        onLaunch={handleLaunch}
        onSelectTab={handleSelectTab}
        activeTab={tab}
      />

      {/* Interactive Worker Workspace Stage */}
      <section id="flova-app-stage" className="app-stage-wrapper">
        <div className="app">
          <header className="app-sub-header">
            <div>
              <div className="app-stage-badge">Synthetic Demo &amp; Rider Workspace</div>
              <h2 className="app-stage-title">Steady Weekly Salary Engine</h2>
              <p className="tagline">Adaptive runway for irregular gig income · 50 simulated years backtested</p>
            </div>
            <nav className="app-tabs-nav" aria-label="Workspace tabs">
              {([["week", "My week"], ["sms", "SMS mode"], ["evidence", "Evidence"]] as const).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  className={tab === k ? "tab active" : "tab"}
                  onClick={() => setTab(k)}
                >
                  {label}
                </button>
              ))}
            </nav>
          </header>
          <main>
            {tab === "week" && <RiderView riderId={riderId} onRider={onRider} />}
            {tab === "sms" && <SmsView defaultPhone="9876543210" />}
            {tab === "evidence" && <EvidenceView />}
          </main>
        </div>
      </section>
    </div>
  );
}
