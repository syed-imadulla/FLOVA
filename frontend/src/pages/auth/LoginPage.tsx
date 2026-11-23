import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signIn } from "../../services/auth";
import { IS_NATIVE_APP } from "../../native/platform";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/app";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#16181D] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group focus:outline-none">
          <img src="/favicon.svg" alt="FLOVA" className="w-11 h-11 rounded-xl object-contain shadow-xs group-hover:scale-105 transition-transform" />
          <span className="text-2xl font-black tracking-tight text-[#0F5C4C]">FLOVA</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#16181D]">
          Sign in to your account
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#7A7468]">
          Manage your gig earnings, runway, and cash buffers safely.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-[#E5E2DC] shadow-lg">
          {error && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed font-medium"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                placeholder="rider@partner.com"
                className="w-full px-4 py-3 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] placeholder:text-[#9A9488] focus:outline-none focus:border-[#0F5C4C] focus:ring-2 focus:ring-[#0F5C4C]/20 transition-all"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] placeholder:text-[#9A9488] focus:outline-none focus:border-[#0F5C4C] focus:ring-2 focus:ring-[#0F5C4C]/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-[#0F5C4C] hover:bg-[#0c4a3d] text-white text-sm font-bold tracking-wide shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? "Signing In..." : "Sign In to Runway"}
            </button>
          </form>

          {/* Privacy & Bank Free Security Assurance */}
          <div className="mt-6 pt-6 border-t border-[#E5E2DC] text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0F5C4C] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-3">
              <span>🔒</span>
              <span>No bank passwords or UPI PINs needed</span>
            </div>
            <p className="text-xs text-[#7A7468]">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="font-bold text-[#0F5C4C] hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {!IS_NATIVE_APP && (
          <div className="text-center mt-6">
            <Link to="/" className="text-xs text-[#7A7468] hover:text-[#0F5C4C]">
              ← Return to FLOVA Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
