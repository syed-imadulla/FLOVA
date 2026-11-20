import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toPaiseOrNull } from "../lib/money";
import { parseOptionalRupees } from "../profile/parseRupees";
import { useProfile } from "../profile/useProfile";
import type { AppLanguage, PayoutPattern, WorkProfile } from "../types/contracts";

export function OnboardingPage() {
  const { profile, save, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [workProfile, setWorkProfile] = useState<WorkProfile>("delivery");
  const [payoutPattern, setPayoutPattern] = useState<PayoutPattern>("weekly");
  const [language, setLanguage] = useState<AppLanguage>("en");
  const [dailyLiving, setDailyLiving] = useState("");
  const [dailyWork, setDailyWork] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill fields from profile when available
  useEffect(() => {
    if (profile) {
      if (profile.display_name) setDisplayName(profile.display_name);
      if (profile.work_profile) setWorkProfile(profile.work_profile);
      if (profile.payout_pattern) setPayoutPattern(profile.payout_pattern);
      if (profile.preferred_language) setLanguage(profile.preferred_language);

      const livingPaise = toPaiseOrNull(profile.daily_living_estimate);
      if (livingPaise !== null) {
        setDailyLiving(String(livingPaise / 100));
      }

      const workPaise = toPaiseOrNull(profile.daily_work_estimate);
      if (workPaise !== null) {
        setDailyWork(String(workPaise / 100));
      }
    }
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate rupees fields
    const livingResult = parseOptionalRupees(dailyLiving);
    if (!livingResult.ok) {
      setError(`Daily living spend: ${livingResult.message}`);
      return;
    }

    const workResult = parseOptionalRupees(dailyWork);
    if (!workResult.ok) {
      setError(`Daily work spend: ${workResult.message}`);
      return;
    }

    setIsSaving(true);
    try {
      await save({
        display_name: displayName.trim() || null,
        work_profile: workProfile,
        payout_pattern: payoutPattern,
        preferred_language: language,
        daily_living_estimate: livingResult.paise,
        daily_work_estimate: workResult.paise,
        onboarding_completed: true,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }

  if (profileLoading && !profile) {
    return <div style={{ padding: "2rem" }}>Loading profile…</div>;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "540px", margin: "0 auto" }}>
      <h1>{profile?.onboarding_completed ? "Edit Profile" : "Profile Setup"}</h1>
      <p style={{ color: "#555" }}>
        Tell us a bit about your work to tailor your runway planner.
      </p>

      {error && (
        <div role="alert" style={{ color: "red", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Display Name */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label htmlFor="display-name" style={{ display: "block", marginBottom: "0.25rem" }}>
            Display Name (optional)
          </label>
          <input
            id="display-name"
            type="text"
            maxLength={80}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isSaving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>

        {/* Work Type (Radio group) */}
        <fieldset style={{ marginBottom: "1.25rem", border: "1px solid #ccc", padding: "1rem" }}>
          <legend style={{ fontWeight: "bold" }}>Work type</legend>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="radio"
                name="work-profile"
                value="delivery"
                checked={workProfile === "delivery"}
                onChange={() => setWorkProfile("delivery")}
                disabled={isSaving}
              />
              Delivery / platform worker
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#888" }}>
              <input type="radio" name="work-profile" value="driver" disabled />
              Driver (coming soon)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#888" }}>
              <input type="radio" name="work-profile" value="home_service" disabled />
              Home-service (coming soon)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#888" }}>
              <input type="radio" name="work-profile" value="freelancer" disabled />
              Freelancer (coming soon)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#888" }}>
              <input type="radio" name="work-profile" value="small_business" disabled />
              Small business (coming soon)
            </label>
          </div>
        </fieldset>

        {/* Payout Pattern */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label htmlFor="payout-pattern" style={{ display: "block", marginBottom: "0.25rem" }}>
            How you get paid
          </label>
          <select
            id="payout-pattern"
            value={payoutPattern}
            onChange={(e) => setPayoutPattern(e.target.value as PayoutPattern)}
            disabled={isSaving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", minHeight: "48px" }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="per_job">Per job</option>
            <option value="milestone">Milestone</option>
            <option value="variable">Variable</option>
          </select>
        </div>

        {/* Preferred Language */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label htmlFor="language" style={{ display: "block", marginBottom: "0.25rem" }}>
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as AppLanguage)}
            disabled={isSaving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", minHeight: "48px" }}
          >
            <option value="en">English</option>
            <option value="kn" disabled>Kannada (coming soon)</option>
            <option value="hi" disabled>Hindi (coming soon)</option>
          </select>
        </div>

        {/* Daily living spend */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label htmlFor="daily-living" style={{ display: "block", marginBottom: "0.25rem" }}>
            Daily living spend, e.g. food (₹, optional)
          </label>
          <input
            id="daily-living"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 200"
            value={dailyLiving}
            onChange={(e) => setDailyLiving(e.target.value)}
            disabled={isSaving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
          <small style={{ display: "block", color: "#666", marginTop: "0.25rem" }}>
            Leave blank if you're not sure; we'll show 'not enough information' instead of guessing.
          </small>
        </div>

        {/* Daily work spend */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="daily-work" style={{ display: "block", marginBottom: "0.25rem" }}>
            Daily work spend, e.g. fuel, phone (₹, optional)
          </label>
          <input
            id="daily-work"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 100"
            value={dailyWork}
            onChange={(e) => setDailyWork(e.target.value)}
            disabled={isSaving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
          <small style={{ display: "block", color: "#666", marginTop: "0.25rem" }}>
            Leave blank if you're not sure; we'll show 'not enough information' instead of guessing.
          </small>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", minHeight: "48px", cursor: isSaving ? "not-allowed" : "pointer" }}
        >
          {isSaving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}
