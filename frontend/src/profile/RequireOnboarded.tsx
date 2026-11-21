import React from "react";
import { Navigate } from "react-router-dom";
import { useProfile } from "./useProfile";
import { Button, Notice, Splash } from "../ui/kit";

export function RequireOnboarded({ children }: { children: React.ReactNode }) {
  const { profile, loading, error, reload } = useProfile();

  // Also wait while the profile for a just-signed-in user hasn't arrived yet, so we never
  // bounce an onboarded user to /onboarding for one render.
  if (loading || (!profile && !error)) {
    return <Splash />;
  }

  if (error) {
    return (
      <div className="flova-app min-h-dvh bg-canvas p-6 flex flex-col justify-center gap-4 max-w-[480px] mx-auto">
        <Notice tone="danger" title="Couldn't load your profile">{error}</Notice>
        <Button onClick={reload}>Try again</Button>
      </div>
    );
  }

  if (!profile || !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
