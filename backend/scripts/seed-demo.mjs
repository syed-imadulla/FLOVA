// =====================================================================
// FLOVA Demo Data Seeding Script (Owner: M1)
// Populates the canonical gig worker scenario (Ravi - Delivery Partner)
// strictly isolated to the demo user's verified UUID.
//
// Usage:
//   Local/Test mode (PGlite in-memory):
//     node scripts/seed-demo.mjs --test
//   Live Supabase mode:
//     node --env-file=.env.local scripts/seed-demo.mjs
// =====================================================================

import { createClient } from "@supabase/supabase-js";
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";

const isTestMode = process.argv.includes("--test") || process.argv.includes("--local");

// Canonical Ravi Delivery Scenario Values
export const RAVI_FIXTURE = {
  displayName: "Ravi Kumar",
  workProfile: "delivery",
  payoutPattern: "weekly",
  preferredLanguage: "en",
  dailyLivingEstimate: "200.00", // ₹200.00 (20,000 paise)
  dailyWorkEstimate: "100.00",   // ₹100.00 (10,000 paise)
  onboardingCompleted: true,

  checkin: {
    cashAmount: "1500.00", // ₹1,500
    bankAmount: "2500.00", // ₹2,500
    notMineAmount: "600.00", // ₹600 (COD in wallet)
    checkedAt: "2026-11-19T08:00:00Z",
    note: "Thursday morning wallet check",
  },

  payouts: [
    {
      source: "Swiggy",
      kind: "platform_payout",
      expectedAmount: "1800.00", // ₹1,800
      expectedDate: "2026-11-23", // Monday
      status: "scheduled",
      note: "Weekly platform earnings payout",
    },
  ],

  commitments: [
    {
      title: "Room Rent",
      amount: "4500.00", // ₹4,500
      dueDate: "2026-11-21", // Saturday
      category: "rent",
      kind: "bill",
      status: "upcoming",
    },
  ],

  transactions: [
    // Pre-checkin transaction (06:00Z <= 08:00Z): already part of cash, excluded by runway feed
    {
      type: "income",
      amount: "500.00",
      category: "earnings",
      description: "Early morning cash delivery",
      ownership: "mine",
      expenseType: null,
      transactionDate: "2026-11-19",
      source: "demo",
      createdAt: "2026-11-19T06:00:00Z",
    },
    // Post-checkin income (10:00Z > 08:00Z): adds ₹650 to confirmed personal cash
    {
      type: "income",
      amount: "650.00",
      category: "earnings",
      description: "Platform delivery earnings",
      ownership: "mine",
      expenseType: null,
      transactionDate: "2026-11-19",
      source: "demo",
      createdAt: "2026-11-19T10:00:00Z",
    },
    // Post-checkin fuel expense (14:00Z > 08:00Z): deducts ₹120 from confirmed personal cash
    {
      type: "expense",
      amount: "120.00",
      category: "fuel",
      description: "Petrol refill",
      ownership: "mine",
      expenseType: "work",
      transactionDate: "2026-11-19",
      source: "demo",
      createdAt: "2026-11-19T14:00:00Z",
    },
    // Post-checkin COD collection: customer cash collected for platform (not personal money)
    {
      type: "income",
      amount: "400.00",
      category: "cod_collection",
      description: "Customer COD cash collection",
      ownership: "not_mine",
      expenseType: null,
      transactionDate: "2026-11-19",
      source: "demo",
      createdAt: "2026-11-19T15:00:00Z",
    },
  ],
};

/**
 * Seeds or resets demo data for a strictly verified user UUID.
 * Never deletes or modifies any data outside of targetUserId.
 */
