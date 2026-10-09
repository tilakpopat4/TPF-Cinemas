-- =====================================================================
-- Phase 10: Web Series & Episodic Publishing Pipeline Migration
-- Tables, RLS, Indexes, and Lifecycle RPCs
-- =====================================================================

-- 1. Table: public.series
CREATE TABLE IF NOT EXISTS public.series (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filmmaker_id    uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  title           text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  slug            text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  synopsis        text CHECK (char_length(synopsis) <= 2000),
  creator_note    text CHECK (char_length(creator_note) <= 2000),
  language        text NOT NULL DEFAULT 'Hindi',
  age_rating      public.age_rating,
  poster_url      text,                       -- Portrait artwork (2:3)
  backdrop_url    text,                       -- Landscape backdrop (16:9)
  trailer_ref     text,                       -- YouTube video ID or preview link
  total_seasons   smallint NOT NULL DEFAULT 1 CHECK (total_seasons >= 1),
  status          public.film_status NOT NULL DEFAULT 'draft',
  is_featured     boolean NOT NULL DEFAULT false,
  published_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT series_published_needs_date
    CHECK (status <> 'published' OR published_at IS NOT NULL)
);

-- 2. Table: public.seasons
CREATE TABLE IF NOT EXISTS public.seasons (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id      uuid NOT NULL REFERENCES public.series (id) ON DELETE CASCADE,
  season_number  smallint NOT NULL CHECK (season_number >= 1),
  title          text NOT NULL DEFAULT 'Season 1',
  synopsis       text CHECK (char_length(synopsis) <= 1500),
  release_year   smallint CHECK (release_year BETWEEN 1990 AND 2100),
  poster_url     text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (series_id, season_number)
);

-- 3. Table: public.episodes
CREATE TABLE IF NOT EXISTS public.episodes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id       uuid NOT NULL REFERENCES public.seasons (id) ON DELETE CASCADE,
  series_id       uuid NOT NULL REFERENCES public.series (id) ON DELETE CASCADE,
  episode_number  smallint NOT NULL CHECK (episode_number >= 1),
  title           text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 150),
  synopsis        text CHECK (char_length(synopsis) <= 1500),
  runtime_minutes smallint CHECK (runtime_minutes BETWEEN 1 AND 240),
  video_provider  public.video_provider NOT NULL DEFAULT 'youtube',
  video_ref       text NOT NULL,              -- YouTube video ID or streaming reference
  thumbnail_url   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_id, episode_number)
);

-- 4. Table: public.series_genres
CREATE TABLE IF NOT EXISTS public.series_genres (
  series_id uuid NOT NULL REFERENCES public.series (id) ON DELETE CASCADE,
  genre_id  smallint NOT NULL REFERENCES public.genres (id) ON DELETE RESTRICT,
  PRIMARY KEY (series_id, genre_id)
);

-- 5. Table: public.series_credits
CREATE TABLE IF NOT EXISTS public.series_credits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id   uuid NOT NULL REFERENCES public.series (id) ON DELETE CASCADE,
  person_name text NOT NULL,
  credit_role text NOT NULL,                  -- Showrunner, Director, Writer, Lead Cast
  sort_order  smallint NOT NULL DEFAULT 0
);

-- 6. Table: public.series_reviews
CREATE TABLE IF NOT EXISTS public.series_reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id   uuid NOT NULL REFERENCES public.series (id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles (id),
  decision    public.review_decision NOT NULL,
  notes       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 7. Table: public.episode_watch_history
CREATE TABLE IF NOT EXISTS public.episode_watch_history (
  user_id          uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  episode_id       uuid NOT NULL REFERENCES public.episodes (id) ON DELETE CASCADE,
  series_id        uuid NOT NULL REFERENCES public.series (id) ON DELETE CASCADE,
  progress_seconds integer NOT NULL DEFAULT 0 CHECK (progress_seconds >= 0),
  completed        boolean NOT NULL DEFAULT false,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, episode_id)
);

