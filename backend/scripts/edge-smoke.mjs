// Authenticated smoke test for the deployed Edge Functions.
// Signs in with a test account (prompted, password hidden), calls process-voice and
// extract-receipt with fictional text, prints status codes and a short summary, signs out.
// Edge Functions only return candidates; nothing is written to the database.
// Usage: cd backend && npm run test:edge-smoke
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import readline from "node:readline";

function readEnv(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, "utf8").split("\n")
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]),
  );
}
const env = { ...readEnv("../frontend/.env"), ...readEnv("../frontend/.env.local"), ...process.env };
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) { console.error("VITE_SUPABASE_URL and a publishable/anon key are required in frontend/.env.local"); process.exit(1); }

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = (s) => { if (s.includes(question)) process.stdout.write(s); };
    rl.question(question, (a) => { rl.close(); if (hidden) process.stdout.write("\n"); resolve(a.trim()); });
  });
}

const email = env.SMOKE_EMAIL || await ask("Test account email: ");
const password = env.SMOKE_PASSWORD || await ask("Test account password (hidden): ", true);

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
if (error || !data.session) { console.error("Sign-in failed:", error?.message); process.exit(1); }
const token = data.session.access_token;

let failed = 0;
async function call(fn, body, summarize) {
  const res = await fetch(`${url}/functions/v1/${fn}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  const ok = res.status === 200;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${fn}: HTTP ${res.status} ${ok ? summarize(json) : JSON.stringify(json).slice(0, 200)}`);
}

await call("process-voice", { text: "Got 650 rupees from a delivery payout today and spent 120 on petrol" },
  (j) => `candidates=${(j.candidates ?? j.transactions ?? []).length} keys=${Object.keys(j).join(",")}`);
await call("extract-receipt", { text: "SHARMA KIRANA STORE\nDate: 21/11/2026\nRice 5kg 320.00\nOil 1L 180.00\nTOTAL Rs 500.00\nPaid by UPI" },
  (j) => `keys=${Object.keys(j).join(",")}`);

await supabase.auth.signOut();
console.log(failed ? `\n${failed} check(s) failed` : "\nAll authenticated Edge Function checks passed");
process.exit(failed ? 1 : 0);
