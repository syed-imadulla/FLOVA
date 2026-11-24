import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signIn } from "../../services/auth";
import { signInWithGoogle } from "../../services/socialAuth";
import { resolvePostLoginDestination } from "../../services/postLoginRouting";
import { IS_NATIVE_APP } from "../../native/platform";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      const destination = await resolvePostLoginDestination(from);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      const destination = await resolvePostLoginDestination(from);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google");
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh h-dvh bg-[#FAF7F2] text-[#16181D] flex flex-col justify-center px-4 sm:px-6 lg:px-8 overflow-hidden overscroll-none select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-3">
        <Link to="/" className="inline-flex items-center gap-2 mb-1 group focus:outline-none">
          <img src="/favicon.svg" alt="FLOVA" className="w-8 h-8 rounded-xl object-contain shadow-xs group-hover:scale-105 transition-transform" />
          <span className="text-xl font-black tracking-tight text-[#0F5C4C]">FLOVA</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#16181D]">
          Sign in to your account
        </h1>
        <p className="mt-0.5 text-xs text-[#7A7468]">
          Manage your gig earnings, runway, and cash buffers safely.
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

          {/* Primary Action: Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || isGoogleSubmitting}
            className="w-full py-2.5 px-4 rounded-xl border border-[#D5D0C5] bg-white hover:bg-[#F9F8F6] text-[#16181D] text-sm font-bold tracking-wide shadow-xs transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isGoogleSubmitting ? "Connecting..." : "Continue with Google"}</span>
          </button>

          {/* Social Sign-in Divider */}
          <div className="relative my-3.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E2DC]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-white px-2.5 text-[#7A7468] font-bold">Or with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="login-email" className="block text-[11px] font-bold uppercase tracking-wider text-[#5A554A] mb-1">
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
                className="w-full px-3 py-2 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-xs text-[#16181D] placeholder:text-[#9A9488] focus:outline-none focus:border-[#0F5C4C] focus:ring-1 focus:ring-[#0F5C4C]/20 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="block text-[11px] font-bold uppercase tracking-wider text-[#5A554A]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-medium text-[#0F5C4C] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-xs text-[#16181D] placeholder:text-[#9A9488] focus:outline-none focus:border-[#0F5C4C] focus:ring-1 focus:ring-[#0F5C4C]/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0F5C4C] hover:bg-[#0c4a3d] text-white text-xs font-bold tracking-wide shadow-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? "Signing In..." : "Sign In to Runway"}
            </button>
          </form>

          {/* Privacy & Link Footer */}
          <div className="mt-4 pt-3 border-t border-[#E5E2DC] text-center">
            <div className="inline-flex items-center gap-1 text-[10px] font-medium text-[#0F5C4C] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mb-2">
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
