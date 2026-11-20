import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "./useSession";

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>;
  }

  if (session) {
    // Authenticated users who hit /login or /signup without a saved "from" path
    // should land on /app (the authenticated dashboard), not the public landing page.
    const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/app";
    return <Navigate to={fromPath} replace />;
  }

  return <>{children}</>;
}
