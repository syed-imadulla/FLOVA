// Local DB test: runs the FLOVA migration on PGlite (real Postgres in WASM) with
// Supabase-like auth stubs, then checks RLS isolation, constraints and payout sync.
// Usage: cd backend && npm install && npm run test:db
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";

const db = new PGlite();
const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  PASS", m); } else { fail++; console.log("  FAIL", m); } };
async function expectError(sql, m) { try { await db.exec(sql); ok(false, m + " (no error)"); } catch (e) { ok(true, m + " -> " + e.message.split("\n")[0]); } }

// --- Supabase stand-ins ---
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
  try {
    await db.exec(fs.readFileSync(new URL(`../supabase/migrations/${file}`, import.meta.url), "utf8"));
  } catch (err) {
    console.error(`Error applying migration ${file}:`, err.message);
    throw err;
  }
}

await db.exec(`
  grant usage on schema public to authenticated, anon;
`);
console.log(`applied ${files.length} migration(s): ${files.join(", ")}`);

// sign-up trigger
await db.exec(`insert into auth.users (id, raw_user_meta_data) values ('${A}', '{"display_name":"Ravi"}'), ('${B}', '{}');`);
const prof = await db.query(`select id, display_name, work_profile from public.profiles order by id`);
ok(prof.rows.length === 2 && prof.rows[0].display_name === "Ravi", "profiles auto-created on sign-up");

const as = async (uid, sql) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid}', false); set role authenticated;`);
  return db.query(sql);
};
async function asError(uid, sql, m) {
  try {
    await as(uid, sql);
    ok(false, m + " (no error)");
  } catch (e) {
    ok(true, m + " -> " + e.message.split("\n")[0]);
  }
}

// User A writes data (user_id comes from the default auth.uid())
await as(A, `insert into public.balance_checkins (cash_amount, bank_amount, not_mine_amount) values (1500, 2500, 600)`);
const pay = await as(A, `insert into public.payouts (source, expected_amount, expected_date) values ('Platform', 1800, '2026-11-23') returning id`);
const payId = pay.rows[0].id;
await as(A, `insert into public.transactions (type, amount, category) values ('income', 650, 'earnings')`);
await as(A, `insert into public.transactions (type, amount, category, expense_type) values ('expense', 120, 'fuel', 'work')`);
await as(A, `insert into public.commitments (title, amount, due_date, category) values ('Rent', 4500, '2026-11-21', 'rent')`);
ok((await as(A, `select count(*)::int c from public.transactions`)).rows[0].c === 2, "A reads own transactions");

// User B: isolation
ok((await as(B, `select count(*)::int c from public.transactions`)).rows[0].c === 0, "B cannot read A's transactions");
ok((await as(B, `select count(*)::int c from public.balance_checkins`)).rows[0].c === 0, "B cannot read A's check-ins");
ok((await as(B, `select count(*)::int c from public.payouts`)).rows[0].c === 0, "B cannot read A's payouts");
ok((await as(B, `select count(*)::int c from public.commitments`)).rows[0].c === 0, "B cannot read A's commitments");
ok((await as(B, `select count(*)::int c from public.profiles`)).rows[0].c === 1, "B sees only own profile");
const upd = await as(B, `update public.transactions set amount = 1 returning id`);
ok(upd.rows.length === 0, "B cannot update A's transactions");
const del = await as(B, `delete from public.commitments returning id`);
ok(del.rows.length === 0, "B cannot delete A's commitments");
await as(B, `select 1`);
await expectError(`insert into public.transactions (user_id, type, amount) values ('${A}', 'income', 99)`, "B cannot insert rows as A");
await expectError(`insert into public.transactions (type, amount, payout_id) values ('income', 10, '${payId}')`, "B cannot link income to A's payout");

