import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSession, signUp } from "../../services/auth";

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await signUp(email, password, displayName.trim() || undefined);
      if (!user) {
        throw new Error("Sign-up failed: No user returned");
      }
      const session = await getSession();
      if (!session) {
        setNotice("Check your email to confirm, then log in.");
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h1>Sign Up</h1>
      {(error || notice) && (
        <div role="alert" style={{ color: error ? "red" : "#005500", marginBottom: "1rem" }}>
          {error || notice}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="signup-email" style={{ display: "block", marginBottom: "0.25rem" }}>
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="signup-password" style={{ display: "block", marginBottom: "0.25rem" }}>
            Password (min 6 characters)
          </label>
          <input
            id="signup-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="signup-display-name" style={{ display: "block", marginBottom: "0.25rem" }}>
            Display Name (optional)
          </label>
          <input
            id="signup-display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isSubmitting}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", minHeight: "48px", cursor: isSubmitting ? "not-allowed" : "pointer" }}
        >
          {isSubmitting ? "Signing up..." : "Sign Up"}
        </button>
      </form>
      <p style={{ marginTop: "1.5rem" }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
