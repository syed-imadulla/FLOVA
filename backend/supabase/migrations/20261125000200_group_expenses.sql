-- =====================================================================
-- FLOVA 2.0 · Sprint 2.5 Group Expenses & Shared Settlements Migration
-- Forward-only migration adding:
--   1. expense_groups, expense_group_members, group_expenses,
--      group_expense_splits, group_settlements
--   2. Composite UNIQUE(id, user_id) & composite FKs for cross-user safety
--   3. Concurrent-safe settlement triggers (FOR UPDATE locking)
--   4. Audit logging triggers on all group tables
--   5. Strict RLS & explicit authenticated grants (anon revoked)
-- =====================================================================

-- 1. Expand financial_audit_log.entity_type check constraint for group entities
alter table public.financial_audit_log
  drop constraint if exists financial_audit_log_entity_type_check;

alter table public.financial_audit_log
  add constraint financial_audit_log_entity_type_check check (
    entity_type in (
      'transaction', 'peer_debt', 'debt_settlement', 'commitment', 'person',
      'expense_group', 'expense_group_member', 'group_expense', 'group_expense_split', 'group_settlement'
    )
  );

-- 2. expense_groups
create table if not exists public.expense_groups (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(trim(name)) between 1 and 80),
  description text check (description is null or char_length(description) <= 200),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint expense_groups_id_user_unique unique (id, user_id)
);

-- 3. expense_group_members (either is_self=true with person_id NULL, or is_self=false with person_id NOT NULL)
create table if not exists public.expense_group_members (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  group_id  uuid not null,
  is_self   boolean not null default false,
  person_id uuid,
  joined_at timestamptz not null default now(),
  constraint expense_group_members_id_user_unique unique (id, user_id),
  constraint expense_group_members_group_fk foreign key (group_id, user_id)
    references public.expense_groups (id, user_id) on delete cascade,
  constraint expense_group_members_person_fk foreign key (person_id, user_id)
    references public.people (id, user_id) on delete restrict,
  constraint expense_group_members_identity_rule check (
    (is_self = true and person_id is null) or (is_self = false and person_id is not null)
  )
);

create unique index if not exists expense_group_members_self_uq
  on public.expense_group_members (group_id) where is_self = true;
create unique index if not exists expense_group_members_person_uq
  on public.expense_group_members (group_id, person_id) where person_id is not null;

-- 4. group_expenses
create table if not exists public.group_expenses (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users (id) on delete cascade,
  group_id            uuid not null,
  description         text not null check (char_length(trim(description)) between 1 and 120),
  total_amount_paise  bigint not null check (total_amount_paise > 0),
  paid_by_self        boolean not null default true,
  paid_by_person_id   uuid,
  expense_date        date not null default current_date,
  split_type          text not null check (split_type in ('equal', 'custom', 'percentage')),
  self_transaction_id uuid,
  note                text check (note is null or char_length(note) <= 200),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint group_expenses_id_user_unique unique (id, user_id),
  constraint group_expenses_group_fk foreign key (group_id, user_id)
    references public.expense_groups (id, user_id) on delete restrict,
  constraint group_expenses_payer_fk foreign key (paid_by_person_id, user_id)
    references public.people (id, user_id) on delete restrict,
  constraint group_expenses_payer_rule check (
    (paid_by_self = true and paid_by_person_id is null)
    or (paid_by_self = false and paid_by_person_id is not null)
  ),
  constraint group_expenses_self_tx_fk foreign key (self_transaction_id)
    references public.transactions (id) on delete set null
);