// constraints
await as(A, `select 1`);
await expectError(`insert into public.transactions (type, amount) values ('expense', 50)`, "own expense requires expense_type");
await expectError(`insert into public.transactions (type, amount, expense_type) values ('income', 50, 'work')`, "income must not have expense_type");
await expectError(`insert into public.transactions (type, amount) values ('income', 0)`, "amount must be > 0");
await expectError(`insert into public.balance_checkins (cash_amount, bank_amount, not_mine_amount) values (100, 0, 200)`, "not_mine cannot exceed total");
await as(A, `insert into public.transactions (type, amount, ownership, category) values ('income', 600, 'not_mine', 'cod_collection')`);
ok(true, "COD collection stored as not_mine income without expense_type");

// transaction updates and check constraints (expense_type_rule)
const editTxRow = (await as(A, `insert into public.transactions (type, amount, category, expense_type) values ('expense', 100, 'fuel', 'work') returning id`)).rows[0].id;
// update expense to income: must clear expense_type to null
await as(A, `update public.transactions set type = 'income', category = 'earnings', expense_type = null, description = 'for my pocket' where id = '${editTxRow}'`);
const updatedRow = (await as(A, `select type, category, expense_type, description from public.transactions where id = '${editTxRow}'`)).rows[0];
ok(updatedRow.type === 'income' && updatedRow.category === 'earnings' && updatedRow.expense_type === null && updatedRow.description === 'for my pocket', "Expense updated to personal income successfully with null expense_type");

// updating income with an expense_type must fail check constraint expense_type_rule
await expectError(`update public.transactions set expense_type = 'living' where id = '${editTxRow}'`, "income update with expense_type rejected by expense_type_rule");

// update to not_mine: must clear expense_type to null
const editTxNotMine = (await as(A, `insert into public.transactions (type, amount, category, expense_type) values ('expense', 250, 'supplies', 'work') returning id`)).rows[0].id;
await as(A, `update public.transactions set ownership = 'not_mine', expense_type = null where id = '${editTxNotMine}'`);
const updatedNotMine = (await as(A, `select ownership, expense_type from public.transactions where id = '${editTxNotMine}'`)).rows[0];
ok(updatedNotMine.ownership === 'not_mine' && updatedNotMine.expense_type === null, "Transaction updated to not_mine with null expense_type");

// not_mine with expense_type must fail check constraint expense_type_rule
await expectError(`update public.transactions set expense_type = 'work' where id = '${editTxNotMine}'`, "not_mine update with expense_type rejected by expense_type_rule");

// payout sync: partial then settled, and no direct edits
await as(A, `insert into public.transactions (type, amount, category, payout_id) values ('income', 500, 'payout', '${payId}')`);
let p = (await as(A, `select received_amount::text r, status from public.payouts where id = '${payId}'`)).rows[0];
ok(p.r === "500.00" && p.status === "partial", `partial payout -> ${p.r} ${p.status}`);
await as(A, `insert into public.transactions (type, amount, category, payout_id) values ('income', 1300, 'payout', '${payId}')`);
p = (await as(A, `select received_amount::text r, status from public.payouts where id = '${payId}'`)).rows[0];
ok(p.r === "1800.00" && p.status === "settled", `settled payout -> ${p.r} ${p.status}`);
await as(A, `delete from public.transactions where payout_id = '${payId}' and amount = 1300`);
p = (await as(A, `select received_amount::text r, status from public.payouts where id = '${payId}'`)).rows[0];
ok(p.r === "500.00" && p.status === "partial", `deleting a receipt rolls back -> ${p.r} ${p.status}`);
await expectError(`update public.payouts set received_amount = 1800 where id = '${payId}'`, "received_amount cannot be edited directly");
await as(A, `update public.payouts set note = 'checked' where id = '${payId}'`);
ok(true, "other payout fields stay editable");

