// =====================================================================
// Supabase Edge Function: process-voice (Owner: M1)
// Secure, server-side voice transcription and financial intent extraction
// using Groq Whisper (whisper-large-v3-turbo) and Groq Llama 3.3 (llama-3.3-70b-versatile).
// Strictly read-only inference. Never mutates database tables.
// Zero Gemini or unapproved AI providers.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ProcessVoiceRequest {
  audioBase64?: string;
  mimeType?: string;
  text?: string;
  candidateId?: string;
  language?: string;
}

// ---------- Groq model selection (self-healing) ----------
// Groq retires models and accounts can restrict which models a key may use. Instead of a
// hard-coded name, try candidates in order and move on when Groq says a model is missing,
// retired or not permitted. Optional secrets GROQ_CHAT_MODEL / GROQ_VISION_MODEL /
// GROQ_STT_MODEL pin a model explicitly.
const GROQ_PREFS: Record<"chat" | "vision" | "stt", string[]> = {
  chat: [
    "openai/gpt-oss-120b",
    "moonshotai/kimi-k2-instruct",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "openai/gpt-oss-20b",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
  ],
  vision: [
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama-3.2-90b-vision-preview",
    "llama-3.2-11b-vision-preview",
  ],
  stt: ["whisper-large-v3-turbo", "whisper-large-v3"],
};
const GROQ_PIN: Record<"chat" | "vision" | "stt", string> = { chat: "GROQ_CHAT_MODEL", vision: "GROQ_VISION_MODEL", stt: "GROQ_STT_MODEL" };
let groqModelCache: { at: number; ids: string[] } | null = null;

async function groqListModels(apiKey: string): Promise<string[]> {
  if (groqModelCache && Date.now() - groqModelCache.at < 10 * 60_000) return groqModelCache.ids;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) return [];
    const body = await res.json();
    const ids: string[] = (body?.data ?? []).filter((m: { active?: boolean }) => m?.active !== false).map((m: { id: string }) => m.id);
    groqModelCache = { at: Date.now(), ids };
    return ids;
  } catch {
    return [];
  }
}

async function groqCandidates(apiKey: string, kind: "chat" | "vision" | "stt"): Promise<string[]> {
  const pinned = Deno.env.get(GROQ_PIN[kind]);
  const listed = await groqListModels(apiKey);
  const prefs = GROQ_PREFS[kind];
  const extra = listed.filter((id) =>
    kind === "stt" ? /whisper/i.test(id) : kind === "vision" ? /llama-4|vision/i.test(id) : !/whisper|tts|guard|playai|orpheus|distil|compound|allam/i.test(id)
  );
  const ordered = [
    ...(pinned ? [pinned] : []),
    ...prefs.filter((p) => listed.includes(p)),
    ...extra,
    ...prefs.filter((p) => !listed.includes(p)),
  ];
  return [...new Set(ordered)];
}

function groqModelUnavailable(status: number, text: string): boolean {
  // 429: this model's rate limit is used up; Groq limits each model separately, so try the next one.
  return status === 404 || status === 403 || status === 429 || (status === 400 && /model_not_found|decommission|does not exist|not supported|not have access|model_permission/i.test(text));
}

/** Today's date in India, so relative words ("today", "yesterday", "Friday") resolve to real dates. */
function todayContext(): string {
  const now = new Date();
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const weekday = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long" }).format(now);
  return `Today's date in India is ${iso} (${weekday}). Resolve relative dates such as "today", "yesterday", "tomorrow" or a weekday name to YYYY-MM-DD using this date (a weekday name for an expected payout means the next such day; for a past transaction it means the most recent one). If no date is mentioned, leave the date null.`;
}

/** POST to Groq, trying each candidate model until one is available. Returns the last response. */
async function groqWithModelFallback(
  apiKey: string,
  kind: "chat" | "vision" | "stt",
  send: (model: string) => Promise<Response>
): Promise<{ res: Response; model: string }> {
  const candidates = await groqCandidates(apiKey, kind);
  let last: { res: Response; model: string } | null = null;
  for (const model of candidates) {
    const res = await send(model);
    if (res.ok) return { res, model };
    const text = await res.clone().text();
    last = { res: new Response(text, { status: res.status }), model };
    if (!groqModelUnavailable(res.status, text)) return last;
  }
  return last ?? { res: new Response(JSON.stringify({ error: "No Groq model available" }), { status: 503 }), model: "none" };
}

