import { useEffect, useState } from "react";
import { api, rs, type BacktestRow, type WeekPlan } from "../api";
import { ChartLegend, IncomeChart } from "./IncomeChart";

const pct = (v: number | null | undefined) => (v == null ? "—" : `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`);

export function EvidenceView() {
  const [rows, setRows] = useState<BacktestRow[] | null>(null);
  const [profile, setProfile] = useState("full_time");
  const [seed, setSeed] = useState(0);
  const [sim, setSim] = useState<{ essentials_per_week: number; weeks: WeekPlan[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api.backtest().then(setRows).catch((e) => setError(e.message)); }, []);
  useEffect(() => { api.simulate(profile, seed).then(setSim).catch((e) => setError(e.message)); }, [profile, seed]);

  const events = sim?.weeks.filter((w) => w.events?.length) ?? [];

  return (
    <section>
      <div className="card">
        <h2>Does it help? Backtest over 50 simulated years per rider</h2>
        <p className="muted">
          Baseline: spend what comes in, borrow any gap at 5%/month (assumed informal rate).
          FLOVA: follow the self-salary rule, borrow only when the buffer is empty. Same income for both.
        </p>
        {error && <p className="error">{error}</p>}
        {!rows ? <p className="muted">Running backtest…</p> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rider</th><th>Weeks borrowing / yr</th><th>Interest / yr</th>
                  <th>Spending swings (CV)</th><th>Smoothing can help</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.profile}>
                    <td>{r.label}<br /><small className="muted">earns ~{rs(r.mean_weekly_income)}, needs {rs(r.essentials_per_week)}/wk</small></td>
                    <td>{r.baseline.weeks_borrowing.toFixed(1)} → <b>{r.udaan.weeks_borrowing.toFixed(1)}</b> <small>{pct(r.change.weeks_borrowing)}</small></td>
                    <td>{rs(r.baseline.interest_paid)} → <b>{rs(r.udaan.interest_paid)}</b> <small>{pct(r.change.interest_paid)}</small></td>
                    <td>{r.baseline.spending_volatility.toFixed(2)} → <b>{r.udaan.spending_volatility.toFixed(2)}</b></td>
                    <td className={r.share_of_years_smoothing_can_help < 0.5 ? "bad" : "good"}>
                      {Math.round(r.share_of_years_smoothing_can_help * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted">
          Where average income is below essentials, smoothing can't help, and FLOVA says so instead of
          pretending. That's a low-income problem; the rider is pointed to welfare schemes.
        </p>
      </div>

      <div className="card">
        <div className="row space">
          <h3>One simulated year</h3>
          <div className="row">
            <select value={profile} onChange={(e) => setProfile(e.target.value)}>
              {(rows ?? []).map((r) => <option key={r.profile} value={r.profile}>{r.label}</option>)}
            </select>
            <button className="secondary" onClick={() => setSeed((s) => s + 1)}>Another year</button>
          </div>
        </div>
        {sim && <IncomeChart weeks={sim.weeks} essentials={sim.essentials_per_week} height={260} />}
        <ChartLegend />
        {events.length > 0 && (
          <p className="muted">
            Shocks this year: {events.map((w) => `week ${w.week + 1} (${w.events!.join(", ")})`).join(" · ")}
          </p>
        )}
      </div>
    </section>
  );
}