// anon gets nothing
await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false); set role anon;`);
await expectError(`select * from public.transactions`, "anon has no table access");

// generalized profiles, income variability, and COD capability tests
await as(A, `select 1`);
const allProfiles = ['delivery', 'driver', 'service', 'freelancer', 'independent_business', 'small_vendor', 'daily_wage', 'seasonal_worker', 'other'];
for (const wp of allProfiles) {
  await as(A, `update public.profiles set work_profile = '${wp}' where id = '${A}'`);
  const checkWp = (await as(A, `select work_profile from public.profiles where id = '${A}'`)).rows[0].work_profile;
  ok(checkWp === wp, `work_profile '${wp}' supported cleanly`);
}

const allVariabilities = ['regular', 'variable', 'unpredictable', 'seasonal', 'intermittent'];
for (const iv of allVariabilities) {
  await as(A, `update public.profiles set income_variability = '${iv}' where id = '${A}'`);
  const checkIv = (await as(A, `select income_variability from public.profiles where id = '${A}'`)).rows[0].income_variability;
  ok(checkIv === iv, `income_variability '${iv}' supported cleanly`);
}

await as(A, `update public.profiles set handles_cod = true, safe_runway_buffer = 1500.00 where id = '${A}'`);
const profA = (await as(A, `select handles_cod, safe_runway_buffer::text s from public.profiles where id = '${A}'`)).rows[0];
ok(profA.handles_cod === true && profA.s === "1500.00", "handles_cod and safe_runway_buffer stored cleanly");

await expectError(`update public.profiles set safe_runway_buffer = -100 where id = '${A}'`, "negative safe_runway_buffer rejected");

// ₹10 Lakh individual and daily aggregate limit verification
await as(A, `select 1`);
await expectError(
  `insert into public.transactions (type, amount, category) values ('income', 1000000.01, 'salary')`,
  "individual transaction over ₹10 Lakh rejected"
);

// Transaction 1 on 2026-11-25: ₹6,00,000 (succeeds)
await as(A, `insert into public.transactions (id, type, amount, category, transaction_date) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'income', 600000.00, 'salary', '2026-11-25')`);
ok(true, "transaction within ₹10 Lakh on calendar day succeeds");

// Transaction 2 on same day (2026-11-25): ₹5,00,000 (total = ₹11,00,000 > ₹10,00,000 -> rejected)
await expectError(
  `insert into public.transactions (type, amount, category, expense_type, transaction_date) values ('expense', 500000.00, 'maintenance', 'work', '2026-11-25')`,
  "daily aggregate exceeding ₹10 Lakh on same calendar day rejected"
);

// Third-party funds (ownership = 'not_mine') on same day (2026-11-25): ₹5,00,000 (succeeds, does not count against personal aggregate)
await as(A, `insert into public.transactions (type, amount, category, ownership, transaction_date) values ('income', 500000.00, 'cod_collection', 'not_mine', '2026-11-25')`);
ok(true, "third-party (not_mine) funds excluded from personal daily aggregate limit");

// Transaction on a different calendar day (2026-11-26): ₹6,00,000 (succeeds)
await as(A, `insert into public.transactions (type, amount, category, transaction_date) values ('income', 600000.00, 'salary', '2026-11-26')`);
ok(true, "transaction on different calendar day evaluated against its own day limit");

// User B on 2026-11-25: ₹6,00,000 (succeeds, isolated per user)
await as(B, `insert into public.transactions (type, amount, category, transaction_date) values ('income', 600000.00, 'salary', '2026-11-25')`);
ok(true, "user daily aggregate is strictly isolated per authenticated user");

const C = "33333333-3333-3333-3333-333333333333";
await db.exec(`reset role; insert into auth.users (id, raw_user_meta_data) values ('${C}', '{"display_name":"New Irregular Earner"}');`);
const profC = (await db.query(`select work_profile, income_variability, handles_cod from public.profiles where id = '${C}'`)).rows[0];
ok(profC.work_profile === "other" && profC.income_variability === "variable" && profC.handles_cod === false, "new sign-up defaults to work_profile='other', variability='variable', handles_cod=false");

// Invoices & Settlements RLS and trigger verification (Phase 15 + SEC-01)
const invRes = await as(A, `insert into public.invoices (user_id, direction, customer_name, total_amount, due_date) values ('${A}', 'receivable', 'Acme Corp', 8000.00, '2026-12-01') returning id, status, paid_amount`);
const invId = invRes.rows[0].id;
ok(invRes.rows[0].status === "unpaid" && Number(invRes.rows[0].paid_amount) === 0, "invoice created as unpaid with 0.00 paid");

const bInvoices = await as(B, `select * from public.invoices`);
ok(bInvoices.rows.length === 0, "B cannot read A's invoices");

await as(A, `insert into public.invoice_items (invoice_id, name, amount) values ('${invId}', 'UI Design', 8000.00)`);
const bItems = await as(B, `select * from public.invoice_items`);
ok(bItems.rows.length === 0, "B cannot read A's invoice items");

// 1 & 2. Partial settlement of ₹5,000 by User A (legitimate settlement)
const setResA = await as(A, `insert into public.invoice_settlements (invoice_id, user_id, amount, notes) values ('${invId}', '${A}', 5000.00, 'Advance payment') returning id`);
const setIdA = setResA.rows[0].id;
const invPartial = (await as(A, `select paid_amount, status from public.invoices where id = '${invId}'`)).rows[0];
ok(Number(invPartial.paid_amount) === 5000 && invPartial.status === "partially_paid", "settlement trigger updates invoice to partially_paid (5000.00)");

// 3. User B cannot insert a settlement against User A's invoice (neither with user_id = B nor user_id = A)
await asError(B, `insert into public.invoice_settlements (invoice_id, user_id, amount) values ('${invId}', '${B}', 1000.00)`, "SEC-01: B cannot insert settlement against A's invoice with user_id = B");
await asError(B, `insert into public.invoice_settlements (invoice_id, user_id, amount) values ('${invId}', '${A}', 1000.00)`, "SEC-01: B cannot insert settlement against A's invoice with user_id = A");

// 4. User B cannot update or delete User A's settlement
const bUpdSet = await as(B, `update public.invoice_settlements set amount = 999 where id = '${setIdA}' returning id`);
ok(bUpdSet.rows.length === 0, "SEC-01: B cannot update A's invoice settlement");
const bDelSet = await as(B, `delete from public.invoice_settlements where id = '${setIdA}' returning id`);
ok(bDelSet.rows.length === 0, "SEC-01: B cannot delete A's invoice settlement");

// 5. User B cannot manipulate User A's invoice payment status
const invAfterB = (await as(A, `select paid_amount, status from public.invoices where id = '${invId}'`)).rows[0];
ok(Number(invAfterB.paid_amount) === 5000 && invAfterB.status === "partially_paid", "SEC-01: User A invoice payment status unmanipulated by B");

// Legitimate: Remaining settlement of ₹3,000 by User A
await as(A, `insert into public.invoice_settlements (invoice_id, user_id, amount, notes) values ('${invId}', '${A}', 3000.00, 'Final payment')`);
const invFull = (await as(A, `select paid_amount, status from public.invoices where id = '${invId}'`)).rows[0];
ok(Number(invFull.paid_amount) === 8000 && invFull.status === "paid", "second settlement updates invoice to paid (8000.00)");

// WISH 2.0 Goals & Contributions RLS and trigger verification (Phase 15 + SEC-01)
const wishRes = await as(A, `insert into public.wish_goals (user_id, title, target_amount) values ('${A}', 'New Laptop', 50000.00) returning id, status, saved_amount`);
const wishId = wishRes.rows[0].id;
ok(wishRes.rows[0].status === "active" && Number(wishRes.rows[0].saved_amount) === 0, "wish goal created with status active");

const bWish = await as(B, `select * from public.wish_goals`);
ok(bWish.rows.length === 0, "B cannot read A's wish goals");

// 1 & 2. User A can contribute to their own goal (₹20,000)
const contribResA = await as(A, `insert into public.wish_contributions (goal_id, user_id, amount) values ('${wishId}', '${A}', 20000.00) returning id`);
const contribIdA = contribResA.rows[0].id;
const wishPartial = (await as(A, `select saved_amount, status from public.wish_goals where id = '${wishId}'`)).rows[0];
ok(Number(wishPartial.saved_amount) === 20000 && wishPartial.status === "active", "wish contribution syncs saved_amount to 20000.00");

// 3. User B cannot insert a contribution against User A's goal (neither with user_id = B nor user_id = A)
await asError(B, `insert into public.wish_contributions (goal_id, user_id, amount) values ('${wishId}', '${B}', 10000.00)`, "SEC-01: B cannot insert contribution against A's wish goal with user_id = B");
await asError(B, `insert into public.wish_contributions (goal_id, user_id, amount) values ('${wishId}', '${A}', 10000.00)`, "SEC-01: B cannot insert contribution against A's wish goal with user_id = A");

// 4. User B cannot update or delete User A's contribution
const bUpdContrib = await as(B, `update public.wish_contributions set amount = 999 where id = '${contribIdA}' returning id`);
ok(bUpdContrib.rows.length === 0, "SEC-01: B cannot update A's wish contribution");
const bDelContrib = await as(B, `delete from public.wish_contributions where id = '${contribIdA}' returning id`);
ok(bDelContrib.rows.length === 0, "SEC-01: B cannot delete A's wish contribution");

// 5. User B cannot manipulate User A's goal progress
const wishAfterB = (await as(A, `select saved_amount, status from public.wish_goals where id = '${wishId}'`)).rows[0];
ok(Number(wishAfterB.saved_amount) === 20000 && wishAfterB.status === "active", "SEC-01: User A wish goal progress unmanipulated by B");

// Legitimate: User A completes wish goal by contributing remaining ₹30,000
await as(A, `insert into public.wish_contributions (goal_id, user_id, amount) values ('${wishId}', '${A}', 30000.00)`);
const wishFull = (await as(A, `select saved_amount, status from public.wish_goals where id = '${wishId}'`)).rows[0];
ok(Number(wishFull.saved_amount) === 50000 && wishFull.status === "completed", "wish goal completes when saved >= target");

// --- 20261123150000_harden_anon_and_triggers ---
// Reproduce Supabase's default privileges (anon full table access, PUBLIC/anon EXECUTE),
// then re-apply the hardening migration and check what remains.
await db.exec(`reset role;
  grant all on public.invoices, public.invoice_items, public.invoice_settlements, public.wish_goals, public.wish_contributions to anon;
  grant execute on function public.check_daily_transaction_limit(), public.sync_invoice_settlement(), public.sync_wish_contribution(), public.handle_new_user() to public, anon, authenticated;`);
await db.exec(fs.readFileSync(new URL("../supabase/migrations/20261123150000_harden_anon_and_triggers.sql", import.meta.url), "utf8"));
const phase16 = ["invoices", "invoice_items", "invoice_settlements", "wish_goals", "wish_contributions"];
const anonGrants = await db.query(`select count(*)::int c from information_schema.role_table_grants where grantee = 'anon' and table_schema = 'public' and table_name = any($1)`, [phase16]);
ok(anonGrants.rows[0].c === 0, "hardening: anon holds no grants on Phase 16 tables");
const anonExec = await db.query(`select count(*)::int c from unnest(array['public.check_daily_transaction_limit()','public.sync_invoice_settlement()','public.sync_wish_contribution()','public.handle_new_user()']) f where has_function_privilege('anon', f, 'EXECUTE')`);
ok(anonExec.rows[0].c === 0, "hardening: anon cannot EXECUTE trigger functions");
ok(!(await db.query(`select has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE') x`)).rows[0].x, "hardening: authenticated cannot EXECUTE handle_new_user");
const authGrants = await db.query(`select count(distinct table_name)::int c from information_schema.role_table_grants where grantee = 'authenticated' and privilege_type = 'INSERT' and table_schema = 'public' and table_name = any($1)`, [phase16]);
ok(authGrants.rows[0].c === phase16.length, "hardening: authenticated keeps table grants on Phase 16 tables");

