# Technology Stack

**Analysis Date:** 2026-10-01

## Languages

**Primary:**
- TypeScript 5.8.2 - All backend edge logic (`backend/src/**/*.ts`) and frontend portal application code (`apps/studio/src/**/*.tsx`, `apps/staff/src/**/*.tsx`, `apps/viewer/src/**/*.tsx`).

**Secondary:**
- SQL (PostgreSQL 15+) - Database schemas, triggers, RLS policies, security definer RPC functions, and migrations in `supabase/migrations/20260920000001_init_schema.sql` and `supabase/migrations/20260930000001_review_film_audit_log.sql`.
- JavaScript (Node.js ESM) - Test runners and configuration files (`tests/loop1-webhook-and-env.test.mjs`, `apps/*/vite.config.ts`, `apps/*/tailwind.config.js`).

## Runtime

**Environment:**
- Backend API: Cloudflare Workers serverless edge runtime (`backend/wrangler.jsonc`), utilizing `@cloudflare/workers-types` v4.20250224.0.
- Frontend Client Apps: Modern web browser ECMAScript 2022+ execution.
- Testing & Tooling: Node.js (v20+ recommended).

**Package Manager:**
- npm 10.x with npm workspaces (`package.json` defines monorepo workspaces: `backend`, `apps/studio`, `apps/staff`, `apps/viewer`).
- Lockfile: `package-lock.json` present at root and in workspace directories.

## Frameworks

**Core:**
- Hono 4.7.4 (`backend/package.json`) - Ultra-fast, lightweight web framework designed for Cloudflare Workers edge execution.
- React 18.3.1 (`apps/studio/package.json`, `apps/staff/package.json`, `apps/viewer/package.json`) - Declarative UI framework powering all three user-facing web portals.

**Styling & UI:**
- Tailwind CSS 3.4.17 with PostCSS 8.5.3 and Autoprefixer 10.4.20 across all frontend apps.
- Motion 13.4.6 (`motion/react`) - Physics-based fluid animations and transitions for modals, hero billboards, and cards.
- Lucide React (v0.477.0 / v1.16.0) - Comprehensive SVG icon suite.
- clsx 2.1.1 and tailwind-merge 3.0.2 - Dynamic utility class composition.

**Build / Dev Tooling:**
- Vite 6.2.0 (`@vitejs/plugin-react` 4.3.4) - Fast HMR dev server and production asset bundler for frontends.
- Wrangler 3.114.0 - Cloudflare Workers local simulator (`wrangler dev`), deployment (`wrangler deploy`), and type generator.
- TypeScript Compiler 5.8.2 (`tsc --noEmit`) - Static typechecking across monorepo packages.

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.49.1 - Universal Supabase client for authentication, PostgreSQL queries, storage bucket interactions, and realtime subscriptions (`backend/src/services/supabase.ts`, `apps/studio/src/lib/supabase.ts`, `apps/staff/src/lib/supabase.ts`, `apps/viewer/src/lib/supabase.ts`).
- `zod` 3.24.2 - Schema validation for runtime environment bindings (`backend/src/env.ts`), API input payloads (`backend/src/routes/uploads.ts`), and form validation.
- `@hono/zod-validator` 0.4.3 - Middleware connecting Zod schema validation to Hono request routes.

**Infrastructure & Middlewares:**
- `hono/cors` - Cross-Origin Resource Sharing handling for portal subdomains (`backend/src/index.ts`).
- `hono/secure-headers` - Automatic HTTP security response headers (`backend/src/index.ts`).
- `hono/logger` - Request logger middleware for edge requests.

## Configuration

**Environment:**
- Backend configuration: Validated via Zod `EnvSchema` in `backend/src/env.ts`. Fails fast on startup if `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `WEBHOOK_SECRET` are missing. Local secrets read from `backend/.dev.vars` (never committed).
- Frontend configuration: Vite environment variables (`.env`, `.env.example`) with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

**Build:**
- Root monorepo configuration: `package.json` with workspace execution scripts (`dev:backend`, `dev:studio`, `dev:staff`, `dev:viewer`).
- Edge configuration: `backend/wrangler.jsonc` defining worker name, compatibility date (`2024-09-23`), compatibility flags, and assets.
- TypeScript configs: `backend/tsconfig.json`, `apps/studio/tsconfig.json`, `apps/staff/tsconfig.json`, `apps/viewer/tsconfig.json`.

## Platform Requirements

**Development:**
- Node.js 20+ and npm 10+.
- Cloudflare Wrangler CLI for edge worker simulation.
- Supabase CLI or hosted Supabase project for database migrations and local testing.

**Production:**
- Backend API: Cloudflare Workers edge deployment (`wrangler deploy --minify`).
- Client Frontends: Cloudflare Pages or edge static hosting (`tpfcinemas.com`, `studio.tpfcinemas.com`, `staff.tpfcinemas.com`).
- Database & Auth: Supabase Managed Cloud (Mumbai `ap-south-1` region).
- Video Delivery: Third-party CDN hosting (YouTube iframe embeds in phase 1; Mux Stream / HLS in phase 2).

---

*Stack analysis: 2026-10-01*
*Update after major dependency changes*
