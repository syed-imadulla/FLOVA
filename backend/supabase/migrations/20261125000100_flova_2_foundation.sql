-- =====================================================================
-- FLOVA 2.0 · Sprint 1 Foundation Migration (Forward-Only)
-- Adds:
--   1. Nullable transactions.inflow_category (100% v1.0.1 compatible)
--   2. people, peer_debts, debt_settlements (Single Source of Truth)
--   3. Composite UNIQUE(id, user_id) & composite FKs for cross-user safety
--   4. Atomic concurrent-safe settlement triggers (FOR UPDATE locking)
--   5. Append-only financial_audit_log (REVOKE + immutability trigger)
--   6. Strict RLS & function EXECUTE hardening
-- =====================================================================

-- 1. Extend transactions with nullable inflow_category (preserves type IN ('income','expense'))
alter table public.transactions
  add column if not exists inflow_category text;

alter table public.transactions
  drop constraint if exists transactions_inflow_category_rule;

alter table public.transactions
  add constraint transactions_inflow_category_rule check (
    inflow_category is null
    or (
      type = 'income'
      and ownership = 'mine'
      and inflow_category in ('earned', 'family_support', 'pocket_money', 'gift', 'donation')
    )
  );

-- 2. people (peer directory)
create table if not exists public.people (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null check (char_length(trim(name)) between 1 and 80),
  phone        text check (phone is null or char_length(phone) <= 20),
  upi_id       text check (upi_id is null or char_length(upi_id) <= 100),
  relationship text check (relationship is null or char_length(relationship) <= 40),
  is_favorite  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint people_id_user_unique unique (id, user_id)
);

-- 3. peer_debts (Single Source of Truth for borrowed & lent principal in integer paise)
create table if not exists public.peer_debts (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null default auth.uid() references auth.users (id) on delete cascade,
  person_id              uuid not null,
  direction              text not null check (direction in ('you_owe', 'they_owe')),
  total_amount_paise     bigint not null check (total_amount_paise > 0),
  remaining_amount_paise bigint not null check (remaining_amount_paise >= 0 and remaining_amount_paise <= total_amount_paise),
  reason                 text check (reason is null or char_length(reason) <= 200),
  status                 text not null default 'active' check (status in ('active', 'partially_settled', 'settled', 'forgiven')),
  due_date               date,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint peer_debts_id_user_unique unique (id, user_id),
  constraint peer_debts_person_fk foreign key (person_id, user_id)
    references public.people (id, user_id) on delete restrict
);

-- 4. debt_settlements (Single Source of Truth for partial & full repayments in integer paise)
create table if not exists public.debt_settlements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  debt_id      uuid not null,
  direction    text not null check (direction in ('repayment_out', 'repayment_in')),
  amount_paise bigint not null check (amount_paise > 0),
  payment_mode text check (payment_mode is null or char_length(payment_mode) <= 30),
  reference_id text check (reference_id is null or char_length(reference_id) <= 100),
  settled_at   timestamptz not null default now(),
  notes        text check (notes is null or char_length(notes) <= 200),
  created_at   timestamptz not null default now(),
  constraint debt_settlements_debt_fk foreign key (debt_id, user_id)
    references public.peer_debts (id, user_id) on delete restrict
);

-- 5. Indexes
create index if not exists people_user_name_idx         on public.people (user_id, name);
create index if not exists peer_debts_user_status_idx   on public.peer_debts (user_id, status, due_date);
create index if not exists peer_debts_person_idx        on public.peer_debts (person_id);
create index if not exists debt_settlements_debt_idx    on public.debt_settlements (debt_id, settled_at desc);

-- updated_at triggers
drop trigger if exists people_updated_at on public.people;
create trigger people_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

drop trigger if exists peer_debts_updated_at on public.peer_debts;
create trigger peer_debts_updated_at
  before update on public.peer_debts
  for each row execute function public.set_updated_at();

-- 6. Concurrent-safe settlement validation & atomic balance update triggers
create or replace function public.debt_settlements_apply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_debt public.peer_debts%rowtype;
  v_expected_dir text;
  v_new_remaining bigint;
  v_new_status text;
