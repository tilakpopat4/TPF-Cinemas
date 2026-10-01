import { Hono } from 'hono';
import { Bindings } from '../env';
import { getAdminClient } from '../services/supabase';
import { purgeEdgeCache } from '../services/cloudflare-cache';
import { sendEmail, EmailTemplates } from '../services/email';
import { SupabaseWebhookPayload, FilmWebhookRecord, FilmReviewWebhookRecord } from '../types/api';

export const webhooksRouter = new Hono<{ Bindings: Bindings }>();

function constantTimeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const aLen = a.length;
  const bLen = b.length;
  let result = aLen ^ bLen;
  for (let i = 0; i < aLen; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i % (bLen || 1));
  }
  return result === 0;
}

/**
 * POST /api/webhooks/supabase
 * Listens for Supabase database webhooks on `films` and `film_reviews`
 */
webhooksRouter.post('/supabase', async (c) => {
  // Validate webhook secret header with constant-time comparison
  const providedSecret = c.req.header('x-webhook-secret');
  if (!providedSecret || !constantTimeEqual(providedSecret, c.env.WEBHOOK_SECRET)) {
    return c.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid webhook secret' } },
      401
    );
  }

  const payload = await c.req.json<SupabaseWebhookPayload<Record<string, unknown>>>();
  const supabase = getAdminClient(c.env);

  // 1. Film updates (published, archived)
  if (payload.table === 'films') {
    const film = payload.record as unknown as FilmWebhookRecord;
    const oldFilm = payload.old_record as unknown as FilmWebhookRecord | null;

    // A. Film Published
    if (film.status === 'published' && oldFilm?.status !== 'published') {
      console.log(`[Webhook] Film published: "${film.title}" (${film.id}). Purging cache and notifying filmmaker.`);

      // Purge edge cache immediately
      c.executionCtx.waitUntil(
        purgeEdgeCache(c.env, {
          urls: [
            'https://tpfcinemas.com/',
            'https://tpfcinemas.com/films',
            `https://tpfcinemas.com/film/${film.slug}`,
          ],
        })
      );

      // Look up filmmaker email to send notification
      c.executionCtx.waitUntil(
        (async () => {
          const { data: userData } = await supabase.auth.admin.getUserById(film.filmmaker_id);
          if (userData?.user?.email) {
            const tmpl = EmailTemplates.filmPublished(film.title, film.slug);
            await sendEmail(c.env, {
              to: userData.user.email,
              subject: tmpl.subject,
              html: tmpl.html,
            });
          }
        })()
      );
    }

    // B. Film Takedown / Archived
    if (film.status === 'archived' && oldFilm?.status !== 'archived') {
      console.log(`[Webhook] Film archived: "${film.title}" (${film.id}). Purging edge cache.`);
      c.executionCtx.waitUntil(
        purgeEdgeCache(c.env, {
          urls: [
            'https://tpfcinemas.com/',
            'https://tpfcinemas.com/films',
            `https://tpfcinemas.com/film/${film.slug}`,
          ],
        })
      );
    }
  }

  // 2. Film Reviews (Curator decisions)
  if (payload.table === 'film_reviews' && payload.type === 'INSERT') {
    const review = payload.record as unknown as FilmReviewWebhookRecord;
    console.log(`[Webhook] New review recorded for film ${review.film_id}: decision=${review.decision}`);

    c.executionCtx.waitUntil(
      (async () => {
        // Fetch film and filmmaker profile
        const { data: filmData } = await supabase
          .from('films')
          .select('title, filmmaker_id')
          .eq('id', review.film_id)
          .maybeSingle();

        const film = filmData as { title: string; filmmaker_id: string } | null;
        if (!film) return;

        const { data: userData } = await supabase.auth.admin.getUserById(film.filmmaker_id);
        if (!userData?.user?.email) return;

        let emailContent: { subject: string; html: string } | null = null;
        if (review.decision === 'approved') {
          emailContent = EmailTemplates.filmApproved(film.title);
        } else if (review.decision === 'changes_requested') {
          emailContent = EmailTemplates.changesRequested(film.title, review.notes ?? 'Please review your submission.');
        } else if (review.decision === 'rejected') {
          emailContent = EmailTemplates.filmRejected(film.title, review.notes ?? 'Submission did not meet curation criteria.');
        }

        if (emailContent) {
          await sendEmail(c.env, {
            to: userData.user.email,
            subject: emailContent.subject,
            html: emailContent.html,
          });
        }
      })()
    );
  }

  return c.json({ success: true, message: 'Webhook processed' });
});

/**
 * POST /api/webhooks/mux
 * Video provider webhook placeholder (Phase 2)
 */
webhooksRouter.post('/mux', (c) => {
  return c.json(
    {
      error: 'Not Implemented',
      message: 'Mux webhook integration not implemented pending video provider selection',
    },
    501
  );
});
