// Decimal-safe money helpers. The database stores numeric(12,2) rupees;
// the app and engine work in integer paise. No floating-point currency maths.
import type { Paise, RupeeString } from "../types/contracts";

/** "4500.00" | "4500.5" | 4500.5 -> 450050 paise. Parses the decimal text exactly (no float multiply). */
export function toPaise(value: RupeeString | number | null | undefined): Paise {
  if (value === null || value === undefined || value === "") return 0;
  const text = typeof value === "number" ? value.toFixed(2) : value.trim();
  const m = /^(-)?(\d+)(?:\.(\d{0,2})\d*)?$/.exec(text);
  if (!m) throw new Error(`Invalid money value: ${value}`);
  const [, sign, rupees, frac = ""] = m;
  const paise = Number(rupees) * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(paise)) throw new Error(`Money value out of range: ${value}`);
  return sign ? -paise : paise;
}

/**
 * Strict variant for amounts that came from a person: rejects more than 2 decimal places
 * instead of silently truncating them ("5000.001500" must not become ₹5,000).
 */
export function toPaiseStrict(value: RupeeString): Paise {
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error(`Invalid amount: ${value}. Use at most 2 decimal places.`);
  return toPaise(text);
}

/** Nullable variant: keeps "not provided" as null instead of 0. */
export function toPaiseOrNull(value: RupeeString | number | null | undefined): Paise | null {
  return value === null || value === undefined || value === "" ? null : toPaise(value);
}

/**
 * Validates and normalizes integer paise directly from bigint-paise DB columns
 * (e.g. peer_debts.total_amount_paise, debt_settlements.amount_paise).
 * Never multiplies by 100.
 */
export function assertPaise(value: unknown): Paise {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new Error(`Paise must be a safe integer: ${value}`);
    return value;
  }
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    if (!Number.isSafeInteger(parsed)) throw new Error(`Paise integer out of safe range: ${value}`);
    return parsed;
  }
  throw new Error(`Invalid integer paise value: ${String(value)}`);
}

/** 450050 -> "4500.50" (what Supabase accepts for numeric columns). */
export function paiseToRupeeString(paise: Paise): RupeeString {
  if (!Number.isSafeInteger(paise)) throw new Error(`Paise must be an integer: ${paise}`);
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** 393000 -> "₹3,930" ; -117000 -> "−₹1,170" (Indian digit grouping, paise shown only when non-zero). */
export function formatINR(paise: Paise): string {
  const sign = paise < 0 ? "−" : "";
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100).toLocaleString("en-IN");
  const rem = abs % 100;
  return `${sign}₹${rupees}${rem ? "." + String(rem).padStart(2, "0") : ""}`;
}
