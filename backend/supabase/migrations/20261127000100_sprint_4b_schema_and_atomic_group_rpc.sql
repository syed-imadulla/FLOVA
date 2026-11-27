-- =====================================================================
-- FLOVA 2.0 · Sprint 4B: Schema & Data Integrity Foundations (Forward-Only)
-- Adds:
--   1. Nullable transactions.payment_method ('cash' | 'bank' | 'upi')
--      and transactions.receipt_path (private storage path)
--   2. Private 'receipts' Supabase Storage bucket + user-scoped RLS
--   3. group_expenses.idempotency_key + unique index
--   4. Atomic, idempotent public.record_group_expense_atomic(...) RPC
-- =====================================================================

-- 1. Extend transactions safely (historical rows stay NULL; no fabricated data)
alter table public.transactions
  add column if not exists payment_method text,
  add column if not exists receipt_path text;

alter table public.transactions
  drop constraint if exists transactions_payment_method_rule;

alter table public.transactions
  add constraint transactions_payment_method_rule check (
    payment_method is null or payment_method in ('cash', 'bank', 'upi')
  );

alter table public.transactions
  drop constraint if exists transactions_receipt_path_rule;

alter table public.transactions
  add constraint transactions_receipt_path_rule check (
    receipt_path is null or char_length(trim(receipt_path)) between 1 and 300
  );

-- 2. Private Supabase Storage bucket for financial receipts
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- User-scoped RLS on storage.objects for 'receipts' (<auth.uid()>/<file>)
drop policy if exists receipts_select_own on storage.objects;
drop policy if exists receipts_insert_own on storage.objects;
drop policy if exists receipts_update_own on storage.objects;
drop policy if exists receipts_delete_own on storage.objects;

create policy receipts_select_own
  on storage.objects for select to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy receipts_insert_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy receipts_update_own
  on storage.objects for update to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy receipts_delete_own
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 3. Idempotency key on group_expenses
alter table public.group_expenses
  add column if not exists idempotency_key text;

create unique index if not exists group_expenses_user_idem_uq
  on public.group_expenses (user_id, idempotency_key)
  where idempotency_key is not null;

