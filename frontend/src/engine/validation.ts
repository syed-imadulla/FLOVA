// =====================================================================
// FLOVA Financial Engine — Input & Monetary Validation (M3)
// Strictly pure TypeScript: no React, Supabase, DOM, fetch or Gemini.
// =====================================================================

import type {
  ISODate,
  ISOTimestamp,
  Paise,
  RunwayInput,
} from "../types/contracts";
import { PAYOUT_STATUSES } from "../types/contracts";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates that a value is a valid non-negative integer representing paise.
 */
export function isValidPaise(value: unknown): value is Paise {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

/**
 * Validates that an arithmetic operation does not overflow JS safe integer limits.
 */
export function safeAdd(a: Paise, b: Paise): Paise {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) {
    throw new RangeError(`Operands must be safe integers: ${a}, ${b}`);
  }
  const sum = a + b;
  if (!Number.isSafeInteger(sum)) {
    throw new RangeError(`Integer overflow in addition: ${a} + ${b} exceeds safe limit`);
  }
  return sum;
}

/**
 * Validates subtraction without unsafe integer precision loss.
 * Note: Returned value may be negative (representing debt/shortfall).
 */
export function safeSub(a: number, b: number): number {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) {
    throw new RangeError(`Operands must be safe integers: ${a}, ${b}`);
  }
  const diff = a - b;
  if (!Number.isSafeInteger(diff)) {
    throw new RangeError(`Integer overflow in subtraction: ${a} - ${b} exceeds safe limit`);
  }
  return diff;
}

/**
 * Validates strictly formatted ISO calendar date (YYYY-MM-DD) with calendar correctness.
 */
