import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "./useSession";
import { useProfile } from "../profile/useProfile";
import { Button, Notice, Splash } from "../ui/kit";

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession();
  const { profile, loading: profileLoading, error: profileError, reload } = useProfile();
  const location = useLocation();

  if (sessionLoading) {
    return <Splash />;
  }

  if (session) {
    // If profile is still loading for an authenticated user, wait so we can make the right routing decision
    if (profileLoading || (!profile && !profileError)) {
      return <Splash />;
    }

    if (profileError) {
      return (
        <div className="flova-app min-h-dvh bg-canvas p-6 flex flex-col justify-center gap-4 max-w-[480px] mx-auto">
          <Notice tone="danger" title="Couldn't load your profile">{profileError}</Notice>
          <Button onClick={reload}>Try again</Button>
        </div>
      );
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
