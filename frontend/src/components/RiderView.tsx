import { useEffect, useState } from "react";
import { api, rs, type Plan, type Profile } from "../api";
import { ChartLegend, IncomeChart } from "./IncomeChart";

const STATUS_TEXT: Record<string, string> = {
  healthy: "Buffer full. You're steady.",
  building: "Building your buffer.",
  lean: "Lean week. Your buffer covered it.",
  shortfall: "Buffer empty. This week was short.",
};

export function RiderView({ riderId, onRider }: { riderId: number | null; onRider: (id: number | null) => void }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", essentials: "", phone: "" });

  useEffect(() => {
    api.profiles().then(setProfiles).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (riderId == null) return setPlan(null);
    api.plan(riderId).then(setPlan).catch((e) => {
      setError(e.message);
      onRider(null);
    });
  }, [riderId, onRider]);

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function signUp(ev: React.FormEvent) {
    ev.preventDefault();
    const essentials = Number(form.essentials);
    if (!form.name.trim() || !(essentials > 0)) return setError("Enter a name and weekly essentials above ₹0.");
    const r = await run(() => api.createRider({
      name: form.name.trim(),
      essentials_per_week: essentials,
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
    }));
    if (r) onRider(r.id);
  }

  async function logPayout(ev: React.FormEvent) {
    ev.preventDefault();
    const n = Number(amount.replace(/,/g, ""));
    if (!amount.trim() || Number.isNaN(n)) return setError("Enter this week's payout as a number.");
    const p = await run(() => api.addPayout(riderId!, n));
    if (p) {
      setPlan(p);
      setAmount("");
    }
  }

  if (riderId == null || plan == null) {
    return (
      <section className="grid2">
        <form className="card" onSubmit={signUp}>
          <h2>Sign up a rider</h2>
          <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Weekly essentials (rent, food, EMI)
            <input inputMode="numeric" value={form.essentials} placeholder="e.g. 4000"
              onChange={(e) => setForm({ ...form, essentials: e.target.value })} />
          </label>
          <label>Phone, for SMS (optional)
            <input inputMode="tel" value={form.phone} placeholder="9876543210"
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <button disabled={busy}>Start</button>
        </form>
        <div className="card">
          <h2>Or try a demo rider</h2>
          <p className="muted">Ten weeks of simulated payouts ending in December, so the January slowdown shows in the outlook.</p>
          {profiles.map((p) => (
            <button key={p.key} className="secondary block" disabled={busy}
              onClick={async () => { const r = await run(() => api.demoRider(p.key)); if (r) onRider(r.id); }}>
              {p.label} · earns ~{rs(p.mean_weekly_income)}/wk, needs {rs(p.essentials_per_week)}
            </button>
          ))}
        </div>
        {error && <p className="error">{error}</p>}
      </section>
    );
  }

  const cur = plan.current;
  const ess = plan.rider.essentials_per_week;
  const fill = Math.max(0, Math.min(1, (cur?.buffer ?? 0) / plan.target_buffer));

  return (
    <section>
      <div className="row space">
        <h2>{plan.rider.name}</h2>
        <button className="link" onClick={() => onRider(null)}>Switch rider</button>
      </div>

      {!plan.can_help && <div className="banner warn">{plan.can_help_message}</div>}

      <div className="grid3">
        <div className="card stat">
          <span className="label">Your salary this week</span>
          <span className="big">{cur ? rs(cur.salary) : "—"}</span>
          <span className={`pill ${cur?.status ?? ""}`}>{cur ? STATUS_TEXT[cur.status] : "Log your first payout"}</span>
        </div>
        <div className="card stat">
          <span className="label">Buffer</span>
          <span className="big">{rs(cur?.buffer ?? plan.rider.start_buffer)}</span>
          <div className="meter" aria-label={`Buffer ${Math.round(fill * 100)}% of target`}>
            <div style={{ width: `${fill * 100}%` }} />
          </div>
          <span className="muted">{plan.buffer_weeks} of 3 weeks of essentials ({rs(ess)}/wk)</span>
        </div>
        <form className="card stat" onSubmit={logPayout}>
          <span className="label">This week's payout</span>
          <input inputMode="decimal" value={amount} placeholder="e.g. 5200" onChange={(e) => setAmount(e.target.value)} />
          <div className="row">
            <button disabled={busy}>Log payout</button>
            <button type="button" className="secondary" disabled={busy || !cur}
              onClick={async () => { const p = await run(() => api.undo(riderId)); if (p) setPlan(p); }}>Undo last</button>
          </div>
          <span className="muted">A negative number is fine if repairs cost more than you earned.</span>
        </form>
      </div>
      {error && <p className="error">{error}</p>}

      {cur && cur.reasons.length > 0 && (
        <div className="card">
          <h3>Why this salary</h3>
          <ul>{cur.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>
      )}

      <div className="card">
        <h3>Next 4 weeks</h3>
        {!plan.outlook.ready ? <p className="muted">{plan.outlook.message}</p> : (
          <div className="outlook">
            {plan.outlook.weeks.map((w) => (
              <div key={w.week} className={`ow ${w.level}`}>
                <strong>{w.month}</strong>
                <span>{rs(w.low)} – {rs(w.high)}</span>
                <span className="muted">likely {rs(w.expected)}</span>
                {w.reasons.map((r) => <small key={r}>{r}</small>)}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Earned vs. salary</h3>
        <IncomeChart weeks={plan.history} essentials={ess} />
        <ChartLegend />
      </div>
    </section>
  );
}
