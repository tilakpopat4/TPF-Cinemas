import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Series } from '../types';

export function useSeries(userId?: string) {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSeries = useCallback(async () => {
    if (!userId) {
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
            id, series_id, reviewer_id, decision, notes, created_at
          )
        `)
        .eq('filmmaker_id', userId)
        .order('created_at', { ascending: false });

      if (fetchErr) {
        throw fetchErr;
      }

      const formatted = ((data as unknown as Series[]) ?? []).map((s) => {
        // Sort seasons by season_number
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
      console.error('Error fetching filmmaker series:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSeries();

    if (!userId) return;

    const channel = supabase
      .channel(`filmmaker-series-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'series', filter: `filmmaker_id=eq.${userId}` },
        () => {
          fetchSeries();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'series_reviews' },
        () => {
          fetchSeries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchSeries]);

  const deleteSeries = async (seriesId: string) => {
    try {
      const { error: delErr } = await supabase.from('series').delete().eq('id', seriesId);
      if (delErr) throw delErr;
      setSeriesList((prev) => prev.filter((s) => s.id !== seriesId));
    } catch (err) {
      console.error('Failed to delete series draft:', err);
      throw err;
    }
  };

  const submitSeries = async (seriesId: string) => {
    try {
      const { error: rpcErr } = await supabase.rpc('submit_series', { p_series_id: seriesId });
      if (rpcErr) throw rpcErr;
      await fetchSeries();
    } catch (err) {
      console.error('Failed to submit series:', err);
      throw err;
    }
  };

  return {
    seriesList,
    loading,
    error,
    refreshSeries: fetchSeries,
    deleteSeries,
    submitSeries,
  };
}
