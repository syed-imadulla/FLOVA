-- =====================================================================
-- Migration: 20261123170000_edge_function_rate_limiting.sql
-- SEC-03: Durable, concurrency-safe server-side rate limiting for
-- expensive Edge Functions (process-voice, extract-receipt).
--
-- Features:
-- 1. Configuration table for function-specific rate limit windows.
-- 2. State table tracking short-window and rolling daily counts per user.
-- 3. Atomic, race-condition-free SECURITY DEFINER RPC function using
--    FOR UPDATE row-level locking on (user_id, function_name).
-- 4. Guaranteed isolation: auth.uid() is strictly enforced; users cannot
--    manipulate or consume quotas belonging to other users.
-- 5. RLS enabled on all tables; anon access revoked.
-- =====================================================================

-- 1. Configuration table for Edge Function rate limits
CREATE TABLE IF NOT EXISTS public.edge_function_rate_limit_configs (
  function_name text PRIMARY KEY,
  short_window_seconds integer NOT NULL CHECK (short_window_seconds > 0),
  short_max_calls integer NOT NULL CHECK (short_max_calls > 0),
  daily_window_seconds integer NOT NULL CHECK (daily_window_seconds > 0),
  daily_max_calls integer NOT NULL CHECK (daily_max_calls > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed initial limits (10 requests per 10 mins; 50 requests per 24 hours)
INSERT INTO public.edge_function_rate_limit_configs (
  function_name,
  short_window_seconds,
  short_max_calls,
  daily_window_seconds,
  daily_max_calls
)
VALUES
  ('process-voice', 600, 10, 86400, 50),
  ('extract-receipt', 600, 10, 86400, 50)
ON CONFLICT (function_name) DO UPDATE
SET
  short_window_seconds = EXCLUDED.short_window_seconds,
  short_max_calls = EXCLUDED.short_max_calls,
  daily_window_seconds = EXCLUDED.daily_window_seconds,
  daily_max_calls = EXCLUDED.daily_max_calls,
  updated_at = now();

-- 2. Rate limit tracking state table
CREATE TABLE IF NOT EXISTS public.edge_function_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name text NOT NULL REFERENCES public.edge_function_rate_limit_configs(function_name) ON DELETE CASCADE,
  short_window_start timestamptz NOT NULL,
  short_count integer NOT NULL DEFAULT 0 CHECK (short_count >= 0),
  daily_window_start timestamptz NOT NULL,
  daily_count integer NOT NULL DEFAULT 0 CHECK (daily_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_edge_rate_limit_user_fn UNIQUE (user_id, function_name)
);

CREATE INDEX IF NOT EXISTS idx_edge_rate_limits_user_fn
  ON public.edge_function_rate_limits (user_id, function_name);

-- 3. Row Level Security policies
ALTER TABLE public.edge_function_rate_limit_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_function_rate_limits ENABLE ROW LEVEL SECURITY;

-- Configs are readable by authenticated users (to query their limits), but not writable
DROP POLICY IF EXISTS edge_rate_limit_configs_select ON public.edge_function_rate_limit_configs;
CREATE POLICY edge_rate_limit_configs_select
  ON public.edge_function_rate_limit_configs
  FOR SELECT
  TO authenticated
  USING (true);

-- Rate limits table: users can only view their own usage; direct INSERT/UPDATE/DELETE is disallowed
DROP POLICY IF EXISTS edge_rate_limits_select ON public.edge_function_rate_limits;
CREATE POLICY edge_rate_limits_select
  ON public.edge_function_rate_limits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Deny all anon access, explicitly grant SELECT to authenticated
REVOKE ALL ON public.edge_function_rate_limit_configs FROM anon, PUBLIC;
REVOKE ALL ON public.edge_function_rate_limits FROM anon, PUBLIC;
GRANT SELECT ON public.edge_function_rate_limit_configs TO authenticated;
GRANT SELECT ON public.edge_function_rate_limits TO authenticated;

-- 4. Atomic rate check & consume function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.check_and_consume_rate_limit(p_function_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_short_sec integer;
  v_short_max integer;
  v_daily_sec integer;
  v_daily_max integer;
  v_now timestamptz;
  v_short_start timestamptz;
  v_short_count integer;
  v_daily_start timestamptz;
  v_daily_count integer;
  v_retry_after integer;
BEGIN
  -- Strict authentication enforcement: auth.uid() from verified JWT identity
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to access rate-limited resource'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Load configuration for target function
  SELECT
    short_window_seconds,
    short_max_calls,
    daily_window_seconds,
    daily_max_calls
  INTO
    v_short_sec,
    v_short_max,
    v_daily_sec,
    v_daily_max
  FROM public.edge_function_rate_limit_configs
  WHERE function_name = p_function_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown or unconfigured edge function: %', p_function_name
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  v_now := clock_timestamp();

  -- Ensure record exists for this (user_id, function_name) pair
  INSERT INTO public.edge_function_rate_limits (
    user_id,
    function_name,
    short_window_start,
    short_count,
    daily_window_start,
    daily_count,
    updated_at
  )
  VALUES (
    v_user_id,
    p_function_name,
    v_now,
    0,
    v_now,
    0,
    v_now
  )
  ON CONFLICT (user_id, function_name) DO NOTHING;

  -- Concurrency control: Lock the row exclusively FOR UPDATE
  SELECT
    short_window_start,
    short_count,
    daily_window_start,
    daily_count
  INTO
    v_short_start,
    v_short_count,
    v_daily_start,
    v_daily_count
  FROM public.edge_function_rate_limits
  WHERE user_id = v_user_id AND function_name = p_function_name
  FOR UPDATE;

  -- Window expiry calculation (short window)
  IF v_now >= v_short_start + make_interval(secs => v_short_sec) THEN
    v_short_start := v_now;
    v_short_count := 0;
  END IF;

  -- Window expiry calculation (daily rolling window)
  IF v_now >= v_daily_start + make_interval(secs => v_daily_sec) THEN
    v_daily_start := v_now;
    v_daily_count := 0;
  END IF;

  -- Check short window limit
  IF v_short_count >= v_short_max THEN
    v_retry_after := CEIL(EXTRACT(EPOCH FROM (v_short_start + make_interval(secs => v_short_sec) - v_now)))::integer;
    IF v_retry_after < 1 THEN
      v_retry_after := 1;
    END IF;

    -- Persist window adjustments without consuming quota
    UPDATE public.edge_function_rate_limits
    SET
      short_window_start = v_short_start,
      short_count = v_short_count,
      daily_window_start = v_daily_start,
      daily_count = v_daily_count,
      updated_at = v_now
    WHERE user_id = v_user_id AND function_name = p_function_name;

    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'short_window_exceeded',
      'retry_after', v_retry_after,
      'short_count', v_short_count,
      'short_limit', v_short_max,
      'daily_count', v_daily_count,
      'daily_limit', v_daily_max
    );
  END IF;

  -- Check daily window limit
  IF v_daily_count >= v_daily_max THEN
    v_retry_after := CEIL(EXTRACT(EPOCH FROM (v_daily_start + make_interval(secs => v_daily_sec) - v_now)))::integer;
    IF v_retry_after < 1 THEN
      v_retry_after := 1;
    END IF;

    -- Persist window adjustments without consuming quota
    UPDATE public.edge_function_rate_limits
    SET
      short_window_start = v_short_start,
      short_count = v_short_count,
      daily_window_start = v_daily_start,
      daily_count = v_daily_count,
      updated_at = v_now
    WHERE user_id = v_user_id AND function_name = p_function_name;

    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'daily_window_exceeded',
      'retry_after', v_retry_after,
      'short_count', v_short_count,
      'short_limit', v_short_max,
      'daily_count', v_daily_count,
      'daily_limit', v_daily_max
    );
  END IF;

  -- Quota consumption
  v_short_count := v_short_count + 1;
  v_daily_count := v_daily_count + 1;

  UPDATE public.edge_function_rate_limits
  SET
    short_window_start = v_short_start,
    short_count = v_short_count,
    daily_window_start = v_daily_start,
    daily_count = v_daily_count,
    updated_at = v_now
  WHERE user_id = v_user_id AND function_name = p_function_name;

  RETURN jsonb_build_object(
    'allowed', true,
    'reason', null,
    'retry_after', 0,
    'short_count', v_short_count,
    'short_limit', v_short_max,
    'daily_count', v_daily_count,
    'daily_limit', v_daily_max
  );
END;
$$;

-- Revoke execute from anon and PUBLIC, allow authenticated
REVOKE ALL ON FUNCTION public.check_and_consume_rate_limit(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_and_consume_rate_limit(text) TO authenticated;
