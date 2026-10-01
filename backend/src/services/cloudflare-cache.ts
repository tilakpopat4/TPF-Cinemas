import { Bindings } from '../env';

interface PurgeOptions {
  urls?: string[];
  tags?: string[];
  purgeEverything?: boolean;
}

/**
 * Invalidate Cloudflare Edge Cache.
 * Called automatically when a film is published, featured, or taken down.
 */
export async function purgeEdgeCache(
  env: Bindings,
  options: PurgeOptions
): Promise<{ success: boolean; message: string }> {
  if (!env.CLOUDFLARE_ZONE_ID || !env.CLOUDFLARE_API_TOKEN) {
    console.warn('[Cache Purge] Cloudflare credentials missing, skipping edge cache purge.');
    return { success: false, message: 'Cloudflare credentials not configured' };
  }

  const endpoint = `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/purge_cache`;
  let body: Record<string, unknown> = {};

  if (options.purgeEverything) {
    body = { purge_everything: true };
  } else if (options.tags && options.tags.length > 0) {
    body = { tags: options.tags };
  } else if (options.urls && options.urls.length > 0) {
    body = { files: options.urls };
  } else {
    // Default catalogue paths to purge
    body = {
      files: [
        'https://tpfcinemas.com/',
        'https://tpfcinemas.com/films',
        'https://tpfcinemas.com/api/catalogue',
      ],
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as { success: boolean; errors?: unknown[] };
    if (!res.ok || !data.success) {
      console.error('[Cache Purge] Cloudflare API error:', data.errors);
      return { success: false, message: 'Cloudflare cache purge failed' };
    }

    return { success: true, message: 'Cloudflare cache purged successfully' };
  } catch (error) {
    console.error('[Cache Purge] Exception during purge:', error);
    return { success: false, message: (error as Error).message };
  }
}
