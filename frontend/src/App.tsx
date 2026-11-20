import { useCallback, useState } from "react";
import { EvidenceView } from "./components/EvidenceView";
import { RiderView } from "./components/RiderView";
import { SmsView } from "./components/SmsView";

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
    <div className="app">
      <header>
        <div>
          <h1>FLOVA</h1>
          <p className="tagline">A steady weekly salary from uneven gig pay.</p>
        </div>
        <nav>
          {([["week", "My week"], ["sms", "SMS mode"], ["evidence", "Evidence"]] as const).map(([k, label]) => (
            <button key={k} className={tab === k ? "tab active" : "tab"} onClick={() => setTab(k)}>{label}</button>
          ))}
        </nav>
      </header>
      <main>
        {tab === "week" && <RiderView riderId={riderId} onRider={onRider} />}
        {tab === "sms" && <SmsView defaultPhone="9876543210" />}
        {tab === "evidence" && <EvidenceView />}
      </main>
    </div>
  );
}
