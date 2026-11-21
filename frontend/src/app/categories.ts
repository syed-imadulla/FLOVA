// Shared category vocabulary for every capture screen (manual, voice, receipt).
// Occupation-neutral: works for delivery, driving, freelance, trades, vendors and daily wage.
import type { ExpenseType, TransactionType } from "../types/contracts";

export interface CategoryOption {
  value: string;
  label: string;
  /** Suggested living/work classification. Only a suggestion: the user still has to confirm it. */
  suggests?: ExpenseType;
}

export const INCOME_CATEGORIES: CategoryOption[] = [
  { value: "earnings", label: "Work earnings" },
  { value: "client_payment", label: "Client payment" },
  { value: "platform_payout", label: "Platform payout" },
  { value: "sales", label: "Shop / stall sales" },
  { value: "daily_wage", label: "Daily wage" },
  { value: "tips", label: "Tips & incentives" },
  { value: "other", label: "Other income" },
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

export function categoriesFor(type: TransactionType): CategoryOption[] {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function categoryLabel(value: string | null | undefined): string {
  if (!value) return "Other";
  const hit = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].find((c) => c.value === value);
  if (hit) return hit.label;
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}
