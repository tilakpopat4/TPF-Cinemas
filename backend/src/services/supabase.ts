import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Bindings } from '../env';
import { Database } from '../types/database';

/**
 * Creates an administrative Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Bypasses RLS - use ONLY for background jobs, webhooks, and secure edge tasks.
 * NEVER expose to the browser.
 */
export function getAdminClient(env: Bindings): SupabaseClient<Database> {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Creates a scoped Supabase client with the user's JWT token.
 * All queries executed with this client are evaluated under Postgres RLS and user role.
 */
export function getUserClient(env: Bindings, token: string): SupabaseClient<Database> {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
