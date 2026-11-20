import { Link } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { useProfile } from "../profile/useProfile";
import { useRunway } from "../runway/useRunway";
import { formatINR, toPaiseOrNull } from "../lib/money";
import { AppShell } from "../components/layout/AppShell";

export function HomeRunwayView() {
  const { user } = useSession();
  const { profile } = useProfile();
  const { runway, loading, error, reload } = useRunway({ horizonDays: 7 });

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Partner";

  const livingEst = toPaiseOrNull(profile?.daily_living_estimate);
  const workEst = toPaiseOrNull(profile?.daily_work_estimate);

  // Missing info indicator
  const hasMissingEstimates = livingEst === null || workEst === null;
  const hasCheckin = runway?.confirmedBalancePaise !== null && runway?.confirmedBalancePaise !== undefined;

  return (
    <AppShell activeNav="home">
      <div className="space-y-8">
        {/* Top Welcome Bar & Data Mode Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E2DC]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7A7468]">
                Good day, {displayName}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                ● Real Database
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#16181D]">
              Runway Dashboard
            </h1>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to="/voice"
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <span>🎙</span>
              <span>Voice Entry</span>
            </Link>
            <Link
              to="/checkin"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F6F3EC] border border-[#D5D0C5] text-xs font-bold text-[#16181D] shadow-xs"
            >
              Check-In Balance
            </Link>
            <Link
              to="/add"
              className="px-3.5 py-2 rounded-xl bg-[#0F5C4C] hover:bg-[#0c4a3d] text-white text-xs font-bold shadow-xs"
            >
              + Add
            </Link>
          </div>
        </div>

        {error && (
          <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => reload()} className="font-bold underline cursor-pointer">Retry</button>
          </div>
        )}

        {/* 1. Primary Headline Question Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E2DC] shadow-sm">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#7A7468] mb-2">
            The Core Question
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#16181D] tracking-tight mb-4">
            Will my available money last until my next payout?
          </h2>

          {loading ? (
            <div className="py-8 text-center text-xs text-[#7A7468] animate-pulse">
              Computing deterministic runway...
            </div>
          ) : runway?.status === "PROJECTED" ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <div>
                <span className="text-xs font-bold text-emerald-900 block mb-1">
                  Runway Status: Projected Steady
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-950 tabular-nums">
                  {runway.runwayDays !== null ? `${runway.runwayDays} Days Runway` : "Not enough information yet"}
                </div>
                <p className="text-xs text-emerald-800 mt-1 max-w-md">
                  {runway.firstShortfallDate
                    ? `First projected deficit on ${runway.firstShortfallDate}.`
                    : "No deficit projected over the next 7 days based on current burn."}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono text-emerald-800 uppercase block mb-1">
                  Confirmed Cash
                </span>
                <span className="text-2xl font-black text-emerald-950 tabular-nums">
                  {runway.confirmedBalancePaise !== null ? formatINR(runway.confirmedBalancePaise) : "—"}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#FFF8EB] border border-[#FDE68A] text-[#92400E]">
              <div className="flex items-center gap-2 font-bold text-sm mb-1">
                <span>⚠️</span>
                <span>Not enough information yet</span>
              </div>
              <p className="text-xs leading-relaxed max-w-xl">
                Runway projection requires your verified cash balance check-in and daily living/work estimates.
              </p>
              <div className="mt-4 flex items-center gap-3">
                {!hasCheckin && (
                  <Link to="/checkin" className="text-xs font-bold bg-[#92400E] text-white px-3 py-1.5 rounded-lg shadow-xs">
                    Start Balance Check-In →
                  </Link>
                )}
                {hasMissingEstimates && (
                  <Link to="/profile" className="text-xs font-bold text-[#92400E] underline">
                    Set daily estimates in Profile →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Three Metric Cards Grid (Confirmed vs Excluded vs Burn) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Confirmed Available Cash Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E2DC] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7A7468]">
                  Available Cash
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Confirmed
                </span>
              </div>
              <div className="text-3xl font-black text-[#16181D] tabular-nums tracking-tight my-2">
                {runway?.confirmedBalancePaise !== null && runway?.confirmedBalancePaise !== undefined
                  ? formatINR(runway.confirmedBalancePaise)
                  : "Not enough information yet"}
              </div>
              <p className="text-xs text-[#7A7468] leading-relaxed">
                Money you actually hold in cash &amp; bank, net of any COD cash belonging to the platform.
              </p>
            </div>
            <Link to="/checkin" className="mt-4 text-xs font-bold text-[#0F5C4C] hover:underline block">
              Update Check-In →
            </Link>
          </div>

          {/* Excluded & Custodial COD Money Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E2DC] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B45309]">
                  COD / Not Yours
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  Ringfenced
                </span>
              </div>
              <div className="text-3xl font-black text-[#B45309] tabular-nums tracking-tight my-2">
                {runway?.custodialOwedPaise !== null && runway?.custodialOwedPaise !== undefined
                  ? formatINR(runway.custodialOwedPaise)
                  : "₹0"}
              </div>
              <p className="text-xs text-[#7A7468] leading-relaxed">
                Platform cash collected from customer orders. Strictly excluded from your runway so you never spend it accidentally.
              </p>
            </div>
            <span className="mt-4 text-xs font-mono text-[#B45309]">
              Excluded from runway calculations
            </span>
          </div>

          {/* Daily Essential Burn Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E2DC] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7A7468]">
                  Daily Baseline Burn
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                  Essential
                </span>
              </div>
              <div className="text-3xl font-black text-[#16181D] tabular-nums tracking-tight my-2">
                {runway?.dailyEssentialExpensePaise !== null && runway?.dailyEssentialExpensePaise !== undefined
                  ? `${formatINR(runway.dailyEssentialExpensePaise)} / day`
                  : "Not enough information yet"}
              </div>
              <div className="text-xs text-[#7A7468] space-y-1">
                <div>Living: {livingEst !== null ? formatINR(livingEst) : "Not enough info"}</div>
                <div>Work (Fuel/Phone): {workEst !== null ? formatINR(workEst) : "Not enough info"}</div>
              </div>
            </div>
            <Link to="/profile" className="mt-4 text-xs font-bold text-[#0F5C4C] hover:underline block">
              Edit in Profile →
            </Link>
          </div>
        </div>

        {/* 3. Expected Payouts & Commitments Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expected Payouts (Scheduled / Estimated) */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E2DC] shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5E2DC]">
              <div>
                <h3 className="text-base font-bold text-[#16181D]">Expected Payouts</h3>
                <span className="text-[11px] text-[#7A7468]">Not counted as cash until received</span>
              </div>
              <Link to="/payouts" className="text-xs font-bold text-[#0F5C4C] hover:underline">
                Manage Payouts →
              </Link>
            </div>

            {runway?.expectedPayouts && runway.expectedPayouts.length > 0 ? (
              <div className="space-y-3">
                {runway.expectedPayouts.map((p) => (
                  <div key={p.id} className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5E2DC] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#16181D] capitalize">
                        {p.kind.replace("_", " ")}
                      </div>
                      <div className="text-[11px] text-[#7A7468]">
                        Expected: {p.expectedDate || "Date unknown"} • Status: {p.status}
                      </div>
                    </div>
                    <div className="text-sm font-black text-[#0F5C4C] tabular-nums">
                      {formatINR(p.expected)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#7A7468]">
                No expected payouts logged.{" "}
                <Link to="/payouts" className="text-[#0F5C4C] font-bold underline">
                  Add expected payout
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming Commitments */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E2DC] shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5E2DC]">
              <div>
                <h3 className="text-base font-bold text-[#16181D]">Upcoming Commitments</h3>
                <span className="text-[11px] text-[#7A7468]">Rent, bike EMI, phone bills</span>
              </div>
              <Link to="/commitments" className="text-xs font-bold text-[#0F5C4C] hover:underline">
                Manage Bills →
              </Link>
            </div>

            {runway?.upcomingCommitments && runway.upcomingCommitments.length > 0 ? (
              <div className="space-y-3">
                {runway.upcomingCommitments.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5E2DC] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#16181D]">{c.title}</div>
                      <div className="text-[11px] text-[#7A7468]">Due: {c.dueDate}</div>
                    </div>
                    <div className="text-sm font-black text-[#B42318] tabular-nums">
                      −{formatINR(c.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#7A7468]">
                No upcoming commitments logged.{" "}
                <Link to="/commitments" className="text-[#0F5C4C] font-bold underline">
                  Add bill or EMI
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 4. 7-Day Runway Projections Table */}
        {runway?.projections && runway.projections.length > 0 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E2DC] shadow-xs overflow-hidden">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-[#16181D]">7-Day Cash Flow Projections</h3>
              <p className="text-xs text-[#7A7468]">
                Deterministic day-by-day cash trajectory derived strictly from confirmed starting balance minus baseline expenses.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E2DC] text-[#7A7468] uppercase font-mono text-[10px]">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Opening</th>
                    <th className="py-3 px-3">Essential Burn</th>
                    <th className="py-3 px-3">Bills Due</th>
                    <th className="py-3 px-3">Closing Cash</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DC]">
                  {runway.projections.map((day) => {
                    const isShortfall = day.closingBalancePaise < 0;
                    return (
                      <tr key={day.date} className={isShortfall ? "bg-red-50/50" : ""}>
                        <td className="py-3.5 px-3 font-semibold text-[#16181D]">{day.date}</td>
                        <td className="py-3.5 px-3 font-mono tabular-nums">{formatINR(day.openingBalancePaise)}</td>
                        <td className="py-3.5 px-3 font-mono tabular-nums text-[#7A7468]">
                          {day.essentialExpensePaise > 0 ? `−${formatINR(day.essentialExpensePaise)}` : "—"}
                        </td>
                        <td className="py-3.5 px-3 font-mono tabular-nums text-red-700">
                          {day.commitmentDeductionPaise > 0 ? `−${formatINR(day.commitmentDeductionPaise)}` : "—"}
                        </td>
                        <td className={`py-3.5 px-3 font-mono tabular-nums font-bold ${day.closingBalancePaise < 0 ? "text-red-700" : "text-[#16181D]"}`}>
                          {formatINR(day.closingBalancePaise)}
                        </td>
                        <td className="py-3.5 px-3">
                          {isShortfall ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              Deficit
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Steady
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
