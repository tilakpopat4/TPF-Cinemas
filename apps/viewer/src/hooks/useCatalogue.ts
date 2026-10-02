import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Film, Genre } from '../types';

// Sample preview films representing authentic independent festival selections
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
    backdrop_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1600&auto=format&fit=crop',
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
      bio: 'Alumnus of Satyajit Ray Film & Television Institute. Explores auditory ecologies and rural memories across Southern India.',
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
    backdrop_url: 'https://images.unsplash.com/photo-1490750967868-88df5691cc5e?q=80&w=1600&auto=format&fit=crop',
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
      bio: 'Documentary and narrative filmmaker working along the Brahmaputra basin, focusing on riverine isolation.',
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
    synopsis: 'A lyrical exploration of Chandni Chowk through handwritten postcards found in an abandoned calligrapher\'s studio before demolition.',
    runtime_minutes: 29,
    release_year: 2024,
    language: 'Hindi / Urdu',
    age_rating: 'U',
    video_provider: 'youtube',
    video_ref: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    poster_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=900&auto=format&fit=crop',
    backdrop_url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1600&auto=format&fit=crop',
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
      bio: 'National Award-winning visual archivist capturing endangered architectural heritage and written cultures.',
    },
    film_genres: [
      { genre_id: 6, genres: { id: 6, name: 'Documentary', slug: 'documentary' } },
    ],
    film_credits: [
      { id: 'c4', person_name: 'Zoya Qureshi', credit_role: 'Director & Cinematographer', sort_order: 1 },
    ],
  },
  {
    id: 'preview-4',
    filmmaker_id: '00000000-0000-0000-0000-000000000000',
    title: 'Shadows of Chettinad',
    slug: 'shadows-of-chettinad',
    synopsis: 'Inside an empty 120-room ancestral mansion in rural Tamil Nadu, an elderly caretaker preserves memories of a bygone merchant dynasty through ritualistic daily chores.',
    runtime_minutes: 24,
    release_year: 2025,
    language: 'Tamil',
    age_rating: 'U',
    video_provider: 'youtube',
    video_ref: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    poster_url: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=900&auto=format&fit=crop',
    backdrop_url: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?q=80&w=1600&auto=format&fit=crop',
    is_featured: false,
    is_debut: true,
    status: 'published',
    published_at: new Date().toISOString(),
    view_count: 1840,
    created_at: new Date().toISOString(),
    profiles: {
      id: '00000000-0000-0000-0000-000000000000',
      role: 'filmmaker',
      display_name: 'Karthik Subramanian',
      city: 'Madurai, Tamil Nadu',
      bio: 'Independent director exploring spatial stillness and Tamil vernacular architecture on 16mm celluloid.',
    },
    film_genres: [
      { genre_id: 1, genres: { id: 1, name: 'Drama', slug: 'drama' } },
      { genre_id: 6, genres: { id: 6, name: 'Documentary', slug: 'documentary' } },
    ],
    film_credits: [
      { id: 'c5', person_name: 'Karthik Subramanian', credit_role: 'Director', sort_order: 1 },
    ],
  },
  {
    id: 'preview-5',
    filmmaker_id: '00000000-0000-0000-0000-000000000000',
    title: 'The Clay Modeler of Kumartuli',
    slug: 'the-clay-modeler-of-kumartuli',
    synopsis: 'Days before the autumnal festival in Kolkata, a veteran idol-maker loses his eyesight and must teach his estranged daughter the sacred geometry of sculpting.',
    runtime_minutes: 31,
    release_year: 2025,
    language: 'Bengali',
    age_rating: 'UA7+',
    video_provider: 'youtube',
    video_ref: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
    poster_url: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=900&auto=format&fit=crop',
    backdrop_url: 'https://images.unsplash.com/photo-1574717024192-64dad02cf1b5?q=80&w=1600&auto=format&fit=crop',
    is_featured: false,
    is_debut: true,
    status: 'published',
    published_at: new Date().toISOString(),
    view_count: 2150,
    created_at: new Date().toISOString(),
    profiles: {
      id: '00000000-0000-0000-0000-000000000000',
      role: 'filmmaker',
      display_name: 'Debashish Roy',
      city: 'Kolkata, West Bengal',
      bio: 'Photographer and fiction debutant examining generational artisan guilds in North Kolkata.',
    },
    film_genres: [
      { genre_id: 1, genres: { id: 1, name: 'Drama', slug: 'drama' } },
    ],
    film_credits: [
      { id: 'c6', person_name: 'Debashish Roy', credit_role: 'Director & Writer', sort_order: 1 },
    ],
  }
];

export function useCatalogue() {
  const [films, setFilms] = useState<Film[]>(SAMPLE_FILMS);
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