export async function seedDemoUser(dbClient, targetUserId) {
  if (!targetUserId || typeof targetUserId !== "string" || targetUserId.length < 10) {
    throw new Error(`Invalid targetUserId: ${targetUserId}. Seeding aborted.`);
  }

  // 1. Delete previous records strictly for this user UUID in reverse-dependency order
  await dbClient.query(`DELETE FROM public.commitments WHERE user_id = $1`, [targetUserId]);
  await dbClient.query(`DELETE FROM public.transactions WHERE user_id = $1`, [targetUserId]);
  await dbClient.query(`DELETE FROM public.payouts WHERE user_id = $1`, [targetUserId]);
  await dbClient.query(`DELETE FROM public.balance_checkins WHERE user_id = $1`, [targetUserId]);

  // 2. Upsert Profile
  await dbClient.query(
    `INSERT INTO public.profiles (
       id, display_name, work_profile, payout_pattern, preferred_language,
       daily_living_estimate, daily_work_estimate, onboarding_completed, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (id) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       work_profile = EXCLUDED.work_profile,
       payout_pattern = EXCLUDED.payout_pattern,
       preferred_language = EXCLUDED.preferred_language,
       daily_living_estimate = EXCLUDED.daily_living_estimate,
       daily_work_estimate = EXCLUDED.daily_work_estimate,
       onboarding_completed = EXCLUDED.onboarding_completed,
       updated_at = NOW()`,
    [
      targetUserId,
      RAVI_FIXTURE.displayName,
      RAVI_FIXTURE.workProfile,
      RAVI_FIXTURE.payoutPattern,
      RAVI_FIXTURE.preferredLanguage,
      RAVI_FIXTURE.dailyLivingEstimate,
      RAVI_FIXTURE.dailyWorkEstimate,
      RAVI_FIXTURE.onboardingCompleted,
    ]
  );

  // 3. Insert Balance Checkin
  await dbClient.query(
    `INSERT INTO public.balance_checkins (
       user_id, cash_amount, bank_amount, not_mine_amount, checked_at, note
     ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      targetUserId,
      RAVI_FIXTURE.checkin.cashAmount,
      RAVI_FIXTURE.checkin.bankAmount,
      RAVI_FIXTURE.checkin.notMineAmount,
      RAVI_FIXTURE.checkin.checkedAt,
      RAVI_FIXTURE.checkin.note,
    ]
  );

  // 4. Insert Payout
  for (const p of RAVI_FIXTURE.payouts) {
    await dbClient.query(
      `INSERT INTO public.payouts (
         user_id, source, kind, expected_amount, expected_date, status, note
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [targetUserId, p.source, p.kind, p.expectedAmount, p.expectedDate, p.status, p.note]
    );
  }

  // 5. Insert Commitment
  for (const c of RAVI_FIXTURE.commitments) {
    await dbClient.query(
      `INSERT INTO public.commitments (
         user_id, title, amount, due_date, category, kind, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [targetUserId, c.title, c.amount, c.dueDate, c.category, c.kind, c.status]
    );
  }

  // 6. Insert Transactions
  for (const t of RAVI_FIXTURE.transactions) {
    await dbClient.query(
      `INSERT INTO public.transactions (
         user_id, type, amount, category, description, ownership,
         expense_type, transaction_date, source, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        targetUserId,
        t.type,
        t.amount,
        t.category,
        t.description,
        t.ownership,
        t.expenseType,
        t.transactionDate,
        t.source,
        t.createdAt,
      ]
    );
  }
}

