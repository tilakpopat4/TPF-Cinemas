import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Genre } from '../types';

export function useGenres() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGenres() {
      try {
        const { data, error } = await supabase
          .from('genres')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.error('Error loading genres:', error);
        } else if (data) {
          setGenres(data as Genre[]);
        }
      } catch (err) {
        console.error('Failed to load genres:', err);
      } finally {
        setLoading(false);
      }
    }

    loadGenres();
  }, []);

  return { genres, loading };
}
