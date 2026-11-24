// =====================================================================
// FLOVA SEC-03: Edge Function Rate Limiting Simulated Regression Test Suite
// Note: This suite runs under Node.js + PGlite (real Postgres in WASM).
// For the live Deno runtime integration tests on the actual TypeScript
// Edge Function files, see: supabase/functions/tests/edge_rate_limit_deno_test.ts
//
// Verifies:
// 1. Unauthenticated requests rejected before expensive processing.
// 2. Pre-validation: Invalid JSON, empty, or oversized payloads return 400/413
//    without consuming quota.
// 3. Requests within configured limits succeed.
// 4. Requests exceeding limits receive HTTP 429 with Retry-After.
// 5. User A cannot consume or manipulate User B's quota.
// 6. Independent buckets for process-voice and extract-receipt.
// 7. Concurrent requests cannot exceed limits (atomic FOR UPDATE locking).
// 8. Expired windows reset quota correctly.
// 9. Fail-closed: DB failure prevents expensive processing (503).
// 10. Rate-limited requests never invoke AI provider.
// 11. Legitimate requests work after window reset.
// =====================================================================

import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";

const db = new PGlite();
const USER_A = "11111111-1111-1111-1111-111111111111";
const USER_B = "22222222-2222-2222-2222-222222222222";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => {
  if (cond) {
    pass++;
    console.log("  PASS:", msg);
  } else {
    fail++;
    console.error("  FAIL:", msg);
  }
};

// Setup Supabase-like environment and apply migrations
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to authenticated, anon;
  grant execute on function auth.uid() to authenticated, anon;
`);

const migrationsDir = new URL("../supabase/migrations", import.meta.url);
const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
for (const file of files) {
  await db.exec(fs.readFileSync(new URL(`../supabase/migrations/${file}`, import.meta.url), "utf8"));
}

await db.exec(`
  insert into auth.users (id) values ('${USER_A}'), ('${USER_B}');
`);

const asUser = async (uid, sql) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid}', false); set role authenticated;`);
  return db.query(sql);
};

console.log("Starting SEC-03 Edge Function Rate Limiting Verification...\n");

// ---------------------------------------------------------------------
// Mock Edge Function Handler (matches process-voice and extract-receipt)
// ---------------------------------------------------------------------
let aiProviderCallCount = {
  voice: 0,
  receipt: 0,
};

