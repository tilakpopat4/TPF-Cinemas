import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Film } from '../types';

export function useReviewQueue(isStaff: boolean) {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!isStaff) {
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
          profiles:profiles!films_filmmaker_id_fkey (
            id, role, display_name, avatar_url, city, website_url, instagram_handle
          ),
          film_genres (
            genre_id,
            genres (id, name, slug)
          ),
          film_credits (
            id, person_name, credit_role, sort_order
          ),
          film_reviews (
            id, film_id, reviewer_id, decision, notes, created_at,
            reviewer:reviewer_id (
              display_name, role
            )
          ),
          licence_agreements (
            id, film_id, filmmaker_id, licence_type, territory, term_months, music_cleared, terms_version, agreement_path, signed_at, verified_by, verified_at,
            verifier:verified_by (
              display_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      setFilms((data as unknown as Film[]) ?? []);
    } catch (err) {
      console.error('Failed to load curation queue:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [isStaff]);

  useEffect(() => {
    fetchQueue();

    if (!isStaff) return;

    // Realtime subscription for queue updates when films are submitted or reviewed
    const channel = supabase
      .channel('staff-curation-queue')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'films' },
        () => {
          fetchQueue();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'film_reviews' },
        () => {
          fetchQueue();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'licence_agreements' },
        () => {
          fetchQueue();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'film_updates' },
        () => {
          fetchQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isStaff, fetchQueue]);

  return {
    films,
    loading,
    error,
    refreshQueue: fetchQueue,
  };
}
