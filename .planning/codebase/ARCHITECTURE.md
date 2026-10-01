<!-- refreshed: 2026-10-01 -->
# Architecture

**Analysis Date:** 2026-10-01

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER                                    │
├───────────────────────┬─────────────────────────┬───────────────────────────┤
│     Viewer Portal     │    Filmmaker Studio     │       Staff Console       │
│  `apps/viewer/src`    │   `apps/studio/src`     │     `apps/staff/src`      │
│  (Browse, Watch,      │   (Drafts, Uploads,     │   (Review Queue, Audits,  │
│   Watchlist, History) │    Licence, Submissions)│    Publish, User Roles)   │
└───────────┬───────────┴────────────┬────────────┴─────────────┬─────────────┘
            │                        │                          │
            │ (Direct RLS Reads)     │ (Signed URL Requests)    │ (Admin Actions)
            ▼                        ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE WORKERS EDGE API (HONO)                       │
│                           `backend/src/index.ts`                            │
│  - Middleware: CORS, Rate Limiter, Error Handler, Env Validator             │
│  - Routes: /api/uploads, /api/webhooks, /api/cache, /api/films, /health      │
│  - Services: Cloudflare Cache Purging, Resend Email Dispatch                │
└───────────┬────────────────────────┬──────────────────────────┬─────────────┘
            │                        │                          │
            │ (Webhook Invalidation) │ (Service Role Actions)   │ (DB Triggers)
            ▼                        ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│               SUPABASE (PostgreSQL 15+, Mumbai ap-south-1)                  │
│                      `supabase/migrations/*.sql`                            │
│  - Auth (Profiles, Roles: viewer, filmmaker, curator, admin)                │
│  - Storage Buckets (posters, private licences)                              │
│  - Security Definer Functions (submit_film, review_film, publish_film, etc.) │
│  - Audit Logs & Row-Level Security (RLS) Policies                           │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼ (Video Playback stream - direct from host CDN)
┌─────────────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL VIDEO DELIVERY CDN                             │
│                  YouTube Iframe / Mux HLS Streaming                         │
│           (Zero video bytes pass through Worker or Database)                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Edge API Worker | Routing, rate limiting, upload URL signing, webhooks, and cache purge | `backend/src/index.ts` |
| Uploads Router | Validates file size/type and generates signed Supabase storage upload URLs | `backend/src/routes/uploads.ts` |
| Webhooks Router | Handles Supabase database change webhooks, purges edge cache, sends emails | `backend/src/routes/webhooks.ts` |
| Cache Service | Cloudflare CDN zone purging for updated catalog items and films | `backend/src/services/cloudflare-cache.ts` |
| Viewer App | Public catalog display, hero banner, content rails, video player modal, watchlist | `apps/viewer/src/App.tsx` |
| Studio App | Filmmaker onboarding, multi-step film editor, licence signing, draft management | `apps/studio/src/App.tsx` |
| Staff App | Curator review queue, moderation decisions with mandatory feedback, audit trail | `apps/staff/src/App.tsx` |
| Database Schema | Tables, enums, triggers, RLS policies, and core workflow RPC procedures | `supabase/migrations/20260920000001_init_schema.sql` |
| Review & Audit RPC | Enforces curator review constraints, feedback notes, and audit log entries | `supabase/migrations/20260930000001_review_film_audit_log.sql` |

## Pattern Overview

**Overall:** 3-Tier Edge + Jamstack Monorepo Architecture with Database-Enforced Security.

**Key Characteristics:**
- **Decoupled Client Portals:** Three separate SPAs (`viewer`, `studio`, `staff`) sharing design language, database types, and Supabase client patterns, but building into isolated deployable artifacts.
- **Three-Layer Access Control:**
  1. Postgres Roles: `anon`, `authenticated`, `service_role`.
  2. Application Roles: `viewer`, `filmmaker`, `curator`, `admin` stored in `profiles.role`.
  3. Security Definer RPC Functions: Status transitions (`submitted`, `approved`, `published`, `archived`) and role mutations are restricted from direct SQL updates and only permitted via transactional procedures.
- **Offloaded Heavy Compute & Bandwidth:** Video streaming is 100% offloaded to YouTube/Mux CDNs; public catalog pages are edge-cached on Cloudflare CDN.

## Layers

**Client Layer (`apps/*`):**
- Purpose: Delivers responsive, role-specific user interfaces for viewers, creators, and staff.
- Location: `apps/viewer`, `apps/studio`, `apps/staff`.
- Contains: React components, custom React hooks, Tailwind CSS styles, and Lucide icons.
- Depends on: `@supabase/supabase-js` client library.

**Edge API Layer (`backend/*`):**
- Purpose: Server-side gateway for tasks requiring secret credentials and edge coordination.
- Location: `backend/src`.
- Contains: Hono framework routes, authentication/rate-limiting middlewares, and external service drivers.
- Depends on: Cloudflare Workers runtime and Supabase Service Role client.

