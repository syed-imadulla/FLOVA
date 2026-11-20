const BASE = import.meta.env.VITE_API_URL ?? "/api";

export type Status = "healthy" | "building" | "lean" | "shortfall";

export interface WeekPlan {
  week: number;
  income: number;
  salary: number;
  saved: number;
  buffer: number;
  status: Status;
  reasons: string[];
  events?: string[];
}

export interface Rider {
  id: number;
  name: string;
  phone: string | null;
  essentials_per_week: number;
  start_buffer: number;
  start_week: number;
  weeks_logged: number;
}

export interface OutlookWeek {
  week: number;
  month: string;
  low: number;
  expected: number;
  high: number;
  level: "ok" | "covered" | "warning";
  reasons: string[];
}

export interface Plan {
  rider: Rider;
  current: WeekPlan | null;
  history: WeekPlan[];
  buffer_weeks: number;
  target_buffer: number;
  outlook: { ready: boolean; message?: string; overall?: string; weeks: OutlookWeek[] };
  can_help: boolean;
  can_help_message: string;
}

export interface StrategyStats {
  weeks_borrowing: number;
  total_borrowed: number;
  interest_paid: number;
  peak_debt: number;
  end_debt: number;
  spending_volatility: number;
  end_buffer: number;
}

export interface BacktestRow {
  profile: string;
  label: string;
  years_simulated: number;
  essentials_per_week: number;
  mean_weekly_income: number;
  share_of_years_smoothing_can_help: number;
  baseline: StrategyStats;
  udaan: StrategyStats;
  change: Record<string, number | null>;
}

export interface Profile {
  key: string;
  label: string;
  mean_weekly_income: number;
  essentials_per_week: number;
  notes: string;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* keep statusText */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const FALLBACK_PROFILES: Profile[] = [
  { key: "food_delivery", label: "Food Delivery Partner", mean_weekly_income: 6200, essentials_per_week: 3800, notes: "Zomato / Swiggy delivery" },
  { key: "cab_driver", label: "Cab / Auto Driver", mean_weekly_income: 7500, essentials_per_week: 4500, notes: "Uber / Ola partner" },
  { key: "quick_commerce", label: "Quick Commerce Rider", mean_weekly_income: 5800, essentials_per_week: 3600, notes: "Blinkit / Zepto partner" },
];

export const api = {
  profiles: async () => {
    try {
      return await call<Profile[]>("/profiles");
    } catch {
      return FALLBACK_PROFILES;
    }
  },
  createRider: (body: { name: string; essentials_per_week: number; phone?: string; start_week?: number }) =>
    call<Rider>("/riders", { method: "POST", body: JSON.stringify(body) }),
  demoRider: (profile: string) => call<Rider>(`/riders/demo?profile=${encodeURIComponent(profile)}&weeks=10`, { method: "POST" }),
  plan: (id: number) => call<Plan>(`/riders/${id}/plan`),
  addPayout: (id: number, amount: number) =>
    call<Plan>(`/riders/${id}/payouts`, { method: "POST", body: JSON.stringify({ amount }) }),
  undo: (id: number) => call<Plan>(`/riders/${id}/payouts/last`, { method: "DELETE" }),
  sms: (phone: string, text: string) =>
    call<{ reply: string }>("/sms", { method: "POST", body: JSON.stringify({ phone, text }) }),
  simulate: (profile: string, seed = 0) =>
    call<{ essentials_per_week: number; weeks: WeekPlan[] }>(`/simulate/${profile}?seed=${seed}`),
  backtest: () => call<BacktestRow[]>("/backtest"),
};

export const rs = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
