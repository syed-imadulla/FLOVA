import { getMyProfile } from "./data";
import type { Profile } from "../types/contracts";

export interface ProfileLoader {
  (): Promise<Profile>;
}

let activeProfileLoader: ProfileLoader = getMyProfile;

export function setProfileLoaderForTesting(loader?: ProfileLoader): void {
  activeProfileLoader = loader ?? getMyProfile;
}

/**
 * Resolves the deterministic post-authentication destination path.
 *
 * Requirements:
 * 1. New user without a profile or without completed onboarding -> /onboarding.
 * 2. Existing user with completed onboarding -> /app (or intended internal "from" path if valid).
 * 3. Existing user with incomplete onboarding -> /onboarding.
 * 4. Profile / settings (/profile) must never be used as the default post-login destination.
 */
export async function resolvePostLoginDestination(fromPath?: string | null): Promise<string> {
  try {
    const profile = await activeProfileLoader();
    if (profile && profile.onboarding_completed) {
      // If user was heading to a valid app screen other than auth or settings, honor it;
      // otherwise send directly to dashboard (/app).
      if (
        fromPath &&
        fromPath !== "/" &&
        fromPath !== "/login" &&
        fromPath !== "/signup" &&
        fromPath !== "/settings" &&
        fromPath !== "/profile" &&
        fromPath.startsWith("/")
      ) {
        return fromPath;
      }
      return "/app";
    }
    return "/onboarding";
  } catch (err) {
    // If profile cannot be loaded or is not yet created, route to /onboarding
    console.warn("Could not load profile during post-login destination check:", err);
    return "/onboarding";
  }
}
