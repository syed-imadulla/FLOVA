import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toPaiseOrNull } from "../lib/money";
import { parseOptionalRupees } from "../profile/parseRupees";
import { useProfile } from "../profile/useProfile";
import {
  type AppLanguage,
  type IncomeVariability,
  type PayoutPattern,
  type WorkProfile,
} from "../types/contracts";

interface WorkProfileOption {
  key: WorkProfile;
  label: string;
  description: string;
  icon: string;
  workSpendHint: string;
}

const WORK_PROFILE_OPTIONS: WorkProfileOption[] = [
  {
    key: "delivery",
    label: "Delivery Partner",
    description: "Food, grocery & parcel couriers (Swiggy, Zomato, Blinkit, Zepto)",
    icon: "🛵",
    workSpendHint: "Petrol, vehicle servicing, mobile data, platform equipment",
  },
  {
    key: "driver",
    label: "Cab / Auto Driver",
    description: "Rideshare, auto-rickshaw & commercial transport (Uber, Ola, Rapido)",
    icon: "🛺",
    workSpendHint: "Fuel/CNG, vehicle repairs, toll, parking, phone plan",
  },
  {
    key: "service",
    label: "Field & Home Service",
    description: "Electricians, plumbers, AC repair, home salon (Urban Company, local)",
    icon: "🔧",
    workSpendHint: "Tools, consumables, commute fare, spare parts, phone",
  },
  {
    key: "freelancer",
    label: "Freelancer / Consultant",
    description: "Designers, developers, content creators, accountants & gig professionals",
    icon: "💻",
    workSpendHint: "Software subscriptions, internet, electronics, workspace costs",
  },
  {
    key: "small_vendor",
    label: "Small Vendor / Shopkeeper",
    description: "Kirana stores, street carts, tea stalls, local market vendors",
    icon: "🏪",
    workSpendHint: "Inventory replenishment, transport, cart maintenance, packaging",
  },
  {
    key: "independent_business",
    label: "Trade & Independent Business",
    description: "Contractors, workshops, tailoring, micro-manufacturing, trade agencies",
    icon: "📦",
    workSpendHint: "Raw materials, workshop supplies, transport, tool upkeep",
  },
  {
    key: "daily_wage",
    label: "Daily-Wage Worker",
    description: "Construction labor, site helpers, painters, loading & unloading workers",
    icon: "🔨",
    workSpendHint: "Hand tools, safety gear, work commute, site meals",
  },
  {
    key: "seasonal_worker",
    label: "Seasonal / Agricultural",
    description: "Harvest hands, crop aggregators, seasonal trade workers, festival vendors",
    icon: "🌾",
    workSpendHint: "Seed/fertilizer, equipment hire, regional transport, storage",
  },
  {
    key: "other",
    label: "Other Irregular Earner",
    description: "Any other occupation with flexible or variable income streams",
    icon: "💼",
    workSpendHint: "Work travel, essential tools, supplies, phone & connectivity",
  },
];

const INCOME_VARIABILITY_OPTIONS: { key: IncomeVariability; label: string; desc: string }[] = [
  { key: "regular", label: "Predictable Cycles", desc: "Steady amounts on fixed weekly or monthly intervals" },
  { key: "variable", label: "Variable Earnings", desc: "Earnings fluctuate week to week based on hours or demand" },
  { key: "unpredictable", label: "Unpredictable Sums", desc: "Irregular dates and widely fluctuating amounts" },
  { key: "seasonal", label: "Seasonal Peaks", desc: "High earning busy seasons followed by lean months" },
  { key: "intermittent", label: "Intermittent / Project", desc: "Spikes of work separated by dry or search periods" },
];

