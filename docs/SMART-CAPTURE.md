# FLOVA: Smart Capture & Receipt/UPI Intelligence

## 1. Overview
FLOVA Smart Capture enables gig workers and small business owners to record financial transactions by photographing physical paper receipts, uploading UPI payment screenshots (Google Pay, PhonePe, Paytm, CRED), or pasting SMS text.

---

## 2. Image Optimization & Size Handling (`imageOptimizer.ts`)

- **Maximum Allowed Payload:** 20 MB (20,971,520 bytes). Files over 20 MB are rejected client-side with an immediate, clear error message.
- **Allowed MIME Types:** `image/jpeg`, `image/jpg`, `image/png`, `image/webp`. HEIC and unsupported types are flagged.
- **Client Canvas Downscaling:**
  - High-resolution smartphone photos (e.g. 4000x3000px, 12 MB) are downscaled using HTML5 Canvas before network transmission.
  - Max Dimension: 1920px (preserving aspect ratio).
  - JPEG Compression: 0.85 quality factor.
  - Average reduced payload: ~300 KB – 800 KB, reducing edge function timeout risks and bandwidth consumption by over 80%.

---

## 3. Serverless Vision Pipeline (`extract-receipt`)

- **Deployed Edge Function:** `backend/supabase/functions/extract-receipt/index.ts` on Supabase project `msjzkylvafuwlkkujxpv`.
- **Primary Vision Model:** `qwen/qwen3.8-27b` (active Groq vision LLM).
- **Self-Healing Model Fallback:** Dynamically queries `https://api.groq.com/openai/v1/models` and filters by `/vision|vl|qwen.*27b/i`. If a model is deprecated or rate-limited, it automatically falls back to secondary vision candidates.

---

## 4. Structured Receipt Parsing & Arithmetic Reconciliation

The vision extractor returns an `ExtractedReceiptCandidate`:
- **Line Items:** Parsed description, unit price, quantity, total price.
- **Subtotal & Tax/Fees:** Verified independently.
- **Total Amount:** Compared against the sum of parsed line items.
- **Discrepancy Detection:** If `|calculatedSum - totalAmount| > 1.00`, a warning alert is presented in `/add`, prompting user verification without silently altering values.
- **Date Fallback:** If the printed date is illegible or missing, the system defaults to today's date in India (`Asia/Kolkata` time zone), flagging `date_fallback: true`.

---

## 5. UPI Screenshot Intelligence

- **Supported Screenshot Formats:** Compatible with standard payment confirmation screens from major UPI applications (including Google Pay, PhonePe, Paytm, CRED, and BHIM). All third-party names are trademarks of their respective owners and are referenced solely for technical format compatibility.
- **Status Classification:** `COMPLETED` (success), `PENDING` (processing), `FAILED` (declined). Only `COMPLETED` transactions suggest immediate expense creation; `FAILED` screenshots notify the user without creating expense records.
- **Duplicate UTR Reference Check:** The 12-digit UPI reference number / UTR is extracted. Before confirmation, `checkDuplicateUpiReference(utr)` checks existing transactions. If a match is found, an alert prevents duplicate debit recording.
