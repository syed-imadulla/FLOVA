import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { signOut } from "../services/auth";

export function HomePlaceholder() {
  const { user } = useSession();
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

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Home</h1>
      <p>Signed in as {user?.email}</p>
      {error && (
        <div role="alert" style={{ color: "red", marginBottom: "1rem" }}>
          {error}
        </div>
      )}
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
