# Codebase Concerns

**Analysis Date:** 2026-10-01

## Tech Debt

**In-Memory Rate Limiting on Ephemeral Edge Workers:**
- Issue: `backend/src/middleware/rate-limiter.ts` maintains client rate counts in a local Node/JS `Map<string, RateLimitRecord>`.
- Files: `backend/src/middleware/rate-limiter.ts`, `backend/src/index.ts`
- Impact: Cloudflare Workers run across distributed worldwide PoPs with ephemeral isolate lifecycles. In-memory state is not shared across isolates or regions, allowing attackers to exceed rate limits by hitting different edge nodes or after isolate restarts.
- Fix approach: Transition to Cloudflare Native Rate Limiting, Cloudflare KV, or Upstash Redis for global rate-limit synchronization.

**Frontend Testing Infrastructure:**
- Issue: No automated unit or component test runner is configured for the three React apps (`apps/studio`, `apps/staff`, `apps/viewer`).
- Files: `apps/studio/package.json`, `apps/staff/package.json`, `apps/viewer/package.json`
- Impact: Regressions in complex multi-step submission flows (`FilmEditorModal.tsx`) or curator review modals (`ReviewModal.tsx`) may go undetected until runtime.
- Fix approach: Install Vitest and React Testing Library (`@testing-library/react`) in each frontend workspace with shared test utilities.

## Known Bugs & Edge Cases

**Supabase Free-Tier Auto-Pause:**
- Symptoms: Development and staging API requests fail with 500 errors after 7 days of inactivity due to paused Postgres instances.
- Files: `backend/src/services/supabase.ts`, `tpf_cinemas_architecture.md`
- Trigger: Inactive development periods.
- Workaround: Manually resume project in Supabase dashboard or deploy a scheduled heartbeat ping (e.g. Cloudflare Cron Trigger hitting `/health`).

## Security Considerations

**Service Role Key Protection:**
- Risk: Leaking the `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row-Level Security policies and grants unrestricted administrative read/write access.
- Files: `backend/src/env.ts`, `backend/src/services/supabase.ts`
- Current mitigation: Strict Zod validation in `backend/src/env.ts` ensuring `SUPABASE_SERVICE_ROLE_KEY` is never exposed, verified by tests in `tests/loop1-webhook-and-env.test.mjs`. Frontends only import `VITE_SUPABASE_ANON_KEY`.
- Recommendations: Ensure build scripts and bundler configs explicitly deny bundling server-side `.dev.vars` or service role keys into public static distributions.

**Webhook Secret Authentication:**
- Risk: Forged webhook calls triggering unwanted cache purges or unauthorized notification emails.
- Files: `backend/src/routes/webhooks.ts`
- Current mitigation: Constant-time string comparison (`constantTimeEqual`) validating `x-webhook-secret` header against `c.env.WEBHOOK_SECRET`.
- Recommendations: Add timestamp verification or HMAC payload signing if webhooks are expanded beyond internal Supabase triggers.

## Performance Bottlenecks

**Catalogue Database Hits under Traffic Spikes:**
- Problem: If edge cache invalidation triggers frequently or cache hit ratios drop, multiple viewers will execute direct database queries for film catalogues.
- Files: `apps/viewer/src/hooks/useCatalogue.ts`, `backend/src/routes/cache.ts`
- Cause: Client apps query Supabase directly via the JavaScript SDK for catalogue and genre data.
- Improvement path: Ensure public catalog requests are served through cached Cloudflare Worker routes or CDN endpoints with stale-while-revalidate headers.

## Fragile Areas

**Film Review & State Machine RPC Dependencies:**
- Files: `supabase/migrations/20260920000001_init_schema.sql`, `supabase/migrations/20260930000001_review_film_audit_log.sql`, `apps/staff/src/components/queue/DecisionBox.tsx`
- Why fragile: Status transitions (`draft` -> `submitted` -> `changes_requested`/`approved` -> `published`) have strict prerequisites (e.g. video URL, poster URL, licence declaration, feedback notes on rejection). Changing parameter types or adding columns requires synchronizing both SQL migration functions and client TypeScript callers.
- Safe modification: Always run `supabase/tests/loop1_rls_and_rpc_tests.sql` after modifying any PL/pgSQL function.

## Scaling Limits

**Video Streaming Dependency (YouTube Embeds):**
- Current capacity: Free tier via YouTube standard embed players.
- Limit: Commercial licensing restrictions, inability to enforce DRM, and lack of player customization for premium OTT branding.
- Scaling path: Implement Phase 2 roadmap architecture: direct video ingest to Mux with adaptive HLS video playback.

## Missing Critical Features

**Automated CI/CD Pipeline:**
- Problem: Monorepo lacks a `.github/workflows/ci.yml` workflow to validate builds and tests automatically on pull requests.
- Blocks: Automated verification gates and continuous deployment to Cloudflare Workers / Pages.

## Test Coverage Gaps

**Frontend User Interaction Flows:**
- What's not tested: Multi-step film upload wizard, licence agreement checkbox validation, and role switching in staff console.
- Files: `apps/studio/src/components/editor/FilmEditorModal.tsx`, `apps/staff/src/components/admin/RoleManager.tsx`
- Risk: UI regressions could allow incomplete form submissions or broken modal states.
- Priority: Medium

---

*Concerns audit: 2026-10-01*
