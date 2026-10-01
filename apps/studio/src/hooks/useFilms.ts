import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Film } from '../types';

export function useFilms(userId?: string) {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFilms = useCallback(async () => {
    if (!userId) {
      setFilms([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('films')
        .select(`
          *,
          film_genres (
            genre_id,
            genres (id, name, slug)
          ),
          film_credits (
            id, person_name, credit_role, sort_order
          ),
          film_reviews (
            id, film_id, reviewer_id, decision, notes, created_at
          ),
          licence_agreements (
            id, film_id, filmmaker_id, licence_type, territory, term_months, music_cleared, terms_version, agreement_path, signed_at, verified_by, verified_at
          )
        `)
        .eq('filmmaker_id', userId)
        .order('created_at', { ascending: false });

      if (fetchErr) {
        throw fetchErr;
      }

      setFilms((data as unknown as Film[]) ?? []);
    } catch (err) {
      console.error('Error fetching filmmaker films:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFilms();

    if (!userId) return;

    // Realtime subscription for film status updates and review alerts
    const channel = supabase
      .channel(`filmmaker-films-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'films', filter: `filmmaker_id=eq.${userId}` },
        () => {
          fetchFilms();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'film_reviews' },
        () => {
          fetchFilms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchFilms]);

  return {
    films,
    loading,
    error,
    refreshFilms: fetchFilms,
  };
}
