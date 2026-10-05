-- =====================================================================
-- Phase 7 patch: add trailer_ref to apply_film_update whitelist
-- Replaces the function with an updated allowed_fields array
-- =====================================================================

CREATE OR REPLACE FUNCTION public.apply_film_update(
  p_update_id uuid,
  p_notes     text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  upd           public.film_updates%ROWTYPE;
  allowed_fields text[] := ARRAY[
    'title', 'synopsis', 'director_note', 'runtime_minutes', 'language',
    'release_year', 'age_rating', 'poster_url', 'video_provider', 'video_ref',
    'trailer_ref', 'is_debut'
  ];
  field_name    text;
  field_val     jsonb;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Curators only' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO upd FROM public.film_updates WHERE id = p_update_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Update proposal not found';
  END IF;
  IF upd.status <> 'pending' THEN
    RAISE EXCEPTION 'Update is already % — cannot re-process', upd.status;
  END IF;

  -- Apply whitelisted fields only (prevents status/is_featured privilege escalation)
  FOR field_name, field_val IN SELECT key, value FROM jsonb_each(upd.proposed_changes)
  LOOP
    IF field_name = ANY(allowed_fields) THEN
      EXECUTE format(
        'UPDATE public.films SET %I = $1::text::%s WHERE id = $2',
        field_name,
        CASE field_name
          WHEN 'runtime_minutes' THEN 'smallint'
          WHEN 'release_year'    THEN 'smallint'
          WHEN 'is_debut'        THEN 'boolean'
          WHEN 'age_rating'      THEN 'public.age_rating'
          WHEN 'video_provider'  THEN 'public.video_provider'
          ELSE 'text'
        END
      ) USING
        CASE WHEN jsonb_typeof(field_val) = 'null' THEN NULL
             ELSE field_val #>> '{}'
        END,
        upd.film_id;
    END IF;
  END LOOP;

  -- Restore published status
  UPDATE public.films SET status = 'published' WHERE id = upd.film_id;

  -- Mark proposal as approved
  UPDATE public.film_updates
  SET status = 'approved', reviewer_id = auth.uid(),
      reviewer_notes = p_notes, reviewed_at = now()
  WHERE id = p_update_id;

  PERFORM public.log_action('apply_update', 'film', upd.film_id::text,
    jsonb_build_object('update_id', p_update_id));
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_film_update(uuid, text) TO authenticated;
