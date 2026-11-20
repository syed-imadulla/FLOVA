import React from "react";
import { Navigate } from "react-router-dom";
import { useProfile } from "./useProfile";

export function RequireOnboarded({ children }: { children: React.ReactNode }) {
  const { profile, loading, error, reload } = useProfile();

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <div role="alert" style={{ color: "red", marginBottom: "1rem" }}>
          {error}
        </div>
        <button
          onClick={reload}
          style={{ padding: "0.5rem 1rem", fontSize: "1rem", minHeight: "44px", cursor: "pointer" }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!profile || !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
