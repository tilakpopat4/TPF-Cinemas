import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Bindings } from '../env';
import { authMiddleware, requireRole } from '../middleware/auth';
import { getAdminClient } from '../services/supabase';

export const uploadsRouter = new Hono<{ Bindings: Bindings }>();

// All upload routes require authenticated filmmaker or admin
uploadsRouter.use('*', authMiddleware);
uploadsRouter.use('*', requireRole('filmmaker', 'admin'));

const posterUploadSchema = z.object({
  fileName: z.string().min(1).max(120),
  fileType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  fileSizeBytes: z.number().int().positive().max(5 * 1024 * 1024, 'Poster size must not exceed 5 MB'),
});

const licenceUploadSchema = z.object({
  fileName: z.string().min(1).max(120),
  fileType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
  fileSizeBytes: z.number().int().positive().max(10 * 1024 * 1024, 'Licence size must not exceed 10 MB'),
});

/**
 * POST /api/uploads/poster-url
 * Generates signed upload URL for film poster
 */
uploadsRouter.post('/poster-url', zValidator('json', posterUploadSchema), async (c) => {
  const user = c.get('user');
  const { fileName } = c.req.valid('json');

  // Sanitize filename and create user-scoped path
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `${user.id}/${Date.now()}_${sanitizedName}`;

  const supabase = getAdminClient(c.env);
  const { data, error } = await supabase.storage.from('posters').createSignedUploadUrl(path);

  if (error || !data) {
    return c.json(
      {
        success: false,
        error: { code: 'UPLOAD_SIGN_FAILED', message: error?.message || 'Could not generate upload URL' },
      },
      500
    );
  }

  const { data: publicUrlData } = supabase.storage.from('posters').getPublicUrl(path);

  return c.json({
    success: true,
    data: {
      uploadUrl: data.signedUrl,
      token: data.token,
      path,
      publicUrl: publicUrlData.publicUrl,
      expiresInSeconds: 300,
    },
  });
});

/**
 * POST /api/uploads/licence-url
 * Generates signed upload URL for private licence agreement document
 */
uploadsRouter.post('/licence-url', zValidator('json', licenceUploadSchema), async (c) => {
  const user = c.get('user');
  const { fileName } = c.req.valid('json');

  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `${user.id}/${Date.now()}_${sanitizedName}`;

  const supabase = getAdminClient(c.env);
  const { data, error } = await supabase.storage.from('licences').createSignedUploadUrl(path);

  if (error || !data) {
    return c.json(
      {
        success: false,
        error: { code: 'UPLOAD_SIGN_FAILED', message: error?.message || 'Could not generate upload URL' },
      },
      500
    );
  }

  return c.json({
    success: true,
    data: {
      uploadUrl: data.signedUrl,
      token: data.token,
      path,
      expiresInSeconds: 300,
    },
  });
});
