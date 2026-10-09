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
  director_note?: string | null;
  runtime_minutes: number;
  release_year: number;
  language: string;
  age_rating: AgeRating;
  video_provider: VideoProvider;
  video_ref: string;
  trailer_ref?: string | null;
  aspect_ratio?: string | null;
  extra_languages?: string[] | null;
  poster_url: string;
  backdrop_url?: string | null;
  is_featured: boolean;
  is_debut: boolean;
  status: FilmStatus;
  published_at: string | null;
  view_count: number;
  created_at: string;
  profiles?: Profile | null;
  film_genres?: { genre_id: number; genres: Genre }[];
  film_credits?: FilmCredit[];
  ip_hold?: boolean;
  ip_hold_reason?: string | null;
  ip_hold_at?: string | null;
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

export type SeriesStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'changes_requested'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'archived';

export interface SeriesCredit {
  id: string;
  series_id: string;
  person_name: string;
  credit_role: string;
  sort_order: number;
}

export interface Episode {
  id: string;
  season_id: string;
  episode_number: number;
  title: string;
  slug: string;
  synopsis?: string | null;
  runtime_minutes: number;
  video_provider: VideoProvider;
  video_ref: string;
  thumbnail_url?: string | null;
  is_free_preview: boolean;
  view_count: number;
  created_at: string;
}

export interface Season {
  id: string;
  series_id: string;
  season_number: number;
  title: string;
  synopsis?: string | null;
  trailer_ref?: string | null;
  poster_url?: string | null;
  release_year?: number | null;
  created_at: string;
  episodes?: Episode[];
}

export interface Series {
  id: string;
  creator_id: string;
  title: string;
  slug: string;
  synopsis: string;
  creator_note?: string | null;
  release_year: number;
  language: string;
  age_rating: AgeRating;
  aspect_ratio?: string | null;
  poster_url: string;
  backdrop_url?: string | null;
  trailer_ref?: string | null;
  is_featured: boolean;
  status: SeriesStatus;
  rights_declaration: boolean;
  rights_notes?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile | null;
  seasons?: Season[];
  series_credits?: SeriesCredit[];
  series_genres?: { genre_id: number; genres: Genre }[];
}

export interface EpisodeWatchHistoryEntry {
  user_id: string;
  episode_id: string;
  progress_seconds: number;
  completed: boolean;
  updated_at: string;
  episode?: Episode;
}

