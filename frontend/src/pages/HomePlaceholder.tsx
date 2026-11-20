import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { todayLocalISO } from "../data/dates";
import { formatINR } from "../lib/money";
import { useProfile } from "../profile/useProfile";
import { useRunway } from "../runway/useRunway";
import { signOut } from "../services/auth";

export function HomePlaceholder() {
  const { user } = useSession();
  const { profile } = useProfile();
  const { runway, loading: runwayLoading, error: runwayError } = useRunway({ horizonDays: 7 });
  const navigate = useNavigate();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setIsLoggingOut(true);
    setError(null);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log out");
      setIsLoggingOut(false);
    }
  }

  const displayName = profile?.display_name || user?.email || "User";

  return (
    <div style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
      <h1>FLOVA Runway Planner</h1>
      <p>Signed in as <strong>{displayName}</strong></p>

      {(error || runwayError) && (
        <div role="alert" style={{ color: "red", marginBottom: "1rem" }}>
          {error || runwayError}
        </div>
      )}

      {/* Quick Navigation to Data Capture screens */}
      <div style={{ margin: "1.5rem 0", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
        <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>Money Actions</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <Link to="/voice" style={{ padding: "0.6rem 1rem", background: "#dc2626", border: "none", textDecoration: "none", color: "#fff", borderRadius: "6px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            🎙 Voice Entry
          </Link>
          <Link to="/wish" style={{ padding: "0.6rem 1rem", background: "#536C53", border: "none", textDecoration: "none", color: "#fff", borderRadius: "6px", fontWeight: 600 }}>
            WISH · Savings Goal
          </Link>
          <Link to="/checkin" style={{ padding: "0.5rem 1rem", background: "#fff", border: "1px solid #ccc", textDecoration: "none", color: "#333", borderRadius: "3px" }}>
            Balance Check-In
          </Link>
          <Link to="/add" style={{ padding: "0.5rem 1rem", background: "#fff", border: "1px solid #ccc", textDecoration: "none", color: "#333", borderRadius: "3px" }}>
            Add Transaction
          </Link>
          <Link to="/payouts" style={{ padding: "0.5rem 1rem", background: "#fff", border: "1px solid #ccc", textDecoration: "none", color: "#333", borderRadius: "3px" }}>
            Expected Payouts
          </Link>
          <Link to="/commitments" style={{ padding: "0.5rem 1rem", background: "#fff", border: "1px solid #ccc", textDecoration: "none", color: "#333", borderRadius: "3px" }}>
            Bills & Debts
          </Link>
          <Link to="/history" style={{ padding: "0.5rem 1rem", background: "#fff", border: "1px solid #ccc", textDecoration: "none", color: "#333", borderRadius: "3px" }}>
            Transaction History
          </Link>
        </div>
      </div>

      {/* Primary Runway Dashboard Section */}
      <div style={{ margin: "1.5rem 0", padding: "1.25rem", border: "2px solid #2b547e", borderRadius: "6px", backgroundColor: "#fafcff" }}>
        <h2 style={{ fontSize: "1.3rem", marginTop: 0, color: "#1a365d" }}>Confirmed Runway Outlook</h2>

        {runwayLoading && !runway ? (
          <p>Calculating runway from confirmed records...</p>
        ) : runway?.status === "INSUFFICIENT_INFORMATION" ? (
          <div style={{ padding: "1rem", backgroundColor: "#fff8e6", border: "1px solid #ffd591", borderRadius: "4px" }}>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#d46b08" }}>Not enough information yet</h3>
            <p style={{ margin: "0.25rem 0" }}>To project your runway without guessing, we need:</p>
            <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
              {runway.missingInputs.map((missing) => (
                <li key={missing} style={{ margin: "0.25rem 0" }}>
                  <strong>{missing}</strong>{" "}
                  {missing.includes("Check-in") ? (
                    <Link to="/checkin">→ Record balance</Link>
                  ) : (
                    <Link to="/onboarding">→ Complete profile estimates</Link>
                  )}
                </li>
              ))}
            </ul>
            {runway.confirmedBalancePaise !== null && (
              <p style={{ marginTop: "0.75rem", fontSize: "0.95rem" }}>
                Current confirmed liquid cash: <strong>{formatINR(runway.confirmedBalancePaise)}</strong>
              </p>
            )}
          </div>
        ) : runway?.status === "PROJECTED" ? (
          <div>
            {/* Confirmed Available Balance */}
            <div style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.9rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Confirmed Available Balance
              </div>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#0f172a", marginTop: "0.25rem" }}>
                {runway.confirmedBalancePaise !== null ? formatINR(runway.confirmedBalancePaise) : "₹0"}
              </div>
              {runway.custodialOwedPaise !== null && runway.custodialOwedPaise > 0 && (
                <div style={{ fontSize: "0.85rem", color: "#b45309", marginTop: "0.25rem" }}>
                  (Excludes {formatINR(runway.custodialOwedPaise)} COD cash belonging to platform)
                </div>
              )}
            </div>

            {/* First Shortfall Notice */}
            <div style={{ marginBottom: "1.25rem", padding: "0.75rem 1rem", borderRadius: "4px", backgroundColor: runway.firstShortfallDate ? "#fef2f2" : "#f0fdf4", border: `1px solid ${runway.firstShortfallDate ? "#fecaca" : "#bbf7d0"}` }}>
              {runway.firstShortfallDate ? (
                <div>
                  <strong style={{ color: "#991b1b" }}>⚠️ Projected Shortfall on {runway.firstShortfallDate}</strong>
                  <div style={{ fontSize: "0.9rem", color: "#7f1d1d", marginTop: "0.25rem" }}>
                    Your money covers essential expenses for <strong>{runway.runwayDays} full day(s)</strong>.
                  </div>
                </div>
              ) : (
                <div style={{ color: "#166534" }}>
                  <strong>✓ No shortfall projected</strong> over the 7-day horizon.
                </div>
              )}
            </div>

            {/* 7-Day Day-by-Day Table */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>7-Day Projected Daily Closing Balance</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#edf2f7", borderBottom: "2px solid #cbd5e1" }}>
                      <th style={{ padding: "0.5rem" }}>Date</th>
                      <th style={{ padding: "0.5rem" }}>Daily Outflow</th>
                      <th style={{ padding: "0.5rem" }}>Commitments</th>
                      <th style={{ padding: "0.5rem" }}>Projected Closing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runway.projections.map((p) => {
                      const isNegative = p.closingBalancePaise < 0;
                      const isToday = p.date === todayLocalISO();
                      return (
                        <tr key={p.date} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: isNegative ? "#fff5f5" : "transparent" }}>
                          <td style={{ padding: "0.5rem", fontWeight: "bold" }}>
                            {p.date} {isToday && <span style={{ fontWeight: "normal", color: "#64748b", fontSize: "0.8rem" }}>(Today)</span>}
                          </td>
                          <td style={{ padding: "0.5rem" }}>−{formatINR(p.essentialExpensePaise)}</td>
                          <td style={{ padding: "0.5rem" }}>
                            {p.commitmentDeductionPaise > 0 ? (
                              <span style={{ color: "#c53030" }}>−{formatINR(p.commitmentDeductionPaise)} ({p.commitmentsApplied.map((c) => c.title).join(", ")})</span>
                            ) : (
                              <span style={{ color: "#a0aec0" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "0.5rem", fontWeight: "bold", color: isNegative ? "#e53e3e" : "#2f855a" }}>
                            {formatINR(p.closingBalancePaise)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Upcoming Commitments */}
            {runway.upcomingCommitments.length > 0 && (
              <div style={{ marginBottom: "1.25rem", padding: "0.75rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "4px" }}>
                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem" }}>Upcoming Commitments</h4>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
                  {runway.upcomingCommitments.map((c) => (
                    <li key={c.id}>
                      {c.title}: <strong>{formatINR(c.amount)}</strong> due on {c.dueDate}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Expected Payouts (Expected, not counted) */}
            {runway.expectedPayouts.length > 0 && (
              <div style={{ padding: "0.75rem", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "4px" }}>
                <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.95rem", color: "#475569" }}>
                  Expected Payouts <span style={{ fontWeight: "normal", fontSize: "0.85rem", color: "#64748b" }}>(Expected, not counted)</span>
                </h4>
                <p style={{ margin: "0.25rem 0 0.5rem 0", fontSize: "0.8rem", color: "#64748b" }}>
                  Scheduled or estimated platform money does not count as cash until received.
                </p>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
                  {runway.expectedPayouts.map((p) => (
                    <li key={p.id}>
                      {formatINR(p.expected)} ({p.kind}) — Expected {p.expectedDate || "date unknown"} [{p.status.toUpperCase()}]
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        style={{ padding: "0.75rem 1.5rem", fontSize: "1rem", minHeight: "48px", cursor: isLoggingOut ? "not-allowed" : "pointer" }}
      >
        {isLoggingOut ? "Logging out..." : "Log out"}
      </button>
    </div>
  );
}
