/**
 * TPF Cinemas Database Types
 * Directly generated and synchronized with `tpf_cinemas_schema.sql`
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ---------------------------------------------------------------------
// 1. ENUMS
// ---------------------------------------------------------------------

export type AppRole = 'viewer' | 'filmmaker' | 'curator' | 'admin';

export type FilmStatus =
  | 'draft'
  | 'submitted'
  | 'changes_requested'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'archived';

export type VideoProvider = 'youtube' | 'mux';

export type ReviewDecision = 'approved' | 'changes_requested' | 'rejected';

export type AgeRating = 'U' | 'UA7+' | 'UA13+' | 'UA16+' | 'A';

// ---------------------------------------------------------------------
// 2. SUPABASE DATABASE DEFINITION
// ---------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        };
        Insert: {
          id: string;
          role?: AppRole;
          display_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          website_url?: string | null;
          instagram_handle?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: AppRole;
          display_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          website_url?: string | null;
          instagram_handle?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      genres: {
        Row: {
          id: number;
          name: string;
          slug: string;
        };
        Insert: {
          id?: never;
          name: string;
          slug: string;
        };
        Update: {
          id?: never;
          name?: string;
          slug?: string;
        };
      };
      films: {
        Row: {
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
          video_provider: VideoProvider;
          video_ref: string | null;
          is_debut: boolean;
          is_featured: boolean;
          status: FilmStatus;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          filmmaker_id: string;
          title: string;
          slug: string;
          synopsis?: string | null;
          director_note?: string | null;
          runtime_minutes?: number | null;
          language: string;
          release_year?: number | null;
          age_rating?: AgeRating | null;
          poster_url?: string | null;
          video_provider?: VideoProvider;
          video_ref?: string | null;
          is_debut?: boolean;
          is_featured?: boolean;
          status?: FilmStatus;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          filmmaker_id?: string;
          title?: string;
          slug?: string;
          synopsis?: string | null;
          director_note?: string | null;
          runtime_minutes?: number | null;
          language?: string;
          release_year?: number | null;
          age_rating?: AgeRating | null;
          poster_url?: string | null;
          video_provider?: VideoProvider;
          video_ref?: string | null;
          is_debut?: boolean;
          is_featured?: boolean;
          status?: FilmStatus;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      film_genres: {
        Row: {
          film_id: string;
          genre_id: number;
        };
        Insert: {
          film_id: string;
          genre_id: number;
        };
        Update: {
          film_id?: string;
          genre_id?: number;
        };
      };
      film_credits: {
        Row: {
          id: string;
          film_id: string;
          person_name: string;
          credit_role: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          film_id: string;
          person_name: string;
          credit_role: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          film_id?: string;
          person_name?: string;
          credit_role?: string;
          sort_order?: number;
        };
      };
      film_reviews: {
        Row: {
          id: string;
          film_id: string;
          reviewer_id: string;
          decision: ReviewDecision;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          film_id: string;
          reviewer_id: string;
          decision: ReviewDecision;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          film_id?: string;
          reviewer_id?: string;
          decision?: ReviewDecision;
          notes?: string | null;
          created_at?: string;
        };
      };
      licence_agreements: {
        Row: {
          id: string;
          film_id: string;
          filmmaker_id: string;
          licence_type: string;
          territory: string;
          term_months: number;
          music_cleared: boolean;
          terms_version: string;
          agreement_path: string | null;
          signed_at: string;
          verified_by: string | null;
          verified_at: string | null;
        };
        Insert: {
          id?: string;
          film_id: string;
          filmmaker_id: string;
          licence_type?: string;
          territory?: string;
          term_months?: number;
          music_cleared?: boolean;
          terms_version: string;
          agreement_path?: string | null;
          signed_at?: string;
          verified_by?: string | null;
          verified_at?: string | null;
        };
        Update: {
          id?: string;
          film_id?: string;
          filmmaker_id?: string;
          licence_type?: string;
          territory?: string;
          term_months?: number;
          music_cleared?: boolean;
          terms_version?: string;
          agreement_path?: string | null;
          signed_at?: string;
          verified_by?: string | null;
          verified_at?: string | null;
        };
      };
      comments: {
        Row: {
          id: string;
          film_id: string;
          user_id: string;
          body: string;
          is_hidden: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          film_id: string;
          user_id: string;
          body: string;
          is_hidden?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          film_id?: string;
          user_id?: string;
          body?: string;
          is_hidden?: boolean;
          created_at?: string;
        };
      };
      watchlist: {
        Row: {
          user_id: string;
          film_id: string;
          added_at: string;
        };
        Insert: {
          user_id: string;
          film_id: string;
          added_at?: string;
        };
        Update: {
          user_id?: string;
          film_id?: string;
          added_at?: string;
        };
      };
      watch_history: {
        Row: {
          user_id: string;
          film_id: string;
          progress_seconds: number;
          completed: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          film_id: string;
          progress_seconds?: number;
          completed?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          film_id?: string;
          progress_seconds?: number;
          completed?: boolean;
          updated_at?: string;
        };
      };
      audit_log: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          target_type: string;
          target_id: string;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: never;
          actor_id?: string | null;
          action: string;
          target_type: string;
          target_id: string;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: never;
          actor_id?: string | null;
          action?: string;
          target_type?: string;
          target_id?: string;
          details?: Json;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_app_role: {
        Args: Record<PropertyKey, never>;
        Returns: AppRole;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      log_action: {
        Args: {
          p_action: string;
          p_target_type: string;
          p_target_id: string;
          p_details?: Json;
        };
        Returns: void;
      };
      become_filmmaker: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
      set_user_role: {
        Args: {
          p_user_id: string;
          p_role: AppRole;
        };
        Returns: void;
      };
      submit_film: {
        Args: {
          p_film_id: string;
        };
        Returns: void;
      };
      review_film: {
        Args: {
          p_film_id: string;
          p_decision: ReviewDecision;
          p_notes?: string | null;
        };
        Returns: void;
      };
      verify_licence: {
        Args: {
          p_film_id: string;
        };
        Returns: void;
      };
      publish_film: {
        Args: {
          p_film_id: string;
        };
        Returns: void;
      };
      feature_film: {
        Args: {
          p_film_id: string;
          p_featured: boolean;
        };
        Returns: void;
      };
      takedown_film: {
        Args: {
          p_film_id: string;
        };
        Returns: void;
      };
      hide_comment: {
        Args: {
          p_comment_id: string;
          p_hidden?: boolean;
        };
        Returns: void;
      };
    };
    Enums: {
      app_role: AppRole;
      film_status: FilmStatus;
      video_provider: VideoProvider;
      review_decision: ReviewDecision;
      age_rating: AgeRating;
    };
  };
}
