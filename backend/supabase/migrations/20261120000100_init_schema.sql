-- =====================================================================
-- FLOVA · initial schema (M1: backend & database)
-- Tables: profiles, balance_checkins, payouts, transactions, commitments
-- Every personal-data table has RLS scoped to auth.uid().
-- Money: numeric(12,2) rupees in the database. The app converts to integer
-- paise before any arithmetic (frontend/src/lib/money.ts). Never use float maths.
-- =====================================================================

-- ---------- enums (the shared contract: change only with team agreement) ----------
create type public.work_profile       as enum ('delivery', 'driver', 'service', 'freelancer', 'independent_business');
create type public.payout_pattern     as enum ('daily', 'weekly', 'per_job', 'milestone', 'variable');
create type public.app_language       as enum ('en', 'kn', 'hi');
create type public.transaction_type   as enum ('income', 'expense');
create type public.expense_type       as enum ('living', 'work');
create type public.money_ownership    as enum ('mine', 'not_mine');
create type public.payout_kind        as enum ('platform_payout', 'incentive', 'client_payment', 'advance', 'other');
create type public.payout_status      as enum ('scheduled', 'estimated', 'unearned', 'partial', 'settled', 'cancelled');
create type public.commitment_kind    as enum ('bill', 'debt');
create type public.commitment_status  as enum ('upcoming', 'paid', 'cancelled');

-- ---------- shared helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- profiles (1 row per auth user) ----------
create table public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  display_name          text check (char_length(display_name) <= 80),
  work_profile          public.work_profile   not null default 'delivery',
  payout_pattern        public.payout_pattern not null default 'weekly',
  preferred_language    public.app_language   not null default 'en',
  -- daily estimates feed the runway; NULL means "not provided" (engine shows uncertainty, never treats as 0)
  daily_living_estimate numeric(12,2) check (daily_living_estimate >= 0),
  daily_work_estimate   numeric(12,2) check (daily_work_estimate >= 0),
  onboarding_completed  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- auto-create a profile when someone signs up (display_name from sign-up metadata, if given)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80), ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- balance check-ins (actual cash + bank at a moment) ----------
create table public.balance_checkins (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cash_amount     numeric(12,2) not null check (cash_amount >= 0),
  bank_amount     numeric(12,2) not null check (bank_amount >= 0),
  -- part of the cash/bank above that belongs to someone else (e.g. COD collected for the platform)
  not_mine_amount numeric(12,2) not null default 0 check (not_mine_amount >= 0),
  note            text check (char_length(note) <= 200),
  checked_at      timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  constraint not_mine_within_total check (not_mine_amount <= cash_amount + bank_amount)
);

-- ---------- payouts (money expected; NOT cash until received) ----------
create table public.payouts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind            public.payout_kind   not null default 'platform_payout',
  source          text check (char_length(source) <= 80),          -- platform / client name
  expected_amount numeric(12,2) not null check (expected_amount > 0),
  received_amount numeric(12,2) not null default 0 check (received_amount >= 0), -- maintained by trigger
  expected_date   date,                                              -- NULL = unknown date
  status          public.payout_status not null default 'scheduled',
  note            text check (char_length(note) <= 200),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint payouts_id_user_unique unique (id, user_id)
);

-- ---------- transactions (money that actually moved) ----------
create table public.transactions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type             public.transaction_type not null,
  amount           numeric(12,2) not null check (amount > 0),
  category         text not null default 'other' check (char_length(category) <= 40),
  description      text check (char_length(description) <= 200),
  expense_type     public.expense_type,                 -- required for own expenses only
  ownership        public.money_ownership not null default 'mine',
  payout_id        uuid,                                -- set when this income settles (part of) a payout
  transaction_date date not null default current_date,
  source           text not null default 'manual' check (source in ('manual', 'voice', 'ai_suggestion', 'demo')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- own expenses must say living or work; income and not-mine money must not
  constraint expense_type_rule check (
    (type = 'expense' and ownership = 'mine' and expense_type is not null)
    or (not (type = 'expense' and ownership = 'mine') and expense_type is null)
  ),
  -- only own income can settle a payout
  constraint payout_link_rule check (payout_id is null or (type = 'income' and ownership = 'mine')),
  -- a transaction can only link to a payout of the SAME user
  constraint transactions_payout_fk foreign key (payout_id, user_id)
    references public.payouts (id, user_id) on delete set null (payout_id)
);