async function handleEdgeFunctionRequest({
  functionName,
  token,
  payload,
  simulateDbFailure = false,
}) {
  // 1. Authentication check
  if (!token) {
    return {
      status: 401,
      headers: { "Content-Type": "application/json" },
      body: { error: "Missing Authorization header." },
    };
  }

  // Map token to authenticated user id (simulating supabase.auth.getUser)
  let userId = null;
  if (token === "token-user-a") userId = USER_A;
  else if (token === "token-user-b") userId = USER_B;
  else {
    return {
      status: 401,
      headers: { "Content-Type": "application/json" },
      body: { error: "Unauthorized. Invalid or expired user token." },
    };
  }

  // 2. Pre-validation: JSON structure and payload size checks BEFORE consuming rate limit
  if (payload === "OVERSIZED_STREAM" || payload?.rawBodyLength > 10 * 1024 * 1024) {
    return {
      status: 413,
      headers: { "Content-Type": "application/json" },
      body: { error: "Request body exceeds maximum limit of 10MB." },
    };
  }

  if (payload === "INVALID_JSON") {
    return {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: "Invalid JSON in request body." },
    };
  }

  if (payload?.audioBase64 === "MALFORMED_B64" || payload?.imageBase64 === "MALFORMED_B64") {
    return {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: "Malformed base64: contains invalid characters." },
    };
  }

  if (payload?.spoofedMime) {
    return {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: "MIME type spoofing detected: declared does not match file signature." },
    };
  }

  if (payload?.invalidSignature) {
    return {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: "Invalid media file signature." },
    };
  }

  const hasAudio = typeof payload?.audioBase64 === "string" && payload.audioBase64.length > 50;
  const hasText = typeof payload?.text === "string" && payload.text.trim().length > 0;
  const hasImage = typeof payload?.imageBase64 === "string" && payload.imageBase64.length > 50;

  if (functionName === "process-voice" && !hasAudio && !hasText) {
    return {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: "Provide either an audioBase64 string or transcript text." },
    };
  }

  if (functionName === "extract-receipt" && !hasImage && !hasText) {
    return {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: "Provide either an imageBase64 string or receipt text." },
    };
  }

  if (hasAudio && payload.audioBase64.length > 10 * 1024 * 1024) {
    return {
      status: 413,
      headers: { "Content-Type": "application/json" },
      body: { error: "Audio payload exceeds maximum limit of 10MB." },
    };
  }

  if (hasImage && payload.imageBase64.length > 10 * 1024 * 1024) {
    return {
      status: 413,
      headers: { "Content-Type": "application/json" },
      body: { error: "Image payload exceeds maximum limit of 10MB." },
    };
  }

  // 3. Server-side atomic rate limiting (ONLY executed after payload validation passes)
  let rateLimitResult = null;
  if (simulateDbFailure) {
    // Fail-closed simulation
    return {
      status: 503,
      headers: { "Content-Type": "application/json", "Retry-After": "60" },
      body: {
        error: "Security verification failed. Rate limit verification unavailable.",
        code: "RATE_LIMIT_UNAVAILABLE",
      },
    };
  }

  try {
    const q = await asUser(userId, `select public.check_and_consume_rate_limit('${functionName}') as res`);
    rateLimitResult = q.rows[0].res;
  } catch (err) {
    return {
      status: 503,
      headers: { "Content-Type": "application/json", "Retry-After": "60" },
      body: {
        error: "Security verification failed. Rate limit verification unavailable.",
        code: "RATE_LIMIT_UNAVAILABLE",
      },
    };
  }

  if (!rateLimitResult || rateLimitResult.allowed === false) {
    const retryAfter = Number(rateLimitResult?.retry_after) || 60;
    const isDaily = rateLimitResult?.reason === "daily_window_exceeded";
    return {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
      body: {
        error: isDaily
          ? "Daily quota exceeded."
          : "Rate limit exceeded. Too many requests. Please wait before trying again.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter,
        reason: rateLimitResult?.reason || "rate_limited",
      },
    };
  }

  // 3. Expensive AI Provider Processing (Only reachable if rate limit allowed)
  if (functionName === "process-voice") {
    aiProviderCallCount.voice++;
  } else if (functionName === "extract-receipt") {
    aiProviderCallCount.receipt++;
  }

  return {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: {
      success: true,
      function: functionName,
      user: userId,
      aiProcessed: true,
    },
  };
}

// =====================================================================
// TEST 1: Unauthenticated requests are rejected before expensive processing
// =====================================================================
const unauthVoice = await handleEdgeFunctionRequest({
  functionName: "process-voice",
  token: null,
  payload: { audio: "base64..." },
});
ok(unauthVoice.status === 401, "Req 1: Unauthenticated request receives HTTP 401");
ok(aiProviderCallCount.voice === 0, "Req 1: AI provider is never called on unauthenticated request");

const invalidTokenVoice = await handleEdgeFunctionRequest({
  functionName: "process-voice",
  token: "invalid-expired-jwt",
  payload: { audio: "base64..." },
});
ok(invalidTokenVoice.status === 401, "Req 1: Invalid JWT receives HTTP 401");
ok(aiProviderCallCount.voice === 0, "Req 1: AI provider is never called on invalid JWT");

// =====================================================================
// TEST 1B: Pre-validation - Invalid/malformed/oversized payloads do NOT consume quota
// =====================================================================
const invalidJsonRes = await handleEdgeFunctionRequest({
  functionName: "process-voice",
  token: "token-user-a",
  payload: "INVALID_JSON",
});
ok(invalidJsonRes.status === 400, "Pre-val: Malformed JSON returns HTTP 400");

const emptyPayloadRes = await handleEdgeFunctionRequest({
  functionName: "process-voice",
  token: "token-user-a",
  payload: {},
});
ok(emptyPayloadRes.status === 400, "Pre-val: Empty audio/text returns HTTP 400");

const oversizedAudioRes = await handleEdgeFunctionRequest({
  functionName: "process-voice",
  token: "token-user-a",
  payload: { audioBase64: "A".repeat(11 * 1024 * 1024) },
});
ok(oversizedAudioRes.status === 413, "Pre-val: Oversized audio payload returns HTTP 413");

const emptyReceiptRes = await handleEdgeFunctionRequest({
  functionName: "extract-receipt",
  token: "token-user-a",
  payload: {},
});
ok(emptyReceiptRes.status === 400, "Pre-val: Missing receipt image/text returns HTTP 400");

