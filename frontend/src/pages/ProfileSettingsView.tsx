import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { useProfile } from "../profile/useProfile";
import { signOut } from "../services/auth";
import { toPaiseOrNull } from "../lib/money";
import { parseOptionalRupees } from "../profile/parseRupees";
import {
  WORK_PROFILES,
  PAYOUT_PATTERNS,
  INCOME_VARIABILITIES,
  type WorkProfile,
  type PayoutPattern,
  type IncomeVariability,
  type AppLanguage,
} from "../types/contracts";
import { AppShell } from "../components/layout/AppShell";

const WORK_ICONS: Record<WorkProfile, string> = {
  delivery: "🛵",
  driver: "🛺",
  service: "🔧",
  freelancer: "💻",
  independent_business: "📦",
  small_vendor: "🏪",
  daily_wage: "🔨",
  seasonal_worker: "🌾",
  other: "💼",
};

export function ProfileSettingsView() {
  const { user } = useSession();
  const { profile, loading, error: loadError, save } = useProfile();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [workProfile, setWorkProfile] = useState<WorkProfile>("other");
  const [payoutPattern, setPayoutPattern] = useState<PayoutPattern>("weekly");
  const [incomeVariability, setIncomeVariability] = useState<IncomeVariability>("variable");
  const [handlesCod, setHandlesCod] = useState(false);
  const [safeBufferText, setSafeBufferText] = useState("");
  const [language, setLanguage] = useState<AppLanguage>("en");
  const [livingText, setLivingText] = useState("");
  const [workText, setWorkText] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setWorkProfile(profile.work_profile);
      setPayoutPattern(profile.payout_pattern);
      if (profile.income_variability) setIncomeVariability(profile.income_variability);
      if (typeof profile.handles_cod === "boolean") setHandlesCod(profile.handles_cod);
      setLanguage(profile.preferred_language);
      setLivingText(
        profile.daily_living_estimate !== null && profile.daily_living_estimate !== undefined
          ? String(toPaiseOrNull(profile.daily_living_estimate)! / 100)
          : ""
      );
      setWorkText(
        profile.daily_work_estimate !== null && profile.daily_work_estimate !== undefined
          ? String(toPaiseOrNull(profile.daily_work_estimate)! / 100)
          : ""
      );
      setSafeBufferText(
        profile.safe_runway_buffer !== null && profile.safe_runway_buffer !== undefined
          ? String(toPaiseOrNull(profile.safe_runway_buffer)! / 100)
          : ""
      );
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const livingRes = parseOptionalRupees(livingText);
    if (!livingRes.ok) {
      setError(`Daily living estimate: ${livingRes.message}`);
      return;
    }

    const workRes = parseOptionalRupees(workText);
    if (!workRes.ok) {
      setError(`Daily work estimate: ${workRes.message}`);
      return;
    }

    const bufferRes = parseOptionalRupees(safeBufferText);
    if (!bufferRes.ok) {
      setError(`Safe runway buffer: ${bufferRes.message}`);
      return;
    }

    setSaving(true);
    try {
      await save({
        display_name: displayName.trim() || null,
        work_profile: workProfile,
        payout_pattern: payoutPattern,
        income_variability: incomeVariability,
        handles_cod: handlesCod,
        safe_runway_buffer: bufferRes.paise,
        preferred_language: language,
        daily_living_estimate: livingRes.paise,
        daily_work_estimate: workRes.paise,
      });
      setSuccess("Profile settings updated cleanly!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign out");
      setSigningOut(false);
    }
  }

  return (
    <AppShell activeNav="profile">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E2DC]">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7A7468]">
              Account &amp; Work Persona
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#16181D]">
              Profile &amp; Settings
            </h1>
          </div>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-colors cursor-pointer"
          >
            {signingOut ? "Signing Out..." : "Sign Out"}
          </button>
        </div>

        {(error || loadError) && (
          <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 font-medium leading-relaxed">
            {error || loadError}
          </div>
        )}

        {success && (
          <div role="status" className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-bold">
            {success}
          </div>
        )}

        {/* Form Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E2DC] shadow-sm">
          {loading && !profile ? (
            <div className="py-8 text-center text-xs text-[#7A7468] animate-pulse">
              Loading your profile...
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Display Name */}
              <div>
                <label htmlFor="prof-name" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                  Display Name / Nickname
                </label>
                <input
                  id="prof-name"
                  type="text"
                  placeholder="e.g. Ramesh"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={saving}
                  className="w-full px-4 py-3 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] focus:outline-none focus:border-[#0F5C4C]"
                />
              </div>

              {/* Work Profile Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-2">
                  Work Persona (Adapts Presets &amp; Recommendations)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {WORK_PROFILES.map((wp) => {
                    const isSelected = workProfile === wp;
                    return (
                      <button
                        key={wp}
                        type="button"
                        onClick={() => setWorkProfile(wp)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50/80 border-[#0F5C4C] text-[#0F5C4C] font-bold shadow-xs"
                            : "bg-[#FCFBF8] border-[#D5D0C5] text-[#5A554A] hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-base mb-1">
                          {WORK_ICONS[wp] || "💼"}
                        </div>
                        <div className="text-xs font-bold capitalize">
                          {wp.replace("_", " ")}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payout Pattern & Income Variability */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prof-payout" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                    Settlement / Payout Schedule
                  </label>
                  <select
                    id="prof-payout"
                    value={payoutPattern}
                    onChange={(e) => setPayoutPattern(e.target.value as PayoutPattern)}
                    disabled={saving}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] capitalize focus:outline-none focus:border-[#0F5C4C]"
                  >
                    {PAYOUT_PATTERNS.map((pp) => (
                      <option key={pp} value={pp}>
                        {pp.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="prof-variability" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                    Income Stability &amp; Predictability
                  </label>
                  <select
                    id="prof-variability"
                    value={incomeVariability}
                    onChange={(e) => setIncomeVariability(e.target.value as IncomeVariability)}
                    disabled={saving}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] capitalize focus:outline-none focus:border-[#0F5C4C]"
                  >
                    {INCOME_VARIABILITIES.map((iv) => (
                      <option key={iv} value={iv}>
                        {iv.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* COD Capability Toggle */}
              <div className="p-4 rounded-2xl bg-[#FCFBF8] border border-[#D5D0C5]">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={handlesCod}
                    onChange={(e) => setHandlesCod(e.target.checked)}
                    disabled={saving}
                    className="w-4 h-4 rounded text-[#0F5C4C] focus:ring-[#0F5C4C]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#16181D]">
                      Handle Cash-on-Delivery (COD) from customers
                    </span>
                    <p className="text-[11px] text-[#7A7468] mt-0.5">
                      Customer cash is isolated as custodial liability (not_mine) so you never accidentally spend it.
                    </p>
                  </div>
                </label>
              </div>

              {/* Emergency Cushion Buffer */}
              <div>
                <label htmlFor="prof-buffer" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                  Emergency Runway Cushion Buffer (₹, optional)
                </label>
                <input
                  id="prof-buffer"
                  type="number"
                  step="any"
                  placeholder="e.g. 2000 (leave empty for zero buffer)"
                  value={safeBufferText}
                  onChange={(e) => setSafeBufferText(e.target.value)}
                  disabled={saving}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm font-mono tabular-nums text-[#16181D] focus:outline-none focus:border-[#0F5C4C]"
                />
              </div>

              {/* Language Selector */}
              <div>
                <label htmlFor="prof-lang" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                  Language / Script
                </label>
                <select
                  id="prof-lang"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as AppLanguage)}
                  disabled={saving}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] focus:outline-none focus:border-[#0F5C4C]"
                >
                  <option value="en">English (Official)</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="kn">Kannada (ಕನ್ನಡ)</option>
                </select>
              </div>

              {/* Daily Living & Work Estimates */}
              <div className="pt-4 border-t border-[#E5E2DC]">
                <h3 className="text-sm font-bold text-[#16181D] mb-1">
                  Daily Essential Baseline Outflows
                </h3>
                <p className="text-xs text-[#7A7468] mb-4">
                  Leaving these blank displays &quot;Not enough information yet&quot; instead of assuming zero expenses.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="est-living" className="block text-xs font-bold text-[#5A554A] mb-1">
                      Daily Living (Food, Chai, Home) ₹
                    </label>
                    <input
                      id="est-living"
                      type="number"
                      step="any"
                      placeholder="e.g. 250 (leave empty for unestimated)"
                      value={livingText}
                      onChange={(e) => setLivingText(e.target.value)}
                      disabled={saving}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm font-mono tabular-nums text-[#16181D] focus:outline-none focus:border-[#0F5C4C]"
                    />
                  </div>

                  <div>
                    <label htmlFor="est-work" className="block text-xs font-bold text-[#5A554A] mb-1">
                      Daily Work (Petrol, Maintenance, Phone) ₹
                    </label>
                    <input
                      id="est-work"
                      type="number"
                      step="any"
                      placeholder="e.g. 150 (leave empty for unestimated)"
                      value={workText}
                      onChange={(e) => setWorkText(e.target.value)}
                      disabled={saving}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm font-mono tabular-nums text-[#16181D] focus:outline-none focus:border-[#0F5C4C]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0F5C4C] hover:bg-[#0c4a3d] text-white text-sm font-bold tracking-wide shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {saving ? "Saving Profile..." : "Save Profile & Refresh Runway"}
              </button>
            </form>
          )}
        </div>

        {/* Security & RLS Assurance Notice */}
        <div className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#E5E2DC] text-xs text-[#7A7468] space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#16181D]">
            <span>🔒</span>
            <span>FLOVA Security &amp; Data Contract Guarantee</span>
          </div>
          <p>
            • Authenticated session: <code className="font-mono text-[11px] text-[#0F5C4C]">{user?.email}</code> (User ID is assigned by Postgres RLS; client never sends user_id).
          </p>
          <p>
            • No bank login: FLOVA never requests your banking passwords, ATM PINs, or UPI credentials.
          </p>
          <p>
            • No offline claims: Data mutations are saved directly to the database. All money is stored in integer paise.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