-- 8. Table: public.series_watchlist
CREATE TABLE IF NOT EXISTS public.series_watchlist (
  user_id  uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  series_id uuid NOT NULL REFERENCES public.series (id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, series_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS series_status_idx           ON public.series (status);
CREATE INDEX IF NOT EXISTS series_filmmaker_idx        ON public.series (filmmaker_id);
CREATE INDEX IF NOT EXISTS series_published_idx        ON public.series (published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS seasons_series_idx          ON public.seasons (series_id, season_number);
CREATE INDEX IF NOT EXISTS episodes_season_idx         ON public.episodes (season_id, episode_number);
CREATE INDEX IF NOT EXISTS episodes_series_idx         ON public.episodes (series_id);
CREATE INDEX IF NOT EXISTS series_genres_genre_idx     ON public.series_genres (genre_id);
CREATE INDEX IF NOT EXISTS series_credits_series_idx   ON public.series_credits (series_id);
CREATE INDEX IF NOT EXISTS series_reviews_series_idx   ON public.series_reviews (series_id);
CREATE INDEX IF NOT EXISTS ep_watch_hist_user_idx      ON public.episode_watch_history (user_id, updated_at DESC);

-- Automatic Updated_at Triggers
DROP TRIGGER IF EXISTS series_updated ON public.series;
CREATE TRIGGER series_updated
  BEFORE UPDATE ON public.series
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS seasons_updated ON public.seasons;
CREATE TRIGGER seasons_updated
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS episodes_updated ON public.episodes;
CREATE TRIGGER episodes_updated
  BEFORE UPDATE ON public.episodes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

ALTER TABLE public.series                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_genres         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_credits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_watchlist      ENABLE ROW LEVEL SECURITY;

-- Series RLS
DROP POLICY IF EXISTS series_public_read ON public.series;
CREATE POLICY series_public_read ON public.series
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS series_owner_read ON public.series;
CREATE POLICY series_owner_read ON public.series
  FOR SELECT TO authenticated
  USING (filmmaker_id = auth.uid());

DROP POLICY IF EXISTS series_staff_read ON public.series;
CREATE POLICY series_staff_read ON public.series
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS series_owner_insert ON public.series;
CREATE POLICY series_owner_insert ON public.series
  FOR INSERT TO authenticated
  WITH CHECK (filmmaker_id = auth.uid());

DROP POLICY IF EXISTS series_owner_update ON public.series;
CREATE POLICY series_owner_update ON public.series
  FOR UPDATE TO authenticated
  USING (filmmaker_id = auth.uid() AND status IN ('draft', 'changes_requested'))
  WITH CHECK (filmmaker_id = auth.uid() AND status IN ('draft', 'changes_requested'));

DROP POLICY IF EXISTS series_owner_delete ON public.series;
CREATE POLICY series_owner_delete ON public.series
  FOR DELETE TO authenticated
  USING (filmmaker_id = auth.uid() AND status = 'draft');

DROP POLICY IF EXISTS series_staff_all ON public.series;
CREATE POLICY series_staff_all ON public.series
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Seasons RLS
DROP POLICY IF EXISTS seasons_read ON public.seasons;
CREATE POLICY seasons_read ON public.seasons
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.series s WHERE s.id = series_id AND s.status = 'published')
    OR EXISTS (SELECT 1 FROM public.series s WHERE s.id = series_id AND s.filmmaker_id = auth.uid())
    OR public.is_staff()
  );

DROP POLICY IF EXISTS seasons_owner_write ON public.seasons;
CREATE POLICY seasons_owner_write ON public.seasons
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.series s
      WHERE s.id = series_id
        AND s.filmmaker_id = auth.uid()
        AND s.status IN ('draft', 'changes_requested')
    ) OR public.is_staff()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.series s
      WHERE s.id = series_id
        AND s.filmmaker_id = auth.uid()
        AND s.status IN ('draft', 'changes_requested')
    ) OR public.is_staff()
  );

-- Episodes RLS
DROP POLICY IF EXISTS episodes_read ON public.episodes;
CREATE POLICY episodes_read ON public.episodes
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.series s WHERE s.id = series_id AND s.status = 'published')
    OR EXISTS (SELECT 1 FROM public.series s WHERE s.id = series_id AND s.filmmaker_id = auth.uid())
    OR public.is_staff()
  );

DROP POLICY IF EXISTS episodes_owner_write ON public.episodes;
CREATE POLICY episodes_owner_write ON public.episodes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.series s
      WHERE s.id = series_id
        AND s.filmmaker_id = auth.uid()
        AND s.status IN ('draft', 'changes_requested')
    ) OR public.is_staff()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.series s
      WHERE s.id = series_id
        AND s.filmmaker_id = auth.uid()
        AND s.status IN ('draft', 'changes_requested')
    ) OR public.is_staff()
  );

-- Series Genres & Credits RLS
DROP POLICY IF EXISTS series_genres_read ON public.series_genres;
CREATE POLICY series_genres_read ON public.series_genres
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.series s WHERE s.id = series_id AND s.status = 'published')
    OR EXISTS (SELECT 1 FROM public.series s WHERE s.id = series_id AND s.filmmaker_id = auth.uid())
    OR public.is_staff()
  );

DROP POLICY IF EXISTS series_genres_owner_write ON public.series_genres;
CREATE POLICY series_genres_owner_write ON public.series_genres
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.series s
      WHERE s.id = series_id
        AND s.filmmaker_id = auth.uid()
        AND s.status IN ('draft', 'changes_requested')
    ) OR public.is_staff()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.series s
      WHERE s.id = series_id
        AND s.filmmaker_id = auth.uid()
        AND s.status IN ('draft', 'changes_requested')
    ) OR public.is_staff()
  );

DROP POLICY IF EXISTS series_credits_read ON public.series_credits;
CREATE POLICY series_credits_read ON public.series_credits
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.series s WHERE s.id = series_id AND s.status = 'published')
    OR EXISTS (SELECT 1 FROM public.series s WHERE s.id = series_id AND s.filmmaker_id = auth.uid())
    OR public.is_staff()
  );

