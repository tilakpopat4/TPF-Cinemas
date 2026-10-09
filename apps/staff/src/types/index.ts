export type AppRole = 'viewer' | 'filmmaker' | 'curator' | 'admin';

export type FilmStatus =
  | 'draft'
  | 'submitted'
  | 'changes_requested'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'archived'
  | 'update_pending';

export type VideoProvider = 'youtube' | 'mux';
export type ReviewDecision = 'approved' | 'changes_requested' | 'rejected';
export type AgeRating = 'U' | 'UA7+' | 'UA13+' | 'UA16+' | 'A';

export interface Profile {
  id: string;
  role: AppRole;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  website_url: string | null;
  instagram_handle: string | null;
  created_at: string;
  updated_at: string;
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
}

export interface FilmCredit {
  id: string;
  film_id: string;
  person_name: string;
  credit_role: string;
  sort_order: number;
}

export interface FilmReview {
  id: string;
  film_id: string;
  reviewer_id: string;
  decision: ReviewDecision;
  notes: string | null;
  created_at: string;
  reviewer?: {
    display_name: string;
    role: AppRole;
  };
}

export interface LicenceAgreement {
  id: string;
  film_id?: string | null;
  filmmaker_id: string;
  licence_type: string;
  territory: string;
  term_months: number;
  music_cleared: boolean;
  terms_version: string;
  agreement_path: string | null;
  signature_image_url?: string | null;
  agreement_pdf_url?: string | null;
  signed_ip?: string | null;
  signed_user_agent?: string | null;
  agreement_version?: string;
  film_type_at_signing?: 'short' | 'feature' | 'all';
  legal_name?: string | null;
  production_name?: string | null;
  contact_no?: string | null;
  contact_email?: string | null;
  signed_at: string;
  verified_by: string | null;
  verified_at: string | null;
  verifier?: {
    display_name: string;
  };
  filmmaker?: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>;
  film?: Pick<Film, 'id' | 'title' | 'slug'>;
}

export interface Film {
  id: string;
  filmmaker_id: string;
  title: string;
  slug: string;
  synopsis: string | null;
  director_note: string | null;
  runtime_minutes: number | null;
  language: string;
  release_year: number | null;
  age_rating: AgeRating | null;
  poster_url: string | null;
  backdrop_url?: string | null;
  video_provider: VideoProvider;
  video_ref: string | null;
  trailer_ref?: string | null;
  aspect_ratio?: string | null;
  extra_languages?: string[] | null;
  is_debut: boolean;
  is_featured: boolean;
  status: FilmStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  film_genres?: { genre_id: number; genres?: Genre }[];
  film_credits?: FilmCredit[];
  film_reviews?: FilmReview[];
  licence_agreements?: LicenceAgreement;
  ip_hold?: boolean;
  ip_hold_reason?: string | null;
  ip_hold_at?: string | null;
}

export interface AuditLogItem {
  id: number;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
  actor?: {
    display_name: string;
    role: AppRole;
  };
}

export interface FilmUpdate {
  id: string;
  film_id: string;
  filmmaker_id: string;
  /** Only the changed fields (diff against live record) */
  proposed_changes: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_id: string | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  /** Joined film snapshot (id, title, slug, poster_url, status, language, runtime_minutes) */
  film?: Pick<Film, 'id' | 'title' | 'slug' | 'poster_url' | 'status' | 'language' | 'runtime_minutes'>;
  /** Joined filmmaker profile */
  filmmaker?: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>;
}

export interface Episode {
  id: string;
  season_id: string;
  series_id: string;
  episode_number: number;
  title: string;
  synopsis: string | null;
  runtime_minutes: number | null;
  video_provider: VideoProvider;
  video_ref: string;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Season {
  id: string;
  series_id: string;
  season_number: number;
  title: string;
  synopsis: string | null;
  release_year: number | null;
  poster_url: string | null;
  created_at: string;
  updated_at: string;
  episodes?: Episode[];
}

export interface SeriesCredit {
  id?: string;
  series_id?: string;
  person_name: string;
  credit_role: string;
  sort_order: number;
}

export interface SeriesReview {
  id: string;
  series_id: string;
  reviewer_id: string;
  decision: ReviewDecision;
  notes: string;
  created_at: string;
  reviewer?: {
    display_name: string;
    role: AppRole;
  };
}

export interface Series {
  id: string;
  filmmaker_id: string;
  title: string;
  slug: string;
  synopsis: string | null;
  creator_note: string | null;
  language: string;
  age_rating: AgeRating | null;
  poster_url: string | null;
  backdrop_url: string | null;
  trailer_ref: string | null;
  total_seasons: number;
  status: FilmStatus;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  seasons?: Season[];
  series_genres?: { genre_id: number; genres?: Genre }[];
  series_credits?: SeriesCredit[];
  series_reviews?: SeriesReview[];
  profiles?: Profile;
  episode_count?: number;
}

