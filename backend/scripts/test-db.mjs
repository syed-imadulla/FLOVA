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
await db.exec(fs.readFileSync(process.argv[2] ?? new URL("../supabase/migrations/20261120000100_init_schema.sql", import.meta.url), "utf8"));
await db.exec(`
  grant usage on schema public to authenticated, anon;
  grant select, insert, update, delete on all tables in schema public to authenticated;
  grant execute on all functions in schema public to authenticated;
`);
console.log("migration applied");

// sign-up trigger
await db.exec(`insert into auth.users (id, raw_user_meta_data) values ('${A}', '{"display_name":"Ravi"}'), ('${B}', '{}');`);
const prof = await db.query(`select id, display_name, work_profile from public.profiles order by id`);
ok(prof.rows.length === 2 && prof.rows[0].display_name === "Ravi", "profiles auto-created on sign-up");

const as = async (uid, sql) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid}', false); set role authenticated;`);
  return db.query(sql);
};

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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
