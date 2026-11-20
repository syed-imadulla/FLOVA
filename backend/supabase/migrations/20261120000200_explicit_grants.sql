-- =====================================================================
-- FLOVA · explicit table and schema grants (Phase 1)
-- Ensures table access does not depend on Supabase's "Grant API access
-- to new tables automatically" setting.
-- =====================================================================

grant usage on schema public to authenticated;

grant select, update on public.profiles to authenticated;

grant select, insert, update, delete on
  public.balance_checkins,
  public.payouts,
  public.transactions,
  public.commitments
to authenticated;

revoke all on
  public.profiles,
  public.balance_checkins,
  public.payouts,
  public.transactions,
  public.commitments
from anon;
