-- ---------------------------------------------------------------------
-- Fix storage policies for licences bucket
-- Allow any authenticated user during creator onboarding to upload
-- their signature and legal consent deed into their own user directory:
-- bucket_id = 'licences' / <auth.uid()>/...
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS licences_upload ON storage.objects;
CREATE POLICY licences_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'licences'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS licences_read_own_or_staff ON storage.objects;
CREATE POLICY licences_read_own_or_staff ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'licences'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff())
  );

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
