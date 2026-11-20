import { toPaise } from "../lib/money";

export type ParseRupeesResult =
  | { ok: true; paise: number | null }
  | { ok: false; message: string };

const MAX_DAILY_PAISE = 100_000 * 100; // ₹1,00,000 per day = 10,000,000 paise

export function parseOptionalRupees(text: string | null | undefined): ParseRupeesResult {
  if (text === null || text === undefined) {
    return { ok: true, paise: null };
  }
  const trimmed = text.trim();
  if (trimmed === "") {
    return { ok: true, paise: null };
  }

  // Reject negative amounts
  if (trimmed.startsWith("-")) {
    return { ok: false, message: "Amount cannot be negative" };
  }

  // Check valid decimal representation: digits with optional . and up to 2 decimal places
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    if (/^\d+\.\d{3,}$/.test(trimmed)) {
      return { ok: false, message: "Cannot have more than 2 decimal places" };
    }
    return { ok: false, message: "Please enter a valid number" };
  }

  try {
    const paise = toPaise(trimmed);
    if (paise < 0) {
      return { ok: false, message: "Amount cannot be negative" };
    }
    if (paise > MAX_DAILY_PAISE) {
      return { ok: false, message: "Daily estimate cannot exceed ₹1,00,000" };
    }
    return { ok: true, paise };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Invalid amount" };
  }
}
