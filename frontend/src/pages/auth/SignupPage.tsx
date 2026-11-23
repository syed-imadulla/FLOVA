import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSession, signUp } from "../../services/auth";
import { IS_NATIVE_APP } from "../../native/platform";

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await signUp(email, password, displayName.trim() || undefined);
      if (!user) {
        throw new Error("Sign-up failed: No user returned");
      }
      const session = await getSession();
      if (!session) {
        setNotice("Check your email to confirm, then log in.");
      } else {
        navigate("/onboarding", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
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
          Create your FLOVA account
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#7A7468]">
          Predictable paychecks &amp; rainy-day cash protection for gig partners.
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

          {notice && (
            <div
              role="status"
              className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed font-medium"
            >
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="signup-name" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                Your Name
              </label>
              <input
                id="signup-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isSubmitting}
                placeholder="Ravi Kumar"
                className="w-full px-4 py-3 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] placeholder:text-[#9A9488] focus:outline-none focus:border-[#0F5C4C] focus:ring-2 focus:ring-[#0F5C4C]/20 transition-all"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                placeholder="ravi@swiggy.in"
                className="w-full px-4 py-3 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] placeholder:text-[#9A9488] focus:outline-none focus:border-[#0F5C4C] focus:ring-2 focus:ring-[#0F5C4C]/20 transition-all"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                Password (min 6 characters)
              </label>
              <input
                id="signup-password"
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
              {isSubmitting ? "Creating Account..." : "Create Account & Start Runway"}
            </button>
          </form>

          {/* Privacy & Bank Free Security Assurance */}
          <div className="mt-6 pt-6 border-t border-[#E5E2DC] text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0F5C4C] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-3">
              <span>🛡️</span>
              <span>No bank login or UPI PINs required</span>
            </div>
            <p className="text-xs text-[#7A7468]">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-[#0F5C4C] hover:underline">
                Sign In
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