// ---------------------------------------------------------------------
// TEST & VERIFICATION HARNESS (PGlite)
// ---------------------------------------------------------------------
async function runTestVerification() {
  console.log("=======================================================");
  console.log("FLOVA Demo Seeding Script: Isolation & Integrity Test");
  console.log("=======================================================\n");

  const db = new PGlite();
  const DEMO_USER_ID = "11111111-1111-1111-1111-111111111111";
  const UNRELATED_USER_ID = "22222222-2222-2222-2222-222222222222";

  let pass = 0;
  let fail = 0;
  const assert = (condition, msg) => {
    if (condition) {
      pass++;
      console.log(`  PASS: ${msg}`);
    } else {
      fail++;
      console.error(`  FAIL: ${msg}`);
    }
  };

  // 1. Setup Auth stubs & migrations
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
    const sql = fs.readFileSync(new URL(`../supabase/migrations/${file}`, import.meta.url), "utf8");
    await db.exec(sql);
  }
  await db.exec(`
    grant usage on schema public to authenticated, anon;
    grant execute on all functions in schema public to authenticated;
  `);

  // Insert test users
  await db.exec(`
    insert into auth.users (id, raw_user_meta_data) values
      ('${DEMO_USER_ID}', '{"display_name":"Ravi Demo"}'),
      ('${UNRELATED_USER_ID}', '{"display_name":"Unrelated User"}');
  `);

  // 2. Setup Unrelated User data (Must remain completely untouched)
  await db.query(
    `insert into public.transactions (user_id, type, amount, category, description)
     values ($1, 'income', 999.00, 'earnings', 'Unrelated private income')`,
    [UNRELATED_USER_ID]
  );
  await db.query(
    `insert into public.commitments (user_id, title, amount, due_date)
     values ($1, 'Private Bill', 500.00, '2026-11-28')`,
    [UNRELATED_USER_ID]
  );

  // 3. Execute Seeding for DEMO_USER_ID
  console.log("Seeding Demo User...");
  await seedDemoUser(db, DEMO_USER_ID);

  // 4. Verify Demo User Data
  const demoProfile = (await db.query(`select * from public.profiles where id = $1`, [DEMO_USER_ID])).rows[0];
  assert(demoProfile && demoProfile.display_name === "Ravi Kumar", "Demo profile created with display_name 'Ravi Kumar'");
  assert(demoProfile.work_profile === "delivery", "Demo work profile is 'delivery'");
  assert(demoProfile.daily_living_estimate === "200.00", "Daily living estimate is ₹200.00");
  assert(demoProfile.daily_work_estimate === "100.00", "Daily work estimate is ₹100.00");

  const demoCheckin = (await db.query(`select * from public.balance_checkins where user_id = $1`, [DEMO_USER_ID])).rows[0];
  assert(demoCheckin && demoCheckin.cash_amount === "1500.00" && demoCheckin.not_mine_amount === "600.00", "Check-in amounts match Ravi baseline");

  const demoTxs = (await db.query(`select count(*)::int as count from public.transactions where user_id = $1`, [DEMO_USER_ID])).rows[0];
  assert(demoTxs.count === 4, "Demo user has exactly 4 transactions seeded");

  const demoPayouts = (await db.query(`select count(*)::int as count from public.payouts where user_id = $1`, [DEMO_USER_ID])).rows[0];
  assert(demoPayouts.count === 1, "Demo user has 1 payout seeded");

  const demoComm = (await db.query(`select count(*)::int as count from public.commitments where user_id = $1`, [DEMO_USER_ID])).rows[0];
  assert(demoComm.count === 1, "Demo user has 1 commitment seeded");

  // 5. Verify Isolation: Unrelated User must NOT be touched
  const unrelatedTxs = (await db.query(`select * from public.transactions where user_id = $1`, [UNRELATED_USER_ID])).rows;
  assert(unrelatedTxs.length === 1 && unrelatedTxs[0].amount === "999.00", "Isolation confirmed: Unrelated user's transaction untouched");

  const unrelatedComm = (await db.query(`select * from public.commitments where user_id = $1`, [UNRELATED_USER_ID])).rows;
  assert(unrelatedComm.length === 1 && unrelatedComm[0].amount === "500.00", "Isolation confirmed: Unrelated user's commitment untouched");

  // 6. Test Idempotency: Re-running seedDemoUser resets cleanly without duplicating rows
  console.log("\nTesting Re-seeding Idempotency...");
  await seedDemoUser(db, DEMO_USER_ID);
  const reseedTxs = (await db.query(`select count(*)::int as count from public.transactions where user_id = $1`, [DEMO_USER_ID])).rows[0];
  assert(reseedTxs.count === 4, "Idempotency confirmed: Exactly 4 transactions remain after re-seeding");
  const reseedUnrelated = (await db.query(`select count(*)::int as count from public.transactions where user_id = $1`, [UNRELATED_USER_ID])).rows[0];
  assert(reseedUnrelated.count === 1, "Unrelated user still untouched after re-seed");

  // 7. Verify Deterministic Runway Engine Projection on Seeded Data
  console.log("\nVerifying Runway Calculation on Seeded Data...");
  // Dynamically import runway engine
  const { calculateConfirmedBalance, calculateDailyRunway } = await import("../../frontend/src/engine/index.ts");

  // Assemble RunwayInput in paise from the seeded database rows
  const seededCheckin = (await db.query(`select * from public.balance_checkins where user_id = $1`, [DEMO_USER_ID])).rows[0];
  const seededTxs = (await db.query(`select * from public.transactions where user_id = $1`, [DEMO_USER_ID])).rows;
  const seededPayouts = (await db.query(`select * from public.payouts where user_id = $1`, [DEMO_USER_ID])).rows;
  const seededCommitments = (await db.query(`select * from public.commitments where user_id = $1`, [DEMO_USER_ID])).rows;

  const runwayInput = {
    profile: {
      workProfile: demoProfile.work_profile,
      payoutPattern: demoProfile.payout_pattern,
      dailyLivingEstimate: 20000, // 200.00 -> 20000 paise
      dailyWorkEstimate: 10000,   // 100.00 -> 10000 paise
    },
    latestCheckin: {
      cash: 150000,
      bank: 250000,
      notMine: 60000,
      checkedAt: seededCheckin.checked_at.toISOString(),
    },
    transactionsSinceCheckin: seededTxs.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Math.round(Number(t.amount) * 100),
      ownership: t.ownership,
      expenseType: t.expense_type,
      payoutId: t.payout_id,
      date: t.transaction_date.toISOString().slice(0, 10),
      createdAt: t.created_at.toISOString(),
    })),
    payouts: seededPayouts.map((p) => ({
      id: p.id,
      kind: p.kind,
      expected: Math.round(Number(p.expected_amount) * 100),
      received: Math.round(Number(p.received_amount) * 100),
      expectedDate: p.expected_date ? p.expected_date.toISOString().slice(0, 10) : null,
      status: p.status,
    })),
    commitments: seededCommitments.map((c) => ({
      id: c.id,
      title: c.title,
      amount: Math.round(Number(c.amount) * 100),
      dueDate: c.due_date.toISOString().slice(0, 10),
      kind: c.kind,
    })),
  };

  const balanceResult = calculateConfirmedBalance(runwayInput);
  assert(balanceResult.status === "CONFIRMED", "Confirmed balance calculated as CONFIRMED");
  // 3400 (cash+bank-notmine) + 650 (income) - 120 (fuel) = 3930 (393,000 paise)
  assert(balanceResult.confirmedBalancePaise === 393000, `Confirmed personal balance is exactly ₹3,930 (393,000 paise); got ${balanceResult.confirmedBalancePaise}`);

  const runwayResult = calculateDailyRunway({
    ...runwayInput,
    horizonDays: 7,
    startDate: "2026-11-20",
  });
  assert(runwayResult.status === "PROJECTED", "Runway status is PROJECTED");
  assert(runwayResult.firstShortfallDate === "2026-11-21", `First shortfall date is Saturday 2026-11-21; got ${runwayResult.firstShortfallDate}`);

  const satProjection = runwayResult.projections.find((p) => p.date === "2026-11-21");
  assert(satProjection && satProjection.closingBalancePaise === -117000, `Saturday closing balance is exactly −₹1,170 (-117,000 paise); got ${satProjection?.closingBalancePaise}`);

  console.log("\n=======================================================");
  console.log(`Results: ${pass} PASSED, ${fail} FAILED`);
  console.log("=======================================================\n");

  if (fail > 0) process.exit(1);
}

