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
    const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";
    return <Navigate to={fromPath} replace />;
  }

  return <>{children}</>;
}