// Triggers must still fire for authenticated even with no EXECUTE on the trigger function at all.
await db.exec(`revoke execute on function public.check_daily_transaction_limit(), public.sync_wish_contribution() from public, anon, authenticated;`);
const wish2 = (await as(A, `insert into public.wish_goals (user_id, title, target_amount) values ('${A}', 'Phone', 10000.00) returning id`)).rows[0].id;
await as(A, `insert into public.wish_contributions (goal_id, user_id, amount) values ('${wish2}', '${A}', 4000.00)`);
ok(Number((await as(A, `select saved_amount from public.wish_goals where id = '${wish2}'`)).rows[0].saved_amount) === 4000, "hardening: SECURITY DEFINER trigger fires without EXECUTE grant");
await expectError(`insert into public.transactions (type, amount, category) values ('income', 1000000, 'earnings')`, "hardening: daily limit trigger still enforced without EXECUTE grant");

// =====================================================================
// SEC-03: Edge Function Rate Limiting Regression Tests (20261123170000)
// =====================================================================

// 1. Seeded configurations exist
const configs = await db.query(`select function_name, short_max_calls, daily_max_calls from public.edge_function_rate_limit_configs order by function_name`);
ok(configs.rows.length === 2 && configs.rows[0].function_name === "extract-receipt" && configs.rows[1].function_name === "process-voice", "SEC-03: rate limit configs seeded for extract-receipt and process-voice");

