import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { updatePassword } from "../../services/auth";
import { IS_NATIVE_APP } from "../../native/platform";

export function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isInvalidToken, setIsInvalidToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    // 1. Inspect URL hash and query parameters for error flags from Supabase Auth
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : search);

    const errorParam = params.get("error");
    const errorDescription = params.get("error_description");

    if (errorParam || errorDescription) {
      setIsInvalidToken(true);
      setError(
        errorDescription?.replace(/\+/g, " ") ||
          "This password recovery link is invalid, expired, or has already been used."
      );
      setIsCheckingSession(false);
      return;
    }

    // 2. Check if a session exists or wait briefly for Supabase to parse the recovery token
    supabase.auth.getSession().then(({ data, error: sessionErr }) => {
      if (sessionErr || !data.session) {
        // If neither session nor hash tokens exist, link is expired/invalid
        if (!hash.includes("access_token=") && !search.includes("code=")) {
          setIsInvalidToken(true);
          setError("No active recovery session found. The link may have expired.");
        }
      }
      setIsCheckingSession(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify both fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(newPassword);
      // Invalidate the recovery session so the user signs in cleanly with new credentials
      await supabase.auth.signOut().catch(() => {});
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh h-dvh bg-[#FAF7F2] text-[#16181D] flex flex-col justify-center px-4 sm:px-6 lg:px-8 overflow-hidden overscroll-none select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-3">
        <Link to="/" className="inline-flex items-center gap-2 mb-1 group focus:outline-none">
          <img
            src="/favicon.svg"
            alt="FLOVA"
            className="w-8 h-8 rounded-xl object-contain shadow-xs group-hover:scale-105 transition-transform"
          />
          <span className="text-xl font-black tracking-tight text-[#0F5C4C]">FLOVA</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#16181D]">
          Set New Password
        </h1>
        <p className="mt-0.5 text-xs text-[#7A7468]">
          Choose a strong password to secure your account and gig runway data.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-5 px-5 sm:px-8 rounded-2xl border border-[#E5E2DC] shadow-md">
          {error && (
            <div
              role="alert"
              className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 leading-snug font-medium"
            >
              {error}
            </div>
          )}

          {isCheckingSession ? (
            <div className="text-center py-6 text-xs text-[#7A7468]">
              Verifying recovery link...
            </div>
          ) : isInvalidToken ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-xl text-amber-700">
                ⚠️
              </div>
              <p className="text-xs text-[#5A554A]">
                Recovery links can only be used once and expire after 1 hour.
              </p>
              <div className="pt-2">
                <Link
                  to="/forgot-password"
                  className="block w-full py-2.5 px-4 rounded-xl bg-[#0F5C4C] hover:bg-[#0c4a3d] text-white text-xs font-bold tracking-wide shadow-sm transition-all text-center"
                >
                  Request a New Recovery Link
                </Link>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-xl text-[#0F5C4C]">
                ✓
              </div>
              <h2 className="text-sm font-bold text-[#16181D]">Password Updated!</h2>
              <p className="text-xs text-[#5A554A]">
                Your password has been changed securely. Please sign in with your new password.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/login", { replace: true })}
                  className="block w-full py-2.5 px-4 rounded-xl bg-[#0F5C4C] hover:bg-[#0c4a3d] text-white text-xs font-bold tracking-wide shadow-sm transition-all cursor-pointer"
                >
                  Sign In Now
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#5A554A] mb-1"
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="At least 8 characters"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-xs text-[#16181D] placeholder:text-[#9A9488] focus:outline-none focus:border-[#0F5C4C] focus:ring-1 focus:ring-[#0F5C4C]/20 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#5A554A] mb-1"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-xs text-[#16181D] placeholder:text-[#9A9488] focus:outline-none focus:border-[#0F5C4C] focus:ring-1 focus:ring-[#0F5C4C]/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0F5C4C] hover:bg-[#0c4a3d] text-white text-xs font-bold tracking-wide shadow-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          )}

          <div className="mt-4 pt-3 border-t border-[#E5E2DC] text-center">
            <Link to="/login" className="text-xs text-[#7A7468] hover:text-[#0F5C4C]">
              ← Back to Sign In
            </Link>
          </div>
        </div>

        {!IS_NATIVE_APP && (
          <div className="text-center mt-3">
            <Link to="/" className="text-xs text-[#7A7468] hover:text-[#0F5C4C]">
              ← Return to FLOVA Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