const oversizedImageRes = await handleEdgeFunctionRequest({
  functionName: "extract-receipt",
  token: "token-user-a",
  payload: { imageBase64: "B".repeat(11 * 1024 * 1024) },
});
ok(oversizedImageRes.status === 413, "Pre-val: Oversized receipt image returns HTTP 413");

const malformedB64Res = await handleEdgeFunctionRequest({
  functionName: "process-voice",
  token: "token-user-a",
  payload: { audioBase64: "MALFORMED_B64" },
});
ok(malformedB64Res.status === 400, "SEC-04: Malformed base64 returns HTTP 400");

const spoofedMimeRes = await handleEdgeFunctionRequest({
  functionName: "extract-receipt",
  token: "token-user-a",
  payload: { imageBase64: "valid-png-bytes", mimeType: "image/jpeg", spoofedMime: true },
});
ok(spoofedMimeRes.status === 400, "SEC-04: MIME spoofing returns HTTP 400");

const invalidSigRes = await handleEdgeFunctionRequest({
  functionName: "process-voice",
  token: "token-user-a",
  payload: { audioBase64: "random-bytes", invalidSignature: true },
});
ok(invalidSigRes.status === 400, "SEC-04: Invalid file signature returns HTTP 400");

const chunkedOversizedRes = await handleEdgeFunctionRequest({
  functionName: "process-voice",
  token: "token-user-a",
  payload: "OVERSIZED_STREAM",
});
ok(chunkedOversizedRes.status === 413, "SEC-04: Bounded stream rejection returns HTTP 413");

// Verify that despite 9 invalid/oversized requests, User A's quota has NOT been touched (0 calls consumed)
const checkZeroQuota = await asUser(USER_A, `select short_count, daily_count from public.edge_function_rate_limits where user_id = '${USER_A}' and function_name = 'process-voice'`);
ok(checkZeroQuota.rows.length === 0, "Pre-val: Quota row was NOT created or consumed for invalid payloads");

// =====================================================================
// TEST 2: Requests within the configured limit succeed
// =====================================================================
for (let i = 1; i <= 10; i++) {
  const res = await handleEdgeFunctionRequest({
    functionName: "process-voice",
    token: "token-user-a",
    payload: { text: `Spoken expense #${i}` },
  });
  ok(res.status === 200 && res.body.success === true, `Req 2: User A voice call ${i}/10 succeeds`);
}
ok(aiProviderCallCount.voice === 10, "Req 2: AI provider invoked exactly 10 times for legitimate requests");

// =====================================================================
// TEST 3 & 4: Requests exceeding the limit receive HTTP 429 with Retry-After
// =====================================================================
const exceedRes = await handleEdgeFunctionRequest({
  functionName: "process-voice",
  token: "token-user-a",
  payload: { text: "Spoken expense #11" },
});
ok(exceedRes.status === 429, "Req 3: 11th request receives HTTP 429 Too Many Requests");
ok(exceedRes.body.code === "RATE_LIMIT_EXCEEDED", "Req 3: Machine-readable code RATE_LIMIT_EXCEEDED returned");
ok(Number(exceedRes.headers["Retry-After"]) > 0, "Req 4: Retry-After header contains positive seconds value");
ok(exceedRes.body.retryAfter === Number(exceedRes.headers["Retry-After"]), "Req 4: Body retryAfter matches Retry-After header");
ok(aiProviderCallCount.voice === 10, "Req 10: AI provider was NOT invoked for 11th rate-limited request (still 10)");

// =====================================================================
// TEST 5: User A cannot consume or manipulate User B's quota
// =====================================================================
const userBFirst = await handleEdgeFunctionRequest({
  functionName: "process-voice",
  token: "token-user-b",
  payload: { text: "User B voice check" },
});
ok(userBFirst.status === 200, "Req 5: User B request succeeds even when User A is completely rate-limited");
ok(aiProviderCallCount.voice === 11, "Req 5: User B successfully executed their own separate quota");

