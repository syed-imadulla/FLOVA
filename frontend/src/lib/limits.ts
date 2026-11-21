/**
 * Shared Application Transaction & Daily Estimate Limits.
 *
 * Current application limit: ₹10,00,000 (10 Lakh rupees) = 100,000,000 paise.
 *
 * IMPORTANT: This limit applies strictly to FLOVA's application-side validation
 * and user entry guardrails. It does not alter, override, or claim to increase
 * any bank's or UPI provider's actual transaction/transfer limits.
 */

export const MAX_TRANSACTION_LIMIT_RUPEES = 1_000_000; // ₹10,00,000 (10 Lakh)
export const MAX_TRANSACTION_LIMIT_PAISE = MAX_TRANSACTION_LIMIT_RUPEES * 100; // 100,000,000 paise

export const LIMIT_ERROR_MESSAGE = "Amount cannot exceed ₹10,00,000";
export const DAILY_ESTIMATE_LIMIT_ERROR_MESSAGE = "Daily estimate cannot exceed ₹10,00,000";
export const DAILY_AGGREGATE_LIMIT_ERROR_MESSAGE = "Daily transaction limit of ₹10,00,000 exceeded";
