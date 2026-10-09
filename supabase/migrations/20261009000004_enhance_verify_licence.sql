-- =====================================================================
-- Phase 9 Patch: Enhance verify_licence to allow staff verification
-- and automatically clear music clearance upon staff approval.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.verify_licence(p_film_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Curators only' USING errcode = '42501';
  END IF;

  UPDATE public.licence_agreements
     SET verified_by = auth.uid(),
         verified_at = now(),
         music_cleared = true
   WHERE film_id = p_film_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No licence agreement found for this film';
  END IF;

  PERFORM public.log_action('verify_licence', 'film', p_film_id::text);
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_licence(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