export function OnboardingPage() {
  const { profile, save, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [workProfile, setWorkProfile] = useState<WorkProfile>("other");
  const [payoutPattern, setPayoutPattern] = useState<PayoutPattern>("weekly");
  const [incomeVariability, setIncomeVariability] = useState<IncomeVariability>("variable");
  const [handlesCod, setHandlesCod] = useState(false);
  const [safeBuffer, setSafeBuffer] = useState("");
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
      if (profile.income_variability) setIncomeVariability(profile.income_variability);
      if (typeof profile.handles_cod === "boolean") setHandlesCod(profile.handles_cod);
      if (profile.preferred_language) setLanguage(profile.preferred_language);

      const livingPaise = toPaiseOrNull(profile.daily_living_estimate);
      if (livingPaise !== null) {
        setDailyLiving(String(livingPaise / 100));
      }

      const workPaise = toPaiseOrNull(profile.daily_work_estimate);
      if (workPaise !== null) {
        setDailyWork(String(workPaise / 100));
      }

      const bufferPaise = toPaiseOrNull(profile.safe_runway_buffer);
      if (bufferPaise !== null) {
        setSafeBuffer(String(bufferPaise / 100));
      }
    }
  }, [profile]);

  // Selected work profile metadata
  const currentProfileMeta = WORK_PROFILE_OPTIONS.find((o) => o.key === workProfile) || WORK_PROFILE_OPTIONS[8];

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

    const bufferResult = parseOptionalRupees(safeBuffer);
    if (!bufferResult.ok) {
      setError(`Safe runway buffer: ${bufferResult.message}`);
      return;
    }

    setIsSaving(true);
    try {
      await save({
        display_name: displayName.trim() || null,
        work_profile: workProfile,
        payout_pattern: payoutPattern,
        income_variability: incomeVariability,
        handles_cod: handlesCod,
        safe_runway_buffer: bufferResult.paise,
        preferred_language: language,
        daily_living_estimate: livingResult.paise,
        daily_work_estimate: workResult.paise,
        onboarding_completed: true,
      });
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }

  if (profileLoading && !profile) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading your profile…</div>;
  }

  return (
    <div style={{ padding: "2rem 1rem", maxWidth: "680px", margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "2rem" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", color: "#0F5C4C" }}>
          Personalized Runway Setup
        </span>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#16181D", margin: "0.25rem 0 0.5rem" }}>
          {profile?.onboarding_completed ? "Update Work Profile" : "Tell FLOVA how you earn"}
        </h1>
        <p style={{ color: "#5A554A", fontSize: "0.95rem", lineHeight: "1.5", margin: 0 }}>
          FLOVA is built for India&apos;s irregular and flexible earners. We never assume a fixed salary or force you into a delivery profile.
        </p>
      </div>

      {error && (
        <div role="alert" style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "0.75rem 1rem", borderRadius: "0.75rem", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* 1. Display Name */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="display-name" style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#5A554A", marginBottom: "0.35rem" }}>
            Your Name (optional)
          </label>
          <input
            id="display-name"
            type="text"
            maxLength={80}
            placeholder="e.g. Ramesh, Sunita, Ravi"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isSaving}
            style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "1rem", borderRadius: "0.75rem", border: "1px solid #D5D0C5", background: "#FCFBF8", boxSizing: "border-box" }}
          />
        </div>

        {/* 2. Work Profile (9 explicit options) */}
        <fieldset style={{ marginBottom: "1.75rem", border: "1px solid #E5E2DC", borderRadius: "1rem", padding: "1.25rem", background: "#FFFFFF" }}>
          <legend style={{ fontWeight: "800", fontSize: "0.9rem", color: "#16181D", padding: "0 0.5rem" }}>
            What best describes your work? *
          </legend>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem", marginTop: "0.5rem" }}>
            {WORK_PROFILE_OPTIONS.map((opt) => {
              const isSelected = workProfile === opt.key;
              return (
                <label
                  key={opt.key}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "0.85rem",
                    borderRadius: "0.75rem",
                    border: isSelected ? "2px solid #0F5C4C" : "1px solid #E5E2DC",
                    background: isSelected ? "#F0FDF4" : "#FCFBF8",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <input
                    type="radio"
                    name="work-profile"
                    value={opt.key}
                    checked={isSelected}
                    onChange={() => {
                      setWorkProfile(opt.key);
                      // Auto-enable COD recommendation for delivery partners, optional for others
                      if (opt.key === "delivery") setHandlesCod(true);
                    }}
                    disabled={isSaving}
                    style={{ marginTop: "0.2rem" }}
                  />
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "0.9rem", color: isSelected ? "#0F5C4C" : "#16181D", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "0.2rem", lineHeight: "1.3" }}>
                      {opt.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* 3. Income Flow & Variability */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {/* Payout Pattern */}
          <div>
            <label htmlFor="payout-pattern" style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#5A554A", marginBottom: "0.35rem" }}>
              Payout / Settlement Schedule
            </label>
            <select
              id="payout-pattern"
              value={payoutPattern}
              onChange={(e) => setPayoutPattern(e.target.value as PayoutPattern)}
              disabled={isSaving}
              style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem", borderRadius: "0.75rem", border: "1px solid #D5D0C5", background: "#FCFBF8", minHeight: "48px" }}
            >
              <option value="daily">Daily Cash / Nightly UPI</option>
              <option value="weekly">Weekly Payout Cycle</option>
              <option value="per_job">Per Job / Instant Settlement</option>
              <option value="milestone">Milestone / Advance + Balance</option>
              <option value="variable">Variable / Whenever Paid</option>
            </select>
          </div>

          {/* Income Variability */}
          <div>
            <label htmlFor="income-variability" style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#5A554A", marginBottom: "0.35rem" }}>
              Income Stability &amp; Predictability
            </label>
            <select
              id="income-variability"
              value={incomeVariability}
              onChange={(e) => setIncomeVariability(e.target.value as IncomeVariability)}
              disabled={isSaving}
              style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem", borderRadius: "0.75rem", border: "1px solid #D5D0C5", background: "#FCFBF8", minHeight: "48px" }}
            >
              {INCOME_VARIABILITY_OPTIONS.map((iv) => (
                <option key={iv.key} value={iv.key}>
                  {iv.label} — {iv.desc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Cash-on-Delivery (COD) Capability Toggle */}
        <div style={{ marginBottom: "1.5rem", padding: "1rem", background: handlesCod ? "#F0FDF4" : "#FAF7F2", border: `1px solid ${handlesCod ? "#86EFAC" : "#E5E2DC"}`, borderRadius: "1rem" }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={handlesCod}
              onChange={(e) => setHandlesCod(e.target.checked)}
              disabled={isSaving}
              style={{ marginTop: "0.25rem", width: "18px", height: "18px" }}
            />
            <div>
              <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "#16181D" }}>
                I collect Cash-on-Delivery (COD) from customers
              </div>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#5A554A", lineHeight: "1.4" }}>
                When enabled, FLOVA isolates third-party cash into a separate custodial bucket (not_mine) so customer money never inflates your personal runway or gets accidentally spent.
              </p>
            </div>
          </label>
        </div>

        {/* 5. Essential Daily Baseline Expenses */}
        <div style={{ marginBottom: "1.5rem", padding: "1.25rem", border: "1px solid #E5E2DC", borderRadius: "1rem", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: "800", color: "#16181D", margin: "0 0 0.25rem" }}>
            Estimated Daily Essential Outflows (Optional)
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#7A7468", margin: "0 0 1rem" }}>
            Helps calculate how many days your cash will last. Leaving these empty will display &quot;Not enough information&quot; rather than assuming ₹0.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            {/* Living Spend */}
            <div>
              <label htmlFor="daily-living" style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#16181D", marginBottom: "0.35rem" }}>
                Daily Living Spend (₹)
              </label>
              <input
                id="daily-living"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 250"
                value={dailyLiving}
                onChange={(e) => setDailyLiving(e.target.value)}
                disabled={isSaving}
                style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", borderRadius: "0.75rem", border: "1px solid #D5D0C5", background: "#FCFBF8", boxSizing: "border-box" }}
              />
              <small style={{ display: "block", color: "#7A7468", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                Universal personal: food, tea, groceries, household needs.
              </small>
            </div>

            {/* Work Spend */}
            <div>
              <label htmlFor="daily-work" style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#16181D", marginBottom: "0.35rem" }}>
                Daily Work Spend (₹)
              </label>
              <input
                id="daily-work"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 150"
                value={dailyWork}
                onChange={(e) => setDailyWork(e.target.value)}
                disabled={isSaving}
                style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", borderRadius: "0.75rem", border: "1px solid #D5D0C5", background: "#FCFBF8", boxSizing: "border-box" }}
              />
              <small style={{ display: "block", color: "#0F5C4C", fontSize: "0.75rem", marginTop: "0.25rem", fontWeight: "500" }}>
                {currentProfileMeta.label} work costs: {currentProfileMeta.workSpendHint}
              </small>
            </div>
          </div>
        </div>

        {/* 6. Emergency Runway Cushion Buffer */}
        <div style={{ marginBottom: "1.75rem" }}>
          <label htmlFor="safe-buffer" style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#5A554A", marginBottom: "0.35rem" }}>
            Safe Emergency Cushion Buffer (₹, optional)
          </label>
          <input
            id="safe-buffer"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 2000"
            value={safeBuffer}
            onChange={(e) => setSafeBuffer(e.target.value)}
            disabled={isSaving}
            style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "1rem", borderRadius: "0.75rem", border: "1px solid #D5D0C5", background: "#FCFBF8", boxSizing: "border-box" }}
          />
          <small style={{ display: "block", color: "#7A7468", fontSize: "0.75rem", marginTop: "0.25rem" }}>
            FLOVA protects this reserve before considering money safe for discretionary spending.
          </small>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSaving}
          style={{
            width: "100%",
            padding: "0.85rem",
            fontSize: "1rem",
            fontWeight: "800",
            color: "#FFFFFF",
            backgroundColor: "#0F5C4C",
            border: "none",
            borderRadius: "0.75rem",
            cursor: isSaving ? "not-allowed" : "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            transition: "background-color 0.15s ease",
          }}
        >
          {isSaving ? "Saving Your Setup..." : "Save Profile & Enter FLOVA"}
        </button>
      </form>
    </div>
  );
}
