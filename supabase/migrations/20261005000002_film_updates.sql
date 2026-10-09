-- =====================================================================
-- Phase 7: Post-publish edit workflow
-- 1. Extend film_status enum with update_pending
-- 2. Add film_updates table for proposed creator edits
-- 3. Three RPCs: propose_film_update, apply_film_update, reject_film_update
-- =====================================================================

-- Extend enum (additive; safe to run even if value already exists)
ALTER TYPE public.film_status ADD VALUE IF NOT EXISTS 'update_pending';

-- We need to commit the enum change before using it in table definitions
-- (Supabase runs migrations in auto-commit mode, so this is fine)


-- ---------------------------------------------------------------------
-- Table: film_updates
-- Holds edit proposals from creators for published films.
-- Live film record is frozen (status=update_pending) while pending.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.film_updates (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id          uuid        NOT NULL REFERENCES public.films (id) ON DELETE CASCADE,
  filmmaker_id     uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  -- JSONB snapshot of ONLY the changed fields (diff, not full record)
  proposed_changes jsonb       NOT NULL DEFAULT '{}'::jsonb,
  -- Staff decision
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id      uuid        REFERENCES public.profiles (id),
  reviewer_notes   text,
  reviewed_at      timestamptz,
  -- Timestamps
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS film_updates_film_idx    ON public.film_updates (film_id);
CREATE INDEX IF NOT EXISTS film_updates_status_idx  ON public.film_updates (status);
CREATE INDEX IF NOT EXISTS film_updates_maker_idx   ON public.film_updates (filmmaker_id);

CREATE TRIGGER film_updates_updated
  BEFORE UPDATE ON public.film_updates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
ALTER TABLE public.film_updates ENABLE ROW LEVEL SECURITY;

-- Creator reads their own proposals
CREATE POLICY film_updates_owner_read ON public.film_updates
  FOR SELECT TO authenticated
  USING (filmmaker_id = auth.uid());

-- Staff reads all (regardless of status — needed for history view)
CREATE POLICY film_updates_staff_read ON public.film_updates
  FOR SELECT TO authenticated
  USING (public.is_staff());

-- Creator inserts proposals only for their own PUBLISHED films
CREATE POLICY film_updates_insert ON public.film_updates
  FOR INSERT TO authenticated
  WITH CHECK (
    filmmaker_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.films f
      WHERE f.id = film_id
        AND f.filmmaker_id = auth.uid()
        AND f.status = 'published'
    )
  );

-- No direct UPDATE/DELETE allowed (only via RPCs)


-- ---------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------
GRANT SELECT ON public.film_updates TO authenticated;
GRANT INSERT (film_id, filmmaker_id, proposed_changes) ON public.film_updates TO authenticated;


-- =====================================================================
-- RPC: propose_film_update
-- Creator submits an edit proposal for their published film.
-- Only one pending proposal per film allowed at a time.
-- Returns the new film_updates.id.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.propose_film_update(
  p_film_id uuid,
  p_changes  jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_update_id uuid;
BEGIN
  -- Verify caller owns the film AND it is published
  IF NOT EXISTS (
    SELECT 1 FROM public.films
    WHERE id = p_film_id
      AND filmmaker_id = auth.uid()
      AND status = 'published'
  ) THEN
    RAISE EXCEPTION 'Film not found or not published'
      USING ERRCODE = 'P0002';
  END IF;

  -- Reject if a pending update already exists for this film
  IF EXISTS (
    SELECT 1 FROM public.film_updates
    WHERE film_id = p_film_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'A pending update already exists for this film. Wait for staff review.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Validate changes are not empty
  IF p_changes IS NULL OR p_changes = '{}'::jsonb THEN
    RAISE EXCEPTION 'No changes provided'
      USING ERRCODE = 'P0003';
  END IF;

  -- Insert the update proposal
  INSERT INTO public.film_updates (film_id, filmmaker_id, proposed_changes)
  VALUES (p_film_id, auth.uid(), p_changes)
  RETURNING id INTO v_update_id;

  -- Freeze the live film as update_pending
  UPDATE public.films SET status = 'update_pending' WHERE id = p_film_id;

  PERFORM public.log_action('propose_update', 'film', p_film_id::text,
    jsonb_build_object('update_id', v_update_id));

  RETURN v_update_id;
END;
$$;


-- =====================================================================
-- RPC: apply_film_update
-- Staff approves the proposal and merges whitelisted fields to live film.
-- Restores film status to 'published'.
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
    'release_year', 'age_rating', 'poster_url', 'video_provider', 'video_ref', 'is_debut'
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


-- =====================================================================
-- RPC: reject_film_update
-- Staff rejects the proposal with mandatory feedback notes.
-- Live film is unchanged; status restored to 'published'.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.reject_film_update(
  p_update_id uuid,
  p_notes     text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  upd public.film_updates%ROWTYPE;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Curators only' USING ERRCODE = '42501';
  END IF;

  IF char_length(COALESCE(p_notes, '')) < 10 THEN
    RAISE EXCEPTION 'Rejection notes must explain the reason (minimum 10 characters)';
  END IF;

  SELECT * INTO upd FROM public.film_updates WHERE id = p_update_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Update proposal not found';
  END IF;
  IF upd.status <> 'pending' THEN
    RAISE EXCEPTION 'Update is already % — cannot re-process', upd.status;
  END IF;

  -- Restore published status (live film is UNCHANGED)
  UPDATE public.films SET status = 'published' WHERE id = upd.film_id;

  -- Mark proposal as rejected
  UPDATE public.film_updates
  SET status = 'rejected', reviewer_id = auth.uid(),
      reviewer_notes = p_notes, reviewed_at = now()
  WHERE id = p_update_id;

  PERFORM public.log_action('reject_update', 'film', upd.film_id::text,
    jsonb_build_object('update_id', p_update_id, 'reason', p_notes));
END;
$$;


-- ---------------------------------------------------------------------
-- Grant execute on new RPCs to authenticated users
-- (each RPC checks the caller's role internally)
-- ---------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.propose_film_update(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_film_update(uuid, text)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_film_update(uuid, text)   TO authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
