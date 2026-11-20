// =====================================================================
// FLOVA Money Overview Page (Owner: M2 & M3)
// Connected directly to:
// - useRunway() deterministic financial engine feed
// - listActivityTimeline() for recent verified transactions
// - generateFinancialInsights() for 4 explainable deterministic insights
// Displays:
// 1. Confirmed liquid personal balance
// 2. Cash and bank balance breakdown
// 3. Own income
// 4. Own living expenses
// 5. Own work expenses
// 6. Custodial COD funds (strictly segregated)
// 7. Expected payouts (scheduled advisory, zero balance impact)
// 8. Financial commitments
// 9. Daily spending budgets & Day 0 burn
// 10. Estimated runway and shortfall projection
// =====================================================================

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useProfile } from "../profile/useProfile";
import { useRunway } from "../runway/useRunway";
import { listActivityTimeline } from "../services/data";
import { formatINR, toPaise } from "../lib/money";
import { todayLocalISO } from "../data/dates";
import { generateFinancialInsights, type FinancialInsight } from "../engine/insights";
import type { ActivityItem } from "../types/contracts";

export function MoneyOverviewPage() {
  const { profile } = useProfile();
  const { runway, rawInput, loading: runwayLoading, error: runwayError, reload } = useRunway({ horizonDays: 7 });

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  async function loadActivity() {
    setActivityLoading(true);
    try {
      const items = await listActivityTimeline({ limit: 4, includeExpectedPayouts: true });
      setRecentActivity(items);
    } catch {
      // Activity load failure won't block the runway engine display
    } finally {
      setActivityLoading(false);
    }
  }

  useEffect(() => {
    loadActivity();
  }, []);

  const today = todayLocalISO();

  // Generate explainable deterministic insights
  const insights: FinancialInsight[] = generateFinancialInsights(rawInput, runway, recentActivity, { today });

  // Compute Income / Living / Work totals from verified transactions
  let ownIncomePaise = 0;
  let ownLivingPaise = 0;
  let ownWorkPaise = 0;

  if (rawInput && Array.isArray(rawInput.transactionsSinceCheckin)) {
    for (const tx of rawInput.transactionsSinceCheckin) {
      if (tx.ownership === "mine") {
        if (tx.type === "income") {
          ownIncomePaise += tx.amount;
        } else if (tx.type === "expense") {
          if (tx.expenseType === "work") {
            ownWorkPaise += tx.amount;
          } else {
            ownLivingPaise += tx.amount;
          }
        }
      }
    }
  }

  // Checkin cash & bank split
  const checkinCashPaise = rawInput?.latestCheckin?.cash ?? null;
  const checkinBankPaise = rawInput?.latestCheckin?.bank ?? null;
  const custodialPaise = runway?.custodialOwedPaise ?? 0;

  // Expected payouts sum
  const expectedPayoutsPaise = (rawInput?.payouts || [])
    .filter((p) => p.status === "scheduled" || p.status === "estimated" || p.status === "unearned")
    .reduce((sum, p) => sum + p.expected, 0);

  // Commitments sum
  const commitmentsPaise = (rawInput?.commitments || []).reduce((sum, c) => sum + c.amount, 0);

  const displayName = profile?.display_name || "Delivery Worker";

  return (
    <div style={{ padding: "1.25rem 1rem", maxWidth: "680px", margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
            FLOVA Runway &amp; Money Overview
          </span>
          <h1 style={{ fontSize: "1.5rem", margin: "0.15rem 0 0 0", color: "#0f172a" }}>
            Namaste, {displayName}
          </h1>
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button
            onClick={() => { reload(); loadActivity(); }}
            title="Refresh runway & activity"
            style={{
              padding: "0.45rem 0.75rem",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            ↻ Sync
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {runwayError && (
        <div role="alert" style={{ background: "#fee2e2", border: "1px solid #f87171", color: "#991b1b", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>
          {runwayError}
        </div>
      )}

      {/* Quick Action Navigation Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <Link
          to="/voice"
          style={{
            padding: "0.6rem 0.25rem",
            background: "#dc2626",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "6px",
            textAlign: "center",
            fontSize: "0.8rem",
            fontWeight: 700,
          }}
        >
          🎙 Voice
        </Link>
        <Link
          to="/catch"
          style={{
            padding: "0.6rem 0.25rem",
            background: "#0f766e",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "6px",
            textAlign: "center",
            fontSize: "0.8rem",
            fontWeight: 700,
          }}
        >
          ⚡ Catch
        </Link>
        <Link
          to="/add"
          style={{
            padding: "0.6rem 0.25rem",
            background: "#1a365d",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "6px",
            textAlign: "center",
            fontSize: "0.8rem",
            fontWeight: 700,
          }}
        >
          + Expense
        </Link>
        <Link
          to="/checkin"
          style={{
            padding: "0.6rem 0.25rem",
            background: "#475569",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "6px",
            textAlign: "center",
            fontSize: "0.8rem",
            fontWeight: 700,
          }}
        >
          📌 Check-in
        </Link>
      </div>

      {/* Pillar 1: Hero Confirmed Liquid Balance Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)",
          color: "#fff",
          borderRadius: "12px",
          padding: "1.25rem",
          marginBottom: "1.25rem",
          boxShadow: "0 4px 12px rgba(15,23,42,0.15)",
        }}
      >
        <div style={{ fontSize: "0.85rem", color: "#93c5fd", fontWeight: 600, textTransform: "uppercase" }}>
          Available Liquid Money (Confirmed)
        </div>

        {runwayLoading && !runway ? (
          <h2 style={{ fontSize: "2rem", margin: "0.5rem 0", color: "#e2e8f0" }}>Loading…</h2>
        ) : runway?.confirmedBalancePaise !== null && runway?.confirmedBalancePaise !== undefined ? (
          <h2 style={{ fontSize: "2.2rem", margin: "0.35rem 0", fontWeight: 800, letterSpacing: "-0.5px" }}>
            {formatINR(runway.confirmedBalancePaise)}
          </h2>
        ) : (
          <div style={{ marginTop: "0.5rem" }}>
            <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fef08a" }}>
              Baseline Needed
            </span>
            <p style={{ margin: "0.25rem 0 0.5rem 0", fontSize: "0.85rem", color: "#cbd5e1" }}>
              Record your cash and bank balance to calculate available funds.
            </p>
            <Link
              to="/checkin"
              style={{
                display: "inline-block",
                padding: "0.35rem 0.75rem",
                background: "#fef08a",
                color: "#713f12",
                textDecoration: "none",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: 700,
              }}
            >
              Record Check-in Now →
            </Link>
          </div>
        )}

        {/* Cash vs Bank Breakdown */}
        {checkinCashPaise !== null && checkinBankPaise !== null && (
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.15)", fontSize: "0.85rem", color: "#cbd5e1" }}>
            <div>Cash in Hand: <strong style={{ color: "#fff" }}>{formatINR(checkinCashPaise)}</strong></div>
            <div>Bank Balance: <strong style={{ color: "#fff" }}>{formatINR(checkinBankPaise)}</strong></div>
          </div>
        )}
      </div>

      {/* Pillar 10 & Insights Section */}
      {insights.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: "1rem", color: "#334155", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            💡 Financial Insights &amp; Alerts
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {insights.map((ins) => {
              const isUrgent = ins.severity === "urgent";
              const isWarning = ins.severity === "warning";
              const border = isUrgent ? "#ef4444" : isWarning ? "#f59e0b" : "#3b82f6";
              const bg = isUrgent ? "#fef2f2" : isWarning ? "#fffbeb" : "#eff6ff";
              const icon = isUrgent ? "🚨" : isWarning ? "⚠️" : "ℹ️";

              return (
                <div
                  key={ins.id}
                  style={{
                    background: bg,
                    borderLeft: `4px solid ${border}`,
                    borderTop: "1px solid #e2e8f0",
                    borderRight: "1px solid #e2e8f0",
                    borderBottom: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    padding: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>
                      {icon} {ins.title}
                    </span>
                    {ins.actionUrl && (
                      <Link to={ins.actionUrl} style={{ fontSize: "0.75rem", color: "#1d4ed8", fontWeight: 600, textDecoration: "none" }}>
                        {ins.actionLabel || "View"} →
                      </Link>
                    )}
                  </div>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "#334155" }}>
                    {ins.message}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Runway Projection Card */}
      <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "#1e293b" }}>⏱ Runway Projection</h3>
          {runway?.status === "PROJECTED" && (
            <span style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: runway.firstShortfallDate ? "#fee2e2" : "#dcfce7", color: runway.firstShortfallDate ? "#991b1b" : "#166534", borderRadius: "4px", fontWeight: 700 }}>
              {runway.firstShortfallDate ? `Shortfall ${runway.firstShortfallDate}` : "Safe for 7+ days"}
            </span>
          )}
        </div>

        {runway?.status === "INSUFFICIENT_INFORMATION" ? (
          <div style={{ padding: "0.75rem", background: "#fefce8", border: "1px solid #fef08a", borderRadius: "6px", fontSize: "0.85rem" }}>
            <strong>Action Required:</strong>
            <ul style={{ margin: "0.35rem 0 0 0", paddingLeft: "1.2rem", color: "#713f12" }}>
              {runway.missingInputs.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        ) : runway?.status === "PROJECTED" ? (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
              <div style={{ background: "#f8fafc", padding: "0.6rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Estimated Runway</span>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
                  {runway.runwayDays !== null ? `${runway.runwayDays} Days` : "Uncertain"}
                </div>
              </div>
              <div style={{ background: "#f8fafc", padding: "0.6rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Daily Essential Burn</span>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
                  {formatINR(runway.dailyEssentialExpensePaise || 0)}
                </div>
              </div>
            </div>

            {runway.firstShortfallDate && (
              <div style={{ marginTop: "0.75rem", padding: "0.6rem", background: "#fef2f2", borderRadius: "6px", border: "1px solid #fecaca", fontSize: "0.85rem", color: "#991b1b" }}>
                ⚠️ <strong>Shortfall Alert:</strong> Cash projected to run out on <strong>{runway.firstShortfallDate}</strong>.
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Financial Breakdown Grid (Pillars 3, 4, 5, 6, 7, 8, 9) */}
      <h3 style={{ fontSize: "1rem", color: "#334155", margin: "0 0 0.5rem 0" }}>
        📊 Money Summary
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "1.25rem" }}>
        {/* Income */}
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.75rem", borderRadius: "8px" }}>
          <span style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 600 }}>Confirmed Income</span>
          <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#15803d", marginTop: "0.2rem" }}>
            +{formatINR(ownIncomePaise)}
          </div>
          <span style={{ fontSize: "0.7rem", color: "#15803d" }}>Since last check-in</span>
        </div>

        {/* Living Expenses */}
        <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", padding: "0.75rem", borderRadius: "8px" }}>
          <span style={{ fontSize: "0.75rem", color: "#9f1239", fontWeight: 600 }}>Living Expenses</span>
          <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#be123c", marginTop: "0.2rem" }}>
            −{formatINR(ownLivingPaise)}
          </div>
          <span style={{ fontSize: "0.7rem", color: "#9f1239" }}>Food, tea &amp; personal</span>
        </div>

        {/* Work Expenses */}
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.75rem", borderRadius: "8px" }}>
          <span style={{ fontSize: "0.75rem", color: "#1e40af", fontWeight: 600 }}>Work Expenses</span>
          <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1d4ed8", marginTop: "0.2rem" }}>
            −{formatINR(ownWorkPaise)}
          </div>
          <span style={{ fontSize: "0.7rem", color: "#1e40af" }}>Fuel, phone &amp; repairs</span>
        </div>

        {/* Custodial COD (Strictly Segregated) */}
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "0.75rem", borderRadius: "8px" }}>
          <span style={{ fontSize: "0.75rem", color: "#92400e", fontWeight: 600 }}>Custodial COD (Owed)</span>
          <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#b45309", marginTop: "0.2rem" }}>
            {formatINR(custodialPaise)}
          </div>
          <span style={{ fontSize: "0.7rem", color: "#92400e" }}>Platform cash, not mine</span>
        </div>

        {/* Expected Payouts */}
        <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", padding: "0.75rem", borderRadius: "8px" }}>
          <span style={{ fontSize: "0.75rem", color: "#6b21a8", fontWeight: 600 }}>Scheduled Payouts</span>
          <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#7e22ce", marginTop: "0.2rem" }}>
            +{formatINR(expectedPayoutsPaise)}
          </div>
          <span style={{ fontSize: "0.7rem", color: "#6b21a8" }}>Pending bank deposit</span>
        </div>

        {/* Financial Commitments */}
        <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", padding: "0.75rem", borderRadius: "8px" }}>
          <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>Bills &amp; Commitments</span>
          <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#334155", marginTop: "0.2rem" }}>
            {formatINR(commitmentsPaise)}
          </div>
          <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Upcoming rent &amp; EMI</span>
        </div>
      </div>

      {/* Embedded Recent Activity Preview */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "#1e293b" }}>Recent Financial Activity</h3>
          <Link to="/activity" style={{ fontSize: "0.85rem", color: "#1a365d", fontWeight: 600, textDecoration: "none" }}>
            View Full Timeline →
          </Link>
        </div>

        {activityLoading ? (
          <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Loading recent activity...</p>
        ) : recentActivity.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.5rem 0" }}>No transactions or check-ins recorded yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {recentActivity.map((it) => {
              const isIncome = it.type === "income";
              const isCheckin = it.kind === "checkin";
              const isPayout = it.kind === "expected_payout";

              return (
                <div
                  key={it.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.4rem 0",
                    borderBottom: "1px solid #f1f5f9",
                    fontSize: "0.85rem",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{it.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{it.date}</div>
                  </div>
                  <div>
                    {isCheckin ? (
                      <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Check-in</span>
                    ) : isPayout ? (
                      <span style={{ fontSize: "0.85rem", color: "#7e22ce", fontWeight: 700 }}>
                        +{formatINR(it.amountPaise || toPaise(it.rupeeAmount || 0))} (Exp)
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.95rem", fontWeight: 700, color: isIncome ? "#15803d" : "#b91c1c" }}>
                        {isIncome ? "+" : "−"} {formatINR(it.amountPaise || toPaise(it.rupeeAmount || 0))}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div style={{ textAlign: "center", paddingTop: "0.5rem", borderTop: "1px solid #e2e8f0" }}>
        <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>
          FLOVA · Deterministic Financial Engine · Integer Paise Safe
        </p>
      </div>
    </div>
  );
}
