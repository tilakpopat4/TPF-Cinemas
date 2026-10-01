# Phase 01: Cinematic Hero Billboard - Context

**Gathered:** 2026-10-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the top-of-homepage cinematic hero billboard for the TPF Cinemas viewer application (`apps/viewer`). It replaces the existing basic hero with a Netflix/Prime-style full-bleed billboard featuring background teaser video playback, audio mute/unmute control, rotating featured titles with cross-fade transitions, rich glassmorphic metadata badges, and direct integration with the watch modal and watchlist state.

</domain>

<decisions>
## Implementation Decisions

### Video Teaser Behavior
- **D-01:** Background video teaser starts autoplaying immediately in muted state with an ambient video loop.
- **D-02:** Audio control (mute/unmute toggle with sound waves indicator) is positioned directly alongside the "Play Now" and "+ My List" CTA button cluster.
- **D-03:** If browser policies or slow networks prevent iframe autoplay, the hero gracefully falls back to a high-resolution poster backdrop with a subtle cinematic Ken Burns zoom animation and a "Play Preview" trigger button.

### Hero Layout & Cinematic Vignette
- **D-04:** Desktop viewport height is sized to approximately 80–85vh, allowing the top edge of the first content rail to peek out above the fold and entice viewers to scroll.
- **D-05:** Visual masking utilizes a dual gradient: a left-to-right dark fade providing strong contrast for text readability, paired with a bottom-to-top gradient merging seamlessly into the `#08090c` background.
- **D-06:** Title presentation features bold cinematic typography, director attribution, release year, and a clamped 2–3 line synopsis.

### Metadata Badges & Pill Styling
- **D-07:** Full metadata badge suite rendered on the hero: "TPF EXCLUSIVE" badge, 4K Ultra HD badge, Age Rating pill (`U`, `UA13+`, `A`), Duration, Release Year, and interactive Genre pills.
- **D-08:** Badges follow a premium glassmorphic visual aesthetic with translucent backgrounds, subtle white borders, backdrop blur, and amber accent highlights.
- **D-09:** Clicking any genre pill on the hero immediately triggers a smooth scroll to the catalog and filters the homepage content by that genre.

### Antigravity's Discretion
- Selection of iframe player parameters for YouTube teaser embeds (`autoplay=1&mute=1&controls=0&loop=1&playsinline=1`).
- Exact cubic-bezier easing curves for title crossfades and Ken Burns zoom effects via `motion/react`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Architecture
- `.planning/PROJECT.md` — Project core value, scope boundaries, and active requirements
- `.planning/REQUIREMENTS.md` — Specific contracts for HERO-01, HERO-02, HERO-03, HERO-04
- `.planning/codebase/ARCHITECTURE.md` — Client component responsibilities and data flow
- `.planning/codebase/CONVENTIONS.md` — Coding style, Tailwind styling tokens, and Motion animation patterns

### Existing Source Code
- `apps/viewer/src/components/hero/HeroBillboard.tsx` — Current hero implementation to be replaced and enhanced
- `apps/viewer/src/components/player/WatchModal.tsx` — Fullscreen watch player modal triggered by "Play Now"
- `apps/viewer/src/hooks/useCatalogue.ts` — Catalog data hook providing featured films and genre associations
- `apps/viewer/src/hooks/useWatchlist.ts` — Watchlist toggle hook for "+ My List" state synchronization

</canonical_refs>

<specifics>
## Specific Ideas & References

- Hero visual reference: Netflix and Amazon Prime Video web interface billboards with prominent play buttons and ambient background teaser loops.
- Dark theme tokens: Background `#08090c`, amber-500 accent (`#f59e0b`), zinc-100 primary text, zinc-400 secondary text.

</specifics>
