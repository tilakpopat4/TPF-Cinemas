# Codebase Structure

**Analysis Date:** 2026-10-01

## Directory Layout

```
TPF_Cinemas/
├── apps/                        # Frontend web applications (monorepo workspaces)
│   ├── studio/                  # Filmmaker Studio SPA (Vite + React + Tailwind)
│   │   ├── src/
│   │   │   ├── components/      # UI components (auth, dashboard, editor, layout)
│   │   │   ├── hooks/           # Data hooks (useAuth, useFilms, useGenres)
│   │   │   ├── lib/             # Utilities and Supabase client
│   │   │   └── types/           # Studio domain types
│   │   └── package.json
│   ├── staff/                   # Staff Console SPA (Vite + React + Tailwind)
│   │   ├── src/
│   │   │   ├── components/      # UI components (admin, auth, layout, queue)
│   │   │   ├── hooks/           # Queue & audit hooks (useAuditLog, useReviewQueue)
│   │   │   ├── lib/             # Supabase client and motion helpers
│   │   │   └── types/           # Staff domain types
│   │   └── package.json
│   └── viewer/                  # Consumer OTT Viewer SPA (Vite + React + Tailwind)
│       ├── src/
│       │   ├── components/      # UI components (hero, catalog, player, comments)
│       │   ├── hooks/           # Catalog & state hooks (useCatalogue, useWatchlist)
│       │   ├── lib/             # Supabase client and motion helpers
│       │   └── types/           # Viewer domain types
│       └── package.json
├── backend/                     # Cloudflare Workers Edge API (Hono)
│   ├── src/
│   │   ├── middleware/          # Auth, CORS, error handling, rate limiting
│   │   ├── routes/              # HTTP routers (uploads, webhooks, cache, films, health)
│   │   ├── services/            # Cloudflare cache, Resend email, Supabase clients
│   │   ├── types/               # API contract types and database interfaces
│   │   ├── env.ts               # Zod-validated environment bindings
│   │   └── index.ts             # Edge Worker application entry point
│   ├── wrangler.jsonc           # Cloudflare Workers configuration
│   └── package.json
├── supabase/                    # Supabase database configuration & migrations
│   ├── migrations/              # Incremental SQL migration scripts
│   │   ├── 20260920000001_init_schema.sql
│   │   └── 20260930000001_review_film_audit_log.sql
│   ├── tests/                   # SQL test suites (pgTAP / transaction test scripts)
│   │   └── loop1_rls_and_rpc_tests.sql
│   └── seed.sql                 # Development database seed script
├── tests/                       # Integration test suites
│   └── loop1-webhook-and-env.test.mjs
├── .planning/                   # GSD planning directory
│   └── codebase/                # Codebase knowledge map artifacts
├── package.json                 # Monorepo root workspace configuration
└── package-lock.json
```

## Directory Purposes

**`backend/`:**
- Purpose: Cloudflare Workers edge API for secure backend tasks.
- Contains: TypeScript edge logic, Hono routers, middlewares, and service adapters.
- Key files: `backend/src/index.ts`, `backend/src/env.ts`, `backend/wrangler.jsonc`.

**`apps/studio/`:**
- Purpose: Filmmaker portal for submitting films, uploading assets, and managing licences.
- Contains: React components for multi-step submission editor and dashboard.
- Key files: `apps/studio/src/App.tsx`, `apps/studio/src/components/editor/FilmEditorModal.tsx`.

**`apps/staff/`:**
- Purpose: Curator and Admin console for moderation, audit trail, and user role management.
- Contains: Queue review tables, decision modals with required feedback, and role editors.
- Key files: `apps/staff/src/App.tsx`, `apps/staff/src/components/queue/ReviewModal.tsx`.

**`apps/viewer/`:**
- Purpose: Public OTT streaming viewer interface.
- Contains: Hero billboard, horizontal genre rails, video playback modal, and watchlist.
- Key files: `apps/viewer/src/App.tsx`, `apps/viewer/src/components/player/WatchModal.tsx`.

**`supabase/`:**
- Purpose: Database schemas, migrations, test suites, and seed data.
- Contains: SQL migrations and transactional verification scripts.
- Key files: `supabase/migrations/20260920000001_init_schema.sql`, `supabase/tests/loop1_rls_and_rpc_tests.sql`.

## Key File Locations

**Entry Points:**
- `backend/src/index.ts`: Edge Worker root request router.
- `apps/viewer/src/main.tsx`: Viewer frontend entry point.
- `apps/studio/src/main.tsx`: Filmmaker Studio frontend entry point.
- `apps/staff/src/main.tsx`: Staff Console frontend entry point.

**Configuration:**
- `package.json`: Monorepo root workspace definition.
- `backend/wrangler.jsonc`: Cloudflare Workers deployment config.
- `backend/src/env.ts`: Strict environment schema parsing.
- `apps/*/vite.config.ts`: Frontend bundler configs.

**Core Logic & Services:**
- `backend/src/routes/webhooks.ts`: Webhook verification and cache purge dispatch.
- `backend/src/routes/uploads.ts`: Signed URL generation for storage buckets.
- `backend/src/services/cloudflare-cache.ts`: Cloudflare edge cache purging.
- `backend/src/services/supabase.ts`: Supabase service role client initialization.

**Testing:**
- `tests/loop1-webhook-and-env.test.mjs`: Node.js test script for backend environment and webhooks.
- `supabase/tests/loop1_rls_and_rpc_tests.sql`: SQL transaction test script validating RLS and RPC constraints.

## Naming Conventions

**Files:**
- React components: PascalCase (e.g. `apps/viewer/src/components/catalog/FilmCard.tsx`).
- React hooks: camelCase starting with `use` (e.g. `apps/viewer/src/hooks/useCatalogue.ts`).
- Backend routes & services: kebab-case (e.g. `backend/src/routes/webhooks.ts`, `backend/src/services/cloudflare-cache.ts`).
- Migrations: Timestamped snake_case (e.g. `supabase/migrations/20260920000001_init_schema.sql`).

**Directories:**
- Frontend components: kebab-case categorization (e.g. `apps/viewer/src/components/catalog/`, `apps/viewer/src/components/player/`).
- Monorepo packages: lowercase names (e.g. `backend`, `apps/viewer`, `apps/studio`, `apps/staff`).

## Where to Add New Code

**New Feature in Viewer Portal:**
- Implementation: Add components in `apps/viewer/src/components/<category>/` and hooks in `apps/viewer/src/hooks/`.
- Types: Update `apps/viewer/src/types/index.ts`.

**New Backend API Endpoint:**
- Router: Add new file in `backend/src/routes/<name>.ts`.
- Mount: Register route in `backend/src/index.ts`.
- Types: Update `backend/src/types/api.ts`.

**Database Schema Change:**
- Migration: Create new migration in `supabase/migrations/<timestamp>_<feature>.sql`.
- Testing: Add corresponding SQL test cases to `supabase/tests/`.

**Shared Types / Constants:**
- Update `backend/src/types/database.ts` or corresponding app types.

## Special Directories

**`.planning/`:**
- Purpose: GSD spec, roadmap, state, and codebase map repository.
- Generated: Managed by GSD workflows.
- Committed: Yes.

**`backend/dist/` & `apps/*/dist/`:**
- Purpose: Compiled production build assets.
- Generated: Yes.
- Committed: No (in `.gitignore`).

---

*Structure analysis: 2026-10-01*
