import { FilmStatus, AppRole } from './database';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Upload URL requests
export interface GeneratePosterUploadUrlRequest {
  fileName: string;
  fileType: 'image/jpeg' | 'image/png' | 'image/webp';
  fileSizeBytes: number;
}

export interface GenerateLicenceUploadUrlRequest {
  fileName: string;
  fileType: 'application/pdf' | 'image/jpeg' | 'image/png';
  fileSizeBytes: number;
}

export interface SignedUploadUrlResponse {
  uploadUrl: string;
  bucket: string;
  path: string;
  publicUrl?: string;
  expiresInSeconds: number;
}

// Database Webhook Payload from Supabase
export interface SupabaseWebhookPayload<T = Record<string, unknown>> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: T;
  old_record: T | null;
}

// Film change payload
export interface FilmWebhookRecord {
  id: string;
  filmmaker_id: string;
  title: string;
  slug: string;
  status: FilmStatus;
  is_featured: boolean;
  published_at: string | null;
  video_ref: string | null;
}

// Review webhook record
export interface FilmReviewWebhookRecord {
  id: string;
  film_id: string;
  reviewer_id: string;
  decision: 'approved' | 'changes_requested' | 'rejected';
  notes: string | null;
  created_at: string;
}

// Authenticated user session attached to Hono Context
export interface AuthUser {
  id: string;
  email: string;
  role: AppRole;
  displayName: string;
}