-- ---------- commitments (bills and debts with due dates) ----------
create table public.commitments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 80),
  amount     numeric(12,2) not null check (amount > 0),
  due_date   date not null,
  category   text not null default 'other' check (char_length(category) <= 40),
  kind       public.commitment_kind   not null default 'bill',
  status     public.commitment_status not null default 'upcoming',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- indexes for the queries the app runs ----------
create index balance_checkins_user_time on public.balance_checkins (user_id, checked_at desc);
create index transactions_user_date     on public.transactions (user_id, transaction_date desc);
create index transactions_payout        on public.transactions (payout_id) where payout_id is not null;
create index payouts_user_date          on public.payouts (user_id, expected_date);
create index commitments_user_due       on public.commitments (user_id, due_date);

-- ---------- updated_at triggers ----------
create trigger profiles_updated_at     before update on public.profiles     for each row execute function public.set_updated_at();
create trigger payouts_updated_at      before update on public.payouts      for each row execute function public.set_updated_at();
create trigger transactions_updated_at before update on public.transactions for each row execute function public.set_updated_at();
create trigger commitments_updated_at  before update on public.commitments  for each row execute function public.set_updated_at();

-- ---------- keep payouts.received_amount and status in sync with linked income ----------
-- Received money is recorded ONCE, as an income transaction linked by payout_id.
-- The payout only mirrors the total, so it can never be double-counted.
create or replace function public.sync_payout_received(p_payout uuid)
returns void language plpgsql set search_path = '' as $$
declare
  v_received numeric(12,2);
begin
  if p_payout is null then return; end if;
  select coalesce(sum(t.amount), 0) into v_received
    from public.transactions t where t.payout_id = p_payout;
  update public.payouts p
     set received_amount = v_received,
         status = case
           when p.status = 'cancelled' then p.status
           when v_received >= p.expected_amount then 'settled'::public.payout_status
           when v_received > 0 then 'partial'::public.payout_status
           when p.status in ('partial', 'settled') then 'scheduled'::public.payout_status
           else p.status
         end
   where p.id = p_payout;
end $$;

create or replace function public.transactions_sync_payout()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then perform public.sync_payout_received(old.payout_id); end if;
  if tg_op in ('INSERT', 'UPDATE') and (tg_op = 'INSERT' or new.payout_id is distinct from old.payout_id or new.amount <> old.amount) then
    perform public.sync_payout_received(new.payout_id);
  end if;
  return null;
end $$;

create trigger transactions_payout_sync
  after insert or update or delete on public.transactions
  for each row execute function public.transactions_sync_payout();

-- payouts.received_amount is owned by the trigger: block direct edits from the app
create or replace function public.payouts_guard_received()
returns trigger language plpgsql set search_path = '' as $$
begin
  if pg_trigger_depth() = 1 and new.received_amount is distinct from old.received_amount then
    raise exception 'received_amount is derived from linked income transactions; add a transaction with payout_id instead';
  end if;
  return new;
end $$;

create trigger payouts_guard_received
  before update on public.payouts
  for each row execute function public.payouts_guard_received();

-- =====================================================================
-- Row Level Security: each signed-in user sees and changes only their own rows
-- =====================================================================
alter table public.profiles         enable row level security;
alter table public.balance_checkins enable row level security;
alter table public.payouts          enable row level security;
alter table public.transactions     enable row level security;
alter table public.commitments      enable row level security;

-- profiles: created by the sign-up trigger; users read and update only their own
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- the four user-owned tables share the same four policies
do $$
declare t text;
begin
  foreach t in array array['balance_checkins', 'payouts', 'transactions', 'commitments'] loop
    execute format('create policy %1$s_select_own on public.%1$s for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy %1$s_insert_own on public.%1$s for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy %1$s_update_own on public.%1$s for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy %1$s_delete_own on public.%1$s for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- anonymous visitors get nothing
revoke all on public.profiles, public.balance_checkins, public.payouts, public.transactions, public.commitments from anon;
