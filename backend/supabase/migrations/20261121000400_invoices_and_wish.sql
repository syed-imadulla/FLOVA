-- Migration: 20261121000400_invoices_and_wish.sql
-- Implements Phase 15 persistent storage for:
-- 1. Invoices, Invoice Items & Settlements (Receivables & Payables with partial settlements)
-- 2. WISH 2.0 Persistent Savings Goals & Contributions
-- All tables enforce strict RLS isolation, authenticated grants, and financial sanity constraints.

-- =====================================================================
-- 1. INVOICES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('receivable', 'payable')),
  supplier_name text,
  customer_name text,
  invoice_number text,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  total_amount numeric(12,2) NOT NULL CHECK (total_amount > 0 AND total_amount <= 1000000.00),
  paid_amount numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0 AND paid_amount <= total_amount),
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('uploaded', 'unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled')),
  file_path text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invoices_user_direction_idx ON public.invoices(user_id, direction);
CREATE INDEX IF NOT EXISTS invoices_user_status_idx ON public.invoices(user_id, status);

-- =====================================================================
-- 2. INVOICE ITEMS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity numeric(10,2),
  unit_price numeric(12,2),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invoice_items_invoice_id_idx ON public.invoice_items(invoice_id);

-- =====================================================================
-- 3. INVOICE SETTLEMENTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.invoice_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0 AND amount <= 1000000.00),
  settled_at date NOT NULL DEFAULT CURRENT_DATE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  payout_id uuid REFERENCES public.payouts(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invoice_settlements_invoice_id_idx ON public.invoice_settlements(invoice_id);
CREATE INDEX IF NOT EXISTS invoice_settlements_user_id_idx ON public.invoice_settlements(user_id);

-- Trigger to keep invoices.paid_amount and invoices.status strictly in sync with settlements
CREATE OR REPLACE FUNCTION public.sync_invoice_settlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invoice_id uuid;
  v_total numeric(12,2);
  v_paid numeric(12,2);
  v_due date;
  v_new_status text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_invoice_id := OLD.invoice_id;
  ELSE
    v_invoice_id := NEW.invoice_id;
  END IF;

  SELECT total_amount, due_date
    INTO v_total, v_due
    FROM public.invoices
   WHERE id = v_invoice_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(amount), 0.00)
    INTO v_paid
    FROM public.invoice_settlements
   WHERE invoice_id = v_invoice_id;

  IF v_paid >= v_total THEN
    v_new_status := 'paid';
  ELSIF v_paid > 0 THEN
    v_new_status := 'partially_paid';
  ELSIF v_due IS NOT NULL AND v_due < CURRENT_DATE THEN
    v_new_status := 'overdue';
  ELSE
    v_new_status := 'unpaid';
  END IF;

  UPDATE public.invoices
     SET paid_amount = v_paid,
         status = v_new_status,
         updated_at = now()
   WHERE id = v_invoice_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS invoice_settlements_sync_trigger ON public.invoice_settlements;
CREATE TRIGGER invoice_settlements_sync_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_settlements
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_invoice_settlement();

-- =====================================================================
-- 4. WISH 2.0 SAVINGS GOALS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.wish_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  target_amount numeric(12,2) NOT NULL CHECK (target_amount > 0 AND target_amount <= 10000000.00),
  saved_amount numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (saved_amount >= 0),
  target_date date,
  category text DEFAULT 'general',
  icon text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wish_goals_user_id_idx ON public.wish_goals(user_id);

-- =====================================================================
-- 5. WISH 2.0 CONTRIBUTIONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.wish_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.wish_goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  contributed_at date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wish_contributions_goal_id_idx ON public.wish_contributions(goal_id);
CREATE INDEX IF NOT EXISTS wish_contributions_user_id_idx ON public.wish_contributions(user_id);

-- Trigger to keep wish_goals.saved_amount and status strictly in sync with contributions
CREATE OR REPLACE FUNCTION public.sync_wish_contribution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_goal_id uuid;
  v_target numeric(12,2);
  v_saved numeric(12,2);
  v_status text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_goal_id := OLD.goal_id;
  ELSE
    v_goal_id := NEW.goal_id;
  END IF;

  SELECT target_amount, status
    INTO v_target, v_status
    FROM public.wish_goals
   WHERE id = v_goal_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(amount), 0.00)
    INTO v_saved
    FROM public.wish_contributions
   WHERE goal_id = v_goal_id;

  IF v_saved >= v_target AND v_status = 'active' THEN
    v_status := 'completed';
  ELSIF v_saved < v_target AND v_status = 'completed' THEN
    v_status := 'active';
  END IF;

  UPDATE public.wish_goals
     SET saved_amount = v_saved,
         status = v_status,
         updated_at = now()
   WHERE id = v_goal_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS wish_contributions_sync_trigger ON public.wish_contributions;
CREATE TRIGGER wish_contributions_sync_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.wish_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_wish_contribution();

-- =====================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_contributions ENABLE ROW LEVEL SECURITY;

-- Invoices RLS
DROP POLICY IF EXISTS "Users can read own invoices" ON public.invoices;
CREATE POLICY "Users can read own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
CREATE POLICY "Users can insert own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
CREATE POLICY "Users can update own invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own invoices" ON public.invoices;
CREATE POLICY "Users can delete own invoices"
  ON public.invoices FOR DELETE
  USING (auth.uid() = user_id);

-- Invoice Items RLS
DROP POLICY IF EXISTS "Users can manage own invoice items" ON public.invoice_items;
CREATE POLICY "Users can manage own invoice items"
  ON public.invoice_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
       WHERE invoices.id = invoice_items.invoice_id
         AND invoices.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices
       WHERE invoices.id = invoice_items.invoice_id
         AND invoices.user_id = auth.uid()
    )
  );

-- Invoice Settlements RLS
DROP POLICY IF EXISTS "Users can manage own invoice settlements" ON public.invoice_settlements;
CREATE POLICY "Users can manage own invoice settlements"
  ON public.invoice_settlements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- WISH Goals RLS
DROP POLICY IF EXISTS "Users can manage own wish goals" ON public.wish_goals;
CREATE POLICY "Users can manage own wish goals"
  ON public.wish_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- WISH Contributions RLS
DROP POLICY IF EXISTS "Users can manage own wish contributions" ON public.wish_contributions;
CREATE POLICY "Users can manage own wish contributions"
  ON public.wish_contributions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- 7. EXPLICIT GRANTS
-- =====================================================================
GRANT ALL ON TABLE public.invoices TO authenticated;
GRANT ALL ON TABLE public.invoice_items TO authenticated;
GRANT ALL ON TABLE public.invoice_settlements TO authenticated;
GRANT ALL ON TABLE public.wish_goals TO authenticated;
GRANT ALL ON TABLE public.wish_contributions TO authenticated;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE public.invoices TO service_role;
    GRANT ALL ON TABLE public.invoice_items TO service_role;
    GRANT ALL ON TABLE public.invoice_settlements TO service_role;
    GRANT ALL ON TABLE public.wish_goals TO service_role;
    GRANT ALL ON TABLE public.wish_contributions TO service_role;
  END IF;
END $$;
