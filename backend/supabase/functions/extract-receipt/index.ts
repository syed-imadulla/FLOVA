// =====================================================================
// Supabase Edge Function: extract-receipt (Owner: M1)
// Secure, server-side receipt extraction using Groq API.
// Strictly read-only inference. Never mutates database tables.
// Zero Gemini or unapproved AI providers.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ExtractReceiptRequest {
  imageBase64?: string;
  mimeType?: string;
  text?: string;
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

    // 4. Validate input payload
    const body = (await req.json()) as ExtractReceiptRequest;
    const hasImage = typeof body.imageBase64 === "string" && body.imageBase64.length > 50;
    const hasText = typeof body.text === "string" && body.text.trim().length > 0;

    if (!hasImage && !hasText) {
      return new Response(
        JSON.stringify({ error: "Provide either an imageBase64 string or receipt text." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Select Groq Model and build messages
    const systemPrompt = `You are a specialized financial receipt and UPI payment extraction engine for Indian gig and delivery workers.
Extract structured expense data from the receipt image, UPI payment screenshot, or transaction text/SMS.

Classification:
- kind: 'physical_receipt' | 'upi_screenshot' | 'payment_sms' | 'unknown'

Rules for UPI Screenshots & Payment SMS:
- If this is a UPI screenshot (Google Pay, PhonePe, Paytm, CRED, BHIM, etc.) or UPI SMS:
  - upi_app: 'google_pay' | 'phonepe' | 'paytm' | 'cred' | 'bhim' | 'other' | null
  - upi_reference: 12-digit UTR or transaction ID (e.g. UPI Ref / UTR / Txn ID) if visible, or null
  - payment_status: 'successful' | 'pending' | 'failed' | 'unknown'
    - 'successful': clearly marked as Paid, Completed, Successful, or Green checkmark
    - 'pending': Processing, Payment pending, Awaiting bank confirmation
    - 'failed': Failed, Declined, Payment failed, Red cross mark
    - 'unknown': status cannot be definitively determined
  - merchant: recipient name or shop name where money was sent
  - payment_method: 'upi'

Rules for Physical Receipts:
- items: array of { "name": string, "quantity": number | null, "price": number | null }
- subtotal_rupees: number or null
- tax_rupees: number or null (GST / VAT)
- discount_rupees: number or null
- payment_method: 'cash' | 'card' | 'upi' | 'other' | null

General Anti-Hallucination & Truthful Uncertainty Rules:
1. amount_rupees: final payable/paid total amount in Indian Rupees.
   - NEVER MISTAKE invoice numbers, phone numbers (10 digits starting with 6-9), or GST numbers (15 chars) for amounts.
   - Prefer final paid total over subtotal.
   - If multiple possible totals exist, return them in possible_totals: number[].
   - If amount is not clearly legible, set amount_rupees to null and add "amount" to missing_fields.
2. date: transaction date strictly in YYYY-MM-DD format IF CLEARLY IDENTIFIABLE on the document.
   - NEVER invent or assume today's date if date is missing or illegible; set date to null.
3. time: transaction time in HH:MM format if visible, else null.
4. category: one of 'fuel', 'food', 'groceries', 'phone', 'maintenance', 'rent', 'other'.
5. expense_type: 'living', 'work', or null if uncertain.
6. confidence: number between 0 and 1.
7. missing_fields: string[] (e.g. ["amount", "expense_type", "date"]).

Return strictly a JSON object matching this schema.`;

    let userContent: any;

    if (hasImage) {
      const imageUrl = body.imageBase64!.startsWith("data:")
        ? body.imageBase64!
        : `data:${body.mimeType || "image/jpeg"};base64,${body.imageBase64!}`;

      userContent = [
        { type: "text", text: "Extract details from this receipt or UPI payment screenshot:" },
        { type: "image_url", image_url: { url: imageUrl } },
      ];
    } else {
      userContent = `Extract details from this receipt or SMS text:\n\n${body.text}`;
    }

    // 6. Call Groq Chat Completions API
    const { res: groqRes } = await groqWithModelFallback(groqApiKey, hasImage ? "vision" : "chat", (model) =>
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
            { role: "user", content: userContent },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      })
    );

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return new Response(
        JSON.stringify({ error: `Groq extraction failed (${groqRes.status}): ${errText}` }),
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

    const parsed = JSON.parse(rawContent);

    // 7. Normalization & Paise conversion
    let amountPaise: number | null = null;
    if (parsed.amount_rupees !== null && parsed.amount_rupees !== undefined) {
      const num = Number(parsed.amount_rupees);
      if (!isNaN(num) && num > 0) {
        amountPaise = Math.round(num * 100);
      }
    }

    let subtotalPaise: number | null = null;
    if (parsed.subtotal_rupees !== null && parsed.subtotal_rupees !== undefined) {
      const sNum = Number(parsed.subtotal_rupees);
      if (!isNaN(sNum) && sNum > 0) subtotalPaise = Math.round(sNum * 100);
    }

    let taxPaise: number | null = null;
    if (parsed.tax_rupees !== null && parsed.tax_rupees !== undefined) {
      const tNum = Number(parsed.tax_rupees);
      if (!isNaN(tNum) && tNum > 0) taxPaise = Math.round(tNum * 100);
    }

    let discountPaise: number | null = null;
    if (parsed.discount_rupees !== null && parsed.discount_rupees !== undefined) {
      const dNum = Number(parsed.discount_rupees);
      if (!isNaN(dNum) && dNum > 0) discountPaise = Math.round(dNum * 100);
    }

    let dateStr: string | null = null;
    if (typeof parsed.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
      dateStr = parsed.date;
    }

    const missingFields: string[] = Array.isArray(parsed.missing_fields) ? [...parsed.missing_fields] : [];
    if (amountPaise === null && !missingFields.includes("amount")) {
      missingFields.push("amount");
    }
    if (!parsed.expense_type && !missingFields.includes("expenseType")) {
      missingFields.push("expenseType");
    }

    const paymentStatus = parsed.payment_status || (parsed.kind === "upi_screenshot" ? "unknown" : "successful");
    const isUncertainStatus = paymentStatus === "pending" || paymentStatus === "failed" || paymentStatus === "unknown";

    const needsReview = missingFields.length > 0 || isUncertainStatus || (typeof parsed.confidence === "number" && parsed.confidence < 0.85);

    const items = Array.isArray(parsed.items)
      ? parsed.items.map((i: any) => ({
          name: String(i.name || "Item"),
          quantity: typeof i.quantity === "number" ? i.quantity : null,
          price: typeof i.price === "number" ? i.price : null,
        }))
      : [];

    const candidate = {
      id: crypto.randomUUID(),
      kind: parsed.kind || "unknown",
      merchant: parsed.merchant || null,
      amountPaise,
      subtotalPaise,
      taxPaise,
      discountPaise,
      category: parsed.category || "other",
      expenseType: parsed.expense_type === "living" || parsed.expense_type === "work" ? parsed.expense_type : null,
      date: dateStr,
      extractedDate: dateStr,
      time: parsed.time || null,
      paymentStatus,
      upiReference: parsed.upi_reference || null,
      upiApp: parsed.upi_app || null,
      items,
      possibleTotals: Array.isArray(parsed.possible_totals) ? parsed.possible_totals : [],
      description: parsed.description || (parsed.merchant ? `${parsed.merchant} ${parsed.kind === 'upi_screenshot' ? 'payment' : 'receipt'}` : null),
      confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.8,
      needsReview,
      missingFields,
      rawExtractedData: parsed,
    };

    return new Response(JSON.stringify({ candidate, rawText: rawContent }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal extraction error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
