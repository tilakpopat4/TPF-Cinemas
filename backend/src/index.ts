import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { Bindings, validateEnv } from './env';
import { errorHandler } from './middleware/error-handler';
import { rateLimiter } from './middleware/rate-limiter';
import { healthRouter } from './routes/health';
import { uploadsRouter } from './routes/uploads';
import { webhooksRouter } from './routes/webhooks';
import { cacheRouter } from './routes/cache';
import { filmsRouter } from './routes/films';

const app = new Hono<{ Bindings: Bindings }>();

// 1. Environment validation middleware
app.use('*', async (c, next) => {
  // Validate presence of core variables
  try {
    validateEnv(c.env);
  } catch (err) {
    console.error('[Env Error]', err);
    return c.json(
      {
        success: false,
        error: { code: 'CONFIG_ERROR', message: (err as Error).message },
      },
      500
    );
  }
  await next();
});

// 2. Global Security Headers
app.use('*', secureHeaders());

// 3. Logger
app.use('*', logger());

// 4. Rate Limiting (60 requests per minute per IP)
app.use('*', rateLimiter({ maxRequests: 60, windowMs: 60_000 }));

// 5. Cross-Origin Resource Sharing (CORS) across the 3 portals and local development
app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowedOrigins = [
        'https://tpfcinemas.com',
        'https://studio.tpfcinemas.com',
        'https://staff.tpfcinemas.com',
        'http://localhost:3000',
        'http://localhost:4321',
        'http://localhost:5173',
      ];
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.tpfcinemas.com')) {
        return origin || '*';
      }
      return null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-webhook-secret'],
    exposeHeaders: ['Content-Length', 'Retry-After'],
    maxAge: 86400,
    credentials: true,
  })
);

// 6. Mount Subroutes
app.route('/health', healthRouter);
app.route('/api/uploads', uploadsRouter);
app.route('/api/webhooks', webhooksRouter);
app.route('/api/cache', cacheRouter);
app.route('/api/films', filmsRouter);

// 7. Fallback 404 Route
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${c.req.method} ${c.req.path} not found on this server`,
      },
    },
    404
  );
});

// 8. Global Error Handler
app.onError(errorHandler);

export default app;
