# Phase 9: Secure Voice Transcription and Financial Intent Integration — Context & Decisions

## Context
FLOVA is a voice-first financial companion for workers with irregular income. In Phase 6, 7, and 8, we established isolated demo seeding, financial data contracts (`VoiceTransactionCandidate`, `ExtractedReceiptCandidate`, `ActivityItem`, and `confirmCandidateTransaction()`), and the secure receipt extraction flow (`extract-receipt`).

Phase 9 implements the voice ingestion and financial intent pipeline, allowing irregular income workers to record financial transactions and ask core financial runway queries using their voice.

## User Flow
```
[Microphone Audio Recording / Typed Text Fallback]
                        ↓
[Supabase Edge Function: process-voice] (Authenticated with user JWT)
                        ↓
   [Groq Whisper Speech-to-Text] (whisper-large-v3-turbo)
                        ↓
                 [Transcript]
                        ↓
[Groq LLM Intent & Financial Extraction] (llama-3.3-70b-versatile, JSON Mode)
                        ↓
             [FinancialExtractionDTO]
            /                        \
           /                          \
[Intent: record_transaction]     [Intent: financial_query]
          ↓                                 ↓
[VoiceTransactionCandidate]      [Deterministic Runway Engine Answer]
          ↓                                 ↓
[Interactive M2 Review Form]     [Spoken/Visual Balance & Runway Answer]
          ↓
[User "Confirm & Save"]
          ↓
[confirmCandidateTransaction()]
          ↓
[Activity Timeline / DB]
```

## Team Coordination Roles
- **M1 (Backend & Integration)**: Secure Edge Function `process-voice`, server-side Groq API integration (Whisper + Llama 3.3), authenticated JWT validation, contract adherence (`FinancialExtractionDTO`, `VoiceTransactionCandidate`), database persistence via `confirmCandidateTransaction()`, RLS enforcement, and idempotency retention.
- **M2 (UI & Review)**: Voice recording page (`/voice`), microphone interaction states (idle, recording, transcribing, reviewing), candidate review/edit form, missing fields warning banners, and query response display.
- **M3 (Engine & Intent)**: Validation of `FinancialExtractionDTO`, conversion to `VoiceTransactionCandidate`, and routing financial queries (`runway_check`, `balance_check`, `payout_check`) to the deterministic runway engine.
- **M4 (Audio & Voice Capture)**: Web Audio `MediaRecorder` hook, microphone permissions handling, blob/base64 encoding, audio recording timer, and typed text fallback.

## Key Architectural & Design Decisions

### 1. Security Boundary & Server-Side Credentials
- **Decision**: All Groq credentials (`GROQ_API_KEY`) reside exclusively in Supabase Edge Function secrets. Zero AI API keys in frontend client bundles.
- **Authentication**: Caller must supply a valid Supabase Auth JWT in `Authorization: Bearer <token>`. The Edge Function verifies caller identity with `supabase.auth.getUser(token)`.

### 2. Dual-Stage Groq AI Pipeline (Whisper + Llama 3.3)
- **Audio Transcription**: Groq's `whisper-large-v3-turbo` model via `https://api.groq.com/openai/v1/audio/transcriptions`. Accepts audio formats (`audio/webm`, `audio/wav`, `audio/ogg`, `audio/mp3`, `audio/m4a`).
- **Financial Intent Extraction**: Groq's `llama-3.3-70b-versatile` model via `https://api.groq.com/openai/v1/chat/completions` with JSON mode (`response_format: { type: "json_object" }`).
- **Zero Gemini Policy**: Groq is used exclusively. No Gemini or unapproved AI provider dependencies.

### 3. Canonical Data Contracts: FinancialExtractionDTO & VoiceTransactionCandidate
- **`FinancialExtractionDTO`**: Canonical bridge structure capturing:
  - `intent`: `"record_transaction"` | `"financial_query"` | `"unknown"`
  - `transcript`: string
  - `confidence`: number (0 to 1 extraction clarity estimate)
  - `missingFields`: string[]
  - `needsReview`: boolean
  - `transaction`: structured transaction fields when `intent === "record_transaction"`
  - `query`: query type and text when `intent === "financial_query"`
- **`VoiceTransactionCandidate`**: Phase 7 contract model consumed directly by `confirmCandidateTransaction()`.

### 4. Truthful Uncertainty & Anti-Hallucination
- **Decision**: Never invent, extrapolate, or guess financial values.
- **Rule**: If the speaker says "spent some money on fuel" without an amount, `amountPaise` is `null`, `needsReview` is `true`, and `missingFields` includes `"amount"`.
- **Classification**: Living vs work is required for own expenses. If the speaker does not specify, `expenseType` is `null`, and user must select before confirmation.
- **Dates**: If no date is stated, defaults to `date: null` (prefilled with today's local date during review).

### 5. Mandatory User Confirmation & Read-Only Inference
- **Decision**: Voice extraction is strictly read-only and NEVER inserts, updates, or deletes records in the database.
- **Persistence**: Only explicit user click on "Confirm & Save" invokes `confirmCandidateTransaction()`.
- **Source**: Persisted records receive `source: "voice"`.
- **Idempotency**: Client UUID is assigned during initial extraction review and preserved across network retries.

### 6. Fallback Input
- **Decision**: Text entry / typed query fallback is always available for noisy environments or microphone-disabled devices.
