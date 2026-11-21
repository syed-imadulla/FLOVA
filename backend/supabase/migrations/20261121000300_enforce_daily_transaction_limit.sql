-- Migration: 20261121000300_enforce_daily_transaction_limit.sql
-- Enforces both:
-- 1. Maximum individual transaction amount: ₹10,00,000 (1000000.00)
-- 2. Maximum aggregate transaction amount per India-local calendar day: ₹10,00,000 (1000000.00)
-- Concurrency is handled safely via profile row-level lock (FOR NO KEY UPDATE).
-- Third-party custodial funds (ownership = 'not_mine'), expected payouts, and idempotent retries are safely excluded.

-- 1. Individual transaction check constraint
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_max_individual_limit;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_max_individual_limit CHECK (amount <= 1000000.00);

-- 2. Trigger function to enforce daily aggregate limit per user per calendar day
CREATE OR REPLACE FUNCTION public.check_daily_transaction_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_daily_aggregate numeric(12,2);
  v_target_date date;
BEGIN
  -- Only personal financial transactions (ownership = 'mine') count against personal daily limit.
  -- Third-party custodial money (ownership = 'not_mine', e.g. COD collections) is excluded.
  IF NEW.ownership <> 'mine' THEN
    RETURN NEW;
  END IF;

  v_target_date := COALESCE(NEW.transaction_date, CURRENT_DATE);

  -- Concurrency safety: lock user's profile row for NO KEY UPDATE to serialize daily aggregate calculation
  -- for this user without blocking other users or standard read operations.
  PERFORM 1 FROM public.profiles WHERE id = NEW.user_id FOR NO KEY UPDATE;

  -- Calculate existing aggregate for this user on the target calendar day.
  -- Exclude current transaction ID (for updates and idempotent submissions).
  SELECT COALESCE(SUM(amount), 0)
    INTO v_daily_aggregate
    FROM public.transactions
   WHERE user_id = NEW.user_id
     AND transaction_date = v_target_date
     AND ownership = 'mine'
     AND (NEW.id IS NULL OR id <> NEW.id);

  IF (v_daily_aggregate + NEW.amount) > 1000000.00 THEN
    RAISE EXCEPTION 'Daily transaction limit of ₹10,00,000 exceeded for % (existing: ₹%, attempting: ₹%)',
      v_target_date, v_daily_aggregate, NEW.amount
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS transactions_daily_limit_trigger ON public.transactions;
CREATE TRIGGER transactions_daily_limit_trigger
  BEFORE INSERT OR UPDATE OF amount, transaction_date, ownership, user_id ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_daily_transaction_limit();
