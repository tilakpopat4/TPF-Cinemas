import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Series } from '../types';

export function useSeriesQueue(isStaff: boolean) {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!isStaff) {
      setSeriesList([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('series')
        .select(`
          *,
          profiles:profiles!series_filmmaker_id_fkey (
            id, role, display_name, avatar_url, city, website_url, instagram_handle
          ),
          seasons (
            id, series_id, season_number, title, synopsis, release_year, poster_url, created_at, updated_at,
            episodes (
              id, season_id, series_id, episode_number, title, synopsis, runtime_minutes, video_provider, video_ref, thumbnail_url, created_at, updated_at
            )
          ),
          series_genres (
            genre_id,
            genres (id, name, slug)
          ),
          series_credits (
            id, person_name, credit_role, sort_order
          ),
          series_reviews (
            id, series_id, reviewer_id, decision, notes, created_at,
            reviewer:reviewer_id (
              display_name, role
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      const formatted = ((data as unknown as Series[]) ?? []).map((s) => {
        const sortedSeasons = (s.seasons || []).sort((a, b) => a.season_number - b.season_number);
        sortedSeasons.forEach((season) => {
          if (season.episodes) {
            season.episodes.sort((a, b) => a.episode_number - b.episode_number);
          }
        });
        const totalEpisodes = sortedSeasons.reduce((sum, season) => sum + (season.episodes?.length || 0), 0);
        return {
          ...s,
          seasons: sortedSeasons,
          episode_count: totalEpisodes,
        };
      });

      setSeriesList(formatted);
    } catch (err) {
      console.error('Failed to load series queue:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [isStaff]);

  useEffect(() => {
    fetchQueue();

    if (!isStaff) return;

    const channel = supabase
      .channel('staff-series-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'series' }, () => {
        fetchQueue();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'series_reviews' }, () => {
        fetchQueue();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isStaff, fetchQueue]);

  return {
    seriesList,
    loading,
    error,
    refreshQueue: fetchQueue,
  };
}
