import { Link } from "react-router-dom";
import { useRunway } from "../runway/useRunway";
import { useTransactions } from "../data/useTransactions";
import { formatINR, toPaise } from "../lib/money";
import { AppShell } from "../components/layout/AppShell";

export function InsightsView() {
  const { runway, loading, error, reload } = useRunway({ horizonDays: 14 });
  const { items } = useTransactions();

  // Compute 30-day verified inflow and outflow from confirmed transactions
  let totalIncomePaise = 0;
  let totalLivingPaise = 0;
  let totalWorkPaise = 0;
  let totalCodPaise = 0;

  items.forEach((t) => {
    const p = toPaise(t.amount);
    if (t.ownership === "not_mine") {
      totalCodPaise += p;
    } else if (t.type === "income") {
      totalIncomePaise += p;
    } else if (t.type === "expense") {
      if (t.expense_type === "work") totalWorkPaise += p;
      else totalLivingPaise += p;
    }
  });

  const totalExpensePaise = totalLivingPaise + totalWorkPaise;

  return (
    <AppShell activeNav="insights">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E2DC]">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7A7468]">
              Rule-Based Analytics
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#16181D]">
              Financial Insights &amp; Health
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => reload()}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F6F3EC] border border-[#D5D0C5] text-xs font-bold text-[#16181D] shadow-xs cursor-pointer"
            >
              ⟳ Refresh Feed
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* 1. Inflow vs Outflow 3-Column Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Confirmed Inflow */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E2DC] shadow-xs">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F5C4C] block mb-2">
              Confirmed Inflow
            </span>
            <div className="text-3xl font-black text-[#0F5C4C] tabular-nums tracking-tight my-2">
              +{formatINR(totalIncomePaise)}
            </div>
            <p className="text-xs text-[#7A7468]">
              From verified earnings, delivery tips, and settled platform payouts.
            </p>
          </div>

          {/* Total Confirmed Outflow */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E2DC] shadow-xs">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-700 block mb-2">
              Total Expenses
            </span>
            <div className="text-3xl font-black text-red-700 tabular-nums tracking-tight my-2">
              −{formatINR(totalExpensePaise)}
            </div>
            <div className="text-xs text-[#7A7468] space-y-1">
              <div>Work (Petrol/Repairs): {formatINR(totalWorkPaise)}</div>
              <div>Living (Food/Personal): {formatINR(totalLivingPaise)}</div>
            </div>
          </div>

          {/* Excluded COD Cash Volume */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E2DC] shadow-xs">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B45309] block mb-2">
              Ringfenced COD Handled
            </span>
            <div className="text-3xl font-black text-[#B45309] tabular-nums tracking-tight my-2">
              {formatINR(totalCodPaise)}
            </div>
            <p className="text-xs text-[#7A7468]">
              Customer cash collections safely isolated from your personal savings buffer.
            </p>
          </div>
        </div>

        {/* 2. Visual Runway Trajectory Projection */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E2DC] shadow-xs">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#16181D]">Runway Projection Trajectory</h2>
            <p className="text-xs text-[#7A7468]">
              Projected day-by-day cash balance using deterministic burn rate.
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#7A7468] animate-pulse">
              Calculating cash trajectory...
            </div>
          ) : !runway || runway.status !== "PROJECTED" ? (
            <div className="p-6 rounded-2xl bg-[#FFF8EB] border border-[#FDE68A] text-xs text-[#92400E]">
              <div className="font-bold mb-1">Not enough information yet</div>
              <p>Please record your latest cash check-in and daily living estimates to visualize this chart.</p>
              <div className="mt-3 flex gap-2">
                <Link to="/checkin" className="font-bold underline">Check-In Balance →</Link>
                <Link to="/profile" className="font-bold underline">Set Estimates →</Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Daily bars */}
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
                {runway.projections.slice(0, 7).map((day) => {
                  const isShortfall = day.closingBalancePaise < 0;
                  const balance = day.closingBalancePaise;
                  return (
                    <div
                      key={day.date}
                      className={`p-3.5 rounded-2xl border text-center transition-all ${
                        isShortfall
                          ? "bg-red-50 border-red-200 text-red-950"
                          : "bg-[#FAF7F2] border-[#E5E2DC] text-[#16181D]"
                      }`}
                    >
                      <div className="text-[10px] font-mono text-[#7A7468] mb-1">
                        {day.date.slice(5)}
                      </div>
                      <div className="text-sm font-black font-mono tabular-nums mb-1">
                        {formatINR(balance)}
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                          isShortfall
                            ? "bg-red-200 text-red-900"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isShortfall ? "DEFICIT" : "STEADY"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. Plain-English Rule-Based Explanations */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E2DC] shadow-xs space-y-5">
          <h2 className="text-lg font-bold text-[#16181D]">
            Plain-English Runway Explanations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5E2DC]">
              <div className="font-bold text-[#16181D] mb-1">
                How does FLOVA calculate my available cash?
              </div>
              <p className="text-[#5A554A] leading-relaxed">
                We take your latest verified cash and bank check-in, add confirmed income received since, and subtract verified personal and work expenses.
                <strong> Customer COD cash is never counted as your money.</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5E2DC]">
              <div className="font-bold text-[#16181D] mb-1">
                Why aren&apos;t scheduled payouts included in my cash?
              </div>
              <p className="text-[#5A554A] leading-relaxed">
                Platforms sometimes delay or adjust payouts due to attendance, customer cancellations, or bank holidays. Until a payout is settled into your account, counting it as cash could cause you to bounce rent or bike EMI.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5E2DC]">
              <div className="font-bold text-[#16181D] mb-1">
                What does &quot;Not enough information yet&quot; mean?
              </div>
              <p className="text-[#5A554A] leading-relaxed">
                Unlike apps that display a false ₹0, FLOVA shows uncertainty truthfully. If you haven&apos;t entered your daily petrol or food costs, we tell you rather than assuming you have zero expenses.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5E2DC]">
              <div className="font-bold text-[#16181D] mb-1">
                What happens during monsoon slowdowns?
              </div>
              <p className="text-[#5A554A] leading-relaxed">
                By maintaining a 14-day runway buffer and separating COD collections, you can absorb 3 to 5 days of heavy rainfall order drops without turning to high-interest daily loans.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
