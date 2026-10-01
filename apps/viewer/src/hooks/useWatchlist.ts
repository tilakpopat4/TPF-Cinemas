import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useWatchlist(userId: string | undefined) {
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    if (!userId) {
      setWatchlistIds(new Set());
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('watchlist')
        .select('film_id')
        .eq('user_id', userId);

      if (error) throw error;
      setWatchlistIds(new Set((data || []).map((row) => row.film_id)));
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const toggleWatchlist = async (filmId: string) => {
    if (!userId) return false;

    const exists = watchlistIds.has(filmId);
    // Optimistic UI update
    setWatchlistIds((prev) => {
      const next = new Set(prev);
      if (exists) {
        next.delete(filmId);
      } else {
        next.add(filmId);
      }
      return next;
    });

    try {
      if (exists) {
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', userId)
          .eq('film_id', filmId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('watchlist')
          .insert({ user_id: userId, film_id: filmId });
        if (error) throw error;
      }
      return true;
    } catch (err) {
      console.error('Failed to toggle watchlist:', err);
      // Revert optimistic update
      fetchWatchlist();
      return false;
    }
  };

  const isInWatchlist = (filmId: string) => watchlistIds.has(filmId);

  return {
    watchlistIds,
    loading,
    toggleWatchlist,
    isInWatchlist,
    refreshWatchlist: fetchWatchlist,
  };
}
