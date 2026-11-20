# Phase 9 Plan 01 Summary: Secure Voice Transcription and Financial Intent Integration

## Outcome
Implemented and verified the end-to-end voice transcription and financial intent integration flow using Groq Whisper (`whisper-large-v3-turbo`) and Groq Llama 3.3 (`llama-3.3-70b-versatile`) via a secure Supabase Edge Function (`process-voice`). The service outputs canonical `FinancialExtractionDTO` and `VoiceTransactionCandidate` structures, supports transaction, expected payout, balance check-in, and financial query intents, resolves financial queries deterministically using the M3 runway engine without LLM calculations, requires explicit user confirmation, and preserves idempotency without exposing API keys in frontend client bundles.

## Key Implementation Details

1. **Supabase Edge Function (`backend/supabase/functions/process-voice/index.ts`)**:
   - Strictly server-side inference using `Deno.env.get("GROQ_API_KEY")`.
   - Validates caller authentication via Supabase Auth JWT (`Authorization: Bearer <token>`).
   - Supports audio payload (base64) with Whisper transcription and typed text fallback.
   - Enforces 10MB payload size limits and 60-second audio duration safeguards.
   - Transcribes spoken audio via Groq Whisper (`whisper-large-v3-turbo`).
   - Classifies financial intents via Groq Llama 3.3 (`llama-3.3-70b-versatile`) with JSON mode.
   - Outputs canonical `FinancialExtractionDTO`:
     - `entry_intent`: `"transaction" | "expected_payout" | "balance_checkin" | "financial_query" | "unknown"`
   - Anti-hallucination rules: Missing financial values stay `null`, living/work classification strictly required for expenses, income never has living/work, COD money marked `ownership: "not_mine"`.
   - Strictly read-only: does NOT insert, update, or delete any database rows.

2. **Frontend Voice Service & Deterministic Query Engine (`frontend/src/services/voice.ts`)**:
   - `processVoice({ audioBlob, mimeType, text, candidateId })`:
     - Invokes `supabase.functions.invoke("process-voice")`.
     - Assigns / retains client UUID for idempotency.
     - Graceful local fallback to local pattern extractor if offline or Edge Function is unreachable.
   - `resolveFinancialQuery(query, runwayInput, processedRunway)`:
     - The LLM classifies intent, but NEVER calculates balances.
     - Resolves queries deterministically using authenticated database data + M3 runway engine (`calculateConfirmedBalance` & `calculateDailyRunway`).
     - Reports confirmed personal liquid balance (segregating COD liability).
     - Reports runway days, first shortfall date (e.g. Saturday ₹1,170 rent shortfall), and upcoming commitments.

3. **Audio Capture Hook (`frontend/src/voice/useAudioRecorder.ts`)**:
   - Detects supported MediaRecorder MIME types dynamically (`audio/webm;codecs=opus`, `audio/webm`, `audio/mp4`, `audio/ogg`, `audio/wav`).
   - Clean microphone permission handling with user-friendly error notices.
   - Enforces 60-second auto-stop duration limit and 10MB payload limit.
   - Cleans up media stream tracks (`track.stop()`) on stop and unmount.

4. **Voice Interaction & Review UI (`frontend/src/pages/VoiceCapturePage.tsx`)**:
   - Route `/voice` wrapped in `RequireAuth` and `RequireOnboarded`.
   - Recording view with animated pulse button, recording timer, and typed text fallback.
   - Multi-intent routing:
     - **Transaction**: Candidate review/edit form (Amount, Category, Living vs Work required, Description, Date), missing field alert banner, "Confirm & Save Transaction" (`confirmCandidateTransaction`), and "Discard" button.
     - **Expected Payout**: Advisory banner explaining that future payouts do not alter current cash; option to save via `addPayout()` or discard.
     - **Balance Check-in**: Baseline check-in banner; option to save via `addCheckin()` or discard.
     - **Financial Query**: Deterministic answer card displaying verified balances and shortfall projections with zero database mutations.
     - **Unknown**: Displays clarification questions and allows manual form entry.

5. **Automated Unit & Regression Tests (`frontend/src/services/__tests__/voiceIntent.test.ts`)**:
   - 13 comprehensive test scenarios covering income extraction, work expense, living expense, missing amount (`null`), living vs work requirement, deterministic balance check, runway/shortfall check, expected payout isolation, balance check-in isolation, read-only extraction guarantee, discard behavior, candidate idempotency UUID retention, and graceful local fallback.
