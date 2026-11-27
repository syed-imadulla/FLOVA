// =====================================================================
// FLOVA Private Receipt Storage & Evidence Lifecycle (Sprint 4F)
// Manages user-scoped uploads to the private 'receipts' Supabase Storage
// bucket, short-lived signed URLs for viewing, and compensation cleanup
// if a database transaction save fails after upload.
// =====================================================================

import { supabase } from "../lib/supabase";
import { validateAndOptimizeImage } from "./imageOptimizer";

export const RECEIPTS_BUCKET = "receipts";
export const MAX_RECEIPT_STORAGE_BYTES = 5 * 1024 * 1024; // 5 MB bucket limit
export const MAX_RECEIPT_INPUT_BYTES = 20 * 1024 * 1024; // 20 MB pre-compression limit for images
export const SIGNED_URL_TTL_SECONDS = 120; // 2 minutes short-lived access

export const PERMITTED_RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export interface PreparedReceiptUpload {
  blob: Blob;
  mimeType: (typeof PERMITTED_RECEIPT_MIME_TYPES)[number];
  extension: "jpg" | "png" | "webp" | "pdf";
}

function normalizeMime(file: File): string {
  const raw = (file.type || "").toLowerCase();
  if (raw === "image/jpg") return "image/jpeg";
  if (raw) return raw;
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".pdf")) return "application/pdf";
  if (/\.(jpe?g)$/i.test(name)) return "image/jpeg";
  return "";
}

function extensionForMime(mime: string): "jpg" | "png" | "webp" | "pdf" {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "application/pdf") return "pdf";
  return "jpg";
}

function dataUrlToBlob(dataUrl: string, fallbackMime: string): Blob {
  const [header, b64] = dataUrl.split(",");
  const mimeMatch = header?.match(/data:([^;]+);/);
  const mime = mimeMatch?.[1] || fallbackMime;
  const binary = atob(b64 || "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export function validateReceiptFileMetadata(file: File): (typeof PERMITTED_RECEIPT_MIME_TYPES)[number] {
  if (!file) {
    throw new Error("No receipt file selected.");
  }
  const mime = normalizeMime(file);
  if (!PERMITTED_RECEIPT_MIME_TYPES.includes(mime as any)) {
    throw new Error("Unsupported receipt format. Please use JPG, PNG, WEBP, or PDF.");
  }
  if (mime === "application/pdf" && file.size > MAX_RECEIPT_STORAGE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`PDF size (${sizeMb} MB) exceeds the 5 MB receipt limit.`);
  }
  if (file.size > MAX_RECEIPT_INPUT_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`File size (${sizeMb} MB) exceeds the 20 MB limit.`);
  }
  return mime as (typeof PERMITTED_RECEIPT_MIME_TYPES)[number];
}

export async function prepareReceiptUpload(file: File): Promise<PreparedReceiptUpload> {
  const mime = validateReceiptFileMetadata(file);
  if (mime === "application/pdf") {
    return { blob: file, mimeType: "application/pdf", extension: "pdf" };
  }

  // Non-browser environment (e.g. Node unit tests): validate size and pass file directly
  if (typeof window === "undefined" || typeof document === "undefined") {
    if (file.size > MAX_RECEIPT_STORAGE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      throw new Error(`Image (${sizeMb} MB) exceeds the 5 MB receipt storage limit.`);
    }
    return {
      blob: file,
      mimeType: mime as "image/jpeg" | "image/png" | "image/webp",
      extension: extensionForMime(mime),
    };
  }

  const optimized = await validateAndOptimizeImage(file);
  const optMime = optimized.mimeType === "image/jpg" ? "image/jpeg" : optimized.mimeType;
  const finalMime = (PERMITTED_RECEIPT_MIME_TYPES.includes(optMime as any) ? optMime : mime) as
    | "image/jpeg"
    | "image/png"
    | "image/webp";

  const blob = optimized.dataUrl.startsWith("data:")
    ? dataUrlToBlob(optimized.dataUrl, finalMime)
    : file;

  if (blob.size > MAX_RECEIPT_STORAGE_BYTES) {
    const sizeMb = (blob.size / (1024 * 1024)).toFixed(1);
    throw new Error(`Compressed image (${sizeMb} MB) still exceeds the 5 MB receipt storage limit.`);
  }

  return {
    blob,
    mimeType: finalMime,
    extension: extensionForMime(finalMime),
  };
}

async function requireAuthenticatedUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) {
    throw new Error("Please sign in to access receipt storage.");
  }
  return data.user.id;
}

export function buildUserReceiptPath(userId: string, transactionId: string, extension: string): string {
  const cleanId = transactionId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!cleanId) throw new Error("Invalid transaction id for receipt path.");
  return `${userId}/${cleanId}.${extension}`;
}

export function assertUserOwnsReceiptPath(userId: string, receiptPath: string): void {
  if (!receiptPath || !receiptPath.startsWith(`${userId}/`) || receiptPath.includes("..")) {
    throw new Error("Access denied: receipt path does not belong to the signed-in user.");
  }
}

export async function uploadReceiptEvidence(file: File, transactionId: string): Promise<string> {
  const userId = await requireAuthenticatedUserId();
  const prepared = await prepareReceiptUpload(file);
  const path = buildUserReceiptPath(userId, transactionId, prepared.extension);

  const { error } = await supabase.storage.from(RECEIPTS_BUCKET).upload(path, prepared.blob, {
    contentType: prepared.mimeType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Receipt upload failed: ${error.message}`);
  }

  return path;
}

export async function deleteReceiptObjectQuietly(receiptPath: string | null | undefined): Promise<void> {
  if (!receiptPath) return;
  try {
    const userId = await requireAuthenticatedUserId();
    assertUserOwnsReceiptPath(userId, receiptPath);
    await supabase.storage.from(RECEIPTS_BUCKET).remove([receiptPath]);
  } catch {
    // Best-effort compensation cleanup
  }
}

export async function getReceiptSignedUrl(
  receiptPath: string,
  expiresInSeconds = SIGNED_URL_TTL_SECONDS
): Promise<string> {
  const userId = await requireAuthenticatedUserId();
  assertUserOwnsReceiptPath(userId, receiptPath);

  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(receiptPath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Receipt evidence is unavailable or has been removed.");
  }

  return data.signedUrl;
}

/**
 * Safely uploads receipt evidence first, then runs saveTransaction(receiptPath).
 * If saveTransaction fails, performs compensation cleanup to remove the uploaded
 * storage object so no orphaned receipt remains.
 */
export async function saveTransactionWithReceipt<T>(
  file: File,
  transactionId: string,
  saveTransaction: (receiptPath: string) => Promise<T>
): Promise<{ result: T; receiptPath: string }> {
  const receiptPath = await uploadReceiptEvidence(file, transactionId);
  try {
    const result = await saveTransaction(receiptPath);
    return { result, receiptPath };
  } catch (err) {
    await deleteReceiptObjectQuietly(receiptPath);
    throw err;
  }
}
