import React, { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../../services/auth";
import { IS_NATIVE_APP } from "../../native/platform";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await requestPasswordReset(email);
      setSuccessMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request password reset.");
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
          Reset your password
        </h1>
        <p className="mt-0.5 text-xs text-[#7A7468]">
          Enter your registered email address to receive a secure recovery link.
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

          {successMessage ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-xl text-[#0F5C4C]">
                ✉️
              </div>
              <div className="text-xs text-[#2A261F] leading-relaxed bg-[#FCFBF8] p-3 rounded-xl border border-[#E5E2DC]">
                {successMessage}
              </div>
              <p className="text-[11px] text-[#7A7468]">
                Links expire after 1 hour. If you do not see the email, check your spam or junk folder.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="block w-full py-2.5 px-4 rounded-xl bg-[#0F5C4C] hover:bg-[#0c4a3d] text-white text-xs font-bold tracking-wide shadow-sm transition-all text-center"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#5A554A] mb-1"
                >
                  Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="rider@partner.com"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-xs text-[#16181D] placeholder:text-[#9A9488] focus:outline-none focus:border-[#0F5C4C] focus:ring-1 focus:ring-[#0F5C4C]/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0F5C4C] hover:bg-[#0c4a3d] text-white text-xs font-bold tracking-wide shadow-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? "Sending Recovery Link..." : "Send Recovery Link"}
              </button>
            </form>
          )}

          <div className="mt-4 pt-3 border-t border-[#E5E2DC] text-center">
            <p className="text-xs text-[#7A7468]">
              Remember your password?{" "}
              <Link to="/login" className="font-bold text-[#0F5C4C] hover:underline">
                Sign In
              </Link>
            </p>
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
