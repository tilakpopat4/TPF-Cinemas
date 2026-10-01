# Coding Conventions

**Analysis Date:** 2026-10-01

## Naming Patterns

**Files:**
- React components: PascalCase matching the default export name (e.g. `apps/viewer/src/components/catalog/FilmCard.tsx`, `apps/studio/src/components/editor/FilmEditorModal.tsx`).
- React custom hooks: camelCase prefixed with `use` (e.g. `apps/viewer/src/hooks/useCatalogue.ts`, `apps/staff/src/hooks/useReviewQueue.ts`).
- Backend routes and services: kebab-case (e.g. `backend/src/routes/webhooks.ts`, `backend/src/services/cloudflare-cache.ts`).
- Database migrations: Timestamped snake_case (e.g. `supabase/migrations/20260920000001_init_schema.sql`).

**Functions:**
- camelCase for TypeScript/JavaScript functions and methods (e.g. `validateEnv`, `purgeEdgeCache`, `constantTimeEqual`, `recordProgress`).
- snake_case for PostgreSQL functions and triggers (e.g. `submit_film`, `review_film`, `publish_film`, `log_action`, `is_staff`).

**Variables & Constants:**
- camelCase for local variables, parameters, and hook state (e.g. `activeWatchFilm`, `providedSecret`, `isFilmmakerOrAdmin`).
- UPPER_SNAKE_CASE for environment variables and configuration constants (e.g. `SUPABASE_SERVICE_ROLE_KEY`, `WEBHOOK_SECRET`, `EMAIL_FROM`).

**Types & Interfaces:**
- PascalCase for TypeScript interfaces, types, and Zod schemas (e.g. `Film`, `Profile`, `ReviewDecision`, `Bindings`, `EnvSchema`).
- PostgreSQL enums: snake_case (e.g. `public.app_role`, `public.film_status`, `public.review_decision`).

## Code Style

**Formatting & Syntax:**
- 2-space indentation with trailing commas where valid in JSON and TypeScript.
- Explicit typing on public API signatures and hook return values.
- Direct object destructuring in component and function parameter lists.

**Type Safety:**
- TypeScript strict mode enforced across all projects (`"strict": true` in `tsconfig.json`).
- Input validation at edge boundaries using Zod (`@hono/zod-validator` in `backend/src/routes/uploads.ts` and `backend/src/env.ts`).

## Import Organization

**Order:**
1. External core libraries (e.g. `react`, `hono`, `motion/react`, `lucide-react`).
2. Internal middlewares, hooks, and services (e.g. `../middleware/auth`, `./hooks/useViewerAuth`).
3. Components and UI widgets (e.g. `./components/catalog/FilmCard`).
4. Types and interfaces (e.g. `./types`, `../types/api`).

**Path Aliases:**
- Relative imports (`../`, `./`) are standard across `backend/src` and `apps/*/src`.

## Error Handling

**Edge API (Hono):**
- Centralized error response format returning HTTP status with `{ success: false, error: { code, message } }`.
- Early guard returns for authorization, missing parameters, and invalid schemas (`backend/src/middleware/error-handler.ts`).
- Timing attack mitigation: Constant-time byte-level string comparison (`constantTimeEqual` in `backend/src/routes/webhooks.ts`).

**Database (PostgreSQL):**
- Strict exception raising with SQL standard error codes (`raise exception 'Curators only' using errcode = '42501'`).
- Row locking (`select * into f from public.films where id = p_film_id for update`) to prevent race conditions during review transitions.

**Client Portals (React):**
- Custom hooks encapsulate error states (`error`, `loading`) and return them to view components.
- User feedback displayed in modal alerts or inline notifications.

## Logging

**Framework:**
- Edge API: Hono `logger()` middleware and targeted `console.log` / `console.error` with bracketed prefixes (e.g. `[Webhook] Film published: "..."`, `[Env Error]`).
- Database: Persistent audit trail via `public.log_action()` recording user ID, action name, target type, target ID, and JSON payload in `public.audit_logs`.

## Design System & Styling

**Aesthetics:**
- Dark-mode first cinematic color palette:
  - Viewer: `#08090c` background, zinc typography, amber-500 accents.
  - Studio: `#090b10` background, slate typography, rose-500 accents.
  - Staff: `#07090e` background, slate typography, amber-500 badge accents.
- Modern CSS layout using Tailwind CSS utility classes and flexbox/grid layouts.
- Micro-interactions powered by `motion/react` (subtle hover scales, modal fade/slide animations).

---

*Convention analysis: 2026-10-01*
