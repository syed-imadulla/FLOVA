import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { formatINR, toPaiseOrNull } from "../lib/money";
import { useProfile } from "../profile/useProfile";
import { signOut } from "../services/auth";

export function HomePlaceholder() {
  const { user } = useSession();
  const { profile } = useProfile();
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

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Home</h1>
      <p>Signed in as {displayName}</p>

      {error && (
        <div role="alert" style={{ color: "red", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div style={{ margin: "1.5rem 0", padding: "1rem", border: "1px solid #e0e0e0", borderRadius: "4px" }}>
        <h2 style={{ fontSize: "1.2rem", marginTop: 0 }}>Profile Summary</h2>
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
