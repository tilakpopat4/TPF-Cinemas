import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Film, Genre } from '../types';

export function useCatalogue() {
  const [films, setFilms] = useState<Film[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFilms = useCallback(async () => {
    try {
      setError(null);

      // 1. Fetch published films (omit 'role' from profiles to satisfy anon column grants)
      const { data: filmsData, error: filmsErr } = await supabase
        .from('films')
        .select(`
          *,
          profiles:profiles!films_filmmaker_id_fkey (
            id, display_name, bio, avatar_url, city, website_url, instagram_handle
          ),
          film_genres (
            genre_id,
            genres (id, name, slug)
          ),
          film_credits (
            id, person_name, credit_role, sort_order
          )
        `)
        .eq('status', 'published')
        .eq('ip_hold', false)
        .order('published_at', { ascending: false });

      if (filmsErr) throw filmsErr;

      // 2. Fetch genres
      const { data: genresData, error: genresErr } = await supabase
        .from('genres')
        .select('*')
        .order('name');

      if (genresErr) throw genresErr;

      if (genresData) {
        setGenres(genresData as Genre[]);
      }

      const published = (filmsData as unknown as Film[]) ?? [];
      setFilms(published);
    } catch (err) {
      console.error('Catalogue load error:', err);
      setError((err as Error).message);
      setFilms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilms();

    // Listen for new publications in realtime
    const channel = supabase
      .channel('viewer-catalogue')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'films' },
        () => {
          fetchFilms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFilms]);

  // Filtered films by search and genre
  const filteredFilms = useMemo(() => {
    return films.filter((film) => {
      // Genre filter
      if (selectedGenre) {
        const hasGenre = film.film_genres?.some(
          (fg) => fg.genres?.slug === selectedGenre || fg.genres?.name.toLowerCase() === selectedGenre.toLowerCase()
        );
        if (!hasGenre) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = film.title.toLowerCase().includes(q);
        const matchesSynopsis = film.synopsis?.toLowerCase().includes(q);
        const matchesFilmmaker = film.profiles?.display_name?.toLowerCase().includes(q);
        const matchesCredit = film.film_credits?.some((c) =>
          c.person_name.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesSynopsis && !matchesFilmmaker && !matchesCredit) {
          return false;
        }
      }

      return true;
    });
  }, [films, selectedGenre, searchQuery]);

  // Featured film for the hero billboard
  const featuredFilm = useMemo(() => {
    return films.find((f) => f.is_featured) || films[0] || null;
  }, [films]);

  // Debut spotlight films
  const debutFilms = useMemo(() => {
    return films.filter((f) => f.is_debut);
  }, [films]);

  return {
    films,
    genres,
    loading,
    error,
    selectedGenre,
    setSelectedGenre,
    searchQuery,
    setSearchQuery,
    filteredFilms,
    featuredFilm,
    debutFilms,
    refreshCatalogue: fetchFilms,
  };
}
