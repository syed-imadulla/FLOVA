import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "./useSession";
import { useProfile } from "../profile/useProfile";
import { Splash } from "../ui/kit";

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();

  if (sessionLoading) {
    return <Splash />;
  }

  if (session) {
    // If profile is still loading for an authenticated user, wait so we can make the right routing decision
    if (profileLoading && !profile) {
      return <Splash />;
    }

    const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname;
    
    // Check onboarding completion
    if (profile?.onboarding_completed) {
      const target =
        fromPath &&
        fromPath !== "/" &&
        fromPath !== "/login" &&
        fromPath !== "/signup" &&
        fromPath !== "/settings" &&
        fromPath !== "/profile" &&
        fromPath.startsWith("/")
          ? fromPath
          : "/app";
      return <Navigate to={target} replace />;
    }

    // Incomplete onboarding or new user
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
