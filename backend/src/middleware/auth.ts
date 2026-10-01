import { Context, Next } from 'hono';
import { Bindings } from '../env';
import { getAdminClient } from '../services/supabase';
import { AppRole } from '../types/database';
import { AuthUser } from '../types/api';

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
    token: string;
  }
}

/**
 * Authentication middleware.
 * Verifies Bearer JWT via Supabase Auth and loads user role from profiles table.
 */
export async function authMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or malformed Authorization header. Bearer token required.',
        },
      },
      401
    );
  }

  const token = authHeader.substring(7);
  const supabaseAdmin = getAdminClient(c.env);

  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !userData?.user) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: authError?.message || 'Invalid or expired session token.',
        },
      },
      401
    );
  }

  // Fetch application role and profile details
  const { data: profileData } = await supabaseAdmin
    .from('profiles')
    .select('role, display_name')
    .eq('id', userData.user.id)
    .maybeSingle();

  const profile = profileData as { role: AppRole; display_name: string } | null;

  const authUser: AuthUser = {
    id: userData.user.id,
    email: userData.user.email ?? '',
    role: profile?.role ?? 'viewer',
    displayName: profile?.display_name ?? '',
  };

  c.set('user', authUser);
  c.set('token', token);

  await next();
}

/**
 * Role-guard middleware factory.
 * Ensures the authenticated user possesses one of the allowed roles.
 */
export function requireRole(...allowedRoles: AppRole[]) {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const user = c.get('user');
    if (!user) {
      return c.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        },
        401
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Action requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${user.role}`,
          },
        },
        403
      );
    }

    await next();
  };
}
