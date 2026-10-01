import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Bindings } from '../env';
import { authMiddleware, requireRole } from '../middleware/auth';
import { purgeEdgeCache } from '../services/cloudflare-cache';

export const cacheRouter = new Hono<{ Bindings: Bindings }>();

// Only admins can manually purge cache
cacheRouter.use('*', authMiddleware);
cacheRouter.use('*', requireRole('admin'));

const purgeCacheSchema = z.object({
  purgeEverything: z.boolean().optional(),
  urls: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * POST /api/cache/purge
 * Manually invalidates Cloudflare Edge CDN cache
 */
cacheRouter.post('/purge', zValidator('json', purgeCacheSchema), async (c) => {
  const options = c.req.valid('json');
  const result = await purgeEdgeCache(c.env, options);

  if (!result.success) {
    return c.json(
      { success: false, error: { code: 'CACHE_PURGE_FAILED', message: result.message } },
      500
    );
  }

  return c.json({
    success: true,
    data: { message: result.message },
  });
});