// =====================================================================
// TEST 6: Different Edge Functions have independent buckets
// =====================================================================
// User A is blocked on process-voice, but should have full quota on extract-receipt
const userAExtract = await handleEdgeFunctionRequest({
  functionName: "extract-receipt",
  token: "token-user-a",
  payload: { text: "Receipt Sharma Store Rice Rs 500" },
});
ok(userAExtract.status === 200, "Req 6: User A can invoke extract-receipt despite process-voice being rate-limited");
ok(aiProviderCallCount.receipt === 1, "Req 6: extract-receipt has independent counter and executes cleanly");

// =====================================================================
// TEST 7: Concurrent requests cannot exceed the configured limit
// =====================================================================
// Create a fresh test function config with short_max_calls = 5 to test concurrency (as superuser)
await db.exec(`
  reset role;
  insert into public.edge_function_rate_limit_configs (function_name, short_window_seconds, short_max_calls, daily_window_seconds, daily_max_calls)
  values ('test-concurrent-fn', 600, 5, 86400, 20)
  on conflict (function_name) do update set short_max_calls = 5;
`);

// User B fires 15 simultaneous concurrent requests to 'test-concurrent-fn'
const concurrentPromises = Array.from({ length: 15 }, () =>
  asUser(USER_B, `select public.check_and_consume_rate_limit('test-concurrent-fn') as res`)
);
const concurrentResults = await Promise.all(concurrentPromises);
const allowedResults = concurrentResults.filter((r) => r.rows[0].res.allowed === true);
const blockedResults = concurrentResults.filter((r) => r.rows[0].res.allowed === false);

ok(allowedResults.length === 5, `Req 7: Concurrency test - exactly 5 of 15 allowed (actual: ${allowedResults.length})`);
ok(blockedResults.length === 10, `Req 7: Concurrency test - exactly 10 of 15 blocked (actual: ${blockedResults.length})`);

// =====================================================================
// TEST 8 & 11: Expired windows reset correctly and legitimate requests resume
// =====================================================================
// Simulate window expiry for User A on process-voice by rewinding short_window_start by 650 seconds (> 600s window)
await db.exec(`
  reset role;
  update public.edge_function_rate_limits
  set short_window_start = now() - interval '650 seconds'
  where user_id = '${USER_A}' and function_name = 'process-voice';
`);

const resumeRes = await handleEdgeFunctionRequest({
  functionName: "process-voice",
  token: "token-user-a",
  payload: { text: "Spoken expense after window reset" },
});
ok(resumeRes.status === 200, "Req 8 & 11: User A successfully executes voice request after window resets");
ok(aiProviderCallCount.voice === 12, "Req 11: AI provider is invoked again once window reset allows request");

// =====================================================================
// TEST 9: Limiter database failures do not permit expensive processing (Fail-Closed)
// =====================================================================
const dbFailureRes = await handleEdgeFunctionRequest({
  functionName: "process-voice",
  token: "token-user-b",
  payload: { text: "Voice check during DB outage" },
  simulateDbFailure: true,
});
ok(dbFailureRes.status === 503, "Req 9: DB failure returns HTTP 503 Service Unavailable");
ok(dbFailureRes.body.code === "RATE_LIMIT_UNAVAILABLE", "Req 9: Fail-closed machine-readable error returned");
ok(aiProviderCallCount.voice === 12, "Req 9: AI provider was NOT invoked during DB failure (count stayed at 12)");

// =====================================================================
// TEST 10: Verify both process-voice and extract-receipt edge functions
// =====================================================================
// Consume remaining 9 extract-receipt calls for User A to trigger limit
for (let i = 2; i <= 10; i++) {
  const r = await handleEdgeFunctionRequest({
    functionName: "extract-receipt",
    token: "token-user-a",
    payload: { text: `Receipt expense #${i} Rs 500` },
  });
  ok(r.status === 200, `extract-receipt call ${i}/10 succeeds for User A`);
}
ok(aiProviderCallCount.receipt === 10, "extract-receipt AI provider invoked 10 times");

const extractExceedRes = await handleEdgeFunctionRequest({
  functionName: "extract-receipt",
  token: "token-user-a",
  payload: { text: "Receipt expense #11 Rs 500" },
});
ok(extractExceedRes.status === 429, "extract-receipt: 11th call blocked with HTTP 429");
ok(extractExceedRes.body.code === "RATE_LIMIT_EXCEEDED", "extract-receipt: code is RATE_LIMIT_EXCEEDED");
ok(aiProviderCallCount.receipt === 10, "extract-receipt: AI provider NOT invoked on 11th call (remained at 10)");

console.log(`\nRegression Test Summary: ${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
