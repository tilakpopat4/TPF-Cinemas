-- =====================================================================
-- Migration: 20261011000004_published_updates_review_pipeline.sql
-- Description:
-- 1. Extend apply_film_update RPC to allow backdrop_url & trailer_ref in updates
-- 2. Update submit_series RPC to allow published series to be submitted for review
-- 3. Update series_owner_update RLS to permit transitioning to 'submitted'
-- =====================================================================

-- 1. Extend apply_film_update to include backdrop_url & trailer_ref
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
    'release_year', 'age_rating', 'poster_url', 'backdrop_url', 'trailer_ref',
    'video_provider', 'video_ref', 'is_debut'
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
  UPDATE public.films SET status = 'published', updated_at = now() WHERE id = upd.film_id;

  -- Mark proposal as approved
  UPDATE public.film_updates
  SET status         = 'approved',
      reviewer_id    = auth.uid(),
      reviewer_notes = p_notes,
      reviewed_at    = now(),
      updated_at     = now()
  WHERE id = p_update_id;

  PERFORM public.log_action('apply_update', 'film', upd.film_id::text,
    jsonb_build_object('update_id', p_update_id, 'notes', p_notes));
END;
$$;


-- 2. Update submit_series RPC to allow submitting published series for update review
CREATE OR REPLACE FUNCTION public.submit_series(
  p_series_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_series public.series%ROWTYPE;
  v_season_count integer;
  v_episode_count integer;
BEGIN
  -- Verify caller owns the series
  SELECT * INTO v_series FROM public.series WHERE id = p_series_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Series not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_series.filmmaker_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not your series' USING ERRCODE = '42501';
  END IF;

  -- Allow submitting draft, changes_requested, AND published series (for updates review)
  IF v_series.status NOT IN ('draft', 'changes_requested', 'published') THEN
    RAISE EXCEPTION 'Series cannot be submitted from status %', v_series.status
      USING ERRCODE = 'P0001';
  END IF;

  -- Validate at least 1 season exists
  SELECT count(*) INTO v_season_count FROM public.seasons WHERE series_id = p_series_id;
  IF v_season_count = 0 THEN
    RAISE EXCEPTION 'Series must contain at least one season' USING ERRCODE = 'P0003';
  END IF;

  -- Validate at least 1 playable episode exists
  SELECT count(*) INTO v_episode_count
  FROM public.episodes
  WHERE series_id = p_series_id
    AND video_ref IS NOT NULL
    AND length(trim(video_ref)) > 0;

  IF v_episode_count = 0 THEN
    RAISE EXCEPTION 'Series must have at least one episode with a valid video link'
      USING ERRCODE = 'P0003';
  END IF;

  -- Transition status to submitted
  UPDATE public.series
  SET status = 'submitted', updated_at = now()
  WHERE id = p_series_id;

  PERFORM public.log_action('submit', 'series', p_series_id::text,
    jsonb_build_object('title', v_series.title, 'seasons', v_season_count, 'episodes', v_episode_count, 'is_post_publish_update', (v_series.published_at IS NOT NULL)));
END;
$$;


-- 3. Update series_owner_update policy to permit transitioning to 'submitted'
DROP POLICY IF EXISTS series_owner_update ON public.series;
CREATE POLICY series_owner_update ON public.series
  FOR UPDATE TO authenticated
  USING (
    filmmaker_id = auth.uid()
    AND status IN ('draft', 'changes_requested', 'published')
  )
  WITH CHECK (
    filmmaker_id = auth.uid()
    AND status IN ('draft', 'changes_requested', 'published', 'submitted')
  );


-- 4. Reload schema cache immediately
NOTIFY pgrst, 'reload schema';
