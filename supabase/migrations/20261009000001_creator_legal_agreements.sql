-- =====================================================================
-- Phase 9: Creator Legal Agreement & Content Rights Framework
-- 1. Extend licence_agreements to support creator-level master onboarding deeds
-- 2. Add signature image, PDF URL, IP, user-agent, legal name, version metadata
-- 3. Update FK cascade to ON DELETE SET NULL for permanent legal retention
-- 4. Update RLS policies to allow master onboarding deed inserts (where film_id IS NULL)
-- 5. RPC: verify_creator_agreement(p_agreement_id uuid) with audit logging
-- =====================================================================

-- 1. Allow film_id to be nullable for creator-level master agreements
ALTER TABLE public.licence_agreements ALTER COLUMN film_id DROP NOT NULL;

-- 2. Drop the strict unique constraint on film_id and replace with partial unique index
-- First drop existing constraint if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.licence_agreements'::regclass 
      AND conname = 'licence_agreements_film_id_key'
  ) THEN
    ALTER TABLE public.licence_agreements DROP CONSTRAINT licence_agreements_film_id_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS licence_agreements_film_id_unique_idx 
  ON public.licence_agreements (film_id) 
  WHERE film_id IS NOT NULL;

-- 3. Partial unique index to allow only ONE master onboarding deed per filmmaker
CREATE UNIQUE INDEX IF NOT EXISTS licence_agreements_filmmaker_master_idx 
  ON public.licence_agreements (filmmaker_id) 
  WHERE film_id IS NULL;

-- 4. Protect legal records from deletion on film removal: ON DELETE SET NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.licence_agreements'::regclass 
      AND conname = 'licence_agreements_film_id_fkey'
  ) THEN
    ALTER TABLE public.licence_agreements DROP CONSTRAINT licence_agreements_film_id_fkey;
  END IF;
END $$;

ALTER TABLE public.licence_agreements
  ADD CONSTRAINT licence_agreements_film_id_fkey
  FOREIGN KEY (film_id) REFERENCES public.films (id) ON DELETE SET NULL;

-- 5. Add new metadata and asset columns
ALTER TABLE public.licence_agreements
  ADD COLUMN IF NOT EXISTS signature_image_url text,
  ADD COLUMN IF NOT EXISTS agreement_pdf_url   text,
  ADD COLUMN IF NOT EXISTS signed_ip           text,
  ADD COLUMN IF NOT EXISTS signed_user_agent   text,
  ADD COLUMN IF NOT EXISTS agreement_version   text NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS film_type_at_signing text DEFAULT 'all'
    CHECK (film_type_at_signing IN ('short', 'feature', 'all')),
  ADD COLUMN IF NOT EXISTS legal_name          text;

-- Default terms_version if not provided
ALTER TABLE public.licence_agreements
  ALTER COLUMN terms_version SET DEFAULT '1.0.0';

-- 6. Update RLS policies to allow master onboarding deed inserts
DROP POLICY IF EXISTS licences_insert ON public.licence_agreements;
CREATE POLICY licences_insert ON public.licence_agreements
  FOR INSERT TO authenticated
  WITH CHECK (
    filmmaker_id = auth.uid()
    AND (
      film_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.films f
        WHERE f.id = film_id AND f.filmmaker_id = auth.uid()
      )
    )
  );

-- Ensure owner can update their own agreement
DROP POLICY IF EXISTS licences_update ON public.licence_agreements;
CREATE POLICY licences_update ON public.licence_agreements
  FOR UPDATE TO authenticated
  USING (filmmaker_id = auth.uid())
  WITH CHECK (filmmaker_id = auth.uid());

-- 7. RPC: Staff verify creator agreement and record in audit log
CREATE OR REPLACE FUNCTION public.verify_creator_agreement(p_agreement_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  a public.licence_agreements;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Staff and curators only' USING errcode = '42501';
  END IF;

  SELECT * INTO a FROM public.licence_agreements WHERE id = p_agreement_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agreement not found';
  END IF;

  UPDATE public.licence_agreements
     SET verified_by = auth.uid(), verified_at = now()
   WHERE id = p_agreement_id;

  PERFORM public.log_action(
    'verify_creator_agreement',
    'licence_agreement',
    p_agreement_id::text,
    jsonb_build_object(
      'filmmaker_id', a.filmmaker_id,
      'legal_name', a.legal_name,
      'agreement_version', a.agreement_version,
      'film_id', a.film_id
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_creator_agreement(uuid) TO authenticated;

-- 8. Explicitly grant permissions on all licence_agreements columns to authenticated
GRANT ALL ON public.licence_agreements TO authenticated;

-- 9. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