// 2. Anon cannot execute check_and_consume_rate_limit
await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false); set role anon;`);
await expectError(`select public.check_and_consume_rate_limit('process-voice')`, "SEC-03: anon cannot execute check_and_consume_rate_limit");

// 3. Authenticated without auth.uid() fails closed
await asError("", `select public.check_and_consume_rate_limit('process-voice')`, "SEC-03: unauthenticated call rejected with insufficient privilege");

// 4. Invalid function name rejected
await asError(A, `select public.check_and_consume_rate_limit('unknown-malicious-func')`, "SEC-03: unconfigured function name rejected");

// 5. User A consumes quota for process-voice up to short window limit (10)
let lastResA = null;
for (let i = 1; i <= 10; i++) {
  const r = await as(A, `select public.check_and_consume_rate_limit('process-voice') as res`);
  lastResA = r.rows[0]?.res;
  ok(lastResA && lastResA.allowed === true && lastResA.short_count === i, `SEC-03: User A call ${i}/10 allowed on process-voice`);
}

// 6. User A exceeds short window limit (11th request receives allowed: false, 429 details)
const exceedResA = (await as(A, `select public.check_and_consume_rate_limit('process-voice') as res`)).rows[0].res;
ok(exceedResA.allowed === false && exceedResA.reason === "short_window_exceeded" && exceedResA.retry_after > 0, "SEC-03: User A 11th call blocked with short_window_exceeded and retry_after");

// 7. Isolation between users: User B's quota is unaffected by User A's consumption
const userBRes = (await as(B, `select public.check_and_consume_rate_limit('process-voice') as res`)).rows[0].res;
ok(userBRes.allowed === true && userBRes.short_count === 1, "SEC-03: User B has independent quota on process-voice unaffected by User A");

// 8. Isolation between functions: User A can still invoke extract-receipt (separate bucket)
const userAExtractRes = (await as(A, `select public.check_and_consume_rate_limit('extract-receipt') as res`)).rows[0].res;
ok(userAExtractRes.allowed === true && userAExtractRes.short_count === 1, "SEC-03: User A has independent bucket for extract-receipt despite process-voice limit");

// 9. Cross-user rate limit visibility isolation via RLS
const bViewLimits = await as(B, `select * from public.edge_function_rate_limits`);
ok(bViewLimits.rows.length === 1 && bViewLimits.rows[0].user_id === B, "SEC-03: User B cannot see User A's rate limit records in table");

// 10. Direct manipulation prevention: authenticated users cannot directly update or delete rate limit state
await asError(A, `update public.edge_function_rate_limits set short_count = 0 returning id`, "SEC-03: Authenticated user cannot directly reset short_count via UPDATE");
await asError(A, `delete from public.edge_function_rate_limits returning id`, "SEC-03: Authenticated user cannot delete rate limit records via DELETE");

// =====================================================================
// SEC-06: Database Function Permission Hardening (20261123180000)
// =====================================================================

// 1. Reset role and re-apply migration 18 to ensure test assertions validate exact post-migration state
await db.exec(`reset role;`);
await db.exec(fs.readFileSync(new URL("../supabase/migrations/20261123180000_harden_function_permissions.sql", import.meta.url), "utf8"));

// 2. Privilege checks: Anon role has NO execute rights on any functions in public
const anonFuncs = [
  "public.sync_payout_received(uuid)",
  "public.transactions_sync_payout()",
  "public.payouts_guard_received()",
  "public.set_updated_at()",
  "public.check_daily_transaction_limit()",
  "public.sync_invoice_settlement()",
  "public.sync_wish_contribution()",
  "public.handle_new_user()",
  "public.check_and_consume_rate_limit(text)"
];
for (const f of anonFuncs) {
  const hasPriv = (await db.query(`select has_function_privilege('anon', $1, 'EXECUTE') as priv`, [f])).rows[0].priv;
  ok(!hasPriv, `SEC-06: anon cannot execute ${f}`);
}

// 3. Privilege checks: Authenticated role has NO execute rights on internal/trigger functions
const authBlockedFuncs = [
  "public.sync_payout_received(uuid)",
  "public.transactions_sync_payout()",
  "public.payouts_guard_received()",
  "public.set_updated_at()",
  "public.check_daily_transaction_limit()",
  "public.sync_invoice_settlement()",
  "public.sync_wish_contribution()",
  "public.handle_new_user()"
];
for (const f of authBlockedFuncs) {
  const hasPriv = (await db.query(`select has_function_privilege('authenticated', $1, 'EXECUTE') as priv`, [f])).rows[0].priv;
  ok(!hasPriv, `SEC-06: authenticated cannot execute ${f}`);
}

// 4. Authenticated role retains execute on intentional PostgREST RPC function
const rateLimitPriv = (await db.query(`select has_function_privilege('authenticated', 'public.check_and_consume_rate_limit(text)', 'EXECUTE') as priv`)).rows[0].priv;
ok(rateLimitPriv, "SEC-06: authenticated retains EXECUTE on check_and_consume_rate_limit(text)");

// 5. Direct invocation rejection via SQL (simulating PostgREST RPC attempt)
await asError(A, `select public.sync_payout_received('${payId}')`, "SEC-06: direct call to sync_payout_received rejected for authenticated user");
await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false); set role anon;`);
await expectError(`select public.sync_payout_received('${payId}')`, "SEC-06: direct call to sync_payout_received rejected for anon");
await asError(A, `select public.transactions_sync_payout()`, "SEC-06: direct call to transactions_sync_payout rejected for authenticated user");
await asError(A, `select public.payouts_guard_received()`, "SEC-06: direct call to payouts_guard_received rejected for authenticated user");
await asError(A, `select public.set_updated_at()`, "SEC-06: direct call to set_updated_at rejected for authenticated user");

