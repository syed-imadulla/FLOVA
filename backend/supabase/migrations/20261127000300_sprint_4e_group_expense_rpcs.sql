-- =====================================================================
-- FLOVA 2.0 · Sprint 4E: Group Expenses Completeness (Forward-Only)
-- Adds:
--   1. group_expenses.category & group_expenses.expense_type
--      (preserving existing rows as 'food' / 'living')
--   2. Updated record_group_expense_atomic(...) storing category & expense_type
--   3. Updated group_expense_splits_guard_remaining() allowing controlled
--      transaction-local edits via flova.allow_group_split_edit = 'on'
--   4. public.update_group_expense_atomic(...) with settlement consistency,
--      split recalculation, and self-transaction synchronization
--   5. public.delete_group_expense_safe(...) blocking deletion when
--      settlements exist and atomically removing expense, splits, & self tx
-- =====================================================================

-- 1. Persist category & expense_type on group_expenses
alter table public.group_expenses
  add column if not exists category text not null default 'food',
  add column if not exists expense_type text not null default 'living';

alter table public.group_expenses
  drop constraint if exists group_expenses_category_rule;

alter table public.group_expenses
  add constraint group_expenses_category_rule check (
    char_length(trim(category)) between 1 and 40
  );

alter table public.group_expenses
  drop constraint if exists group_expenses_expense_type_rule;

alter table public.group_expenses
  add constraint group_expenses_expense_type_rule check (
    expense_type in ('living', 'work')
  );

-- 2. Allow controlled split updates inside update_group_expense_atomic()
create or replace function public.group_expense_splits_guard_remaining()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if pg_catalog.pg_trigger_depth() = 1
     and new.remaining_amount_paise is distinct from old.remaining_amount_paise
     and coalesce(pg_catalog.current_setting('flova.allow_group_split_edit', true), '') <> 'on' then
    raise exception 'remaining_amount_paise is managed by group_settlements triggers';
  end if;
  return new;
end;
$$;

revoke all on function public.group_expense_splits_guard_remaining() from public, anon, authenticated;

-- 3. Update record_group_expense_atomic() to persist category & expense_type on group_expenses
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

  v_self_cat := coalesce(nullif(pg_catalog.btrim(coalesce(p_self_category, '')), ''), 'food');
  if pg_catalog.char_length(v_self_cat) > 40 then
    raise exception 'Category must be 40 characters or fewer';
  end if;
  v_self_exp_type := coalesce(nullif(pg_catalog.btrim(coalesce(p_self_expense_type, '')), ''), 'living');
  if v_self_exp_type not in ('living', 'work') then
    raise exception 'Invalid self expense_type: %', v_self_exp_type;
  end if;

  v_idem := nullif(pg_catalog.btrim(coalesce(p_idempotency_key, '')), '');

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

  perform 1
    from public.expense_groups g
   where g.id = p_group_id and g.user_id = v_user_id;
  if not found then
    raise exception 'Expense group not found for user';
  end if;

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

  if v_self_share_paise > 0 then
    insert into public.transactions (
      user_id, type, amount, category, description, expense_type,
      ownership, transaction_date, source, created_at
    ) values (
      v_user_id,
      'expense'::public.transaction_type,
      pg_catalog.round(v_self_share_paise::numeric / 100.0, 2),
      v_self_cat,
      pg_catalog.left(v_desc || ' (your share)', 140),
      v_self_exp_type::public.expense_type,
      'mine'::public.money_ownership,
      p_expense_date,
      'manual',
      v_ts
    )
    returning id into v_self_tx_id;
  end if;

  insert into public.group_expenses (
    user_id, group_id, description, total_amount_paise,
    paid_by_self, paid_by_person_id, expense_date, split_type,
    self_transaction_id, category, expense_type, note, idempotency_key, created_at
  ) values (
    v_user_id, p_group_id, v_desc, p_total_amount_paise,
    p_paid_by_self, case when p_paid_by_self then null else p_paid_by_person_id end,
    p_expense_date, p_split_type,
    v_self_tx_id, v_self_cat, v_self_exp_type,
    nullif(pg_catalog.btrim(coalesce(p_note, '')), ''), v_idem, v_ts
  )
  returning * into v_expense;

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

