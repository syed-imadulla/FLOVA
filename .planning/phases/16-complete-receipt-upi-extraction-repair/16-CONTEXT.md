# Phase 16: Complete Receipt & UPI Extraction Repair — Context & Implementation Decisions

## Objective
Completely investigate, repair, and upgrade FLOVA's Receipt and UPI Screenshot extraction pipeline to eliminate the `Extraction Error: Edge Function returned a non-2xx status code` error, expand the file size limit to 20 MB with intelligent client-side downscaling and compression, guarantee accurate OCR of receipts and UPI screenshots (Google Pay, PhonePe, Paytm, CRED, BHIM), and ensure transparent user-guided confirmation without silent mutations.

---

## 1. Root Cause Analysis of Previous Failure
- **Primary Failure:** Groq decommissioned the preview vision models `llama-3.2-11b-vision-preview` and `llama-3.2-90b-vision-preview`. The Edge Function had hardcoded decommissioned and unreleased model names (`meta-llama/llama-4-maverick-...`), causing all candidate vision models to fail. The Edge Function returned HTTP 502 with Groq's `model_decommissioned` error payload, which Supabase Client surfaced in the UI as `Edge Function returned a non-2xx status code`.
- **Secondary Failure:** Files above 5MB were rejected by a static frontend check without client-side optimization or compression.
- **Active Groq Vision Architecture:** Groq currently serves `qwen/qwen3.8-27b` which possesses multimodal vision capabilities and requires images with dimension $\ge 32 \times 32$ pixels.

---

## 2. Locked Implementation Decisions

### 1. File Size & Client-Side Image Optimization
- **File Size Limit:** Accept images up to **20 MB per file**.
- **Supported Formats:** JPG, JPEG, PNG, WEBP.
- **Client-Side Optimization (`imageOptimizer.ts`):** High-resolution photos from modern smartphone cameras (10MB–20MB) are loaded into an in-memory Canvas, resized to a maximum bounding dimension of 1920px (preserving aspect ratio and orientation), and compressed to JPEG/WEBP with 0.85 quality.
- **Efficiency & Reliability:** Downscaled images are typically 300KB–800KB, staying safely below Deno/Cloudflare request body limits (6MB–10MB) while maintaining crisp OCR text legibility.
- **Original File Preservation:** The original File object is preserved for user preview, retake, and image reference.

### 2. Edge Function Model Management (`extract-receipt`)
- **Model Hierarchy:**
  1. Priority: `qwen/qwen3.8-27b` (verified active multimodal vision model on Groq).
  2. Dynamic Discovery: Filter models from `https://api.groq.com/openai/v1/models` matching `/vision|vl|qwen.*27b|qwen.*32b|qwen.*72b/i`.
  3. Text Fallback: If no vision model is accessible, process extracted text via `openai/gpt-oss-120b` or `openai/gpt-oss-20b`.
- **Detailed Error Reporting:** Return structured JSON error bodies `{ error: string, code: string, recoverable: boolean }` with HTTP status codes and CORS headers so the frontend can display actionable guidance rather than a generic non-2xx message.

### 3. Receipt & Line Item Extraction Invariants
- **Fields Extracted:** Merchant name, receipt/invoice number, date, time, subtotal, tax/GST, discount, final payable amount, payment method, reference ID, and line items (`name`, `quantity`, `price`, `total`).
- **Arithmetic Reconciliation:** Deterministically verify `subtotal + tax - discount == final_amount`. If a discrepancy is detected (e.g. rounded bill or unlisted surcharge), populate `arithmeticDiscrepancy` warning rather than silently fabricating numbers.
- **Anti-Hallucination:** Strictly prohibit mistaking GSTIN (15-character alphanumeric), 10-digit phone numbers, or invoice numbers for financial amounts.
- **Date Fallback Rule:** If date is not clearly printed, preserve `extractedDate = null`, default `date` to today's local date (`todayLocalISO()`), set `dateFallback = true`, and notify the user on review.

### 4. UPI Screenshot Extraction Invariants
- **Apps Supported:** Google Pay, PhonePe, Paytm, CRED, BHIM, and general UPI.
- **Fields Extracted:** Amount, transaction timestamp, sender/receiver, UPI ID, 12-digit UTR/reference number, and transaction status.
- **Status Classification:**
  - `successful`: Green checkmark / Paid / Completed.
  - `pending`: Amber notice warning user that funds are processing.
  - `failed`: Red notice preventing accidental booking of uncompleted payments.
  - `unknown`: Explicit review notice.
- **Duplicate Detection:** Preserve `checkDuplicateUpiReference(upiReference)` check against existing transactions.

### 5. Multi-Step User Experience (`CatchScreen.tsx`)
- Progress stages:
  1. `preparing`: Preparing and optimizing image
  2. `analysing`: Analysing receipt / UPI payment with AI
  3. `validating`: Validating extracted financial details
  4. `ready`: Ready for review
- Friendly error handling with "Retry extraction" and "Enter details manually" buttons.
- Full review in `/add` before saving. No unconfirmed database writes.
