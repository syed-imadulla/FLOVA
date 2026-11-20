#!/usr/bin/env bash
set -e

export PGPASSWORD=postgres
export PGHOST=localhost
export PGPORT=5433
export PGUSER=postgres
export PGDATABASE=postgres

echo "=========================================================="
echo "FLOVA Real PostgreSQL Multi-Connection Concurrency Test"
echo "=========================================================="

# 1. Setup Auth Stubs
psql -v ON_ERROR_STOP=1 -q -c "
  DROP SCHEMA IF EXISTS public CASCADE;
  CREATE SCHEMA public;
  DROP SCHEMA IF EXISTS auth CASCADE;
  CREATE SCHEMA auth;

  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  END
  \$\$;

  CREATE TABLE auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}'::jsonb);
  CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS \$\$ 
    SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid 
  \$\$;
  GRANT USAGE ON SCHEMA auth TO authenticated, anon;
  GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon;
"

# 2. Apply Migrations
psql -v ON_ERROR_STOP=1 -q -f backend/supabase/migrations/20261120000100_init_schema.sql
psql -v ON_ERROR_STOP=1 -q -f backend/supabase/migrations/20261120000200_explicit_grants.sql
psql -v ON_ERROR_STOP=1 -q -f backend/supabase/migrations/20261121000100_harden_payout_sync.sql

# 3. Create Test User
USER_A="11111111-1111-1111-1111-111111111111"
psql -v ON_ERROR_STOP=1 -q -c "
  INSERT INTO auth.users (id, raw_user_meta_data) VALUES ('${USER_A}', '{\"display_name\":\"Concurrency Tester\"}');
"

# 4. Insert Test Payout
PAYOUT_ID=$(psql -v ON_ERROR_STOP=1 -q -t -A \
  -c "SELECT set_config('request.jwt.claim.sub', '${USER_A}', false);" \
  -c "SET ROLE authenticated;" \
  -c "INSERT INTO public.payouts (source, expected_amount, expected_date) VALUES ('Platform Concurrency', 10000.00, '2026-11-30') RETURNING id;" | tail -n 1)
echo "Created target Payout ID: ${PAYOUT_ID}"

echo ""
echo "--- Testing 10 Concurrent Receipt Inserts Against Same Payout ---"
# Launch 10 parallel subshells, each with its own connection to PostgreSQL
for i in $(seq 1 10); do
  (
    psql -v ON_ERROR_STOP=1 -q \
      -c "SELECT set_config('request.jwt.claim.sub', '${USER_A}', false);" \
      -c "SET ROLE authenticated;" \
      -c "INSERT INTO public.transactions (type, amount, category, payout_id) VALUES ('income', 100.00, 'earnings', '${PAYOUT_ID}');"
  ) &
done

wait
echo "All 10 parallel client connections finished."

# Verify Final State
RESULT=$(psql -v ON_ERROR_STOP=1 -q -t -A \
  -c "SELECT set_config('request.jwt.claim.sub', '${USER_A}', false);" \
  -c "SET ROLE authenticated;" \
  -c "SELECT received_amount::text || ' ' || status FROM public.payouts WHERE id = '${PAYOUT_ID}';" | tail -n 1)

TX_SUM=$(psql -v ON_ERROR_STOP=1 -q -t -A \
  -c "SELECT set_config('request.jwt.claim.sub', '${USER_A}', false);" \
  -c "SET ROLE authenticated;" \
  -c "SELECT sum(amount)::text FROM public.transactions WHERE payout_id = '${PAYOUT_ID}';" | tail -n 1)

echo "Database Total of Transactions: ₹${TX_SUM}"
echo "Payout Recorded received_amount & status: ${RESULT}"

if [ "${RESULT}" = "1000.00 partial" ] && [ "${TX_SUM}" = "1000.00" ]; then
  echo ">>> PASS: Concurrency race condition eliminated! Payout exactly equals sum of 10 concurrent transactions."
else
  echo ">>> FAIL: Concurrency anomaly detected! Expected '1000.00 partial', got '${RESULT}'"
  exit 1
