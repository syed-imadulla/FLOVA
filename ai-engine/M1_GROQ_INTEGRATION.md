# FLOVA — M1 Groq Edge Function Integration Contract (Owner: M3 / AI Engine)

## 1. Overview & Ownership Boundaries

This document defines the specification for M1 to implement the backend Groq extraction service for FLOVA.

- **M1 Owns:**
  - Supabase Edge Function (`/functions/v1/extract-financial-intent`)
  - Server-side `GROQ_API_KEY` storage and security (never exposed to client browser)
  - Invoking Groq REST API (`https://api.groq.com/openai/v1/chat/completions`)
  - User session authentication check (Supabase JWT via `Authorization: Bearer <token>`)

- **M3 Owns:**
  - System prompt (`EXTRACTION_SYSTEM_PROMPT`)
  - Structured output schema (`EXTRACTION_RESPONSE_JSON_SCHEMA`)
  - Client-side validation & adapter layer (`validateExtractionOutput`, `adaptExtractedTransactions`)
  - Deterministic fallback mock responses (`MOCK_EXTRACTION_RESPONSES`)

- **M2/M4 Owns:**
  - Microphone recording & audio transcription (M4)
  - Review UI & confirmation flow (M2)

---

## 2. Edge Function Endpoint Specification

### Endpoint
`POST /functions/v1/extract-financial-intent`

### Request Headers
| Header | Value | Description |
|---|---|---|
| `Authorization` | `Bearer <user_jwt_token>` | Supabase user access token. |
| `Content-Type` | `application/json` | Standard JSON body. |

### Request Body (`ExtractFinancialIntentRequest`)
```typescript
export interface ExtractFinancialIntentRequest {
  /** The natural language statement or voice transcript text. */
  input_text: string;
  /** Origin medium of the utterance. */
  input_source: "text" | "voice_transcript" | "shared_receipt_text" | "shared_receipt_image";
  /** Optional active pending draft IDs in UI context (prevents invented correction IDs). */
  active_draft_ids?: string[];
  /** Client local date in YYYY-MM-DD format (defaults to current UTC date). */
  current_date?: string;
}
```

### Response Body (`ExtractFinancialIntentResponse`)
On success (HTTP 200):
Returns a valid `FinancialExtractionDTO` JSON object matching `EXTRACTION_RESPONSE_JSON_SCHEMA`.

On error (HTTP 4xx / 5xx):
```json
{
  "error": "Failed to extract financial intent",
  "details": "Explanation of failure (rate limit, invalid JSON, or auth error)"
}
```

---

## 3. Groq API Implementation Details for M1

When implementing the Supabase Edge Function:

1. **API URL:** `https://api.groq.com/openai/v1/chat/completions`
2. **Recommended Model:** `llama-3.3-70b-versatile` (or `llama3-70b-8192` / `mixtral-8x7b-32768`)
3. **Response Format:**
   ```json
   {
     "type": "json_object"
   }
   ```
4. **System Message:**
   Use the exact prompt defined in `frontend/src/engine/extractionPrompt.ts` (`EXTRACTION_SYSTEM_PROMPT`).
5. **Temperature:** `0.0` or `0.1` (deterministic extraction).
6. **Error Handling:**
   If Groq fails or returns unparseable text, return HTTP 502 with error details so frontend can trigger fallback or manual entry.

---

## 4. End-to-End Sequence Flow

```
[User speaks or types]
         ↓
  M4: Whisper Transcript / Text Input
         ↓
  M2: Call supabase.functions.invoke("extract-financial-intent", { body })
         ↓
  M1: Edge Function verifies JWT, calls Groq API with EXTRACTION_SYSTEM_PROMPT
         ↓
  M1: Groq returns structured JSON matching FinancialExtractionDTO
         ↓
  M2: Passes raw response to M3's validateExtractionOutput(rawResponse)
         ↓
  M3: Sanitizes enums, forces verification_status="receipt_reported", checks COD ownership
         ↓
  M2: Displays review card to user (Confirm / Edit)
         ↓
  M2: On confirm, calls M3's adaptExtractedTransactions(dto) → NewTransaction[]
         ↓
  M1: Persists to Supabase tables (addTransaction, etc.)
```
