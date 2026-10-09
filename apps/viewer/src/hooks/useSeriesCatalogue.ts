import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Series, Season, Episode } from '../types';

export function useSeriesCatalogue(userId?: string) {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Series Watchlist Set
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());

  // Episode Progress Map: episode_id -> progress_seconds
  const [episodeProgress, setEpisodeProgress] = useState<Map<string, number>>(new Map());

  const pendingProgressRef = useRef<Map<string, { progress_seconds: number; completed: boolean }>>(new Map());

  const fetchSeries = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('series')
        .select(`
          *,
          profiles:profiles!series_creator_id_fkey (
            id, display_name, bio, avatar_url, city, website_url, instagram_handle
          ),
          series_genres (
            genre_id,
            genres (id, name, slug)
          ),
          series_credits (
            id, person_name, credit_role, sort_order
          ),
          seasons (
            id, series_id, season_number, title, synopsis, trailer_ref, poster_url, release_year, created_at,
            episodes (
              id, season_id, episode_number, title, slug, synopsis, runtime_minutes,
              video_provider, video_ref, thumbnail_url, is_free_preview, view_count, created_at
            )
          )
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      // Sort seasons and episodes numerically
      const parsed: Series[] = (data || []).map((s: any) => {
        const sortedSeasons = (s.seasons || [])
          .sort((a: Season, b: Season) => a.season_number - b.season_number)
          .map((season: Season) => ({
            ...season,
            episodes: (season.episodes || []).sort(
              (a: Episode, b: Episode) => a.episode_number - b.episode_number
            ),
          }));
        return {
          ...s,
          seasons: sortedSeasons,
        };
      });

      setSeriesList(parsed);
    } catch (err: any) {
      console.error('Failed to load published web series:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch watchlist for current user
  const fetchWatchlist = useCallback(async () => {
    if (!userId) {
      setWatchlistIds(new Set());
      return;
    }
    try {
      const { data, error: wlErr } = await supabase
        .from('series_watchlist')
        .select('series_id')
        .eq('user_id', userId);

      if (wlErr) throw wlErr;
      const ids = new Set<string>((data || []).map((row) => row.series_id));
      setWatchlistIds(ids);
    } catch (err) {
      console.error('Failed to load series watchlist:', err);
    }
  }, [userId]);

  // Fetch episode watch history for user
  const fetchEpisodeProgress = useCallback(async () => {
    if (!userId) {
      setEpisodeProgress(new Map());
      return;
    }
    try {
      const { data, error: epErr } = await supabase
        .from('episode_watch_history')
        .select('episode_id, progress_seconds')
        .eq('user_id', userId);

      if (epErr) throw epErr;
      const map = new Map<string, number>();
      (data || []).forEach((row) => {
        map.set(row.episode_id, row.progress_seconds);
      });
      setEpisodeProgress(map);
    } catch (err) {
      console.error('Failed to load episode progress:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  useEffect(() => {
    fetchWatchlist();
    fetchEpisodeProgress();
  }, [fetchWatchlist, fetchEpisodeProgress]);

  // Periodic flush of episode progress
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(async () => {
      if (pendingProgressRef.current.size === 0) return;

      const updates = Array.from(pendingProgressRef.current.entries());
      pendingProgressRef.current.clear();

      for (const [episodeId, { progress_seconds, completed }] of updates) {
        try {
          await supabase.from('episode_watch_history').upsert({
            user_id: userId,
            episode_id: episodeId,
            progress_seconds,
            completed,
            updated_at: new Date().toISOString(),
          });
        } catch (err) {
          console.error('Error saving episode progress:', err);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [userId]);

  const recordEpisodeProgress = useCallback(
    (episodeId: string, seconds: number, completed = false) => {
      if (!userId) return;
      setEpisodeProgress((prev) => {
        const next = new Map(prev);
        next.set(episodeId, seconds);
        return next;
      });
      pendingProgressRef.current.set(episodeId, { progress_seconds: seconds, completed });
    },
    [userId]
  );

  const toggleSeriesWatchlist = useCallback(
    async (seriesId: string) => {
      if (!userId) return;
      const inWl = watchlistIds.has(seriesId);

      setWatchlistIds((prev) => {
        const next = new Set(prev);
        if (inWl) next.delete(seriesId);
        else next.add(seriesId);
        return next;
      });

      try {
        if (inWl) {
          await supabase
            .from('series_watchlist')
            .delete()
            .eq('user_id', userId)
            .eq('series_id', seriesId);
        } else {
          await supabase.from('series_watchlist').insert({
            user_id: userId,
            series_id: seriesId,
          });
        }
      } catch (err) {
        console.error('Failed to update series watchlist:', err);
        fetchWatchlist();
      }
    },
    [userId, watchlistIds, fetchWatchlist]
  );

  return {
    seriesList,
    loading,
    error,
    refreshSeries: fetchSeries,
    watchlistIds,
    toggleSeriesWatchlist,
    isInWatchlist: (seriesId: string) => watchlistIds.has(seriesId),
    recordEpisodeProgress,
    getEpisodeProgress: (episodeId: string) => episodeProgress.get(episodeId) || 0,
  };
}