**Data & Persistence Layer (`supabase/*`):**
- Purpose: Canonical source of truth for user profiles, films, genres, licences, reviews, comments, and audit logs.
- Location: `supabase/migrations`.
- Contains: PostgreSQL DDL, Row-Level Security policies, and PL/pgSQL functions.

## Data Flow

### 1. Film Submission Flow
1. Filmmaker enters metadata, credits, and upload details in `apps/studio/src/components/editor/FilmEditorModal.tsx`.
2. Poster image upload requests signed upload URL via `POST /api/uploads/poster-url` (`backend/src/routes/uploads.ts`).
3. Filmmaker signs licence agreement (storing licence record in `licence_agreements` table).
4. Studio calls PostgreSQL RPC `submit_film(p_film_id)` which verifies video link, poster URL, and licence existence, setting status to `submitted`.

### 2. Film Review & Publishing Flow
1. Staff curator views pending submissions in `apps/staff/src/components/queue/QueueTable.tsx`.
2. Curator calls RPC `review_film(p_film_id, p_decision, p_notes)` (`supabase/migrations/20260930000001_review_film_audit_log.sql`). If decision is not approved, feedback notes are required.
3. Once approved and verified via `verify_licence()`, admin/curator invokes `publish_film(p_film_id)`.
4. Supabase database webhook fires on status update to `POST /api/webhooks/supabase` (`backend/src/routes/webhooks.ts`).
5. Webhook handler immediately triggers `purgeEdgeCache` for `tpfcinemas.com` URLs and dispatches publication email to filmmaker via `sendEmail`.

### 3. Viewer Playback Flow
1. Viewer loads catalog from `apps/viewer/src/hooks/useCatalogue.ts`.
2. Clicking a film card opens `apps/viewer/src/components/player/WatchModal.tsx`.
3. Modal mounts YouTube / video embed iframe streaming directly from video host CDN.
4. Watch progress is recorded periodically via `useWatchHistory.ts` in `watch_history` table.

## Entry Points

**Backend Edge API:**
- Location: `backend/src/index.ts`
- Triggers: HTTP requests dispatched to Cloudflare Workers runtime.
- Responsibilities: Validates environment bindings, applies rate limiting and CORS, and dispatches to subrouters.

**Viewer Portal:**
- Location: `apps/viewer/src/main.tsx` (mounting `App.tsx`)
- Triggers: Browser page load on `tpfcinemas.com` (or local port 5175).
- Responsibilities: Loads public film catalogue, manages user session, renders hero and rails.

**Studio Portal:**
- Location: `apps/studio/src/main.tsx` (mounting `App.tsx`)
- Triggers: Browser page load on `studio.tpfcinemas.com` (or local port 5173).
- Responsibilities: Authenticates filmmaker, manages film submissions and drafts.

**Staff Console:**
- Location: `apps/staff/src/main.tsx` (mounting `App.tsx`)
- Triggers: Browser page load on `staff.tpfcinemas.com`.
- Responsibilities: Authenticates staff/curators, renders review queue, role management, and audit log.

## Architectural Constraints

- **Zero Video Egress:** No video chunks or media files may pass through Cloudflare Workers or PostgreSQL database.
- **Service Role Isolation:** The `SUPABASE_SERVICE_ROLE_KEY` must never be referenced, imported, or bundled into any frontend application in `apps/`.
- **Stateless Edge Execution:** Cloudflare Workers backend must remain completely stateless, relying on Supabase for persistent state and Cloudflare Cache API for caching.
- **Immutable Status Transitions:** Direct SQL `UPDATE films SET status = 'published'` is denied by column-level grants and RLS; all transitions must flow through authorized RPC functions.

## Anti-Patterns

### Bypassing Workflow Functions with Direct Table Updates
**What happens:** Attempting to update `films.status` directly via Supabase client `.from('films').update({ status: 'published' })`.
**Why it's wrong:** Violates column grants and fails audit log / state machine checks.
**Do this instead:** Call the respective RPC procedure, e.g., `supabase.rpc('publish_film', { p_film_id: id })`.

### Client-Side Secret Role Usage
**What happens:** Using service role key in frontend `.env` to bypass RLS policies.
**Why it's wrong:** Exposes administrative access to any client inspecting network requests or bundle code.
**Do this instead:** Keep service role key strictly in `backend/src/services/supabase.ts` and authenticate clients via user JWT tokens.

## Error Handling

**Strategy:** Fail-fast environment validation with typed API error responses and database error propagation.

**Patterns:**
- Centralized error handler in `backend/src/middleware/error-handler.ts` wrapping errors in standard `{ success: false, error: { code, message } }` format.
- PostgreSQL exceptions (`raise exception ... using errcode = '42501'`) returning structured error strings to client RPC calls.

---

*Architecture analysis: 2026-10-01*
