# FLOVA — M1 Edge Function Integration Contract (Owner: M3 / AI Engine)

## 1. Overview & Ownership Boundaries

This document defines the specification for M1 to implement the canonical extraction Edge Function for FLOVA.

- **M1 Owns:**
  - Supabase Edge Function (`/functions/v1/process-voice` as canonical voice + text endpoint)
  - Dedicated OCR Edge Function (`/functions/v1/extract-receipt` for receipt images)
  - Server-side `GROQ_API_KEY` storage and security (in `backend/supabase/functions/.env` / Supabase secrets, never exposed to client browser)
  - Invoking Groq REST API (`https://api.groq.com/openai/v1/chat/completions`)
  - Whisper transcription service for audio recordings
  - User session authentication check (Supabase JWT via `Authorization: Bearer <token>`)

- **M3 Owns:**
  - System prompt (`EXTRACTION_SYSTEM_PROMPT`)
  - Structured output schema (`EXTRACTION_RESPONSE_JSON_SCHEMA`)
  - Client-side validation & candidate adapter layer (`validateExtractionOutput`, `mapDtoToVoiceCandidates`, `mapDtoToReceiptCandidates`, `confirmCandidateTransaction`)
  - Deterministic fallback mock responses (`MOCK_EXTRACTION_RESPONSES`)

- **M4 Owns:**
  - Microphone recording & audio capture (`useVoiceRecorder`)

- **M2 Owns:**
  - Voice capture page, review UI, candidate confirmation flow, and error states

---

## 2. Canonical Edge Function Endpoint Specification: `process-voice`

### Endpoint
`POST /functions/v1/process-voice`

The canonical `process-voice` endpoint supports two distinct modes:

### Mode 1: Audio Input (Microphone Recording)
When the user records voice audio:
- **Request Format:** `multipart/form-data`
- **Fields:**
  - `audio`: Audio file/blob (e.g. `audio/webm`, `audio/mp4`, `audio/wav`)
  - `active_draft_ids` (optional): JSON array of string draft IDs
- **M1 Execution Pipeline:**
  1. Authenticate user via JWT.
  2. Invoke Whisper API to transcribe audio to text transcript.
  3. Invoke Groq API with M3's `EXTRACTION_SYSTEM_PROMPT` passing the transcript with `input_source: "voice_transcript"`.
  4. Return the structured `FinancialExtractionDTO`.

### Mode 2: Typed Text / Transcript Input (Direct Extraction)
When the user types text or submits an already-transcribed string:
- **Request Format:** `application/json`
- **Request Body:**
```typescript
export interface ProcessVoiceJsonRequest {
  /** The natural language statement or voice transcript text. */
  input_text: string;
  /** Origin medium of the utterance. */
  input_source: "text" | "voice_transcript";
  /** Optional active pending draft IDs in UI context (prevents invented correction IDs). */
  active_draft_ids?: string[];
  /** Client local date in YYYY-MM-DD format (for UI context; model dates remain null if unstated). */
  current_date?: string;
}
```
- **M1 Execution Pipeline:**
  1. Authenticate user via JWT.
  2. Skip Whisper; directly invoke Groq API with M3's `EXTRACTION_SYSTEM_PROMPT`.
  3. Return the structured `FinancialExtractionDTO`.

### Response Body
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

## 3. Dedicated Receipt Extraction Endpoint: `extract-receipt`

### Endpoint
`POST /functions/v1/extract-receipt`
- Dedicated exclusively to receipt document / image OCR extraction.
- Do NOT route general voice or text utterances to this endpoint.
- Returns `FinancialExtractionDTO` with `verification_status: "receipt_reported"` (strictly enforced by M3 adapter).

---

## 4. Groq API Implementation Details for M1

When implementing `process-voice`:

1. **API URL:** `https://api.groq.com/openai/v1/chat/completions`
2. **Recommended Model:** `llama-3.3-70b-versatile`
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

## 5. End-to-End Sequence Flow

```
[User speaks or types]
         ↓
  Mode 1: Audio file (M4)  OR  Mode 2: Typed text (M2)
         ↓
  M2: Call supabase.functions.invoke("process-voice", { ... })
         ↓
  M1 (process-voice):
    - Verifies user JWT
    - If audio: transcribes via Whisper
    - Calls Groq API with EXTRACTION_SYSTEM_PROMPT
    - Returns FinancialExtractionDTO JSON
         ↓
  M2: Passes raw response to M3's validateExtractionOutput(rawResponse)
         ↓
  M3: mapDtoToVoiceCandidates(dto, context) creates VoiceTransactionCandidate[]
      - Missing amounts stay null (clarification_required = true)
      - Missing expense_type stays null (clarification_required = true, NEVER "living")
      - Missing dates stay null (never defaults to current date)
      - Assigns stable candidate UUID
         ↓
  M2: Displays review card to user (Confirm / Edit)
         ↓
  M2: On confirm, calls M3's confirmCandidateTransaction(candidate, addTransaction)
         ↓
  M1 (data.ts: addTransaction):
    - Receives candidate.id as idempotency key
    - Persists to Supabase transactions table
    - Returns saved Transaction
```
