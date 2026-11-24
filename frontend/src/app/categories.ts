// Shared category vocabulary for every capture screen (manual, voice, receipt).
// Occupation-neutral: works for delivery, driving, freelance, trades, vendors, service, and salaried/daily wage.
import type { ExpenseType, TransactionType, WorkProfile } from "../types/contracts";

export interface CategoryOption {
  value: string;
  label: string;
  /** Suggested living/work classification. Only a suggestion: the user still has to confirm it. */
  suggests?: ExpenseType;
}

export const INCOME_CATEGORIES: CategoryOption[] = [
  { value: "salary", label: "Salary" },
  { value: "freelance", label: "Freelance" },
  { value: "business_sales", label: "Business sales" },
  { value: "delivery_earnings", label: "Delivery earnings" },
  { value: "service_income", label: "Service income" },
  { value: "commission", label: "Commission" },
  { value: "tips", label: "Tips" },
  { value: "other", label: "Other income" },
  // Backwards-compatible legacy categories
  { value: "earnings", label: "Work earnings" },
  { value: "client_payment", label: "Client payment" },
  { value: "platform_payout", label: "Platform payout" },
  { value: "sales", label: "Shop / stall sales" },
  { value: "daily_wage", label: "Daily wage" },
];

export const EXPENSE_CATEGORIES: CategoryOption[] = [
  { value: "food", label: "Food", suggests: "living" },
  { value: "groceries", label: "Groceries", suggests: "living" },
  { value: "rent", label: "Rent & home", suggests: "living" },
  { value: "family", label: "Family", suggests: "living" },
  { value: "medical", label: "Medical", suggests: "living" },
  { value: "fuel", label: "Fuel", suggests: "work" },
  { value: "phone", label: "Phone & data", suggests: "work" },
  { value: "transport", label: "Transport", suggests: "work" },
  { value: "vehicle", label: "Vehicle repair", suggests: "work" },
  { value: "tools", label: "Tools & equipment", suggests: "work" },
  { value: "stock", label: "Stock & supplies", suggests: "work" },
  { value: "other", label: "Other expense" },
];

const PROFILE_INCOME_PRIORITY: Record<WorkProfile, string[]> = {
  delivery: ["delivery_earnings", "tips", "platform_payout", "earnings", "other"],
  driver: ["delivery_earnings", "tips", "platform_payout", "earnings", "other"],
  freelancer: ["freelance", "client_payment", "commission", "service_income", "salary", "other"],
  service: ["service_income", "freelance", "tips", "commission", "salary", "other"],
  independent_business: ["business_sales", "sales", "commission", "service_income", "other"],
  small_vendor: ["business_sales", "sales", "daily_wage", "commission", "other"],
  daily_wage: ["daily_wage", "tips", "earnings", "other"],
  seasonal_worker: ["daily_wage", "earnings", "business_sales", "tips", "other"],
  other: ["salary", "freelance", "business_sales", "delivery_earnings", "service_income", "commission", "tips", "other"],
};

export function categoriesFor(type: TransactionType, workProfile?: WorkProfile | null): CategoryOption[] {
  if (type === "expense") return EXPENSE_CATEGORIES;
  if (!workProfile || !PROFILE_INCOME_PRIORITY[workProfile]) return INCOME_CATEGORIES;

  const priority = PROFILE_INCOME_PRIORITY[workProfile];
  const prioritySet = new Set(priority);

  const prioritized = priority
    .map((val) => INCOME_CATEGORIES.find((c) => c.value === val))
    .filter((c): c is CategoryOption => !!c);

  const remaining = INCOME_CATEGORIES.filter((c) => !prioritySet.has(c.value));

  return [...prioritized, ...remaining];
}

export function categoryLabel(value: string | null | undefined, type?: TransactionType): string {
  if (!value) return type === "income" ? "Other income" : type === "expense" ? "Other expense" : "Other";
  if (type === "expense") {
    const hit = EXPENSE_CATEGORIES.find((c) => c.value === value);
    if (hit) return hit.label;
  } else if (type === "income") {
    const hit = INCOME_CATEGORIES.find((c) => c.value === value);
    if (hit) return hit.label;
  }
  if (value === "other") return "Other";
  const hit = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find((c) => c.value === value);
  if (hit) return hit.label;
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}