// 6. Security Definer and search_path verification
const secDefRows = (await db.query(`
  select p.proname, p.prosecdef, array_to_string(p.proconfig, ',') as config
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('sync_payout_received', 'transactions_sync_payout', 'payouts_guard_received', 'set_updated_at')
`)).rows;

const secDefMap = Object.fromEntries(secDefRows.map(r => [r.proname, r]));
ok(secDefMap['sync_payout_received']?.prosecdef === true, "SEC-06: sync_payout_received is SECURITY DEFINER");
ok(secDefMap['sync_payout_received']?.config?.includes("search_path=public, pg_temp"), "SEC-06: sync_payout_received has explicit search_path");
ok(secDefMap['transactions_sync_payout']?.prosecdef === true, "SEC-06: transactions_sync_payout is SECURITY DEFINER");
ok(secDefMap['transactions_sync_payout']?.config?.includes("search_path=public, pg_temp"), "SEC-06: transactions_sync_payout has explicit search_path");
ok(secDefMap['payouts_guard_received']?.config?.includes("search_path=public, pg_temp"), "SEC-06: payouts_guard_received has explicit search_path");
ok(secDefMap['set_updated_at']?.config?.includes("search_path=public, pg_temp"), "SEC-06: set_updated_at has explicit search_path");

// 7. Legitimate payout workflow verification through trigger execution (internal SECURITY DEFINER path)
const sec06Pay = (await as(A, `insert into public.payouts (source, expected_amount, expected_date) values ('Swiggy', 3000, '2026-11-24') returning id`)).rows[0].id;
await as(A, `insert into public.transactions (type, amount, category, payout_id) values ('income', 1200, 'payout', '${sec06Pay}')`);
const payAfterSync = (await as(A, `select received_amount::text r, status from public.payouts where id = '${sec06Pay}'`)).rows[0];
ok(payAfterSync.r === "1200.00" && payAfterSync.status === "partial", "SEC-06: payout sync trigger succeeds for authenticated user without direct function execute");

