// Comprehensive test suite for FLOVA Payout Synchronization & Hardening (Phase 5)
// Usage: cd backend && node scripts/test-payout-sync.mjs
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";

let passCount = 0;
let failCount = 0;

function assert(condition, message, detail = "") {
  if (condition) {
    passCount++;
    console.log(`  PASS: ${message}${detail ? ` (${detail})` : ""}`);
  } else {
    failCount++;
    console.error(`  FAIL: ${message}${detail ? ` (${detail})` : ""}`);
  }
}

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("FLOVA Payout Synchronization Hardening - Test Suite");
  console.log("=======================================================\n");

  const db = new PGlite();
  const USER_A = "11111111-1111-1111-1111-111111111111";
  const USER_B = "22222222-2222-2222-2222-222222222222";

  // 1. Supabase Auth Stubs
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}'::jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
  `);

  // 2. Apply all migrations in order
  const migrationsDir = new URL("../supabase/migrations", import.meta.url);
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  console.log(`Applying ${files.length} migration(s): ${files.join(", ")}`);
  for (const file of files) {
    const sql = fs.readFileSync(new URL(`../supabase/migrations/${file}`, import.meta.url), "utf8");
    await db.exec(sql);
  }

  await db.exec(`
    grant usage on schema public to authenticated, anon;
    grant execute on all functions in schema public to authenticated;
    insert into auth.users (id, raw_user_meta_data) values
      ('${USER_A}', '{"display_name":"User A"}'),
      ('${USER_B}', '{"display_name":"User B"}');
  `);

  const asUser = async (uid, sql) => {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid}', false); set role authenticated;`);
    return db.query(sql);
  };

  // --- SCENARIO 1: Partial receipt ---
  console.log("\n--- Scenario 1: Partial Receipt ---");
  const p1 = (await asUser(USER_A, `
    insert into public.payouts (source, expected_amount, expected_date)
    values ('Swiggy', 1000.00, '2026-11-25')
    returning id, expected_amount, received_amount, status
  `)).rows[0];

  const t1 = (await asUser(USER_A, `
    insert into public.transactions (type, amount, category, payout_id)
    values ('income', 400.00, 'earnings', '${p1.id}')
    returning id, amount
  `)).rows[0];

  const p1_s1 = (await asUser(USER_A, `select received_amount::text, status from public.payouts where id = '${p1.id}'`)).rows[0];
  assert(p1_s1.received_amount === "400.00", "Partial receipt amount is 400.00", `received=${p1_s1.received_amount}`);
  assert(p1_s1.status === "partial", "Payout status transitioned to 'partial'", `status=${p1_s1.status}`);

  // --- SCENARIO 2: Full receipt ---
  console.log("\n--- Scenario 2: Full Receipt (Settlement) ---");
  const t2 = (await asUser(USER_A, `
    insert into public.transactions (type, amount, category, payout_id)
    values ('income', 600.00, 'earnings', '${p1.id}')
    returning id, amount
  `)).rows[0];

  const p1_s2 = (await asUser(USER_A, `select received_amount::text, status from public.payouts where id = '${p1.id}'`)).rows[0];
  assert(p1_s2.received_amount === "1000.00", "Full receipt amount is 1000.00", `received=${p1_s2.received_amount}`);
  assert(p1_s2.status === "settled", "Payout status transitioned to 'settled'", `status=${p1_s2.status}`);

  // --- SCENARIO 3: Multiple linked receipts ---
  console.log("\n--- Scenario 3: Multiple Linked Receipts ---");
  const pMulti = (await asUser(USER_A, `
    insert into public.payouts (source, expected_amount, expected_date)
    values ('Zomato Multi', 1000.00, '2026-11-28')
    returning id
  `)).rows[0];

  await asUser(USER_A, `insert into public.transactions (type, amount, category, payout_id) values ('income', 200.00, 'earnings', '${pMulti.id}')`);
  await asUser(USER_A, `insert into public.transactions (type, amount, category, payout_id) values ('income', 300.00, 'earnings', '${pMulti.id}')`);
  await asUser(USER_A, `insert into public.transactions (type, amount, category, payout_id) values ('income', 500.00, 'earnings', '${pMulti.id}')`);

  const pMultiState = (await asUser(USER_A, `select received_amount::text, status from public.payouts where id = '${pMulti.id}'`)).rows[0];
  assert(pMultiState.received_amount === "1000.00", "Three separate transactions correctly sum to 1000.00", `received=${pMultiState.received_amount}`);
  assert(pMultiState.status === "settled", "Multiple receipts trigger 'settled' upon hitting 100%", `status=${pMultiState.status}`);

  // --- SCENARIO 4: Amount update ---
  console.log("\n--- Scenario 4: Amount Update (Recalculated, Not Incremented) ---");
  // Change T2 from 600 to 500 on P1
  await asUser(USER_A, `update public.transactions set amount = 500.00 where id = '${t2.id}'`);
  const p1_s4 = (await asUser(USER_A, `select received_amount::text, status from public.payouts where id = '${p1.id}'`)).rows[0];
  assert(p1_s4.received_amount === "900.00", "Received amount recalculated from scratch (400 + 500 = 900.00)", `received=${p1_s4.received_amount}`);
  assert(p1_s4.status === "partial", "Payout status correctly rolls back from 'settled' to 'partial'", `status=${p1_s4.status}`);

  // --- SCENARIO 5: Transaction deletion ---
  console.log("\n--- Scenario 5: Transaction Deletion ---");
  await asUser(USER_A, `delete from public.transactions where id = '${t2.id}'`);
  const p1_s5a = (await asUser(USER_A, `select received_amount::text, status from public.payouts where id = '${p1.id}'`)).rows[0];
  assert(p1_s5a.received_amount === "400.00", "Deleting T2 leaves 400.00", `received=${p1_s5a.received_amount}`);
  assert(p1_s5a.status === "partial", "Status remains 'partial'", `status=${p1_s5a.status}`);

  await asUser(USER_A, `delete from public.transactions where id = '${t1.id}'`);
  const p1_s5b = (await asUser(USER_A, `select received_amount::text, status from public.payouts where id = '${p1.id}'`)).rows[0];
  assert(p1_s5b.received_amount === "0.00", "Deleting all transactions leaves 0.00", `received=${p1_s5b.received_amount}`);
  assert(p1_s5b.status === "scheduled", "Payout status restores to 'scheduled' when all receipts removed", `status=${p1_s5b.status}`);

  // --- SCENARIO 6: Payout reassignment & deadlock prevention ---
  console.log("\n--- Scenario 6: Payout Reassignment & Canonical Lock Ordering ---");
  const pAlpha = (await asUser(USER_A, `insert into public.payouts (source, expected_amount) values ('Alpha', 500.00) returning id`)).rows[0];
  const pBeta = (await asUser(USER_A, `insert into public.payouts (source, expected_amount) values ('Beta', 500.00) returning id`)).rows[0];

  const tReassign = (await asUser(USER_A, `
    insert into public.transactions (type, amount, category, payout_id)
    values ('income', 350.00, 'earnings', '${pAlpha.id}')
    returning id
  `)).rows[0];

  // Reassign from Alpha to Beta
  await asUser(USER_A, `update public.transactions set payout_id = '${pBeta.id}' where id = '${tReassign.id}'`);

  const pAlphaState = (await asUser(USER_A, `select received_amount::text, status from public.payouts where id = '${pAlpha.id}'`)).rows[0];
  const pBetaState = (await asUser(USER_A, `select received_amount::text, status from public.payouts where id = '${pBeta.id}'`)).rows[0];

  assert(pAlphaState.received_amount === "0.00" && pAlphaState.status === "scheduled", "Old payout Alpha recalculated to 0.00 scheduled");
  assert(pBetaState.received_amount === "350.00" && pBetaState.status === "partial", "New payout Beta recalculated to 350.00 partial");

  // Reassign back from Beta to Alpha (ensures reverse UUID ordering works cleanly without deadlock)
  await asUser(USER_A, `update public.transactions set payout_id = '${pAlpha.id}' where id = '${tReassign.id}'`);
  const pAlphaBack = (await asUser(USER_A, `select received_amount::text, status from public.payouts where id = '${pAlpha.id}'`)).rows[0];
  const pBetaBack = (await asUser(USER_A, `select received_amount::text, status from public.payouts where id = '${pBeta.id}'`)).rows[0];
  assert(pAlphaBack.received_amount === "350.00" && pBetaBack.received_amount === "0.00", "Reverse reassignment completes without deadlock");

  // --- SCENARIO 7: Duplicate submission with same UUID ---
  console.log("\n--- Scenario 7: Duplicate Submission with Same Client UUID ---");
  const clientUUID = "99999999-9999-9999-9999-999999999999";
  await asUser(USER_A, `
    insert into public.transactions (id, type, amount, category, payout_id)
    values ('${clientUUID}', 'income', 150.00, 'earnings', '${pAlpha.id}')
  `);
  let dupRejected = false;
  try {
    // Retry with exact same UUID
    await asUser(USER_A, `
      insert into public.transactions (id, type, amount, category, payout_id)
      values ('${clientUUID}', 'income', 150.00, 'earnings', '${pAlpha.id}')
    `);
  } catch (err) {
    dupRejected = true;
  }
  assert(dupRejected, "Duplicate insert with same client UUID is rejected by primary key");
  const pAlphaDup = (await asUser(USER_A, `select received_amount::text from public.payouts where id = '${pAlpha.id}'`)).rows[0];
  assert(pAlphaDup.received_amount === "500.00", "Payout total is not double-counted (350 + 150 = 500.00)", `received=${pAlphaDup.received_amount}`);

  // --- SCENARIO 8: Direct received_amount modification rejection ---
  console.log("\n--- Scenario 8: Direct received_amount Modification Rejection ---");
  let directEditBlocked = false;
  let guardError = "";
  try {
    await asUser(USER_A, `update public.payouts set received_amount = 999.00 where id = '${pAlpha.id}'`);
  } catch (err) {
    directEditBlocked = true;
    guardError = err.message;
  }
  assert(directEditBlocked, "Direct update of received_amount blocked by trigger");
  assert(guardError.includes("received_amount is derived"), "Guard provides explanatory error message", guardError);

  // --- SCENARIO 9: Idempotency & RLS Isolation Verification ---
  console.log("\n--- Scenario 9: Idempotent Retry & RLS Isolation at Database Level ---");
  const testRetryUUID = "88888888-8888-8888-8888-888888888888";
  await asUser(USER_A, `
    insert into public.transactions (id, type, amount, category, payout_id)
    values ('${testRetryUUID}', 'income', 100.00, 'earnings', '${pBeta.id}')
  `);
  // Attempt duplicate insert as User A
  let userADupError = null;
  try {
    await asUser(USER_A, `
      insert into public.transactions (id, type, amount, category, payout_id)
      values ('${testRetryUUID}', 'income', 100.00, 'earnings', '${pBeta.id}')
    `);
  } catch (err) {
    userADupError = err.message;
  }
  assert(userADupError.includes("transactions_pkey"), "Duplicate insert as User A fails with transactions_pkey violation");
  // Query existing row as User A: row is visible
  const existingA = (await asUser(USER_A, `select id, amount::text, payout_id from public.transactions where id = '${testRetryUUID}'`)).rows[0];
  assert(existingA && existingA.amount === "100.00" && existingA.payout_id === pBeta.id, "Existing row visible to User A with matching financial data");

  // Attempt duplicate insert with same UUID as User B
  let userBDupError = null;
  try {
    await asUser(USER_B, `
      insert into public.transactions (id, type, amount, category)
      values ('${testRetryUUID}', 'income', 100.00, 'earnings')
    `);
  } catch (err) {
    userBDupError = err.message;
  }
  assert(userBDupError.includes("transactions_pkey"), "User B collision also fails with transactions_pkey violation");
  // Query existing row as User B: row must NOT be visible due to RLS
  const existingB = (await asUser(USER_B, `select id from public.transactions where id = '${testRetryUUID}'`)).rows;
  assert(existingB.length === 0, "RLS isolates row: User B cannot select User A's transaction");

  // --- SCENARIO 10: Concurrency Evaluation ---
  console.log("\n--- Scenario 10: Concurrency Safety Analysis & Evaluation ---");
  console.log("  NOTE on Execution Engines:");
  console.log("  - PGlite (WASM) is single-threaded; queries execute in a coordinated event loop.");
  console.log("  - In actual PostgreSQL with multiple TCP connections:");
  console.log("    Without 'FOR UPDATE', concurrent transactions calculate SUM before committing, causing lost updates.");
  console.log("    With migration 20261121000100_harden_payout_sync.sql's 'PERFORM ... FOR NO KEY UPDATE':");
  console.log("    Every concurrent sync serializes on the payout row lock before computing SUM(t.amount).");

  console.log("\n=======================================================");
  console.log(`Test Results: ${passCount} PASSED, ${failCount} FAILED`);
  console.log("=======================================================\n");

  if (failCount > 0) process.exit(1);
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
