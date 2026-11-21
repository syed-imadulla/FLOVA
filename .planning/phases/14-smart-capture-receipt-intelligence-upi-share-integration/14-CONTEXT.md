# Phase 14 Context: Smart Capture, Receipt Intelligence & UPI Share Integration

## Phase Overview & Goals
Make FLOVA capable of capturing financial information from multiple heterogeneous sources:
1. Physical receipt photographs (detailed line items, taxes, discounts, date fallback rule).
2. UPI payment screenshots (status extraction: successful, pending, failed, unknown; 12-digit UTR/UPI reference ID, duplicate detection).
3. Mobile gallery, camera, and desktop file uploads (distinct "Take Photo" vs "Choose from Gallery" buttons, image preview, retry).
4. UPI Share-to-FLOVA integration (PWA `share_target` API in `manifest.webmanifest`, Service Worker handling of shared text, files, and URLs).
5. Pasted payment SMS / text.
6. Single unified review and confirmation path on `/add` preserving all Phase 1 financial integrity constraints (₹10L limits, candidate UUID stability, idempotent persistence).

---

## Technical Decisions & Architecture

### 1. Edge Function `extract-receipt` Enhancement
- Extend Groq extraction prompt to recognize both physical receipts and UPI screenshots.
- Extracted Schema:
  - `kind`: `'physical_receipt' | 'upi_screenshot' | 'payment_sms' | 'unknown'`
  - `merchant`: merchant or recipient name
  - `amount_rupees`: payable total amount (distinguished from subtotal, GST numbers, phone numbers, invoice IDs)
  - `date`: transaction date in YYYY-MM-DD format (if legible)
  - `time`: transaction time in HH:MM format (if present)
  - `items`: array of line items `{ name, quantity, price }` (for receipts)
  - `subtotal`: subtotal amount if present
  - `tax`: taxes / GST amount if present
  - `discount`: discounts applied if present
  - `payment_method`: 'upi', 'card', 'cash', 'netbanking', etc.
  - `upi_reference`: 12-digit UTR or provider transaction reference ID
  - `payment_status`: `'successful' | 'pending' | 'failed' | 'unknown'`
  - `upi_app`: 'google_pay', 'phonepe', 'paytm', 'cred', 'bhim', 'other', or null
  - `possible_totals`: number[] (if multiple amounts appear ambiguous)
  - `confidence`: number 0..1
  - `missing_fields`: string[]

### 2. Date Fallback Invariant
- **Rule 1:** If transaction date is clearly identifiable on receipt/screenshot, extract it (`extractedDate`).
- **Rule 2:** If not reliably identifiable, set `extractedDate = null`, use `scannedAt = todayLocalISO()`, flag `dateFallback = true`.
- **Rule 3:** Never hallucinate or assume model date. Clearly show fallback status to user on review screen.

### 3. Payment Status & Duplicate Guardrails
- **Successful:** Suggested as confirmed transaction candidate.
- **Pending:** Flagged with warning: "Payment is pending and has not yet completed. Do not record as completed expense until settled."
- **Failed:** Flagged with error: "This payment failed. It cannot be recorded as an expense." Confirmation disabled unless user manually edits.
- **Duplicate Detection:** Service checks existing transactions for matching UPI reference / UTR ID; flags duplicate import warning with existing transaction ID.

### 4. PWA Web Share Target
- Update `frontend/public/manifest.webmanifest` with `share_target`:
  - `action`: `/share-target`
  - `method`: `POST`
  - `enctype`: `multipart/form-data`
  - `params`: `title`, `text`, `url`, `files: [{ name: "media", accept: ["image/*"] }]`
- Update `frontend/public/sw.js` to intercept POST `/share-target`, stash files/text in cache or client communication, and route to `/catch?shared=1`.
- Add client-side share receiver in `CatchScreen.tsx` to handle shared images, texts, or URLs.

### 5. Camera vs Gallery Separation
- Separate input triggers:
  - `Take Photo`: `<input type="file" accept="image/*" capture="environment">`
  - `Choose from Gallery`: `<input type="file" accept="image/*">` (no capture attribute)
- Supports desktop file dropping, camera retake, image clearing.