begin
  -- Lock parent debt row to serialize concurrent settlements
  select * into v_debt
    from public.peer_debts
   where id = new.debt_id and user_id = new.user_id
   for update;

  if not found then
    raise exception 'Referenced peer_debt not found for user';
  end if;

  v_expected_dir := case when v_debt.direction = 'you_owe' then 'repayment_out' else 'repayment_in' end;
  if new.direction <> v_expected_dir then
    raise exception 'Invalid settlement direction % for debt direction %', new.direction, v_debt.direction;
  end if;

  if v_debt.status not in ('active', 'partially_settled') then
    raise exception 'Cannot settle peer_debt in status %', v_debt.status;
  end if;

  if new.amount_paise > v_debt.remaining_amount_paise then
    raise exception 'Overpayment rejected: settlement % exceeds remaining %', new.amount_paise, v_debt.remaining_amount_paise;
  end if;

  v_new_remaining := v_debt.remaining_amount_paise - new.amount_paise;
  v_new_status := case when v_new_remaining = 0 then 'settled' else 'partially_settled' end;

  update public.peer_debts
     set remaining_amount_paise = v_new_remaining,
         status = v_new_status
   where id = v_debt.id;

  return new;
end;
$$;

drop trigger if exists trg_debt_settlements_apply on public.debt_settlements;
create trigger trg_debt_settlements_apply
  before insert on public.debt_settlements
  for each row execute function public.debt_settlements_apply();

create or replace function public.debt_settlements_revert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_debt public.peer_debts%rowtype;
  v_new_remaining bigint;
  v_new_status text;
begin
  select * into v_debt
    from public.peer_debts
   where id = old.debt_id and user_id = old.user_id
   for update;

  if not found then
    return old;
  end if;

  v_new_remaining := least(v_debt.total_amount_paise, v_debt.remaining_amount_paise + old.amount_paise);
  v_new_status := case
    when v_debt.status = 'forgiven' then 'forgiven'
    when v_new_remaining = 0 then 'settled'
    when v_new_remaining < v_debt.total_amount_paise then 'partially_settled'
    else 'active'
  end;

  update public.peer_debts
     set remaining_amount_paise = v_new_remaining,
         status = v_new_status
   where id = v_debt.id;

  return old;
end;
$$;

drop trigger if exists trg_debt_settlements_revert on public.debt_settlements;
create trigger trg_debt_settlements_revert
  after delete on public.debt_settlements
  for each row execute function public.debt_settlements_revert();

-- Guard peer_debts.remaining_amount_paise against direct client edits,
-- and lock direction/total_amount_paise/person_id once settlements exist.
create or replace function public.peer_debts_guard_remaining()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if pg_catalog.pg_trigger_depth() = 1 then
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

drop trigger if exists trg_peer_debts_guard_remaining on public.peer_debts;
create trigger trg_peer_debts_guard_remaining
  before update on public.peer_debts
  for each row execute function public.peer_debts_guard_remaining();

-- 7. Append-Only Financial Audit Log
create table if not exists public.financial_audit_log (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  acting_user_id uuid,
  entity_type    text not null check (entity_type in ('transaction', 'peer_debt', 'debt_settlement', 'commitment', 'person')),
  entity_id      uuid not null,
  action         text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  state_before   jsonb,
  state_after    jsonb,
  actor          text not null default 'system_trigger',
  reason         text,
  created_at     timestamptz not null default now()
);

create index if not exists financial_audit_log_user_time_idx
  on public.financial_audit_log (user_id, created_at desc);

create or replace function public.enforce_audit_log_immutability()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'financial_audit_log is append-only. UPDATE and DELETE operations are strictly prohibited.';
end;
$$;

drop trigger if exists trg_financial_audit_log_immutable on public.financial_audit_log;
create trigger trg_financial_audit_log_immutable
  before update or delete on public.financial_audit_log
  for each row execute function public.enforce_audit_log_immutability();

create or replace function public.record_financial_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entity_type text := tg_argv[0];
  v_user_id uuid;
  v_entity_id uuid;
  v_before jsonb := null;
  v_after jsonb := null;
