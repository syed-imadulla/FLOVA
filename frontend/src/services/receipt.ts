// =====================================================================
// FLOVA Receipt & UPI Screenshot Extraction Service (Owner: M1 / Phase 16)
// Connects frontend to the secure Supabase Edge Function: extract-receipt.
// Features: 20 MB image validation, client downscaling & compression,
// detailed progress callbacks, resilient error decoding, mandatory date
// fallback rules, duplicate reference detection, offline heuristic parser.
// Strictly read-only inference: never mutates database tables.
// =====================================================================

import { supabase } from "../lib/supabase";
import { todayLocalISO } from "../data/dates";
import type { ExtractedReceiptCandidate } from "../types/contracts";
import { validateAndOptimizeImage } from "./imageOptimizer";

export type ExtractionStage = "preparing" | "analysing" | "validating" | "ready";

export interface ExtractReceiptInput {
  file?: File;
  text?: string;
  onProgress?: (stage: ExtractionStage, percent?: number) => void;
}

export interface ExtractReceiptResult {
  candidate: ExtractedReceiptCandidate;
  rawText?: string;
}

/**
 * Converts a File object to an optimized base64 Data URL string.
 * Supports files up to 20 MB with client-side downscaling.
 */
export async function fileToBase64(file: File): Promise<string> {
  const result = await validateAndOptimizeImage(file);
  return result.dataUrl;
}

/**
 * Checks existing transactions to see if a transaction with the same UPI reference ID already exists.
 * Returns the existing transaction ID if found, otherwise null.
 */
export async function checkDuplicateUpiReference(upiReference: string): Promise<string | null> {
  if (!upiReference || upiReference.trim().length < 6) return null;
  const refClean = upiReference.trim();

  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, description")
      .ilike("description", `%${refClean}%`)
      .limit(1);

    if (!error && data && data.length > 0) {
      return data[0].id;
    }
  } catch {
    // If offline or network error, skip duplicate check
  }
  return null;
}

/**
 * Offline / client-side heuristic fallback for parsing payment SMS, UPI texts, or receipts
 * when the AI extraction service is unreachable.
 */
