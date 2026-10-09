-- =====================================================================
-- Phase 9 Plan 03: Creator Onboarding Comprehensive Profile & Signature Attestation
-- 1. Add production_name, contact_no, youtube_handle to profiles
-- 2. Add production_name, contact_no, contact_email to licence_agreements
-- 3. Grant column privileges to authenticated role
-- 4. Notify PostgREST to reload schema cache
-- =====================================================================

-- 1. Profiles additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS production_name text,
  ADD COLUMN IF NOT EXISTS contact_no     text,
  ADD COLUMN IF NOT EXISTS youtube_handle  text;

-- 2. Licence Agreements additions
ALTER TABLE public.licence_agreements
  ADD COLUMN IF NOT EXISTS production_name text,
  ADD COLUMN IF NOT EXISTS contact_no     text,
  ADD COLUMN IF NOT EXISTS contact_email  text;

-- 3. Grant access to authenticated users
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.licence_agreements TO authenticated;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
