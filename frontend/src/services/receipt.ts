// =====================================================================
// FLOVA Receipt Extraction Service (Owner: M1)
// Connects frontend to the secure Supabase Edge Function: extract-receipt.
// Never exposes GROQ_API_KEY in client code.
// =====================================================================

import { supabase } from "../lib/supabase";
import type { ExtractedReceiptCandidate } from "../types/contracts";

export interface ExtractReceiptInput {
  file?: File;
  text?: string;
}

export interface ExtractReceiptResult {
  candidate: ExtractedReceiptCandidate;
  rawText?: string;
}

/**
 * Converts a File object to a base64 Data URL string.
 */
export async function fileToBase64(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size exceeds 5MB limit. Please upload a smaller image.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read image as base64 string."));
      }
    };
    reader.onerror = () => reject(reader.error || new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Invokes the secure Supabase Edge Function to extract structured receipt suggestions.
 * Strictly read-only: does NOT insert transactions into the database.
 */
export async function extractReceipt(input: ExtractReceiptInput): Promise<ExtractedReceiptCandidate> {
  let imageBase64: string | undefined = undefined;
  let mimeType: string | undefined = undefined;

  if (input.file) {
    imageBase64 = await fileToBase64(input.file);
    mimeType = input.file.type || "image/jpeg";
  }

  const text = input.text?.trim() || undefined;

  if (!imageBase64 && !text) {
    throw new Error("Please select an image or enter receipt text to extract.");
  }

  const { data, error } = await supabase.functions.invoke<{
    candidate: ExtractedReceiptCandidate;
    rawText?: string;
    error?: string;
  }>("extract-receipt", {
    body: { imageBase64, mimeType, text },
  });

  if (error) {
    throw new Error(`Receipt extraction service error: ${error.message}`);
  }

  if (!data || !data.candidate) {
    throw new Error(data?.error || "Receipt extraction returned no structured candidate.");
  }

  const candidate = data.candidate;

  // Ensure a persistent client UUID is assigned for idempotency
  if (!candidate.id) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      candidate.id = crypto.randomUUID();
    } else {
      candidate.id = "cand-" + Math.random().toString(36).slice(2, 11);
    }
  }

  return candidate;
}