fi

echo ""
echo "--- Testing Deadlock Freedom on Concurrent Reverse Reassignment ---"
P_ALPHA=$(psql -v ON_ERROR_STOP=1 -q -t -A \
  -c "SELECT set_config('request.jwt.claim.sub', '${USER_A}', false);" \
  -c "SET ROLE authenticated;" \
  -c "INSERT INTO public.payouts (source, expected_amount) VALUES ('Alpha', 5000.00) RETURNING id;" | tail -n 1)

P_BETA=$(psql -v ON_ERROR_STOP=1 -q -t -A \
  -c "SELECT set_config('request.jwt.claim.sub', '${USER_A}', false);" \
  -c "SET ROLE authenticated;" \
  -c "INSERT INTO public.payouts (source, expected_amount) VALUES ('Beta', 5000.00) RETURNING id;" | tail -n 1)

TX_A=$(psql -v ON_ERROR_STOP=1 -q -t -A \
  -c "SELECT set_config('request.jwt.claim.sub', '${USER_A}', false);" \
  -c "SET ROLE authenticated;" \
  -c "INSERT INTO public.transactions (type, amount, category, payout_id) VALUES ('income', 500.00, 'earnings', '${P_ALPHA}') RETURNING id;" | tail -n 1)

TX_B=$(psql -v ON_ERROR_STOP=1 -q -t -A \
  -c "SELECT set_config('request.jwt.claim.sub', '${USER_A}', false);" \
  -c "SET ROLE authenticated;" \
  -c "INSERT INTO public.transactions (type, amount, category, payout_id) VALUES ('income', 500.00, 'earnings', '${P_BETA}') RETURNING id;" | tail -n 1)

echo "Alpha ID: ${P_ALPHA}"
echo "Beta ID:  ${P_BETA}"

# Concurrently swap: Connection 1 moves TX_A from Alpha to Beta; Connection 2 moves TX_B from Beta to Alpha
(
  psql -v ON_ERROR_STOP=1 -q \
    -c "SELECT set_config('request.jwt.claim.sub', '${USER_A}', false);" \
    -c "SET ROLE authenticated;" \
    -c "UPDATE public.transactions SET payout_id = '${P_BETA}' WHERE id = '${TX_A}';"
) &
PID1=$!

(
  psql -v ON_ERROR_STOP=1 -q \
    -c "SELECT set_config('request.jwt.claim.sub', '${USER_A}', false);" \
    -c "SET ROLE authenticated;" \
    -c "UPDATE public.transactions SET payout_id = '${P_ALPHA}' WHERE id = '${TX_B}';"
) &
PID2=$!

wait $PID1
wait $PID2
echo "Concurrent reverse reassignment finished without deadlock."

REC_ALPHA=$(psql -v ON_ERROR_STOP=1 -q -t -A \
  -c "SELECT set_config('request.jwt.claim.sub', '${USER_A}', false);" \
  -c "SET ROLE authenticated;" \
  -c "SELECT received_amount::text FROM public.payouts WHERE id = '${P_ALPHA}';" | tail -n 1)

REC_BETA=$(psql -v ON_ERROR_STOP=1 -q -t -A \
  -c "SELECT set_config('request.jwt.claim.sub', '${USER_A}', false);" \
  -c "SET ROLE authenticated;" \
  -c "SELECT received_amount::text FROM public.payouts WHERE id = '${P_BETA}';" | tail -n 1)

echo "Alpha final received: ₹${REC_ALPHA}"
echo "Beta final received:  ₹${REC_BETA}"

if [ "${REC_ALPHA}" = "500.00" ] && [ "${REC_BETA}" = "500.00" ]; then
  echo ">>> PASS: Deadlock freedom confirmed! Both reverse reassignments completed accurately."
else
  echo ">>> FAIL: Reassignment anomaly detected!"
  exit 1
fi

echo ""
echo "=========================================================="
echo "ALL CONCURRENCY & DEADLOCK TESTS PASSED ON REAL POSTGRESQL"
echo "=========================================================="