// 8. payouts_guard_received trigger still protects received_amount against direct updates
await asError(A, `update public.payouts set received_amount = 9999 where id = '${sec06Pay}'`, "SEC-06: payouts_guard_received trigger still enforces tamper protection");

// 9. Cross-user payout tampering defense: composite foreign key (payout_id, user_id) prevents abuse
await asError(
  B,
  `insert into public.transactions (type, amount, category, payout_id) values ('income', 500, 'payout', '${sec06Pay}')`,
  "Cross-user payout abuse: User B cannot link transaction to User A's payout"
);
const bTx = (await as(B, `insert into public.transactions (type, amount, category) values ('income', 100, 'freelance') returning id`)).rows[0].id;
await asError(
  B,
  `update public.transactions set payout_id = '${sec06Pay}' where id = '${bTx}'`,
  "Cross-user payout abuse: User B cannot re-parent existing transaction to User A's payout"
);
const payUnchanged = (await as(A, `select received_amount::text r, status from public.payouts where id = '${sec06Pay}'`)).rows[0];
ok(payUnchanged.r === "1200.00" && payUnchanged.status === "partial", "Cross-user payout abuse: User A's payout remains uncorrupted");

// 10. ALTER DEFAULT PRIVILEGES verification: future functions in public schema deny EXECUTE to anon & PUBLIC
await db.exec(`
  reset role;
  create or replace function public.test_future_security_func()
  returns text language sql as $$ select 'secret' $$;
`);
const anonFuturePriv = (await db.query(`select has_function_privilege('anon', 'public.test_future_security_func()', 'EXECUTE') as priv`)).rows[0].priv;
ok(!anonFuturePriv, "ALTER DEFAULT PRIVILEGES: anon has no execute on future functions");
const authFuturePriv = (await db.query(`select has_function_privilege('authenticated', 'public.test_future_security_func()', 'EXECUTE') as priv`)).rows[0].priv;
ok(!authFuturePriv, "ALTER DEFAULT PRIVILEGES: authenticated has no execute on future functions unless explicitly granted");
await db.exec(`reset role; drop function public.test_future_security_func();`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
