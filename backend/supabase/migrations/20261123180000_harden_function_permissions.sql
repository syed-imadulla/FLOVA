-- =====================================================================
-- Migration: 20261123180000_harden_function_permissions.sql
-- FLOVA SEC-06: Database Function Permission & Search Path Hardening
--
-- Objectives:
-- 1. Eliminate unauthorized exposure of internal helper functions to PostgREST RPC.
--    Specifically: sync_payout_received(uuid) was callable over HTTP RPC by anon and
--    authenticated roles, allowing arbitrary users to trigger lock queries on any payout.
-- 2. Declare transactions_sync_payout() as SECURITY DEFINER with fixed safe search_path,
--    allowing internal payout synchronization to proceed reliably while revoking direct
--    EXECUTE grants from PUBLIC, anon, and authenticated.
-- 3. Revoke direct EXECUTE on all trigger helper functions from PUBLIC, anon, and authenticated.
--    PostgreSQL triggers execute regardless of direct user EXECUTE permissions.
-- 4. Set explicit, safe search_path (public, pg_temp) on all functions.
-- 5. Revoke default execute privileges on public schema functions for PUBLIC and anon.
-- =====================================================================

-- 1. Upgrade transactions_sync_payout() to SECURITY DEFINER with safe search_path
CREATE OR REPLACE FUNCTION public.transactions_sync_payout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Case 1: Transaction reassigned from one payout to another
  -- Acquire locks in canonical ascending UUID order (LEAST first) to eliminate deadlocks
  IF tg_op = 'UPDATE' AND old.payout_id IS NOT NULL AND new.payout_id IS NOT NULL AND old.payout_id <> new.payout_id THEN
    IF old.payout_id < new.payout_id THEN
      PERFORM public.sync_payout_received(old.payout_id);
      PERFORM public.sync_payout_received(new.payout_id);
    ELSE
      PERFORM public.sync_payout_received(new.payout_id);
      PERFORM public.sync_payout_received(old.payout_id);
    END IF;
    RETURN NULL;
  END IF;

  -- Case 2: Deletion or unlinking
  IF tg_op IN ('UPDATE', 'DELETE') AND old.payout_id IS NOT NULL THEN
    PERFORM public.sync_payout_received(old.payout_id);
  END IF;

  -- Case 3: Insertion, linking, or amount update
  IF tg_op IN ('INSERT', 'UPDATE') AND new.payout_id IS NOT NULL
    AND (tg_op = 'INSERT' OR new.payout_id IS DISTINCT FROM old.payout_id OR new.amount <> old.amount) THEN
    PERFORM public.sync_payout_received(new.payout_id);
  END IF;

  RETURN NULL;
END;
$$;

-- 2. Harden sync_payout_received(uuid) search_path
CREATE OR REPLACE FUNCTION public.sync_payout_received(p_payout uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_received numeric(12,2);
BEGIN
  IF p_payout IS NULL THEN RETURN; END IF;

  -- 1. Exclusive row-level lock on target payout (serialized without FK share lock conflicts)
  PERFORM 1 FROM public.payouts p WHERE p.id = p_payout FOR NO KEY UPDATE;

  -- 2. Recalculate total sum from scratch
  SELECT COALESCE(SUM(t.amount), 0) INTO v_received
    FROM public.transactions t WHERE t.payout_id = p_payout;

  -- 3. Update received_amount and enforce the status state machine
  UPDATE public.payouts p
    SET received_amount = v_received,
        status = CASE
          WHEN p.status = 'cancelled' THEN p.status
          WHEN v_received >= p.expected_amount THEN 'settled'::public.payout_status
          WHEN v_received > 0 THEN 'partial'::public.payout_status
          WHEN p.status IN ('partial', 'settled') AND v_received = 0 THEN 'scheduled'::public.payout_status
          ELSE p.status
        END
  WHERE p.id = p_payout;
END;
$$;

-- 3. Harden payouts_guard_received() with safe search_path
CREATE OR REPLACE FUNCTION public.payouts_guard_received()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF pg_trigger_depth() = 1 AND new.received_amount IS DISTINCT FROM old.received_amount THEN
    RAISE EXCEPTION 'received_amount is derived from linked income transactions; add a transaction with payout_id instead';
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Harden set_updated_at() with safe search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  new.updated_at := now();
  RETURN NEW;
END;
$$;

-- 5. Revoke EXECUTE on internal helper and trigger functions from PUBLIC, anon, and authenticated
-- This completely unexposes them from PostgREST RPC while preserving trigger execution.
REVOKE ALL ON FUNCTION public.sync_payout_received(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.transactions_sync_payout() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.payouts_guard_received() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_daily_transaction_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_invoice_settlement() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_wish_contribution() FROM PUBLIC, anon, authenticated;

-- 6. Ensure default privileges for future functions do not grant EXECUTE to PUBLIC/anon
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
