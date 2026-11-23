import { SocialLogin } from "@capgo/capacitor-social-login";
import { Capacitor } from "@capacitor/core";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

/**
 * Google Web Client ID configured in Google Cloud Console.
 * Required for Credential Manager on Android to retrieve an ID token.
 */
export const GOOGLE_WEB_CLIENT_ID =
  typeof import.meta !== "undefined" && import.meta.env
    ? (import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined)?.trim() || ""
    : "";

let isInitialized = false;

/**
 * Initializes native social login providers once at startup.
 */
export async function initSocialLogin(): Promise<void> {
  if (isInitialized) return;
  if (!GOOGLE_WEB_CLIENT_ID) {
    // If not configured, social login will warn when invoked.
    return;
  }

  try {
    await SocialLogin.initialize({
      google: {
        webClientId: GOOGLE_WEB_CLIENT_ID,
        mode: "online",
      },
    });
    isInitialized = true;
  } catch (err) {
    console.warn("Failed to initialize SocialLogin:", err);
  }
}

/**
 * Generates a cryptographically random, URL-safe raw nonce.
 */
export function generateRawNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Computes the SHA-256 hex digest of a message.
 */
export async function sha256Hex(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Native Google Sign-In via Android Credential Manager (or browser OAuth on Web).
 * Exchanges the Google ID token with Supabase Auth via signInWithIdToken.
 */
export async function signInWithGoogle(): Promise<Session> {
  if (Capacitor.isNativePlatform()) {
    if (!GOOGLE_WEB_CLIENT_ID) {
      throw new Error(
        "Google Sign-In is not configured. Missing VITE_GOOGLE_WEB_CLIENT_ID in environment."
      );
    }

    if (!isInitialized) {
      await initSocialLogin();
    }

    // 1. Generate nonce pair for replay protection
    const rawNonce = generateRawNonce();
    const hashedNonce = await sha256Hex(rawNonce);

    // 2. Invoke Android Credential Manager account chooser
    let res;
    try {
      res = await SocialLogin.login({
        provider: "google",
        options: {
          nonce: hashedNonce,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("canceled") ||
        msg.includes("cancelled") ||
        msg.includes("16") || // Common Google Play Services cancel code
        msg.includes("user_cancelled")
      ) {
        throw new Error("Sign-in cancelled");
      }
      throw new Error(`Google Sign-In failed: ${msg}`);
    }

    const result = res?.result;
    if (!result || result.responseType !== "online" || !result.idToken) {
      throw new Error("No ID token returned from Google Sign-In");
    }

    const idToken = result.idToken;

    // 3. Exchange ID token with Supabase Auth
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
      nonce: rawNonce,
    });

    if (error) {
      throw new Error(`Supabase authentication failed: ${error.message}`);
    }

    if (!data.session) {
      throw new Error("Authentication succeeded but no session was created.");
    }

    return data.session;
  }

  // Web fallback: standard Supabase OAuth redirect
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/app`,
    },
  });

  if (error) {
    throw new Error(`Google Sign-In failed: ${error.message}`);
  }

  // For Web redirect, browser leaves the page
  return new Promise(() => {});
}

/**
 * Sign out from both Supabase Auth and native Google session.
 */
export async function signOutAll(): Promise<void> {
  if (Capacitor.isNativePlatform() && isInitialized) {
    try {
      await SocialLogin.logout({ provider: "google" });
    } catch (err) {
      console.warn("Native Google logout notice:", err);
    }
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`Logout failed: ${error.message}`);
}
