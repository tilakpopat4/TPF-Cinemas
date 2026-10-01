import { Context, Next } from 'hono';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// In-memory rate map (per Worker isolate instance)
const hitCounter = new Map<string, { count: number; expiresAt: number }>();

/**
 * Lightweight sliding-window rate limiter for Cloudflare Workers.
 */
export function rateLimiter(config: RateLimitConfig = { maxRequests: 60, windowMs: 60_000 }) {
  return async (c: Context, next: Next) => {
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-real-ip') ||
      c.req.header('x-forwarded-for') ||
      'anonymous';

    const now = Date.now();
    const entry = hitCounter.get(ip);

    if (!entry || now > entry.expiresAt) {
      hitCounter.set(ip, { count: 1, expiresAt: now + config.windowMs });
    } else {
      entry.count += 1;
      if (entry.count > config.maxRequests) {
        c.header('Retry-After', Math.ceil((entry.expiresAt - now) / 1000).toString());
        return c.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please slow down and try again later.',
            },
          },
          429
        );
      }
    }

    await next();
  };
}
