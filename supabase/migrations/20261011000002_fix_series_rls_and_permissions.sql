-- =====================================================================
-- Migration: 20261011000002_fix_series_rls_and_permissions.sql
-- Description: Fix permission denied on is_staff for anon role and
-- inherit series visibility cleanly on seasons, episodes, genres & credits.
-- =====================================================================

-- 1. Allow anon to execute helper functions (which safely evaluate auth.uid() as NULL)
GRANT EXECUTE ON FUNCTION public.is_staff() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.current_app_role() TO anon;

-- 2. Update Seasons RLS: inherit series visibility
DROP POLICY IF EXISTS seasons_read ON public.seasons;
CREATE POLICY seasons_read ON public.seasons
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.series s WHERE s.id = series_id)
  );

-- 3. Update Episodes RLS: inherit series visibility
DROP POLICY IF EXISTS episodes_read ON public.episodes;
CREATE POLICY episodes_read ON public.episodes
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.series s WHERE s.id = series_id)
  );

-- 4. Update Series Genres RLS: inherit series visibility
DROP POLICY IF EXISTS series_genres_read ON public.series_genres;
CREATE POLICY series_genres_read ON public.series_genres
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.series s WHERE s.id = series_id)
  );

-- 5. Update Series Credits RLS: inherit series visibility
DROP POLICY IF EXISTS series_credits_read ON public.series_credits;
CREATE POLICY series_credits_read ON public.series_credits
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.series s WHERE s.id = series_id)
  );

-- 6. Reload schema cache immediately
NOTIFY pgrst, 'reload schema';
