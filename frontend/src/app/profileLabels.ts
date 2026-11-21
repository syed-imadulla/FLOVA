import type { IncomeVariability, PayoutPattern, WorkProfile } from "../types/contracts";

// Occupation describes the work; it does not change how money is calculated.
export const WORK_LABELS: Record<WorkProfile, { label: string; icon: string }> = {
  delivery: { label: "Delivery", icon: "🛵" },
  driver: { label: "Ride & taxi", icon: "🚕" },
  service: { label: "Field & service work", icon: "🔧" },
  freelancer: { label: "Freelancer", icon: "💻" },
  independent_business: { label: "Independent business", icon: "📦" },
  small_vendor: { label: "Small vendor / shop", icon: "🏪" },
  daily_wage: { label: "Construction & daily wage", icon: "🔨" },
  seasonal_worker: { label: "Farm & seasonal work", icon: "🌾" },
  other: { label: "Other work", icon: "💼" },
};

// How income behaves, kept separate from when it's paid.
export const VARIABILITY_LABELS: Record<IncomeVariability, string> = {
  regular: "About the same every time",
  variable: "Changes from week to week",
  unpredictable: "Hard to predict",
  seasonal: "Depends on the season",
  intermittent: "Comes and goes",
};

// When payments usually arrive.
export const PAYOUT_LABELS: Record<PayoutPattern, string> = {
  daily: "Every day",
  weekly: "Every week",
  per_job: "After each job",
  milestone: "At project milestones",
  variable: "No fixed schedule",
};
