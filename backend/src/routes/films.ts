import { Hono } from 'hono';
import { Bindings } from '../env';
import { getAdminClient } from '../services/supabase';

export const filmsRouter = new Hono<{ Bindings: Bindings }>();

/**
 * GET /api/films/catalogue
 * Fetches published films, featured hero film, and all genres in a single request.
 * Sets Cache-Control headers for Cloudflare Edge caching.
 */
filmsRouter.get('/catalogue', async (c) => {
  const supabase = getAdminClient(c.env);

  // Fetch featured film, recent published films, and active genres in parallel
  const [featuredResult, filmsResult, genresResult] = await Promise.all([
    supabase
      .from('films')
      .select('id, title, slug, synopsis, runtime_minutes, language, release_year, age_rating, poster_url, video_provider, video_ref, is_debut, published_at')
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from('films')
      .select(`
        id, title, slug, synopsis, runtime_minutes, language, release_year, age_rating,
        poster_url, video_provider, is_debut, is_featured, published_at,
        film_genres (
          genre_id,
          genres (id, name, slug)
        )
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50),

    supabase.from('genres').select('id, name, slug').order('name', { ascending: true }),
  ]);

  if (filmsResult.error) {
    return c.json(
      { success: false, error: { code: 'FETCH_FAILED', message: filmsResult.error.message } },
      500
    );
  }

  // Edge cache: 1 hour max-age, stale-while-revalidate 1 day
  c.header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
  c.header('CDN-Cache-Control', 'max-age=86400');

  return c.json({
    success: true,
    data: {
      featured: featuredResult.data,
      films: filmsResult.data,
      genres: genresResult.data ?? [],
    },
  });
});

/**
 * GET /api/films/:slug
 * Fetches single published film details including genres and credits.
 */
filmsRouter.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const supabase = getAdminClient(c.env);

  const { data: film, error } = await supabase
    .from('films')
    .select(`
      id, title, slug, synopsis, director_note, runtime_minutes, language,
      release_year, age_rating, poster_url, video_provider, video_ref,
      is_debut, published_at,
      film_genres (
        genres (id, name, slug)
      ),
      film_credits (
        id, person_name, credit_role, sort_order
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    return c.json({ success: false, error: { code: 'FETCH_FAILED', message: error.message } }, 500);
  }

  if (!film) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Film not found' } }, 404);
  }

  c.header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');

  return c.json({
    success: true,
    data: film,
  });
});
