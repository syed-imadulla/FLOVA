import { paiseToRupeeString, toPaiseOrNull } from "../lib/money";

/** Paise -> editable rupee text without trailing ".00" (15000 -> "150", 15050 -> "150.50"). Null stays "". */
export function paiseToInput(p: number | null | undefined): string {
  if (p === null || p === undefined || !Number.isSafeInteger(p) || p <= 0) return "";
  return p % 100 === 0 ? String(p / 100) : String(paiseToRupeeString(p));
}

/** Decimal rupee string from the AI ("2500", "120.50") -> editable text, or "" when missing/invalid. */
export function rupeeStringToInput(s: string | null | undefined): string {
  try {
    return paiseToInput(toPaiseOrNull(s ?? null));
  } catch {
    return "";
  }
}
