export type AppRole = 'viewer' | 'filmmaker' | 'curator' | 'admin';
export type FilmStatus = 'draft' | 'submitted' | 'changes_requested' | 'approved' | 'published' | 'rejected' | 'archived';
export type AgeRating = 'U' | 'UA7+' | 'UA13+' | 'UA16+' | 'A';
export type VideoProvider = 'youtube' | 'mux';

export interface Genre {
  id: number;
  name: string;
  slug: string;
}

export interface FilmCredit {
  id: string;
  person_name: string;
  credit_role: string;
  sort_order: number;
}

export interface Profile {
  id: string;
  role: AppRole;
  display_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  website_url?: string | null;
  instagram_handle?: string | null;
}

export interface Film {
  id: string;
  filmmaker_id: string;
  title: string;
  slug: string;
  synopsis: string;
  runtime_minutes: number;
  release_year: number;
  language: string;
  age_rating: AgeRating;
  video_provider: VideoProvider;
  video_ref: string;
  poster_url: string;
  is_featured: boolean;
  is_debut: boolean;
  status: FilmStatus;
  published_at: string | null;
  view_count: number;
  created_at: string;
  profiles?: Profile | null;
  film_genres?: { genre_id: number; genres: Genre }[];
  film_credits?: FilmCredit[];
}

export interface WatchlistEntry {
  user_id: string;
  film_id: string;
  added_at: string;
  film?: Film;
}

export interface WatchHistoryEntry {
  user_id: string;
  film_id: string;
  progress_seconds: number;
  completed: boolean;
  updated_at: string;
  film?: Film;
}

export interface Comment {
  id: string;
  film_id: string;
  user_id: string;
  body: string;
  is_hidden: boolean;
  created_at: string;
  profile?: Profile;
}
