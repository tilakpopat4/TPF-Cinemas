# External Integrations

**Analysis Date:** 2026-10-01

## APIs & External Services

**Video Hosting & Streaming:**
- YouTube Embeds (Phase 1) - Zero-cost video playback streamed directly from YouTube CDN via player iframe (`apps/viewer/src/components/player/WatchModal.tsx`).
- Mux Video (Phase 2 Roadmap) - Direct upload URLs for master video files, adaptive HLS video streaming, and playback analytics.

**Transactional Email:**
- Resend / Transactional Email Provider - Automated notification delivery to filmmakers on review status change (`changes_requested`, `approved`, `rejected`) and publishing (`backend/src/services/email.ts`).
  - SDK/Client: REST API / Fetch client via Resend endpoint
  - Auth: `RESEND_API_KEY` environment variable
  - Config: `EMAIL_FROM` default: `TPF Cinemas <notifications@tpfcinemas.com>`

**CDN & Edge Cache Purging:**
- Cloudflare Zone API - Automated edge cache invalidation when films are published, updated, or taken down (`backend/src/services/cloudflare-cache.ts`).
  - Auth: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID`
  - Purge Targets: `https://tpfcinemas.com/`, `https://tpfcinemas.com/films`, and individual slug pages `https://tpfcinemas.com/film/:slug`.

## Data Storage

**Databases:**
- Supabase Managed PostgreSQL 15+ (Mumbai, `ap-south-1` region)
  - Connection: `SUPABASE_URL`
  - Public / RLS Client: `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY`
  - Service Role Client: `SUPABASE_SERVICE_ROLE_KEY` (used strictly in backend edge API `backend/src/services/supabase.ts`, strictly prohibited in browser clients)
  - Database schema and migrations: `supabase/migrations/20260920000001_init_schema.sql` and `supabase/migrations/20260930000001_review_film_audit_log.sql`.

**File Storage:**
- Supabase Storage `posters` bucket - Public storage for film posters and banner backdrops (enforces 5MB max size and image/jpeg, image/png, image/webp MIME types via `backend/src/routes/uploads.ts`).
- Supabase Storage `licences` bucket - Private storage for signed filmmaker licence PDFs and documentation (enforces 10MB max size, restricted access via RLS).
- Cloudflare R2 (Planned for Phase 2) - S3-compatible zero-egress object storage for multi-resolution WebP images.

**Caching:**
- Cloudflare Edge Cache - CDN caching for public catalog and film detail pages (`backend/src/routes/cache.ts`).
- In-Memory Rate Limiting - Edge rate limiter implemented per client IP (`backend/src/middleware/rate-limiter.ts`).

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (GoTrue)
  - Implementation: Email/password authentication, JWT verification, and cross-subdomain cookie sharing across `.tpfcinemas.com`.
  - Roles & Authorization: Handled via `public.profiles.role` (`viewer`, `filmmaker`, `curator`, `admin`).
  - Client Hooks:
    - `apps/viewer/src/hooks/useViewerAuth.ts`
    - `apps/studio/src/hooks/useAuth.ts`
    - `apps/staff/src/hooks/useStaffAuth.ts`

## Monitoring & Observability

**Error Tracking:**
- Structured error handler middleware in backend API (`backend/src/middleware/error-handler.ts`).
- Sentry (Planned for Phase 2 growth).

**Logs:**
- Hono edge logger middleware (`backend/src/index.ts`).
- PostgreSQL audit log table: `public.audit_logs` tracking sensitive administrative actions, role modifications, and review decisions (`supabase/migrations/20260930000001_review_film_audit_log.sql`, `apps/staff/src/hooks/useAuditLog.ts`).

## CI/CD & Deployment

**Hosting:**
- Cloudflare Workers - Serverless Edge API deployment via `wrangler deploy` (`backend/wrangler.jsonc`).
- Cloudflare Pages / Static Edge - Web applications deployment for `apps/viewer`, `apps/studio`, and `apps/staff`.

**CI Pipeline:**
- NPM scripts for monorepo typechecking and builds (`package.json`, `npm run build:backend`, `npm run build:studio`, `npm run build:staff`, `npm run build:viewer`).
- Database verification test scripts: `tests/loop1-webhook-and-env.test.mjs`, `supabase/tests/loop1_rls_and_rpc_tests.sql`.

## Environment Configuration

**Required env vars:**
- `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` / `VITE_SUPABASE_URL`
- `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Backend only)
- `WEBHOOK_SECRET` (Backend only, required for webhook integrity)
- `CLOUDFLARE_ZONE_ID` & `CLOUDFLARE_API_TOKEN` (Backend only, cache purging)
- `RESEND_API_KEY` (Backend only, email notifications)

**Secrets location:**
- Local development: `backend/.dev.vars` for Cloudflare Workers; `.env` for frontend apps.
- Production: Cloudflare Workers Secrets (`wrangler secret put <KEY>`).

## Webhooks & Callbacks

**Incoming:**
- `POST /api/webhooks/supabase` (`backend/src/routes/webhooks.ts`)
  - Listens for Supabase database triggers on `films` (e.g. status transition to `published` or `archived`) and `film_reviews`.
  - Verifies incoming request integrity via constant-time comparison of `x-webhook-secret` against `WEBHOOK_SECRET`.
  - Triggers edge cache purge (`purgeEdgeCache`) and dispatches notification emails (`sendEmail`).

**Outgoing:**
- Cloudflare API Cache Purge Endpoint (`https://api.cloudflare.com/client/v4/zones/:zone_id/purge_cache`).
- Resend API Email Dispatch (`https://api.resend.com/emails`).

---

*Integration audit: 2026-10-01*
