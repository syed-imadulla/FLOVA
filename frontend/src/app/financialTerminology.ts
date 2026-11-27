// =====================================================================
// FLOVA 2.0 | Shared Financial Terminology & Formatting Helpers (Sprint 6B)
// Ensures consistent, unambiguous labels and rupee formatting across
// HomeScreen, InsightsScreen, MoneyScreen, and WishScreen.
// =====================================================================

import { formatINR } from "../lib/money";
import type { Paise } from "../types/contracts";

export interface FinancialTermDefinition {
  label: string;
  shortDescription: string;
}

export const FINANCIAL_TERMS = {
  confirmedCash: {
    label: "Confirmed Cash",
    shortDescription:
      "Money currently available in recorded accounts (cash and bank minus funds held for others).",
  },
  safeToSpend: {
    label: "Safe-to-Spend",
    shortDescription:
      "Amount available to spend after applicable safety cushion protection, liabilities, and upcoming commitments.",
  },
  sustainableCapital: {
    label: "Sustainable Capital",
    shortDescription:
      "Confirmed cash after outstanding liabilities and your safety cushion.",
  },
  safetyCushion: {
    label: "Safety Cushion",
    shortDescription:
      "Protected emergency buffer kept separate from daily spending.",
  },
  receivables: {
    label: "Receivables",
    shortDescription:
      "Money others owe you; kept separate and never counted as available cash.",
  },
  earnedIncome: {
    label: "Earned Income",
    shortDescription:
      "Income from work, salary, freelance, or business (excludes gifts and family support).",
  },
  nonEarnedInflow: {
    label: "Non-Earned Inflows",
    shortDescription:
      "Cash received from family support, gifts, pocket money, or donations.",
  },
} as const satisfies Record<string, FinancialTermDefinition>;

export type FinancialTermKey = keyof typeof FINANCIAL_TERMS;

/**
 * Formats integer paise in INR, returning an explicit unavailable marker ("—")
 * when the value is null or undefined so missing data is never shown as ₹0.
 */
export function formatFinancialAmount(
  paise: Paise | null | undefined,
  unavailablePlaceholder = "—"
): string {
  if (paise === null || paise === undefined) return unavailablePlaceholder;
  if (!Number.isSafeInteger(paise)) return unavailablePlaceholder;
  return formatINR(paise);
}
