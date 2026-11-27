-- =====================================================================
-- FLOVA 2.0 · Sprint 4D: Peer Debt Edit & Safe Delete RPCs (Forward-Only)
-- Adds:
--   1. Updated peer_debts_guard_remaining() allowing transaction-local
--      RPC updates via flova.allow_debt_edit = 'on'
--   2. public.update_peer_debt_atomic(...) validating settled principal
--   3. public.delete_peer_debt_safe(...) blocking deletion when settlements exist
-- =====================================================================

create or replace function public.peer_debts_guard_remaining()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if pg_catalog.pg_trigger_depth() = 1
     and coalesce(pg_catalog.current_setting('flova.allow_debt_edit', true), '') <> 'on' then
    if new.remaining_amount_paise is distinct from old.remaining_amount_paise then
      raise exception 'remaining_amount_paise is managed by debt_settlements triggers; insert a settlement instead';
    end if;
    if (new.direction is distinct from old.direction
        or new.total_amount_paise is distinct from old.total_amount_paise
        or new.person_id is distinct from old.person_id)
       and exists (select 1 from public.debt_settlements s where s.debt_id = old.id) then
      raise exception 'Cannot modify direction, total_amount_paise, or person_id after settlements exist';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.update_peer_debt_atomic(
  p_debt_id uuid,
  p_person_id uuid,
  p_total_amount_paise bigint,
  p_due_date date default null,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_debt public.peer_debts%rowtype;
  v_settled_paise bigint := 0;
  v_new_remaining bigint;
  v_new_status text;
  v_updated public.peer_debts%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_total_amount_paise is null or p_total_amount_paise <= 0 then
    raise exception 'Original amount must be greater than zero paise';
  end if;

  select * into v_debt
    from public.peer_debts
   where id = p_debt_id and user_id = v_user_id
   for update;

  if not found then
    raise exception 'Peer debt not found for user';
  end if;

  perform 1
    from public.people
   where id = p_person_id and user_id = v_user_id;
  if not found then
    raise exception 'Referenced person not found for user';
  end if;

  select coalesce(pg_catalog.sum(amount_paise), 0)::bigint
    into v_settled_paise
    from public.debt_settlements
   where debt_id = v_debt.id and user_id = v_user_id;

  if p_total_amount_paise < v_settled_paise then
    raise exception 'Original amount (%) cannot be less than already settled amount (%)', p_total_amount_paise, v_settled_paise;
  end if;

  v_new_remaining := p_total_amount_paise - v_settled_paise;
  v_new_status := case
    when v_debt.status = 'forgiven' then 'forgiven'
    when v_new_remaining = 0 then 'settled'
    when v_settled_paise > 0 then 'partially_settled'
    else 'active'
  end;

  perform pg_catalog.set_config('flova.allow_debt_edit', 'on', true);

  update public.peer_debts
     set person_id = p_person_id,
         total_amount_paise = p_total_amount_paise,
         remaining_amount_paise = v_new_remaining,
         status = v_new_status,
         due_date = p_due_date,
         reason = nullif(pg_catalog.btrim(coalesce(p_reason, '')), '')
   where id = v_debt.id and user_id = v_user_id
   returning * into v_updated;

  perform pg_catalog.set_config('flova.allow_debt_edit', '', true);

  return pg_catalog.to_jsonb(v_updated);
end;
$$;

create or replace function public.delete_peer_debt_safe(
  p_debt_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_debt public.peer_debts%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_debt
    from public.peer_debts
   where id = p_debt_id and user_id = v_user_id
   for update;

  if not found then
    raise exception 'Peer debt not found for user';
  end if;

  if exists (select 1 from public.debt_settlements where debt_id = v_debt.id and user_id = v_user_id) then
    raise exception 'Cannot delete a debt with existing repayments. Reverse repayments first.';
  end if;

  delete from public.peer_debts
   where id = v_debt.id and user_id = v_user_id;
end;
$$;

revoke all on function public.update_peer_debt_atomic(uuid, uuid, bigint, date, text) from public, anon;
grant execute on function public.update_peer_debt_atomic(uuid, uuid, bigint, date, text) to authenticated;

revoke all on function public.delete_peer_debt_safe(uuid) from public, anon;
grant execute on function public.delete_peer_debt_safe(uuid) to authenticated;