-- 5. group_expense_splits (Single Source of Truth for group receivables & payables)
create table if not exists public.group_expense_splits (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null default auth.uid() references auth.users (id) on delete cascade,
  group_expense_id       uuid not null,
  is_self                boolean not null default false,
  person_id              uuid,
  direction              text not null check (direction in ('they_owe', 'you_owe', 'self_share', 'third_party')),
  share_amount_paise     bigint not null check (share_amount_paise >= 0),
  remaining_amount_paise bigint not null check (remaining_amount_paise >= 0 and remaining_amount_paise <= share_amount_paise),
  status                 text not null default 'active' check (status in ('active', 'partially_settled', 'settled')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint group_expense_splits_id_user_unique unique (id, user_id),
  constraint group_expense_splits_expense_fk foreign key (group_expense_id, user_id)
    references public.group_expenses (id, user_id) on delete cascade,
  constraint group_expense_splits_person_fk foreign key (person_id, user_id)
    references public.people (id, user_id) on delete restrict,
  constraint group_expense_splits_identity_rule check (
    (is_self = true and person_id is null) or (is_self = false and person_id is not null)
  )
);

-- 6. group_settlements
create table if not exists public.group_settlements (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null default auth.uid() references auth.users (id) on delete cascade,
  group_expense_split_id uuid not null,
  direction              text not null check (direction in ('repayment_in', 'repayment_out')),
  amount_paise           bigint not null check (amount_paise > 0),
  settled_at             timestamptz not null default now(),
  notes                  text check (notes is null or char_length(notes) <= 200),
  created_at             timestamptz not null default now(),
  constraint group_settlements_split_fk foreign key (group_expense_split_id, user_id)
    references public.group_expense_splits (id, user_id) on delete restrict
);

-- 7. Indexes & updated_at triggers
create index if not exists expense_groups_user_idx        on public.expense_groups (user_id, created_at desc);
create index if not exists expense_group_members_grp_idx  on public.expense_group_members (group_id);
create index if not exists group_expenses_grp_idx         on public.group_expenses (group_id, expense_date desc);
create index if not exists group_expense_splits_exp_idx   on public.group_expense_splits (group_expense_id);
create index if not exists group_expense_splits_user_idx  on public.group_expense_splits (user_id, status);
create index if not exists group_settlements_split_idx    on public.group_settlements (group_expense_split_id, settled_at desc);

drop trigger if exists expense_groups_updated_at on public.expense_groups;
create trigger expense_groups_updated_at
  before update on public.expense_groups
  for each row execute function public.set_updated_at();

drop trigger if exists group_expenses_updated_at on public.group_expenses;
create trigger group_expenses_updated_at
  before update on public.group_expenses
  for each row execute function public.set_updated_at();

drop trigger if exists group_expense_splits_updated_at on public.group_expense_splits;
create trigger group_expense_splits_updated_at
  before update on public.group_expense_splits
  for each row execute function public.set_updated_at();

-- 8. Concurrent-safe group settlement triggers (empty search_path)
create or replace function public.group_settlements_apply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_split public.group_expense_splits%rowtype;
  v_expected_dir text;
  v_new_remaining bigint;
  v_new_status text;
begin
  select * into v_split
    from public.group_expense_splits
   where id = new.group_expense_split_id and user_id = new.user_id
   for update;

  if not found then
    raise exception 'Referenced group_expense_split not found for user';
  end if;

  if v_split.direction not in ('they_owe', 'you_owe') then
    raise exception 'Cannot settle split with direction %', v_split.direction;
  end if;

  v_expected_dir := case when v_split.direction = 'you_owe' then 'repayment_out' else 'repayment_in' end;
  if new.direction <> v_expected_dir then
    raise exception 'Invalid settlement direction % for split direction %', new.direction, v_split.direction;
  end if;

  if v_split.status not in ('active', 'partially_settled') then
    raise exception 'Cannot settle split in status %', v_split.status;
  end if;

  if new.amount_paise > v_split.remaining_amount_paise then
    raise exception 'Overpayment rejected: settlement % exceeds remaining %', new.amount_paise, v_split.remaining_amount_paise;
  end if;

  v_new_remaining := v_split.remaining_amount_paise - new.amount_paise;
  v_new_status := case when v_new_remaining = 0 then 'settled' else 'partially_settled' end;

  update public.group_expense_splits
     set remaining_amount_paise = v_new_remaining,
         status = v_new_status
   where id = v_split.id;

  return new;
end;
$$;

drop trigger if exists trg_group_settlements_apply on public.group_settlements;
create trigger trg_group_settlements_apply
  before insert on public.group_settlements
  for each row execute function public.group_settlements_apply();

create or replace function public.group_settlements_revert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_split public.group_expense_splits%rowtype;
  v_new_remaining bigint;
  v_new_status text;
begin
  select * into v_split
    from public.group_expense_splits
   where id = old.group_expense_split_id and user_id = old.user_id
   for update;

  if not found then
    return old;
  end if;

  v_new_remaining := least(v_split.share_amount_paise, v_split.remaining_amount_paise + old.amount_paise);
  v_new_status := case
    when v_new_remaining = 0 then 'settled'
    when v_new_remaining < v_split.share_amount_paise then 'partially_settled'
    else 'active'
  end;

  update public.group_expense_splits
     set remaining_amount_paise = v_new_remaining,
         status = v_new_status
   where id = v_split.id;

  return old;
end;
$$;

drop trigger if exists trg_group_settlements_revert on public.group_settlements;
create trigger trg_group_settlements_revert
  after delete on public.group_settlements
  for each row execute function public.group_settlements_revert();

create or replace function public.group_expense_splits_guard_remaining()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if pg_catalog.pg_trigger_depth() = 1 and new.remaining_amount_paise is distinct from old.remaining_amount_paise then
    raise exception 'remaining_amount_paise is managed by group_settlements triggers';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_group_expense_splits_guard on public.group_expense_splits;
create trigger trg_group_expense_splits_guard
  before update on public.group_expense_splits
  for each row execute function public.group_expense_splits_guard_remaining();

-- 9. Audit triggers on all group tables
drop trigger if exists audit_expense_groups_trg on public.expense_groups;
create trigger audit_expense_groups_trg
  after insert or update or delete on public.expense_groups
  for each row execute function public.record_financial_audit_log('expense_group');

drop trigger if exists audit_expense_group_members_trg on public.expense_group_members;
create trigger audit_expense_group_members_trg
  after insert or update or delete on public.expense_group_members
  for each row execute function public.record_financial_audit_log('expense_group_member');

drop trigger if exists audit_group_expenses_trg on public.group_expenses;
create trigger audit_group_expenses_trg
  after insert or update or delete on public.group_expenses
  for each row execute function public.record_financial_audit_log('group_expense');

drop trigger if exists audit_group_expense_splits_trg on public.group_expense_splits;
create trigger audit_group_expense_splits_trg
  after insert or update or delete on public.group_expense_splits
  for each row execute function public.record_financial_audit_log('group_expense_split');

drop trigger if exists audit_group_settlements_trg on public.group_settlements;
create trigger audit_group_settlements_trg
  after insert or update or delete on public.group_settlements
  for each row execute function public.record_financial_audit_log('group_settlement');

-- 10. RLS & Explicit Grants
alter table public.expense_groups        enable row level security;
alter table public.expense_group_members enable row level security;
alter table public.group_expenses        enable row level security;
alter table public.group_expense_splits  enable row level security;
alter table public.group_settlements     enable row level security;

revoke all on public.expense_groups, public.expense_group_members, public.group_expenses, public.group_expense_splits, public.group_settlements from anon;
grant select, insert, update, delete on public.expense_groups, public.expense_group_members, public.group_expenses, public.group_expense_splits to authenticated;
grant select, insert, delete on public.group_settlements to authenticated;

do $$
declare t text;
begin
  foreach t in array array['expense_groups', 'expense_group_members', 'group_expenses', 'group_expense_splits'] loop
    execute format('drop policy if exists %1$s_select_own on public.%1$s', t);
    execute format('drop policy if exists %1$s_insert_own on public.%1$s', t);
    execute format('drop policy if exists %1$s_update_own on public.%1$s', t);
    execute format('drop policy if exists %1$s_delete_own on public.%1$s', t);
    execute format('create policy %1$s_select_own on public.%1$s for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy %1$s_insert_own on public.%1$s for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy %1$s_update_own on public.%1$s for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy %1$s_delete_own on public.%1$s for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

drop policy if exists group_settlements_select_own on public.group_settlements;
drop policy if exists group_settlements_insert_own on public.group_settlements;
drop policy if exists group_settlements_delete_own on public.group_settlements;
create policy group_settlements_select_own on public.group_settlements for select to authenticated using ((select auth.uid()) = user_id);
create policy group_settlements_insert_own on public.group_settlements for insert to authenticated with check ((select auth.uid()) = user_id);
create policy group_settlements_delete_own on public.group_settlements for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on function public.group_settlements_apply() from public, anon, authenticated;
revoke all on function public.group_settlements_revert() from public, anon, authenticated;
revoke all on function public.group_expense_splits_guard_remaining() from public, anon, authenticated;
