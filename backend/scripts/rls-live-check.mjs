// Live RLS check against the REAL Supabase project (run after applying the migration).
// Needs two throwaway accounts in backend/.env.local (see backend/.env.example). Uses only the
// publishable key, exactly like the browser. Usage: cd backend && npm run test:rls-live
import { createClient } from "@supabase/supabase-js";

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: key,
  RLS_TEST_A_EMAIL, RLS_TEST_A_PASSWORD, RLS_TEST_B_EMAIL, RLS_TEST_B_PASSWORD } = process.env;
if (!url || !key || !RLS_TEST_A_EMAIL || !RLS_TEST_B_EMAIL) {
  console.error("Fill VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY and the RLS_TEST_* accounts in backend/.env.local");
  process.exit(1);
}
let failed = 0;
const check = (cond, msg) => { console.log(cond ? "  PASS" : "  FAIL", msg); if (!cond) failed++; };
const client = () => createClient(url, key, { auth: { persistSession: false } });

async function login(email, password) {
  const c = client();
  let { error } = await c.auth.signInWithPassword({ email, password });
  if (error) {
    const su = await c.auth.signUp({ email, password });
    if (su.error) throw new Error(`Cannot sign in or sign up ${email}: ${su.error.message}`);
    ({ error } = await c.auth.signInWithPassword({ email, password }));
    if (error) throw new Error(`${email} created; confirm the email (or turn off email confirmation for the hackathon), then rerun.`);
  }
  return c;
}

const a = await login(RLS_TEST_A_EMAIL, RLS_TEST_A_PASSWORD);
const b = await login(RLS_TEST_B_EMAIL, RLS_TEST_B_PASSWORD);

const prof = await a.from("profiles").select("*").single();
check(!prof.error && prof.data, "A has an auto-created profile");

const ins = await a.from("transactions").insert({ type: "income", amount: "650.00", category: "earnings", description: "rls-live-check" }).select().single();
check(!ins.error, "A can insert a transaction" + (ins.error ? `: ${ins.error.message}` : ""));
const id = ins.data?.id;

const readA = await a.from("transactions").select("id").eq("id", id);
check(readA.data?.length === 1, "A can read it back");

const readB = await b.from("transactions").select("id").eq("id", id);
check(!readB.error && readB.data.length === 0, "B cannot read A's transaction");

const updB = await b.from("transactions").update({ amount: "1.00" }).eq("id", id).select();
check(!updB.error && updB.data.length === 0, "B cannot update A's transaction");

const delB = await b.from("transactions").delete().eq("id", id).select();
check(!delB.error && delB.data.length === 0, "B cannot delete A's transaction");

const profB = await b.from("profiles").select("id");
check(profB.data?.length === 1, "B sees only one profile (their own)");

const anon = await client().from("transactions").select("id").limit(1);
check(anon.error || anon.data.length === 0, "Signed-out visitor gets nothing");

await a.from("transactions").delete().eq("id", id);
console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll live RLS checks passed");
process.exit(failed ? 1 : 0);
