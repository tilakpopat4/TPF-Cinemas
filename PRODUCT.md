# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary Viewers:** Independent film lovers and cinema enthusiasts seeking discovery of indie features, debut films, and short cinema worldwide without subscription paywalls or friction. They browse on desktop and mobile web in casual or evening theater settings.
- **Independent Filmmakers:** Creators submitting films, managing metadata, tracking curation approval pipelines, and sharing their work with global audiences via `apps/studio`.
- **Curators & Platform Staff:** Film programming team reviewing submissions, enforcing quality standards, and managing catalog placement via `apps/staff`.

## Product Purpose

TPF Cinemas provides a frictionless, high-speed, cinema-grade streaming and discovery portal for independent films. It bridges the gap between visionary independent filmmakers and global cinema audiences with zero subscription barriers and immediate playback.

## Positioning

A direct-to-consumer free indie cinema spotlight offering Netflix-caliber cinematic immersion, instant streaming without subscription barriers, and authentic community discussions directly celebrating filmmakers.

## Operating Context

- **Viewer Experience (`apps/viewer`):** Full-bleed cinematic hero teasers, Netflix-style hover previews, custom amber-accented theater player, curated discovery rails, watchlist, and audience comments.
- **Filmmaker Studio (`apps/studio`):** Submission wizard with multi-step metadata, credits, legal licenses, and status tracking.
- **Staff Curation (`apps/staff`):** Video review queue, audit logs, and status transitions.
- **Architecture:** Monorepo with Cloudflare Workers backend, Supabase PostgreSQL, and zero-egress direct video streaming (YouTube / CDN).

## Capabilities and Constraints

- **Streaming:** Direct host CDN playback (zero video bytes routed through application servers or database).
- **Video Engine:** Custom-designed player with amber-500 palette, chromeless embed controls, buffer tracking, drag scrubbing, and auto-hiding controls.
- **Authentication:** Supabase Auth for watchlist and audience comments; public browsing and playback require zero sign-in.
- **Visual Identity:** Cinematic dark theater theme (`#08090c` canvas, Amber-500 accents, glassmorphic controls).

## Brand Commitments

- **Name:** TPF Cinemas (`TPF CINEMAS`)
- **Tone & Atmosphere:** Prestigious, cinematic, immersive, and respectful of filmmakers (Netflix / MUBI dark theater atmosphere).
- **Core Accent:** Amber-500 (`#f59e0b`) glowing highlights, rich dark vignettes, clean monospace timekeeping.

## Product Principles

1. **Zero-Friction Discovery:** Immediate playback with no sign-in or paywall barriers standing between viewers and films.
2. **Cinema-Grade Immersion:** High visual polish, full-bleed artwork, dark ambient lighting, and fluid micro-interactions.
3. **Filmmaker-Centric:** Prominent credits, debut showcases, director bios, and authentic audience discussion.
4. **Lightning-Fast Performance:** Instant page loads, responsive hover preview popovers, and low-latency streaming.
