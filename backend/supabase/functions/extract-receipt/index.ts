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
    const systemPrompt = `You are a specialized financial receipt extraction engine for Indian gig and delivery workers.
Extract structured expense data from the receipt image or text.
Follow these strict rules:
1. Extract:
   - merchant: string or null (vendor/shop/pump name)
   - amount_rupees: number or null (final paid total amount in Indian Rupees)
   - date: string or null (transaction date in ISO YYYY-MM-DD format)
   - category: string or null (one of: 'fuel', 'food', 'phone', 'maintenance', 'rent', 'other')
   - expense_type: string or null (either 'living', 'work', or null if uncertain)
   - description: string or null (concise description of purchase or items)
   - confidence: number between 0 and 1 estimating extraction certainty
   - missing_fields: string[] (list any fields that could not be detected from the receipt, e.g. ["amount", "expense_type"])
2. Anti-Hallucination & Truthful Uncertainty:
   - DO NOT INVENT OR GUESS NUMBERS.
   - If the total amount is not clearly legible or present, set amount_rupees to null and include "amount" in missing_fields.
   - If merchant name is not clearly visible, set merchant to null.
   - If date is not visible, set date to null.
3. Return strictly a JSON object with the specified keys.`;

    let model = "llama-3.3-70b-versatile";
    let userContent: any;

    if (hasImage) {
      model = "llama-3.2-11b-vision-preview";
      const imageUrl = body.imageBase64!.startsWith("data:")
        ? body.imageBase64!
        : `data:${body.mimeType || "image/jpeg"};base64,${body.imageBase64!}`;

      userContent = [
        { type: "text", text: "Extract details from this receipt:" },
        { type: "image_url", image_url: { url: imageUrl } },
      ];
    } else {
      model = "llama-3.3-70b-versatile";
      userContent = `Extract details from this receipt or SMS text:\n\n${body.text}`;
    }

    // 6. Call Groq Chat Completions API
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
    });

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

    const needsReview = missingFields.length > 0 || (typeof parsed.confidence === "number" && parsed.confidence < 0.85);

    const candidate = {
      id: crypto.randomUUID(),
      merchant: parsed.merchant || null,
      amountPaise,
      category: parsed.category || "other",
      expenseType: parsed.expense_type === "living" || parsed.expense_type === "work" ? parsed.expense_type : null,
      date: dateStr,
      description: parsed.description || (parsed.merchant ? `${parsed.merchant} receipt` : null),
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