begin
  if tg_op = 'INSERT' then
    v_user_id := new.user_id;
    v_entity_id := new.id;
    v_after := pg_catalog.to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    v_user_id := new.user_id;
    v_entity_id := new.id;
    v_before := pg_catalog.to_jsonb(old);
    v_after := pg_catalog.to_jsonb(new);
  elsif tg_op = 'DELETE' then
    v_user_id := old.user_id;
    v_entity_id := old.id;
    v_before := pg_catalog.to_jsonb(old);
  end if;

  insert into public.financial_audit_log (
    user_id, acting_user_id, entity_type, entity_id, action, state_before, state_after
  ) values (
    v_user_id, auth.uid(), v_entity_type, v_entity_id, tg_op, v_before, v_after
  );

  return null;
end;
$$;

drop trigger if exists audit_transactions_trg on public.transactions;
create trigger audit_transactions_trg
  after insert or update or delete on public.transactions
  for each row execute function public.record_financial_audit_log('transaction');

drop trigger if exists audit_peer_debts_trg on public.peer_debts;
create trigger audit_peer_debts_trg
  after insert or update or delete on public.peer_debts
  for each row execute function public.record_financial_audit_log('peer_debt');

drop trigger if exists audit_debt_settlements_trg on public.debt_settlements;
create trigger audit_debt_settlements_trg
  after insert or update or delete on public.debt_settlements
  for each row execute function public.record_financial_audit_log('debt_settlement');

drop trigger if exists audit_commitments_trg on public.commitments;
create trigger audit_commitments_trg
  after insert or update or delete on public.commitments
  for each row execute function public.record_financial_audit_log('commitment');

drop trigger if exists audit_people_trg on public.people;
create trigger audit_people_trg
  after insert or update or delete on public.people
  for each row execute function public.record_financial_audit_log('person');

-- 8. RLS & Privilege Hardening
alter table public.people              enable row level security;
alter table public.peer_debts          enable row level security;
alter table public.debt_settlements    enable row level security;
alter table public.financial_audit_log enable row level security;

revoke all on public.people, public.peer_debts, public.debt_settlements, public.financial_audit_log from anon;
grant select, insert, update, delete on public.people, public.peer_debts to authenticated;
grant select, insert, delete on public.debt_settlements to authenticated;
revoke insert, update, delete, truncate on public.financial_audit_log from anon, authenticated, public;
grant select on public.financial_audit_log to authenticated;

drop policy if exists people_select_own on public.people;
drop policy if exists people_insert_own on public.people;
drop policy if exists people_update_own on public.people;
drop policy if exists people_delete_own on public.people;
create policy people_select_own on public.people for select to authenticated using ((select auth.uid()) = user_id);
create policy people_insert_own on public.people for insert to authenticated with check ((select auth.uid()) = user_id);
create policy people_update_own on public.people for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy people_delete_own on public.people for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists peer_debts_select_own on public.peer_debts;
drop policy if exists peer_debts_insert_own on public.peer_debts;
drop policy if exists peer_debts_update_own on public.peer_debts;
drop policy if exists peer_debts_delete_own on public.peer_debts;
create policy peer_debts_select_own on public.peer_debts for select to authenticated using ((select auth.uid()) = user_id);
create policy peer_debts_insert_own on public.peer_debts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy peer_debts_update_own on public.peer_debts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy peer_debts_delete_own on public.peer_debts for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists debt_settlements_select_own on public.debt_settlements;
drop policy if exists debt_settlements_insert_own on public.debt_settlements;
drop policy if exists debt_settlements_delete_own on public.debt_settlements;
create policy debt_settlements_select_own on public.debt_settlements for select to authenticated using ((select auth.uid()) = user_id);
create policy debt_settlements_insert_own on public.debt_settlements for insert to authenticated with check ((select auth.uid()) = user_id);
create policy debt_settlements_delete_own on public.debt_settlements for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists financial_audit_log_select_own on public.financial_audit_log;
create policy financial_audit_log_select_own on public.financial_audit_log
  for select to authenticated using ((select auth.uid()) = user_id);

-- Revoke direct RPC execution on internal trigger functions
revoke all on function public.debt_settlements_apply() from public, anon, authenticated;
revoke all on function public.debt_settlements_revert() from public, anon, authenticated;
revoke all on function public.peer_debts_guard_remaining() from public, anon, authenticated;
revoke all on function public.enforce_audit_log_immutability() from public, anon, authenticated;
revoke all on function public.record_financial_audit_log() from public, anon, authenticated;
