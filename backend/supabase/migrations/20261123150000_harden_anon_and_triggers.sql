-- =====================================================================
-- Migration: 20261123150000_harden_anon_and_triggers.sql
-- Defense in depth: remove anon / PUBLIC access that FLOVA never uses.
--
-- * Phase 16 tables (invoices, wish) were created after Supabase's default
--   privileges granted anon full table access. RLS already blocks anon rows,
--   but anon should hold no grants at all (matches the core five tables).
-- * SECURITY DEFINER trigger functions should not be callable directly over
--   PostgREST RPC. PostgreSQL checks EXECUTE only at CREATE TRIGGER time and
--   on direct calls, never when an existing trigger fires, so authenticated
--   writes keep working.
--
-- authenticated and service_role table grants are unchanged.
-- =====================================================================

-- 1. Phase 16 tables: anon gets nothing.
REVOKE ALL ON
  public.invoices,
  public.invoice_items,
  public.invoice_settlements,
  public.wish_goals,
  public.wish_contributions
FROM anon;

-- 2. Trigger functions: no direct calls from PUBLIC or anon.
REVOKE EXECUTE ON FUNCTION public.check_daily_transaction_limit() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.sync_invoice_settlement() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.sync_wish_contribution() FROM PUBLIC, anon;

-- 3. Sign-up trigger: no direct calls from any API role.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 4. rls_auto_enable() is created by the Supabase platform (event trigger
--    `ensure_rls`), not by FLOVA migrations, so it is absent in local test
--    databases. Revoke only where it exists.
DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END
$$;
