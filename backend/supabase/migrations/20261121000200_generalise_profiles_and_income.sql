-- =====================================================================
-- Migration: Generalise Profiles and Income Variability
-- Version: 20261121000200
-- Author: FLOVA Team (M1 Backend & Integration)
-- Description:
--   1. Adds new values to public.work_profile enum:
--      'small_vendor', 'daily_wage', 'seasonal_worker', 'other'
--   2. Creates public.income_variability enum:
--      'regular', 'variable', 'unpredictable', 'seasonal', 'intermittent'
--   3. Adds income_variability column to public.profiles (default 'variable')
--   4. Adds handles_cod boolean to public.profiles (default false)
--   5. Adds safe_runway_buffer column to public.profiles (rupees, numeric(12,2))
--   6. Sets default work_profile on public.profiles to 'other'
-- =====================================================================

-- 1. Extend work_profile enum
alter type public.work_profile add value if not exists 'small_vendor';
alter type public.work_profile add value if not exists 'daily_wage';
alter type public.work_profile add value if not exists 'seasonal_worker';
alter type public.work_profile add value if not exists 'other';

-- Commit enum value additions so new values can be referenced in the catalog
commit;

-- 2. Create income_variability enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'income_variability') then
    create type public.income_variability as enum (
      'regular',
      'variable',
      'unpredictable',
      'seasonal',
      'intermittent'
    );
  end if;
end $$;

-- 3. Add income_variability column to profiles table
alter table public.profiles
  add column if not exists income_variability public.income_variability not null default 'variable';

-- 4. Add handles_cod boolean column to profiles table
alter table public.profiles
  add column if not exists handles_cod boolean not null default false;

-- 5. Add safe_runway_buffer numeric(12,2) column to profiles table
alter table public.profiles
  add column if not exists safe_runway_buffer numeric(12,2) check (safe_runway_buffer >= 0);

-- 6. Update default for work_profile so new sign-ups don't default silently to delivery
alter table public.profiles
  alter column work_profile set default 'other';
