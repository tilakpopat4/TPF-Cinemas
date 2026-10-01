import { Hono } from 'hono';
import { Bindings } from '../env';
import { getAdminClient } from '../services/supabase';

export const healthRouter = new Hono<{ Bindings: Bindings }>();

healthRouter.get('/', async (c) => {
  const startTime = Date.now();
  let dbStatus = 'disconnected';

  try {
    const supabase = getAdminClient(c.env);
    const { error } = await supabase.from('genres').select('count', { count: 'exact', head: true });
    if (!error) {
      dbStatus = 'connected';
    }
  } catch (err) {
    console.error('[Health Check] DB ping failed:', err);
  }

  const latencyMs = Date.now() - startTime;

  return c.json({
    status: 'ok',
    environment: c.env.ENVIRONMENT,
    database: dbStatus,
    latencyMs,
    timestamp: new Date().toISOString(),
  });
});