Deno.serve(async (req: Request) => {
  // 1. CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // 2. Authentication check: Validate user JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized. Invalid user token." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 3. API Key check
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    if (!groqApiKey) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY is not configured in Edge Function secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Validate input payload & enforce limits
    const body = (await req.json()) as ProcessVoiceRequest;
    const hasAudio = typeof body.audioBase64 === "string" && body.audioBase64.length > 50;
    const hasText = typeof body.text === "string" && body.text.trim().length > 0;

    if (!hasAudio && !hasText) {
      return new Response(
        JSON.stringify({ error: "Provide either an audioBase64 string or transcript text." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 10MB base64 payload limit check (~7.5MB raw audio)
    if (hasAudio && body.audioBase64!.length > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Audio payload exceeds maximum limit of 10MB." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let transcript = "";
    let sttProvider: "indicconformer" | "whisper" | "manual_text" = hasText ? "manual_text" : "whisper";

    // 5. Audio Transcription: AI4Bharat IndicConformer (PRIMARY) with Groq Whisper (SECONDARY FALLBACK)
    if (hasAudio) {
      const rawBase64 = body.audioBase64!.replace(/^data:audio\/[a-zA-Z0-9.-]+;base64,/, "");
      const binaryString = atob(rawBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const mime = body.mimeType || "audio/webm";
      let extension = "webm";
      if (mime.includes("mp4") || mime.includes("m4a")) extension = "m4a";
      else if (mime.includes("ogg")) extension = "ogg";
      else if (mime.includes("wav")) extension = "wav";

      // 5A. PRIMARY: AI4Bharat IndicConformer STT Service
      const indicUrl = Deno.env.get("INDICCONFORMER_URL");
      const indicKey = Deno.env.get("INDICCONFORMER_KEY") || "flova-indicconformer-secure-token-2026";
      let indicSucceeded = false;

      if (indicUrl) {
        try {
          const abortController = new AbortController();
          const timer = setTimeout(() => abortController.abort(), 7000); // 7s timeout

          const indicRes = await fetch(indicUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-FLOVA-STT-KEY": indicKey,
            },
            body: JSON.stringify({
              audioBase64: body.audioBase64,
              mimeType: mime,
              language: body.language || "kn",
            }),
            signal: abortController.signal,
          });
          clearTimeout(timer);

          if (indicRes.ok) {
            const indicData = await indicRes.json();
            const candText = (indicData.transcript || "").trim();
            if (candText.length > 0) {
              transcript = candText;
              sttProvider = "indicconformer";
              indicSucceeded = true;
            }
          } else {
            console.warn(`[STT] IndicConformer responded with status ${indicRes.status}. Falling back to Whisper.`);
          }
        } catch (e: any) {
          console.warn("[STT] IndicConformer unreachable or timed out. Falling back to Groq Whisper:", e.message || e);
        }
      }

      // 5B. SECONDARY FALLBACK: Groq Whisper
      if (!indicSucceeded) {
        const audioBlob = new Blob([bytes], { type: mime });
        const formData = new FormData();
        formData.append("file", audioBlob, `recording.${extension}`);
        formData.append("response_format", "json");
        if (body.language && body.language !== "auto") {
          formData.append("language", body.language.toLowerCase());
        }

        const { res: whisperRes } = await groqWithModelFallback(groqApiKey, "stt", (sttModelId) => {
          formData.set("model", sttModelId);
          return fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${groqApiKey}` },
            body: formData,
          });
        });

        if (!whisperRes.ok) {
          const errText = await whisperRes.text();
          return new Response(
            JSON.stringify({ error: `Groq Whisper transcription failed (${whisperRes.status}): ${errText}` }),
            { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const whisperData = await whisperRes.json();
        transcript = (whisperData.text || "").trim();
        sttProvider = "whisper";
        if (!transcript) {
          return new Response(
            JSON.stringify({ error: "No audible speech was recognized in the audio recording." }),
            { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } else {
      transcript = body.text!.trim();
      sttProvider = "manual_text";
    }

    // 6. Financial Intent Extraction via Groq Llama 3.3
    const systemPrompt = `You are the specialized AI Financial Intent Extraction Engine for FLOVA, a personal finance assistant for Indian gig and delivery workers.
Your task is to analyze the user's spoken utterance (which may be in English, Hindi, Kannada, Tamil, Telugu, Malayalam, Marathi, Bengali, Gujarati, Urdu, or code-switched mixes such as Hinglish/Kanglish/Tanglish) and return a strictly structured JSON object matching the canonical FinancialExtractionDTO.

Follow these strict rules:
1. Intent Classification:
   - "transaction": The worker mentions spending or earning money (e.g., "Spent 120 rupees on petrol", "Earned 650 tip", "आज पेट्रोल पर 300 रुपये खर्च किए", "ಇವತ್ತು ಪೆಟ್ರೋಲ್ಗೆ 300 ರೂಪಾಯಿ ಖರ್ಚು ಮಾಡಿದೆ", "آج پیٹرول پر 300 روپے خرچ کیے", "ఈరోజు పెట్రోల్ కోసం 300 రూపాయలు ఖర్చు చేశాను", "चाय और समोसे पर 40 रुपये खर्च किए").
   - "expected_payout": The worker mentions a future platform payout or client payment that has NOT yet been received into their bank (e.g., "Swiggy payout 1800 on Wednesday", "Expecting 2400 from Zomato", "स्विग्गी से सोमवार को 1800 आएंगे", "ಸ್ವಿಗ್ಗಿಯಿಂದ ಸೋಮವಾರ 1800 ಬರುತ್ತೆ", "سوئگی سے پیر کو 1800 ملیں گے", "సోమవారం స్విగ్గీ నుండి 1800 వస్తుంది"). NEVER convert expected payouts into transactions or ordinary income.
   - "balance_checkin": The worker states their current cash-in-hand or bank balance (e.g., "I have 500 in cash and 2500 in bank", "मेरे पास नकद 500 और बैंक में 2000 हैं", "ನನ್ನ ಹತ್ತಿರ 500 ನಗದು ಮತ್ತು ಬ್ಯಾಂಕ್ ನಲ್ಲಿ 2000 ಇದೆ", "میرے پاس نقد 500 اور بینک میں 2000 ہیں", "నా దగ్గర 500 నగదు మరియు బ్యాంకులో 2000 ఉంది").
   - "financial_query": The worker asks a question about their financial status, runway, balance, or ability to pay bills (e.g., "How much money do I have left?", "कितना पैसा बचा है?", "ಎಷ್ಟು ದುಡ್ಡು ಉಳಿದಿದೆ?", "کتنے پیسے بچے ہیں؟", "ఎంత డబ్బు మిగిలి ఉంది?", "Can I pay rent on Saturday?").
   - "unknown": Unrelated chatter, incomprehensible text, or non-financial statements.

2. Multilingual & Script Handling:
   - Accurately parse numbers and financial terms across English, Hindi/Marathi (Devanagari), Kannada (ಕನ್ನಡ), Tamil (தமிழ்), Telugu (తెలుగు), Malayalam (മലയാളം), Bengali (বাংলা), Gujarati (ગુજરાતી) and Urdu (اردو), including transliterated/code-switching (e.g., "300 roopayalu petrol ki", "oota 120 rupayi").
   - Amounts in Indic scripts/words (e.g., "३००", "300 रुपये", "300 ರೂಪಾಯಿ", "300 روپے", "300 రూపాయలు") MUST be extracted as standard decimal rupee strings (e.g. "300").
   - Work expenses: Petrol/diesel/fuel/cng, bike maintenance/repairs, phone recharge -> expense_type="work", category="fuel"|"maintenance"|"phone".
   - Living expenses: Food, tea, chai, snacks, breakfast, lunch, dinner, ration, groceries -> expense_type="living", category="food".
   - ALWAYS preserve the user's raw utterance in metadata.raw_utterance. Do NOT translate or discard the original script.

3. Anti-Hallucination & Truthful Uncertainty (CRITICAL):
   - NEVER INVENT OR GUESS NUMBERS, AMOUNTS, DATES, OR WORK CLASSIFICATIONS.
   - If amount is missing (e.g., "ಪೆಟ್ರೋಲ್ ಹಾಕಿಸಿದೆ" without specifying amount), set amount to null, set clarification_required to true, and add targeted question to clarification_questions.
   - For expenses (type="expense" and ownership="mine"), expense_type MUST be specified as "living" (food, tea, personal) or "work" (petrol, bike repair, phone recharge). If ambiguous, set expense_type to null and clarification_required to true.
   - For income, expense_type MUST be null (never living or work).
   - For Cash On Delivery (COD) collections or platform handovers, set ownership to "not_mine".
   - MULTIPLE TRANSACTIONS & ANTI-DUPLICATION (CRITICAL):
     If the user utterance describes multiple financial events (e.g. "I spent ₹250 on groceries and earned ₹800 from a freelance project"):
     - Extract EACH distinct transaction separately into the "transactions" array.
     - NEVER duplicate or copy an amount across transactions. In "I spent ₹250 on groceries and earned ₹800 from a freelance project", the expense has amount="250" (groceries, living) and the income has amount="800" (freelance).
     - NEVER reuse an amount from one clause for another unless explicitly stated by the user. If an event has no amount mentioned, set its amount to null and clarification_required to true.
     - Also set "transaction" to the first transaction object for backwards compatibility.
   - If intent is "financial_query", DO NOT attempt to answer or calculate balances in the LLM. Set entry_intent="financial_query", populate financial_query.query_type ("runway_check", "balance_check", "payout_check", "commitment_check", or "general"), and leave transaction=null.
   - All amounts in the DTO MUST be decimal rupee strings (e.g. "120" or "450.50") or null.

4. Output Schema (JSON only):
{
  "entry_intent": "transaction" | "expected_payout" | "balance_checkin" | "financial_query" | "unknown",
  "action_intent": "create" | "correct" | "clarify" | "cancel" | "unknown",
  "target_id": null,
  "transactions": [
    {
      "type": "income" | "expense" | null,
      "amount": string | null,
      "category": string | null,
      "expense_type": "living" | "work" | null,
      "ownership": "mine" | "not_mine" | null,
      "date": "YYYY-MM-DD" | null,
      "description": string | null
    }
  ],
  "transaction": {
    "type": "income" | "expense" | null,
    "amount": string | null,
    "category": string | null,
    "expense_type": "living" | "work" | null,
    "ownership": "mine" | "not_mine" | null,
    "date": "YYYY-MM-DD" | null,
    "description": string | null
  } | null,
  "expected_payout": {
    "expected_amount": string | null,
    "kind": "platform_payout" | "incentive" | "client_payment" | "advance" | "other" | null,
    "source": string | null,
    "expected_date": "YYYY-MM-DD" | null,
    "status": "scheduled" | "estimated" | "unearned" | null,
    "note": string | null
  } | null,
  "balance_checkin": {
    "cash_amount": string | null,
    "bank_amount": string | null,
    "not_mine_amount": string | null,
    "note": string | null,
    "checked_at": string | null
  } | null,
  "financial_query": {
    "query_type": "runway_check" | "balance_check" | "payout_check" | "commitment_check" | "general",
    "target_date": string | null,
    "target_entity": string | null
  } | null,
  "metadata": {
    "certainty": number,
    "clarification_required": boolean,
    "clarification_reason": string | null,
    "clarification_questions": string[],
    "raw_utterance": string
  }
}`;

    const { res: groqRes } = await groqWithModelFallback(groqApiKey, "chat", (model) =>
      fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `${todayContext()}\n\nSpoken utterance:\n"${transcript}"` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      })
    );

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return new Response(
        JSON.stringify({ error: `Groq intent extraction failed (${groqRes.status}): ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const groqData = await groqRes.json();
    const rawContent = groqData.choices?.[0]?.message?.content;
    if (!rawContent) {
      return new Response(
        JSON.stringify({ error: "Empty response received from Groq extraction engine." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extraction = JSON.parse(rawContent);
    extraction.metadata = extraction.metadata || {
      certainty: 0.7,
      clarification_required: false,
      clarification_reason: null,
      clarification_questions: [],
      raw_utterance: transcript,
    };
    extraction.metadata.raw_utterance = transcript;

    // 7. Construct candidates for transaction intents
    let candidate = null;
    const candidates = [];
    const txList = Array.isArray(extraction.transactions) && extraction.transactions.length > 0
      ? extraction.transactions
      : extraction.transaction ? [extraction.transaction] : [];

    if (extraction.entry_intent === "transaction" && txList.length > 0) {
      for (let i = 0; i < txList.length; i++) {
        const tx = txList[i];
        let amountPaise: number | null = null;
        if (tx.amount !== null && tx.amount !== undefined) {
          const num = Number(tx.amount);
          if (!isNaN(num) && num > 0) {
            amountPaise = Math.round(num * 100);
          }
        }

        const missingFields: string[] = [];
        if (amountPaise === null) missingFields.push("amount");
        if (!tx.type) missingFields.push("type");
        if (tx.type === "expense" && (!tx.ownership || tx.ownership === "mine") && !tx.expense_type) {
          missingFields.push("expenseType");
        }

        const needsReview =
          missingFields.length > 0 ||
          extraction.metadata.clarification_required ||
          (typeof extraction.metadata.certainty === "number" && extraction.metadata.certainty < 0.85);

        const candidateId = i === 0 && body.candidateId ? body.candidateId : crypto.randomUUID();

        const c = {
          id: candidateId,
          transcript,
          stt_provider: sttProvider,
          type: tx.type === "income" || tx.type === "expense" ? tx.type : null,
          amountPaise,
          category: tx.category || (tx.type === "income" ? "earnings" : "other"),
          expenseType: tx.type === "expense" && (tx.expense_type === "living" || tx.expense_type === "work") ? tx.expense_type : null,
          date: tx.date || new Date().toISOString().slice(0, 10),
          ownership: tx.ownership === "not_mine" ? "not_mine" : "mine",
          confidence: typeof extraction.metadata.certainty === "number" ? extraction.metadata.certainty : 0.8,
          needsReview,
          missingFields,
        };
        candidates.push(c);
      }
      candidate = candidates[0] || null;
      if (!extraction.transaction) {
        extraction.transaction = txList[0];
      }
      if (!extraction.transactions) {
        extraction.transactions = txList;
      }
    }

    return new Response(
      JSON.stringify({
        transcript,
        stt_provider: sttProvider,
        extraction,
        candidate,
        candidates,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal voice processing error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