-- 4. Atomic group expense recording RPC (single transaction, full rollback on any failure)
create or replace function public.record_group_expense_atomic(
  p_group_id uuid,
  p_description text,
  p_total_amount_paise bigint,
  p_paid_by_self boolean,
  p_paid_by_person_id uuid,
  p_expense_date date,
  p_split_type text,
  p_splits jsonb,
  p_note text default null,
  p_idempotency_key text default null,
  p_self_category text default 'food',
  p_self_expense_type text default 'living',
  p_created_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_desc text;
  v_idem text;
  v_existing_exp public.group_expenses%rowtype;
  v_existing_splits jsonb;
  v_elem jsonb;
  v_is_self boolean;
  v_person_id uuid;
  v_share_paise bigint;
  v_sum_paise bigint := 0;
  v_self_share_paise bigint := 0;
  v_seen_self boolean := false;
  v_seen_people uuid[] := array[]::uuid[];
  v_self_tx_id uuid := null;
  v_expense public.group_expenses%rowtype;
  v_dir text;
  v_rem bigint;
  v_status text;
  v_split_row public.group_expense_splits%rowtype;
  v_splits_out jsonb := '[]'::jsonb;
  v_ts timestamptz;
  v_self_cat text;
  v_self_exp_type text;
begin
  -- 1. Validate authenticated user
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_desc := pg_catalog.btrim(coalesce(p_description, ''));
  if pg_catalog.char_length(v_desc) < 1 or pg_catalog.char_length(v_desc) > 120 then
    raise exception 'Description must be between 1 and 120 characters';
  end if;

  if p_total_amount_paise is null or p_total_amount_paise <= 0 then
    raise exception 'Total amount must be greater than zero paise';
  end if;

  if p_split_type not in ('equal', 'custom', 'percentage') then
    raise exception 'Invalid split_type: %', p_split_type;
  end if;

  v_idem := nullif(pg_catalog.btrim(coalesce(p_idempotency_key, '')), '');

  -- 2. Idempotency check
  if v_idem is not null then
    select * into v_existing_exp
      from public.group_expenses
     where user_id = v_user_id and idempotency_key = v_idem;

    if found then
      if v_existing_exp.group_id <> p_group_id
         or v_existing_exp.total_amount_paise <> p_total_amount_paise
         or v_existing_exp.paid_by_self <> p_paid_by_self
         or v_existing_exp.split_type <> p_split_type then
        raise exception 'Idempotency key conflict: existing group expense has different details';
      end if;

      select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) order by s.created_at, s.id), '[]'::jsonb)
        into v_existing_splits
        from public.group_expense_splits s
       where s.group_expense_id = v_existing_exp.id and s.user_id = v_user_id;

      return pg_catalog.jsonb_build_object(
        'expense', pg_catalog.to_jsonb(v_existing_exp),
        'splits', v_existing_splits
      );
    end if;
  end if;

  -- 3. Validate group ownership
  perform 1
    from public.expense_groups g
   where g.id = p_group_id and g.user_id = v_user_id;
  if not found then
    raise exception 'Expense group not found for user';
  end if;

  -- 4. Validate payer membership
  if p_paid_by_self then
    if p_paid_by_person_id is not null then
      raise exception 'paid_by_person_id must be null when paid_by_self is true';
    end if;
    perform 1
      from public.expense_group_members m
     where m.group_id = p_group_id and m.user_id = v_user_id and m.is_self = true;
    if not found then
      raise exception 'Self is not a member of this group';
    end if;
  else
    if p_paid_by_person_id is null then
      raise exception 'paid_by_person_id is required when paid_by_self is false';
    end if;
    perform 1
      from public.expense_group_members m
     where m.group_id = p_group_id and m.user_id = v_user_id and m.is_self = false and m.person_id = p_paid_by_person_id;
    if not found then
      raise exception 'Payer is not a member of this group';
    end if;
  end if;

  -- 5. Validate participants & split total
  if p_splits is null or pg_catalog.jsonb_typeof(p_splits) <> 'array' or pg_catalog.jsonb_array_length(p_splits) = 0 then
    raise exception 'Splits array must not be empty';
  end if;

  for v_elem in select value from pg_catalog.jsonb_array_elements(p_splits) loop
    v_is_self := coalesce((v_elem->>'isSelf')::boolean, (v_elem->>'is_self')::boolean, false);
    v_person_id := nullif(coalesce(v_elem->>'personId', v_elem->>'person_id', ''), '')::uuid;
    v_share_paise := coalesce((v_elem->>'shareAmountPaise')::bigint, (v_elem->>'share_amount_paise')::bigint);

    if v_share_paise is null or v_share_paise < 0 then
      raise exception 'Each split shareAmountPaise must be >= 0';
    end if;

    if v_is_self then
      if v_person_id is not null then
        raise exception 'Self split cannot have personId';
      end if;
      if v_seen_self then
        raise exception 'Duplicate self participant in splits';
      end if;
      v_seen_self := true;

      perform 1
        from public.expense_group_members m
       where m.group_id = p_group_id and m.user_id = v_user_id and m.is_self = true;
      if not found then
        raise exception 'Self participant is not a member of this group';
      end if;

      v_self_share_paise := v_self_share_paise + v_share_paise;
    else
      if v_person_id is null then
        raise exception 'Participant personId is required';
      end if;
      if v_person_id = any(v_seen_people) then
        raise exception 'Duplicate participant % in splits', v_person_id;
      end if;
      v_seen_people := pg_catalog.array_append(v_seen_people, v_person_id);

      perform 1
        from public.expense_group_members m
       where m.group_id = p_group_id and m.user_id = v_user_id and m.is_self = false and m.person_id = v_person_id;
      if not found then
        raise exception 'Participant % is not a member of this group', v_person_id;
      end if;
    end if;

    v_sum_paise := v_sum_paise + v_share_paise;
  end loop;

  if v_sum_paise <> p_total_amount_paise then
    raise exception 'Split shares (%) do not equal total amount (%)', v_sum_paise, p_total_amount_paise;
  end if;

  v_ts := coalesce(p_created_at, now());
  v_self_cat := coalesce(nullif(pg_catalog.btrim(coalesce(p_self_category, '')), ''), 'food');
  v_self_exp_type := coalesce(nullif(pg_catalog.btrim(coalesce(p_self_expense_type, '')), ''), 'living');
  if v_self_exp_type not in ('living', 'work') then
    raise exception 'Invalid self expense_type: %', v_self_exp_type;
  end if;

  -- 6. Create self transaction if user has a positive own share
  if v_self_share_paise > 0 then
    insert into public.transactions (
      user_id, type, amount, category, description, expense_type,
      ownership, transaction_date, source, created_at
    ) values (
      v_user_id,
      'expense'::public.transaction_type,
      pg_catalog.round(v_self_share_paise::numeric / 100.0, 2),
      pg_catalog.left(v_self_cat, 40),
      pg_catalog.left(v_desc || ' (your share)', 140),
      v_self_exp_type::public.expense_type,
      'mine'::public.money_ownership,
      p_expense_date,
      'manual',
      v_ts
    )
    returning id into v_self_tx_id;
  end if;

  -- 7. Insert group expense
  insert into public.group_expenses (
    user_id, group_id, description, total_amount_paise,
    paid_by_self, paid_by_person_id, expense_date, split_type,
    self_transaction_id, note, idempotency_key, created_at
  ) values (
    v_user_id, p_group_id, v_desc, p_total_amount_paise,
    p_paid_by_self, case when p_paid_by_self then null else p_paid_by_person_id end,
    p_expense_date, p_split_type,
    v_self_tx_id, nullif(pg_catalog.btrim(coalesce(p_note, '')), ''), v_idem, v_ts
  )
  returning * into v_expense;

  -- 8. Insert all participant splits
  for v_elem in select value from pg_catalog.jsonb_array_elements(p_splits) loop
    v_is_self := coalesce((v_elem->>'isSelf')::boolean, (v_elem->>'is_self')::boolean, false);
    v_person_id := nullif(coalesce(v_elem->>'personId', v_elem->>'person_id', ''), '')::uuid;
    v_share_paise := coalesce((v_elem->>'shareAmountPaise')::bigint, (v_elem->>'share_amount_paise')::bigint);

    if p_paid_by_self then
      if v_is_self or v_share_paise = 0 then
        v_dir := 'self_share';
        v_rem := 0;
        v_status := 'settled';
      else
        v_dir := 'they_owe';
        v_rem := v_share_paise;
        v_status := 'active';
      end if;
    else
      if v_is_self and v_share_paise > 0 then
        v_dir := 'you_owe';
        v_rem := v_share_paise;
        v_status := 'active';
      else
        v_dir := 'third_party';
        v_rem := 0;
        v_status := 'settled';
      end if;
    end if;

    insert into public.group_expense_splits (
      user_id, group_expense_id, is_self, person_id,
      direction, share_amount_paise, remaining_amount_paise, status, created_at
    ) values (
      v_user_id, v_expense.id, v_is_self, case when v_is_self then null else v_person_id end,
      v_dir, v_share_paise, v_rem, v_status, v_ts
    )
    returning * into v_split_row;

    v_splits_out := v_splits_out || pg_catalog.jsonb_build_array(pg_catalog.to_jsonb(v_split_row));
  end loop;

  return pg_catalog.jsonb_build_object(
    'expense', pg_catalog.to_jsonb(v_expense),
    'splits', v_splits_out
  );
end;
$$;

revoke all on function public.record_group_expense_atomic(
  uuid, text, bigint, boolean, uuid, date, text, jsonb, text, text, text, text, timestamptz
) from public, anon;

grant execute on function public.record_group_expense_atomic(
  uuid, text, bigint, boolean, uuid, date, text, jsonb, text, text, text, text, timestamptz
) to authenticated;
