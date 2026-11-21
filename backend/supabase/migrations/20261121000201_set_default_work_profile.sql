-- =====================================================================
-- Migration: Set Default Work Profile (Part 2)
-- Version: 20261121000201
-- Author: FLOVA Team (M1 Backend & Integration)
-- Description:
--   Sets default work_profile on public.profiles to 'other' now that
--   the enum value 'other' has been committed into the catalog.
-- =====================================================================

alter table public.profiles
  alter column work_profile set default 'other';
