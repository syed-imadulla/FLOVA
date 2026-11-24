-- =====================================================================
-- Migration: 20261123160000_harden_child_table_rls.sql
-- FLOVA Phase 3.2.1: Fix Critical Database IDOR Vulnerability (SEC-01)
--
-- Target tables:
-- 1. public.wish_contributions
-- 2. public.invoice_settlements
--
-- Root Cause:
-- The original policies created in 20261121000400_invoices_and_wish.sql
-- only checked `auth.uid() = user_id`. They did not check that the parent
-- record (wish_goals or invoices) belonged to the authenticated user.
-- An authenticated attacker could insert a child row with their own
-- user_id pointing to another user's goal_id or invoice_id. Because the
-- triggers (sync_wish_contribution and sync_invoice_settlement) are
-- SECURITY DEFINER, the attacker's insert mutated the victim's saved_amount,
-- paid_amount, and status.
--
-- Remediation:
-- Re-create the RLS policies on both tables using EXISTS clauses on both
-- USING and WITH CHECK to strictly verify parent record ownership.
-- =====================================================================

-- 1. Harden wish_contributions RLS policy
DROP POLICY IF EXISTS "Users can manage own wish contributions" ON public.wish_contributions;
CREATE POLICY "Users can manage own wish contributions"
  ON public.wish_contributions FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.wish_goals
       WHERE wish_goals.id = wish_contributions.goal_id
         AND wish_goals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.wish_goals
       WHERE wish_goals.id = wish_contributions.goal_id
         AND wish_goals.user_id = auth.uid()
    )
  );

-- 2. Harden invoice_settlements RLS policy
DROP POLICY IF EXISTS "Users can manage own invoice settlements" ON public.invoice_settlements;
CREATE POLICY "Users can manage own invoice settlements"
  ON public.invoice_settlements FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.invoices
       WHERE invoices.id = invoice_settlements.invoice_id
         AND invoices.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.invoices
       WHERE invoices.id = invoice_settlements.invoice_id
         AND invoices.user_id = auth.uid()
    )
  );
