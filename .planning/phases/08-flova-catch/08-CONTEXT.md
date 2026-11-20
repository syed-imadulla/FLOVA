# Phase 8: Secure FLOVA Catch (Receipt Extraction) — Context & Decisions

## Context
FLOVA is a voice-first financial companion for workers with irregular income. In Phase 6 and Phase 7, we established isolated demo seeding and general-purpose financial contracts (`ExtractedReceiptCandidate`, `VoiceTransactionCandidate`, `ActivityItem`, and `confirmCandidateTransaction()`).

Phase 8 builds the **FLOVA Catch** receipt-to-transaction suggestion flow, enabling workers to take a photo of a receipt or paste transaction/bill text and receive structured candidate suggestions for review.

## User Flow
1. **Input**: Worker uploads a receipt image (JPEG/PNG/WebP) or pastes receipt/bill text in the UI (`/catch` or Quick Capture).
2. **Secure Extraction**: Frontend invokes the Supabase Edge Function `extract-receipt`, passing the image (base64/data URI) or text payload along with user JWT.
3. **Structured Candidate Generation**: The Edge Function calls Groq's multimodal/text LLM with a strict JSON schema, extracting only content-supported fields and representing missing or ambiguous fields explicitly as `null`.
4. **Interactive Review**: Frontend renders the structured candidate form (`ExtractedReceiptCandidate`) with highlighted review warnings for missing fields (especially living vs work classification and amount).
5. **Confirmation**: Worker verifies and adjusts fields, then clicks "Confirm & Save".
6. **Persistence**: Frontend calls `confirmCandidateTransaction(candidate)` which enforces validation, ensures living vs work classification, and persists the entry into `transactions` with `source: 'ai_suggestion'`.
7. **Timeline Integration**: The saved transaction immediately appears on the Activity timeline and feeds the confirmed runway balance.

## Key Architectural & Design Decisions

### 1. Security Boundary & API Key Protection
- **Decision**: Zero AI API keys in frontend client bundles.
- **Implementation**: The Groq API key (`GROQ_API_KEY`) is stored strictly in Supabase Edge Function secrets / backend environment.
- **Authorization**: The Edge Function (`extract-receipt`) validates the caller's Supabase Auth JWT (`Authorization: Bearer <token>`) using `supabase.auth.getUser(token)` so only verified authenticated users can invoke extraction.

### 2. AI Provider: Groq (Verified Model Identifiers)
- **Decision**: Use Groq exclusively via OpenAI-compatible endpoints (`https://api.groq.com/openai/v1/chat/completions`).
- **Vision Model (Images)**: `llama-3.2-11b-vision-preview` (multimodal image receipt parsing).
- **Text Model (SMS / Pasted Text)**: `llama-3.3-70b-versatile` (fast, structured Indian currency & bill reasoning).
- **Format**: `response_format: { type: "json_object" }` with an enforced JSON schema matching `ExtractedReceiptCandidate`.
- **Zero Gemini Policy**: Strictly adhere to the project constraint prohibiting Gemini or unapproved AI providers.

### 3. Truthful Uncertainty & Contract Alignment
- **Decision**: Never invent or fabricate financial data.
- **Field Contract Alignment**: Use `description`, not `notes`, aligning directly with `Transaction.description`.
- **Nullable Fields**: `amountPaise`, `date`, `merchant`, `category`, and `expenseType` are explicitly nullable (`null`) when not clearly supported by receipt content.
- **Rule**: If the receipt total is unreadable, cut off, or ambiguous, `amountPaise` MUST be returned as `null`, `needsReview` set to `true`, and `missingFields` populated with `["amount"]`.
- **Date Handling**: Do not blindly reject future dates without considering receipt context (e.g. advance utility bookings or local timezone offsets).
- **Confidence Metric**: `confidence` is an extraction estimate (model certainty), NOT transaction verification or bank payment proof.
- **User-Provided Nature**: Receipts are treated as worker assertions, never verified bank/clearing house payment evidence.
- **Read-Only Extraction**: Receipt extraction NEVER inserts, updates, or deletes financial records in the database.

### 4. Mandatory User Confirmation
- **Decision**: Never automatically save extracted candidates to the database.
- **Rule**: Every candidate requires user review and explicit confirmation.
- **Living vs Work**: The AI may propose an `expenseType` based on context (e.g. petrol -> work, lunch -> living), but the user must verify or select it. If omitted, `confirmCandidateTransaction()` throws an error blocking persistence.
- **Action**: Only an explicit user click on "Confirm & Save" can invoke `confirmCandidateTransaction()`.

### 5. Input Modes: Dual Image & Pasted-Text
- **Decision**: Support both direct image upload (camera/file selector) and manual text paste.
- **Rationale**: Delivery workers frequently receive SMS transaction alerts, WhatsApp bills, or printed fuel slips with poor camera focus. Pasted text provides a zero-friction fallback.
- **Android Share Target**: Deferred to post-hackathon backlog unless all core flows are complete and extra time permits.

### 6. Idempotency & Retries
- **Decision**: Client generates a UUID for the candidate upon initial review.
- **Rule**: If network timeout occurs during confirmation, retry uses the same UUID, leveraging Phase 5's idempotent retry recovery without duplicate entries.
