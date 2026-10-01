# TPF Cinemas

## What This Is

TPF Cinemas is an indie-first, high-performance Over-The-Top (OTT) streaming platform designed to showcase independent Indian cinema to global audiences with lowest possible latency and highest throughput. The platform comprises a viewer streaming site (`apps/viewer`), a filmmaker portal (`apps/studio`), and a curator/admin moderation console (`apps/staff`), powered by a Cloudflare Workers edge API and a Supabase PostgreSQL backend.

## Core Value

Deliver an immersive, lightning-fast streaming and discovery experience for independent films, where viewers can seamlessly explore, preview, and watch films with zero friction.

## Business Context

- **Customer**: Independent film enthusiasts, cinephiles, and independent filmmakers in India and globally.
- **Revenue model**: Ad-supported & filmmaker license revenue share (future rentals/subscriptions).
- **Success metric**: Viewer engagement, homepage watch-start conversion, and streaming retention.
- **Strategy notes**: Free-tier launch with zero video egress cost by leveraging YouTube CDN embeds and Cloudflare edge caching.

## Requirements

### Validated

- ✓ Edge API routing, CORS, and rate limiting with Hono on Cloudflare Workers — existing
- ✓ Three-layer RBAC authentication with Supabase Auth and PostgreSQL RLS (`viewer`, `filmmaker`, `curator`, `admin`) — existing
- ✓ Signed upload URL generation for posters and licence documents — existing
- ✓ State-machine RPC functions (`submit_film`, `review_film`, `publish_film`, `verify_licence`) — existing
- ✓ Webhook processing with constant-time secret validation, edge cache purging, and notification emails — existing
- ✓ Filmmaker Studio portal for draft submissions and licence agreements — existing
- ✓ Staff Console for review queue moderation, mandatory feedback, and audit logging — existing

### Active

- [ ] **Cinematic Hero Billboard**: Dynamic Netflix/Prime-style featured hero with trailer teaser playback, sound mute/unmute toggle, backdrop carousel, metadata badges (4K, Age Rating, Duration, Genres), and prominent Play / Watchlist / Info CTAs.
- [ ] **Interactive Hover Previews**: Netflix-style card expansion on hover displaying video preview teaser, synopsis snippet, genre tags, and quick-action buttons without navigating away.
- [ ] **"Continue Watching" Dynamic Rail**: Persistent rail rendering in-progress titles with accurate visual playback progress bar synced to Supabase `watch_history`.
- [ ] **"Top 10 / Trending" Ranked Rail**: Film cards adorned with numbered visual rank badges (1-10) styled for high cinematic visual polish.
- [ ] **Category & Language Filter Chips**: Sticky quick-filter bar allowing instant multi-tag filtering across formats (Feature Film, Short Film, Documentary) and regional languages (Telugu, Hindi, Tamil, Malayalam, Kannada, etc.).
- [ ] **Responsive & Fluid Micro-Interactions**: Smooth 60fps animations powered by Motion, keyboard navigation, and responsive touch gestures for mobile screens.

### Out of Scope

- Native Mobile & Smart TV Apps — Deferred to Phase 3 roadmap (web portal first).
- Payment Gateway / Paid Subscriptions — Phase 3 monetization milestone; phase 1 focuses on free access and filmmaker onboarding.
- Full Custom DRM & Video Encoding — Phase 2 Mux migration; currently relying on YouTube iframe direct streams.

## Context

- The monorepo is organized with npm workspaces (`apps/viewer`, `apps/studio`, `apps/staff`, `backend`).
- The database schema in `supabase/migrations/20260920000001_init_schema.sql` already includes `watch_history`, `films`, `film_genres`, `genres`, and `licence_agreements`.
- Codebase map is documented in `.planning/codebase/` (`STACK.md`, `ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `TESTING.md`, `INTEGRATIONS.md`, `CONCERNS.md`).

## Constraints

- **Tech stack**: React 18, Vite 6, Tailwind CSS 3, Motion (`motion/react`), Lucide React, Supabase JS SDK.
- **Performance**: Zero video egress load on backend/database; fast initial paint with poster lazy-loading.
- **Aesthetics**: Premium dark cinematic aesthetic (deep blacks, slate/zinc text, amber/gold accents) matching world-class streaming platforms like Netflix and Prime Video.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Netflix/Prime-style Hero | Creates high-engagement cinematic first impression with video teaser | ✓ Good |
| Hover Preview Cards | Allows quick film discovery without opening modals or new pages | ✓ Good |
| Supabase `watch_history` sync | Provides seamless resume playback across sessions and devices | ✓ Good |
| Tag/Filter Chips Bar | Enables instant exploration of regional Indian indie films by language/format | ✓ Good |

---
*Last updated: 2026-10-01 after project initialization*