DROP POLICY IF EXISTS series_credits_owner_write ON public.series_credits;
CREATE POLICY series_credits_owner_write ON public.series_credits
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.series s
      WHERE s.id = series_id
        AND s.filmmaker_id = auth.uid()
        AND s.status IN ('draft', 'changes_requested')
    ) OR public.is_staff()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.series s
      WHERE s.id = series_id
        AND s.filmmaker_id = auth.uid()
        AND s.status IN ('draft', 'changes_requested')
    ) OR public.is_staff()
  );

-- Series Reviews RLS
DROP POLICY IF EXISTS series_reviews_read ON public.series_reviews;
CREATE POLICY series_reviews_read ON public.series_reviews
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.series s WHERE s.id = series_id AND s.filmmaker_id = auth.uid())
    OR public.is_staff()
  );

DROP POLICY IF EXISTS series_reviews_staff_insert ON public.series_reviews;
CREATE POLICY series_reviews_staff_insert ON public.series_reviews
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

-- Watch History RLS
DROP POLICY IF EXISTS ep_watch_hist_owner ON public.episode_watch_history;
CREATE POLICY ep_watch_hist_owner ON public.episode_watch_history
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Series Watchlist RLS
DROP POLICY IF EXISTS series_watchlist_owner ON public.series_watchlist;
CREATE POLICY series_watchlist_owner ON public.series_watchlist
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- =====================================================================
-- LIFECYCLE RPCS
-- =====================================================================

-- 1. RPC: submit_series
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

  IF v_series.status NOT IN ('draft', 'changes_requested') THEN
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

  -- Transition status
  UPDATE public.series
  SET status = 'submitted', updated_at = now()
  WHERE id = p_series_id;

  PERFORM public.log_action('submit', 'series', p_series_id::text,
    jsonb_build_object('title', v_series.title, 'seasons', v_season_count, 'episodes', v_episode_count));
END;
$$;


-- 2. RPC: review_series
CREATE OR REPLACE FUNCTION public.review_series(
  p_series_id uuid,
  p_decision  public.review_decision,
  p_notes     text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_series public.series%ROWTYPE;
  v_new_status public.film_status;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Curators and admins only' USING ERRCODE = '42501';
  END IF;

  IF p_decision IN ('changes_requested', 'rejected') AND (p_notes IS NULL OR char_length(trim(p_notes)) < 10) THEN
    RAISE EXCEPTION 'Review notes must provide actionable feedback (minimum 10 characters)';
  END IF;

  SELECT * INTO v_series FROM public.series WHERE id = p_series_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Series not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_series.status <> 'submitted' AND v_series.status <> 'in_review' THEN
    RAISE EXCEPTION 'Series cannot be reviewed from status %', v_series.status;
  END IF;

  -- Map decision to status
  v_new_status := CASE p_decision
    WHEN 'approved' THEN 'approved'::public.film_status
    WHEN 'changes_requested' THEN 'changes_requested'::public.film_status
    WHEN 'rejected' THEN 'rejected'::public.film_status
  END;

  UPDATE public.series
  SET status = v_new_status, updated_at = now()
  WHERE id = p_series_id;

  INSERT INTO public.series_reviews (series_id, reviewer_id, decision, notes)
  VALUES (p_series_id, auth.uid(), p_decision, coalesce(p_notes, 'Approved by curation team'));

  PERFORM public.log_action('review', 'series', p_series_id::text,
    jsonb_build_object('decision', p_decision, 'notes', p_notes));
END;
$$;


-- 3. RPC: publish_series
CREATE OR REPLACE FUNCTION public.publish_series(
  p_series_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_series public.series%ROWTYPE;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Curators and admins only' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_series FROM public.series WHERE id = p_series_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Series not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_series.status <> 'approved' THEN
    RAISE EXCEPTION 'Only approved series can be published (current: %)', v_series.status;
  END IF;

  UPDATE public.series
  SET status = 'published', published_at = now(), updated_at = now()
  WHERE id = p_series_id;

  PERFORM public.log_action('publish', 'series', p_series_id::text,
    jsonb_build_object('title', v_series.title));
END;
$$;


-- =====================================================================
-- PERMISSIONS & CACHE RELOAD
-- =====================================================================

GRANT SELECT ON public.series                TO anon, authenticated;
GRANT SELECT ON public.seasons               TO anon, authenticated;
GRANT SELECT ON public.episodes              TO anon, authenticated;
GRANT SELECT ON public.series_genres         TO anon, authenticated;
GRANT SELECT ON public.series_credits        TO anon, authenticated;
GRANT SELECT ON public.series_reviews        TO authenticated;
GRANT ALL    ON public.episode_watch_history TO authenticated;
GRANT ALL    ON public.series_watchlist      TO authenticated;

GRANT INSERT, UPDATE, DELETE ON public.series        TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.seasons       TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.episodes      TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.series_genres TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.series_credits TO authenticated;

GRANT EXECUTE ON FUNCTION public.submit_series(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_series(uuid, public.review_decision, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_series(uuid) TO authenticated;

-- Notify PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';
