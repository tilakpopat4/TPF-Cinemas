---
phase: TPF-01-cinematic-hero-billboard
plan: 01
subsystem: ui
tags: [react, video, youtube, motion, tailwind, hero]
provides:
  - Ambient muted video teaser loop with sound toggle
  - Ken Burns slow-zoom poster fallback when video is loading or blocked
  - 82vh dual vignette layout (left-to-right fade + bottom-to-top fade to #08090c)
  - Glassmorphic metadata badges (TPF EXCLUSIVE, 4K Ultra HD, Age Rating, Duration, Release Year, clickable Genre pills)
key-files:
  created: []
  modified:
    - apps/viewer/src/components/hero/HeroBillboard.tsx
requirements-completed:
  - HERO-01
  - HERO-03
duration: 15min
completed: 2026-10-01
status: complete
---

# Phase 01: Plan 01 Summary

**Delivered enhanced HeroBillboard with muted background teaser loop, audio mute toggle, Ken Burns fallback, and glassmorphic metadata badges.**

## Accomplishments

1. **Ambient Video Teaser Loop**: Implemented responsive YouTube teaser iframe with muted autoplay and continuous ambient loop.
2. **Audio Mute/Unmute Toggle**: Placed audio toggle button directly alongside primary CTA buttons ("Watch Now", "+ My List") as decided in D-02.
3. **Cinematic Fallback**: Configured high-resolution backdrop image with subtle Ken Burns scale animation (`scale: [1, 1.06]`) if video is loading or blocked.
4. **82vh Dual Vignette Layout**: Sized hero to `h-[82vh]` with left-to-right dark gradient for text legibility and bottom-to-top gradient merging into `#08090c`.
5. **Glassmorphic Metadata Badges**: Rendered 4K Ultra HD badge, color-coded Age Rating badge, Duration with clock icon, Release Year, and interactive Genre pills with hover states.

## Verification

- `npm --prefix apps/viewer run build` compiled with 0 errors.
