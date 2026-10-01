import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Film, Genre } from '../types';

// Sample preview film to ensure the catalog looks rich even before first publication
const SAMPLE_FILMS: Film[] = [
  {
    id: 'preview-1',
    filmmaker_id: '00000000-0000-0000-0000-000000000000',
    title: 'The Sound of Rain',
    slug: 'the-sound-of-rain',
    synopsis: 'A lone sound archivist in the Western Ghats discovers an acoustic anomaly within the monsoon canopy that defies physical explanation, unravelling a poignant personal memory.',
    runtime_minutes: 22,
    release_year: 2025,
    language: 'Malayalam',
    age_rating: 'UA13+',
    video_provider: 'youtube',
    video_ref: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    poster_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=900&auto=format&fit=crop',
    is_featured: true,
    is_debut: true,
    status: 'published',
    published_at: new Date().toISOString(),
    view_count: 1420,
    created_at: new Date().toISOString(),
    profiles: {
      id: '00000000-0000-0000-0000-000000000000',
      role: 'filmmaker',
      display_name: 'Anand Menon',
      city: 'Kochi, Kerala',
    },
    film_genres: [
      { genre_id: 1, genres: { id: 1, name: 'Drama', slug: 'drama' } },
      { genre_id: 9, genres: { id: 9, name: 'Sci-fi', slug: 'sci-fi' } },
    ],
    film_credits: [
      { id: 'c1', person_name: 'Anand Menon', credit_role: 'Director / Writer', sort_order: 1 },
      { id: 'c2', person_name: 'Reshma Pillai', credit_role: 'Sound Designer', sort_order: 2 },
    ],
  },
  {
    id: 'preview-2',
    filmmaker_id: '00000000-0000-0000-0000-000000000000',
    title: 'Midnight Crossing',
    slug: 'midnight-crossing',
    synopsis: 'On the final night ferry across the Brahmaputra, an estranged brother and sister confront a long-buried inheritance dispute while stranded in dense river fog.',
    runtime_minutes: 18,
    release_year: 2025,
    language: 'Assamese',
    age_rating: 'UA7+',
    video_provider: 'youtube',
    video_ref: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
    poster_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=900&auto=format&fit=crop',
    is_featured: false,
    is_debut: false,
    status: 'published',
    published_at: new Date().toISOString(),
    view_count: 980,
    created_at: new Date().toISOString(),
    profiles: {
      id: '00000000-0000-0000-0000-000000000000',
      role: 'filmmaker',
      display_name: 'Pranab Bordoloi',
      city: 'Guwahati, Assam',
    },
    film_genres: [
      { genre_id: 1, genres: { id: 1, name: 'Drama', slug: 'drama' } },
      { genre_id: 3, genres: { id: 3, name: 'Thriller', slug: 'thriller' } },
    ],
    film_credits: [
      { id: 'c3', person_name: 'Pranab Bordoloi', credit_role: 'Director', sort_order: 1 },
    ],
  },
  {
    id: 'preview-3',
    filmmaker_id: '00000000-0000-0000-0000-000000000000',
    title: 'Letters from Old Delhi',
    slug: 'letters-from-old-delhi',
    synopsis: 'A lyrical exploration of Chandni Chowk through handwritten postcards found in an abandoned calligrapher’s studio before redevelopment begins.',
    runtime_minutes: 29,
    release_year: 2024,
    language: 'Hindi / Urdu',
    age_rating: 'U',
    video_provider: 'youtube',
    video_ref: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    poster_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=900&auto=format&fit=crop',
    is_featured: true,
    is_debut: false,
    status: 'published',
    published_at: new Date().toISOString(),
    view_count: 3200,
    created_at: new Date().toISOString(),
    profiles: {
      id: '00000000-0000-0000-0000-000000000000',
      role: 'filmmaker',
      display_name: 'Zoya Qureshi',
      city: 'Delhi',
    },
    film_genres: [
      { genre_id: 6, genres: { id: 6, name: 'Documentary', slug: 'documentary' } },
    ],
    film_credits: [
      { id: 'c4', person_name: 'Zoya Qureshi', credit_role: 'Director & Cinematographer', sort_order: 1 },
    ],
  }
];

export function useCatalogue() {
  const [films, setFilms] = useState<Film[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFilms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch published films
      const { data: filmsData, error: filmsErr } = await supabase
        .from('films')
        .select(`
          *,
          profiles:profiles!films_filmmaker_id_fkey (
            id, role, display_name, bio, avatar_url, city, website_url, instagram_handle
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

      // Combine real published films with sample films if catalog has fewer than 2 films
      const published = (filmsData as unknown as Film[]) ?? [];
      if (published.length > 0) {
        // Prepend published films before sample showcase items
        const existingIds = new Set(published.map(p => p.id));
        const filteredSamples = SAMPLE_FILMS.filter(s => !existingIds.has(s.id));
        setFilms([...published, ...filteredSamples]);
      } else {
        setFilms(SAMPLE_FILMS);
      }
    } catch (err) {
      console.warn('Catalogue load warning (using local showcase):', err);
      setError((err as Error).message);
      setFilms(SAMPLE_FILMS);
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
