// Auth service (owner: M1). Supabase Auth stores and checks credentials;
// FLOVA never stores passwords itself.
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { signOutAll } from "./socialAuth";

export async function signUp(email: string, password: string, displayName?: string): Promise<User | null> {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: displayName ? { display_name: displayName } : undefined },
  });
  if (error) throw new Error(`Sign-up failed: ${error.message}`);
  // data.session is null when email confirmation is ON in the Supabase dashboard.
  return data.user;
}

export async function signIn(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login failed: ${error.message}`);
  return data.session;
}

export async function signOut(): Promise<void> {
  await signOutAll();
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(`Session check failed: ${error.message}`);
  return data.session;
}

/** Subscribe to login/logout/token refresh. Returns an unsubscribe function (call it in a React effect cleanup). */
export function onAuthChange(cb: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

/** Allowed origins for OAuth and Password Recovery redirects */
export const ALLOWED_REDIRECT_ORIGINS: readonly string[] = [
  "https://myflova.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "capacitor://localhost",
  "http://localhost",
  "in.flova.app://reset-password",
];

/**
 * Validates whether a redirect URL strictly targets an allowed application origin.
 * Prevents Open Redirect (CWE-601) vulnerabilities.
 */
export function isAllowedRedirectOrigin(targetUrl: string): boolean {
  if (!targetUrl || typeof targetUrl !== "string") return false;
  try {
    const parsed = new URL(targetUrl);
    return ALLOWED_REDIRECT_ORIGINS.some((allowed) => {
      try {
        const allowedParsed = new URL(allowed);
        return parsed.protocol === allowedParsed.protocol && parsed.host === allowedParsed.host;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * Derives a verified, safe password reset redirect URL matching the current environment.
 */
export function getSafePasswordResetRedirectUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    if (isAllowedRedirectOrigin(window.location.origin)) {
      return `${window.location.origin}/reset-password`;
    }
  }
  return "https://myflova.vercel.app/reset-password";
}

/**
 * Requests a secure password recovery email via Supabase Auth.
 * Adheres to anti-enumeration defense (Requirement 9): always presents a neutral,
 * reassuring response so attackers cannot discover whether an email exists.
 */
export async function requestPasswordReset(
  email: string,
  customRedirectTo?: string
): Promise<{ success: boolean; message: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  let redirectTo = getSafePasswordResetRedirectUrl();
  if (customRedirectTo) {
    if (isAllowedRedirectOrigin(customRedirectTo)) {
      redirectTo = customRedirectTo;
    } else {
      console.warn("Unauthorized custom redirect URL rejected; defaulting to safe origin:", customRedirectTo);
    }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo });

  if (error) {
    // Only surface genuine rate-limiting to prevent brute force; never leak user registration state
    if (error.status === 429) {
      throw new Error("Too many password reset requests. Please wait a few minutes before trying again.");
    }
    // For other errors, do not expose internal database/user existence details
  }

  return {
    success: true,
    message: "If an account exists for this email, we have sent a secure password reset link. Please check your inbox.",
  };
}

/**
 * Updates the password for the currently authenticated recovery session.
 */
export async function updatePassword(newPassword: string): Promise<void> {
  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw new Error(`Password update failed: ${error.message}`);
  }
}
