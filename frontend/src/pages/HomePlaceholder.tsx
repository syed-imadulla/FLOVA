import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { useLatestCheckin } from "../data/useLatestCheckin";
import { formatINR, toPaise, toPaiseOrNull } from "../lib/money";
import { useProfile } from "../profile/useProfile";
import { signOut } from "../services/auth";

export function HomePlaceholder() {
  const { user } = useSession();
  const { profile } = useProfile();
  const { checkin } = useLatestCheckin();
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
  const livingPaise = toPaiseOrNull(profile?.daily_living_estimate);
  const workPaise = toPaiseOrNull(profile?.daily_work_estimate);

  let checkinText = "No balance check yet";
  if (checkin) {
    const totalPaise = toPaise(checkin.cash_amount) + toPaise(checkin.bank_amount);
    const notMinePaise = toPaise(checkin.not_mine_amount);
    checkinText = `${formatINR(totalPaise)} checked (${formatINR(notMinePaise)} not mine)`;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>FLOVA Runway Planner</h1>
      <p>Signed in as {displayName}</p>

      {error && (
        <div role="alert" style={{ color: "red", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Quick Navigation to Phase 3 screens */}
      <div style={{ margin: "1.5rem 0", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
        <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>Money Actions</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
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

      {/* Latest Balance Status */}
      <div style={{ margin: "1.5rem 0", padding: "1rem", border: "1px solid #e0e0e0", borderRadius: "4px" }}>
        <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>Latest Balance</h2>
        <p style={{ fontSize: "1.1rem", fontWeight: "bold", margin: "0.5rem 0" }}>{checkinText}</p>
        <Link to="/checkin" style={{ fontSize: "0.9rem" }}>Update balance check-in →</Link>
      </div>

      {/* Profile Summary */}
      <div style={{ margin: "1.5rem 0", padding: "1rem", border: "1px solid #e0e0e0", borderRadius: "4px" }}>
        <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>Profile Summary</h2>
        <p><strong>Work type:</strong> {profile?.work_profile ?? "Not set"}</p>
        <p><strong>Payout pattern:</strong> {profile?.payout_pattern ?? "Not set"}</p>
        <p>
          <strong>Daily living estimate:</strong>{" "}
          {livingPaise !== null ? formatINR(livingPaise) : "Not provided"}
        </p>
        <p>
          <strong>Daily work estimate:</strong>{" "}
          {workPaise !== null ? formatINR(workPaise) : "Not provided"}
        </p>
        <p style={{ marginTop: "1rem" }}>
          <Link to="/onboarding" style={{ display: "inline-block", padding: "0.5rem 1rem", border: "1px solid #ccc", textDecoration: "none", color: "#333" }}>
            Edit profile
          </Link>
        </p>
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