export function extractReceiptFallback(rawText: string): ExtractedReceiptCandidate {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Amount extraction (preferring explicit final payable / total amount over subtotal)
  let amountPaise: number | null = null;
  const totalMatch =
    text.match(/\b(?:final\s*total|total\s*payable|payable\s*amount|grand\s*total|net\s*amount|total\s*amount|total|paid|debited|sent)\b\s*[:=-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  const fallbackMatch =
    text.match(/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
  const amountMatch = totalMatch || fallbackMatch;

  if (amountMatch) {
    const cleanNum = parseFloat(amountMatch[1].replace(/,/g, ""));
    if (!isNaN(cleanNum) && cleanNum > 0 && cleanNum <= 1000000) {
      amountPaise = Math.round(cleanNum * 100);
    }
  }

  // 1b. Subtotal, Tax and Discount
  let subtotalPaise: number | null = null;
  const subMatch = text.match(/(?:subtotal|sub\s*total)\s*[:=-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (subMatch) {
    const s = parseFloat(subMatch[1].replace(/,/g, ""));
    if (!isNaN(s) && s > 0) subtotalPaise = Math.round(s * 100);
  }

  let taxPaise: number | null = null;
  const taxMatch = text.match(/(?:tax|gst|cgst|sgst|vat)\s*[:=-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (taxMatch) {
    const t = parseFloat(taxMatch[1].replace(/,/g, ""));
    if (!isNaN(t) && t > 0) taxPaise = Math.round(t * 100);
  }

  let discountPaise: number | null = null;
  const discMatch = text.match(/(?:discount|disc\.?|saved)\s*[:=-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (discMatch) {
    const d = parseFloat(discMatch[1].replace(/,/g, ""));
    if (!isNaN(d) && d > 0) discountPaise = Math.round(d * 100);
  }

  let arithmeticDiscrepancy: string | null = null;
  if (subtotalPaise !== null && amountPaise !== null) {
    const expected = (subtotalPaise || 0) + (taxPaise || 0) - (discountPaise || 0);
    if (Math.abs(expected - amountPaise) > 100) {
      arithmeticDiscrepancy = `Subtotal + Tax - Discount (₹${(expected / 100).toFixed(2)}) does not match final total (₹${(amountPaise / 100).toFixed(2)}).`;
    }
  }

  // 2. UPI Reference / UTR (typically 12 digits or alphanumeric txn ID)
  let upiReference: string | null = null;
  const refMatch =
    text.match(/(?:upi\s*ref(?:erence)?(?:\s*no\.?)?|utr(?:\s*no\.?)?|txn\s*id|transaction\s*id)[:\s]*([a-zA-Z0-9]{8,22})/i) ||
    text.match(/\b(\d{12})\b/);
  if (refMatch) {
    upiReference = refMatch[1];
  }

  // 3. Payment Status
  let paymentStatus: "successful" | "pending" | "failed" | "unknown" = "successful";
  if (/pending|processing|awaiting/i.test(lower)) {
    paymentStatus = "pending";
  } else if (/failed|declined|unsuccessful/i.test(lower)) {
    paymentStatus = "failed";
  } else if (!/paid|successful|completed|debited|sent|received/i.test(lower)) {
    paymentStatus = "unknown";
  }

  // 4. UPI App detection
  let upiApp: string | null = null;
  if (/google\s*pay|gpay/i.test(lower)) upiApp = "google_pay";
  else if (/phonepe/i.test(lower)) upiApp = "phonepe";
  else if (/paytm/i.test(lower)) upiApp = "paytm";
  else if (/cred/i.test(lower)) upiApp = "cred";
  else if (/bhim/i.test(lower)) upiApp = "bhim";

  // 5. Merchant / Recipient
  let merchant: string | null = null;
  const toMatch = text.match(/(?:to|at|paid to|sent to)[:\s]+([A-Za-z0-9\s&'-]{3,35})(?:\s+on|\s+for|\s+via|\.|\n|$)/i);
  if (toMatch) {
    merchant = toMatch[1].trim();
  }

  // 6. Date extraction with mandatory fallback rule
  let extractedDate: string | null = null;
  let dateFallback = false;
  const dateMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/) || text.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
  if (dateMatch) {
    if (dateMatch[1] && dateMatch[1].includes("-")) {
      extractedDate = dateMatch[1];
    } else if (dateMatch[2] && dateMatch[3]) {
      const d = dateMatch[1].padStart(2, "0");
      const m = dateMatch[2].padStart(2, "0");
      const y = dateMatch[3];
      extractedDate = `${y}-${m}-${d}`;
    }
  }

  const scannedAt = new Date().toISOString();
  let finalDate = extractedDate;
  if (!finalDate) {
    finalDate = todayLocalISO();
    dateFallback = true;
  }

  // 7. Category guessing
  let category = "other";
  let expenseType: "living" | "work" | null = null;
  if (/petrol|diesel|fuel|cng/i.test(lower)) {
    category = "fuel";
    expenseType = "work";
  } else if (/food|tea|chai|samosa|restaurant|swiggy|zomato/i.test(lower)) {
    category = "food";
    expenseType = "living";
  } else if (/kirana|grocery|groceries|supermarket/i.test(lower)) {
    category = "groceries";
    expenseType = "living";
  } else if (/recharge|airtel|jio|vi|mobile/i.test(lower)) {
    category = "phone";
    expenseType = "work";
  } else if (/repair|maintenance|bike\s*service/i.test(lower)) {
    category = "maintenance";
    expenseType = "work";
  }

  const missingFields: string[] = [];
  if (amountPaise === null) missingFields.push("amount");
  if (expenseType === null) missingFields.push("expenseType");

  const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : "cand-" + Math.random().toString(36).slice(2, 11);

  return {
    id,
    kind: upiReference || upiApp ? "upi_screenshot" : "payment_sms",
    merchant,
    amountPaise,
    subtotalPaise,
    taxPaise,
    discountPaise,
    arithmeticDiscrepancy,
    category,
    expenseType,
    date: finalDate,
    extractedDate,
    scannedAt,
    dateFallback,
    paymentStatus,
    upiReference,
    upiApp,
    description: merchant ? `${merchant} payment` : (upiReference ? `UPI Ref: ${upiReference}` : "Payment text"),
    needsReview: missingFields.length > 0 || paymentStatus !== "successful" || dateFallback || arithmeticDiscrepancy !== null,
    missingFields,
  };
}

/**
 * Invokes the secure Supabase Edge Function to extract structured receipt and UPI screenshot suggestions.
 * Strictly read-only: does NOT insert transactions into the database.
 * Enforces date fallback rules and duplicate UPI reference detection.
 */
export async function extractReceipt(input: ExtractReceiptInput): Promise<ExtractedReceiptCandidate> {
  const onProgress = input.onProgress;
  let imageBase64: string | undefined = undefined;
  let mimeType: string | undefined = undefined;

  if (input.file) {
    onProgress?.("preparing", 20);
    const optimized = await validateAndOptimizeImage(input.file);
    imageBase64 = optimized.dataUrl;
    mimeType = optimized.mimeType;
  }

  const text = input.text?.trim() || undefined;

  if (!imageBase64 && !text) {
    throw new Error("Please select an image or enter receipt text to extract.");
  }

  onProgress?.("analysing", 50);

  try {
    const { data, error } = await supabase.functions.invoke<{
      candidate: ExtractedReceiptCandidate;
      rawText?: string;
      error?: string;
      code?: string;
      recoverable?: boolean;
    }>("extract-receipt", {
      body: { imageBase64, mimeType, text },
    });

    if (error) {
      let detailMsg = error.message;
      // Extract detailed error context if available from Supabase JS client
      if ((error as any).context && typeof (error as any).context.json === "function") {
        try {
          const errBody = await (error as any).context.json();
          if (errBody?.error) {
            detailMsg = errBody.error;
          }
        } catch {
          // Keep default message
        }
      }
      throw new Error(detailMsg || "Failed to extract receipt");
    }

    if (!data || !data.candidate) {
      throw new Error(data?.error || "Receipt extraction returned no structured candidate.");
    }

    onProgress?.("validating", 85);

    const candidate = data.candidate;

    // Ensure a persistent client UUID is assigned for idempotency
    if (!candidate.id) {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        candidate.id = crypto.randomUUID();
      } else {
        candidate.id = "cand-" + Math.random().toString(36).slice(2, 11);
      }
    }

    // MANDATORY DATE FALLBACK INVARIANT:
    // 1. If document has a clear legible date, preserve it as extractedDate.
    // 2. If document lacks a legible date, fallback to today's local date and set dateFallback = true.
    // 3. Preserve scannedAt timestamp.
    candidate.scannedAt = new Date().toISOString();
    if (candidate.date && /^\d{4}-\d{2}-\d{2}$/.test(candidate.date)) {
      candidate.extractedDate = candidate.date;
      candidate.dateFallback = false;
    } else {
      candidate.extractedDate = null;
      candidate.date = todayLocalISO();
      candidate.dateFallback = true;
    }

    // DUPLICATE DETECTION:
    // If UPI reference is extracted, check whether an existing transaction already recorded it.
    if (candidate.upiReference) {
      const existingId = await checkDuplicateUpiReference(candidate.upiReference);
      if (existingId) {
        candidate.duplicateWarning = {
          existingTransactionId: existingId,
          reference: candidate.upiReference,
        };
        candidate.needsReview = true;
      }
    }

    onProgress?.("ready", 100);
    return candidate;
  } catch (err: any) {
    // If network failed completely (offline) and text was provided, fallback to offline heuristic
    const isNetworkOffline = typeof navigator !== "undefined" && navigator?.onLine === false;
    const isFetchFail = err?.name === "TypeError" && /fetch|network/i.test(err?.message || "");
    if (text && (isNetworkOffline || isFetchFail)) {
      console.warn("Network offline, using local heuristic text extraction:", err);
      const fallback = extractReceiptFallback(text);
      if (fallback.upiReference) {
        const existingId = await checkDuplicateUpiReference(fallback.upiReference);
        if (existingId) {
          fallback.duplicateWarning = {
            existingTransactionId: existingId,
            reference: fallback.upiReference,
          };
        }
      }
      onProgress?.("ready", 100);
      return fallback;
    }
    throw err;
  }
}
