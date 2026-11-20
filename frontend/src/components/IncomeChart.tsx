import { rs, type WeekPlan } from "../api";

interface Props {
  weeks: WeekPlan[];
  essentials: number;
  height?: number;
}

/** Bars = what came in that week. Line = the steady salary. Dashed = essentials. */
export function IncomeChart({ weeks, essentials, height = 220 }: Props) {
  if (weeks.length === 0) return <p className="muted">No weeks yet.</p>;
  const width = 640;
  const pad = { l: 56, r: 12, t: 12, b: 16 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const values = weeks.flatMap((w) => [w.income, w.salary]).concat(essentials, 0);
  const max = Math.max(...values) * 1.08;
  const min = Math.min(...values);
  const y = (v: number) => pad.t + ih - ((v - min) / (max - min || 1)) * ih;
  const step = iw / weeks.length;
  const bw = Math.max(2, step * 0.7);
  const line = weeks.map((w, i) => `${i ? "L" : "M"}${pad.l + step * i + step / 2},${y(w.salary)}`).join(" ");
  const ticks = [0, max / 2, max].filter((v) => v >= min);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart" role="img"
      aria-label="Weekly income as bars, steady salary as a line">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} className="grid" />
          <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="tick">{rs(t)}</text>
        </g>
      ))}
      {weeks.map((w, i) => (
        <rect key={i} x={pad.l + step * i + (step - bw) / 2} width={bw}
          y={Math.min(y(w.income), y(0))} height={Math.max(1, Math.abs(y(0) - y(w.income)))}
          className={w.income < essentials ? "bar bar-low" : "bar"}>
          <title>{`Week ${w.week + 1}: earned ${rs(w.income)}, salary ${rs(w.salary)}${w.events?.length ? " · " + w.events.join(", ") : ""}`}</title>
        </rect>
      ))}
      <line x1={pad.l} x2={width - pad.r} y1={y(essentials)} y2={y(essentials)} className="essentials" />
      <path d={line} className="salary-line" />
    </svg>
  );
}

export function ChartLegend() {
  return (
    <div className="legend">
      <span><i className="sw sw-bar" /> Earned that week</span>
      <span><i className="sw sw-low" /> Below essentials</span>
      <span><i className="sw sw-line" /> FLOVA salary</span>
      <span><i className="sw sw-ess" /> Essentials</span>
    </div>
  );
}