// ---------------------------------------------------------------------
// LIVE SUPABASE EXECUTION
// ---------------------------------------------------------------------
async function runLiveSeeding() {
  const { VITE_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceKey, DEMO_USER_EMAIL, DEMO_USER_PASSWORD } = process.env;
  if (!url) {
    console.error("Missing VITE_SUPABASE_URL in environment.");
    process.exit(1);
  }

  const email = DEMO_USER_EMAIL || "demo.ravi@flova.app";
  console.log(`Connecting to Supabase at ${url} for demo user ${email}...`);

  let targetUserId = null;
  let client = null;

  if (serviceKey) {
    console.log("Using service-role credentials for administrative demo seeding...");
    const adminClient = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: users, error: listErr } = await adminClient.auth.admin.listUsers();
    if (listErr) throw new Error(`Failed to list users: ${listErr.message}`);
    const existing = users.users.find((u) => u.email === email);
    if (existing) {
      targetUserId = existing.id;
    } else {
      const password = DEMO_USER_PASSWORD || "DemoRavi2026!";
      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: "Ravi Kumar" },
      });
      if (createErr) throw new Error(`Failed to create demo user: ${createErr.message}`);
      targetUserId = created.user.id;
    }
    client = adminClient;
  } else if (DEMO_USER_PASSWORD) {
    console.log("Using password auth for demo user...");
    const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const authClient = createClient(url, publishableKey, { auth: { persistSession: false } });
    const { data: authData, error: signInErr } = await authClient.auth.signInWithPassword({
      email,
      password: DEMO_USER_PASSWORD,
    });
    if (signInErr) throw new Error(`Sign in failed for ${email}: ${signInErr.message}`);
    targetUserId = authData.user.id;
    client = authClient;
  } else {
    console.error("Neither SUPABASE_SERVICE_ROLE_KEY nor DEMO_USER_PASSWORD is set in backend/.env.local.");
    console.error("To test locally without network, run: node scripts/seed-demo.mjs --test");
    process.exit(1);
  }

  console.log(`Verified Target Demo User UUID: ${targetUserId}`);
  await seedDemoUser(client, targetUserId);
  console.log(`Successfully seeded demo data for ${email} (${targetUserId})`);
}

if (isTestMode) {
  runTestVerification().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
} else {
  runLiveSeeding().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
}
