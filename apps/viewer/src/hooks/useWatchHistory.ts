import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { WatchHistoryEntry, Film } from '../types';

export function useWatchHistory(userId: string | undefined) {
  const [history, setHistory] = useState<Map<string, WatchHistoryEntry>>(new Map());
  const [loading, setLoading] = useState(false);
  const pendingUpdatesRef = useRef<Map<string, { progress_seconds: number; completed: boolean }>>(new Map());

  const fetchHistory = useCallback(async () => {
    if (!userId) {
      setHistory(new Map());
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      const historyMap = new Map<string, WatchHistoryEntry>();
      (data || []).forEach((item) => {
        historyMap.set(item.film_id, item as WatchHistoryEntry);
      });
      setHistory(historyMap);
    } catch (err) {
      console.error('Failed to load watch history:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Sync batch updates to Supabase every 15 seconds
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(async () => {
      if (pendingUpdatesRef.current.size === 0) return;

      const updates = Array.from(pendingUpdatesRef.current.entries());
      pendingUpdatesRef.current.clear();

      for (const [filmId, { progress_seconds, completed }] of updates) {
        try {
          await supabase.from('watch_history').upsert({
            user_id: userId,
            film_id: filmId,
            progress_seconds,
            completed,
            updated_at: new Date().toISOString(),
          });
        } catch (err) {
          console.error('Failed to sync watch progress:', err);
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [userId]);

  // Save progress locally and queue for sync
  const recordProgress = useCallback(
    (filmId: string, progressSeconds: number, completed = false) => {
      if (!userId) return;

      // Update local state immediately
      setHistory((prev) => {
        const next = new Map(prev);
        next.set(filmId, {
          user_id: userId,
          film_id: filmId,
          progress_seconds: progressSeconds,
          completed,
          updated_at: new Date().toISOString(),
        });
        return next;
      });

      // Queue for batched sync
      pendingUpdatesRef.current.set(filmId, {
        progress_seconds: progressSeconds,
        completed,
      });
    },
    [userId]
  );

  // Dismiss / remove a film from the active resume queue
  const dismissFromHistory = useCallback(
    async (filmId: string) => {
      if (!userId) return;

      const currentEntry = history.get(filmId);
      const progressSeconds = currentEntry?.progress_seconds || 0;

      // Remove pending updates for this film if any
      pendingUpdatesRef.current.delete(filmId);

      // Update local state immediately to mark as completed
      setHistory((prev) => {
        const next = new Map(prev);
        next.set(filmId, {
          user_id: userId,
          film_id: filmId,
          progress_seconds: progressSeconds,
          completed: true,
          updated_at: new Date().toISOString(),
        });
        return next;
      });

      try {
        await supabase.from('watch_history').upsert({
          user_id: userId,
          film_id: filmId,
          progress_seconds: progressSeconds,
          completed: true,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to dismiss film from watch history:', err);
      }
    },
    [userId, history]
  );

  const getProgress = (filmId: string) => {
    return history.get(filmId)?.progress_seconds || 0;
  };

  const isCompleted = (filmId: string) => {
    return history.get(filmId)?.completed || false;
  };

  // Helper to filter in-progress films: >= 15s watched, <= 90% watched, not completed
  const getInProgressFilms = useCallback(
    (allFilms: Film[]): Film[] => {
      if (!userId || !allFilms || allFilms.length === 0) return [];

      const inProgress = allFilms.filter((film) => {
        const entry = history.get(film.id);
        if (!entry || entry.completed) return false;

        const progress = entry.progress_seconds || 0;
        const totalSeconds = (film.runtime_minutes || 1) * 60;

        // >= 15s to filter misclicks, <= 90% to filter completed films
        return progress >= 15 && progress <= totalSeconds * 0.9;
      });

      return inProgress.sort((a, b) => {
        const timeA = new Date(history.get(a.id)?.updated_at || 0).getTime();
        const timeB = new Date(history.get(b.id)?.updated_at || 0).getTime();
        return timeB - timeA;
      });
    },
    [userId, history]
  );

  return {
    history,
    loading,
    recordProgress,
    dismissFromHistory,
    getProgress,
    isCompleted,
    getInProgressFilms,
    refreshHistory: fetchHistory,
  };
}