-- 4. Atomic group expense editing RPC
create or replace function public.update_group_expense_atomic(
  p_expense_id uuid,
  p_description text,
  p_total_amount_paise bigint,
  p_paid_by_self boolean,
  p_paid_by_person_id uuid,
  p_expense_date date,
  p_split_type text,
  p_splits jsonb,
  p_note text default null,
  p_self_category text default 'food',
  p_self_expense_type text default 'living'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_expense public.group_expenses%rowtype;
  v_desc text;
  v_self_cat text;
  v_self_exp_type text;
  v_elem jsonb;
  v_is_self boolean;
  v_person_id uuid;
  v_share_paise bigint;
  v_sum_paise bigint := 0;
  v_self_share_paise bigint := 0;
  v_seen_self boolean := false;
  v_seen_people uuid[] := array[]::uuid[];
  v_old_split record;
  v_has_any_settlement boolean := false;
  v_matched boolean;
  v_matched_share bigint;
  v_settled_paise bigint;
  v_dir text;
  v_rem bigint;
  v_status text;
  v_self_tx_id uuid;
  v_old_tx_id uuid;
  v_split_row public.group_expense_splits%rowtype;
  v_splits_out jsonb := '[]'::jsonb;
  v_kept_split_ids uuid[] := array[]::uuid[];
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_expense
    from public.group_expenses
   where id = p_expense_id and user_id = v_user_id
   for update;

  if not found then
    raise exception 'Group expense not found for user';
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

  v_self_cat := coalesce(nullif(pg_catalog.btrim(coalesce(p_self_category, '')), ''), 'food');
  if pg_catalog.char_length(v_self_cat) > 40 then
    raise exception 'Category must be 40 characters or fewer';
  end if;
  v_self_exp_type := coalesce(nullif(pg_catalog.btrim(coalesce(p_self_expense_type, '')), ''), 'living');
  if v_self_exp_type not in ('living', 'work') then
    raise exception 'Invalid self expense_type: %', v_self_exp_type;
  end if;

  -- Validate payer membership
  if p_paid_by_self then
    if p_paid_by_person_id is not null then
      raise exception 'paid_by_person_id must be null when paid_by_self is true';
    end if;
    perform 1
      from public.expense_group_members m
     where m.group_id = v_expense.group_id and m.user_id = v_user_id and m.is_self = true;
    if not found then
      raise exception 'Self is not a member of this group';
    end if;
  else
    if p_paid_by_person_id is null then
      raise exception 'paid_by_person_id is required when paid_by_self is false';
    end if;
    perform 1
      from public.expense_group_members m
     where m.group_id = v_expense.group_id and m.user_id = v_user_id and m.is_self = false and m.person_id = p_paid_by_person_id;
    if not found then
      raise exception 'Payer is not a member of this group';
    end if;
  end if;

  -- Validate splits array
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
       where m.group_id = v_expense.group_id and m.user_id = v_user_id and m.is_self = true;
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
       where m.group_id = v_expense.group_id and m.user_id = v_user_id and m.is_self = false and m.person_id = v_person_id;
      if not found then
        raise exception 'Participant % is not a member of this group', v_person_id;
      end if;
    end if;

    v_sum_paise := v_sum_paise + v_share_paise;
  end loop;

  if v_sum_paise <> p_total_amount_paise then
    raise exception 'Split shares (%) do not equal total amount (%)', v_sum_paise, p_total_amount_paise;
  end if;

  -- Lock existing splits and enforce settlement consistency
  for v_old_split in
    select s.*,
           coalesce((
             select pg_catalog.sum(gs.amount_paise)::bigint
               from public.group_settlements gs
              where gs.group_expense_split_id = s.id and gs.user_id = v_user_id
           ), 0)::bigint as settled_paise
      from public.group_expense_splits s
     where s.group_expense_id = p_expense_id and s.user_id = v_user_id
     for update of s
  loop
    if v_old_split.settled_paise > 0 then
      v_has_any_settlement := true;

      -- Check if participant still exists in new splits
      v_matched := false;
      v_matched_share := 0;
      for v_elem in select value from pg_catalog.jsonb_array_elements(p_splits) loop
        v_is_self := coalesce((v_elem->>'isSelf')::boolean, (v_elem->>'is_self')::boolean, false);
        v_person_id := nullif(coalesce(v_elem->>'personId', v_elem->>'person_id', ''), '')::uuid;
        v_share_paise := coalesce((v_elem->>'shareAmountPaise')::bigint, (v_elem->>'share_amount_paise')::bigint);

        if (v_old_split.is_self and v_is_self)
           or (not v_old_split.is_self and not v_is_self and v_old_split.person_id = v_person_id) then
          v_matched := true;
          v_matched_share := v_share_paise;
          exit;
        end if;
      end loop;

      if not v_matched then
        raise exception 'Cannot remove a participant with existing settlements. Reverse settlements first.';
      end if;

      if v_matched_share < v_old_split.settled_paise then
        raise exception 'Participant share (%) cannot be less than already settled amount (%)', v_matched_share, v_old_split.settled_paise;
      end if;
    end if;
  end loop;

  if v_has_any_settlement and (
    v_expense.paid_by_self is distinct from p_paid_by_self
    or v_expense.paid_by_person_id is distinct from (case when p_paid_by_self then null else p_paid_by_person_id end)
  ) then
    raise exception 'Cannot change who paid after settlements have been recorded. Reverse settlements first.';
  end if;

  -- Synchronize linked self transaction
  v_self_tx_id := v_expense.self_transaction_id;
  v_old_tx_id := v_expense.self_transaction_id;

  if v_self_share_paise > 0 then
    if v_self_tx_id is not null then
      update public.transactions
         set amount = pg_catalog.round(v_self_share_paise::numeric / 100.0, 2),
             category = v_self_cat,
             description = pg_catalog.left(v_desc || ' (your share)', 140),
             expense_type = v_self_exp_type::public.expense_type,
             transaction_date = p_expense_date
       where id = v_self_tx_id and user_id = v_user_id;

      if not found then
        v_self_tx_id := null;
      end if;
    end if;

    if v_self_tx_id is null then
      insert into public.transactions (
        user_id, type, amount, category, description, expense_type,
        ownership, transaction_date, source
      ) values (
        v_user_id,
        'expense'::public.transaction_type,
        pg_catalog.round(v_self_share_paise::numeric / 100.0, 2),
        v_self_cat,
        pg_catalog.left(v_desc || ' (your share)', 140),
        v_self_exp_type::public.expense_type,
        'mine'::public.money_ownership,
        p_expense_date,
        'manual'
      )
      returning id into v_self_tx_id;
    end if;
  else
    v_self_tx_id := null;
  end if;

  -- Update group expense row
  update public.group_expenses
     set description = v_desc,
         total_amount_paise = p_total_amount_paise,
         paid_by_self = p_paid_by_self,
         paid_by_person_id = case when p_paid_by_self then null else p_paid_by_person_id end,
         expense_date = p_expense_date,
         split_type = p_split_type,
         self_transaction_id = v_self_tx_id,
         category = v_self_cat,
         expense_type = v_self_exp_type,
         note = nullif(pg_catalog.btrim(coalesce(p_note, '')), '')
   where id = p_expense_id and user_id = v_user_id
   returning * into v_expense;

  -- Remove old self transaction if self share became 0
  if v_self_share_paise = 0 and v_old_tx_id is not null then
    delete from public.transactions
     where id = v_old_tx_id and user_id = v_user_id;
  end if;

  -- Enable transaction-local controlled split edits
  perform pg_catalog.set_config('flova.allow_group_split_edit', 'on', true);

  for v_elem in select value from pg_catalog.jsonb_array_elements(p_splits) loop
    v_is_self := coalesce((v_elem->>'isSelf')::boolean, (v_elem->>'is_self')::boolean, false);
    v_person_id := nullif(coalesce(v_elem->>'personId', v_elem->>'person_id', ''), '')::uuid;
    v_share_paise := coalesce((v_elem->>'shareAmountPaise')::bigint, (v_elem->>'share_amount_paise')::bigint);

    if p_paid_by_self then
      if v_is_self or v_share_paise = 0 then
        v_dir := 'self_share';
      else
        v_dir := 'they_owe';
      end if;
    else
      if v_is_self and v_share_paise > 0 then
        v_dir := 'you_owe';
      else
        v_dir := 'third_party';
      end if;
    end if;

    select * into v_split_row
      from public.group_expense_splits s
     where s.group_expense_id = p_expense_id
       and s.user_id = v_user_id
       and (
         (v_is_self and s.is_self = true)
         or (not v_is_self and s.is_self = false and s.person_id = v_person_id)
       );

    if found then
      select coalesce(pg_catalog.sum(gs.amount_paise), 0)::bigint
        into v_settled_paise
        from public.group_settlements gs
       where gs.group_expense_split_id = v_split_row.id and gs.user_id = v_user_id;

      if v_settled_paise > 0 and v_dir <> v_split_row.direction then
        raise exception 'Cannot change split direction after settlements have been recorded';
      end if;

      if v_dir in ('they_owe', 'you_owe') then
        v_rem := v_share_paise - v_settled_paise;
        v_status := case
          when v_rem = 0 then 'settled'
          when v_settled_paise > 0 then 'partially_settled'
          else 'active'
        end;
      else
        v_rem := 0;
        v_status := 'settled';
      end if;

      update public.group_expense_splits
         set direction = v_dir,
             share_amount_paise = v_share_paise,
             remaining_amount_paise = v_rem,
             status = v_status
       where id = v_split_row.id and user_id = v_user_id
       returning * into v_split_row;
    else
      if v_dir in ('they_owe', 'you_owe') then
        v_rem := v_share_paise;
        v_status := 'active';
      else
        v_rem := 0;
        v_status := 'settled';
      end if;

      insert into public.group_expense_splits (
        user_id, group_expense_id, is_self, person_id,
        direction, share_amount_paise, remaining_amount_paise, status
      ) values (
        v_user_id, p_expense_id, v_is_self, case when v_is_self then null else v_person_id end,
        v_dir, v_share_paise, v_rem, v_status
      )
      returning * into v_split_row;
    end if;

    v_kept_split_ids := pg_catalog.array_append(v_kept_split_ids, v_split_row.id);
    v_splits_out := v_splits_out || pg_catalog.jsonb_build_array(pg_catalog.to_jsonb(v_split_row));
  end loop;

  -- Delete any removed unsettled participant splits
  delete from public.group_expense_splits
   where group_expense_id = p_expense_id
     and user_id = v_user_id
     and not (id = any(v_kept_split_ids));

  return pg_catalog.jsonb_build_object(
    'expense', pg_catalog.to_jsonb(v_expense),
    'splits', v_splits_out
  );
end;
$$;

revoke all on function public.update_group_expense_atomic(
  uuid, text, bigint, boolean, uuid, date, text, jsonb, text, text, text
) from public, anon;

grant execute on function public.update_group_expense_atomic(
  uuid, text, bigint, boolean, uuid, date, text, jsonb, text, text, text
) to authenticated;

-- 5. Safe atomic group expense deletion RPC
create or replace function public.delete_group_expense_safe(
  p_expense_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_expense public.group_expenses%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_expense
    from public.group_expenses
   where id = p_expense_id and user_id = v_user_id
   for update;

  if not found then
    raise exception 'Group expense not found for user';
  end if;

  perform 1
    from public.group_settlements gs
    join public.group_expense_splits s on s.id = gs.group_expense_split_id
   where s.group_expense_id = p_expense_id
     and gs.user_id = v_user_id
   limit 1;

  if found then
    raise exception 'Cannot delete a group expense with existing settlements. Reverse settlements first.';
  end if;

  delete from public.group_expenses
   where id = p_expense_id and user_id = v_user_id;

  if v_expense.self_transaction_id is not null then
    delete from public.transactions
     where id = v_expense.self_transaction_id and user_id = v_user_id;
  end if;
end;
$$;

revoke all on function public.delete_group_expense_safe(uuid) from public, anon;
grant execute on function public.delete_group_expense_safe(uuid) to authenticated;
