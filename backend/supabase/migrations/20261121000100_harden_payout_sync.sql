  -- =====================================================================
  -- FLOVA · Harden Payout Synchronization (Phase 5)
  --
  -- 1. Row-level locking: Acquires an exclusive FOR UPDATE lock on the target
  --    payout before computing the SUM of linked transactions, serializing
  --    concurrent receipts and preventing stale totals.
  -- 2. Deadlock-free reassignment: When a transaction is moved between two
  --    payouts, locks are acquired in canonical ascending UUID order.
  -- 3. Status state machine:
  --    - Preserves 'cancelled'.
  --    - Sets 'settled' when received_amount >= expected_amount.
  --    - Sets 'partial' when received_amount > 0 and < expected_amount.
  --    - Restores 'scheduled' when previously partial/settled and received_amount = 0.
  --    - Preserves original status ('scheduled', 'estimated', 'unearned') when received_amount = 0.
  -- =====================================================================

  create or replace function public.sync_payout_received(p_payout uuid)
  returns void language plpgsql set search_path = '' as $$
  declare
    v_received numeric(12,2);
  begin
    if p_payout is null then return; end if;

    -- 1. Exclusive row-level lock on the target payout.
    --    We use FOR NO KEY UPDATE so that it serializes concurrent payout updates
    --    without conflicting with foreign-key FOR KEY SHARE locks taken by concurrent inserts.
    perform 1 from public.payouts p where p.id = p_payout for no key update;

    -- 2. Recalculate total sum from scratch
    select coalesce(sum(t.amount), 0) into v_received
      from public.transactions t where t.payout_id = p_payout;

    -- 3. Update received_amount and enforce the status state machine
    update public.payouts p
      set received_amount = v_received,
          status = case
            when p.status = 'cancelled' then p.status
            when v_received >= p.expected_amount then 'settled'::public.payout_status
            when v_received > 0 then 'partial'::public.payout_status
            when p.status in ('partial', 'settled') and v_received = 0 then 'scheduled'::public.payout_status
            else p.status
          end
    where p.id = p_payout;
  end $$;

  -- Deadlock-free synchronization trigger function
  create or replace function public.transactions_sync_payout()
  returns trigger language plpgsql set search_path = '' as $$
  begin
    -- Case 1: Transaction reassigned from one payout to another
    -- Acquire locks in canonical ascending UUID order (LEAST first) to eliminate deadlocks
    if tg_op = 'UPDATE' and old.payout_id is not null and new.payout_id is not null and old.payout_id <> new.payout_id then
      if old.payout_id < new.payout_id then
        perform public.sync_payout_received(old.payout_id);
        perform public.sync_payout_received(new.payout_id);
      else
        perform public.sync_payout_received(new.payout_id);
        perform public.sync_payout_received(old.payout_id);
      end if;
      return null;
    end if;

    -- Case 2: Deletion or unlinking
    if tg_op in ('UPDATE', 'DELETE') and old.payout_id is not null then
      perform public.sync_payout_received(old.payout_id);
    end if;

    -- Case 3: Insertion, linking, or amount update
    if tg_op in ('INSERT', 'UPDATE') and new.payout_id is not null
      and (tg_op = 'INSERT' or new.payout_id is distinct from old.payout_id or new.amount <> old.amount) then
      perform public.sync_payout_received(new.payout_id);
    end if;

    return null;
  end $$;

  grant execute on function public.sync_payout_received(uuid) to authenticated;
  grant execute on function public.transactions_sync_payout() to authenticated;