export function isValidISODate(dateStr: unknown): dateStr is ISODate {
  if (typeof dateStr !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Validates an ISO 8601 timestamp string.
 */
export function isValidISOTimestamp(tsStr: unknown): tsStr is ISOTimestamp {
  if (typeof tsStr !== "string" || tsStr.trim() === "") return false;
  const parsed = Date.parse(tsStr);
  return !Number.isNaN(parsed);
}

/**
 * Validates balance check-in fields.
 */
export function validateBalanceCheckin(
  checkin: RunwayInput["latestCheckin"]
): ValidationResult {
  const errors: string[] = [];
  if (!checkin) {
    return { valid: false, errors: ["Missing balance check-in record"] };
  }

  if (!isValidPaise(checkin.cash)) {
    errors.push(`Invalid cash amount: ${checkin.cash}. Must be a non-negative integer paise.`);
  }
  if (!isValidPaise(checkin.bank)) {
    errors.push(`Invalid bank amount: ${checkin.bank}. Must be a non-negative integer paise.`);
  }
  if (!isValidPaise(checkin.notMine)) {
    errors.push(`Invalid notMine amount: ${checkin.notMine}. Must be a non-negative integer paise.`);
  }
  if (!isValidISOTimestamp(checkin.checkedAt)) {
    errors.push(`Invalid checkedAt timestamp: ${checkin.checkedAt}.`);
  }

  if (isValidPaise(checkin.cash) && isValidPaise(checkin.bank) && isValidPaise(checkin.notMine)) {
    const totalLiquid = checkin.cash + checkin.bank;
    if (checkin.notMine > totalLiquid) {
      errors.push(
        `Contradictory check-in: not_mine amount (${checkin.notMine} paise) exceeds total liquid holdings (${totalLiquid} paise).`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates an individual transaction row for engine consumption.
 */
export function validateTransaction(
  tx: RunwayInput["transactionsSinceCheckin"][number]
): ValidationResult {
  const errors: string[] = [];
  if (!tx.id || typeof tx.id !== "string") {
    errors.push("Transaction missing valid ID.");
  }
  if (tx.type !== "income" && tx.type !== "expense") {
    errors.push(`Invalid transaction type: ${(tx as { type?: unknown }).type}. Expected 'income' or 'expense'.`);
  }
  if (!isValidPaise(tx.amount) || tx.amount <= 0) {
    errors.push(`Transaction amount must be a positive integer paise. Received: ${tx.amount}.`);
  }
  if (tx.ownership !== "mine" && tx.ownership !== "not_mine") {
    errors.push(`Invalid ownership: ${(tx as { ownership?: unknown }).ownership}. Expected 'mine' or 'not_mine'.`);
  }
  if (tx.type === "expense" && tx.ownership === "mine" && tx.expenseType !== "living" && tx.expenseType !== "work") {
    errors.push(`Personal expenses must specify expenseType ('living' or 'work'). Received: ${tx.expenseType}.`);
  }
  if (!isValidISODate(tx.date)) {
    errors.push(`Invalid transaction date: ${tx.date}. Expected YYYY-MM-DD.`);
  }
  if (!isValidISOTimestamp(tx.createdAt)) {
    errors.push(`Invalid transaction createdAt timestamp: ${tx.createdAt}.`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates payout record structure and status consistency.
 */
export function validatePayout(
  p: RunwayInput["payouts"][number]
): ValidationResult {
  const errors: string[] = [];
  if (!p || typeof p !== "object") {
    return { valid: false, errors: ["Payout must be an object."] };
  }
  if (!p.id || typeof p.id !== "string") {
    errors.push("Payout missing valid ID.");
  }
  if (!isValidPaise(p.expected)) {
    errors.push(`Payout ${p.id} has invalid expected amount: ${p.expected}.`);
  }
  if (!isValidPaise(p.received)) {
    errors.push(`Payout ${p.id} has invalid received amount: ${p.received}.`);
  }
  if (isValidPaise(p.expected) && isValidPaise(p.received) && p.received > p.expected) {
    errors.push(`Payout ${p.id} received amount (${p.received}) exceeds expected amount (${p.expected}).`);
  }
  if (!PAYOUT_STATUSES.includes(p.status)) {
    errors.push(`Payout ${p.id} has invalid status: ${p.status}.`);
  }
  if (p.expectedDate !== null && !isValidISODate(p.expectedDate)) {
    errors.push(`Payout ${p.id} has invalid expectedDate: ${p.expectedDate}.`);
  }

  // Contract consistency checks:
  // If status is scheduled, estimated, or unearned, received amount must be 0
  if (
    (p.status === "scheduled" || p.status === "estimated" || p.status === "unearned") &&
    isValidPaise(p.received) &&
    p.received > 0
  ) {
    errors.push(
      `Payout ${p.id} has status '${p.status}' but non-zero received amount (${p.received} paise). Expected status 'partial' or 'settled'.`
    );
  }

  // If status is settled, received amount must match or exceed expected amount
  if (
    p.status === "settled" &&
    isValidPaise(p.expected) &&
    isValidPaise(p.received) &&
    p.received < p.expected
  ) {
    errors.push(
      `Payout ${p.id} has status 'settled' but received amount (${p.received} paise) is less than expected (${p.expected} paise).`
    );
  }

  // If status is partial, received amount must be strictly between 0 and expected
  if (
    p.status === "partial" &&
    isValidPaise(p.expected) &&
    isValidPaise(p.received) &&
    (p.received <= 0 || p.received >= p.expected)
  ) {
    errors.push(
      `Payout ${p.id} has status 'partial' but received amount (${p.received} paise) is not between 0 and expected (${p.expected} paise).`
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates the complete RunwayInput structure.
 */
export function validateRunwayInput(input: RunwayInput): ValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return { valid: false, errors: ["RunwayInput must be an object."] };
  }

  // Profile validation
  if (!input.profile) {
    errors.push("Missing profile in RunwayInput.");
  } else {
    if (input.profile.dailyLivingEstimate !== null && !isValidPaise(input.profile.dailyLivingEstimate)) {
      errors.push(`Invalid dailyLivingEstimate: ${input.profile.dailyLivingEstimate}. Must be non-negative integer paise or null.`);
    }
    if (input.profile.dailyWorkEstimate !== null && !isValidPaise(input.profile.dailyWorkEstimate)) {
      errors.push(`Invalid dailyWorkEstimate: ${input.profile.dailyWorkEstimate}. Must be non-negative integer paise or null.`);
    }
  }

  // Check-in validation if present
  if (input.latestCheckin) {
    const checkinRes = validateBalanceCheckin(input.latestCheckin);
    if (!checkinRes.valid) errors.push(...checkinRes.errors);
  }

  // Transactions validation
  if (!Array.isArray(input.transactionsSinceCheckin)) {
    errors.push("transactionsSinceCheckin must be an array.");
  } else {
    for (const [index, tx] of input.transactionsSinceCheckin.entries()) {
      const txRes = validateTransaction(tx);
      if (!txRes.valid) {
        errors.push(`Transaction at index ${index} invalid: ${txRes.errors.join("; ")}`);
      }
    }
  }

  // Payouts validation
  if (!Array.isArray(input.payouts)) {
    errors.push("payouts must be an array.");
  } else {
    for (const p of input.payouts) {
      const pRes = validatePayout(p);
      if (!pRes.valid) {
        errors.push(...pRes.errors);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
