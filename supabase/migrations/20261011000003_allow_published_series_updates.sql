-- =====================================================================
-- Migration: 20261011000003_allow_published_series_updates.sql
-- Description: Allow creators to edit and update series, seasons,
-- episodes, genres, and credits even after publishing (status = 'published').
-- =====================================================================

-- 1. Series update policy: Allow filmmakers to update their own published series
DROP POLICY IF EXISTS series_owner_update ON public.series;
CREATE POLICY series_owner_update ON public.series
  FOR UPDATE TO authenticated
  USING (
    filmmaker_id = auth.uid()
    AND status IN ('draft', 'changes_requested', 'published')
  )
  WITH CHECK (
    filmmaker_id = auth.uid()
    AND status IN ('draft', 'changes_requested', 'published')
  );

-- 2. Seasons write policy: Allow seasons changes for published series
DROP POLICY IF EXISTS seasons_owner_write ON public.seasons;
CREATE POLICY seasons_owner_write ON public.seasons
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.series s
      WHERE s.id = series_id
        AND s.filmmaker_id = auth.uid()
        AND s.status IN ('draft', 'changes_requested', 'published')
    ) OR public.is_staff()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.series s
      WHERE s.id = series_id
        AND s.filmmaker_id = auth.uid()
        AND s.status IN ('draft', 'changes_requested', 'published')
    ) OR public.is_staff()
  );

-- 3. Episodes write policy: Allow episode additions/modifications for published series
DROP POLICY IF EXISTS episodes_owner_write ON public.episodes;
CREATE POLICY episodes_owner_write ON public.episodes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.series s
      WHERE s.id = series_id
        AND s.filmmaker_id = auth.uid()
        AND s.status IN ('draft', 'changes_requested', 'published')
    ) OR public.is_staff()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.series s
      WHERE s.id = series_id
        AND s.filmmaker_id = auth.uid()
        AND s.status IN ('draft', 'changes_requested', 'published')
    ) OR public.is_staff()
  );

-- 4. Series Genres write policy: Allow updating genres for published series
DROP POLICY IF EXISTS series_genres_owner_write ON public.series_genres;
CREATE POLICY series_genres_owner_write ON public.series_genres
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.series s
      WHERE s.id = series_id
        AND s.filmmaker_id = auth.uid()
        AND s.status IN ('draft', 'changes_requested', 'published')
    ) OR public.is_staff()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.series s
      WHERE s.id = series_id
        AND s.filmmaker_id = auth.uid()
        AND s.status IN ('draft', 'changes_requested', 'published')
    ) OR public.is_staff()
  );

-- 5. Series Credits write policy: Allow updating cast & credits for published series
DROP POLICY IF EXISTS series_credits_owner_write ON public.series_credits;
CREATE POLICY series_credits_owner_write ON public.series_credits
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.series s
      WHERE s.id = series_id
        AND s.filmmaker_id = auth.uid()
        AND s.status IN ('draft', 'changes_requested', 'published')
    ) OR public.is_staff()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.series s
      WHERE s.id = series_id
        AND s.filmmaker_id = auth.uid()
        AND s.status IN ('draft', 'changes_requested', 'published')
    ) OR public.is_staff()
  );

-- 6. Reload schema cache immediately
NOTIFY pgrst, 'reload schema';
