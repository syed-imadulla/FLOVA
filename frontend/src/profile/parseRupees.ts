import { toPaise } from "../lib/money";
import {
  DAILY_ESTIMATE_LIMIT_ERROR_MESSAGE,
  MAX_TRANSACTION_LIMIT_PAISE,
} from "../lib/limits";

export type ParseRupeesResult =
  | { ok: true; paise: number | null }
  | { ok: false; message: string };

export type ParseRequiredRupeesResult =
  | { ok: true; paise: number }
  | { ok: false; message: string };

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
    if (paise > MAX_TRANSACTION_LIMIT_PAISE) {
      return { ok: false, message: DAILY_ESTIMATE_LIMIT_ERROR_MESSAGE };
    }
    return { ok: true, paise };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Invalid amount" };
  }
}

export function parseRequiredRupees(text: string | null | undefined): ParseRequiredRupeesResult {
  if (text === null || text === undefined || text.trim() === "") {
    return { ok: false, message: "Enter an amount" };
  }

  const res = parseOptionalRupees(text);
  if (!res.ok) {
    return res;
  }

  if (res.paise === null || res.paise <= 0) {
    return { ok: false, message: "Amount must be greater than 0" };
  }

  return { ok: true, paise: res.paise };
}
